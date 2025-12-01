from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import SupportTicket
from ...schemas import SupportTicketRead, SupportTicketCreate
from ...dependencies import get_current_user, require_admin
from datetime import datetime

router = APIRouter(prefix="/support", tags=["Support"])

@router.get("/tickets", response_model=list[SupportTicketRead])
def list_tickets(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(SupportTicket).all()

@router.post("/tickets", response_model=SupportTicketRead)
def create_ticket(payload: SupportTicketCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    t = SupportTicket(user_id=payload.user_id, subject=payload.subject, priority=payload.priority)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t
