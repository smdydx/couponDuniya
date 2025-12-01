from pydantic import BaseModel
from datetime import datetime

class OfferViewRead(BaseModel):
    id: int
    offer_id: int
    user_id: int | None
    created_at: datetime
    class Config:
        from_attributes = True

class OfferViewCreate(BaseModel):
    offer_id: int
    user_id: int | None = None
