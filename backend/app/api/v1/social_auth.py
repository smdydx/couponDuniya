from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
import httpx
import json

from ...database import get_db
from ...models import User
from ...models.social_account import SocialAccount
from ...security import create_access_token, hash_password
from ...config import get_settings

router = APIRouter(prefix="/auth/social", tags=["Social Authentication"])
settings = get_settings()


class GoogleLoginRequest(BaseModel):
    token: str  # Google ID token


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
        # Verify token
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

        # Get user info
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
            "email_verified": True  # Facebook emails are verified
        }


@router.post("/google", response_model=dict)
async def login_with_google(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with Google"""

    # Verify token and get user info
    user_info = await verify_google_token(payload.token)

    # Check if social account exists
    social_account = db.scalar(
        select(SocialAccount).where(
            SocialAccount.provider == "google",
            SocialAccount.provider_user_id == user_info["provider_user_id"]
        )
    )

    if social_account:
        # Existing user - login
        user = social_account.user

        # Update social account
        social_account.profile_data = json.dumps(user_info)
        social_account.updated_at = datetime.utcnow()
        db.commit()

    else:
        # Check if user with this email exists
        user = db.scalar(select(User).where(User.email == user_info["email"]))

        if user:
            # Link existing account
            social_account = SocialAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=user_info["provider_user_id"],
                profile_data=json.dumps(user_info)
            )
            db.add(social_account)
        else:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info["name"],
                password_hash=hash_password(""),  # No password for social login
                is_verified=user_info["email_verified"],
                email_verified_at=datetime.utcnow() if user_info["email_verified"] else None
            )
            db.add(user)
            db.flush()

            # Create social account
            social_account = SocialAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=user_info["provider_user_id"],
                profile_data=json.dumps(user_info)
            )
            db.add(social_account)

        db.commit()
        db.refresh(user)

    # Generate access token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "success": True,
        "message": "Logged in successfully with Google",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    }


@router.post("/facebook", response_model=dict)
async def login_with_facebook(
    payload: FacebookLoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register with Facebook"""

    # Verify token and get user info
    user_info = await verify_facebook_token(payload.access_token)

    if not user_info.get("email"):
        raise HTTPException(status_code=400, detail="Email permission required")

    # Check if social account exists
    social_account = db.scalar(
        select(SocialAccount).where(
            SocialAccount.provider == "facebook",
            SocialAccount.provider_user_id == user_info["provider_user_id"]
        )
    )

    if social_account:
        # Existing user - login
        user = social_account.user

        # Update social account
        social_account.access_token = payload.access_token
        social_account.profile_data = json.dumps(user_info)
        social_account.updated_at = datetime.utcnow()
        db.commit()

    else:
        # Check if user with this email exists
        user = db.scalar(select(User).where(User.email == user_info["email"]))

        if user:
            # Link existing account
            social_account = SocialAccount(
                user_id=user.id,
                provider="facebook",
                provider_user_id=user_info["provider_user_id"],
                access_token=payload.access_token,
                profile_data=json.dumps(user_info)
            )
            db.add(social_account)
        else:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info["name"],
                password_hash=hash_password(""),  # No password for social login
                is_verified=user_info["email_verified"],
                email_verified_at=datetime.utcnow() if user_info["email_verified"] else None
            )
            db.add(user)
            db.flush()

            # Create social account
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

    # Generate access token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "success": True,
        "message": "Logged in successfully with Facebook",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    }


@router.get("/accounts", response_model=dict)
def get_linked_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all linked social accounts"""
    from ...security import get_current_user

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


@router.delete("/unlink/{provider}", response_model=dict)
def unlink_social_account(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlink a social account"""
    from ...security import get_current_user

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
