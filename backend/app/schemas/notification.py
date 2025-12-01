from pydantic import BaseModel
from datetime import datetime

class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    body: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    user_id: int
    title: str
    body: str
