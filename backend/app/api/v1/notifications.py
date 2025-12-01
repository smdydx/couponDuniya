from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import Notification
from ...schemas import NotificationRead, NotificationCreate
from ...dependencies import get_current_user, require_admin

router = APIRouter(prefix="/notifications", tags=["Engagement"])

@router.get("/", response_model=list[NotificationRead])
def list_notifications(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(Notification).all()

@router.get("/my", response_model=list[NotificationRead])
def my_notifications(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == user.id).all()

@router.post("/", response_model=NotificationRead)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    n = Notification(**payload.dict())
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
