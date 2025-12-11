from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Numeric, Text, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class Product(Base):
    """Production-level Product model for dropshipping platform"""
    __tablename__ = "products"

    __table_args__ = (
        Index('idx_products_merchant', 'merchant_id'),
        Index('idx_products_category', 'category_id'),
        Index('idx_products_brand', 'brand_id'),
        Index('idx_products_status', 'status'),
        Index('idx_products_created_at', 'created_at'),
        Index('idx_products_price', 'selling_price'),
        Index('idx_products_rating', 'average_rating'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Basic Info
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    name: Mapped[str] = mapped_column(String(500), index=True)
    slug: Mapped[str] = mapped_column(String(600), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True)  # Stock Keeping Unit
    barcode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)  # EAN/UPC
    hsn_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # HSN Code for GST
    
    # Categorization
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), index=True, nullable=True)
    subcategory_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    brand_id: Mapped[Optional[int]] = mapped_column(ForeignKey("brands.id"), index=True, nullable=True)
    
    # Description
    short_description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    highlights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Bullet points
    
    # Images
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Main image
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Array of image URLs
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Pricing
    mrp: Mapped[float] = mapped_column(Numeric(12, 2))  # Maximum Retail Price
    cost_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)  # Purchase/Cost price
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2))  # Your selling price
    price: Mapped[float] = mapped_column(Numeric(12, 2))  # Alias for selling_price (backward compatibility)
    special_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Sale price
    special_price_from: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    special_price_to: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    discount_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    profit_margin: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # Calculated margin %
    
    # Tax
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=18)  # GST rate %
    tax_inclusive: Mapped[bool] = mapped_column(Boolean, default=True)  # Is MRP inclusive of tax
    
    # Inventory
    stock: Mapped[int] = mapped_column(Integer, default=0)
    reserved_stock: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10)
    stock_status: Mapped[str] = mapped_column(String(30), default="in_stock")  # in_stock, out_of_stock, low_stock, discontinued
    manage_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_backorder: Mapped[bool] = mapped_column(Boolean, default=False)
    max_order_quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_order_quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    # Physical Attributes
    weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)  # in kg
    weight_unit: Mapped[str] = mapped_column(String(10), default="kg")
    length: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)  # in cm
    width: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    height: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    dimension_unit: Mapped[str] = mapped_column(String(10), default="cm")
    volumetric_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    
    # Shipping
    is_shippable: Mapped[bool] = mapped_column(Boolean, default=True)
    shipping_class: Mapped[str] = mapped_column(String(50), default="standard")  # standard, heavy, fragile, perishable
    free_shipping: Mapped[bool] = mapped_column(Boolean, default=False)
    shipping_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    shipping_time_min: Mapped[int] = mapped_column(Integer, default=3)  # Min days
    shipping_time_max: Mapped[int] = mapped_column(Integer, default=7)  # Max days
    ships_from: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # City/State
    
    # Return & Warranty
    is_returnable: Mapped[bool] = mapped_column(Boolean, default=True)
    return_window_days: Mapped[int] = mapped_column(Integer, default=7)
    return_policy: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    warranty_months: Mapped[int] = mapped_column(Integer, default=0)
    warranty_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # manufacturer, seller, no_warranty
    warranty_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Product Attributes/Specifications
    specifications: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Key-value specs
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Custom attributes
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Search tags
    
    # Product Type
    product_type: Mapped[str] = mapped_column(String(30), default="simple")  # simple, variable, digital, bundle
    is_digital: Mapped[bool] = mapped_column(Boolean, default=False)
    digital_file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Reviews & Ratings
    average_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    rating_count_5: Mapped[int] = mapped_column(Integer, default=0)
    rating_count_4: Mapped[int] = mapped_column(Integer, default=0)
    rating_count_3: Mapped[int] = mapped_column(Integer, default=0)
    rating_count_2: Mapped[int] = mapped_column(Integer, default=0)
    rating_count_1: Mapped[int] = mapped_column(Integer, default=0)
    
    # Performance
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    order_count: Mapped[int] = mapped_column(Integer, default=0)
    wishlist_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Status Flags
    status: Mapped[str] = mapped_column(String(30), default="draft")  # draft, pending_review, active, rejected, archived
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_bestseller: Mapped[bool] = mapped_column(Boolean, default=False)
    is_new_arrival: Mapped[bool] = mapped_column(Boolean, default=True)
    is_on_sale: Mapped[bool] = mapped_column(Boolean, default=False)
    is_cod_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Admin
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # SEO
    meta_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meta_keywords: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    canonical_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Affiliate/Dropshipping
    supplier_sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    supplier_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    supplier_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    merchant = relationship("Merchant", back_populates="products")
    category = relationship("Category", foreign_keys=[category_id])
    subcategory = relationship("Category", foreign_keys=[subcategory_id])
    brand = relationship("Brand")
    images_rel = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan")


class ProductImage(Base):
    """Product Images with ordering"""
    __tablename__ = "product_images"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    image_url: Mapped[str] = mapped_column(String(500))
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="images_rel")


class ProductSpecification(Base):
    """Product Specifications (key-value pairs)"""
    __tablename__ = "product_specifications"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    group_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g., "General", "Display", "Battery"
    spec_name: Mapped[str] = mapped_column(String(255))
    spec_value: Mapped[str] = mapped_column(String(500))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    product = relationship("Product")
