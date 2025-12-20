from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, or_
from ...database import get_db
from ...models import Merchant, Offer, Product, User
from ...models.banner import Banner
from ...schemas import MerchantRead, OfferRead, ProductRead
from ...redis_client import cache_get, cache_set, rk
from ...dependencies import get_current_user
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
    Get data for the homepage with graceful empty state handling:
    - Hero banners/slider
    - Promo banners (promotional offers slider)
    - Featured merchants
    - Featured offers
    - Exclusive offers
    - Featured products (gift cards)
    """

    try:
        # Try cache first (shorter TTL for dynamic content)
        cache_key = rk("cache", "homepage", f"b{limit_banners}_m{limit_merchants}_fo{limit_featured_offers}_eo{limit_exclusive_offers}_p{limit_products}_pb{limit_promo_banners}")
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

        # Fetch promotional banners (promo slider)
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

        # Fetch featured products (gift cards) - Get products with at least one available variant AND stock > 0
        from ...models import ProductVariant

        products_stmt = (
            select(Product)
            .options(joinedload(Product.merchant), joinedload(Product.variants))
            .join(ProductVariant, Product.id == ProductVariant.product_id)
            .where(
                and_(
                    Product.is_active == True,
                    ProductVariant.is_available == True,
                    ProductVariant.stock > 0,  # Filter out of stock products
                    or_(
                        Product.is_bestseller == True,
                        Product.is_featured == True
                    )
                )
            )
            .group_by(Product.id)
            .order_by(Product.is_bestseller.desc(), Product.created_at.desc())
            .limit(limit_products)
        )
        featured_products = db.scalars(products_stmt).unique().all()

        # Build response with proper validation
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
            "featured_merchants": [MerchantRead.model_validate(m).model_dump() for m in featured_merchants],
            "featured_offers": [OfferRead.model_validate(o).model_dump() for o in featured_offers],
            "exclusive_offers": [OfferRead.model_validate(o).model_dump() for o in exclusive_offers],
            "featured_products": [ProductRead.model_validate(p).model_dump() for p in featured_products],
            "stats": {
                "total_merchants": len(featured_merchants),
                "total_offers": len(featured_offers) + len(exclusive_offers),
                "total_products": len(featured_products),
                "total_banners": len(banners) + len(promo_banners)
            }
        }

        # Detect if homepage is empty
        is_empty = all([
            len(result["banners"]) == 0,
            len(result["promo_banners"]) == 0,
            len(result["featured_merchants"]) == 0,
            len(result["featured_offers"]) == 0,
            len(result["exclusive_offers"]) == 0,
            len(result["featured_products"]) == 0
        ])

        # Cache for 30 seconds (shorter for fresh content)
        cache_set(cache_key, result, ttl=30)

        return {
            "success": True,
            "data": result,
            "cached": False,
            "empty": is_empty,
            "message": "Run seed_homepage_data.py to populate data" if is_empty else "Homepage loaded successfully"
        }

    except HTTPException as e:
        log.error(f"Homepage API HTTP error: {e.detail}")
        raise e # Re-raise HTTPException to be handled by FastAPI
    except Exception as e:
        log.error(f"Homepage API error: {e}")
        # Return empty data with success: False on error
        return {"success": False, "data": {}, "cached": False}