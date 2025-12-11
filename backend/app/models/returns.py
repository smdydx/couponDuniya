from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Text, Boolean, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from uuid import uuid4
from typing import Optional
from ..database import Base

class ReturnRequest(Base):
    """Return Request model for order returns"""
    __tablename__ = "return_requests"

    __table_args__ = (
        Index('idx_returns_user', 'user_id'),
        Index('idx_returns_order', 'order_id'),
        Index('idx_returns_status', 'status'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    return_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # RET-XXXX
    rma_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Return Merchandise Authorization
    
    # References
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    order_item_id: Mapped[Optional[int]] = mapped_column(ForeignKey("order_items.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("merchants.id"), nullable=True)
    
    # Return Details
    return_type: Mapped[str] = mapped_column(String(30))  # return, exchange, repair
    return_reason: Mapped[str] = mapped_column(String(100))  # defective, wrong_product, not_as_described, size_issue, damaged, etc.
    return_reason_detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Product Info (Snapshot)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    product_name: Mapped[str] = mapped_column(String(500))
    variant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_variants.id"), nullable=True)
    variant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    # Amounts
    item_price: Mapped[float] = mapped_column(Numeric(12, 2))
    return_amount: Mapped[float] = mapped_column(Numeric(12, 2))  # Amount to refund
    shipping_deduction: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    restocking_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    refund_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)  # Final refund
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending")
    # pending, approved, rejected, pickup_scheduled, picked_up, in_transit, received, inspected, refund_initiated, refund_completed, closed
    
    # Pickup Details
    pickup_address_id: Mapped[Optional[int]] = mapped_column(ForeignKey("addresses.id"), nullable=True)
    pickup_scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    pickup_time_slot: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    pickup_courier: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pickup_awb: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    picked_up_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Inspection
    inspection_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # pending, passed, failed
    inspection_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inspection_images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    inspected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    inspected_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Quality Check
    qc_passed: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    is_resaleable: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Refund
    refund_method: Mapped[str] = mapped_column(String(50), default="original_payment")  # original_payment, wallet, bank_transfer
    refund_status: Mapped[str] = mapped_column(String(50), default="pending")
    refund_transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    refunded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Exchange (if applicable)
    exchange_product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id"), nullable=True)
    exchange_variant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_variants.id"), nullable=True)
    exchange_order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id"), nullable=True)
    
    # Images/Proof
    customer_images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    customer_video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Admin
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejected_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rejected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Notes
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order")
    user = relationship("User")
    merchant = relationship("Merchant")
    product = relationship("Product", foreign_keys=[product_id])


class Refund(Base):
    """Refund records"""
    __tablename__ = "refunds"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    refund_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    
    # References
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    return_request_id: Mapped[Optional[int]] = mapped_column(ForeignKey("return_requests.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Refund Type
    refund_type: Mapped[str] = mapped_column(String(50))  # full, partial, shipping_only
    refund_reason: Mapped[str] = mapped_column(String(100))
    
    # Amounts
    order_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    refund_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    shipping_refund: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tax_refund: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    
    # Method
    refund_method: Mapped[str] = mapped_column(String(50))
    refund_to: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Account details
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processing, completed, failed
    
    # Gateway
    gateway: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gateway_refund_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Timestamps
    initiated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Admin
    initiated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    order = relationship("Order")
    user = relationship("User")
