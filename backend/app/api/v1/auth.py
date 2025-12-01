from fastapi import APIRouter, HTTPException, status, Header, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from ...security import create_access_token, get_password_hash, verify_password, revoke_token, decode_token
from ...redis_client import rk, cache_set, cache_get, cache_invalidate, rate_limit
from ...queue import push_email_job, push_sms_job
from ...otp import request_otp as create_otp, verify_and_consume_otp
from ...sms import send_otp_sms
from ...database import get_db
from ...models import User
from ...config import get_settings
import json, time, uuid

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


class RegisterRequest(BaseModel):
    email: EmailStr | None = None
    mobile: str | None = None
    password: str
    full_name: str | None = None
    referral_code: str | None = None


class RegisterResponse(BaseModel):
    success: bool = True
    message: str
    data: dict


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or mobile")
    password: str


class TokenBundle(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: dict


class OTPRequest(BaseModel):
    mobile: str
    purpose: str | None = "login"


class VerifyOTPRequest(BaseModel):
    mobile: str
    otp: str
    otp_id: str | None = None


class SocialLoginRequest(BaseModel):
    provider: str
    access_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user with email/mobile and password."""
    # Validate that at least email or mobile is provided
    if not payload.email and not payload.mobile:
        raise HTTPException(status_code=400, detail="Email or mobile is required")
    
    # Check if user exists
    existing_user = None
    if payload.email:
        existing_user = db.query(User).filter(User.email == payload.email).first()
    if not existing_user and payload.mobile:
        existing_user = db.query(User).filter(User.mobile == payload.mobile).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user = User(
        email=payload.email,
        mobile=payload.mobile,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name or "User",
        referral_code=f"USER{str(uuid.uuid4())[:8].upper()}",
        is_active=True,
        is_verified=False,  # Needs email/mobile verification
    )
    
    # Handle referral
    if payload.referral_code:
        referrer = db.query(User).filter(User.referral_code == payload.referral_code).first()
        if referrer:
            # TODO: Create referral record
            pass
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Queue welcome email
    if settings.EMAIL_ENABLED and user.email:
        push_email_job(
            "welcome",
            user.email,
            {
                "user_name": user.full_name or user.email.split('@')[0],
                "referral_code": user.referral_code,
                "app_url": "https://app.example.com"  # TODO: Get from settings
            }
        )
    
    return RegisterResponse(
        message="User registered successfully. Please verify your email/mobile.",
        data={
            "user_id": user.id,
            "uuid": str(user.uuid),
            "email": user.email,
            "mobile": user.mobile,
            "referral_code": user.referral_code,
        },
    )


@router.post("/login", response_model=dict)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with email/mobile and password."""
    if not payload.identifier or not payload.password:
        raise HTTPException(status_code=400, detail="Missing credentials")
    
    allowed, remaining, ttl = rate_limit(f"login:{payload.identifier}", 5, 300)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Try again in {ttl}s")
    
    # Find user by email or mobile
    user = db.query(User).filter(
        (User.email == payload.identifier) | (User.mobile == payload.identifier)
    ).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not user.password_hash:
        raise HTTPException(status_code=401, detail="Password not set. Please use OTP login.")
    
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Create session
    access_token = create_access_token(str(user.id))
    session_key = rk("session", access_token)
    
    user_data = {
        "id": user.id,
        "uuid": str(user.uuid),
        "email": user.email,
        "mobile": user.mobile,
        "full_name": user.full_name,
        "wallet_balance": float(user.wallet_balance or 0),
        "pending_cashback": float(user.pending_cashback or 0),
        "referral_code": user.referral_code,
    }
    
    session_payload = {"user": user_data, "login_at": int(time.time())}
    cache_set(session_key, session_payload, 86400)  # 24h
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "refresh_token": f"refresh_{uuid.uuid4()}",
            "token_type": "bearer",
            "expires_in": 86400,
            "user": user_data,
        }
    }


@router.post("/request-otp", response_model=dict)
def request_otp_endpoint(payload: OTPRequest, db: Session = Depends(get_db)):
    """Request OTP for mobile login/registration."""
    # Validate mobile format
    mobile = payload.mobile.strip()
    if not mobile.startswith("+"):
        mobile = "+91" + mobile  # Default to India
    
    allowed, remaining, ttl = rate_limit(f"otp:{mobile}", 5, 300)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"OTP limit reached. Try again in {ttl}s")
    
    # Generate OTP
    otp_code, message = create_otp(mobile)
    
    if not otp_code:
        raise HTTPException(status_code=429, detail=message)
    
    # Send SMS
    sms_success, sms_message = send_otp_sms(mobile, otp_code)
    
    if not sms_success:
        # Still return success in dev mode
        pass
    
    return {
        "success": True,
        "message": sms_message if not sms_success else message,
        "data": {
            "otp_id": str(uuid.uuid4()),
            "expires_in": 300,
            "dev_otp": otp_code if settings.DEBUG else None,
        },
    }


