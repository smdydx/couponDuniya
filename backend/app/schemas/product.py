from pydantic import BaseModel
from datetime import datetime

class ProductRead(BaseModel):
    id: int
    merchant_id: int
    name: str
    slug: str
    price: float
    stock: int
    is_bestseller: bool
    is_featured: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True