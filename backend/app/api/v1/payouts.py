from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import Payout
from ...schemas import PayoutRead, PayoutCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/payouts", tags=["Finance"])

@router.get("/", response_model=list[PayoutRead])
def list_payouts(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(Payout).all()

@router.post("/", response_model=PayoutRead)
def create_payout(payload: PayoutCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    p = Payout(**payload.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
