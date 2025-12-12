"""
Admin API - Coupon & Cashback Platform
=======================================
Admin endpoints for managing merchants, offers, gift cards, users, and withdrawals.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_
from datetime import datetime, timedelta
from decimal import Decimal
from math import ceil
from pydantic import BaseModel, Field

from ...redis_client import cache_invalidate_prefix, rk, redis_client
from ...database import get_db
from ...models import User, Withdrawal, WalletTransaction, Merchant, Offer, Category, GiftCard, Banner
from ...queue import push_email_job, push_sms_job
from ...config import get_settings
from ...dependencies import get_current_admin, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])
settings = get_settings()


# ============== PAYLOAD SCHEMAS ==============

class MerchantPayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    logo_url: str | None = None
    website_url: str | None = None
    cashback_rate: float | None = None
    is_active: bool = True
    is_featured: bool = False


class OfferPayload(BaseModel):
    merchant_id: int
    title: str = Field(..., min_length=1)
    description: str | None = None
    code: str | None = None
    discount_type: str | None = None
    discount_value: float | None = None
    image_url: str | None = None
    priority: int = Field(default=0, ge=0)
    is_active: bool = True
    is_featured: bool = False
    is_exclusive: bool = False


class GiftCardBulkCreatePayload(BaseModel):
    count: int = Field(..., ge=1, le=1000)
    value: float = Field(..., gt=0)
    expires_in_days: int | None = None


class GiftCardUpdatePayload(BaseModel):
    is_active: bool | None = None
    remaining_value: float | None = None


class BannerPayload(BaseModel):
    title: str = Field(..., min_length=1)
    image_url: str | None = None
    link_url: str | None = None
    banner_type: str = "hero"
    order_index: int = 0
    is_active: bool = True


# ============== DASHBOARD ==============

@router.get("/dashboard", response_model=dict)
def get_dashboard_stats(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    # Core stats
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    active_merchants = db.scalar(select(func.count()).select_from(Merchant).where(Merchant.is_active == True)) or 0
    active_offers = db.scalar(select(func.count()).select_from(Offer).where(Offer.is_active == True)) or 0
    active_gift_cards = db.scalar(select(func.count()).select_from(GiftCard).where(GiftCard.is_active == True)) or 0
    
    # Recent activity
    new_users_30d = db.scalar(
        select(func.count()).select_from(User).where(User.created_at >= thirty_days_ago)
    ) or 0
    
    # Pending withdrawals
    pending_withdrawals = db.scalar(
        select(func.count()).select_from(Withdrawal).where(Withdrawal.status == "pending")
    ) or 0
    
    return {
        "success": True,
        "data": {
            "users": {
                "total": total_users,
                "new_30d": new_users_30d
            },
            "merchants": {
                "active": active_merchants
            },
            "offers": {
                "active": active_offers
            },
            "gift_cards": {
                "active": active_gift_cards
            },
            "withdrawals": {
                "pending": pending_withdrawals
            }
        }
    }


# ============== MERCHANTS ==============

@router.post("/merchants", response_model=dict)
def create_merchant(
    payload: MerchantPayload,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new merchant"""
    existing = db.scalar(select(Merchant).where(Merchant.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Merchant with slug '{payload.slug}' already exists")

    merchant = Merchant(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        logo_url=payload.logo_url,
        website_url=payload.website_url,
        cashback_rate=Decimal(str(payload.cashback_rate)) if payload.cashback_rate else None,
        is_active=payload.is_active,
        is_featured=payload.is_featured
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' created successfully",
        "data": {"id": merchant.id, "name": merchant.name, "slug": merchant.slug}
    }


@router.get("/merchants", response_model=dict)
def list_admin_merchants(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all merchants with pagination"""
    query = select(Merchant)

    if search:
        query = query.where(Merchant.name.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.where(Merchant.is_active == is_active)

    count_query = select(func.count()).select_from(Merchant)
    if search:
        count_query = count_query.where(Merchant.name.ilike(f"%{search}%"))
    if is_active is not None:
        count_query = count_query.where(Merchant.is_active == is_active)

    total_count = db.scalar(count_query) or 0
    query = query.order_by(desc(Merchant.created_at)).offset((page - 1) * limit).limit(limit)
    merchants = db.scalars(query).all()

    # Get offer counts
    merchant_ids = [m.id for m in merchants]
    offers_query = (
        select(Offer.merchant_id, func.count(Offer.id))
        .where(Offer.merchant_id.in_(merchant_ids), Offer.is_active == True)
        .group_by(Offer.merchant_id)
    )
    offers_counts = {mid: cnt for mid, cnt in db.execute(offers_query).all()}

    merchants_data = [{
        "id": m.id,
        "name": m.name,
        "slug": m.slug,
        "logo_url": m.logo_url,
        "cashback_rate": str(m.cashback_rate) if m.cashback_rate else None,
        "is_active": m.is_active,
        "is_featured": m.is_featured,
        "offers_count": offers_counts.get(m.id, 0),
        "created_at": m.created_at.isoformat() if m.created_at else None,
    } for m in merchants]

    return {
        "success": True,
        "merchants": merchants_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


@router.put("/merchants/{id}", response_model=dict)
def update_merchant(
    id: int,
    payload: MerchantPayload,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a merchant"""
    merchant = db.scalar(select(Merchant).where(Merchant.id == id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if payload.slug != merchant.slug:
        existing = db.scalar(select(Merchant).where(and_(Merchant.slug == payload.slug, Merchant.id != id)))
        if existing:
            raise HTTPException(status_code=400, detail=f"Merchant with slug '{payload.slug}' already exists")

    merchant.name = payload.name
    merchant.slug = payload.slug
    merchant.description = payload.description
    merchant.logo_url = payload.logo_url
    merchant.website_url = payload.website_url
    merchant.cashback_rate = Decimal(str(payload.cashback_rate)) if payload.cashback_rate else None
    merchant.is_active = payload.is_active
    merchant.is_featured = payload.is_featured

    db.commit()
    cache_invalidate_prefix(rk("cache", "merchants"))

    return {"success": True, "message": f"Merchant '{merchant.name}' updated successfully"}


@router.delete("/merchants/{id}", response_model=dict)
def delete_merchant(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Soft delete a merchant"""
    merchant = db.scalar(select(Merchant).where(Merchant.id == id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.is_active = False
    db.commit()
    cache_invalidate_prefix(rk("cache", "merchants"))

    return {"success": True, "message": f"Merchant '{merchant.name}' deactivated"}


# ============== OFFERS ==============

@router.get("/offers", response_model=dict)
def list_admin_offers(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    merchant_id: int | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all offers with pagination"""
    query = select(Offer)

    if search:
        query = query.where(or_(Offer.title.ilike(f"%{search}%"), Offer.code.ilike(f"%{search}%")))
    if merchant_id:
        query = query.where(Offer.merchant_id == merchant_id)
    if is_active is not None:
        query = query.where(Offer.is_active == is_active)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(Offer.created_at)).offset((page - 1) * limit).limit(limit)
    offers = db.scalars(query).all()

    offers_data = [{
        "id": o.id,
        "title": o.title,
        "code": o.code,
        "discount_type": o.discount_type,
        "discount_value": str(o.discount_value) if o.discount_value else None,
        "is_active": o.is_active,
        "is_featured": o.is_featured,
        "merchant_id": o.merchant_id,
        "created_at": o.created_at.isoformat() if o.created_at else None,
    } for o in offers]

    return {
        "success": True,
        "offers": offers_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


@router.post("/offers", response_model=dict)
def create_offer(payload: OfferPayload, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Create a new offer"""
    merchant = db.scalar(select(Merchant).where(Merchant.id == payload.merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    offer = Offer(
        merchant_id=payload.merchant_id,
        title=payload.title,
        description=payload.description,
        code=payload.code,
        discount_type=payload.discount_type,
        discount_value=Decimal(str(payload.discount_value)) if payload.discount_value else None,
        image_url=payload.image_url,
        priority=payload.priority,
        is_active=payload.is_active,
        is_featured=payload.is_featured,
        is_exclusive=payload.is_exclusive
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    cache_invalidate_prefix(rk("cache", "offers"))
    return {"success": True, "message": "Offer created successfully", "data": {"id": offer.id}}


@router.put("/offers/{id}", response_model=dict)
def update_offer(id: int, payload: OfferPayload, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Update an offer"""
    offer = db.scalar(select(Offer).where(Offer.id == id))
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.merchant_id = payload.merchant_id
    offer.title = payload.title
    offer.description = payload.description
    offer.code = payload.code
    offer.discount_type = payload.discount_type
    offer.discount_value = Decimal(str(payload.discount_value)) if payload.discount_value else None
    offer.image_url = payload.image_url
    offer.priority = payload.priority
    offer.is_active = payload.is_active
    offer.is_featured = payload.is_featured
    offer.is_exclusive = payload.is_exclusive

    db.commit()
    cache_invalidate_prefix(rk("cache", "offers"))
    return {"success": True, "message": "Offer updated successfully"}


@router.delete("/offers/{id}", response_model=dict)
def delete_offer(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Soft delete an offer"""
    offer = db.scalar(select(Offer).where(Offer.id == id))
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.is_active = False
    db.commit()
    cache_invalidate_prefix(rk("cache", "offers"))
    return {"success": True, "message": "Offer deactivated"}


# ============== GIFT CARDS ==============

@router.get("/gift-cards", response_model=dict)
def list_admin_gift_cards(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    status: str | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all gift cards with code, value, status"""
    query = select(GiftCard)

    if search:
        query = query.where(GiftCard.code.ilike(f"%{search}%"))
    
    # Filter by status
    if status == "active":
        query = query.where(and_(GiftCard.is_active == True, GiftCard.remaining_value > 0))
    elif status == "used":
        query = query.where(GiftCard.remaining_value == 0)
    elif status == "expired":
        query = query.where(and_(GiftCard.expires_at != None, GiftCard.expires_at < datetime.utcnow()))

    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(GiftCard.created_at)).offset((page - 1) * limit).limit(limit)
    gift_cards = db.scalars(query).all()

    cards_data = [{
        "id": gc.id,
        "code": gc.code,
        "initial_value": float(gc.initial_value) if gc.initial_value else 0,
        "remaining_value": float(gc.remaining_value) if gc.remaining_value else 0,
        "user_id": gc.user_id,
        "is_active": gc.is_active,
        "expires_at": gc.expires_at.isoformat() if gc.expires_at else None,
        "created_at": gc.created_at.isoformat() if gc.created_at else None,
    } for gc in gift_cards]

    return {
        "success": True,
        "data": {
            "gift_cards": cards_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total_count / limit) if total_count else 0,
                "total_items": total_count,
                "per_page": limit,
            },
        }
    }


@router.get("/gift-cards/stats", response_model=dict)
def get_gift_card_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Get gift card statistics"""
    total_cards = db.scalar(select(func.count()).select_from(GiftCard)) or 0
    active_cards = db.scalar(
        select(func.count()).select_from(GiftCard).where(
            and_(GiftCard.is_active == True, GiftCard.remaining_value > 0)
        )
    ) or 0
    assigned_cards = db.scalar(
        select(func.count()).select_from(GiftCard).where(GiftCard.user_id != None)
    ) or 0
    total_value = db.scalar(select(func.sum(GiftCard.initial_value))) or 0
    redeemed_value = db.scalar(
        select(func.sum(GiftCard.initial_value - GiftCard.remaining_value))
    ) or 0
    available_value = db.scalar(select(func.sum(GiftCard.remaining_value))) or 0

    return {
        "total_cards": total_cards,
        "active_cards": active_cards,
        "assigned_cards": assigned_cards,
        "total_value": float(total_value),
        "redeemed_value": float(redeemed_value),
        "available_value": float(available_value),
    }


@router.post("/gift-cards/bulk-create", response_model=dict)
def bulk_create_gift_cards(
    payload: GiftCardBulkCreatePayload,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create multiple gift cards with auto-generated codes"""
    import secrets
    
    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=payload.expires_in_days)
    
    created_cards = []
    for _ in range(payload.count):
        # Generate unique code
        for attempt in range(5):
            code = secrets.token_hex(8).upper()
            if not db.scalar(select(GiftCard).where(GiftCard.code == code)):
                break
        
        gc = GiftCard(
            code=code,
            initial_value=payload.value,
            remaining_value=payload.value,
            expires_at=expires_at,
            is_active=True
        )
        db.add(gc)
        created_cards.append(gc)
    
    db.commit()
    
    cards_data = [{
        "id": gc.id,
        "code": gc.code,
        "initial_value": float(gc.initial_value),
        "remaining_value": float(gc.remaining_value),
        "is_active": gc.is_active,
        "expires_at": gc.expires_at.isoformat() if gc.expires_at else None,
        "created_at": gc.created_at.isoformat() if gc.created_at else None,
    } for gc in created_cards]

    return {
        "success": True,
        "created_count": len(created_cards),
        "gift_cards": cards_data
    }


@router.patch("/gift-cards/{id}", response_model=dict)
def update_gift_card(
    id: int,
    payload: GiftCardUpdatePayload,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a gift card"""
    gift_card = db.scalar(select(GiftCard).where(GiftCard.id == id))
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    if payload.is_active is not None:
        gift_card.is_active = payload.is_active
    if payload.remaining_value is not None:
        gift_card.remaining_value = payload.remaining_value

    db.commit()
    return {"success": True, "message": "Gift card updated"}


@router.delete("/gift-cards/{id}", response_model=dict)
def delete_gift_card(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Soft delete a gift card"""
    gift_card = db.scalar(select(GiftCard).where(GiftCard.id == id))
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    gift_card.is_active = False
    db.commit()
    return {"success": True, "message": "Gift card deactivated"}


# ============== USERS ==============

@router.get("/users", response_model=dict)
def list_admin_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users"""
    query = select(User)

    if search:
        query = query.where(or_(User.email.ilike(f"%{search}%"), User.name.ilike(f"%{search}%")))
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    users = db.scalars(query).all()

    users_data = [{
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "phone": u.phone,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        "role": u.role,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in users]

    return {
        "success": True,
        "users": users_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


# ============== BANNERS ==============

@router.get("/banners", response_model=dict)
def list_admin_banners(
    page: int = 1,
    limit: int = 20,
    banner_type: str | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all banners"""
    query = select(Banner)
    if banner_type:
        query = query.where(Banner.banner_type == banner_type)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(Banner.order_index.asc()).offset((page - 1) * limit).limit(limit)
    banners = db.scalars(query).all()

    banners_data = [{
        "id": b.id,
        "title": b.title,
        "image_url": b.image_url,
        "link_url": b.link_url,
        "banner_type": b.banner_type,
        "order_index": b.order_index,
        "is_active": b.is_active,
    } for b in banners]

    return {
        "success": True,
        "banners": banners_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


@router.post("/banners", response_model=dict)
def create_banner(payload: BannerPayload, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Create a new banner"""
    banner = Banner(
        title=payload.title,
        image_url=payload.image_url,
        link_url=payload.link_url,
        banner_type=payload.banner_type,
        order_index=payload.order_index,
        is_active=payload.is_active
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)

    return {"success": True, "message": "Banner created", "data": {"id": banner.id}}


@router.put("/banners/{id}", response_model=dict)
def update_banner(id: int, payload: BannerPayload, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Update a banner"""
    banner = db.scalar(select(Banner).where(Banner.id == id))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    banner.title = payload.title
    banner.image_url = payload.image_url
    banner.link_url = payload.link_url
    banner.banner_type = payload.banner_type
    banner.order_index = payload.order_index
    banner.is_active = payload.is_active

    db.commit()
    return {"success": True, "message": "Banner updated"}


@router.delete("/banners/{id}", response_model=dict)
def delete_banner(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Delete a banner"""
    banner = db.scalar(select(Banner).where(Banner.id == id))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    banner.is_active = False
    db.commit()
    return {"success": True, "message": "Banner deactivated"}


# ============== WITHDRAWALS ==============

@router.get("/withdrawals", response_model=dict)
def list_admin_withdrawals(
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all withdrawal requests"""
    query = select(Withdrawal)
    if status:
        query = query.where(Withdrawal.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_query) or 0
    
    query = query.order_by(desc(Withdrawal.created_at)).offset((page - 1) * limit).limit(limit)
    withdrawals = db.scalars(query).all()

    withdrawals_data = [{
        "id": w.id,
        "user_id": w.user_id,
        "amount": str(w.amount) if w.amount else None,
        "status": w.status,
        "created_at": w.created_at.isoformat() if w.created_at else None,
    } for w in withdrawals]

    return {
        "success": True,
        "withdrawals": withdrawals_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


@router.put("/withdrawals/{id}/approve", response_model=dict)
def approve_withdrawal(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Approve a withdrawal request"""
    withdrawal = db.scalar(select(Withdrawal).where(Withdrawal.id == id))
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="Withdrawal is not pending")

    withdrawal.status = "approved"
    db.commit()
    return {"success": True, "message": "Withdrawal approved"}


@router.put("/withdrawals/{id}/reject", response_model=dict)
def reject_withdrawal(id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Reject a withdrawal request"""
    withdrawal = db.scalar(select(Withdrawal).where(Withdrawal.id == id))
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="Withdrawal is not pending")

    withdrawal.status = "rejected"
    db.commit()
    return {"success": True, "message": "Withdrawal rejected"}
