
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func, desc
from typing import Optional
from ...database import get_db
from ...models.product import Product
from ...models.product_variant import ProductVariant
from ...models.merchant import Merchant
from ...dependencies import rate_limit_dependency

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=dict)
def list_products(
    page: int = 1,
    limit: int = 20,
    category_id: int | None = None,
    merchant_id: int | None = None,
    is_featured: bool | None = None,
    search: str | None = None,
    sort_by: str | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("products:list", limit=100, window_seconds=60)),
):
    """List all active products with variants"""
    # Base query with joins
    query = select(Product, Merchant).outerjoin(Merchant, Product.merchant_id == Merchant.id)
    query = query.where(Product.is_active == True)
    
    # Apply filters
    if category_id:
        query = query.where(Product.category_id == category_id)
    if merchant_id:
        query = query.where(Product.merchant_id == merchant_id)
    if is_featured:
        query = query.where(Product.is_featured == True)
    if search:
        query = query.where(or_(
            Product.name.ilike(f"%{search}%"),
            Product.slug.ilike(f"%{search}%")
        ))
    
    # Count total items
    count_query = select(func.count()).select_from(Product).where(Product.is_active == True)
    if category_id:
        count_query = count_query.where(Product.category_id == category_id)
    if merchant_id:
        count_query = count_query.where(Product.merchant_id == merchant_id)
    if is_featured:
        count_query = count_query.where(Product.is_featured == True)
    if search:
        count_query = count_query.where(or_(
            Product.name.ilike(f"%{search}%"),
            Product.slug.ilike(f"%{search}%")
        ))
    
    total = db.scalar(count_query) or 0
    
    # Apply sorting
    if sort_by == "price_low":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_high":
        query = query.order_by(Product.price.desc())
    elif sort_by == "discount":
        query = query.order_by(desc(Product.is_featured))
    elif sort_by == "popular":
        query = query.order_by(desc(Product.is_bestseller))
    else:
        query = query.order_by(desc(Product.created_at))
    
    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    # Execute query
    results = db.execute(query).all()
    
    # Format products with variants
    products = []
    for product, merchant in results:
        # Get variants
        variants_query = select(ProductVariant).where(
            ProductVariant.product_id == product.id,
            ProductVariant.is_available == True
        )
        variants = db.execute(variants_query).scalars().all()
        
        products.append({
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "image_url": product.image_url,
            "is_featured": product.is_featured,
            "is_bestseller": product.is_bestseller,
            "sales_count": 0,  # You can add this field to Product model later
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug,
                "logo_url": merchant.logo_url
            } if merchant else None,
            "variants": [{
                "id": v.id,
                "product_id": v.product_id,
                "sku": v.sku,
                "denomination": float(v.price),
                "selling_price": float(v.price),
                "discount_percentage": 0,
                "is_available": v.is_available
            } for v in variants]
        })
    
    return {
        "success": True,
        "data": products,
        "pagination": {
            "current_page": page,
            "total_pages": max(1, (total + limit - 1) // limit),
            "total_items": total,
            "per_page": limit,
        },
    }


@router.get("/featured", response_model=dict)
def featured_products(limit: int = 8, db: Session = Depends(get_db)):
    """Get featured products"""
    query = select(Product, Merchant).outerjoin(Merchant, Product.merchant_id == Merchant.id)
    query = query.where(Product.is_active == True, Product.is_featured == True)
    query = query.order_by(desc(Product.created_at)).limit(limit)
    
    results = db.execute(query).all()
    
    products = []
    for product, merchant in results:
        variants_query = select(ProductVariant).where(
            ProductVariant.product_id == product.id,
            ProductVariant.is_available == True
        )
        variants = db.execute(variants_query).scalars().all()
        
        products.append({
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "image_url": product.image_url,
            "is_featured": product.is_featured,
            "is_bestseller": product.is_bestseller,
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug,
                "logo_url": merchant.logo_url
            } if merchant else None,
            "variants": [{
                "id": v.id,
                "product_id": v.product_id,
                "sku": v.sku,
                "denomination": float(v.price),
                "selling_price": float(v.price),
                "discount_percentage": 0,
                "is_available": v.is_available
            } for v in variants]
        })
    
    return {"success": True, "data": products}


@router.get("/bestsellers", response_model=dict)
def bestseller_products(limit: int = 8, db: Session = Depends(get_db)):
    """Get bestseller products"""
    query = select(Product, Merchant).outerjoin(Merchant, Product.merchant_id == Merchant.id)
    query = query.where(Product.is_active == True, Product.is_bestseller == True)
    query = query.order_by(desc(Product.created_at)).limit(limit)
    
    results = db.execute(query).all()
    
    products = []
    for product, merchant in results:
        variants_query = select(ProductVariant).where(
            ProductVariant.product_id == product.id,
            ProductVariant.is_available == True
        )
        variants = db.execute(variants_query).scalars().all()
        
        products.append({
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "image_url": product.image_url,
            "is_featured": product.is_featured,
            "is_bestseller": product.is_bestseller,
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug,
                "logo_url": merchant.logo_url
            } if merchant else None,
            "variants": [{
                "id": v.id,
                "product_id": v.product_id,
                "sku": v.sku,
                "denomination": float(v.price),
                "selling_price": float(v.price),
                "discount_percentage": 0,
                "is_available": v.is_available
            } for v in variants]
        })
    
    return {"success": True, "data": products}


@router.get("/{slug}", response_model=dict)
def get_product(slug: str, db: Session = Depends(get_db)):
    """Get product by slug with all details"""
    query = select(Product, Merchant).outerjoin(Merchant, Product.merchant_id == Merchant.id)
    query = query.where(Product.slug == slug, Product.is_active == True)
    
    result = db.execute(query).first()
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product, merchant = result
    
    # Get variants
    variants_query = select(ProductVariant).where(
        ProductVariant.product_id == product.id,
        ProductVariant.is_available == True
    )
    variants = db.execute(variants_query).scalars().all()
    
    product_data = {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": f"Instant {product.name} - Digital delivery",
        "image_url": product.image_url,
        "is_featured": product.is_featured,
        "is_bestseller": product.is_bestseller,
        "card_type": "e-gift",
        "delivery_method": "email",
        "validity_days": 365,
        "is_in_stock": product.stock > 0,
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "slug": merchant.slug,
            "logo_url": merchant.logo_url
        } if merchant else None,
        "variants": [{
            "id": v.id,
            "product_id": v.product_id,
            "sku": v.sku,
            "denomination": float(v.price),
            "selling_price": float(v.price),
            "cost_price": float(v.price) * 0.97,
            "discount_percentage": 0,
            "is_available": v.is_available
        } for v in variants]
    }
    
    return {"success": True, "data": product_data}
