from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import re


class RegisterRequest(BaseModel):
    email: EmailStr | None = None
    mobile: str | None = None
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str | None = Field(None, max_length=255)
    referral_code: str | None = Field(None, max_length=20)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith('+'):
            v = '+91' + v
        if not re.match(r'^\+\d{10,15}$', v):
            raise ValueError('Invalid mobile number format')
        return v


class RegisterResponse(BaseModel):
    success: bool = True
    message: str
    data: dict


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or mobile number")
    password: str = Field(..., min_length=1)
    
    @field_validator('identifier')
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError('Email or mobile is required')
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class OTPRequest(BaseModel):
    mobile: str = Field(..., description="Mobile number with country code")
    purpose: str = Field(default="login", description="Purpose: login, registration, verification")
    
    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith('+'):
            v = '+91' + v
        if not re.match(r'^\+\d{10,15}$', v):
            raise ValueError('Invalid mobile number format')
        return v


class OTPVerifyRequest(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=4, max_length=6)
    
    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith('+'):
            v = '+91' + v
        return v
    
    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('OTP must contain only digits')
        return v


class SocialLoginRequest(BaseModel):
    provider: str = Field(..., description="google or facebook")
    token: str = Field(..., description="ID token from provider")
    
    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in ('google', 'facebook'):
            raise ValueError('Provider must be google or facebook')
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class TokenVerificationRequest(BaseModel):
    token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class SetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserResponse(BaseModel):
    id: int
    uuid: str
    email: str | None
    mobile: str | None
    full_name: str
    first_name: str | None
    last_name: str | None
    avatar_url: str | None
    wallet_balance: float
    pending_cashback: float
    referral_code: str
    role: str
    is_admin: bool
    is_verified: bool
    auth_provider: str | None
    has_password: bool
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    success: bool
    message: str
    data: dict
