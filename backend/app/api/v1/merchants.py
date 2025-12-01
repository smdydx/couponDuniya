from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from ...database import get_db
from ...models import Merchant, Offer
from ...redis_client import cache_get, cache_set, cache_invalidate, cache_invalidate_prefix, rk
from ...dependencies import rate_limit_dependency
from pydantic import BaseModel
from math import ceil
import json, hashlib

router = APIRouter(prefix="/merchants", tags=["Merchants"])

class MerchantFilters(BaseModel):
    page: int = 1
    limit: int = 20
    category_id: int | None = None
    is_featured: bool | None = None
    search: str | None = None


@router.get("/")
def list_merchants(
    page: int = 1,
    limit: int = 20,
    is_featured: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("merchants:list", limit=60, window_seconds=60))
):
    """List all merchants with filtering and pagination"""
    cache_key = rk("cache", "merchants", hashlib.md5(json.dumps({"page": page, "limit": limit, "is_featured": is_featured, "search": search}, sort_keys=True).encode()).hexdigest())
    cached = cache_get(cache_key)
    if cached:
        return cached

    query = select(Merchant).where(Merchant.is_active == True)
    
    if is_featured is not None:
        query = query.where(Merchant.is_featured == is_featured)
    
    if search:
        query = query.where(Merchant.name.ilike(f"%{search}%"))
    
    # Count total
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    merchants = db.scalars(query).all()
    
    merchants_data = []
    for m in merchants:
        offers_count = db.scalar(select(func.count(Offer.id)).where(
            Offer.merchant_id == m.id,
            Offer.is_active == True
        ))
        merchants_data.append({
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
            "offers_count": offers_count,
        })
    
    response = {
        "success": True,
        "data": {
            "merchants": merchants_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total / limit) if total else 0,
                "total_items": total,
                "per_page": limit,
            },
        },
    }
    cache_set(cache_key, response, 300)
    return response


@router.get("/featured")
def featured_merchants(limit: int = 12, db: Session = Depends(get_db)):
    """Return featured merchants. Currently approximated using newest active merchants.
    When an explicit feature flag is added, filter on that instead.
    Cached for 5 minutes.
    """
    cache_key = rk("cache","merchants","featured",str(limit))
    cached = cache_get(cache_key)
    if cached:
        return cached
    query = (
        select(Merchant)
        .where(Merchant.is_active == True)
        .order_by(Merchant.created_at.desc())
        .limit(limit)
    )
    merchants = db.scalars(query).all()
    data = [
        {
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
        }
        for m in merchants
    ]
    response = {"success": True, "data": data}
    cache_set(cache_key, response, 300)
    return response


@router.get("/featured")
def featured_merchants(limit: int = 12, db: Session = Depends(get_db)):
    """Return a lightweight list of featured merchants.

    NOTE: The current schema does not include an explicit `is_featured` flag.
    Until a migration adds that column, we approximate "featured" merchants by
    selecting the most recently created active merchants (ordered by created_at desc).
    This allows the frontend to render a featured section without schema changes.
    """
    query = (
        select(Merchant)
        .where(Merchant.is_active == True)
        .order_by(Merchant.created_at.desc())
        .limit(limit)
    )
    merchants = db.scalars(query).all()
    data = [
        {
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
        }
        for m in merchants
    ]
    return {"success": True, "data": data}


@router.get("/{slug}")
def get_merchant(slug: str, db: Session = Depends(get_db)):
    """Get merchant by slug"""
    key = rk("cache", "merchant", slug)
    cached = cache_get(key)
    if cached:
        return {"success": True, "data": cached, "cache": True}
    
    merchant = db.scalar(select(Merchant).where(Merchant.slug == slug, Merchant.is_active == True))
    if not merchant:
        return {"success": False, "error": "Merchant not found"}
    
    offers_count = db.scalar(select(func.count(Offer.id)).where(
        Offer.merchant_id == merchant.id,
        Offer.is_active == True
    ))
    
    data = {
        "id": merchant.id,
        "name": merchant.name,
        "slug": merchant.slug,
        "description": merchant.description,
        "logo_url": merchant.logo_url,
        "active_offers_count": offers_count,
        "is_featured": merchant.is_featured,
    }
    cache_set(key, data, 3600)
    return {"success": True, "data": data, "cache": False}
