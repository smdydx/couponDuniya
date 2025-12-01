from fastapi import Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from .config import get_settings
from .database import get_db
from .redis_client import rk, cache_get, rate_limit
from .models import User

settings = get_settings()

def get_current_user(db: Session = Depends(get_db), authorization: str | None = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split()[1]
    # Fast path: check Redis session
    session = cache_get(rk("session", token))
    if session and isinstance(session, dict) and "user" in session:
        # Minimal user object reconstruction (no DB hit). If you need fresh data remove this optimization.
        user_payload = session["user"]
        user = db.query(User).filter(User.id == user_payload["id"]).first()
        if user:
            return user
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return user

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
