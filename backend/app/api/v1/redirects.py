from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import SEORedirect
from ...schemas import SEORedirectRead, SEORedirectCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/redirects", tags=["Redirects"])

@router.get("/", response_model=list[SEORedirectRead])
def list_redirects(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(SEORedirect).all()

@router.post("/", response_model=SEORedirectRead)
def create_redirect(payload: SEORedirectCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    r = SEORedirect(**payload.dict())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
