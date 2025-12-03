from pydantic import BaseModel
from datetime import datetime

class MerchantRead(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: str | None = None
    description: str | None = None
    is_active: bool
    is_featured: bool = False
    created_at: datetime

    class Config:
        from_attributes = True