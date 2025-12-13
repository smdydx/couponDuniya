from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import Inventory
from ...schemas import InventoryRead, InventoryUpdate
from ...dependencies import require_admin

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/", response_model=list[InventoryRead])
def list_inventory(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    return db.query(Inventory).all()

@router.put("/{inventory_id}", response_model=InventoryRead)
def update_inventory(inventory_id: int, payload: InventoryUpdate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    inv = db.query(Inventory).get(inventory_id)
    if not inv:
        return inv
    inv.quantity = payload.quantity
    if payload.reserved is not None:
        inv.reserved = payload.reserved
    db.commit()
    db.refresh(inv)
    return inv
