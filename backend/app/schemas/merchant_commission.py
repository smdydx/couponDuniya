from pydantic import BaseModel
from datetime import datetime

class MerchantCommissionRead(BaseModel):
    id: int
    merchant_id: int
    category_id: int | None
    commission_type: str
    commission_value: float
    cashback_percentage: float | None
    valid_from: datetime | None
    valid_until: datetime | None
    created_at: datetime
    class Config:
        from_attributes = True

class MerchantCommissionCreate(BaseModel):
    merchant_id: int
    category_id: int | None = None
    commission_type: str
    commission_value: float
    cashback_percentage: float | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None
