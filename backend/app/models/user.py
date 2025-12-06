from sqlalchemy import String, Boolean, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from uuid import uuid4
from ..database import Base

def generate_referral_code():
    return f"USER{str(uuid4())[:8].upper()}"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    mobile: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    referral_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, default=generate_referral_code)
    
    # Wallet
    wallet_balance: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    pending_cashback: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(50), default="customer")
    
    # Auth provider tracking (email, google, facebook, mobile)
    auth_provider: Mapped[str | None] = mapped_column(String(50), default="email")
    
    # Verification timestamps
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mobile_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="user")
    social_accounts = relationship("SocialAccount", back_populates="user")
    referrals_made = relationship("Referral", foreign_keys="[Referral.referrer_id]", back_populates="referrer")
    referrals_received = relationship("Referral", foreign_keys="[Referral.referred_id]", back_populates="referred")
