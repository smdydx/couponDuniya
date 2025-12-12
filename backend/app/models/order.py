from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Text, Boolean, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from uuid import uuid4
from typing import Optional
from ..database import Base

class Order(Base):
    """Production-level Order model for dropshipping platform"""
    __tablename__ = "orders"

    __table_args__ = (
        Index('idx_orders_user', 'user_id'),
        Index('idx_orders_merchant', 'merchant_id'),
        Index('idx_orders_status', 'status'),
        Index('idx_orders_payment_status', 'payment_status'),
        Index('idx_orders_created_at', 'created_at'),
        Index('idx_orders_awb', 'awb_number'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    
    # User & Merchant
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("merchants.id"), nullable=True, index=True)
    
    # Amounts
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    coupon_discount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    wallet_used: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cashback_used: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    # Shipping
    shipping_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    shipping_discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    cod_charges: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    packaging_charges: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    
    # Tax (GST)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    sgst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    igst_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    
    # Final Amount
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    payable_amount: Mapped[float] = mapped_column(Numeric(12, 2))  # After wallet/cashback
    
    # Promo/Coupon
    promo_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    coupon_id: Mapped[Optional[int]] = mapped_column(ForeignKey("promo_codes.id"), nullable=True)
    
    # Status Fields
    status: Mapped[str] = mapped_column(String(50), default="pending")
    # pending, confirmed, processing, ready_to_ship, shipped, out_for_delivery, delivered, cancelled, returned, refunded
    
    payment_status: Mapped[str] = mapped_column(String(50), default="pending")
    # pending, authorized, captured, failed, refunded, partially_refunded
    
    fulfillment_status: Mapped[str] = mapped_column(String(50), default="pending")
    # pending, processing, packed, shipped, delivered, cancelled, returned
    
    # Payment Info
    payment_method: Mapped[str] = mapped_column(String(50), default="online")  # online, cod, wallet, upi, netbanking, card
    payment_gateway: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # razorpay, paytm, phonepe
    gateway_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    gateway_signature: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Shipping Address (Snapshot)
    shipping_name: Mapped[str] = mapped_column(String(255))
    shipping_phone: Mapped[str] = mapped_column(String(15))
    shipping_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    shipping_address_line1: Mapped[str] = mapped_column(String(500))
    shipping_address_line2: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    shipping_landmark: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    shipping_city: Mapped[str] = mapped_column(String(100))
    shipping_state: Mapped[str] = mapped_column(String(100))
    shipping_state_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    shipping_pincode: Mapped[str] = mapped_column(String(10))
    shipping_country: Mapped[str] = mapped_column(String(50), default="India")
    
    # Billing Address (Snapshot)
    billing_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    billing_phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    billing_address_line1: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    billing_address_line2: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    billing_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    billing_state_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    billing_pincode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    billing_gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    
    # Shipping/Logistics
    shipping_method: Mapped[str] = mapped_column(String(50), default="standard")  # standard, express, same_day
    courier_partner: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # delhivery, shiprocket, bluedart
    awb_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)  # Air Waybill Number
    tracking_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    estimated_delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivery_attempts: Mapped[int] = mapped_column(Integer, default=0)
    
    # Package Info
    package_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    package_length: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    package_width: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    package_height: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Invoice
    invoice_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    invoice_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    invoice_generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Notes
    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Cancellation
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # customer, merchant, admin
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Return/Refund
    is_returnable: Mapped[bool] = mapped_column(Boolean, default=True)
    return_window_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # COD
    is_cod: Mapped[bool] = mapped_column(Boolean, default=False)
    cod_collected: Mapped[bool] = mapped_column(Boolean, default=False)
    cod_collected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Seller Payout
    seller_payout_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    platform_commission: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    seller_payout_status: Mapped[str] = mapped_column(String(30), default="pending")
    seller_payout_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # IP & Device
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # mobile, desktop, tablet
    
    # Source
    source: Mapped[str] = mapped_column(String(50), default="web")  # web, app, api
    utm_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_medium: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    merchant = relationship("Merchant")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    shipments = relationship("OrderShipment", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")


class OrderStatusHistory(Base):
    """Order Status Change History"""
    __tablename__ = "order_status_history"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50))
    status_type: Mapped[str] = mapped_column(String(30))  # order, payment, fulfillment
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # user_id or "system"
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="status_history")


class OrderShipment(Base):
    """Individual Shipments for multi-seller orders"""
    __tablename__ = "order_shipments"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    merchant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("merchants.id"), nullable=True)
    
    shipment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    courier_partner: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    awb_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    tracking_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    status: Mapped[str] = mapped_column(String(50), default="pending")
    weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    estimated_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    order = relationship("Order", back_populates="shipments")
    merchant = relationship("Merchant")
