from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, func, or_
from ...database import get_db
from ...models import Merchant, Offer, Product
from ...schemas import MerchantRead, OfferRead, ProductRead
from ...redis_client import cache_get, cache_set, rk

router = APIRouter(prefix="/homepage", tags=["Homepage"])

@router.get("/", response_model=dict)
def get_homepage_data(
    limit_merchants: int = 12,
    limit_featured_offers: int = 8,
    limit_exclusive_offers: int = 6,
    limit_products: int = 8,
    db: Session = Depends(get_db)
):
    """
    Get data for the homepage:
    - Featured merchants
    - Featured offers
    - Exclusive offers
    - Featured products (gift cards)
    """

    # Try cache first
    cache_key = rk("cache", "homepage", f"m{limit_merchants}_fo{limit_featured_offers}_eo{limit_exclusive_offers}_p{limit_products}")
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "data": cached, "cached": True}

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
        "featured_merchants": [MerchantRead.model_validate(m) for m in featured_merchants],
        "featured_offers": [OfferRead.model_validate(o) for o in featured_offers],
        "exclusive_offers": [OfferRead.model_validate(o) for o in exclusive_offers],
        "featured_products": [ProductRead.model_validate(p) for p in featured_products],
    }

    # Cache for 5 minutes
    cache_set(cache_key, result, ttl=300)

    return {"success": True, "data": result, "cached": False}