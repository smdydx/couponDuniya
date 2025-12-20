from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
import os
import uuid

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_unverified
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.responses import success_response, error_response
from app.twilio_service import send_otp, verify_otp


router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = "app/images/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    full_name: str | None = None
    mobile: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    avatar_url: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class KYCUpdateRequest(BaseModel):
    pan_number: str | None = None
    aadhaar_number: str | None = None
    account_holder_name: str | None = None
    bank_account_number: str | None = None
    ifsc_code: str | None = None
    bank_name: str | None = None
    upi_id: str | None = None


@router.get("/me", response_model=dict)
def get_current_user_profile(current_user: User = Depends(get_current_user_unverified)):
    """Get current user profile - Protected route"""
    name_parts = (current_user.full_name or "").split(' ', 1)
    first_name = name_parts[0] if len(name_parts) > 0 else ''
    last_name = name_parts[1] if len(name_parts) > 1 else ''

    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "uuid": str(current_user.uuid),
            "email": current_user.email,
            "mobile": current_user.mobile,
            "mobile_verified": current_user.mobile_verified_at is not None,
            "full_name": current_user.full_name,
            "first_name": current_user.first_name or first_name,
            "last_name": current_user.last_name or last_name,
            "avatar_url": current_user.avatar_url,
            "date_of_birth": current_user.date_of_birth,
            "gender": current_user.gender,
            "wallet_balance": float(current_user.wallet_balance or 0),
            "pending_cashback": float(current_user.pending_cashback or 0),
            "referral_code": current_user.referral_code,
            "role": current_user.role,
            "is_admin": current_user.is_admin,
            "is_verified": current_user.is_verified,
            "auth_provider": current_user.auth_provider,
            "has_password": current_user.password_hash is not None,
        }
    }


@router.post("/profile/update", response_model=dict)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Update user profile - Protected route"""
    try:
        # Update fields if provided
        if payload.first_name is not None:
            current_user.first_name = payload.first_name

        if payload.last_name is not None:
            current_user.last_name = payload.last_name

        if payload.full_name is not None:
            current_user.full_name = payload.full_name
        elif payload.first_name or payload.last_name:
            # Auto-update full_name from first_name and last_name
            first = payload.first_name or current_user.first_name or ""
            last = payload.last_name or current_user.last_name or ""
            current_user.full_name = f"{first} {last}".strip()

        if payload.mobile is not None:
            # Check if mobile is already taken by another user
            existing = db.query(User).filter(
                User.mobile == payload.mobile,
                User.id != current_user.id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Mobile number already in use"
                )
            current_user.mobile = payload.mobile

        if payload.date_of_birth is not None:
            current_user.date_of_birth = payload.date_of_birth

        if payload.gender is not None:
            current_user.gender = payload.gender

        if payload.avatar_url is not None:
            current_user.avatar_url = payload.avatar_url

        current_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(current_user)

        return {
            "success": True,
            "message": "Profile updated successfully",
            "data": {
                "id": current_user.id,
                "email": current_user.email,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "full_name": current_user.full_name,
                "mobile": current_user.mobile,
                "date_of_birth": current_user.date_of_birth,
                "gender": current_user.gender,
                "avatar_url": current_user.avatar_url,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/change-password", response_model=dict)
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Change user password - Protected route"""
    from app.security import verify_password, get_password_hash

    if not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="Password not set. Please use set-password endpoint."
        )

    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "message": "Password changed successfully"
    }


