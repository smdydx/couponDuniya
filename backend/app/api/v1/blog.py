from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
import re

from ...database import get_db
from ...models import BlogPost
from ...redis_client import cache_invalidate, cache_invalidate_prefix, rk

router = APIRouter(prefix="/blog", tags=["Blog"])


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text


class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str | None = None
    excerpt: str | None = None
    content: str = Field(..., min_length=1)
    featured_image: str | None = None
    status: str = Field(default="draft", pattern="^(draft|published|archived)$")
    author: str | None = None
    is_featured: bool = False

    # SEO Metadata
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = None
    meta_keywords: str | None = None
    og_image: str | None = None


class BlogPostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = Field(None, min_length=1)
    featured_image: str | None = None
    status: str | None = Field(None, pattern="^(draft|published|archived)$")
    author: str | None = None
    is_featured: bool | None = None

    # SEO Metadata
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = None
    meta_keywords: str | None = None
    og_image: str | None = None


class BlogPostRead(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: str | None
    content: str
    featured_image: str | None
    status: str
    author: str | None
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime
    is_featured: bool
    view_count: int

    # SEO Metadata
    meta_title: str | None
    meta_description: str | None
    meta_keywords: str | None
    og_image: str | None

    class Config:
        from_attributes = True


class BlogPostListItem(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: str | None
    featured_image: str | None
    status: str
    author: str | None
    published_at: datetime | None
    created_at: datetime
    is_featured: bool
    view_count: int

    class Config:
        from_attributes = True


# Admin endpoints - require authentication
def require_admin(request: Request):
    """Simple admin check - enhance with proper JWT verification"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    return True


@router.post("/admin/posts", response_model=dict)
def create_blog_post(
    payload: BlogPostCreate,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new blog post (Admin only)"""

    # Generate slug if not provided
    slug = payload.slug or slugify(payload.title)

    # Check if slug already exists
    existing = db.scalar(select(BlogPost).where(BlogPost.slug == slug))
    if existing:
        # Append timestamp to make it unique
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    # Set published_at if status is published
    published_at = None
    if payload.status == "published":
        published_at = datetime.utcnow()

    blog_post = BlogPost(
        title=payload.title,
        slug=slug,
        excerpt=payload.excerpt,
        content=payload.content,
        featured_image=payload.featured_image,
        status=payload.status,
        author=payload.author,
        published_at=published_at,
        is_featured=payload.is_featured,
        meta_title=payload.meta_title or payload.title,
        meta_description=payload.meta_description or payload.excerpt,
        meta_keywords=payload.meta_keywords,
        og_image=payload.og_image or payload.featured_image
    )

    db.add(blog_post)
    db.commit()
    db.refresh(blog_post)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "blog"))

    return {
        "success": True,
        "message": "Blog post created successfully",
        "data": BlogPostRead.model_validate(blog_post)
    }


@router.get("/admin/posts", response_model=dict)
def list_blog_posts_admin(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    status: str | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all blog posts with admin filters"""

    query = select(BlogPost)

    if search:
        query = query.where(
            or_(
                BlogPost.title.ilike(f"%{search}%"),
                BlogPost.content.ilike(f"%{search}%"),
                BlogPost.excerpt.ilike(f"%{search}%")
            )
        )

    if status:
        query = query.where(BlogPost.status == status)

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(BlogPost.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    posts = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "posts": [BlogPostListItem.model_validate(p) for p in posts],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


@router.get("/admin/posts/{id}", response_model=dict)
def get_blog_post_admin(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a single blog post by ID (Admin)"""

    post = db.scalar(select(BlogPost).where(BlogPost.id == id))
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return {
        "success": True,
        "data": BlogPostRead.model_validate(post)
    }


@router.put("/admin/posts/{id}", response_model=dict)
def update_blog_post(
    id: int,
    payload: BlogPostUpdate,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a blog post (Admin only)"""

    post = db.scalar(select(BlogPost).where(BlogPost.id == id))
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Check if slug is being changed and if it conflicts
    if payload.slug and payload.slug != post.slug:
        existing = db.scalar(select(BlogPost).where(
            and_(
                BlogPost.slug == payload.slug,
                BlogPost.id != id
            )
        ))
        if existing:
            raise HTTPException(status_code=400, detail=f"Slug '{payload.slug}' already exists")

    # Update fields
    if payload.title is not None:
        post.title = payload.title
    if payload.slug is not None:
        post.slug = payload.slug
    if payload.excerpt is not None:
        post.excerpt = payload.excerpt
    if payload.content is not None:
        post.content = payload.content
    if payload.featured_image is not None:
        post.featured_image = payload.featured_image
    if payload.author is not None:
        post.author = payload.author
    if payload.is_featured is not None:
        post.is_featured = payload.is_featured

    # Handle status change
    if payload.status is not None:
        old_status = post.status
        post.status = payload.status

        # Set published_at when changing from draft to published
        if old_status != "published" and payload.status == "published" and not post.published_at:
            post.published_at = datetime.utcnow()

    # Update SEO fields
    if payload.meta_title is not None:
        post.meta_title = payload.meta_title
    if payload.meta_description is not None:
        post.meta_description = payload.meta_description
    if payload.meta_keywords is not None:
        post.meta_keywords = payload.meta_keywords
    if payload.og_image is not None:
        post.og_image = payload.og_image

    post.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(post)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "blog"))
    cache_invalidate(rk("cache", "blog_post", post.slug))

    return {
        "success": True,
        "message": "Blog post updated successfully",
        "data": BlogPostRead.model_validate(post)
    }


@router.delete("/admin/posts/{id}", response_model=dict)
def delete_blog_post(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a blog post (Admin only)"""

    post = db.scalar(select(BlogPost).where(BlogPost.id == id))
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    slug = post.slug
    db.delete(post)
    db.commit()

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "blog"))
    cache_invalidate(rk("cache", "blog_post", slug))

    return {
        "success": True,
        "message": "Blog post deleted successfully"
    }


