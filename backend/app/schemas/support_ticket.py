from pydantic import BaseModel
from datetime import datetime

class SupportTicketRead(BaseModel):
    id: int
    user_id: int
    subject: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class SupportTicketCreate(BaseModel):
    user_id: int
    subject: str
    priority: str = "normal"
