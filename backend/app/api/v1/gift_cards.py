from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import GiftCard, User
from ...schemas import GiftCardRead, GiftCardCreate
from ...dependencies import require_admin
from ...queue import push_email_job
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets, csv, io

router = APIRouter(prefix="/gift-cards", tags=["Gifts"])

@router.get("/", response_model=list[GiftCardRead])
def list_gift_cards(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(GiftCard).all()

@router.post("/", response_model=GiftCardRead)
def create_gift_card(payload: GiftCardCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    existing = db.query(GiftCard).filter(GiftCard.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Code already exists")
    gc = GiftCard(**payload.dict())
    db.add(gc)
    db.commit()
    db.refresh(gc)
    return gc


class GiftCardAutoGenerateRequest(BaseModel):
    count: int = 1
    value: float
    expires_in_days: int | None = None


@router.post("/auto-generate", response_model=list[GiftCardRead])
def auto_generate(req: GiftCardAutoGenerateRequest, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    if req.count <= 0 or req.count > 1000:
        raise HTTPException(status_code=400, detail="Invalid count (1-1000)")
    expires_at = None
    if req.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=req.expires_in_days)
    created: list[GiftCard] = []
    for _ in range(req.count):
        # Ensure uniqueness
        for attempt in range(5):
            code = secrets.token_hex(8).upper()
            if not db.query(GiftCard).filter(GiftCard.code == code).first():
                break
        gc = GiftCard(code=code, initial_value=req.value, remaining_value=req.value, expires_at=expires_at)
        db.add(gc)
        created.append(gc)
    db.commit()
    for gc in created:
        db.refresh(gc)
    return created


@router.post("/import", response_model=dict)
def bulk_import(file: UploadFile = File(...), default_value: float | None = None, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    content = file.file.read().decode("utf-8")
    reader = csv.reader(io.StringIO(content))
    created = 0
    for row in reader:
        if not row:
            continue
        code = row[0].strip()
        if not code:
            continue
        if db.query(GiftCard).filter(GiftCard.code == code).first():
            continue
        value = None
        if len(row) > 1:
            try:
                value = float(row[1])
            except Exception:
                value = None
        if value is None:
            value = default_value if default_value is not None else 0.0
        gc = GiftCard(code=code, initial_value=value, remaining_value=value)
        db.add(gc)
        created += 1
    db.commit()
    return {"imported": created}


class GiftCardAssignRequest(BaseModel):
    user_id: int


@router.post("/{gift_card_id}/assign-deliver", response_model=GiftCardRead)
def assign_and_deliver(gift_card_id: int, payload: GiftCardAssignRequest, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    gc = db.query(GiftCard).filter(GiftCard.id == gift_card_id).first()
    if not gc:
        raise HTTPException(status_code=404, detail="Gift card not found")
    if gc.user_id:
        raise HTTPException(status_code=400, detail="Already assigned")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user or not user.email:
        raise HTTPException(status_code=400, detail="User email required for delivery")
    gc.user_id = payload.user_id
    db.commit()
    db.refresh(gc)
    # Enqueue delivery email with real user email
    push_email_job("gift_card_delivery", to_email=user.email, data={
        "code": gc.code,
        "value": float(gc.remaining_value),
        "user_id": user.id,
    })
    return gc
