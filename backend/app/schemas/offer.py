from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class OfferBase(BaseModel):
    merchant_id: int
    title: str
    code: str | None = None
    image_url: str | None = None
    is_active: bool = True
    is_featured: bool = False
    is_exclusive: bool = False
    priority: int = 0
    start_date: datetime | None = None
    end_date: datetime | None = None

class OfferRead(BaseModel):
    id: int
    merchant_id: int
    title: str
    code: str | None = None
    image_url: str | None = None
    is_active: bool
    is_featured: bool = False
    is_exclusive: bool = False
    priority: int
    start_date: datetime | None = None
    end_date: datetime | None = None
    created_at: datetime
    merchant: Optional["MerchantRead"] = None

    class Config:
        from_attributes = True

from .merchant import MerchantRead
OfferRead.model_rebuild()