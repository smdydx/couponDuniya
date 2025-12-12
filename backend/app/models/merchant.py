from sqlalchemy import String, Boolean, DateTime, Text, Numeric, Integer, Index, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class Merchant(Base):
    """Production-level Merchant/Seller model for dropshipping platform"""
    __tablename__ = "merchants"

    __table_args__ = (
        Index('idx_merchants_status', 'verification_status'),
        Index('idx_merchants_business_type', 'business_type'),
        Index('idx_merchants_created_at', 'created_at'),
        Index('idx_merchants_rating', 'average_rating'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Business Details (Indian Compliance)
    business_type: Mapped[str] = mapped_column(String(50), default="individual")  # individual, proprietorship, partnership, pvt_ltd, llp
    legal_business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True, index=True)  # GST Number
    pan_number: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # PAN Card
    cin_number: Mapped[Optional[str]] = mapped_column(String(21), nullable=True)  # Company Identification Number
    msme_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # MSME/Udyam Registration
    tan_number: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # TAN Number
    
    # Contact Information
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_phone_secondary: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_person_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_person_designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Registered Address
    registered_address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registered_address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    registered_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registered_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registered_pincode: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    registered_country: Mapped[str] = mapped_column(String(50), default="India")
    
    # Warehouse/Pickup Address
    warehouse_address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    warehouse_address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    warehouse_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    warehouse_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    warehouse_pincode: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    warehouse_country: Mapped[str] = mapped_column(String(50), default="India")
    
    # Bank Details for Payouts
    bank_account_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_ifsc_code: Mapped[Optional[str]] = mapped_column(String(11), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_branch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_account_type: Mapped[str] = mapped_column(String(20), default="current")  # savings, current
    upi_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Commission & Pricing
    commission_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # Platform commission %
    base_commission: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)  # Base commission % for affiliates
    tcs_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=1.0)  # TCS rate %
    tds_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # TDS rate %
    fixed_fee_per_order: Mapped[float] = mapped_column(Numeric(10, 2), default=0)  # Fixed fee per order
    
    # Affiliate Settings
    affiliate_network: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # admitad, impact, cuelinks, inhouse
    affiliate_network_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Display Settings
    show_on_homepage: Mapped[bool] = mapped_column(Boolean, default=False)
    minimum_payout_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=500)  # Minimum payout threshold
    payout_frequency: Mapped[str] = mapped_column(String(20), default="weekly")  # daily, weekly, biweekly, monthly
    
    # Verification & KYC
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, reviewing, approved, rejected (alias for verification_status)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, under_review, approved, rejected, suspended
    kyc_status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, submitted, verified, rejected
    kyc_documents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Store document URLs
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When merchant was approved
    verified_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Policies
    return_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    return_window_days: Mapped[int] = mapped_column(Integer, default=7)
    refund_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shipping_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancellation_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Shipping Settings
    ships_from_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    default_shipping_days: Mapped[int] = mapped_column(Integer, default=5)
    free_shipping_threshold: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    cod_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    cod_limit: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    serviceable_pincodes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Comma-separated or "all"
    
    # Performance Metrics
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_products: Mapped[int] = mapped_column(Integer, default=0)
    total_revenue: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    average_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    order_fulfillment_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # %
    on_time_delivery_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # %
    return_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # %
    cancellation_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # %
    
    # Seller Level/Tier
    seller_tier: Mapped[str] = mapped_column(String(30), default="bronze")  # bronze, silver, gold, platinum
    seller_score: Mapped[int] = mapped_column(Integer, default=0)  # 0-100 score
    
    # Status Flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_trusted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_new: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_returns: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Account Status
    account_status: Mapped[str] = mapped_column(String(30), default="active")  # active, suspended, deactivated, banned
    suspension_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suspended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    suspended_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # SEO
    meta_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meta_keywords: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Social Links
    facebook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    instagram_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    youtube_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    offers = relationship("Offer", back_populates="merchant")


class MerchantDocument(Base):
    """Merchant KYC Documents"""
    __tablename__ = "merchant_documents"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id", ondelete="CASCADE"), index=True)
    document_type: Mapped[str] = mapped_column(String(50))  # pan_card, gstin_certificate, cancelled_cheque, address_proof, etc.
    document_url: Mapped[str] = mapped_column(String(500))
    document_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, verified, rejected
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    verified_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant")
