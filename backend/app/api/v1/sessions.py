from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import UserSession
from ...schemas import UserSessionRead, UserSessionCreate
from ...dependencies import require_admin

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("/", response_model=list[UserSessionRead])
def list_sessions(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(UserSession).all()

@router.post("/", response_model=UserSessionRead)
def create_session(payload: UserSessionCreate, db: Session = Depends(get_db)):
    s = UserSession(**payload.dict())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
