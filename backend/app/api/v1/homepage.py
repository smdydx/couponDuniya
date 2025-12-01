from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from ...database import get_db
from ...models import Merchant, Offer
from ...redis_client import cache_get, cache_set, rk

router = APIRouter(prefix="/homepage", tags=["Homepage"])

@router.get("/")
def homepage_snapshot(limit_merchants: int = 12, limit_featured_offers: int = 8, limit_exclusive_offers: int = 6, limit_products: int = 8, db: Session = Depends(get_db)):
    """Return aggregated homepage data in one round trip.
    Featured merchants: newest active merchants.
    Featured offers: highest priority active offers.
    Exclusive offers: priority > 0.
    Each segment cached individually to maximize reuse.
    """
    # Merchants
    m_key = rk("cache","homepage","featured_merchants",str(limit_merchants))
    merchants_payload = cache_get(m_key)
    if merchants_payload is None:
        m_query = select(Merchant).where(Merchant.is_active == True).order_by(Merchant.created_at.desc()).limit(limit_merchants)
        merchants = db.scalars(m_query).all()
        merchants_payload = [
            {"id": m.id, "name": m.name, "slug": m.slug, "logo_url": m.logo_url, "description": m.description}
            for m in merchants
        ]
        cache_set(m_key, merchants_payload, 300)

    # Featured offers
    f_key = rk("cache","homepage","featured_offers",str(limit_featured_offers))
    featured_offers_payload = cache_get(f_key)
    if featured_offers_payload is None:
        f_query = (
            select(Offer, Merchant)
            .join(Merchant)
            .where(Offer.is_active == True)
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_featured_offers)
        )
        f_results = db.execute(f_query).all()
        featured_offers_payload = [
            {"id": o.id, "title": o.title, "code": o.code, "merchant_id": o.merchant_id, "priority": o.priority, "merchant": {"id": m.id, "name": m.name, "slug": m.slug, "logo_url": m.logo_url}}  # noqa: E501
            for o, m in f_results
        ]
        cache_set(f_key, featured_offers_payload, 300)

    # Exclusive offers
    e_key = rk("cache","homepage","exclusive_offers",str(limit_exclusive_offers))
    exclusive_offers_payload = cache_get(e_key)
    if exclusive_offers_payload is None:
        e_query = (
            select(Offer, Merchant)
            .join(Merchant)
            .where(Offer.is_active == True, Offer.priority > 0)
            .order_by(Offer.priority.desc(), Offer.created_at.desc())
            .limit(limit_exclusive_offers)
        )
        e_results = db.execute(e_query).all()
        exclusive_offers_payload = [
            {"id": o.id, "title": o.title, "code": o.code, "merchant_id": o.merchant_id, "priority": o.priority, "merchant": {"id": m.id, "name": m.name, "slug": m.slug, "logo_url": m.logo_url}}  # noqa: E501
            for o, m in e_results
        ]
        cache_set(e_key, exclusive_offers_payload, 300)

    # Featured products (from in-memory sample generator in products router)
    # Import lazily to avoid circular dependency at module import time.
    from .products import _get_catalog  # type: ignore
    p_key = rk("cache","homepage","featured_products",str(limit_products))
    featured_products_payload = cache_get(p_key)
    if featured_products_payload is None:
        catalog = _get_catalog()
        fp = [p for p in catalog if p.get("is_featured")]
        fp.sort(key=lambda x: x.get("sales_count",0), reverse=True)
        featured_products_payload = [
            {"id": p["id"], "name": p["name"], "slug": p["slug"], "image_url": p["image_url"], "merchant": p.get("merchant"), "variants": p.get("variants", [])[:4], "sales_count": p.get("sales_count")}
            for p in fp[:limit_products]
        ]
        cache_set(p_key, featured_products_payload, 300)

    return {
        "success": True,
        "data": {
            "featured_merchants": merchants_payload,
            "featured_offers": featured_offers_payload,
            "exclusive_offers": exclusive_offers_payload,
            "featured_products": featured_products_payload,
        },
    }
