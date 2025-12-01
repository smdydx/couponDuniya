from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_
from datetime import datetime
from typing import Optional

from ...redis_client import cache_invalidate, cache_invalidate_prefix, rk, redis_client, publish
from ...database import get_db
from ...models import User, Withdrawal, WalletTransaction, Order, Merchant, Offer, Product, ProductVariant
from ...schemas.wallet_transaction import WithdrawalRead, WithdrawalStatusUpdate
from ...queue import push_email_job, push_sms_job
from ...config import get_settings
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin_ip(request: Request):
    """Enforce optional admin IP whitelist.
    Uses ADMIN_IP_WHITELIST env (comma-separated). Always allow localhost loopback.
    If unset, no restriction applied.
    """
    from ...config import get_settings
    settings = get_settings()
    whitelist = getattr(settings, "ADMIN_IP_WHITELIST", "") or ""
    if not whitelist:
        return True
    allowed = {ip.strip() for ip in whitelist.split(',') if ip.strip()}
    allowed.update({"127.0.0.1", "::1"})
    client_ip = request.client.host if request.client else None
    if client_ip not in allowed:
        raise HTTPException(status_code=403, detail="Admin access forbidden from this IP")
    return True

settings = get_settings()


def require_admin(authorization: str | None = Header(None), request: Request = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    verify_admin_ip(request)
    return True


class MerchantPayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    logo_url: str | None = None
    is_active: bool = True


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
    name: str | None = None
    denomination: float = Field(..., gt=0)
    selling_price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    is_available: bool = True


class OrderStatusUpdate(BaseModel):
    status: str


@router.post("/merchants", response_model=dict)
def create_merchant(
    payload: MerchantPayload,
    _: bool = Depends(require_admin),
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
        website_url=payload.website_url,
        logo_url=payload.logo_url,
        is_active=payload.is_active,
        commission_rate=payload.commission_rate
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
def list_merchants(
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
    is_active: bool | None = None,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all merchants with pagination and filters"""
    query = select(Merchant)
    
    if search:
        query = query.where(
            or_(
                Merchant.name.ilike(f"%{search}%"),
                Merchant.slug.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        query = query.where(Merchant.is_active == is_active)
    
    # Get total count
    total_count = db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Apply pagination
    query = query.order_by(desc(Merchant.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    merchants = db.scalars(query).all()
    
    return {
        "success": True,
        "data": {
            "merchants": [
                {
                    "id": m.id,
                    "name": m.name,
                    "slug": m.slug,
                    "description": m.description,
                    "logo_url": m.logo_url,
                    "is_active": m.is_active,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in merchants
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
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


@router.post("/products", response_model=dict)
def create_product(
    payload: ProductPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    # Verify merchant exists
    merchant = db.scalar(select(Merchant).where(Merchant.id == payload.merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    # Check slug uniqueness
    existing = db.scalar(select(Product).where(Product.slug == payload.slug))
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with slug '{payload.slug}' already exists")
    
    product = Product(
        merchant_id=payload.merchant_id,
        name=payload.name,
        slug=payload.slug,
        image_url=payload.image_url,
        price=payload.price,
        stock=payload.stock,
        is_active=payload.is_active
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    cache_invalidate_prefix(rk("cache", "products"))
    
    return {
        "success": True,
        "message": "Product created successfully",
        "data": {
            "id": product.id,
            "name": product.name,
            "slug": product.slug
        }
    }


@router.put("/products/{id}", response_model=dict)
def update_product(
    id: int,
    payload: ProductPayload,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a product"""
    product = db.scalar(select(Product).where(Product.id == id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check slug uniqueness if changed
    if payload.slug != product.slug:
        existing = db.scalar(select(Product).where(
            and_(
                Product.slug == payload.slug,
                Product.id != id
            )
        ))
        if existing:
            raise HTTPException(status_code=400, detail=f"Product with slug '{payload.slug}' already exists")
    
    product.merchant_id = payload.merchant_id
    product.name = payload.name
    product.slug = payload.slug
    product.image_url = payload.image_url
    product.price = payload.price
    product.stock = payload.stock
    product.is_active = payload.is_active
    
    db.commit()
    
    cache_invalidate_prefix(rk("cache", "products"))
    cache_invalidate_prefix(rk("cache", "product"))
    
    return {
        "success": True,
        "message": "Product updated successfully",
        "data": {"id": product.id, "name": product.name}
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
        name=payload.name,
        denomination=payload.denomination,
        selling_price=payload.selling_price,
        stock=payload.stock,
        is_available=payload.is_available
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
            "denomination": float(variant.denomination)
        }
    }


@router.post("/merchants/{slug}/invalidate", response_model=dict)
def invalidate_merchant_cache(slug: str):
    """Invalidate merchant cache"""
    cache_invalidate_prefix(rk("cache", "merchant"))
    cache_invalidate_prefix(rk("cache", "merchants"))
    publish("events:cache_invalidate", {"entity": "merchant", "slug": slug})
    return {"success": True, "message": f"Cache invalidated for merchant {slug}"}


@router.get("/orders", response_model=dict)
def list_orders(_: bool = Depends(require_admin)):
    return {"success": True, "data": {"orders": [], "pagination": {"current_page": 1, "total_pages": 1, "total_items": 0, "per_page": 20}}}


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
    if settings.EMAIL_ENABLED:
        push_email_job(
            "withdrawal_processed",
            user.email,
            {
                "user_name": user.name or user.email.split('@')[0],
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
    if settings.EMAIL_ENABLED:
        push_email_job(
            "withdrawal_rejected",
            user.email,
            {
                "user_name": user.name or user.email.split('@')[0],
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
def analytics_dashboard(_: bool = Depends(require_admin), db: Session = Depends(get_db)):
    """Get admin dashboard metrics"""
    from datetime import datetime, timedelta
    
    # Total orders count
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
    
    # Today's orders
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_orders = db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.created_at >= today_start)
    ) or 0
    
    # Total revenue (completed orders)
    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.payment_status == "paid")
    ) or 0.0
    
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
    
    # Total users
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    
    # New users this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.created_at >= week_ago)
    ) or 0
    
    # Pending withdrawals
    pending_withdrawals_count = db.scalar(
        select(func.count())
        .select_from(Withdrawal)
        .where(Withdrawal.status == "pending")
    ) or 0
    
    pending_withdrawals_amount = db.scalar(
        select(func.coalesce(func.sum(Withdrawal.amount), 0))
        .where(Withdrawal.status == "pending")
    ) or 0.0
    
    # Active merchants
    active_merchants = db.scalar(
        select(func.count())
        .select_from(Merchant)
        .where(Merchant.is_active == True)
    ) or 0
    
    # Active offers
    active_offers = db.scalar(
        select(func.count())
        .select_from(Offer)
        .where(Offer.is_active == True)
    ) or 0
    
    # Available products
    available_products = db.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.is_active == True)
    ) or 0
    
    # Redis stats
    try:
        redis_info = redis_client.info()
        redis_stats = {
            "connected": True,
            "keys_count": redis_client.dbsize(),
            "memory_used": redis_info.get("used_memory_human", "N/A"),
            "connected_clients": redis_info.get("connected_clients", 0),
        }
    except Exception:
        redis_stats = {
            "connected": False,
            "keys_count": 0,
            "memory_used": "N/A",
            "connected_clients": 0,
        }
    
    return {
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
