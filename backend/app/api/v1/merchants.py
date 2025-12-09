from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import Optional

from ...database import get_db
from ...models import Merchant, Offer, User
from ...redis_client import cache_get, cache_set, cache_invalidate, cache_invalidate_prefix, rk
from ...dependencies import rate_limit_dependency, get_current_user, require_admin
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
    current_user: User = Depends(get_current_user),
    _: dict = Depends(rate_limit_dependency("merchants:list", limit=100, window_seconds=60))
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
def featured_merchants(limit: int = 12, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def featured_merchants(limit: int = 12, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
def get_merchant(slug: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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


# Merchant modification endpoints - protected by require_admin
@router.post("/")
def create_merchant(
    merchant_data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Create a new merchant"""
    # Basic validation - you might want to use Pydantic models for more robust validation
    if not all(k in merchant_data for k in ("name", "slug", "description", "logo_url")):
        raise HTTPException(status_code=400, detail="Missing required fields")

    if db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"])):
        raise HTTPException(status_code=400, detail="Merchant slug already exists")

    new_merchant = Merchant(**merchant_data)
    db.add(new_merchant)
    db.commit()
    db.refresh(new_merchant)

    # Invalidate cache for merchant list and featured merchants
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))


    return {"success": True, "data": new_merchant}

@router.put("/{merchant_id}")
def update_merchant(
    merchant_id: int,
    merchant_data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Update an existing merchant"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Check if slug is being changed and if the new slug already exists
    if "slug" in merchant_data and merchant_data["slug"] != merchant.slug:
        if db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"])):
            raise HTTPException(status_code=400, detail="Merchant slug already exists")

    for key, value in merchant_data.items():
        setattr(merchant, key, value)

    db.commit()
    db.refresh(merchant)

    # Invalidate cache
    cache_invalidate(rk("cache", "merchant", merchant.slug))
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))


    return {"success": True, "data": merchant}

@router.delete("/{merchant_id}")
def delete_merchant(
    merchant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Delete a merchant (soft delete)"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.is_active = False
    db.commit()
    db.refresh(merchant)

    # Invalidate cache
    cache_invalidate(rk("cache", "merchant", merchant.slug))
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))


    return {"success": True, "message": "Merchant deleted successfully"}