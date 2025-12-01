from pydantic import BaseModel
from datetime import datetime

class CashbackEventRead(BaseModel):
    id: int
    user_id: int
    order_id: int | None
    amount: float
    status: str
    created_at: datetime
    confirmed_at: datetime | None
    class Config:
        from_attributes = True

class CashbackEventCreate(BaseModel):
    user_id: int
    order_id: int | None = None
    amount: float
