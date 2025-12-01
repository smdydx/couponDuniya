from pydantic import BaseModel
from datetime import datetime

class WithdrawalRead(BaseModel):
    id: int
    user_id: int
    amount: float
    method: str
    status: str
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True

class WithdrawalCreate(BaseModel):
    user_id: int
    amount: float
    method: str
