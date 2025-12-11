from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class Address(Base):
    """User Address model for shipping and billing"""
    __tablename__ = "addresses"

    __table_args__ = (
        Index('idx_addresses_user', 'user_id'),
        Index('idx_addresses_pincode', 'pincode'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Address Type
    address_type: Mapped[str] = mapped_column(String(20), default="shipping")  # shipping, billing, both
    label: Mapped[str] = mapped_column(String(50), default="home")  # home, work, other
    
    # Contact
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(15))
    alternate_phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Address Details
    address_line1: Mapped[str] = mapped_column(String(500))
    address_line2: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    landmark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100))
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100))
    state_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)  # State code for GST
    country: Mapped[str] = mapped_column(String(50), default="India")
    country_code: Mapped[str] = mapped_column(String(3), default="IN")
    pincode: Mapped[str] = mapped_column(String(10), index=True)
    
    # Location
    latitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(nullable=True)
    
    # GSTIN for business addresses
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    
    # Flags
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Serviceability
    is_serviceable: Mapped[bool] = mapped_column(Boolean, default=True)
    cod_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")


class Pincode(Base):
    """Indian Pincode Master for serviceability"""
    __tablename__ = "pincodes"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pincode: Mapped[str] = mapped_column(String(6), unique=True, index=True)
    city: Mapped[str] = mapped_column(String(100))
    district: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    state_code: Mapped[str] = mapped_column(String(5))
    region: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # north, south, east, west, central
    zone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Delivery Info
    is_serviceable: Mapped[bool] = mapped_column(Boolean, default=True)
    cod_available: Mapped[bool] = mapped_column(Boolean, default=True)
    prepaid_only: Mapped[bool] = mapped_column(Boolean, default=False)
    delivery_days: Mapped[int] = mapped_column(Integer, default=5)
    
    # Metro/Tier
    is_metro: Mapped[bool] = mapped_column(Boolean, default=False)
    tier: Mapped[str] = mapped_column(String(10), default="tier3")  # tier1, tier2, tier3
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
