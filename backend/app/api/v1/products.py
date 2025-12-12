from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, or_
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from math import ceil

from ...database import get_db
from ...models import Product, ProductVariant, Category, Merchant
from ...dependencies import get_current_user, require_admin

router = APIRouter(prefix="/products", tags=["Products"])


class VariantResponse(BaseModel):
    id: int
    product_id: int
    denomination: float
    selling_price: float
    cost_price: float
    discount_percentage: float
    is_available: bool
    stock_quantity: Optional[int] = None

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    sku: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    merchant_id: Optional[int] = None
    category_id: Optional[int] = None
    is_bestseller: bool
    is_active: bool
    is_featured: bool
    terms_conditions: Optional[str] = None
    how_to_redeem: Optional[str] = None
    validity_info: Optional[str] = None
    variants: List[VariantResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductsListResponse(BaseModel):
    data: List[ProductResponse]
    pagination: dict


@router.get("/", response_model=ProductsListResponse)
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    search: Optional[str] = None,
    sort_by: Optional[str] = "popular",
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(joinedload(Product.variants)).filter(Product.is_active == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
    
    if sort_by == "popular":
        query = query.order_by(Product.is_bestseller.desc(), Product.display_order.asc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    elif sort_by == "price_low":
        query = query.order_by(Product.display_order.asc())
    elif sort_by == "price_high":
        query = query.order_by(Product.display_order.desc())
    elif sort_by == "discount":
        query = query.order_by(Product.is_bestseller.desc())
    else:
        query = query.order_by(Product.display_order.asc())
    
    total = query.count()
    total_pages = ceil(total / limit)
    offset = (page - 1) * limit
    
    products = query.offset(offset).limit(limit).all()
    
    return {
        "data": products,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total,
            "items_per_page": limit
        }
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).options(joinedload(Product.variants)).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.get("/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).options(joinedload(Product.variants)).filter(
        Product.slug == slug,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


class ProductCreate(BaseModel):
    name: str
    slug: str
    sku: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    merchant_id: Optional[int] = None
    category_id: Optional[int] = None
    is_bestseller: bool = False
    is_featured: bool = False
    terms_conditions: Optional[str] = None
    how_to_redeem: Optional[str] = None
    validity_info: Optional[str] = None


class VariantCreate(BaseModel):
    denomination: float
    selling_price: float
    cost_price: float = 0
    discount_percentage: float = 0
    is_available: bool = True
    stock_quantity: Optional[int] = None


@router.post("/", response_model=ProductResponse)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin)
):
    existing = db.query(Product).filter(
        or_(Product.slug == payload.slug, Product.sku == payload.sku)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug or SKU already exists")
    
    product = Product(**payload.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/variants", response_model=VariantResponse)
def add_variant(
    product_id: int,
    payload: VariantCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variant = ProductVariant(product_id=product_id, **payload.dict())
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in payload.dict().items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted"}
