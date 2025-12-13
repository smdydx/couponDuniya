from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base
import enum


class MerchantStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    business_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    business_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    business_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    business_country: Mapped[str | None] = mapped_column(String(100), default="India", nullable=True)
    
    gst_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pan_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_account_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_ifsc_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    affiliate_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tracking_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    commission_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    cashback_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    platform_commission: Mapped[float] = mapped_column(Numeric(5, 2), default=10)
    
    status: Mapped[str] = mapped_column(String(30), default=MerchantStatus.PENDING.value)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending")
    verification_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verified_by: Mapped[int | None] = mapped_column(nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    total_offers: Mapped[int] = mapped_column(default=0)
    total_clicks: Mapped[int] = mapped_column(default=0)
    total_conversions: Mapped[int] = mapped_column(default=0)
    total_revenue: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id])
    offers = relationship("Offer", back_populates="merchant")
    commissions = relationship("MerchantCommission", back_populates="merchant")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "logo_url": self.logo_url,
            "banner_url": self.banner_url,
            "description": self.description,
            "business_name": self.business_name,
            "website_url": self.website_url,
            "commission_rate": float(self.commission_rate or 0),
            "cashback_rate": float(self.cashback_rate or 0),
            "status": self.status,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "is_verified": self.is_verified,
            "total_offers": self.total_offers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
