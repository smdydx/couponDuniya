
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from typing import List
from pydantic import BaseModel, Field

from ...database import get_db
from ...models import Category
from ...redis_client import cache_invalidate_prefix, rk

router = APIRouter(prefix="/categories", tags=["Categories"])


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    icon_url: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    icon_url: str | None = None
    is_active: bool | None = None


class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    icon_url: str | None
    is_active: bool
    created_at: str | None

    class Config:
        from_attributes = True


@router.get("/", response_model=dict)
def list_categories(
    page: int = 1,
    limit: int = 50,
    is_active: bool | None = None,
    db: Session = Depends(get_db)
):
    """List all categories"""
    query = select(Category)
    
    if is_active is not None:
        query = query.where(Category.is_active == is_active)
    
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))
    
    query = query.order_by(desc(Category.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    categories = db.scalars(query).all()
    
    return {
        "success": True,
        "data": {
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "slug": c.slug,
                    "description": c.description,
                    "icon_url": c.icon_url,
                    "is_active": c.is_active,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in categories
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit if total_count else 1,
                "total_items": total_count or 0,
                "per_page": limit
            }
        }
    }


@router.post("/", response_model=dict)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category"""
    existing = db.scalar(select(Category).where(Category.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Category with slug '{payload.slug}' already exists")
    
    category = Category(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        icon_url=payload.icon_url,
        is_active=payload.is_active
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    cache_invalidate_prefix(rk("cache", "categories"))
    
    return {
        "success": True,
        "message": f"Category '{category.name}' created successfully",
        "data": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug
        }
    }


@router.put("/{id}", response_model=dict)
def update_category(
    id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = db.scalar(select(Category).where(Category.id == id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if payload.slug and payload.slug != category.slug:
        existing = db.scalar(select(Category).where(
            (Category.slug == payload.slug) & (Category.id != id)
        ))
        if existing:
            raise HTTPException(status_code=400, detail=f"Category with slug '{payload.slug}' already exists")
    
    if payload.name is not None:
        category.name = payload.name
    if payload.slug is not None:
        category.slug = payload.slug
    if payload.description is not None:
        category.description = payload.description
    if payload.icon_url is not None:
        category.icon_url = payload.icon_url
    if payload.is_active is not None:
        category.is_active = payload.is_active
    
    db.commit()
    db.refresh(category)
    
    cache_invalidate_prefix(rk("cache", "categories"))
    
    return {
        "success": True,
        "message": "Category updated successfully",
        "data": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug
        }
    }


@router.delete("/{id}", response_model=dict)
def delete_category(
    id: int,
    db: Session = Depends(get_db)
):
    """Soft delete a category"""
    category = db.scalar(select(Category).where(Category.id == id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.is_active = False
    db.commit()
    
    cache_invalidate_prefix(rk("cache", "categories"))
    
    return {
        "success": True,
        "message": f"Category '{category.name}' deactivated successfully"
    }


@router.get("/{id}", response_model=dict)
def get_category(
    id: int,
    db: Session = Depends(get_db)
):
    """Get category by ID"""
    category = db.scalar(select(Category).where(Category.id == id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {
        "success": True,
        "data": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug,
            "description": category.description,
            "icon_url": category.icon_url,
            "is_active": category.is_active,
            "created_at": category.created_at.isoformat() if category.created_at else None
        }
    }
