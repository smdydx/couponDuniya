from fastapi import Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from jose import jwt, JWTError
from .config import get_settings
from .database import get_db
from .redis_client import rk, cache_get, rate_limit
from .models import User
import os

settings = get_settings()

# Placeholder for oauth2_scheme as it's not provided in the original code.
# In a real scenario, this would be imported or defined elsewhere.
oauth2_scheme = None

def get_current_user(db: Session = Depends(get_db), authorization: str | None = Header(None)):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)):
    """Verify user has admin role"""
    if current_user.role != "admin" and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Alias for backward compatibility
require_admin = get_current_admin_user

def verify_admin_ip(request: Request):
    """Verify admin IP - disabled in development"""
    # Skip IP check in development
    if os.getenv("ENVIRONMENT", "development") == "development":
        return True

    whitelist = getattr(settings, "ADMIN_IP_WHITELIST", "") or ""
    if not whitelist:
        return True

    allowed = {ip.strip() for ip in whitelist.split(',') if ip.strip()}
    allowed.update({"127.0.0.1", "::1", "0.0.0.0"})

    client_ip = request.client.host if request.client else None
    if client_ip not in allowed:
        raise HTTPException(status_code=403, detail="Admin access forbidden from this IP")
    return True

def require_internal_service(x_internal_key: str | None = Header(None)):
    """Guard endpoints meant for service-to-service calls."""
    if not settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=500, detail="Internal API key not configured")
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Internal access only")
    return True

def rate_limit_dependency(scope: str, limit: int, window_seconds: int):
    """Factory to create a per-endpoint rate limiter dependency."""
    def _rl(request: Request):
        identifier = f"{scope}:{request.client.host}"
        allowed, remaining, ttl = rate_limit(identifier, limit, window_seconds)
        if not allowed:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        # Optional: could add headers here if needed
        return {"remaining": remaining, "ttl": ttl}
    return _rl