@router.post("/verify-otp", response_model=dict)
def verify_otp_endpoint(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and login/register user."""
    mobile = payload.mobile.strip()
    if not mobile.startswith("+"):
        mobile = "+91" + mobile
    
    # Verify OTP
    is_valid, message = verify_and_consume_otp(mobile, payload.otp)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Find or create user
    user = db.query(User).filter(User.mobile == mobile).first()
    
    if not user:
        # Auto-register new user
        user = User(
            mobile=mobile,
            full_name=f"User {mobile[-4:]}",
            is_active=True,
            is_verified=True,  # Mobile verified via OTP
            referral_code=f"USER{str(uuid.uuid4())[:8].upper()}",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create session
    access_token = create_access_token(str(user.id))
    session_key = rk("session", access_token)
    
    user_data = {
        "id": user.id,
        "uuid": str(user.uuid),
        "email": user.email,
        "mobile": user.mobile,
        "full_name": user.full_name,
        "wallet_balance": float(user.wallet_balance or 0),
        "pending_cashback": float(user.pending_cashback or 0),
        "referral_code": user.referral_code,
    }
    
    session_payload = {"user": user_data, "login_at": int(time.time())}
    cache_set(session_key, session_payload, 86400)  # 24h
    
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "refresh_token": f"refresh_{uuid.uuid4()}",
            "token_type": "bearer",
            "expires_in": 86400,
            "user": user_data,
        },
    }

# Compatibility endpoints to match test expectations (/otp/request, /otp/verify)
class SimpleOTPRequest(BaseModel):
    mobile: str

@router.post("/otp/request", response_model=dict)
def otp_request_compat(payload: SimpleOTPRequest, db: Session = Depends(get_db)):
    # Reuse request_otp_endpoint logic with default purpose
    req = OTPRequest(mobile=payload.mobile, purpose="login")
    return request_otp_endpoint(req, db)

class SimpleVerifyOTPRequest(BaseModel):
    mobile: str
    otp: str

@router.post("/otp/verify", response_model=dict)
def otp_verify_compat(payload: SimpleVerifyOTPRequest, db: Session = Depends(get_db)):
    req = VerifyOTPRequest(mobile=payload.mobile, otp=payload.otp, otp_id=None)
    return verify_otp_endpoint(req, db)


@router.post("/social-login", response_model=dict)
def social_login(payload: SocialLoginRequest):
    if payload.provider not in {"google", "facebook"}:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    return {
        "success": True,
        "data": {
            "access_token": create_access_token("social_user"),
            "refresh_token": "refresh_mock_token",
            "expires_in": 3600,
            "user": {
                "id": 999,
                "email": "social@example.com",
                "full_name": "Social User",
                "wallet_balance": 0.0,
                "pending_cashback": 0.0,
            },
        },
    }


@router.post("/refresh-token", response_model=dict)
def refresh_token(payload: RefreshRequest):
    return {"success": True, "data": {"access_token": create_access_token("123"), "expires_in": 3600}}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split()[1]
    cache_invalidate(rk("session", token))
    # Add to blacklist so it can't be reused until expiry
    revoke_token(token)
    return


class EmailVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/send-verification-email", response_model=dict)
def send_verification_email(
    request: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Send email verification link"""
    from ...verification import generate_verification_token, resend_verification_throttle
    from ...email import send_welcome_email
    from ...config import get_settings
    
    settings = get_settings()
    email = request.email
    
    # Check throttle
    can_send, wait_time = resend_verification_throttle(email)
    if not can_send:
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait_time} seconds before resending"
        )
    
    # Generate token
    token = generate_verification_token(email)
    
    # Create verification link
    verification_url = f"http://localhost:3000/auth/verify-email?token={token}"
    
    # Send email
    if settings.EMAIL_ENABLED:
        send_welcome_email(email, verification_url)
    else:
        # Dev mode: log the link
        print(f"[DEV] Verification link for {email}: {verification_url}")
    
    return {
        "success": True,
        "message": "Verification email sent successfully",
        "data": {
            "email": email,
            "dev_token": token if settings.DEBUG else None
        }
    }


class TokenVerificationRequest(BaseModel):
    token: str


@router.post("/verify-email", response_model=dict)
def verify_email(
    request: TokenVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify email using token"""
    from ...verification import verify_email_token
    from sqlalchemy import select
    
    # Verify token
    is_valid, email = verify_email_token(request.token)
    
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token"
        )
    
    # Update user's verification status
    user = db.scalar(select(User).where(User.email == email))
    if user:
        user.is_verified = True
        db.commit()
    
    return {
        "success": True,
        "message": "Email verified successfully",
        "data": {
            "email": email,
            "is_verified": True
        }
    }

# ---------------------- Password Reset Flow ----------------------

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

RESET_TTL_SECONDS = 1800  # 30 minutes

@router.post("/password-reset/request", response_model=dict)
def password_reset_request(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Do not reveal existence
        return {"success": True, "message": "If the email exists a reset link was sent."}
    token = uuid.uuid4().hex
    cache_set(rk("pwdreset", token), {"user_id": user.id}, RESET_TTL_SECONDS)
    reset_url = f"{settings.FRONTEND_BASE_URL or 'https://app.example.com'}/reset-password?token={token}"
    if settings.EMAIL_ENABLED:
        push_email_job("password_reset", user.email, {"user_name": user.full_name or user.email, "reset_url": reset_url})
    return {"success": True, "message": "If the email exists a reset link was sent."}

@router.post("/password-reset/confirm", response_model=dict)
def password_reset_confirm(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    data = cache_get(rk("pwdreset", payload.token))
    if not data:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == data.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token context")
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    cache_invalidate(rk("pwdreset", payload.token))
    # Invalidate existing sessions: naive approach scan session key of current access if provided
    return {"success": True, "message": "Password updated successfully"}

# ---------------------- Token Introspection ----------------------

@router.get("/me", response_model=dict)
def me(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split()[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": {"id": user.id, "email": user.email, "full_name": user.full_name}}
