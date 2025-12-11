from sqlalchemy import String, Integer, ForeignKey, Numeric, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class ProductVariant(Base):
    """Enhanced Product Variant model"""
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    
    # Identification
    sku: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Variant Details
    name: Mapped[str] = mapped_column(String(255))
    option_1_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "Size"
    option_1_value: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "XL"
    option_2_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "Color"
    option_2_value: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "Red"
    option_3_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    option_3_value: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Pricing
    mrp: Mapped[float] = mapped_column(Numeric(12, 2))
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    price: Mapped[float] = mapped_column(Numeric(12, 2))  # Selling price
    selling_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    special_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    denomination: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # For gift cards
    
    # Inventory
    stock: Mapped[int] = mapped_column(Integer, default=0)
    reserved_stock: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    
    # Physical
    weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    length: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    width: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    height: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Image
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # Status
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="variants")
