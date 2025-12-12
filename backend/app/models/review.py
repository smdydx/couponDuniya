from sqlalchemy import String, DateTime, ForeignKey, Integer, Text, Boolean, Index, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class ProductReview(Base):
    """Product Review & Rating model"""
    __tablename__ = "product_reviews"

    __table_args__ = (
        Index('idx_reviews_product', 'product_id'),
        Index('idx_reviews_user', 'user_id'),
        Index('idx_reviews_rating', 'rating'),
        Index('idx_reviews_status', 'status'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # References
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    variant_id: Mapped[Optional[int]] = mapped_column(ForeignKey("product_variants.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id"), nullable=True)
    order_item_id: Mapped[Optional[int]] = mapped_column(ForeignKey("order_items.id"), nullable=True)
    
    # Rating
    rating: Mapped[int] = mapped_column(Integer)  # 1-5 stars
    
    # Review Content
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pros: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cons: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Media
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Array of image URLs
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Detailed Ratings (optional)
    quality_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    value_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    delivery_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    packaging_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(30), default="pending")  # pending, approved, rejected, spam
    is_verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Engagement
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    not_helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    report_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Reply from Seller
    seller_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seller_reply_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Moderation
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    moderated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User")


class ReviewHelpful(Base):
    """Track helpful votes on reviews"""
    __tablename__ = "review_helpful"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("product_reviews.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    is_helpful: Mapped[bool] = mapped_column(Boolean)  # True = helpful, False = not helpful
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    review = relationship("ProductReview")
    user = relationship("User")


class MerchantReview(Base):
    """Seller/Merchant Review"""
    __tablename__ = "merchant_reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("orders.id"), nullable=True)
    
    rating: Mapped[int] = mapped_column(Integer)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Specific Ratings
    communication_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    shipping_speed_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    product_quality_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    status: Mapped[str] = mapped_column(String(30), default="approved")
    is_verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    merchant = relationship("Merchant")
    user = relationship("User")
