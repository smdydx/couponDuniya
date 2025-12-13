from pydantic import BaseModel
from datetime import datetime

class PaymentRead(BaseModel):
    id: int
    order_id: int
    user_id: int
    amount: float
    status: str
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    order_id: int
    user_id: int
    amount: float
