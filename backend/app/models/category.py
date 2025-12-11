from sqlalchemy import String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class Category(Base):
    """Enhanced Category model with hierarchy support"""
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Hierarchy
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    level: Mapped[int] = mapped_column(Integer, default=0)  # 0 = root, 1 = subcategory, 2 = sub-subcategory
    path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # e.g., "1/5/23" for breadcrumb
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(250), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Images
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Attributes
    hsn_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # Default HSN for products
    default_tax_rate: Mapped[float] = mapped_column(default=18.0)  # Default GST rate
    
    # Commission
    commission_rate: Mapped[Optional[float]] = mapped_column(nullable=True)  # Category-specific commission
    
    # Display
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    display_mode: Mapped[str] = mapped_column(String(30), default="products")  # products, subcategories, both
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_visible_in_menu: Mapped[bool] = mapped_column(Boolean, default=True)
    is_visible_in_home: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Stats
    product_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # SEO
    meta_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meta_keywords: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Self-referential relationship
    parent = relationship("Category", remote_side=[id], backref="children")
