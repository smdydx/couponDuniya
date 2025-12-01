from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import UserKYC
from ...schemas import UserKYCRead, UserKCCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/kyc", tags=["KYC"])

@router.get("/", response_model=list[UserKYCRead])
def list_kyc(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(UserKYC).all()

@router.post("/", response_model=UserKYCRead)
def create_kyc(payload: UserKCCreate, db: Session = Depends(get_db)):
    kyc = UserKYC(**payload.dict())
    db.add(kyc)
    db.commit()
    db.refresh(kyc)
    return kyc
