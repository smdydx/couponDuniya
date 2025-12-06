from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, or_
from ...database import get_db
from ...models import Merchant, Offer, Product
from ...schemas import MerchantRead, OfferRead, ProductRead
from ...redis_client import cache_get, cache_set, rk
import logging

router = APIRouter(prefix="/homepage", tags=["Homepage"])
log = logging.getLogger(__name__)

@router.get("/", response_model=dict)
def get_homepage_data(
    limit_merchants: int = 12,
    limit_featured_offers: int = 8,
    limit_exclusive_offers: int = 6,
    limit_products: int = 12,
    limit_banners: int = 5,
    limit_promo_banners: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get data for the homepage:
    - Hero banners/slider
    - Promo banners (promotional offers slider)
    - Featured merchants
    - Featured offers
    - Exclusive offers
    - Featured products (gift cards)
    """

    try:
        # Try cache first
        cache_key = rk("cache", "homepage", f"b{limit_banners}_m{limit_merchants}_fo{limit_featured_offers}_eo{limit_exclusive_offers}_p{limit_products}")
        cached = cache_get(cache_key)
        if cached:
            return {"success": True, "data": cached, "cached": True}

        # Fetch active banners (hero slider)
        from ...models import Banner
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

        # Fetch featured products (gift cards) - Get products with at least one available variant
        from ...models import ProductVariant

        products_stmt = (
            select(Product)
            .options(joinedload(Product.merchant), joinedload(Product.variants))
            .join(ProductVariant, Product.id == ProductVariant.product_id)
            .where(
                and_(
                    Product.is_active == True,
                    ProductVariant.is_available == True,
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

        result = {
            "banners": [{"id": b.id, "title": b.title, "image_url": b.image_url, "link_url": b.link_url, "order_index": b.order_index} for b in banners],
            "promo_banners": [
                {
                    "id": b.id,
                    "title": b.title,
                    "brand_name": b.brand_name,
                    "badge_text": b.badge_text,
                    "badge_color": b.badge_color,
                    "headline": b.headline,
                    "description": b.description,
                    "code": b.code,
                    "link_url": b.link_url,
                    "metadata": b.style_metadata,
                    "order_index": b.order_index
                }
                for b in promo_banners
            ],
            "featured_merchants": [MerchantRead.model_validate(m) for m in featured_merchants],
            "featured_offers": [OfferRead.model_validate(o) for o in featured_offers],
            "exclusive_offers": [OfferRead.model_validate(o) for o in exclusive_offers],
            "featured_products": [ProductRead.model_validate(p) for p in featured_products],
        }

        # Cache for 5 minutes
        cache_set(cache_key, result, ttl=300)

        return {"success": True, "data": result, "cached": False}

    except Exception as e:
        log.error(f"Homepage API error: {e}")
        # Return empty data with success: False on error
        return {"success": False, "data": {}, "cached": False}