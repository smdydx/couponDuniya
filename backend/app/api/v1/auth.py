from fastapi import APIRouter, HTTPException, status, Header, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import httpx
import json
import time
import uuid
import urllib.parse

from ...security import create_access_token, get_password_hash, verify_password, revoke_token, decode_token
from ...redis_client import rk, cache_set, cache_get, cache_invalidate, rate_limit
from ...queue import push_email_job, push_sms_job
from ...otp import request_otp as create_otp, verify_and_consume_otp
from ...sms import send_otp_sms
from ...database import get_db
from ...models import User
from ...models.social_account import SocialAccount
from ...models.refresh_token import RefreshToken
from ...config import get_settings
from ...dependencies import get_current_user
import hashlib
import secrets

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

REFRESH_TOKEN_EXPIRE_DAYS = 30
ACCESS_TOKEN_EXPIRE_SECONDS = 86400


def _hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_refresh_token_for_user(
    db: Session,
    user_id: int,
    ip_address: str | None = None,
    user_agent: str | None = None,
    device_info: str | None = None,
    token_family: str | None = None
) -> str:
    """Create a new refresh token and store it in the database"""
    from datetime import timedelta

    raw_token = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw_token)

    if not token_family:
        token_family = str(uuid.uuid4())

    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        token_family=token_family,
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=device_info,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    db.add(refresh_token)
    db.commit()

    return raw_token


def validate_and_rotate_refresh_token(
    db: Session,
    raw_token: str,
    ip_address: str | None = None,
    user_agent: str | None = None
) -> tuple[User | None, str | None, str | None]:
    """
    Validate a refresh token, revoke it, and return a new one (rotation).
    Returns (user, new_refresh_token, error_message)
    """
    from datetime import timedelta

    token_hash = _hash_token(raw_token)

    stored_token = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )

    if not stored_token:
        return None, None, "Invalid refresh token"

    if stored_token.is_revoked:
        db.query(RefreshToken).filter(
            RefreshToken.token_family == stored_token.token_family
        ).update({"is_revoked": True, "revoked_at": datetime.utcnow(), "revoked_reason": "family_revoked"})
        db.commit()
        return None, None, "Token was already used (possible theft detected)"

    if stored_token.is_expired():
        return None, None, "Refresh token has expired"

    stored_token.revoke(reason="rotated")
    stored_token.last_used_at = datetime.utcnow()

    user = db.query(User).filter(User.id == stored_token.user_id).first()
    if not user or not user.is_active:
        return None, None, "User not found or inactive"

    new_token = create_refresh_token_for_user(
        db=db,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        token_family=stored_token.token_family
    )

    return user, new_token, None


def revoke_user_refresh_tokens(db: Session, user_id: int, reason: str = "logout"):
    """Revoke all refresh tokens for a user"""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).update({
        "is_revoked": True,
        "revoked_at": datetime.utcnow(),
        "revoked_reason": reason
    })
    db.commit()


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
    from ...verification import generate_verification_token
    from ...email import email_service
    from ...models.referral import Referral

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
        raise HTTPException(status_code=400, detail="User already exists with this email or mobile")

    # Create new user
    user = User(
        email=payload.email,
        mobile=payload.mobile,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name or "User",
        is_active=True,
        is_verified=False,
        role="customer",
        auth_provider="email",
    )

    db.add(user)
    db.flush()

    # Handle referral with improved tracking
    referrer = None
    if payload.referral_code:
        referrer = db.query(User).filter(User.referral_code == payload.referral_code).first()
        if referrer and referrer.id != user.id:
            user.referred_by_id = referrer.id

            referral_bonus = getattr(settings, 'REFERRAL_BONUS_AMOUNT', 50.0)

            referral = Referral(
                referrer_id=referrer.id,
                referred_id=user.id,
                referral_code_used=payload.referral_code,
                status="pending",
                bonus_amount=referral_bonus,
            )
            db.add(referral)

    db.commit()
    db.refresh(user)

    # Send verification email
    verification_token = None
    if user.email:
        verification_token = generate_verification_token(user.email)
        frontend_url = settings.FRONTEND_URL or settings.FRONTEND_BASE_URL or "http://localhost:5000"
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"

        email_service.send_welcome_email(user.email, verification_url)

    return RegisterResponse(
        message="Registration successful! Please check your email to verify your account before logging in.",
        data={
            "user_id": user.id,
            "uuid": str(user.uuid),
            "email": user.email,
            "mobile": user.mobile,
            "referral_code": user.referral_code,
            "requires_verification": True,
            "dev_verification_token": verification_token if settings.DEBUG else None,
        },
    )


