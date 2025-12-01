from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import OfferView
from ...schemas import OfferViewRead, OfferViewCreate
from ...dependencies import require_internal_service

router = APIRouter(prefix="/offer-views", tags=["OfferViews"])

@router.get("/", response_model=list[OfferViewRead])
def list_offer_views(db: Session = Depends(get_db), _: bool = Depends(require_internal_service)):
    return db.query(OfferView).all()

@router.post("/", response_model=OfferViewRead)
def create_view(payload: OfferViewCreate, db: Session = Depends(get_db), _: bool = Depends(require_internal_service)):
    ov = OfferView(**payload.dict())
    db.add(ov)
    db.commit()
    db.refresh(ov)
    return ov
