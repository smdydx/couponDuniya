"""Search API for merchants, offers, and products"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_, desc, text
from typing import Optional, List
from datetime import datetime, timedelta

from ...database import get_db
from ...models import Merchant, Offer, Product, OfferClick, OfferView
from ...redis_client import redis_client, rk, cache_get, cache_set
from pydantic import BaseModel
from ...dependencies import rate_limit_dependency

router = APIRouter(prefix="/search", tags=["Search"])


class SearchResult(BaseModel):
    type: str  # merchant, offer, product
    id: int
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    url: str
    relevance: float


class AutocompleteResult(BaseModel):
    text: str
    type: str
    count: int


@router.get("/", response_model=dict)
def search_all(
    q: str = Query(..., min_length=2, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by type: merchant, offer, product"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("search", limit=60, window_seconds=60))
):
    """
    Universal search across merchants, offers, and products.
    Uses PostgreSQL full-text search with ranking.
    """
    results = []
    
    # Search merchants
    if not type or type == "merchant":
        merchants = db.execute(
            select(
                Merchant.id,
                Merchant.name,
                Merchant.description,
                Merchant.logo_url,
                Merchant.slug,
                func.ts_rank(
                    func.to_tsvector('english', Merchant.name + ' ' + func.coalesce(Merchant.description, '')),
                    func.plainto_tsquery('english', q)
                ).label('rank')
            )
            .where(
                and_(
                    Merchant.is_active == True,
                    or_(
                        Merchant.name.ilike(f"%{q}%"),
                        Merchant.description.ilike(f"%{q}%")
                    )
                )
            )
            .order_by(desc('rank'))
            .limit(limit // 3)
        ).all()
        
        for m in merchants:
            results.append({
                "type": "merchant",
                "id": m.id,
                "title": m.name,
                "description": m.description,
                "image_url": m.logo_url,
                "url": f"/merchants/{m.slug}",
                "relevance": float(m.rank) if m.rank else 0.0
            })
    
    # Search offers
    if not type or type == "offer":
        offers = db.execute(
            select(
                Offer.id,
                Offer.title,
                Offer.description,
                Offer.discount_text,
                Merchant.name.label('merchant_name'),
                Merchant.slug.label('merchant_slug'),
                func.ts_rank(
                    func.to_tsvector('english', 
                        Offer.title + ' ' + 
                        func.coalesce(Offer.description, '') + ' ' + 
                        func.coalesce(Offer.discount_text, '')
                    ),
                    func.plainto_tsquery('english', q)
                ).label('rank')
            )
            .join(Merchant, Offer.merchant_id == Merchant.id)
            .where(
                and_(
                    Offer.is_active == True,
                    Merchant.is_active == True,
                    or_(
                        Offer.title.ilike(f"%{q}%"),
                        Offer.description.ilike(f"%{q}%"),
                        Offer.discount_text.ilike(f"%{q}%")
                    )
                )
            )
            .order_by(desc('rank'))
            .limit(limit // 3)
        ).all()
        
        for o in offers:
            results.append({
                "type": "offer",
                "id": o.id,
                "title": o.title,
                "description": o.description or o.discount_text,
                "image_url": None,
                "url": f"/merchants/{o.merchant_slug}#offer-{o.id}",
                "relevance": float(o.rank) if o.rank else 0.0,
                "merchant": o.merchant_name
            })
    
    # Search products
    if not type or type == "product":
        products = db.execute(
            select(
                Product.id,
                Product.name,
                Product.description,
                Product.slug,
                Product.image_url,
                Merchant.name.label('merchant_name'),
                func.ts_rank(
                    func.to_tsvector('english', Product.name + ' ' + func.coalesce(Product.description, '')),
                    func.plainto_tsquery('english', q)
                ).label('rank')
            )
            .join(Merchant, Product.merchant_id == Merchant.id)
            .where(
                and_(
                    Product.is_active == True,
                    Merchant.is_active == True,
                    or_(
                        Product.name.ilike(f"%{q}%"),
                        Product.description.ilike(f"%{q}%")
                    )
                )
            )
            .order_by(desc('rank'))
            .limit(limit // 3)
        ).all()
        
        for p in products:
            results.append({
                "type": "product",
                "id": p.id,
                "title": p.name,
                "description": p.description,
                "image_url": p.image_url,
                "url": f"/products/{p.slug}",
                "relevance": float(p.rank) if p.rank else 0.0,
                "merchant": p.merchant_name
            })
    
    # Sort by relevance
    results.sort(key=lambda x: x['relevance'], reverse=True)
    
    return {
        "success": True,
        "data": {
            "results": results[:limit],
            "total": len(results),
            "query": q
        }
    }


@router.get("/autocomplete", response_model=dict)
def autocomplete(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Autocomplete suggestions for search.
    Returns merchants, popular offers, and products matching the query.
    """
    
    # Check cache first
    cache_key = rk("autocomplete", q.lower())
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "data": cached}
    
    suggestions = []
    
    # Merchant suggestions
    merchants = db.execute(
        select(Merchant.name, Merchant.slug)
        .where(
            and_(
                Merchant.is_active == True,
                Merchant.name.ilike(f"{q}%")
            )
        )
        .order_by(Merchant.name)
        .limit(limit // 2)
    ).all()
    
    for m in merchants:
        suggestions.append({
            "text": m.name,
            "type": "merchant",
            "url": f"/merchants/{m.slug}"
        })
    
    # Product suggestions (popular products)
    products = db.execute(
        select(Product.name, Product.slug)
        .where(
            and_(
                Product.is_active == True,
                Product.name.ilike(f"{q}%")
            )
        )
        .order_by(Product.name)
        .limit(limit // 2)
    ).all()
    
    for p in products:
        suggestions.append({
            "text": p.name,
            "type": "product",
            "url": f"/products/{p.slug}"
        })
    
    # Cache for 5 minutes
    cache_set(cache_key, {"suggestions": suggestions}, 300)
    
    return {
        "success": True,
        "data": {
            "suggestions": suggestions[:limit],
            "query": q
        }
    }


@router.get("/trending", response_model=dict)
def get_trending_offers(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Get trending offers based on click-through rate and recent activity.
    Calculated from clicks and views in the last N days.
    """
    
    # Check cache
    cache_key = rk("trending", "offers", str(days))
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "data": cached}
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get offers with click and view counts
    trending = db.execute(
        text("""
        SELECT 
            o.id,
            o.title,
            o.description,
            o.discount_text,
            o.code,
            m.name as merchant_name,
            m.slug as merchant_slug,
            m.logo_url as merchant_logo,
            COUNT(DISTINCT oc.id) as clicks,
            COUNT(DISTINCT ov.id) as views,
            CASE 
                WHEN COUNT(DISTINCT ov.id) > 0 
                THEN CAST(COUNT(DISTINCT oc.id) AS FLOAT) / COUNT(DISTINCT ov.id)
                ELSE 0 
            END as ctr
        FROM offers o
        JOIN merchants m ON o.merchant_id = m.id
        LEFT JOIN offer_clicks oc ON o.id = oc.offer_id 
            AND oc.created_at >= :cutoff_date
        LEFT JOIN offer_views ov ON o.id = ov.offer_id 
            AND ov.created_at >= :cutoff_date
        WHERE o.is_active = true 
            AND m.is_active = true
        GROUP BY o.id, o.title, o.description, o.discount_text, o.code, 
                 m.name, m.slug, m.logo_url
        HAVING COUNT(DISTINCT ov.id) >= 5
        ORDER BY ctr DESC, clicks DESC
        LIMIT :limit
        """),
        {"cutoff_date": cutoff_date, "limit": limit}
    ).fetchall()
    
    results = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "discount_text": row.discount_text,
            "code": row.code,
            "merchant": {
                "name": row.merchant_name,
                "slug": row.merchant_slug,
                "logo_url": row.merchant_logo
            },
            "stats": {
                "clicks": row.clicks,
                "views": row.views,
                "ctr": float(row.ctr)
            }
        }
        for row in trending
    ]
    
    # Cache for 1 hour
    cache_set(cache_key, {"offers": results, "period_days": days}, 3600)
    
    return {
        "success": True,
        "data": {
            "offers": results,
            "period_days": days
        }
    }


@router.get("/expiring-soon", response_model=dict)
def get_expiring_offers(
    limit: int = Query(20, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Get offers expiring in the next N days.
    Sorted by expiry date (soonest first).
    """
    
    # Check cache
    cache_key = rk("expiring", "offers", str(days))
    cached = cache_get(cache_key)
    if cached:
        return {"success": True, "data": cached}
    
    now = datetime.utcnow()
    cutoff_date = now + timedelta(days=days)
    
    expiring = db.execute(
        select(
            Offer.id,
            Offer.title,
            Offer.description,
            Offer.discount_text,
            Offer.code,
            Offer.expires_at,
            Merchant.name.label('merchant_name'),
            Merchant.slug.label('merchant_slug'),
            Merchant.logo_url.label('merchant_logo')
        )
        .join(Merchant, Offer.merchant_id == Merchant.id)
        .where(
            and_(
                Offer.is_active == True,
                Merchant.is_active == True,
                Offer.expires_at.isnot(None),
                Offer.expires_at > now,
                Offer.expires_at <= cutoff_date
            )
        )
        .order_by(Offer.expires_at)
        .limit(limit)
    ).all()
    
    results = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "discount_text": row.discount_text,
            "code": row.code,
            "expires_at": row.expires_at.isoformat() if row.expires_at else None,
            "expires_in_hours": int((row.expires_at - now).total_seconds() / 3600) if row.expires_at else None,
            "merchant": {
                "name": row.merchant_name,
                "slug": row.merchant_slug,
                "logo_url": row.merchant_logo
            }
        }
        for row in expiring
    ]
    
    # Cache for 30 minutes
    cache_set(cache_key, {"offers": results, "expires_within_days": days}, 1800)
    
    return {
        "success": True,
        "data": {
            "offers": results,
            "expires_within_days": days
        }
    }


@router.get("/recommendations", response_model=dict)
def get_personalized_recommendations(
    user_id: Optional[int] = Query(None, description="User ID for personalization"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get personalized offer recommendations.
    Uses user history if authenticated, otherwise returns popular offers.
    """
    
    if user_id:
        # Check cache for user-specific recommendations
        cache_key = rk("recommendations", "user", str(user_id))
        cached = cache_get(cache_key)
        if cached:
            return {"success": True, "data": cached}
        
        # Get user's click history (last 30 days)
        cutoff = datetime.utcnow() - timedelta(days=30)
        
        user_clicks = db.execute(
            text("""
            SELECT DISTINCT m.id as merchant_id, c.id as category_id
            FROM offer_clicks oc
            JOIN offers o ON oc.offer_id = o.id
            JOIN merchants m ON o.merchant_id = m.id
            LEFT JOIN categories c ON o.category_id = c.id
            WHERE oc.user_id = :user_id 
                AND oc.created_at >= :cutoff
            """),
            {"user_id": user_id, "cutoff": cutoff}
        ).fetchall()
        
        merchant_ids = [row.merchant_id for row in user_clicks if row.merchant_id]
        category_ids = [row.category_id for row in user_clicks if row.category_id]
        
        # Get similar offers from same merchants/categories
        query = select(
            Offer.id,
            Offer.title,
            Offer.description,
            Offer.discount_text,
            Offer.code,
            Merchant.name.label('merchant_name'),
            Merchant.slug.label('merchant_slug'),
            Merchant.logo_url.label('merchant_logo')
        ).join(Merchant, Offer.merchant_id == Merchant.id)
        
        if merchant_ids or category_ids:
            query = query.where(
                and_(
                    Offer.is_active == True,
                    Merchant.is_active == True,
                    or_(
                        Offer.merchant_id.in_(merchant_ids) if merchant_ids else False,
                        Offer.category_id.in_(category_ids) if category_ids else False
                    )
                )
            )
        else:
            # No history, return popular offers
            query = query.where(
                and_(
                    Offer.is_active == True,
                    Merchant.is_active == True
                )
            )
        
        query = query.order_by(desc(Offer.priority), desc(Offer.created_at)).limit(limit)
        
    else:
        # No user ID, return popular offers
        query = select(
            Offer.id,
            Offer.title,
            Offer.description,
            Offer.discount_text,
            Offer.code,
            Merchant.name.label('merchant_name'),
            Merchant.slug.label('merchant_slug'),
            Merchant.logo_url.label('merchant_logo')
        ).join(Merchant, Offer.merchant_id == Merchant.id).where(
            and_(
                Offer.is_active == True,
                Merchant.is_active == True
            )
        ).order_by(desc(Offer.priority), desc(Offer.created_at)).limit(limit)
    
    recommendations = db.execute(query).all()
    
    results = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "discount_text": row.discount_text,
            "code": row.code,
            "merchant": {
                "name": row.merchant_name,
                "slug": row.merchant_slug,
                "logo_url": row.merchant_logo
            }
        }
        for row in recommendations
    ]
    
    # Cache for 15 minutes
    if user_id:
        cache_set(cache_key, {"offers": results, "personalized": True}, 900)
    
    return {
        "success": True,
        "data": {
            "offers": results,
            "personalized": bool(user_id)
        }
    }
