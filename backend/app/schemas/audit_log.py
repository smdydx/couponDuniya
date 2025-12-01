from pydantic import BaseModel
from datetime import datetime

class AuditLogRead(BaseModel):
    id: int
    actor_user_id: int | None
    action: str
    entity_type: str | None
    entity_id: int | None
    meta: dict | None
    created_at: datetime
    class Config:
        from_attributes = True
