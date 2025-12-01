from pydantic import BaseModel
from datetime import datetime

class WithdrawalRequestRead(BaseModel):
    id: int
    user_id: int
    amount: float
    status: str
    requested_at: datetime
    processed_at: datetime | None
    class Config:
        from_attributes = True

class WithdrawalRequestCreate(BaseModel):
    user_id: int
    amount: float
