from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import CashbackEvent
from ...schemas import CashbackEventRead, CashbackEventCreate
from ...dependencies import require_admin, get_current_user
from ...redis_client import publish

router = APIRouter(prefix="/cashback", tags=["Cashback"])

@router.get("/events", response_model=list[CashbackEventRead])
def list_events(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(CashbackEvent).all()

@router.post("/events", response_model=CashbackEventRead)
def create_event(payload: CashbackEventCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    ev = CashbackEvent(**payload.dict())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    publish("events:cashback", {"id": ev.id, "status": ev.status, "user_id": ev.user_id})
    return ev

@router.get("/my", response_model=list[CashbackEventRead])
def my_cashback(db: Session = Depends(get_db), user = Depends(get_current_user)):
    return db.query(CashbackEvent).filter(CashbackEvent.user_id == user.id).all()
