from pydantic import BaseModel
from datetime import datetime

class WalletTransactionRead(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    reference: str | None
    created_at: datetime

    class Config:
        from_attributes = True