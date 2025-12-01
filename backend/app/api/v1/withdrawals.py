from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import WithdrawalRequest
from ...schemas import WithdrawalRequestRead, WithdrawalRequestCreate
from ...dependencies import get_current_user, require_admin

router = APIRouter(prefix="/withdrawals", tags=["Finance"])

@router.get("/requests", response_model=list[WithdrawalRequestRead])
def list_requests(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(WithdrawalRequest).all()

@router.post("/requests", response_model=WithdrawalRequestRead)
def create_request(payload: WithdrawalRequestCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
    wr = WithdrawalRequest(user_id=payload.user_id, amount=payload.amount)
    db.add(wr)
    db.commit()
    db.refresh(wr)
    return wr
