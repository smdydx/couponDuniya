from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import Optional
from math import ceil

from ...database import get_db
from ...models import User
from ...models.review import ProductReview
from ...dependencies import get_current_admin, require_admin

router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])


@router.get("", response_model=dict)
def list_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = select(ProductReview)
    
    if status:
        query = query.where(ProductReview.status == status)
    
    if search:
        query = query.where(
            ProductReview.title.ilike(f"%{search}%") |
            ProductReview.review_text.ilike(f"%{search}%")
        )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(ProductReview.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    reviews = db.scalars(query).all()
    
    reviews_data = []
    for r in reviews:
        reviews_data.append({
            "id": r.id,
            "product_id": r.product_id,
            "user_id": r.user_id,
            "rating": r.rating,
            "title": r.title,
            "review_text": r.review_text,
            "status": r.status,
            "is_verified_purchase": r.is_verified_purchase,
            "helpful_count": r.helpful_count or 0,
            "report_count": r.report_count or 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    
    return {
        "success": True,
        "data": {
            "reviews": reviews_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total_count / limit) if total_count else 0,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.patch("/{review_id}/approve", response_model=dict)
def approve_review(
    review_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    review = db.scalar(select(ProductReview).where(ProductReview.id == review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.status = "approved"
    review.moderated_by = current_admin.id
    review.moderated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "message": "Review approved",
        "data": {"id": review.id, "status": review.status}
    }


@router.patch("/{review_id}/reject", response_model=dict)
def reject_review(
    review_id: int,
    rejection_reason: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    review = db.scalar(select(ProductReview).where(ProductReview.id == review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.status = "rejected"
    review.moderated_by = current_admin.id
    review.moderated_at = datetime.utcnow()
    if rejection_reason:
        review.moderation_notes = rejection_reason
    
    db.commit()
    
    return {
        "success": True,
        "message": "Review rejected",
        "data": {"id": review.id, "status": review.status}
    }


@router.delete("/{review_id}", response_model=dict)
def delete_review(
    review_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    review = db.scalar(select(ProductReview).where(ProductReview.id == review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    db.delete(review)
    db.commit()
    
    return {
        "success": True,
        "message": "Review deleted"
    }
