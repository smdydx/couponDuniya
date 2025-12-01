from pydantic import BaseModel
from datetime import datetime

class OfferClickRead(BaseModel):
    id: int
    offer_id: int
    user_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True