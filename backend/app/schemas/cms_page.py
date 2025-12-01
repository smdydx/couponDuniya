from pydantic import BaseModel
from datetime import datetime

class CMSPageRead(BaseModel):
    id: int
    title: str
    slug: str
    is_published: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    class Config:
        from_attributes = True

class CMSPageCreate(BaseModel):
    title: str
    slug: str
    is_published: bool | None = False
