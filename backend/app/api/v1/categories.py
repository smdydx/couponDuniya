
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from ...database import get_db
from ...models import Category, Offer, Product
from ...redis_client import cache_get, cache_set, rk
from ...dependencies import rate_limit_dependency
import json, hashlib

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=dict)
def list_categories(
    type: str | None = None,
    is_featured: bool | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("categories:list", limit=60, window_seconds=60)),
):
    """List all categories with counts"""
    key = rk("cache", "categories", hashlib.md5(json.dumps({"type": type, "is_featured": is_featured}, sort_keys=True).encode()).hexdigest())
    cached = cache_get(key)
    if cached:
        return cached
    
    # Get all active categories
    categories_query = select(Category).where(Category.is_active == True)
    categories = db.scalars(categories_query).all()
    
    categories_data = []
    for cat in categories:
        # Count offers for this category
        offers_count = db.scalar(
            select(func.count(Offer.id)).where(
                Offer.category_id == cat.id,
                Offer.is_active == True
            )
        ) or 0
        
        # Count products for this category
        products_count = db.scalar(
            select(func.count(Product.id)).where(
                Product.category_id == cat.id,
                Product.is_active == True
            )
        ) or 0
        
        categories_data.append({
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon_url": f"/images/categories/{cat.slug}.svg",
            "type": type or "both",
            "offers_count": offers_count,
            "products_count": products_count,
            "is_featured": True,
        })
    
    response = {
        "success": True,
        "data": {
            "categories": categories_data
        },
    }
    cache_set(key, response, 600)
    return response


@router.get("/{slug}", response_model=dict)
def get_category(slug: str, db: Session = Depends(get_db)):
    """Get single category by slug"""
    category = db.scalar(select(Category).where(Category.slug == slug, Category.is_active == True))
    if not category:
        return {"success": False, "error": "Category not found"}
    
    offers_count = db.scalar(
        select(func.count(Offer.id)).where(
            Offer.category_id == category.id,
            Offer.is_active == True
        )
    ) or 0
    
    products_count = db.scalar(
        select(func.count(Product.id)).where(
            Product.category_id == category.id,
            Product.is_active == True
        )
    ) or 0
    
    return {
        "success": True,
        "data": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "offers_count": offers_count,
            "products_count": products_count,
        }
    }
