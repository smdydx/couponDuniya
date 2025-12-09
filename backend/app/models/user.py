from sqlalchemy import String, Boolean, DateTime, Numeric, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base
import enum


def generate_referral_code():
    return f"REF{str(uuid4())[:8].upper()}"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    DELETED = "deleted"


class AuthProvider(str, enum.Enum):
    EMAIL = "email"
    MOBILE = "mobile"
    GOOGLE = "google"
    FACEBOOK = "facebook"


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    SUPPORT = "support"


class User(Base):
    __tablename__ = "users"
    
    __table_args__ = (
        Index('idx_users_email_lower', 'email'),
        Index('idx_users_mobile', 'mobile'),
        Index('idx_users_status', 'status'),
        Index('idx_users_role', 'role'),
        Index('idx_users_created_at', 'created_at'),
        Index('idx_users_referral_code', 'referral_code'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    email_normalized: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    mobile_country_code: Mapped[str | None] = mapped_column(String(5), nullable=True, default="+91")
    
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    full_name: Mapped[str] = mapped_column(String(255), default="")
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    date_of_birth: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    referral_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, default=generate_referral_code)
    referred_by_id: Mapped[int | None] = mapped_column(nullable=True, index=True)
    
    wallet_balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    pending_cashback: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total_earnings: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    status: Mapped[str] = mapped_column(String(30), default=UserStatus.PENDING_VERIFICATION.value)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.CUSTOMER.value)
    
    auth_provider: Mapped[str | None] = mapped_column(String(50), default=AuthProvider.EMAIL.value)
    
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mobile_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    orders = relationship("Order", back_populates="user")
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    referrals_made = relationship("Referral", foreign_keys="[Referral.referrer_id]", back_populates="referrer")
    referrals_received = relationship("Referral", foreign_keys="[Referral.referred_id]", back_populates="referred")
    
    def normalize_email(self):
        if self.email:
            self.email_normalized = self.email.lower().strip()
    
    def get_display_name(self) -> str:
        if self.full_name:
            return self.full_name
        if self.first_name:
            return f"{self.first_name} {self.last_name or ''}".strip()
        if self.email:
            return self.email.split('@')[0]
        if self.mobile:
            return f"User {self.mobile[-4:]}"
        return "User"
    
    def is_account_locked(self) -> bool:
        if self.locked_until and datetime.utcnow() < self.locked_until:
            return True
        return False
    
    def can_login(self) -> bool:
        return (
            self.is_active and
            self.status == UserStatus.ACTIVE.value and
            not self.is_account_locked()
        )
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "uuid": str(self.uuid),
            "email": self.email,
            "mobile": self.mobile,
            "full_name": self.full_name or self.get_display_name(),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "avatar_url": self.avatar_url,
            "wallet_balance": float(self.wallet_balance or 0),
            "pending_cashback": float(self.pending_cashback or 0),
            "referral_code": self.referral_code,
            "role": self.role,
            "is_admin": self.is_admin,
            "is_verified": self.is_verified,
            "auth_provider": self.auth_provider,
            "has_password": self.password_hash is not None,
        }
