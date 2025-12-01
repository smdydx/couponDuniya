from pydantic import BaseModel
from datetime import datetime

class GiftCardRead(BaseModel):
    id: int
    code: str
    initial_value: float
    remaining_value: float
    user_id: int | None
    expires_at: datetime | None
    is_active: bool
    class Config:
        from_attributes = True

class GiftCardCreate(BaseModel):
    code: str
    initial_value: float
    remaining_value: float
    user_id: int | None = None
    expires_at: datetime | None = None
