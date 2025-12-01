from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import CMSPage
from ...schemas import CMSPageRead, CMSPageCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/cms-pages", tags=["CMS"])

@router.get("/", response_model=list[CMSPageRead])
def list_pages(db: Session = Depends(get_db)):
    return db.query(CMSPage).all()

@router.post("/", response_model=CMSPageRead)
def create_page(payload: CMSPageCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    page = CMSPage(**payload.dict())
    db.add(page)
    db.commit()
    db.refresh(page)
    return page