@router.post("/admin/posts/{id}/publish", response_model=dict)
def publish_blog_post(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Publish a draft blog post"""

    post = db.scalar(select(BlogPost).where(BlogPost.id == id))
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    if post.status == "published":
        raise HTTPException(status_code=400, detail="Post is already published")

    post.status = "published"
    if not post.published_at:
        post.published_at = datetime.utcnow()
    post.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(post)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "blog"))

    return {
        "success": True,
        "message": "Blog post published successfully",
        "data": BlogPostRead.model_validate(post)
    }


# Public endpoints - no authentication required
@router.get("/posts", response_model=dict)
def list_public_blog_posts(
    page: int = 1,
    limit: int = 12,
    featured: bool | None = None,
    db: Session = Depends(get_db)
):
    """List published blog posts (Public)"""

    query = select(BlogPost).where(BlogPost.status == "published")

    if featured is not None:
        query = query.where(BlogPost.is_featured == featured)

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(BlogPost.published_at))
    query = query.offset((page - 1) * limit).limit(limit)

    posts = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "posts": [BlogPostListItem.model_validate(p) for p in posts],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


@router.get("/posts/{slug}", response_model=dict)
def get_public_blog_post(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get a single published blog post by slug (Public)"""

    post = db.scalar(
        select(BlogPost).where(
            and_(
                BlogPost.slug == slug,
                BlogPost.status == "published"
            )
        )
    )

    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Increment view count
    post.view_count += 1
    db.commit()
    db.refresh(post)

    return {
        "success": True,
        "data": BlogPostRead.model_validate(post)
    }


@router.get("/featured", response_model=dict)
def get_featured_posts(
    limit: int = 3,
    db: Session = Depends(get_db)
):
    """Get featured blog posts (Public)"""

    query = select(BlogPost).where(
        and_(
            BlogPost.status == "published",
            BlogPost.is_featured == True
        )
    ).order_by(desc(BlogPost.published_at)).limit(limit)

    posts = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "posts": [BlogPostListItem.model_validate(p) for p in posts]
        }
    }


@router.get("/recent", response_model=dict)
def get_recent_posts(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get recent blog posts (Public)"""

    query = select(BlogPost).where(
        BlogPost.status == "published"
    ).order_by(desc(BlogPost.published_at)).limit(limit)

    posts = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "posts": [BlogPostListItem.model_validate(p) for p in posts]
        }
    }


@router.get("/search", response_model=dict)
def search_blog_posts(
    q: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search published blog posts (Public)"""

    query = select(BlogPost).where(
        and_(
            BlogPost.status == "published",
            or_(
                BlogPost.title.ilike(f"%{q}%"),
                BlogPost.content.ilike(f"%{q}%"),
                BlogPost.excerpt.ilike(f"%{q}%")
            )
        )
    )

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(BlogPost.published_at))
    query = query.offset((page - 1) * limit).limit(limit)

    posts = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "posts": [BlogPostListItem.model_validate(p) for p in posts],
            "query": q,
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }
