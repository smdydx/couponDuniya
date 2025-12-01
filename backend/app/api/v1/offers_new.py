from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from ...database import get_db
from ...models import Offer, Merchant
from pydantic import BaseModel

router = APIRouter(prefix="/offers", tags=["Offers"])

class OfferFilters(BaseModel):
    page: int = 1
    limit: int = 20
    merchant_id: int | None = None
    search: str | None = None


@router.get("/")
def list_offers(
    page: int = 1,
    limit: int = 20,
    merchant_id: int | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    """List all offers with filtering and pagination"""
    query = select(Offer, Merchant).join(Merchant).where(Offer.is_active == True)
    
    if merchant_id:
        query = query.where(Offer.merchant_id == merchant_id)
    if search:
        query = query.where(Offer.title.ilike(f"%{search}%"))
    
    # Order by priority and created date
    query = query.order_by(Offer.priority.desc(), Offer.created_at.desc())
    
    # Count total
    count_query = select(func.count()).select_from(Offer).where(Offer.is_active == True)
    if merchant_id:
        count_query = count_query.where(Offer.merchant_id == merchant_id)
    if search:
        count_query = count_query.where(Offer.title.ilike(f"%{search}%"))
    
    total = db.scalar(count_query)
    
    # Paginate
    offset = (page - 1) * limit
    results = db.execute(query.offset(offset).limit(limit)).all()
    
    # Format response
    offers = []
    for offer, merchant in results:
        offers.append({
            "id": offer.id,
            "title": offer.title,
            "code": offer.code,
            "merchant_id": offer.merchant_id,
            "is_active": offer.is_active,
            "priority": offer.priority,
            "starts_at": offer.starts_at.isoformat() if offer.starts_at else None,
            "ends_at": offer.ends_at.isoformat() if offer.ends_at else None,
            "created_at": offer.created_at.isoformat(),
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug
            }
        })
    
    return {
        "success": True,
        "data": offers,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/featured")
def featured_offers(limit: int = 12, db: Session = Depends(get_db)):
    """Return a list of 'featured' offers.

    Without an explicit is_featured flag in the schema we approximate
    featured offers by taking the highest priority active offers, then
    falling back to most recent if priorities are equal.
    """
    query = (
        select(Offer, Merchant)
        .join(Merchant)
        .where(Offer.is_active == True)
        .order_by(Offer.priority.desc(), Offer.created_at.desc())
        .limit(limit)
    )
    results = db.execute(query).all()
    data = [
        {
            "id": o.id,
            "title": o.title,
            "code": o.code,
            "merchant_id": o.merchant_id,
            "priority": o.priority,
            "created_at": o.created_at.isoformat(),
            "merchant": {"id": m.id, "name": m.name, "slug": m.slug},
        }
        for o, m in results
    ]
    return {"success": True, "data": data}


@router.get("/exclusive")
def exclusive_offers(limit: int = 12, db: Session = Depends(get_db)):
    """Return a list of 'exclusive' offers.

    Approximated using priority > 0. Adjust once is_exclusive column exists.
    """
    query = (
        select(Offer, Merchant)
        .join(Merchant)
        .where(Offer.is_active == True, Offer.priority > 0)
        .order_by(Offer.priority.desc(), Offer.created_at.desc())
        .limit(limit)
    )
    results = db.execute(query).all()
    data = [
        {
            "id": o.id,
            "title": o.title,
            "code": o.code,
            "merchant_id": o.merchant_id,
            "priority": o.priority,
            "created_at": o.created_at.isoformat(),
            "merchant": {"id": m.id, "name": m.name, "slug": m.slug},
        }
        for o, m in results
    ]
    return {"success": True, "data": data}


@router.get("/{offer_id}")
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    """Get single offer by ID"""
    result = db.execute(
        select(Offer, Merchant)
        .join(Merchant)
        .where(Offer.id == offer_id)
    ).first()
    
    if not result:
        return {"success": False, "error": "Offer not found"}
    
    offer, merchant = result
    return {
        "success": True,
        "data": {
            "id": offer.id,
            "title": offer.title,
            "code": offer.code,
            "merchant_id": offer.merchant_id,
            "is_active": offer.is_active,
            "priority": offer.priority,
            "starts_at": offer.starts_at.isoformat() if offer.starts_at else None,
            "ends_at": offer.ends_at.isoformat() if offer.ends_at else None,
            "created_at": offer.created_at.isoformat(),
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug,
                "description": merchant.description
            }
        }
    }
