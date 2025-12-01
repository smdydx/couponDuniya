from pydantic import BaseModel
from datetime import datetime

class ReferralRead(BaseModel):
    id: int
    referrer_user_id: int
    referred_user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ReferralCreate(BaseModel):
    referrer_user_id: int
    referred_user_id: int