@router.post("/login", response_model=dict)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login with email/mobile and password. Email must be verified first."""
    from datetime import datetime

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
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")

    # Verify password
    if not user.password_hash:
        raise HTTPException(status_code=401, detail="Password not set. Please use OTP or social login.")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been disabled. Please contact support.")

    # Check email verification for email-based login - MUST verify before login
    if user.email and user.email == payload.identifier and not user.is_verified:
        # Generate new verification token if needed
        from ...verification import generate_verification_token
        from ...email import email_service

        token = generate_verification_token(user.email)
        frontend_url = settings.FRONTEND_URL or settings.FRONTEND_BASE_URL or "http://localhost:5000"
        verification_url = f"{frontend_url}/verify-email?token={token}&email={user.email}"

        # Try to send email again
        if settings.EMAIL_ENABLED:
            email_service.send_welcome_email(user.email, verification_url)

        raise HTTPException(
            status_code=403,
            detail=f"Please verify your email before logging in. We've sent a new verification link to {user.email}. Check your inbox."
        )

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Create access token and proper refresh token
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token_for_user(db=db, user_id=user.id)
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
        "role": user.role,
        "is_admin": user.is_admin,
        "is_verified": user.is_verified,
    }

    session_payload = {"user": user_data, "login_at": int(time.time())}
    cache_set(session_key, session_payload, ACCESS_TOKEN_EXPIRE_SECONDS)

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
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
            role="customer", # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token and proper refresh token
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token_for_user(db=db, user_id=user.id)
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
        "role": user.role,
        "is_admin": user.is_admin,
        "is_verified": user.is_verified,
    }

    session_payload = {"user": user_data, "login_at": int(time.time())}
    cache_set(session_key, session_payload, ACCESS_TOKEN_EXPIRE_SECONDS)

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
            "user": user_data,
        },
    }


@router.post("/refresh-token", response_model=dict)
def refresh_token_endpoint(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token with rotation"""
    user, new_refresh_token, error = validate_and_rotate_refresh_token(
        db=db,
        raw_token=payload.refresh_token
    )

    if error:
        raise HTTPException(status_code=401, detail=error)

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
        "role": user.role,
        "is_admin": user.is_admin,
        "is_verified": user.is_verified,
    }

    session_payload = {"user": user_data, "login_at": int(time.time())}
    cache_set(session_key, session_payload, ACCESS_TOKEN_EXPIRE_SECONDS)

    return {
        "success": True,
        "message": "Token refreshed successfully",
        "data": {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
            "user": user_data,
        }
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(authorization: str | None = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split()[1]

    # Invalidate session cache
    cache_invalidate(rk("session", token))

    # Revoke access token
    revoke_token(token)

    # Revoke all refresh tokens for this user
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id:
            revoke_user_refresh_tokens(db, int(user_id), reason="logout")
    except Exception:
        pass

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
    from datetime import datetime

    # Verify token
    is_valid, email = verify_email_token(request.token)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token. Please request a new verification email."
        )

    # Update user's verification status
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    user.email_verified_at = datetime.utcnow()
    db.commit()

    # Cache verification status for sync
    cache_set(rk("email_verified", email), {"verified": True, "email": email}, ttl=300)

    return {
        "message": "Email verified successfully. You can now log in.",
        "is_verified": True,
        "email": user.email
    }


class EmailVerificationStatusRequest(BaseModel):
    email: EmailStr


@router.post("/verification-status", response_model=dict)
def check_verification_status(
    request: EmailVerificationStatusRequest,
    db: Session = Depends(get_db)
):
    """Check if an email has been verified (for cross-tab sync)"""
    from sqlalchemy import select

    # Check cache first for faster response
    cached = cache_get(rk("email_verified", request.email))
    if cached and cached.get("verified"):
        return {
            "success": True,
            "data": {
                "email": request.email,
                "is_verified": True,
                "source": "cache"
            }
        }

    # Check database
    user = db.scalar(select(User).where(User.email == request.email))
    if not user:
        return {
            "success": True,
            "data": {
                "email": request.email,
                "is_verified": False,
                "exists": False
            }
        }

    return {
        "success": True,
        "data": {
            "email": request.email,
            "is_verified": user.is_verified,
            "exists": True
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

    # Split full_name into first_name and last_name
    name_parts = user.full_name.split(' ', 1) if user.full_name else ['', '']
    first_name = name_parts[0] if len(name_parts) > 0 else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    return {
        "success": True,
        "data": {
            "id": user.id,
            "email": user.email,
            "mobile": user.mobile,
            "full_name": user.full_name,
            "first_name": first_name,
            "last_name": last_name,
            "role": user.role,
            "is_admin": user.is_admin,
            "is_verified": user.is_verified,
            "auth_provider": user.auth_provider,
            "password_hash": user.password_hash is not None,
        }
    }


class SetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8)

@router.post("/set-password", response_model=dict)
def set_password(
    payload: SetPasswordRequest,
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
):
    """Set password for users who signed up with Google"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.split()[1]
    decoded = decode_token(token)
    user_id = decoded.get("sub")

    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user already has a password
    if user.password_hash:
        raise HTTPException(status_code=400, detail="Password already set. Use change-password endpoint.")

    # Set the password
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {
        "success": True,
        "message": "Password set successfully! You can now login with email and password.",
        "data": {
            "has_password": True
        }
    }


# ---------------------- Social Authentication ----------------------

class GoogleLoginRequest(BaseModel):
    token: str


class FacebookLoginRequest(BaseModel):
    access_token: str


class SocialLinkRequest(BaseModel):
    provider: str
    token: str


async def verify_google_token(token: str) -> dict:
    """Verify Google ID token and return user info"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        )

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google token")

        data = response.json()

        return {
            "provider_user_id": data.get("sub"),
            "email": data.get("email"),
            "name": data.get("name"),
            "picture": data.get("picture"),
            "email_verified": data.get("email_verified", False)
        }


async def verify_facebook_token(access_token: str) -> dict:
    """Verify Facebook access token and return user info"""
    async with httpx.AsyncClient() as client:
        app_token = f"{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}"
        verify_response = await client.get(
            f"https://graph.facebook.com/debug_token",
            params={
                "input_token": access_token,
                "access_token": app_token
            }
        )

        if verify_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Facebook token")

        verify_data = verify_response.json()
        if not verify_data.get("data", {}).get("is_valid"):
            raise HTTPException(status_code=400, detail="Invalid Facebook token")

        user_response = await client.get(
            "https://graph.facebook.com/me",
            params={
                "fields": "id,name,email,picture",
                "access_token": access_token
            }
        )

        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Facebook user info")

        data = user_response.json()

        return {
            "provider_user_id": data.get("id"),
            "email": data.get("email"),
            "name": data.get("name"),
            "picture": data.get("picture", {}).get("data", {}).get("url"),
            "email_verified": True
        }


@router.post("/social/google", response_model=dict)
async def login_with_google(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with Google - Auto-registers new users"""
    user_info = await verify_google_token(payload.token)

    user = db.scalar(select(User).where(User.email == user_info["email"]))

    if not user:
        email_verified = user_info.get("email_verified", False)
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == 'true'

        full_name = user_info.get("name", "")
        name_parts = full_name.split(' ', 1) if full_name else ['', '']
        first_name = name_parts[0] if len(name_parts) > 0 else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User(
            email=user_info["email"],
            full_name=full_name or f"{first_name} {last_name}".strip(),
            password_hash=None,
            is_verified=bool(email_verified),
            email_verified_at=datetime.utcnow() if email_verified else None,
            role="customer",
            is_admin=False,
            auth_provider="google",
            avatar_url=user_info.get("picture"),
        )
        db.add(user)
        db.flush()

    social_account = db.scalar(
        select(SocialAccount).where(
            SocialAccount.provider == "google",
            SocialAccount.provider_user_id == user_info["provider_user_id"]
        )
    )

    if social_account:
        social_account.profile_data = json.dumps(user_info)
        social_account.updated_at = datetime.utcnow()

        if user_info.get("picture") and user.avatar_url != user_info.get("picture"):
            user.avatar_url = user_info.get("picture")

        db.commit()
    else:
        social_account = SocialAccount(
            user_id=user.id,
            provider="google",
            provider_user_id=user_info["provider_user_id"],
            profile_data=json.dumps(user_info)
        )
        db.add(social_account)
        db.commit()

    db.refresh(user)

    access_token = create_access_token(str(user.id))

    name_parts = (user.full_name or "").split(' ', 1)
    first_name = name_parts[0] if len(name_parts) > 0 else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    return {
        "success": True,
        "message": "Logged in successfully with Google",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "uuid": str(user.uuid),
                "email": user.email,
                "mobile": user.mobile,
                "full_name": user.full_name,
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": user.avatar_url,
                "wallet_balance": float(user.wallet_balance or 0),
                "pending_cashback": float(user.pending_cashback or 0),
                "referral_code": user.referral_code,
                "role": user.role,
                "is_admin": user.is_admin,
                "is_verified": user.is_verified,
                "auth_provider": user.auth_provider,
                "password_hash": user.password_hash is not None
            }
        }
    }


@router.post("/social/facebook", response_model=dict)
async def login_with_facebook(
    payload: FacebookLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with Facebook"""
    user_info = await verify_facebook_token(payload.access_token)

    if not user_info.get("email"):
        raise HTTPException(status_code=400, detail="Email permission required")

    social_account = db.scalar(
        select(SocialAccount).where(
            SocialAccount.provider == "facebook",
            SocialAccount.provider_user_id == user_info["provider_user_id"]
        )
    )

    if social_account:
        user = social_account.user
        social_account.access_token = payload.access_token
        social_account.profile_data = json.dumps(user_info)
        social_account.updated_at = datetime.utcnow()
        db.commit()

    else:
        user = db.scalar(select(User).where(User.email == user_info["email"]))

        if user:
            social_account = SocialAccount(
                user_id=user.id,
                provider="facebook",
                provider_user_id=user_info["provider_user_id"],
                access_token=payload.access_token,
                profile_data=json.dumps(user_info)
            )
            db.add(social_account)
        else:
            user = User(
                email=user_info["email"],
                full_name=user_info["name"],
                password_hash=None,
                is_verified=user_info["email_verified"],
                email_verified_at=datetime.utcnow() if user_info["email_verified"] else None,
                auth_provider="facebook",
                role="customer",
            )
            db.add(user)
            db.flush()

            social_account = SocialAccount(
                user_id=user.id,
                provider="facebook",
                provider_user_id=user_info["provider_user_id"],
                access_token=payload.access_token,
                profile_data=json.dumps(user_info)
            )
            db.add(social_account)

        db.commit()
        db.refresh(user)

    access_token = create_access_token(str(user.id))

    return {
        "success": True,
        "message": "Logged in successfully with Facebook",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_admin": user.is_admin,
                "role": user.role
            }
        }
    }


@router.get("/social/accounts", response_model=dict)
def get_linked_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all linked social accounts"""
    accounts = db.scalars(
        select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    ).all()

    return {
        "success": True,
        "data": {
            "accounts": [
                {
                    "provider": acc.provider,
                    "provider_user_id": acc.provider_user_id,
                    "created_at": acc.created_at.isoformat(),
                    "updated_at": acc.updated_at.isoformat()
                }
                for acc in accounts
            ]
        }
    }


@router.delete("/social/unlink/{provider}", response_model=dict)
def unlink_social_account(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlink a social account"""
    account = db.scalar(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.provider == provider
        )
    )

    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    db.delete(account)
    db.commit()

    return {
        "success": True,
        "message": f"{provider.capitalize()} account unlinked successfully"
    }


