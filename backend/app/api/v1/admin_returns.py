from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import Optional
from math import ceil

from ...database import get_db
from ...models import User
from ...models.returns import ReturnRequest, Refund
from ...dependencies import get_current_admin, require_admin

router = APIRouter(prefix="/admin/returns", tags=["Admin Returns"])


@router.get("", response_model=dict)
def list_returns(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = select(ReturnRequest)
    
    if status:
        query = query.where(ReturnRequest.status == status)
    
    if search:
        query = query.where(
            ReturnRequest.return_number.ilike(f"%{search}%") |
            ReturnRequest.product_name.ilike(f"%{search}%")
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(ReturnRequest.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    returns = db.scalars(query).all()
    
    returns_data = []
    for r in returns:
        returns_data.append({
            "id": r.id,
            "return_number": r.return_number,
            "order_id": r.order_id,
            "user_id": r.user_id,
            "return_type": r.return_type,
            "return_reason": r.return_reason,
            "product_name": r.product_name,
            "quantity": r.quantity,
            "refund_amount": float(r.refund_amount) if r.refund_amount else 0,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        })
    
    return {
        "success": True,
        "data": {
            "returns": returns_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total_count / limit) if total_count else 0,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.get("/{return_id}", response_model=dict)
def get_return_detail(
    return_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return_req = db.scalar(select(ReturnRequest).where(ReturnRequest.id == return_id))
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    return {
        "success": True,
        "data": {
            "id": return_req.id,
            "return_number": return_req.return_number,
            "rma_number": return_req.rma_number,
            "order_id": return_req.order_id,
            "user_id": return_req.user_id,
            "return_type": return_req.return_type,
            "return_reason": return_req.return_reason,
            "return_reason_detail": return_req.return_reason_detail,
            "product_name": return_req.product_name,
            "quantity": return_req.quantity,
            "item_price": float(return_req.item_price) if return_req.item_price else 0,
            "return_amount": float(return_req.return_amount) if return_req.return_amount else 0,
            "refund_amount": float(return_req.refund_amount) if return_req.refund_amount else 0,
            "status": return_req.status,
            "refund_method": return_req.refund_method,
            "refund_status": return_req.refund_status,
            "customer_notes": return_req.customer_notes,
            "internal_notes": return_req.internal_notes,
            "created_at": return_req.created_at.isoformat() if return_req.created_at else None,
            "updated_at": return_req.updated_at.isoformat() if return_req.updated_at else None,
        }
    }


@router.patch("/{return_id}/approve", response_model=dict)
def approve_return(
    return_id: int,
    admin_notes: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return_req = db.scalar(select(ReturnRequest).where(ReturnRequest.id == return_id))
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    return_req.status = "approved"
    return_req.approved_by = current_admin.id
    return_req.approved_at = datetime.utcnow()
    if admin_notes:
        return_req.internal_notes = admin_notes
    return_req.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Return request approved",
        "data": {"id": return_req.id, "status": return_req.status}
    }


@router.patch("/{return_id}/reject", response_model=dict)
def reject_return(
    return_id: int,
    rejection_reason: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return_req = db.scalar(select(ReturnRequest).where(ReturnRequest.id == return_id))
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    return_req.status = "rejected"
    return_req.rejected_by = current_admin.id
    return_req.rejected_at = datetime.utcnow()
    if rejection_reason:
        return_req.rejection_reason = rejection_reason
    return_req.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Return request rejected",
        "data": {"id": return_req.id, "status": return_req.status}
    }
