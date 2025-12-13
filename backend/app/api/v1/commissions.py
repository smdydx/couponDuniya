from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from math import ceil
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel
from ...database import get_db
from ...models import MerchantCommission, Merchant, User
from ...schemas import MerchantCommissionRead, MerchantCommissionCreate
from ...dependencies import require_admin, get_current_user

router = APIRouter(prefix="/commissions", tags=["Commissions"])


class CommissionUpdate(BaseModel):
    commission_type: str | None = None
    commission_value: float | None = None
    cashback_percentage: float | None = None
    valid_from: date | None = None
    valid_until: date | None = None


class CommissionStats(BaseModel):
    total_commissions: int
    total_value: float
    active_commissions: int
    expired_commissions: int


@router.get("/", response_model=list[MerchantCommissionRead])
def list_commissions(
    merchant_id: Optional[int] = None,
    active_only: bool = False,
    db: Session = Depends(get_db), 
    _: object = Depends(require_admin)
):
    """List all commissions with optional filtering"""
    query = select(MerchantCommission)
    
    if merchant_id:
        query = query.where(MerchantCommission.merchant_id == merchant_id)
    
    if active_only:
        today = date.today()
        query = query.where(
            (MerchantCommission.valid_from == None) | (MerchantCommission.valid_from <= today),
            (MerchantCommission.valid_until == None) | (MerchantCommission.valid_until >= today)
        )
    
    return db.scalars(query.order_by(MerchantCommission.created_at.desc())).all()


@router.get("/stats", response_model=CommissionStats)
def get_commission_stats(db: Session = Depends(get_db), _: object = Depends(require_admin)):
    """Get commission statistics"""
    today = date.today()
    
    total = db.scalar(select(func.count(MerchantCommission.id))) or 0
    total_value = db.scalar(select(func.sum(MerchantCommission.commission_value))) or 0.0
    
    active = db.scalar(
        select(func.count(MerchantCommission.id)).where(
            (MerchantCommission.valid_from == None) | (MerchantCommission.valid_from <= today),
            (MerchantCommission.valid_until == None) | (MerchantCommission.valid_until >= today)
        )
    ) or 0
    
    expired = db.scalar(
        select(func.count(MerchantCommission.id)).where(
            MerchantCommission.valid_until < today
        )
    ) or 0
    
    return CommissionStats(
        total_commissions=total,
        total_value=float(total_value),
        active_commissions=active,
        expired_commissions=expired
    )


@router.get("/{commission_id}", response_model=MerchantCommissionRead)
def get_commission(commission_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    """Get a single commission by ID"""
    commission = db.get(MerchantCommission, commission_id)
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    return commission


@router.post("/", response_model=MerchantCommissionRead)
def create_commission(payload: MerchantCommissionCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    """Create a new commission"""
    merchant = db.get(Merchant, payload.merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    mc = MerchantCommission(**payload.dict())
    db.add(mc)
    db.commit()
    db.refresh(mc)
    return mc


@router.put("/{commission_id}", response_model=MerchantCommissionRead)
def update_commission(
    commission_id: int, 
    payload: CommissionUpdate, 
    db: Session = Depends(get_db), 
    _: object = Depends(require_admin)
):
    """Update an existing commission"""
    commission = db.get(MerchantCommission, commission_id)
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(commission, key, value)
    
    db.commit()
    db.refresh(commission)
    return commission


@router.delete("/{commission_id}")
def delete_commission(commission_id: int, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    """Delete a commission"""
    commission = db.get(MerchantCommission, commission_id)
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    db.delete(commission)
    db.commit()
    return {"success": True, "message": "Commission deleted successfully"}


@router.get("/merchant/{merchant_id}/active")
def get_merchant_active_commissions(
    merchant_id: int, 
    db: Session = Depends(get_db)
):
    """Get active commissions for a merchant (public endpoint for displaying rates)"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    today = date.today()
    commissions = db.scalars(
        select(MerchantCommission).where(
            MerchantCommission.merchant_id == merchant_id,
            (MerchantCommission.valid_from == None) | (MerchantCommission.valid_from <= today),
            (MerchantCommission.valid_until == None) | (MerchantCommission.valid_until >= today)
        )
    ).all()
    
    return {
        "success": True,
        "data": {
            "merchant_id": merchant_id,
            "merchant_name": merchant.name,
            "base_commission_rate": float(merchant.commission_rate) if merchant.commission_rate else 0.0,
            "base_cashback_rate": float(merchant.cashback_rate) if merchant.cashback_rate else 0.0,
            "commissions": [
                {
                    "id": c.id,
                    "category_id": c.category_id,
                    "commission_type": c.commission_type,
                    "commission_value": float(c.commission_value),
                    "cashback_percentage": float(c.cashback_percentage or 0),
                    "valid_from": c.valid_from.isoformat() if c.valid_from else None,
                    "valid_until": c.valid_until.isoformat() if c.valid_until else None
                } for c in commissions
            ]
        }
    }
