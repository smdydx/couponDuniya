from pydantic import BaseModel
from datetime import datetime

class MerchantRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True