from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import MerchantCommission
from ...schemas import MerchantCommissionRead, MerchantCommissionCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/commissions", tags=["Commissions"])

@router.get("/", response_model=list[MerchantCommissionRead])
def list_commissions(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(MerchantCommission).all()

@router.post("/", response_model=MerchantCommissionRead)
def create_commission(payload: MerchantCommissionCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    mc = MerchantCommission(**payload.dict())
    db.add(mc)
    db.commit()
    db.refresh(mc)
    return mc