@router.put("/kyc", response_model=dict)
def update_kyc(
    payload: KYCUpdateRequest,
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Update KYC details - Protected route"""
    from app.models.user_kyc import UserKYC

    try:
        # Find or create KYC record
        kyc = db.query(UserKYC).filter(UserKYC.user_id == current_user.id).first()

        if not kyc:
            kyc = UserKYC(
                user_id=current_user.id,
                pan_number=payload.pan_number,
                aadhaar_number=payload.aadhaar_number,
                account_holder_name=payload.account_holder_name,
                account_number=payload.bank_account_number,
                ifsc_code=payload.ifsc_code,
                bank_name=payload.bank_name,
                upi_id=payload.upi_id,
                status="pending",
                submitted_at=datetime.utcnow()
            )
            db.add(kyc)
        else:
            if payload.pan_number:
                kyc.pan_number = payload.pan_number
            if payload.aadhaar_number:
                kyc.aadhaar_number = payload.aadhaar_number
            if payload.account_holder_name:
                kyc.account_holder_name = payload.account_holder_name
            if payload.bank_account_number:
                kyc.account_number = payload.bank_account_number
            if payload.ifsc_code:
                kyc.ifsc_code = payload.ifsc_code
            if payload.bank_name:
                kyc.bank_name = payload.bank_name
            if payload.upi_id:
                kyc.upi_id = payload.upi_id
            kyc.status = "pending"
            kyc.submitted_at = datetime.utcnow()

        db.commit()
        db.refresh(kyc)

        return {
            "success": True,
            "message": "KYC details submitted for verification",
            "data": {
                "status": kyc.status,
                "pan_number": kyc.pan_number,
                "pan_verified": kyc.pan_verified,
                "aadhaar_number": kyc.aadhaar_number,
                "aadhaar_verified": kyc.aadhaar_verified,
                "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update KYC: {str(e)}"
        )


@router.get("/kyc", response_model=dict)
def get_kyc_status(
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Get KYC status - Protected route"""
    from app.models.user_kyc import UserKYC

    kyc = db.query(UserKYC).filter(UserKYC.user_id == current_user.id).first()

    if not kyc:
        return {
            "success": True,
            "data": {
                "status": "not_submitted",
                "pan_number": None,
                "pan_verified": False,
                "aadhaar_number": None,
                "aadhaar_verified": False,
                "account_holder_name": None,
                "account_number": None,
                "ifsc_code": None,
                "bank_name": None,
                "upi_id": None,
                "submitted_at": None,
                "verified_at": None
            }
        }

    return {
        "success": True,
        "data": {
            "status": kyc.status,
            "pan_number": kyc.pan_number,
            "pan_verified": kyc.pan_verified,
            "aadhaar_number": kyc.aadhaar_number,
            "aadhaar_verified": kyc.aadhaar_verified,
            "account_holder_name": kyc.account_holder_name,
            "account_number": kyc.account_number,
            "ifsc_code": kyc.ifsc_code,
            "bank_name": kyc.bank_name,
            "upi_id": kyc.upi_id,
            "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None,
            "verified_at": kyc.verified_at.isoformat() if kyc.verified_at else None
        }
    }


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Upload user profile picture"""
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Update user avatar URL
    avatar_url = f"/images/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()

    return success_response(
        data={"avatar_url": avatar_url},
        message="Profile picture uploaded successfully"
    )


@router.post("/send-otp")
async def send_mobile_otp(
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Send OTP to user's mobile number for verification"""
    if not current_user.mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number not set. Please update your profile first."
        )

    try:
        send_otp(current_user.mobile)
        return success_response(message="OTP sent successfully to your mobile number.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )


@router.post("/verify-otp")
async def verify_mobile_otp(
    payload: dict,
    current_user: User = Depends(get_current_user_unverified),
    db: Session = Depends(get_db)
):
    """Verify OTP sent to user's mobile number"""
    otp = payload.get("otp")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP is required."
        )

    if not current_user.mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number not set. Please update your profile first."
        )

    try:
        is_valid = verify_otp(current_user.mobile, otp)
        if is_valid:
            current_user.mobile_verified_at = datetime.utcnow()
            current_user.is_verified = True
            current_user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(current_user)
            return success_response(
                data={"mobile_verified": True, "mobile": current_user.mobile},
                message="Mobile number verified successfully."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify OTP: {str(e)}"
        )