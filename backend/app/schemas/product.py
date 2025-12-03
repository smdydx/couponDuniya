from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProductVariantRead(BaseModel):
    id: int
    product_id: int
    sku: str
    name: str
    price: float
    stock: int
    is_available: bool = True

    class Config:
        from_attributes = True

class ProductRead(BaseModel):
    id: int
    merchant_id: int
    name: str
    slug: str
    image_url: str | None = None
    price: float
    stock: int
    is_bestseller: bool = False
    is_featured: bool = False
    is_active: bool = True
    created_at: datetime
    variants: List[ProductVariantRead] = []
    merchant: Optional["MerchantRead"] = None

    class Config:
        from_attributes = True

from .merchant import MerchantRead
ProductRead.model_rebuild()