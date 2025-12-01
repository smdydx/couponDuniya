from pydantic import BaseModel
from datetime import datetime

class UserSessionRead(BaseModel):
    id: int
    user_id: int
    token: str
    expires_at: datetime
    created_at: datetime
    revoked_at: datetime | None
    class Config:
        from_attributes = True

class UserSessionCreate(BaseModel):
    user_id: int
    token: str
    expires_at: datetime
