from sqlalchemy import Integer, ForeignKey, Numeric, String, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class OrderItem(Base):
    """Enhanced Order Item model"""
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    
    # Product Reference
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    variant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_variants.id"), nullable=True)
    merchant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("merchants.id"), nullable=True)
    
    # Product Snapshot (at time of order)
    product_name: Mapped[str] = mapped_column(String(500))
    variant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sku: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    hsn_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Quantity & Pricing
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    mrp: Mapped[float] = mapped_column(Numeric(12, 2))
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))
    
    # Tax
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=18)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    sgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    igst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    # Final Amount
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    
    # Fulfillment
    fulfillment_status: Mapped[str] = mapped_column(String(50), default="pending")
    # pending, confirmed, processing, packed, shipped, delivered, cancelled, returned
    
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # For digital products
    voucher_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    voucher_pin: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    voucher_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_delivered: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Tracking (individual item tracking)
    awb_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    courier_partner: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Return
    is_returnable: Mapped[bool] = mapped_column(Boolean, default=True)
    return_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    return_request_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Seller Payout
    seller_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    platform_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    merchant = relationship("Merchant")
