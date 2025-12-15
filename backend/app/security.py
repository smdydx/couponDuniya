from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
from uuid import uuid4
from fastapi import HTTPException
from .config import get_settings
from .redis_client import redis_client, rk

pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated=["pbkdf2_sha256"])
settings = get_settings()

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def verify_and_update_password(plain_password: str, hashed_password: str) -> tuple[bool, str | None]:
    """Verify password and return new hash if rehash is needed (for legacy PBKDF2 passwords).
    Returns (is_valid, new_hash_or_none)
    """
    try:
        is_valid, new_hash = pwd_context.verify_and_update(plain_password, hashed_password)
        return is_valid, new_hash
    except Exception:
        return False, None

def create_access_token(subject: str) -> str:
    """Create a JWT access token with a unique jti claim."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = uuid4().hex
    to_encode = {"sub": subject, "exp": expire, "jti": jti}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode a JWT token and return its payload or raise HTTPException."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    # Blacklist check
    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(status_code=401, detail="Token revoked")
    return payload

def revoke_token(token: str) -> None:
    """Add token jti to blacklist set if present."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return
    jti = payload.get("jti")
    if not jti:
        return
    redis_client.sadd(rk("jwt","blacklist"), jti)
    # Optionally reduce remaining TTL on session key handled elsewhere

def is_token_revoked(jti: str) -> bool:
    return redis_client.sismember(rk("jwt","blacklist"), jti) == 1

def get_default_password_hash() -> str:
    return get_password_hash(settings.DEFAULT_PASSWORD)
