from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import Payment
from ...schemas import PaymentRead, PaymentCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/payments", tags=["Finance"])

@router.get("/", response_model=list[PaymentRead])
def list_payments(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(Payment).all()

@router.post("/", response_model=PaymentRead)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    p = Payment(**payload.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