@router.get("/social/google/login")
async def google_login_redirect():
    """Redirect to Google OAuth consent screen"""
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    url = f"{google_auth_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/social/google/callback")
async def google_callback(
    code: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    if error:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
        return RedirectResponse(url=f"{frontend_url}/login?error={error}")

    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")

    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )

            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")

            tokens = token_response.json()
            id_token = tokens.get("id_token")

            if not id_token:
                raise HTTPException(status_code=400, detail="No ID token in response")

            user_info = await verify_google_token(id_token)

            user = db.scalar(select(User).where(User.email == user_info["email"]))

            if not user:
                email_verified = user_info.get("email_verified", False)
                if isinstance(email_verified, str):
                    email_verified = email_verified.lower() == 'true'

                user = User(
                    email=user_info["email"],
                    full_name=user_info.get("name", ""),
                    password_hash=None,
                    is_verified=bool(email_verified),
                    email_verified_at=datetime.utcnow() if email_verified else None,
                    role="customer",
                    is_admin=False,
                    auth_provider="google",
                    avatar_url=user_info.get("picture"),
                )
                db.add(user)
                db.flush()

            social_account = db.scalar(
                select(SocialAccount).where(
                    SocialAccount.provider == "google",
                    SocialAccount.provider_user_id == user_info["provider_user_id"]
                )
            )

            if social_account:
                social_account.profile_data = json.dumps(user_info)
                social_account.updated_at = datetime.utcnow()
                db.commit()
            else:
                social_account = SocialAccount(
                    user_id=user.id,
                    provider="google",
                    provider_user_id=user_info["provider_user_id"],
                    profile_data=json.dumps(user_info)
                )
                db.add(social_account)
                db.commit()

            db.refresh(user)
            access_token = create_access_token(str(user.id))

            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            return RedirectResponse(
                url=f"{frontend_url}/google/callback#id_token={access_token}"
            )

    except HTTPException:
        raise
    except Exception as e:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
        return RedirectResponse(url=f"{frontend_url}/login?error=auth_failed")