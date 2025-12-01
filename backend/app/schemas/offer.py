from pydantic import BaseModel
from datetime import datetime

class OfferRead(BaseModel):
    id: int
    merchant_id: int
    title: str
    code: str | None
    is_active: bool
    priority: int
    starts_at: datetime | None
    ends_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True