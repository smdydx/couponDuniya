from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import Optional
from datetime import datetime

from ...database import get_db
from ...models import Merchant, Offer, User, MerchantVerificationStatus, MerchantStatus
from ...redis_client import cache_get, cache_set, cache_invalidate, cache_invalidate_prefix, rk
from ...dependencies import rate_limit_dependency, get_current_user, get_current_user_unverified, require_admin
from pydantic import BaseModel, EmailStr, ValidationError
from math import ceil
import json, hashlib
import re

router = APIRouter(prefix="/merchants", tags=["Merchants"])

class MerchantFilters(BaseModel):
    page: int = 1
    limit: int = 20
    category_id: int | None = None
    is_featured: bool | None = None
    search: str | None = None


class MerchantApplicationRequest(BaseModel):
    business_name: str
    business_email: str
    business_phone: str
    business_address: str
    business_city: str
    business_state: str
    business_pincode: str
    gst_number: str | None = None
    pan_number: str | None = None
    website_url: str | None = None
    description: str | None = None


class MerchantVerificationAction(BaseModel):
    action: str
    notes: str | None = None


@router.get("/")
def list_merchants(
    page: int = 1,
    limit: int = 20,
    is_featured: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("merchants:list", limit=100, window_seconds=60))
):
    """List all merchants with filtering and pagination"""
    cache_key = rk("cache", "merchants", hashlib.md5(json.dumps({"page": page, "limit": limit, "is_featured": is_featured, "search": search}, sort_keys=True).encode()).hexdigest())
    cached = cache_get(cache_key)
    if cached:
        return cached

    query = select(Merchant).where(Merchant.is_active == True)

    if is_featured is not None:
        query = query.where(Merchant.is_featured == is_featured)

    if search:
        query = query.where(Merchant.name.ilike(f"%{search}%"))

    # Count total
    total = db.scalar(select(func.count()).select_from(query.subquery()))

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    merchants = db.scalars(query).all()

    merchants_data = []
    for m in merchants:
        offers_count = db.scalar(select(func.count(Offer.id)).where(
            Offer.merchant_id == m.id,
            Offer.is_active == True
        ))
        merchants_data.append({
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
            "offers_count": offers_count,
        })

    response = {
        "success": True,
        "data": {
            "merchants": merchants_data,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total / limit) if total else 0,
                "total_items": total,
                "per_page": limit,
            },
        },
    }
    cache_set(cache_key, response, 300)
    return response


@router.get("/featured")
def featured_merchants(limit: int = 12, db: Session = Depends(get_db)):
    """Return featured merchants. Currently approximated using newest active merchants.
    When an explicit feature flag is added, filter on that instead.
    Cached for 5 minutes.
    """
    cache_key = rk("cache","merchants","featured",str(limit))
    cached = cache_get(cache_key)
    if cached:
        return cached
    query = (
        select(Merchant)
        .where(Merchant.is_active == True)
        .order_by(Merchant.created_at.desc())
        .limit(limit)
    )
    merchants = db.scalars(query).all()
    data = [
        {
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "description": m.description,
        }
        for m in merchants
    ]
    response = {"success": True, "data": data}
    cache_set(cache_key, response, 300)
    return response


@router.get("/{slug}")
def get_merchant(slug: str, db: Session = Depends(get_db)):
    """Get merchant by slug"""
    key = rk("cache", "merchant", slug)
    cached = cache_get(key)
    if cached:
        return {"success": True, "data": cached, "cache": True}

    merchant = db.scalar(select(Merchant).where(Merchant.slug == slug, Merchant.is_active == True))
    if not merchant:
        return {"success": False, "error": "Merchant not found"}

    offers_count = db.scalar(select(func.count(Offer.id)).where(
        Offer.merchant_id == merchant.id,
        Offer.is_active == True
    ))

    data = {
        "id": merchant.id,
        "name": merchant.name,
        "slug": merchant.slug,
        "description": merchant.description,
        "logo_url": merchant.logo_url,
        "active_offers_count": offers_count,
        "is_featured": merchant.is_featured,
    }
    cache_set(key, data, 3600)
    return {"success": True, "data": data, "cache": False}


