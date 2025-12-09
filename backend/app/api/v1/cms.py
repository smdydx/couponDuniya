from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from ...database import get_db
from ...models import CMSPage, User, Banner
from ...redis_client import cache_get, cache_set, cache_invalidate_prefix, rk
from ...dependencies import require_admin, get_current_user

router = APIRouter(prefix="/cms", tags=["CMS"])


@router.get("/banners", response_model=List[dict])
def get_banners(
    banner_type: str | None = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Banner)
    if banner_type:
        query = query.filter(Banner.type == banner_type)
    banners = query.limit(limit).all()
    return [
        {
            "id": banner.id,
            "title": banner.title,
            "description": banner.description,
            "image_url": banner.image_url,
            "call_to_action_url": banner.call_to_action_url,
            "type": banner.type,
            "created_at": banner.created_at,
            "updated_at": banner.updated_at,
        }
        for banner in banners
    ]


@router.get("/pages/{slug}", response_model=dict)
def get_page(slug: str):
    return {
        "success": True,
        "data": {
            "slug": slug,
            "title": slug.replace("-", " ").title(),
            "content": "<p>Static page content</p>",
        },
    }