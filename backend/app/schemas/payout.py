from pydantic import BaseModel
from datetime import datetime

class PayoutRead(BaseModel):
    id: int
    user_id: int
    amount: float
    method: str
    reference: str | None
    created_at: datetime
    class Config:
        from_attributes = True

class PayoutCreate(BaseModel):
    user_id: int
    amount: float
    method: str
    reference: str | None = None