# Merchant modification endpoints - protected by require_admin
@router.post("/")
def create_merchant(
    merchant_data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Create a new merchant"""
    # Basic validation - you might want to use Pydantic models for more robust validation
    if not all(k in merchant_data for k in ("name", "slug", "description", "logo_url")):
        raise HTTPException(status_code=400, detail="Missing required fields")

    if db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"])):
        raise HTTPException(status_code=400, detail="Merchant slug already exists")

    new_merchant = Merchant(**merchant_data)
    db.add(new_merchant)
    db.commit()
    db.refresh(new_merchant)

    # Invalidate cache for merchant list and featured merchants
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))
    cache_invalidate_prefix(rk("cache", "homepage"))  # Clear homepage cache


    return {"success": True, "data": new_merchant}

@router.put("/{merchant_id}")
def update_merchant(
    merchant_id: int,
    merchant_data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Update an existing merchant"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Check if slug is being changed and if the new slug already exists
    if "slug" in merchant_data and merchant_data["slug"] != merchant.slug:
        if db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"])):
            raise HTTPException(status_code=400, detail="Merchant slug already exists")

    for key, value in merchant_data.items():
        setattr(merchant, key, value)

    db.commit()
    db.refresh(merchant)

    # Invalidate cache - Enhanced to include homepage
    cache_invalidate(rk("cache", "merchant", merchant.slug))
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))
    cache_invalidate_prefix(rk("cache", "homepage"))  # Clear homepage cache


    return {"success": True, "data": merchant}

@router.delete("/{merchant_id}")
def delete_merchant(
    merchant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Delete a merchant (soft delete)"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.is_active = False
    db.commit()
    db.refresh(merchant)

    # Invalidate cache
    cache_invalidate(rk("cache", "merchant", merchant.slug))
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))
    cache_invalidate_prefix(rk("cache", "homepage"))  # Clear homepage cache


    return {"success": True, "message": "Merchant deleted successfully"}


def generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


@router.post("/apply")
async def apply_as_merchant(
    request: Request,
    application: MerchantApplicationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_unverified)
):
    """User applies to become a merchant"""
    import logging
    from sqlalchemy.exc import IntegrityError
    log = logging.getLogger(__name__)
    
    # Log the raw request body for debugging
    try:
        body = await request.body()
        log.info(f"Raw request body: {body.decode('utf-8')}")
    except Exception as e:
        log.warning(f"Could not log request body: {e}")
    
    log.info(f"Merchant application received from user {current_user.id}")
    log.info(f"Application data: {application.model_dump()}")
    log.info(f"Current merchant_verification_status: {current_user.merchant_verification_status}")
    log.info(f"Current merchant_verified: {current_user.merchant_verified}")
    
    # Check if user already has pending application
    if current_user.merchant_verification_status == MerchantVerificationStatus.PENDING.value:
        log.warning(f"User {current_user.id} already has pending application")
        raise HTTPException(
            status_code=400, 
            detail="You already have a pending merchant application. Please wait for admin review."
        )
    
    # Check if user is already verified merchant
    if current_user.merchant_verified:
        log.warning(f"User {current_user.id} is already a verified merchant")
        raise HTTPException(
            status_code=400, 
            detail="You are already a verified merchant"
        )
    
    try:
        slug = generate_slug(application.business_name)
        existing_slug = db.scalar(select(Merchant).where(Merchant.slug == slug))
        if existing_slug:
            slug = f"{slug}-{current_user.id}"
        
        merchant = Merchant(
            user_id=current_user.id,
            name=application.business_name,
            slug=slug,
            business_name=application.business_name,
            business_email=application.business_email,
            business_phone=application.business_phone,
            business_address=application.business_address,
            business_city=application.business_city,
            business_state=application.business_state,
            business_pincode=application.business_pincode,
            gst_number=application.gst_number,
            pan_number=application.pan_number,
            website_url=application.website_url,
            description=application.description,
            status=MerchantStatus.PENDING.value,
            verification_status="pending",
            is_active=False,
            is_verified=False
        )
        db.add(merchant)
        
        current_user.merchant_verification_status = MerchantVerificationStatus.PENDING.value
        current_user.is_merchant = True
        current_user.merchant_id = None
        current_user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(merchant)
        db.refresh(current_user)
        
        current_user.merchant_id = merchant.id
        db.commit()
        
        log.info(f"Merchant application created successfully: merchant_id={merchant.id}, user_id={current_user.id}")
        
        return {
            "success": True,
            "message": "Merchant application submitted successfully. Please wait for admin approval.",
            "data": {
                "merchant_id": merchant.id,
                "status": merchant.status,
                "verification_status": current_user.merchant_verification_status
            }
        }
    except IntegrityError as e:
        db.rollback()
        log.error(f"Database integrity error: {str(e)}")
        # Check if it's a duplicate slug error
        if "slug" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="A merchant with similar name already exists. Please try a different business name."
            )
        raise HTTPException(
            status_code=400,
            detail="Failed to create merchant application. Please check your data and try again."
        )
    except Exception as e:
        db.rollback()
        log.error(f"Unexpected error creating merchant application: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your application: {str(e)}"
        )


@router.get("/my-application")
def get_my_merchant_application(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_unverified)
):
    """Get current user's merchant application status"""
    if not current_user.merchant_id:
        return {
            "success": True,
            "data": {
                "has_application": False,
                "is_merchant": current_user.is_merchant,
                "merchant_verified": current_user.merchant_verified,
                "verification_status": current_user.merchant_verification_status
            }
        }
    
    merchant = db.get(Merchant, current_user.merchant_id)
    if not merchant:
        return {
            "success": True,
            "data": {
                "has_application": False,
                "is_merchant": current_user.is_merchant,
                "merchant_verified": current_user.merchant_verified,
                "verification_status": current_user.merchant_verification_status
            }
        }
    
    return {
        "success": True,
        "data": {
            "has_application": True,
            "merchant": merchant.to_dict(),
            "is_merchant": current_user.is_merchant,
            "merchant_verified": current_user.merchant_verified,
            "verification_status": current_user.merchant_verification_status,
            "verification_notes": merchant.verification_notes
        }
    }


@router.get("/admin/pending-applications")
def get_pending_merchant_applications(
    page: int = 1,
    limit: int = 20,
    status: str = "pending",
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin: Get list of pending merchant applications"""
    query = select(Merchant).where(Merchant.verification_status == status)
    
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    offset = (page - 1) * limit
    merchants = db.scalars(query.order_by(Merchant.created_at.desc()).offset(offset).limit(limit)).all()
    
    applications = []
    for m in merchants:
        user = db.get(User, m.user_id) if m.user_id else None
        applications.append({
            "id": m.id,
            "merchant": m.to_dict(),
            "business_name": m.business_name,
            "business_email": m.business_email,
            "business_phone": m.business_phone,
            "business_address": m.business_address,
            "business_city": m.business_city,
            "business_state": m.business_state,
            "business_pincode": m.business_pincode,
            "gst_number": m.gst_number,
            "pan_number": m.pan_number,
            "website_url": m.website_url,
            "user": user.to_dict() if user else None,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    
    return {
        "success": True,
        "data": {
            "applications": applications,
            "pagination": {
                "current_page": page,
                "total_pages": ceil(total / limit) if total else 0,
                "total_items": total,
                "per_page": limit
            }
        }
    }


@router.post("/admin/verify/{merchant_id}")
def verify_merchant_application(
    merchant_id: int,
    action_data: MerchantVerificationAction,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin: Approve or reject a merchant application"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant application not found")
    
    if action_data.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
    user = db.get(User, merchant.user_id) if merchant.user_id else None
    
    if action_data.action == "approve":
        merchant.status = MerchantStatus.APPROVED.value
        merchant.verification_status = "approved"
        merchant.is_verified = True
        merchant.is_active = True
        merchant.verified_at = datetime.utcnow()
        merchant.verified_by = admin_user.id
        merchant.verification_notes = action_data.notes
        
        if user:
            user.merchant_verified = True
            user.merchant_verification_status = MerchantVerificationStatus.APPROVED.value
            user.role = "merchant"
        
        message = "Merchant application approved successfully"
    else:
        merchant.status = MerchantStatus.REJECTED.value
        merchant.verification_status = "rejected"
        merchant.is_verified = False
        merchant.is_active = False
        merchant.verification_notes = action_data.notes
        
        if user:
            user.merchant_verified = False
            user.merchant_verification_status = MerchantVerificationStatus.REJECTED.value
        
        message = "Merchant application rejected"
    
    db.commit()
    db.refresh(merchant)
    if user:
        db.refresh(user)
    
    cache_invalidate_prefix(rk("cache", "merchants"))
    
    return {
        "success": True,
        "message": message,
        "data": {
            "merchant": merchant.to_dict(),
            "user": user.to_dict() if user else None
        }
    }