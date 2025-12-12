from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ProductReviewCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    order_id: Optional[int] = None
    order_item_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    review_text: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    value_rating: Optional[int] = Field(None, ge=1, le=5)
    delivery_rating: Optional[int] = Field(None, ge=1, le=5)
    packaging_rating: Optional[int] = Field(None, ge=1, le=5)

class ProductReviewRead(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int] = None
    user_id: int
    order_id: Optional[int] = None
    rating: int
    title: Optional[str] = None
    review_text: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    quality_rating: Optional[int] = None
    value_rating: Optional[int] = None
    delivery_rating: Optional[int] = None
    packaging_rating: Optional[int] = None
    status: str = "pending"
    is_verified_purchase: bool = False
    is_featured: bool = False
    helpful_count: int = 0
    not_helpful_count: int = 0
    seller_reply: Optional[str] = None
    seller_reply_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class ProductReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    review_text: Optional[str] = None
    pros: Optional[str] = None
    cons: Optional[str] = None
    images: Optional[List[str]] = None
    quality_rating: Optional[int] = Field(None, ge=1, le=5)
    value_rating: Optional[int] = Field(None, ge=1, le=5)

class ReviewModerationUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class SellerReplyCreate(BaseModel):
    seller_reply: str = Field(..., min_length=1, max_length=1000)

class ReviewHelpfulVote(BaseModel):
    is_helpful: bool

class MerchantReviewCreate(BaseModel):
    merchant_id: int
    order_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = None
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    shipping_speed_rating: Optional[int] = Field(None, ge=1, le=5)
    product_quality_rating: Optional[int] = Field(None, ge=1, le=5)

class MerchantReviewRead(BaseModel):
    id: int
    merchant_id: int
    user_id: int
    order_id: Optional[int] = None
    rating: int
    review_text: Optional[str] = None
    communication_rating: Optional[int] = None
    shipping_speed_rating: Optional[int] = None
    product_quality_rating: Optional[int] = None
    status: str = "approved"
    is_verified_purchase: bool = False
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class ProductReviewSummary(BaseModel):
    product_id: int
    average_rating: float
    total_reviews: int
    rating_count_5: int = 0
    rating_count_4: int = 0
    rating_count_3: int = 0
    rating_count_2: int = 0
    rating_count_1: int = 0
    avg_quality_rating: Optional[float] = None
    avg_value_rating: Optional[float] = None
    avg_delivery_rating: Optional[float] = None
    avg_packaging_rating: Optional[float] = None

class ReviewListResponse(BaseModel):
    items: List[ProductReviewRead]
    total: int
    page: int
    size: int
    pages: int
    summary: Optional[ProductReviewSummary] = None
