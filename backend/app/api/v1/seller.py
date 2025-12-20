from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, or_
from typing import List, Optional
import csv
import io
import re
from datetime import datetime

from ...database import get_db
from ...models import User, Product, Merchant, Order, OrderItem, Category, ProductVariant
from ...dependencies import get_current_user
from ...redis_client import cache_invalidate_prefix, rk

router = APIRouter(prefix="/seller", tags=["Seller"])

def require_merchant(current_user: User = Depends(get_current_user)):
    if not current_user.is_merchant or not current_user.merchant_id:
        raise HTTPException(status_code=403, detail="Access denied: Seller account required")
    return current_user

def _generate_slug(text: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return slug or "untitled"

@router.get("/stats")
def get_seller_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    merchant_id = user.merchant_id
    
    total_products = db.scalar(
        select(func.count())
        .where(Product.merchant_id == merchant_id)
    ) or 0
    
    active_products = db.scalar(
        select(func.count())
        .where(Product.merchant_id == merchant_id, Product.is_active == True)
    ) or 0

    # Orders containing at least one product from this merchant
    total_orders = db.scalar(
        select(func.count(func.distinct(Order.id)))
        .join(OrderItem)
        .join(Product)
        .where(Product.merchant_id == merchant_id)
    ) or 0

    # Total revenue from this merchant's products
    total_revenue = db.scalar(
        select(func.sum(OrderItem.total_price))
        .join(Product)
        .where(Product.merchant_id == merchant_id)
    ) or 0

    return {
        "total_products": total_products,
        "active_products": active_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue)
    }

@router.get("/products")
def get_seller_products(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    query = select(Product).where(Product.merchant_id == user.merchant_id)
    
    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(desc(Product.created_at))
    
    total = db.scalar(select(func.count()).select_from(query.alias())) or 0
    products = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()
    
    return {
        "products": products,
        "pagination": {
            "total_items": total,
            "total_pages": (total + limit - 1) // limit,
            "current_page": page,
            "per_page": limit
        }
    }

@router.post("/products")
def create_seller_product(
    name: str = Form(...),
    price: float = Form(...),
    stock: int = Form(0),
    description: str = Form(None),
    image_url: str = Form(None),
    category_id: int = Form(None),
    is_active: bool = Form(True),
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    # Generate slug
    slug = _generate_slug(name)
    existing = db.scalar(select(Product).where(Product.slug == slug))
    if existing:
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    product = Product(
        merchant_id=user.merchant_id,
        category_id=category_id,
        name=name,
        slug=slug,
        description=description,
        image_url=image_url,
        price=price,
        stock=stock,
        is_active=is_active,
        is_featured=False, # Sellers cannot feature themselves without approval
        is_bestseller=False
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    cache_invalidate_prefix(rk("cache", "products"))
    return product

@router.put("/products/{id}")
def update_seller_product(
    id: int,
    name: str = Form(None),
    price: float = Form(None),
    stock: int = Form(None),
    description: str = Form(None),
    image_url: str = Form(None),
    category_id: int = Form(None),
    is_active: bool = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    product = db.scalar(select(Product).where(Product.id == id, Product.merchant_id == user.merchant_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if name is not None:
        product.name = name
        # Don't update slug to maintain SEO? Or do? prefer stable slug.
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = stock
    if description is not None:
        product.description = description
    if image_url is not None:
        product.image_url = image_url
    if category_id is not None:
        product.category_id = category_id
    if is_active is not None:
        product.is_active = is_active

    db.commit()
    db.refresh(product)
    cache_invalidate_prefix(rk("cache", "products"))
    return product

@router.delete("/products/{id}")
def delete_seller_product(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    product = db.scalar(select(Product).where(Product.id == id, Product.merchant_id == user.merchant_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    cache_invalidate_prefix(rk("cache", "products"))
    return {"success": True}

@router.get("/orders")
def get_seller_orders(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    # Retrieve orders that have items from this merchant
    # Join OrderItem -> Product -> (check merchant_id)
    
    query = (
        select(Order)
        .join(OrderItem)
        .join(Product)
        .where(Product.merchant_id == user.merchant_id)
        .distinct()
        .order_by(desc(Order.created_at))
    )
    
    if status and status != 'all':
        query = query.where(Order.status == status)
        
    total = db.scalar(select(func.count(func.distinct(Order.id))).join(OrderItem).join(Product).where(Product.merchant_id == user.merchant_id))
    
    orders = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()
    
    return {
        "orders": orders,
        "pagination": {
            "total_items": total,
            "total_pages": (total + limit - 1) // limit,
            "current_page": page,
            "per_page": limit
        }
    }

@router.post("/products/bulk", response_model=dict)
async def bulk_upload_seller_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_merchant)
):
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        decoded_content = content.decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(decoded_content))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    results = {
        "total": len(rows),
        "created": 0,
        "errors": []
    }

    categories = {c.name.lower(): c for c in db.scalars(select(Category)).all()}

    for i, row in enumerate(rows):
        row_num = i + 2
        try:
            name = row.get('name')
            if not name:
                results['errors'].append(f"Row {row_num}: Missing 'name'")
                continue

            # Category
            cat_name = row.get('category')
            category_id = None
            if cat_name:
                category = categories.get(cat_name.lower())
                if not category:
                    slug = _generate_slug(cat_name)
                    original_slug = slug
                    counter = 1
                    while slug in [c.slug for c in categories.values()]:
                        slug = f"{original_slug}-{counter}"
                        counter += 1
                    
                    category = Category(name=cat_name, slug=slug, is_active=True)
                    db.add(category)
                    db.flush()
                    categories[cat_name.lower()] = category
                
                category_id = category.id

            slug = row.get('slug') or _generate_slug(name)
            existing = db.scalar(select(Product).where(Product.slug == slug))
            if existing:
                original_slug = slug
                counter = 1
                while db.scalar(select(Product).where(Product.slug == slug)):
                    slug = f"{original_slug}-{counter}"
                    counter += 1

            product = Product(
                merchant_id=user.merchant_id, # Enforce current merchant
                category_id=category_id,
                name=name,
                slug=slug,
                description=row.get('description'),
                image_url=row.get('image_url'),
                price=float(row.get('price', 0) or 0),
                stock=int(row.get('stock', 0) or 0),
                is_active=str(row.get('is_active', 'true')).lower() == 'true',
                is_featured=False,
                is_bestseller=False
            )
            db.add(product)
            results['created'] += 1

        except Exception as e:
            results['errors'].append(f"Row {row_num}: {str(e)}")

    db.commit()
    cache_invalidate_prefix(rk("cache", "products"))
    return {"success": True, "data": results}
