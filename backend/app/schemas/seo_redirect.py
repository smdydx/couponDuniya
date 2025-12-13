from pydantic import BaseModel
from datetime import datetime

class SEORedirectRead(BaseModel):
    id: int
    source_path: str
    target_path: str
    http_status: int
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class SEORedirectCreate(BaseModel):
    source_path: str
    target_path: str
    http_status: int | None = None
