"""
Homepage API - Coupon & Cashback Platform
==========================================
Returns homepage data: banners, merchants, offers, gift cards.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, or_
from ...database import get_db
from ...models import Merchant, Offer, GiftCard
from ...models.banner import Banner
from ...redis_client import cache_get, cache_set, rk
import logging

router = APIRouter(tags=["Homepage"])
log = logging.getLogger(__name__)

@router.get("/homepage/", response_model=dict)
def get_homepage_data(
    limit_merchants: int = Query(12, ge=1, le=50),
    limit_featured_offers: int = Query(8, ge=1, le=50),
    limit_exclusive_offers: int = Query(6, ge=1, le=50),
    limit_gift_cards: int = Query(12, ge=1, le=50),
    limit_banners: int = Query(5, ge=1, le=20),
    limit_promo_banners: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get homepage data:
    - Hero banners/slider
    - Promo banners
    - Featured merchants
    - Featured offers
    - Exclusive offers
    - Featured gift cards
    """

    try:
        cache_key = rk("cache", "homepage", f"b{limit_banners}_m{limit_merchants}_fo{limit_featured_offers}_eo{limit_exclusive_offers}_gc{limit_gift_cards}_pb{limit_promo_banners}")
        cached = cache_get(cache_key)
        if cached:
            return {"success": True, "data": cached, "cached": True, "empty": False}

        # Fetch active banners (hero slider)
        banners_stmt = (
            select(Banner)
            .where(and_(Banner.is_active == True, Banner.banner_type == "hero"))
            .order_by(Banner.order_index.asc())
            .limit(limit_banners)
        )
        banners = db.scalars(banners_stmt).all()

        # Fetch promotional banners
        promo_banners_stmt = (
            select(Banner)
            .where(and_(Banner.is_active == True, Banner.banner_type == "promo"))
            .order_by(Banner.order_index.asc())
            .limit(limit_promo_banners)
        )
        promo_banners = db.scalars(promo_banners_stmt).all()

        # Fetch featured merchants
        merchants_stmt = (
            select(Merchant)
            .where(and_(Merchant.is_active == True, Merchant.is_featured == True))
            .limit(limit_merchants)
        )
        featured_merchants = db.scalars(merchants_stmt).all()

        # Fetch featured offers
        featured_offers_stmt = (
            select(Offer)
            .options(joinedload(Offer.merchant))
            .where(and_(Offer.is_active == True, Offer.is_featured == True))
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_featured_offers)
        )
        featured_offers = db.scalars(featured_offers_stmt).all()

        # Fetch exclusive offers
        exclusive_offers_stmt = (
            select(Offer)
            .options(joinedload(Offer.merchant))
            .where(and_(Offer.is_active == True, Offer.is_exclusive == True))
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_exclusive_offers)
        )
        exclusive_offers = db.scalars(exclusive_offers_stmt).all()

        # Fetch featured gift cards
        gift_cards_stmt = (
            select(GiftCard)
            .where(GiftCard.is_active == True)
            .order_by(GiftCard.created_at.desc())
            .limit(limit_gift_cards)
        )
        featured_gift_cards = db.scalars(gift_cards_stmt).all()

        # Build response
        result = {
            "banners": [
                {
                    "id": b.id,
                    "title": b.title or "",
                    "image_url": b.image_url or "",
                    "link_url": b.link_url or "",
                    "order_index": b.order_index or 0
                } for b in banners
            ],
            "promo_banners": [
                {
                    "id": b.id,
                    "title": b.title or "",
                    "brand_name": b.brand_name or "",
                    "badge_text": b.badge_text or "",
                    "badge_color": b.badge_color or "#7c3aed",
                    "headline": b.headline or "",
                    "description": b.description or "",
                    "code": b.code or "",
                    "link_url": b.link_url or "",
                    "metadata": b.style_metadata or {},
                    "order_index": b.order_index or 0
                }
                for b in promo_banners
            ],
            "featured_merchants": [
                {
                    "id": m.id,
                    "name": m.name,
                    "slug": m.slug,
                    "logo_url": m.logo_url,
                    "cashback_rate": str(m.commission_rate) if m.commission_rate else "0",
                    "offer_count": 0
                } for m in featured_merchants
            ],
            "featured_offers": [
                {
                    "id": o.id,
                    "title": o.title,
                    "code": o.code,
                    "image_url": o.image_url,
                    "merchant_name": o.merchant.name if o.merchant else None,
                    "merchant_logo": o.merchant.logo_url if o.merchant else None,
                    "end_date": o.end_date.isoformat() if o.end_date else None
                } for o in featured_offers
            ],
            "exclusive_offers": [
                {
                    "id": o.id,
                    "title": o.title,
                    "code": o.code,
                    "image_url": o.image_url,
                    "merchant_name": o.merchant.name if o.merchant else None,
                    "merchant_logo": o.merchant.logo_url if o.merchant else None,
                    "end_date": o.end_date.isoformat() if o.end_date else None
                } for o in exclusive_offers
            ],
            "featured_gift_cards": [
                {
                    "id": gc.id,
                    "code": gc.code,
                    "initial_value": str(gc.initial_value) if gc.initial_value else None,
                    "remaining_value": str(gc.remaining_value) if gc.remaining_value else None,
                    "expires_at": gc.expires_at.isoformat() if gc.expires_at else None
                } for gc in featured_gift_cards
            ],
            "stats": {
                "total_merchants": len(featured_merchants),
                "total_offers": len(featured_offers) + len(exclusive_offers),
                "total_gift_cards": len(featured_gift_cards),
                "total_banners": len(banners) + len(promo_banners)
            }
        }

        is_empty = all([
            len(result["banners"]) == 0,
            len(result["promo_banners"]) == 0,
            len(result["featured_merchants"]) == 0,
            len(result["featured_offers"]) == 0,
            len(result["exclusive_offers"]) == 0,
            len(result["featured_gift_cards"]) == 0
        ])

        cache_set(cache_key, result, ttl=120)

        return {
            "success": True,
            "data": result,
            "cached": False,
            "empty": is_empty,
            "message": "Run seed_homepage_data.py to populate data" if is_empty else "Homepage loaded successfully"
        }

    except HTTPException as e:
        log.error(f"Homepage API HTTP error: {e.detail}")
        raise e
    except Exception as e:
        log.error(f"Homepage API error: {e}")
        return {"success": False, "data": {}, "cached": False}
