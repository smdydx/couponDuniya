"""
Homepage API - Coupon & Cashback Platform
==========================================
Returns homepage data: banners, merchants, offers, products.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func
from ...database import get_db
from ...models import Merchant, Offer
from ...models.banner import Banner
from ...models.product import Product, ProductVariant
from ...redis_client import cache_get, cache_set, rk
import logging

router = APIRouter(tags=["Homepage"])
log = logging.getLogger(__name__)

@router.get("/homepage/", response_model=dict)
def get_homepage_data(
    limit_merchants: int = Query(12, ge=1, le=50),
    limit_featured_offers: int = Query(8, ge=1, le=50),
    limit_exclusive_offers: int = Query(6, ge=1, le=50),
    limit_products: int = Query(12, ge=1, le=50),
    limit_banners: int = Query(5, ge=1, le=20),
    limit_promo_banners: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Get homepage data:
    - Hero banners/slider
    - Promo banners
    - Featured merchants (with offer counts)
    - Featured offers (with full merchant info)
    - Exclusive offers (with full merchant info)
    - Featured products (with variants and merchant)
    """

    try:
        cache_key = rk("cache", "homepage", f"v2_b{limit_banners}_m{limit_merchants}_fo{limit_featured_offers}_eo{limit_exclusive_offers}_p{limit_products}_pb{limit_promo_banners}")
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

        # Fetch featured merchants with offer counts
        merchants_stmt = (
            select(Merchant)
            .where(and_(Merchant.is_active == True, Merchant.is_featured == True))
            .limit(limit_merchants)
        )
        featured_merchants = db.scalars(merchants_stmt).all()

        # Get offer counts for merchants
        merchant_offer_counts = {}
        if featured_merchants:
            merchant_ids = [m.id for m in featured_merchants]
            counts = db.execute(
                select(Offer.merchant_id, func.count(Offer.id))
                .where(and_(Offer.merchant_id.in_(merchant_ids), Offer.is_active == True))
                .group_by(Offer.merchant_id)
            ).all()
            merchant_offer_counts = {row[0]: row[1] for row in counts}

        # Fetch featured offers with full merchant info
        featured_offers_stmt = (
            select(Offer)
            .options(joinedload(Offer.merchant))
            .where(and_(Offer.is_active == True, Offer.is_featured == True))
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_featured_offers)
        )
        featured_offers = db.scalars(featured_offers_stmt).unique().all()

        # Fetch exclusive offers with full merchant info
        exclusive_offers_stmt = (
            select(Offer)
            .options(joinedload(Offer.merchant))
            .where(and_(Offer.is_active == True, Offer.is_exclusive == True))
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_exclusive_offers)
        )
        exclusive_offers = db.scalars(exclusive_offers_stmt).unique().all()

        # Fetch featured products with variants and merchant
        products_stmt = (
            select(Product)
            .options(joinedload(Product.variants), joinedload(Product.merchant))
            .where(and_(Product.is_active == True, Product.is_featured == True))
            .order_by(Product.display_order.asc(), Product.created_at.desc())
            .limit(limit_products)
        )
        featured_products = db.scalars(products_stmt).unique().all()

        # Build response with full data structures

        # Serialize offers with full schema matching frontend Offer type
        def serialize_offer(o: Offer) -> dict:
            return {
                "id": o.id,
                "merchant_id": o.merchant_id,
                "title": o.title,
                "description": getattr(o, 'description', None),
                "image_url": o.image_url,
                "offer_type": getattr(o, 'offer_type', 'code') or 'code',
                "coupon_code": o.code,
                "discount_type": getattr(o, 'discount_type', None),
                "discount_value": float(getattr(o, 'discount_value', 0) or 0),
                "cashback_type": getattr(o, 'cashback_type', None),
                "cashback_value": float(getattr(o, 'cashback_value', 0) or 0),
                "min_order_value": float(getattr(o, 'min_order_value', 0) or 0),
                "max_discount": float(getattr(o, 'max_discount', 0) or 0),
                "affiliate_url": getattr(o, 'affiliate_url', None) or getattr(o, 'tracking_url', None) or "",
                "start_date": o.start_date.isoformat() if o.start_date else None,
                "end_date": o.end_date.isoformat() if o.end_date else None,
                "is_exclusive": o.is_exclusive,
                "is_verified": getattr(o, 'is_verified', False),
                "is_featured": o.is_featured,
                "is_active": o.is_active,
                "click_count": getattr(o, 'click_count', 0) or 0,
                "success_count": getattr(o, 'success_count', 0) or 0,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "updated_at": getattr(o, 'updated_at', None).isoformat() if getattr(o, 'updated_at', None) else None,
                "merchant": {
                    "id": o.merchant.id,
                    "name": o.merchant.name,
                    "slug": o.merchant.slug,
                    "logo_url": o.merchant.logo_url,
                    "is_featured": o.merchant.is_featured,
                    "is_active": o.merchant.is_active,
                } if o.merchant else None
            }

        # Serialize products with variants matching frontend Product type
        def serialize_product(p: Product) -> dict:
            return {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "sku": p.sku,
                "description": p.description,
                "image_url": p.image_url,
                "merchant_id": p.merchant_id,
                "category_id": getattr(p, 'category_id', None),
                "category": {
                    "id": p.category.id,
                    "name": p.category.name,
                    "slug": p.category.slug,
                    "is_active": p.category.is_active,
                    "display_order": getattr(p.category, 'display_order', 0),
                } if getattr(p, 'category', None) else None,
                "is_bestseller": p.is_bestseller,
                "is_active": p.is_active,
                "is_featured": getattr(p, 'is_featured', False),
                "terms_conditions": p.terms_conditions,
                "how_to_redeem": p.how_to_redeem,
                "validity_info": p.validity_info,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": getattr(p, 'updated_at', None).isoformat() if getattr(p, 'updated_at', None) else None,
                "merchant": {
                    "id": p.merchant.id,
                    "name": p.merchant.name,
                    "slug": p.merchant.slug,
                    "logo_url": p.merchant.logo_url,
                    "is_featured": p.merchant.is_featured,
                    "is_active": p.merchant.is_active,
                } if p.merchant else None,
                "variants": [
                    {
                        "id": v.id,
                        "product_id": v.product_id,
                        "denomination": float(v.denomination or 0),
                        "selling_price": float(v.selling_price or 0),
                        "cost_price": float(v.cost_price or 0),
                        "discount_percentage": float(v.discount_percentage or 0),
                        "is_available": v.is_available,
                        "stock_quantity": v.stock_quantity,
                    }
                    for v in p.variants
                ] if p.variants else []
            }

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
                    "banner_url": getattr(m, 'banner_url', None),
                    "description": m.description,
                    "website_url": getattr(m, 'website_url', None) or "",
                    "affiliate_url": getattr(m, 'affiliate_url', None) or "",
                    "default_cashback_type": getattr(m, 'default_cashback_type', 'percentage') or 'percentage',
                    "default_cashback_value": float(getattr(m, 'default_cashback_value', 0) or 0),
                    "is_featured": m.is_featured,
                    "is_active": m.is_active,
                    "offers_count": merchant_offer_counts.get(m.id, 0),
                    "total_offers": merchant_offer_counts.get(m.id, 0),
                    "created_at": m.created_at.isoformat() if getattr(m, 'created_at', None) else None,
                    "updated_at": getattr(m, 'updated_at', None).isoformat() if getattr(m, 'updated_at', None) else None,
                } for m in featured_merchants
            ],
            "featured_offers": [serialize_offer(o) for o in featured_offers],
            "exclusive_offers": [serialize_offer(o) for o in exclusive_offers],
            "featured_products": [serialize_product(p) for p in featured_products],
            "stats": {
                "total_merchants": len(featured_merchants),
                "total_offers": len(featured_offers) + len(exclusive_offers),
                "total_products": len(featured_products),
                "total_banners": len(banners) + len(promo_banners)
            }
        }

        is_empty = all([
            len(result["banners"]) == 0,
            len(result["promo_banners"]) == 0,
            len(result["featured_merchants"]) == 0,
            len(result["featured_offers"]) == 0,
            len(result["exclusive_offers"]) == 0,
            len(result["featured_products"]) == 0
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
