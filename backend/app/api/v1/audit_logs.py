from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import AuditLog
from ...schemas import AuditLogRead
from ...dependencies import require_admin

router = APIRouter(prefix="/audit", tags=["System"])

@router.get("/logs", response_model=list[AuditLogRead])
def list_logs(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(500).all()
