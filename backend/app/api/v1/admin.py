from fastapi import APIRouter, Header, HTTPException, Request, Depends, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_
from datetime import datetime, timedelta
from typing import Optional
from math import ceil

from ...redis_client import cache_invalidate, cache_invalidate_prefix, rk, redis_client, publish
from ...database import get_db
from ...models import User, Withdrawal, WalletTransaction, Order, OrderItem, Merchant, Offer, Product, ProductVariant, Category, GiftCard, Banner
from ...schemas.wallet_transaction import WithdrawalRead, WithdrawalStatusUpdate
from ...queue import push_email_job, push_sms_job
from ...config import get_settings
from ...dependencies import get_current_admin, require_admin, verify_admin_ip
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin", tags=["Admin"])

settings = get_settings()


class MerchantPayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    logo_url: str | None = None
    is_active: bool = True
    is_featured: bool = False


class OfferPayload(BaseModel):
    merchant_id: int
    title: str = Field(..., min_length=1)
    code: str | None = None
    image_url: str | None = None
    priority: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductPayload(BaseModel):
    merchant_id: int
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    image_url: str | None = None
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductVariantPayload(BaseModel):
    product_id: int
    sku: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)


class OrderStatusUpdate(BaseModel):
    status: str


@router.post("/merchants", response_model=dict)
def create_merchant(
    payload: MerchantPayload,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new merchant"""
    # Check if slug already exists
    existing = db.scalar(select(Merchant).where(Merchant.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Merchant with slug '{payload.slug}' already exists")

    merchant = Merchant(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        logo_url=payload.logo_url,
        is_active=payload.is_active,
        is_featured=payload.is_featured
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' created successfully",
        "data": {
            "id": merchant.id,
            "name": merchant.name,
            "slug": merchant.slug,
            "is_active": merchant.is_active
        }
    }


@router.get("/merchants", response_model=dict)
def list_admin_merchants(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all merchants with pagination (admin - includes inactive)"""
    query = select(Merchant)

    if search:
        query = query.where(Merchant.name.ilike(f"%{search}%"))

    if is_active is not None:
        query = query.where(Merchant.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(Merchant)
    if search:
        count_query = count_query.where(Merchant.name.ilike(f"%{search}%"))
    if is_active is not None:
        count_query = count_query.where(Merchant.is_active == is_active)

    total_count = db.scalar(count_query) or 0

    # Order and paginate
    query = query.order_by(desc(Merchant.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    merchants = db.scalars(query).all()

    # Get merchant IDs for batch query
    merchant_ids = [m.id for m in merchants]
    
    # Batch query for offers count
    offers_count_query = (
        select(Offer.merchant_id, func.count(Offer.id).label('count'))
        .where(Offer.merchant_id.in_(merchant_ids), Offer.is_active == True)
        .group_by(Offer.merchant_id)
    )
    offers_counts = {merchant_id: count for merchant_id, count in db.execute(offers_count_query).all()}

    merchants_data = []
    for m in merchants:
        merchants_data.append({
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
            "is_active": m.is_active,
            "is_featured": m.is_featured,
            "offers_count": offers_counts.get(m.id, 0),
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })

    return {
        "success": True,
        "merchants": merchants_data,
        "pagination": {
            "current_page": page,
            "total_pages": ceil(total_count / limit) if total_count else 0,
            "total_items": total_count,
            "per_page": limit,
        },
    }


@router.put("/merchants/{id}", response_model=dict)
def update_merchant(
    id: int,
    payload: MerchantPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a merchant"""
    merchant = db.scalar(select(Merchant).where(Merchant.id == id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Check if slug is being changed and if it conflicts
    if payload.slug != merchant.slug:
        existing = db.scalar(select(Merchant).where(
            and_(
                Merchant.slug == payload.slug,
                Merchant.id != id
            )
        ))
        if existing:
            raise HTTPException(status_code=400, detail=f"Merchant with slug '{payload.slug}' already exists")

    # Update fields
    merchant.name = payload.name
    merchant.slug = payload.slug
    merchant.description = payload.description
    merchant.logo_url = payload.logo_url
    merchant.is_active = payload.is_active

    db.commit()
    db.refresh(merchant)

    # Invalidate caches
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate_prefix(rk("cache", "merchant"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' updated successfully",
        "data": {
            "id": merchant.id,
            "name": merchant.name,
            "slug": merchant.slug
        }
    }


@router.delete("/merchants/{id}", response_model=dict)
def delete_merchant(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Soft delete a merchant"""
    merchant = db.scalar(select(Merchant).where(Merchant.id == id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.is_active = False
    db.commit()

    # Invalidate caches
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate_prefix(rk("cache", "merchant"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' deactivated successfully"
    }


@router.post("/offers", response_model=dict)
def create_offer(
    payload: OfferPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new offer"""
    # Verify merchant exists
    merchant = db.scalar(select(Merchant).where(Merchant.id == payload.merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    offer = Offer(
        merchant_id=payload.merchant_id,
        title=payload.title,
        code=payload.code,
        image_url=payload.image_url,
        priority=payload.priority,
        is_active=payload.is_active
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    cache_invalidate_prefix(rk("cache", "offers"))

    return {
        "success": True,
        "message": "Offer created successfully",
        "data": {
            "id": offer.id,
            "title": offer.title,
            "merchant_id": offer.merchant_id
        }
    }


@router.put("/offers/{id}", response_model=dict)
def update_offer(
    id: int,
    payload: OfferPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an offer"""
    offer = db.scalar(select(Offer).where(Offer.id == id))
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Update fields
    offer.merchant_id = payload.merchant_id
    offer.title = payload.title
    offer.code = payload.code
    offer.image_url = payload.image_url
    offer.priority = payload.priority
    offer.is_active = payload.is_active

    db.commit()

    cache_invalidate_prefix(rk("cache", "offers"))

    return {
        "success": True,
        "message": "Offer updated successfully",
        "data": {"id": offer.id, "title": offer.title}
    }


@router.delete("/offers/{id}", response_model=dict)
def delete_offer(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Soft delete an offer"""
    offer = db.scalar(select(Offer).where(Offer.id == id))
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.is_active = False
    db.commit()

    cache_invalidate_prefix(rk("cache", "offers"))

    return {"success": True, "message": "Offer deleted successfully"}


@router.post("/products", dependencies=[Depends(require_admin)])
def create_admin_product(
    merchant_id: int = Form(...),
    category_id: int = Form(None),
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(None),
    image_url: str = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    existing = db.scalar(select(Product).where(Product.slug == slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with slug '{slug}' already exists")

    product = Product(
        merchant_id=merchant_id,
        category_id=category_id,
        name=name,
        slug=slug,
        description=description,
        image_url=image_url,
        price=price,
        stock=stock,
        is_active=is_active
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    cache_invalidate_prefix(rk("cache", "products"))

    return {
        "success": True,
        "message": f"Product '{product.name}' created successfully",
        "data": {"id": product.id, "name": product.name, "slug": product.slug}
    }


@router.put("/products/{id}", dependencies=[Depends(require_admin)])
def update_admin_product(
    id: int,
    merchant_id: int = Form(None),
    category_id: int = Form(None),
    name: str = Form(None),
    slug: str = Form(None),
    description: str = Form(None),
    image_url: str = Form(None),
    price: float = Form(None),
    stock: int = Form(None),
    is_active: bool = Form(None),
    db: Session = Depends(get_db)
):
    """Update a product"""
    product = db.scalar(select(Product).where(Product.id == id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if slug and slug != product.slug:
        existing = db.scalar(select(Product).where((Product.slug == slug) & (Product.id != id)))
        if existing:
            raise HTTPException(status_code=400, detail=f"Product with slug '{slug}' already exists")

    if merchant_id is not None:
        product.merchant_id = merchant_id
    if category_id is not None:
        product.category_id = category_id
    if name is not None:
        product.name = name
    if slug is not None:
        product.slug = slug
    if description is not None:
        product.description = description
    if image_url is not None:
        product.image_url = image_url
    if price is not None:
        product.price = price
    if stock is not None:
        product.stock = stock
    if is_active is not None:
        product.is_active = is_active

    db.commit()
    db.refresh(product)

    cache_invalidate_prefix(rk("cache", "products"))

    return {
        "success": True,
        "message": "Product updated successfully",
        "data": {"id": product.id, "name": product.name, "slug": product.slug}
    }


@router.delete("/products/{id}", response_model=dict)
def delete_product(
    id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Soft delete a product"""
    product = db.scalar(select(Product).where(Product.id == id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    db.commit()

    cache_invalidate_prefix(rk("cache", "products"))
    cache_invalidate_prefix(rk("cache", "product"))

    return {
        "success": True,
        "message": f"Product '{product.name}' deactivated successfully"
    }


@router.post("/products/{product_id}/variants", response_model=dict)
def add_variant(
    product_id: int,
    payload: ProductVariantPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Add a variant to a product"""
    product = db.scalar(select(Product).where(Product.id == product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    variant = ProductVariant(
        product_id=product_id,
        sku=payload.sku,
        name=payload.name,
        price=payload.price,
        stock=payload.stock
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)

    cache_invalidate_prefix(rk("cache", "product"))

    return {
        "success": True,
        "message": "Variant added successfully",
        "data": {
            "variant_id": variant.id,
            "product_id": product_id,
            "sku": variant.sku,
            "price": float(variant.price)
        }
    }


@router.post("/merchants/{slug}/invalidate", response_model=dict)
def invalidate_merchant_cache(slug: str):
    """Invalidate merchant cache"""
    cache_invalidate_prefix(rk("cache", "merchant"))
    cache_invalidate_prefix(rk("cache", "merchants"))
    publish("events:cache_invalidate", {"entity": "merchant", "slug": slug})
    return {"success": True, "message": f"Cache invalidated for merchant {slug}"}


@router.get("/users", response_model=dict)
def list_users(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db)
):
    """List all users with pagination and filters (admin)"""
    query = select(User)

    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.mobile.ilike(f"%{search}%") if search.isdigit() else False
            )
        )

    if role:
        query = query.where(User.role == role)

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    query = query.order_by(desc(User.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    users = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "users": [
                {
                    "id": u.id,
                    "email": u.email,
                    "mobile": u.mobile,
                    "full_name": u.full_name,
                    "first_name": getattr(u, 'first_name', None),
                    "last_name": getattr(u, 'last_name', None),
                    "avatar_url": getattr(u, 'avatar_url', None),
                    "wallet_balance": float(u.wallet_balance) if u.wallet_balance else 0,
                    "is_active": u.is_active,
                    "is_verified": getattr(u, 'is_verified', False),
                    "role": u.role,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                }
                for u in users
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit if total_count else 1,
                "total_items": total_count or 0,
                "per_page": limit
            }
        }
    }


@router.get("/offers", response_model=dict)
def list_admin_offers(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    merchant_id: int | None = None,
    is_active: bool | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all offers with pagination (admin - includes inactive)"""
    query = select(Offer)

    if search:
        query = query.where(Offer.title.ilike(f"%{search}%"))

    if merchant_id:
        query = query.where(Offer.merchant_id == merchant_id)

    if is_active is not None:
        query = query.where(Offer.is_active == is_active)

    count_query = select(func.count()).select_from(Offer)
    if search:
        count_query = count_query.where(Offer.title.ilike(f"%{search}%"))
    if merchant_id:
        count_query = count_query.where(Offer.merchant_id == merchant_id)
    if is_active is not None:
        count_query = count_query.where(Offer.is_active == is_active)

    total_count = db.scalar(count_query) or 0

    query = query.order_by(desc(Offer.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    offers = db.scalars(query).all()

    # Batch fetch merchants
    merchant_ids = list(set(o.merchant_id for o in offers if o.merchant_id))
    merchants_query = select(Merchant).where(Merchant.id.in_(merchant_ids))
    merchants = {m.id: m for m in db.scalars(merchants_query).all()}

    return {
        "success": True,
        "data": {
            "offers": [
                {
                    "id": offer.id,
                    "merchant_id": offer.merchant_id,
                    "merchant_name": merchants.get(offer.merchant_id).name if offer.merchant_id and offer.merchant_id in merchants else None,
                    "title": offer.title,
                    "description": offer.description,
                    "code": offer.code,
                    "image_url": offer.image_url,
                    "priority": offer.priority,
                    "is_active": offer.is_active,
                    "created_at": offer.created_at.isoformat() if offer.created_at else None
                }
                for offer in offers
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit if total_count else 1,
                "total_items": total_count or 0,
                "per_page": limit
            }
        }
    }


@router.get("/products", dependencies=[Depends(require_admin)])
def list_admin_products(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    merchant_id: int | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db)
):
    """List all products with pagination (admin - includes inactive)"""
    query = select(Product, Merchant).outerjoin(Merchant, Product.merchant_id == Merchant.id)

    if search:
        query = query.where(or_(
            Product.name.ilike(f"%{search}%"),
            Product.slug.ilike(f"%{search}%")
        ))

    if merchant_id:
        query = query.where(Product.merchant_id == merchant_id)

    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    count_query = select(func.count()).select_from(Product)
    if search:
        count_query = count_query.where(or_(
            Product.name.ilike(f"%{search}%"),
            Product.slug.ilike(f"%{search}%")
        ))
    if merchant_id:
        count_query = count_query.where(Product.merchant_id == merchant_id)
    if is_active is not None:
        count_query = count_query.where(Product.is_active == is_active)

    total_count = db.scalar(count_query) or 0

    query = query.order_by(desc(Product.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    results = db.execute(query).all()

    products = []
    for product, merchant in results:
        product_data = {
            "id": product.id,
            "merchant_id": product.merchant_id,
            "category_id": product.category_id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "image_url": product.image_url,
            "price": float(product.price),
            "stock": product.stock,
            "is_active": product.is_active,
            "is_featured": product.is_featured if hasattr(product, 'is_featured') else False,
            "is_bestseller": product.is_bestseller if hasattr(product, 'is_bestseller') else False,
            "created_at": product.created_at.isoformat() if product.created_at else None,
        }
        products.append(product_data)

    return {
        "success": True,
        "data": {
            "products": products,
            "pagination": {
                "current_page": page,
                "total_pages": max(1, (total_count + limit - 1) // limit),
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.get("/orders", response_model=dict)
def list_orders(
    page: int = 1,
    limit: int = 20,
    status: str | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all orders with pagination (admin)"""
    query = select(Order).outerjoin(User, Order.user_id == User.id)

    if status:
        query = query.where(Order.status == status)

    count_query = select(func.count()).select_from(Order)
    if status:
        count_query = count_query.where(Order.status == status)

    total_count = db.scalar(count_query) or 0

    query = query.order_by(desc(Order.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    orders = db.scalars(query).all()

    orders_data = []
    for order in orders:
        # Get user separately
        user = db.scalar(select(User).where(User.id == order.user_id))
        
        # Count items for this order
        items_count = db.scalar(
            select(func.count(OrderItem.id)).where(OrderItem.order_id == order.id)
        ) or 0
        
        orders_data.append({
            "id": order.id,
            "order_number": order.order_number if order.order_number else f"ORD-{order.id:06d}",
            "user_id": order.user_id,
            "user_email": user.email if user else None,
            "total_amount": float(order.total_amount) if order.total_amount else 0.0,
            "status": order.status,
            "payment_status": order.payment_status if hasattr(order, 'payment_status') else 'unknown',
            "fulfillment_status": order.fulfillment_status if hasattr(order, 'fulfillment_status') else 'pending',
            "items_count": items_count,
            "created_at": order.created_at.isoformat() if order.created_at else None
        })

    return {
        "success": True,
        "data": {
            "orders": orders_data,
            "pagination": {
                "current_page": page,
                "total_pages": max(1, (total_count + limit - 1) // limit),
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


@router.patch("/orders/{id}/status", response_model=dict)
def update_order_status(id: int, payload: OrderStatusUpdate, _: bool = Depends(require_admin)):
    return {"success": True, "data": {"order_id": id, "status": payload.status}}


@router.post("/orders/{id}/fulfill", response_model=dict)
def fulfill_order(id: int, _: bool = Depends(require_admin)):
    return {"success": True, "message": "Order fulfilled and vouchers sent"}


@router.get("/cashback", response_model=dict)
def list_cashback(_: bool = Depends(require_admin)):
    return {"success": True, "data": {"cashback_events": []}}


@router.patch("/cashback/{id}/confirm", response_model=dict)
def confirm_cashback(id: int, _: bool = Depends(require_admin)):
    return {"success": True, "data": {"id": id, "status": "confirmed"}}


@router.patch("/cashback/{id}/reject", response_model=dict)
def reject_cashback(id: int, _: bool = Depends(require_admin)):
    return {"success": True, "data": {"id": id, "status": "rejected"}}


@router.get("/withdrawals", response_model=dict)
def list_withdrawals(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all withdrawal requests (admin)"""

    query = select(Withdrawal)

    if status_filter:
        query = query.where(Withdrawal.status == status_filter)

    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    )

    # Apply pagination and ordering
    query = query.order_by(desc(Withdrawal.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    withdrawals = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "withdrawals": [
                WithdrawalRead.model_validate(w) for w in withdrawals
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }


@router.patch("/withdrawals/{id}/approve", response_model=dict)
def approve_withdrawal(
    id: int,
    payload: WithdrawalStatusUpdate,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Approve a withdrawal request"""

    if payload.status != "approved":
        raise HTTPException(status_code=400, detail="Invalid status for approval")

    # Get withdrawal
    withdrawal = db.scalar(select(Withdrawal).where(Withdrawal.id == id))
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve withdrawal with status: {withdrawal.status}"
        )

    # Get user
    user = db.scalar(select(User).where(User.id == withdrawal.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update withdrawal
    withdrawal.status = "approved"
    withdrawal.admin_notes = payload.admin_notes
    withdrawal.transaction_id = payload.transaction_id
    withdrawal.processed_at = datetime.utcnow()

    db.commit()
    db.refresh(withdrawal)

    # Queue approval notification
    if settings.EMAIL_ENABLED and user.email:
        push_email_job(
            "withdrawal_processed",
            user.email,
            {
                "user_name": user.full_name or (user.email.split('@')[0] if user.email else "User"),
                "amount": withdrawal.amount,
                "method": withdrawal.method,
                "transaction_id": withdrawal.transaction_id or "N/A",
                "status": "approved"
            }
        )

    if settings.SMS_ENABLED and user.mobile:
        push_sms_job(
            "withdrawal_processed",
            user.mobile,
            {
                "amount": withdrawal.amount,
                "status": "approved"
            }
        )

    return {
        "success": True,
        "message": f"Withdrawal #{id} approved successfully",
        "data": WithdrawalRead.model_validate(withdrawal)
    }


@router.patch("/withdrawals/{id}/reject", response_model=dict)
def reject_withdrawal(
    id: int,
    payload: WithdrawalStatusUpdate,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Reject a withdrawal request and refund to wallet"""

    if payload.status != "rejected":
        raise HTTPException(status_code=400, detail="Invalid status for rejection")

    # Get withdrawal
    withdrawal = db.scalar(select(Withdrawal).where(Withdrawal.id == id))
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")

    if withdrawal.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject withdrawal with status: {withdrawal.status}"
        )

    # Get user
    user = db.scalar(select(User).where(User.id == withdrawal.user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Refund to wallet
    user.wallet_balance += withdrawal.amount
    new_balance = float(user.wallet_balance)

    # Update withdrawal
    withdrawal.status = "rejected"
    withdrawal.admin_notes = payload.admin_notes
    withdrawal.processed_at = datetime.utcnow()

    # Create refund transaction
    transaction = WalletTransaction(
        user_id=user.id,
        amount=withdrawal.amount,
        type="withdrawal_refund",
        reference=f"withdrawal_{withdrawal.id}",
        description=f"Withdrawal #{id} rejected - Amount refunded",
        balance_after=new_balance
    )
    db.add(transaction)

    db.commit()
    db.refresh(withdrawal)

    # Queue rejection notification
    if settings.EMAIL_ENABLED and user.email:
        push_email_job(
            "withdrawal_rejected",
            user.email,
            {
                "user_name": user.full_name or (user.email.split('@')[0] if user.email else "User"),
                "amount": withdrawal.amount,
                "method": withdrawal.method,
                "reason": payload.admin_notes or "Not specified",
                "refunded_amount": withdrawal.amount,
                "new_balance": new_balance
            }
        )

    if settings.SMS_ENABLED and user.mobile:
        push_sms_job(
            "withdrawal_rejected",
            user.mobile,
            {
                "amount": withdrawal.amount,
                "refunded": withdrawal.amount
            }
        )

    return {
        "success": True,
        "message": f"Withdrawal #{id} rejected and refunded",
        "data": WithdrawalRead.model_validate(withdrawal)
    }


@router.patch("/withdrawals/{id}/complete", response_model=dict)
def complete_withdrawal(id: int, _: bool = Depends(require_admin)):
    return {"success": True, "data": {"id": id, "status": "completed"}}


@router.get("/analytics/dashboard", response_model=dict)
def analytics_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard metrics"""
    from datetime import datetime, timedelta
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"Admin dashboard accessed by user: {current_admin.id}")

        # Total orders count
        total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
        logger.info(f"Total orders: {total_orders}")

        # Today's orders
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = db.scalar(
            select(func.count())
            .select_from(Order)
            .where(Order.created_at >= today_start)
        ) or 0
        logger.info(f"Today's orders: {today_orders}")

        # Total revenue (completed orders)
        total_revenue = db.scalar(
            select(func.coalesce(func.sum(Order.total_amount), 0))
            .where(Order.payment_status == "paid")
        ) or 0.0
        logger.info(f"Total revenue: {total_revenue}")

        # Today's revenue
        today_revenue = db.scalar(
            select(func.coalesce(func.sum(Order.total_amount), 0))
            .where(
                and_(
                    Order.payment_status == "paid",
                    Order.created_at >= today_start
                )
            )
        ) or 0.0
        logger.info(f"Today's revenue: {today_revenue}")

        # Total users
        total_users = db.scalar(select(func.count()).select_from(User)) or 0
        logger.info(f"Total users: {total_users}")

        # New users this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_week = db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.created_at >= week_ago)
        ) or 0
        logger.info(f"New users this week: {new_users_week}")

        # Pending withdrawals
        pending_withdrawals_count = db.scalar(
            select(func.count())
            .select_from(Withdrawal)
            .where(Withdrawal.status == "pending")
        ) or 0
        logger.info(f"Pending withdrawals count: {pending_withdrawals_count}")

        pending_withdrawals_amount = db.scalar(
            select(func.coalesce(func.sum(Withdrawal.amount), 0))
            .where(Withdrawal.status == "pending")
        ) or 0.0
        logger.info(f"Pending withdrawals amount: {pending_withdrawals_amount}")

        # Active merchants
        active_merchants = db.scalar(
            select(func.count())
            .select_from(Merchant)
            .where(Merchant.is_active == True)
        ) or 0
        logger.info(f"Active merchants: {active_merchants}")

        # Active offers
        active_offers = db.scalar(
            select(func.count())
            .select_from(Offer)
            .where(Offer.is_active == True)
        ) or 0
        logger.info(f"Active offers: {active_offers}")

        # Available products
        available_products = db.scalar(
            select(func.count())
            .select_from(Product)
            .where(Product.is_active == True)
        ) or 0
        logger.info(f"Available products: {available_products}")

        # Redis stats
        try:
            redis_info = redis_client.info()
            redis_stats = {
                "connected": True,
                "keys_count": redis_client.dbsize(),
                "memory_used": redis_info.get("used_memory_human", "N/A"),
                "connected_clients": redis_info.get("connected_clients", 0),
            }
            logger.info(f"Redis stats: {redis_stats}")
        except Exception as redis_err:
            logger.error(f"Redis connection error: {redis_err}")
            redis_stats = {
                "connected": False,
                "keys_count": 0,
                "memory_used": "N/A",
                "connected_clients": 0,
            }

        response_data = {
            "success": True,
            "data": {
                "orders": {
                    "total": total_orders,
                    "today": today_orders,
                },
                "revenue": {
                    "total": float(total_revenue),
                    "today": float(today_revenue),
                },
                "users": {
                    "total": total_users,
                    "new_this_week": new_users_week,
                },
                "withdrawals": {
                    "pending_count": pending_withdrawals_count,
                    "pending_amount": float(pending_withdrawals_amount),
                },
                "catalog": {
                    "active_merchants": active_merchants,
                    "active_offers": active_offers,
                    "available_products": available_products,
                },
                "redis": redis_stats,
            }
        }

        logger.info(f"Dashboard response: {response_data}")
        return response_data

    except Exception as e:
        logger.error(f"❌ Dashboard error: {str(e)}", exc_info=True)
        # Return empty data on error but log the actual error
        return {
            "success": False,
            "error": str(e),
            "data": {
                "orders": {"total": 0, "today": 0},
                "revenue": {"total": 0.0, "today": 0.0},
                "users": {"total": 0, "new_this_week": 0},
                "withdrawals": {"pending_count": 0, "pending_amount": 0.0},
                "catalog": {"active_merchants": 0, "active_offers": 0, "available_products": 0},
                "redis": {"connected": False, "keys_count": 0, "memory_used": "N/A", "connected_clients": 0}
            }
        }


@router.get("/analytics/revenue", response_model=dict)
def analytics_revenue(
    days: int = 30,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get daily revenue for the last N days"""
    from datetime import datetime, timedelta

    end_date = datetime.utcnow().replace(hour=23, minute=59, second=59)
    start_date = end_date - timedelta(days=days)

    # Query daily revenue
    daily_revenue = db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("orders")
        )
        .where(
            and_(
                Order.payment_status == "paid",
                Order.created_at >= start_date,
                Order.created_at <= end_date
            )
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    ).all()

    series = [
        {
            "date": str(row.date),
            "revenue": float(row.revenue),
            "orders": row.orders
        }
        for row in daily_revenue
    ]

    return {
        "success": True,
        "data": {
            "series": series,
            "period_days": days
        }
    }


@router.get("/analytics/top-merchants", response_model=dict)
def analytics_top_merchants(
    limit: int = 10,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get top merchants by order count"""
    from sqlalchemy.orm import joinedload

    # Get top merchants by order count
    top_merchants = db.execute(
        select(
            Merchant.id,
            Merchant.name,
            Merchant.logo_url,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_revenue")
        )
        .join(Product, Product.merchant_id == Merchant.id)
        .join(Order, Order.id == Product.id)  # This needs proper join through OrderItem
        .where(Order.payment_status == "paid")
        .group_by(Merchant.id, Merchant.name, Merchant.logo_url)
        .order_by(desc("order_count"))
        .limit(limit)
    ).all()

    merchants = [
        {
            "id": row.id,
            "name": row.name,
            "logo_url": row.logo_url,
            "order_count": row.order_count,
            "total_revenue": float(row.total_revenue)
        }
        for row in top_merchants
    ]

    return {
        "success": True,
        "data": {
            "merchants": merchants
        }
    }


class CategoryPayload(BaseModel):
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    icon_url: str | None = None
    is_active: bool = True


@router.post("/categories", response_model=dict)
def create_category(payload: CategoryPayload, db: Session = Depends(get_db)):
    """Create a new category"""
    existing = db.scalar(select(Category).where(Category.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Category with slug '{payload.slug}' already exists")

    category = Category(
        name=payload.name,
        slug=payload.slug,
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


@router.put("/categories/{id}", response_model=dict)
def update_category(id: int, payload: CategoryPayload, db: Session = Depends(get_db)):
    """Update a category"""
    category = db.scalar(select(Category).where(Category.id == id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.slug != category.slug:
        existing = db.scalar(select(Category).where(
            and_(Category.slug == payload.slug, Category.id != id)
        ))
        if existing:
            raise HTTPException(status_code=400, detail=f"Category with slug '{payload.slug}' already exists")

    category.name = payload.name
    category.slug = payload.slug
    category.icon_url = payload.icon_url
    category.is_active = payload.is_active

    db.commit()
    cache_invalidate_prefix(rk("cache", "categories"))

    return {
        "success": True,
        "message": "Category updated successfully"
    }


class BannerPayload(BaseModel):
    title: str = Field(..., min_length=1)
    banner_type: str = Field(default="hero")
    image_url: str | None = None
    brand_name: str | None = None
    badge_text: str | None = None
    badge_color: str | None = None
    headline: str | None = None
    description: str | None = None
    code: str | None = None
    style_metadata: str | None = None
    link_url: str | None = None
    order_index: int = Field(default=0, ge=0)
    is_active: bool = True


@router.get("/banners", response_model=dict)
def list_banners(db: Session = Depends(get_db)):
    """List all banners"""
    banners = db.scalars(select(Banner).order_by(Banner.order_index.asc())).all()

    return {
        "success": True,
        "data": {
            "banners": [
                {
                    "id": b.id,
                    "title": b.title,
                    "image_url": b.image_url,
                    "link_url": b.link_url,
                    "order_index": b.order_index,
                    "is_active": b.is_active,
                    "created_at": b.created_at.isoformat() if b.created_at else None
                }
                for b in banners
            ]
        }
    }


@router.post("/banners", response_model=dict)
def create_banner(payload: BannerPayload, db: Session = Depends(get_db)):
    """Create a new banner"""
    banner = Banner(
        title=payload.title,
        banner_type=payload.banner_type,
        image_url=payload.image_url,
        brand_name=payload.brand_name,
        badge_text=payload.badge_text,
        badge_color=payload.badge_color,
        headline=payload.headline,
        description=payload.description,
        code=payload.code,
        style_metadata=payload.style_metadata,
        link_url=payload.link_url,
        order_index=payload.order_index,
        is_active=payload.is_active
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)

    # Invalidate homepage cache
    cache_invalidate_prefix(rk("cache", "homepage"))

    return {
        "success": True,
        "message": "Banner created successfully",
        "data": {
            "id": banner.id,
            "title": banner.title
        }
    }


@router.put("/banners/{id}", response_model=dict)
def update_banner(id: int, payload: BannerPayload, db: Session = Depends(get_db)):
    """Update a banner"""
    banner = db.scalar(select(Banner).where(Banner.id == id))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    banner.title = payload.title
    banner.banner_type = payload.banner_type
    banner.image_url = payload.image_url
    banner.brand_name = payload.brand_name
    banner.badge_text = payload.badge_text
    banner.badge_color = payload.badge_color
    banner.headline = payload.headline
    banner.description = payload.description
    banner.code = payload.code
    banner.style_metadata = payload.style_metadata
    banner.link_url = payload.link_url
    banner.order_index = payload.order_index
    banner.is_active = payload.is_active

    db.commit()
    db.refresh(banner)

    # Invalidate homepage cache
    cache_invalidate_prefix(rk("cache", "homepage"))

    return {
        "success": True,
        "message": "Banner updated successfully",
        "data": {
            "id": banner.id,
            "title": banner.title
        }
    }


@router.delete("/banners/{id}", response_model=dict)
def delete_banner(id: int, db: Session = Depends(get_db)):
    """Delete a banner"""
    banner = db.scalar(select(Banner).where(Banner.id == id))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    db.delete(banner)
    db.commit()

    # Invalidate homepage cache
    cache_invalidate_prefix(rk("cache", "homepage"))

    return {
        "success": True,
        "message": "Banner deleted successfully"
    }


@router.patch("/banners/{id}/reorder", response_model=dict)
def reorder_banner(id: int, direction: dict, db: Session = Depends(get_db)):
    """Reorder banner position"""
    banner = db.scalar(select(Banner).where(Banner.id == id))
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    dir_value = direction.get("direction", "")
    current_order = banner.order_index

    if dir_value == "up" and current_order > 0:
        # Find banner with order_index = current_order - 1
        swap_banner = db.scalar(
            select(Banner).where(Banner.order_index == current_order - 1)
        )
        if swap_banner:
            swap_banner.order_index = current_order
            banner.order_index = current_order - 1
    elif dir_value == "down":
        # Find banner with order_index = current_order + 1
        swap_banner = db.scalar(
            select(Banner).where(Banner.order_index == current_order + 1)
        )
        if swap_banner:
            swap_banner.order_index = current_order
            banner.order_index = current_order + 1

    db.commit()

    # Invalidate homepage cache
    cache_invalidate_prefix(rk("cache", "homepage"))

    return {
        "success": True,
        "message": "Banner reordered successfully"
    }


# ========== GIFT CARD MANAGEMENT ENDPOINTS ==========

from ...models import GiftCard
from ...schemas.gift_card import GiftCardRead


@router.get("/gift-cards", response_model=dict)
def list_all_gift_cards(
    page: int = 1,
    limit: int = 50,
    search: str | None = None,
    status: str | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all gift cards with filters (admin only)"""
    from sqlalchemy import or_

    query = select(GiftCard)

    # Search by code
    if search:
        query = query.where(GiftCard.code.ilike(f"%{search}%"))

    # Filter by status
    if status:
        if status == "active":
            query = query.where(
                and_(
                    GiftCard.is_active == True,
                    GiftCard.remaining_value > 0
                )
            )
        elif status == "used":
            query = query.where(GiftCard.remaining_value == 0)
        elif status == "expired":
            query = query.where(
                and_(
                    GiftCard.expires_at.isnot(None),
                    GiftCard.expires_at < datetime.utcnow()
                )
            )
        elif status == "inactive":
            query = query.where(GiftCard.is_active == False)

    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination
    query = query.order_by(desc(GiftCard.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    gift_cards = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "gift_cards": [GiftCardRead.model_validate(gc) for gc in gift_cards],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


class GiftCardBulkCreateRequest(BaseModel):
    count: int = Field(..., ge=1, le=1000)
    value: float = Field(..., gt=0)
    expires_in_days: int | None = None


@router.post("/gift-cards/bulk-create", response_model=dict)
def bulk_create_gift_cards(
    payload: GiftCardBulkCreateRequest,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Bulk create gift cards with auto-generated codes"""
    import secrets

    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=payload.expires_in_days)

    created_cards = []

    for _ in range(payload.count):
        # Generate unique code
        for attempt in range(10):
            code = secrets.token_hex(8).upper()
            if not db.scalar(select(GiftCard).where(GiftCard.code == code)):
                break
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate unique gift card code"
            )

        gc = GiftCard(
            code=code,
            initial_value=payload.value,
            remaining_value=payload.value,
            expires_at=expires_at,
            is_active=True
        )
        db.add(gc)
        created_cards.append(gc)

    db.commit()

    for gc in created_cards:
        db.refresh(gc)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "gift-cards"))

    return {
        "success": True,
        "message": f"Created {len(created_cards)} gift cards successfully",
        "data": {
            "created_count": len(created_cards),
            "gift_cards": [GiftCardRead.model_validate(gc) for gc in created_cards]
        }
    }


class GiftCardUpdateRequest(BaseModel):
    is_active: bool | None = None
    remaining_value: float | None = None
    expires_at: datetime | None = None


@router.patch("/gift-cards/{gift_card_id}", response_model=dict)
def update_gift_card(
    gift_card_id: int,
    payload: GiftCardUpdateRequest,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update gift card details"""
    gc = db.scalar(select(GiftCard).where(GiftCard.id == gift_card_id))
    if not gc:
        raise HTTPException(status_code=404, detail="Gift card not found")

    if payload.is_active is not None:
        gc.is_active = payload.is_active

    if payload.remaining_value is not None:
        if payload.remaining_value < 0 or payload.remaining_value > gc.initial_value:
            raise HTTPException(
                status_code=400,
                detail="Invalid remaining value"
            )
        gc.remaining_value = payload.remaining_value

    if payload.expires_at is not None:
        gc.expires_at = payload.expires_at

    db.commit()
    db.refresh(gc)

    cache_invalidate_prefix(rk("cache", "gift-cards"))

    return {
        "success": True,
        "message": "Gift card updated successfully",
        "data": GiftCardRead.model_validate(gc)
    }


@router.delete("/gift-cards/{gift_card_id}", response_model=dict)
def delete_gift_card(
    gift_card_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deactivate a gift card (soft delete)"""
    gc = db.scalar(select(GiftCard).where(GiftCard.id == gift_card_id))
    if not gc:
        raise HTTPException(status_code=404, detail="Gift card not found")

    gc.is_active = False
    db.commit()

    cache_invalidate_prefix(rk("cache", "gift-cards"))

    return {
        "success": True,
        "message": f"Gift card {gc.code} deactivated successfully"
    }


@router.get("/gift-cards/stats", response_model=dict)
def gift_card_statistics(
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get gift card statistics"""

    total_cards = db.scalar(select(func.count()).select_from(GiftCard)) or 0

    active_cards = db.scalar(
        select(func.count())
        .select_from(GiftCard)
        .where(
            and_(
                GiftCard.is_active == True,
                GiftCard.remaining_value > 0
            )
        )
    ) or 0

    total_value = db.scalar(
        select(func.coalesce(func.sum(GiftCard.initial_value), 0))
        .where(GiftCard.is_active == True)
    ) or 0.0

    redeemed_value = db.scalar(
        select(func.coalesce(func.sum(GiftCard.initial_value - GiftCard.remaining_value), 0))
    ) or 0.0

    assigned_cards = db.scalar(
        select(func.count())
        .select_from(GiftCard)
        .where(GiftCard.user_id.isnot(None))
    ) or 0

    return {
        "success": True,
        "data": {
            "total_cards": total_cards,
            "active_cards": active_cards,
            "assigned_cards": assigned_cards,
            "total_value": float(total_value),
            "redeemed_value": float(redeemed_value),
            "available_value": float(total_value - redeemed_value)
        }
    }