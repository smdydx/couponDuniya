"""
Admin KYC Management Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from datetime import datetime
from math import ceil

from ...database import get_db
from ...models import UserKYC, User
from ...dependencies import require_admin
from pydantic import BaseModel

router = APIRouter(prefix="/admin/kyc", tags=["Admin KYC"])


class KYCVerificationAction(BaseModel):
    action: str  # "approve" or "reject"
    notes: str | None = None


@router.get("/pending")
def get_pending_kyc_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query("pending"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Get list of KYC requests by status"""
    import logging
    log = logging.getLogger(__name__)
    
    log.info(f"Admin {admin_user.id} fetching KYC requests with status: {status}")
    
    # Query KYC records with user details
    query = (
        select(UserKYC)
        .options(joinedload(UserKYC.user))
        .where(UserKYC.status == status)
        .order_by(UserKYC.submitted_at.desc())
    )
    
    # Count total
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Paginate
    offset = (page - 1) * limit
    kyc_records = db.scalars(query.offset(offset).limit(limit)).unique().all()
    
    log.info(f"Found {total} KYC requests with status '{status}'")
    
    # Build response
    kyc_list = []
    for kyc in kyc_records:
        kyc_list.append({
            "id": kyc.id,
            "user_id": kyc.user_id,
            "user": {
                "id": kyc.user.id,
                "email": kyc.user.email,
                "full_name": kyc.user.full_name,
                "mobile": kyc.user.mobile
            } if kyc.user else None,
            "pan_number": kyc.pan_number,
            "pan_verified": kyc.pan_verified,
            "aadhaar_number": kyc.aadhaar_number,
            "aadhaar_verified": kyc.aadhaar_verified,
            "account_holder_name": kyc.account_holder_name,
            "account_number": kyc.account_number,
            "ifsc_code": kyc.ifsc_code,
            "bank_name": kyc.bank_name,
            "upi_id": kyc.upi_id,
            "status": kyc.status,
            "submitted_at": kyc.submitted_at.isoformat() if kyc.submitted_at else None,
            "verified_at": kyc.verified_at.isoformat() if kyc.verified_at else None
        })
    
    return {
        "success": True,
        "data": {
            "kyc_requests": kyc_list,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total / limit) if total else 0,
                "total_items": total,
                "per_page": limit
            }
        }
    }


@router.post("/verify/{kyc_id}")
def verify_kyc_request(
    kyc_id: int,
    action_data: KYCVerificationAction,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Approve or reject a KYC request"""
    import logging
    log = logging.getLogger(__name__)
    
    # Validate action
    if action_data.action not in ["approve", "reject"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Use 'approve' or 'reject'"
        )
    
    # Get KYC record
    kyc = db.get(UserKYC, kyc_id)
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC request not found")
    
    # Get user
    user = db.get(User, kyc.user_id)
    
    log.info(f"Admin {admin_user.id} {action_data.action}ing KYC request {kyc_id} for user {kyc.user_id}")
    
    if action_data.action == "approve":
        kyc.status = "approved"
        kyc.pan_verified = True
        kyc.aadhaar_verified = True
        kyc.verified_at = datetime.utcnow()
        
        # Update user KYC status
        if user:
            user.kyc_status = "approved"
        
        message = "KYC request approved successfully"
        log.info(f"KYC {kyc_id} approved for user {kyc.user_id}")
    else:
        kyc.status = "rejected"
        kyc.pan_verified = False
        kyc.aadhaar_verified = False
        
        # Update user KYC status
        if user:
            user.kyc_status = "rejected"
        
        message = "KYC request rejected"
        log.info(f"KYC {kyc_id} rejected for user {kyc.user_id}")
    
    db.commit()
    db.refresh(kyc)
    if user:
        db.refresh(user)
    
    return {
        "success": True,
        "message": message,
        "data": {
            "kyc_id": kyc.id,
            "user_id": kyc.user_id,
            "status": kyc.status,
            "verified_at": kyc.verified_at.isoformat() if kyc.verified_at else None
        }
    }


@router.get("/stats")
def get_kyc_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Get KYC statistics"""
    pending_count = db.scalar(
        select(func.count(UserKYC.id)).where(UserKYC.status == "pending")
    )
    approved_count = db.scalar(
        select(func.count(UserKYC.id)).where(UserKYC.status == "approved")
    )
    rejected_count = db.scalar(
        select(func.count(UserKYC.id)).where(UserKYC.status == "rejected")
    )
    
    return {
        "success": True,
        "data": {
            "pending": pending_count or 0,
            "approved": approved_count or 0,
            "rejected": rejected_count or 0,
            "total": (pending_count or 0) + (approved_count or 0) + (rejected_count or 0)
        }
    }
