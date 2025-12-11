from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class ProductVariantRead(BaseModel):
    id: int
    product_id: int
    sku: str
    barcode: Optional[str] = None
    name: str
    option_1_name: Optional[str] = None
    option_1_value: Optional[str] = None
    option_2_name: Optional[str] = None
    option_2_value: Optional[str] = None
    mrp: float = 0
    price: float
    selling_price: Optional[float] = None
    special_price: Optional[float] = None
    denomination: Optional[float] = None
    stock: int
    is_available: bool = True
    is_default: bool = False
    image_url: Optional[str] = None
    weight: Optional[float] = None

    class Config:
        from_attributes = True

class ProductVariantCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=255)
    option_1_name: Optional[str] = None
    option_1_value: Optional[str] = None
    option_2_name: Optional[str] = None
    option_2_value: Optional[str] = None
    mrp: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    selling_price: Optional[float] = None
    stock: int = Field(default=0, ge=0)
    weight: Optional[float] = None
    image_url: Optional[str] = None
    is_default: bool = False

class ProductImageRead(BaseModel):
    id: int
    product_id: int
    image_url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False

    class Config:
        from_attributes = True

class ProductSpecificationRead(BaseModel):
    id: int
    product_id: int
    group_name: Optional[str] = None
    spec_name: str
    spec_value: str
    sort_order: int = 0

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=500)
    short_description: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = None
    highlights: Optional[str] = None

class ProductCreate(ProductBase):
    merchant_id: int
    sku: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    brand_id: Optional[int] = None
    barcode: Optional[str] = None
    hsn_code: Optional[str] = Field(None, max_length=10)
    mrp: float = Field(..., gt=0)
    cost_price: float = Field(default=0, ge=0)
    selling_price: float = Field(..., gt=0)
    tax_rate: float = Field(default=18, ge=0, le=28)
    stock: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    shipping_class: str = "standard"
    is_returnable: bool = True
    return_window_days: int = 7
    warranty_months: int = 0
    warranty_type: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    specifications: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    brand_id: Optional[int] = None
    hsn_code: Optional[str] = None
    mrp: Optional[float] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    special_price: Optional[float] = None
    special_price_from: Optional[datetime] = None
    special_price_to: Optional[datetime] = None
    tax_rate: Optional[float] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    shipping_class: Optional[str] = None
    free_shipping: Optional[bool] = None
    is_returnable: Optional[bool] = None
    return_window_days: Optional[int] = None
    warranty_months: Optional[int] = None
    warranty_type: Optional[str] = None
    warranty_description: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    is_cod_available: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None

class ProductRead(BaseModel):
    id: int
    merchant_id: int
    name: str
    slug: str
    sku: str
    barcode: Optional[str] = None
    hsn_code: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    brand_id: Optional[int] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    mrp: float = 0
    selling_price: float = 0
    price: float
    special_price: Optional[float] = None
    discount_percentage: float = 0
    tax_rate: float = 18
    stock: int = 0
    stock_status: str = "in_stock"
    average_rating: float = 0
    total_reviews: int = 0
    is_bestseller: bool = False
    is_featured: bool = False
    is_new_arrival: bool = True
    is_on_sale: bool = False
    is_active: bool = True
    is_cod_available: bool = True
    is_returnable: bool = True
    return_window_days: int = 7
    shipping_time_min: int = 3
    shipping_time_max: int = 7
    free_shipping: bool = False
    status: str = "active"
    created_at: datetime
    variants: List[ProductVariantRead] = []
    merchant: Optional["MerchantRead"] = None

    class Config:
        from_attributes = True

class ProductDetailRead(ProductRead):
    description: Optional[str] = None
    highlights: Optional[str] = None
    video_url: Optional[str] = None
    weight: Optional[float] = None
    weight_unit: str = "kg"
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    dimension_unit: str = "cm"
    shipping_class: str = "standard"
    ships_from: Optional[str] = None
    warranty_months: int = 0
    warranty_type: Optional[str] = None
    warranty_description: Optional[str] = None
    return_policy: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    attributes: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    rating_count_5: int = 0
    rating_count_4: int = 0
    rating_count_3: int = 0
    rating_count_2: int = 0
    rating_count_1: int = 0
    view_count: int = 0
    order_count: int = 0
    wishlist_count: int = 0
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

class ProductListResponse(BaseModel):
    items: List[ProductRead]
    total: int
    page: int
    size: int
    pages: int

from .merchant import MerchantRead
ProductRead.model_rebuild()
ProductDetailRead.model_rebuild()
