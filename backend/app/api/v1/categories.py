from fastapi import APIRouter, Depends
from ...redis_client import cache_get, cache_set, rk
from ...dependencies import rate_limit_dependency
import json, hashlib

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=dict)
def list_categories(
    type: str | None = None,
    is_featured: bool | None = None,
    _: dict = Depends(rate_limit_dependency("categories:list", limit=60, window_seconds=60)),
):
    key = rk("cache", "categories", hashlib.md5(json.dumps({"type": type, "is_featured": is_featured}, sort_keys=True).encode()).hexdigest())
    cached = cache_get(key)
    if cached:
        return cached
    response = {
        "success": True,
        "data": {
            "categories": [
                {
                    "id": 1,
                    "name": "Fashion",
                    "slug": "fashion",
                    "icon_url": "https://...",
                    "type": type or "both",
                    "offers_count": 234,
                    "products_count": 12,
                    "is_featured": is_featured if is_featured is not None else True,
                }
            ]
        },
    }
    cache_set(key, response, 600)
    return response
