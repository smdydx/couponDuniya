from fastapi import APIRouter, Depends
from pydantic import BaseModel
import json, hashlib, random, time
from ...redis_client import cache_get, cache_set, rk
from ...dependencies import rate_limit_dependency

router = APIRouter(prefix="/products", tags=["Products"])

class ProductFilters(BaseModel):
    page: int = 1
    limit: int = 20
    category_id: int | None = None
    merchant_id: int | None = None
    is_featured: bool | None = None
    is_bestseller: bool | None = None
    min_price: float | None = None
    max_price: float | None = None
    search: str | None = None
    sort: str | None = None


_CATEGORIES = [
    (1, "Fashion"),
    (2, "Electronics"),
    (3, "Food & Dining"),
    (4, "Travel"),
    (5, "Entertainment"),
    (6, "Health & Beauty"),
    (7, "Home & Living"),
]

_MERCHANTS = [
    (1, "Amazon"),
    (2, "Flipkart"),
    (3, "Myntra"),
    (4, "Swiggy"),
    (5, "Zomato"),
    (6, "BookMyShow"),
    (7, "MakeMyTrip"),
    (8, "Uber"),
]

def _generate_samples(total: int = 40):
    """Generate a deterministic pseudo-random catalog of gift cards."""
    rng = random.Random(42)  # stable
    products = []
    vid = 1
    now = int(time.time())
    for pid in range(1, total + 1):
        m = rng.choice(_MERCHANTS)
        c = rng.choice(_CATEGORIES)
        base = rng.choice([100, 200, 250, 500, 1000])
        variants = []
        for extra in [0, 1, 2]:
            denom = base * (extra + 1)
            discount_pct = rng.choice([0, 4, 5, 6, 7, 10])
            selling = round(denom * (1 - discount_pct / 100), 2)
            variants.append({
                "id": vid,
                "product_id": pid,
                "denomination": denom,
                "selling_price": selling,
                "cost_price": round(selling * 0.97, 2),
                "discount_percentage": discount_pct,
                "is_available": True,
            })
            vid += 1
        products.append({
            "id": pid,
            "uuid": f"prod-{pid}",
            "name": f"{m[1]} Gift Card {pid}",
            "slug": f"{m[1].lower()}-gift-card-{pid}",
            "sku": f"{m[1][:3].upper()}-{pid:03d}",
            "description": f"Instant {m[1]} gift card usable in {c[1]}",
            "image_url": f"/images/gift-cards/{(pid % 22) + 1}.png",
            "category": {"id": c[0], "name": c[1]},
            "merchant": {"id": m[0], "name": m[1], "slug": m[1].lower(), "logo_url": f"/images/merchants/merchant-{m[0]}.png"},
            "variants": variants,
            "card_type": "e-gift",
            "delivery_method": "email",
            "validity_days": 365,
            "is_in_stock": True,
            "is_featured": rng.random() < 0.25,
            "sales_count": rng.randint(50, 500),
        })
    return products

_PRODUCT_CACHE_KEY = rk("cache","products","catalog")

def _get_catalog():
    cached = cache_get(_PRODUCT_CACHE_KEY)
    if cached:
        return cached
    data = _generate_samples()
    cache_set(_PRODUCT_CACHE_KEY, data, 300)
    return data


@router.get("/", response_model=dict)
def list_products(
    filters: ProductFilters = ProductFilters(),
    _: dict = Depends(rate_limit_dependency("products:list", limit=100, window_seconds=60)),
):
    catalog = _get_catalog()
    # basic filtering
    items = catalog
    if filters.category_id:
        items = [p for p in items if p["category"]["id"] == filters.category_id]
    if filters.merchant_id:
        items = [p for p in items if p["merchant"]["id"] == filters.merchant_id]
    if filters.is_bestseller:
        # treat top sales_count as bestseller
        threshold = sorted([p["sales_count"] for p in catalog], reverse=True)[len(catalog)//4]
        items = [p for p in items if p["sales_count"] >= threshold]
    if filters.is_featured:
        items = [p for p in items if p["is_featured"]]
    if filters.search:
        q = filters.search.lower()
        items = [p for p in items if q in p["name"].lower()]

    total = len(items)
    start = (filters.page - 1) * filters.limit
    end = start + filters.limit
    page_items = items[start:end]
    return {
        "success": True,
        "data": {
            "products": page_items,
            "pagination": {
                "current_page": filters.page,
                "total_pages": max(1, (total + filters.limit - 1) // filters.limit),
                "total_items": total,
                "per_page": filters.limit,
            },
        },
    }


@router.get("/{slug}", response_model=dict)
def get_product(slug: str):
    for p in _get_catalog():
        if p["slug"] == slug:
            return {"success": True, "data": p}
    return {"success": False, "data": None}

@router.get("/featured", response_model=dict)
def featured_products(limit: int = 8):
    catalog = _get_catalog()
    featured = [p for p in catalog if p["is_featured"]]
    featured.sort(key=lambda x: x["sales_count"], reverse=True)
    return {"success": True, "data": featured[:limit]}

@router.get("/bestsellers", response_model=dict)
def bestseller_products(limit: int = 8):
    catalog = _get_catalog()
    sorted_catalog = sorted(catalog, key=lambda x: x["sales_count"], reverse=True)
    return {"success": True, "data": sorted_catalog[:limit]}
