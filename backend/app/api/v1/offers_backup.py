from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from ...database import get_db
from ...models import Offer, Merchant, Category
from ...dependencies import require_admin
from ...redis_client import track_offer_click, get_trending_offer_ids
from pydantic import BaseModel
from datetime import datetime
from math import ceil

router = APIRouter(prefix="/offers", tags=["Offers"])

class OfferFilters(BaseModel):
    page: int = 1
    limit: int = 20
    merchant_id: int | None = None
    category_id: int | None = None
    offer_type: str | None = None
    is_exclusive: bool | None = None
    is_featured: bool | None = None
    sort: str | None = None
    search: str | None = None


@router.get("/", response_model=dict)
def list_offers(filters: OfferFilters = OfferFilters(), db: Session = Depends(get_db)):
    query = select(Offer).where(Offer.is_active == True)
    
    if filters.merchant_id:
        query = query.where(Offer.merchant_id == filters.merchant_id)
    if filters.category_id:
        query = query.where(Offer.category_id == filters.category_id)
    if filters.offer_type:
        query = query.where(Offer.offer_type == filters.offer_type)
    if filters.is_exclusive is not None:
        query = query.where(Offer.is_exclusive == filters.is_exclusive)
    if filters.search:
        query = query.where(Offer.title.ilike(f"%{filters.search}%"))
    
    # Sorting
    if filters.sort == "popular":
        query = query.order_by(Offer.clicks_count.desc())
    elif filters.sort == "latest":
        query = query.order_by(Offer.created_at.desc())
    else:
        query = query.order_by(Offer.priority.desc(), Offer.created_at.desc())
    
    # Count total
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Paginate
    offset = (filters.page - 1) * filters.limit
    query = query.offset(offset).limit(filters.limit)
    
    offers = db.scalars(query).all()
    
    offers_data = []
    for o in offers:
        merchant = db.get(Merchant, o.merchant_id)
        category = db.get(Category, o.category_id) if o.category_id else None
        
        offers_data.append({
            \"id\": o.id,
            \"uuid\": o.uuid,
            \"title\": o.title,
            \"description\": o.description,
            \"offer_type\": o.offer_type,
            \"coupon_code\": o.coupon_code,
            \"cashback_type\": o.cashback_type,
            \"cashback_value\": float(o.cashback_value or 0),
            \"max_cashback\": float(o.max_cashback or 0),
            \"merchant\": {
                \"id\": merchant.id,
                \"name\": merchant.name,
                \"slug\": merchant.slug,
                \"logo_url\": merchant.logo_url
            } if merchant else None,
            \"category\": {
                \"id\": category.id,
                \"name\": category.name,
                \"slug\": category.slug
            } if category else None,
            \"is_exclusive\": o.is_exclusive,
            \"is_verified\": o.is_verified,
            \"expires_at\": o.expires_at.isoformat() if o.expires_at else None,
            \"views_count\": o.views_count,
            \"clicks_count\": o.clicks_count,
        })
    
    return {
        \"success\": True,
        \"data\": {
            \"offers\": offers_data,
            \"pagination\": {
                \"current_page\": filters.page,
                \"total_pages\": ceil(total / filters.limit) if total else 0,
                \"total_items\": total,
                \"per_page\": filters.limit,
            },
        },
    }


@router.get("/{uuid}", response_model=dict)
def get_offer(uuid: str, db: Session = Depends(get_db)):
    offer = db.scalar(select(Offer).where(Offer.uuid == uuid, Offer.is_active == True))
    if not offer:
        return {"success": False, "error": "Offer not found"}
    
    merchant = db.get(Merchant, offer.merchant_id)
    category = db.get(Category, offer.category_id) if offer.category_id else None
    
    data = {
        "id": offer.id,
        "uuid": offer.uuid,
        "title": offer.title,
        "description": offer.description,
        "offer_type": offer.offer_type,
        "coupon_code": offer.coupon_code,
        "cashback_type": offer.cashback_type,
        "cashback_value": float(offer.cashback_value or 0),
        "max_cashback": float(offer.max_cashback or 0),
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "slug": merchant.slug,
            "logo_url": merchant.logo_url,
            "tracking_url": merchant.tracking_url
        } if merchant else None,
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug
        } if category else None,
        "is_exclusive": offer.is_exclusive,
        "is_verified": offer.is_verified,
        "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
        "terms": offer.terms,
        "views_count": offer.views_count,
        "clicks_count": offer.clicks_count,
    }
    return {"success": True, "data": data}


@router.post("/{uuid}/click", response_model=dict)
def click_offer(uuid: str, db: Session = Depends(get_db)):
    offer = db.scalar(select(Offer).where(Offer.uuid == uuid))
    if not offer:
        return {"success": False, "error": "Offer not found"}
    
    # Track click in Redis
    track_offer_click(offer.id)
    
    # Increment DB counter
    offer.clicks_count = (offer.clicks_count or 0) + 1
    db.commit()
    
    merchant = db.get(Merchant, offer.merchant_id)
    
    return {
        "success": True,
        "data": {
            "click_id": f"clk-{offer.id}-{datetime.utcnow().timestamp()}",
            "redirect_url": merchant.tracking_url if merchant else offer.link_url,
            "coupon_code": offer.coupon_code,
            "message": "Click tracked. Cashback will be credited after purchase confirmation.",
        },
    }


@router.post("/{uuid}/view", response_model=dict)
def view_offer(uuid: str):
    return {"success": True, "data": {"offer_uuid": uuid, "viewed_at": datetime.utcnow().isoformat() + "Z"}}

@router.get("/trending", response_model=dict, tags=["Offers"])
def trending_offers():
    ids = get_trending_offer_ids(10)
    return {"success": True, "data": {"offer_ids": ids}}
