from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BrandCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    is_verified: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_verified: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BrandRead(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    website_url: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    is_verified: bool = False
    product_count: int = 0
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BrandListResponse(BaseModel):
    items: list[BrandRead]
    total: int
    page: int
    size: int
    pages: int
