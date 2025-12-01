"""Email verification token generation and validation"""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from .redis_client import redis_client, rk


def generate_verification_token(email: str) -> str:
    """Generate a unique verification token for email"""
    token = secrets.token_urlsafe(32)
    # Store token with 24 hour expiry
    key = rk("email_verification", token)
    redis_client.setex(key, 86400, email)  # 24 hours
    return token


def verify_email_token(token: str) -> Tuple[bool, Optional[str]]:
    """
    Verify email token and return (is_valid, email)
    Consumes the token after successful verification
    """
    key = rk("email_verification", token)
    email = redis_client.get(key)
    
    if not email:
        return False, None
    
    # Delete token after successful verification (one-time use)
    redis_client.delete(key)
    return True, email


def is_email_verification_pending(email: str) -> bool:
    """Check if there's a pending verification for this email"""
    # Search for any tokens for this email
    pattern = rk("email_verification", "*")
    for key in redis_client.scan_iter(match=pattern, count=100):
        stored_email = redis_client.get(key)
        if stored_email == email:
            return True
    return False


def resend_verification_throttle(email: str) -> Tuple[bool, int]:
    """
    Check if user can resend verification email
    Returns (can_resend, seconds_until_next)
    Throttle: Max 1 resend per 60 seconds
    """
    throttle_key = rk("email_verify_throttle", email)
    ttl = redis_client.ttl(throttle_key)
    
    if ttl > 0:
        return False, ttl
    
    # Set throttle for 60 seconds
    redis_client.setex(throttle_key, 60, "1")
    return True, 0
