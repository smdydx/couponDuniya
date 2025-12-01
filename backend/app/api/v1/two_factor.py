from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from ...database import get_db
from ...models import User
from ...models.user_2fa import User2FA, User2FALog
from ...security import get_current_user
from ...two_factor import (
    generate_totp_secret,
    generate_totp_uri,
    generate_qr_code,
    verify_totp,
    generate_backup_codes,
    hash_backup_codes,
    verify_backup_code,
    remove_used_backup_code
)

router = APIRouter(prefix="/2fa", tags=["Two-Factor Authentication"])


class Enable2FARequest(BaseModel):
    token: str


class Verify2FARequest(BaseModel):
    token: str


class Disable2FARequest(BaseModel):
    password: str
    token: str


@router.post("/setup", response_model=dict)
def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate 2FA secret and QR code for setup"""

    # Check if 2FA is already enabled
    existing = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))
    if existing and existing.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    # Generate secret
    secret = generate_totp_secret()

    # Generate QR code
    uri = generate_totp_uri(secret, current_user.email)
    qr_code = generate_qr_code(uri)

    # Store or update secret (not enabled yet)
    if existing:
        existing.secret = secret
        db.commit()
    else:
        user_2fa = User2FA(
            user_id=current_user.id,
            secret=secret,
            is_enabled=False
        )
        db.add(user_2fa)
        db.commit()

    return {
        "success": True,
        "data": {
            "secret": secret,
            "qr_code": qr_code,
            "manual_entry": secret
        }
    }


@router.post("/enable", response_model=dict)
def enable_2fa(
    payload: Enable2FARequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable 2FA after verifying the token"""

    user_2fa = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))
    if not user_2fa:
        raise HTTPException(status_code=404, detail="2FA not set up. Call /setup first")

    if user_2fa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    # Verify token
    if not verify_totp(user_2fa.secret, payload.token):
        # Log failed attempt
        log_entry = User2FALog(
            user_id=current_user.id,
            action="enable_failed",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(log_entry)
        db.commit()

        raise HTTPException(status_code=400, detail="Invalid token")

    # Generate backup codes
    backup_codes = generate_backup_codes()
    hashed_codes = hash_backup_codes(backup_codes)

    # Enable 2FA
    user_2fa.is_enabled = True
    user_2fa.enabled_at = datetime.utcnow()
    user_2fa.backup_codes = hashed_codes

    # Log successful enable
    log_entry = User2FALog(
        user_id=current_user.id,
        action="enabled",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log_entry)
    db.commit()

    return {
        "success": True,
        "message": "2FA enabled successfully",
        "data": {
            "backup_codes": backup_codes  # Show once, user must save them
        }
    }


@router.post("/verify", response_model=dict)
def verify_2fa(
    payload: Verify2FARequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify a 2FA token during login"""

    user_2fa = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))
    if not user_2fa or not user_2fa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    # Try TOTP first
    if verify_totp(user_2fa.secret, payload.token):
        user_2fa.last_used_at = datetime.utcnow()

        log_entry = User2FALog(
            user_id=current_user.id,
            action="verified",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(log_entry)
        db.commit()

        return {
            "success": True,
            "message": "2FA verified successfully"
        }

    # Try backup code
    if user_2fa.backup_codes and verify_backup_code(user_2fa.backup_codes, payload.token):
        # Remove used backup code
        user_2fa.backup_codes = remove_used_backup_code(user_2fa.backup_codes, payload.token)
        user_2fa.last_used_at = datetime.utcnow()

        log_entry = User2FALog(
            user_id=current_user.id,
            action="verified_backup",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(log_entry)
        db.commit()

        return {
            "success": True,
            "message": "2FA verified with backup code"
        }

    # Log failed verification
    log_entry = User2FALog(
        user_id=current_user.id,
        action="verify_failed",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log_entry)
    db.commit()

    raise HTTPException(status_code=400, detail="Invalid token or backup code")


@router.post("/disable", response_model=dict)
def disable_2fa(
    payload: Disable2FARequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA (requires password and current token)"""
    from ...security import verify_password

    # Verify password
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    user_2fa = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))
    if not user_2fa or not user_2fa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    # Verify token
    if not verify_totp(user_2fa.secret, payload.token):
        raise HTTPException(status_code=400, detail="Invalid token")

    # Disable 2FA
    user_2fa.is_enabled = False
    user_2fa.backup_codes = None

    # Log disable
    log_entry = User2FALog(
        user_id=current_user.id,
        action="disabled",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log_entry)
    db.commit()

    return {
        "success": True,
        "message": "2FA disabled successfully"
    }


@router.get("/status", response_model=dict)
def get_2fa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current 2FA status"""

    user_2fa = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))

    if not user_2fa:
        return {
            "success": True,
            "data": {
                "is_enabled": False,
                "setup_completed": False
            }
        }

    return {
        "success": True,
        "data": {
            "is_enabled": user_2fa.is_enabled,
            "setup_completed": True,
            "enabled_at": user_2fa.enabled_at.isoformat() if user_2fa.enabled_at else None,
            "last_used_at": user_2fa.last_used_at.isoformat() if user_2fa.last_used_at else None
        }
    }


@router.post("/regenerate-backup-codes", response_model=dict)
def regenerate_backup_codes(
    payload: Verify2FARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate backup codes (requires current 2FA token)"""

    user_2fa = db.scalar(select(User2FA).where(User2FA.user_id == current_user.id))
    if not user_2fa or not user_2fa.is_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    # Verify token
    if not verify_totp(user_2fa.secret, payload.token):
        raise HTTPException(status_code=400, detail="Invalid token")

    # Generate new backup codes
    backup_codes = generate_backup_codes()
    hashed_codes = hash_backup_codes(backup_codes)

    user_2fa.backup_codes = hashed_codes
    db.commit()

    return {
        "success": True,
        "message": "Backup codes regenerated",
        "data": {
            "backup_codes": backup_codes
        }
    }
