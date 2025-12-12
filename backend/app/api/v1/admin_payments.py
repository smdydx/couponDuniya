from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import Optional
from math import ceil

from ...database import get_db
from ...models.payment import Payment
from ...dependencies import require_admin

router = APIRouter(prefix="/admin/payments", tags=["Admin Payments"])


@router.get("", response_model=dict)
def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = select(Payment)
    
    if status:
        query = query.where(Payment.status == status)
    
    if search:
        query = query.where(
            Payment.gateway_payment_id.ilike(f"%{search}%") |
            Payment.gateway_order_id.ilike(f"%{search}%")
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(Payment.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    payments = db.scalars(query).all()
    
    payments_data = []
    for p in payments:
        payments_data.append({
            "id": p.id,
            "order_id": p.order_id,
            "user_id": p.user_id,
            "amount": float(p.amount) if p.amount else 0,
            "gateway": p.gateway,
            "gateway_payment_id": p.gateway_payment_id,
            "gateway_order_id": p.gateway_order_id,
            "status": p.status,
            "payment_method": p.payment_method,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        })
    
    return {
        "success": True,
        "data": {
            "payments": payments_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total_count / limit) if total_count else 0,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.get("/{payment_id}", response_model=dict)
def get_payment_detail(
    payment_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    payment = db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "success": True,
        "data": {
            "id": payment.id,
            "order_id": payment.order_id,
            "user_id": payment.user_id,
            "amount": float(payment.amount) if payment.amount else 0,
            "currency": payment.currency,
            "gateway": payment.gateway,
            "gateway_payment_id": payment.gateway_payment_id,
            "gateway_order_id": payment.gateway_order_id,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None,
            "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        }
    }


@router.get("/stats/summary", response_model=dict)
def get_payment_stats(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_payments = db.scalar(select(func.count()).select_from(Payment)) or 0
    completed_payments = db.scalar(
        select(func.count()).select_from(Payment).where(Payment.status == "completed")
    ) or 0
    pending_payments = db.scalar(
        select(func.count()).select_from(Payment).where(Payment.status == "pending")
    ) or 0
    failed_payments = db.scalar(
        select(func.count()).select_from(Payment).where(Payment.status == "failed")
    ) or 0
    
    total_amount = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == "completed")
    ) or 0
    
    return {
        "success": True,
        "data": {
            "total_payments": total_payments,
            "completed_payments": completed_payments,
            "pending_payments": pending_payments,
            "failed_payments": failed_payments,
            "total_amount": float(total_amount),
        }
    }
