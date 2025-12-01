from pydantic import BaseModel
from datetime import datetime

class UserKYCRead(BaseModel):
    id: int
    user_id: int
    account_holder_name: str | None
    account_number: str | None
    ifsc_code: str | None
    bank_name: str | None
    upi_id: str | None
    pan_number: str | None
    pan_verified: bool
    status: str
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True

class UserKCCreate(BaseModel):
    user_id: int
    account_holder_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    bank_name: str | None = None
    upi_id: str | None = None
    pan_number: str | None = None
