"""Admin endpoints for Merchant management"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, desc
from datetime import datetime
from typing import Optional, List
from math import ceil
import json

from ...database import get_db
from ...models import Merchant, MerchantCategory, Category, Offer, User
from ...schemas.merchant_admin import (
    MerchantCreateRequest, MerchantUpdateRequest, MerchantApprovalRequest,
    MerchantDetailedResponse, MerchantListResponse, AdminMerchantListResponse
)
from ...services.merchant_service import MerchantService
from ...dependencies import require_admin, get_current_admin
from ...redis_client import cache_invalidate_prefix, rk
from ...queue import push_notification_job

router = APIRouter(prefix="/admin/merchants", tags=["Admin Merchants"])


@router.post("/", response_model=dict)
def create_merchant(
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    website_url: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category_ids: Optional[str] = Form("[]"),  # JSON string of category IDs
    affiliate_network: Optional[str] = Form(None),
    affiliate_network_id: Optional[str] = Form(None),
    tracking_url: Optional[str] = Form(None),
    base_commission: Optional[float] = Form(None),
    is_featured: bool = Form(False),
    show_on_homepage: bool = Form(False),
    logo: Optional[UploadFile] = File(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new merchant with comprehensive details
    
    **Requires:** Admin role
    
    **Fields:**
    - Basic Details: name, email, phone, website_url, description, logo
    - Category Mapping: category_ids (JSON array of category IDs)
    - Affiliate Settings: affiliate_network, affiliate_network_id, tracking_url, base_commission
    - Display Options: is_featured, show_on_homepage
    """
    try:
        # Parse category IDs
        try:
            cat_ids = json.loads(category_ids) if category_ids != "[]" else []
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid category_ids JSON format")

        # Build affiliate settings
        affiliate_settings = None
        if affiliate_network:
            affiliate_settings = {
                'affiliate_network': affiliate_network,
                'affiliate_network_id': affiliate_network_id,
                'tracking_url': tracking_url,
                'base_commission': base_commission,
            }

        # Handle logo upload
        logo_url = None
        if logo:
            # Upload to cloud storage or local filesystem
            # This is a placeholder - implement based on your storage solution
            logo_url = f"/uploads/merchants/{logo.filename}"
            # TODO: Save file and generate URL

        # Create request object
        merchant_request = MerchantCreateRequest(
            name=name,
            email=email,
            phone=phone,
            website_url=website_url,
            logo_url=logo_url,
            description=description,
            category_ids=cat_ids,
            is_featured=is_featured,
            show_on_homepage=show_on_homepage,
        )

        if affiliate_settings:
            from ...schemas.merchant_admin import MerchantAffiliateSettings
            merchant_request.affiliate_settings = MerchantAffiliateSettings(**affiliate_settings)

        # Create merchant
        merchant, error = MerchantService.create_merchant(db, merchant_request, created_by_admin_id=current_admin.id)
        
        if error:
            raise HTTPException(status_code=400, detail=error)

        # Invalidate cache
        cache_invalidate_prefix(rk("cache", "merchants"))

        # Send notification to admins about pending merchant
        push_notification_job.delay(
            user_id=current_admin.id,
            title="New Merchant Pending Review",
            body=f"Merchant '{merchant.name}' has been added and is pending approval.",
            notification_type="merchant_pending"
        )

        return {
            "success": True,
            "message": f"Merchant '{merchant.name}' created successfully. Status: Pending Review",
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "slug": merchant.slug,
                "status": merchant.status,
                "email": email,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=dict)
def list_merchants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at", enum=["created_at", "name", "status"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    List all merchants with filtering, search, and sorting
    
    **Requires:** Admin role
    
    **Query Parameters:**
    - status: Filter by status (pending, reviewing, approved, rejected)
    - search: Search by merchant name
    - sort_by: Sort by (created_at, name, status)
    - sort_order: Sort order (asc, desc)
    """
    
    query = select(Merchant)

    # Apply filters
    if status:
        valid_statuses = ['pending', 'reviewing', 'approved', 'rejected']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        query = query.where(Merchant.status == status)

    if search:
        query = query.where(
            or_(
                Merchant.name.ilike(f"%{search}%"),
                Merchant.slug.ilike(f"%{search}%"),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(Merchant)
    if status:
        count_query = count_query.where(Merchant.status == status)
    if search:
        count_query = count_query.where(
            or_(
                Merchant.name.ilike(f"%{search}%"),
                Merchant.slug.ilike(f"%{search}%"),
            )
        )
    
    total_count = db.scalar(count_query) or 0

    # Apply sorting
    sort_column = {
        "created_at": Merchant.created_at,
        "name": Merchant.name,
        "status": Merchant.status,
    }.get(sort_by, Merchant.created_at)

    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)

    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    merchants = db.scalars(query).all()

    # Get merchant IDs for batch queries
    merchant_ids = [m.id for m in merchants]

    # Batch query for offers count
    offers_count_map = {}
    if merchant_ids:
        offers_query = (
            select(Offer.merchant_id, func.count(Offer.id).label('count'))
            .where(Offer.merchant_id.in_(merchant_ids))
            .group_by(Offer.merchant_id)
        )
        for merchant_id, count in db.execute(offers_query).all():
            offers_count_map[merchant_id] = count

    # Format response
    merchants_data = []
    for m in merchants:
        merchants_data.append({
            "id": m.id,
            "name": m.name,
            "slug": m.slug,
            "logo_url": m.logo_url,
            "status": m.status,
            "is_active": m.is_active,
            "is_featured": m.is_featured,
            "offers_count": offers_count_map.get(m.id, 0),
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "approved_at": m.approved_at.isoformat() if m.approved_at else None,
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


@router.get("/{merchant_id}", response_model=dict)
def get_merchant_detail(
    merchant_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get detailed merchant information with all settings"""
    
    merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Get categories
    categories = db.scalars(
        select(Category).join(MerchantCategory).where(MerchantCategory.merchant_id == merchant_id)
    ).all()

    # Get offers count
    offers_count = db.scalar(
        select(func.count(Offer.id)).where(Offer.merchant_id == merchant_id)
    ) or 0

    return {
        "success": True,
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "slug": merchant.slug,
            "logo_url": merchant.logo_url,
            "description": merchant.description,
            "website_url": merchant.website_url,
            "status": merchant.status,
            "is_active": merchant.is_active,
            "is_featured": merchant.is_featured,
            "show_on_homepage": merchant.show_on_homepage,
            "affiliate_network": merchant.affiliate_network,
            "affiliate_network_id": merchant.affiliate_network_id,
            "tracking_url": merchant.tracking_url,
            "base_commission": merchant.base_commission,
            "categories": [
                {"id": c.id, "name": c.name, "slug": c.slug, "icon_url": c.icon_url}
                for c in categories
            ],
            "offers_count": offers_count,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
            "updated_at": merchant.updated_at.isoformat() if merchant.updated_at else None,
            "approved_at": merchant.approved_at.isoformat() if merchant.approved_at else None,
            "rejection_reason": merchant.rejection_reason,
        }
    }


@router.put("/{merchant_id}", response_model=dict)
def update_merchant(
    merchant_id: int,
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    website_url: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category_ids: Optional[str] = Form(None),
    affiliate_network: Optional[str] = Form(None),
    affiliate_network_id: Optional[str] = Form(None),
    tracking_url: Optional[str] = Form(None),
    base_commission: Optional[float] = Form(None),
    is_featured: Optional[bool] = Form(None),
    show_on_homepage: Optional[bool] = Form(None),
    is_active: Optional[bool] = Form(None),
    logo: Optional[UploadFile] = File(None),
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update merchant details"""
    
    # Check merchant exists
    merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    try:
        # Parse category IDs
        cat_ids = None
        if category_ids:
            try:
                cat_ids = json.loads(category_ids)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid category_ids JSON format")

        # Build update request
        update_data = MerchantUpdateRequest(
            name=name,
            phone=phone,
            website_url=website_url,
            description=description,
            category_ids=cat_ids,
            is_featured=is_featured,
            show_on_homepage=show_on_homepage,
            is_active=is_active,
        )

        if affiliate_network:
            from ...schemas.merchant_admin import MerchantAffiliateSettings
            update_data.affiliate_settings = MerchantAffiliateSettings(
                affiliate_network=affiliate_network,
                affiliate_network_id=affiliate_network_id,
                tracking_url=tracking_url,
                base_commission=base_commission,
            )

        # Update merchant
        updated_merchant, error = MerchantService.update_merchant(db, merchant_id, update_data)
        
        if error:
            raise HTTPException(status_code=400, detail=error)

        # Invalidate cache
        cache_invalidate_prefix(rk("cache", "merchants"))

        return {
            "success": True,
            "message": "Merchant updated successfully",
            "merchant": {
                "id": updated_merchant.id,
                "name": updated_merchant.name,
                "slug": updated_merchant.slug,
                "status": updated_merchant.status,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{merchant_id}/approve", response_model=dict)
def approve_merchant(
    merchant_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Approve a pending merchant"""
    
    merchant, error = MerchantService.approve_merchant(db, merchant_id, current_admin.id)
    
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' approved successfully",
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "status": merchant.status,
            "is_active": merchant.is_active,
        }
    }


@router.post("/{merchant_id}/reject", response_model=dict)
def reject_merchant(
    merchant_id: int,
    reason: str = Form(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reject a pending merchant"""
    
    if not reason or len(reason.strip()) == 0:
        raise HTTPException(status_code=400, detail="Rejection reason is required")

    merchant, error = MerchantService.reject_merchant(db, merchant_id, reason, current_admin.id)
    
    if error:
        raise HTTPException(status_code=400, detail=error)

    # Invalidate cache
    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' rejected",
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "status": merchant.status,
            "rejection_reason": merchant.rejection_reason,
        }
    }


@router.post("/{merchant_id}/reviewing", response_model=dict)
def set_review_status(
    merchant_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Set merchant to reviewing status"""
    
    merchant, error = MerchantService.set_review_status(db, merchant_id)
    
    if error:
        raise HTTPException(status_code=400, detail=error)

    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' set to reviewing",
        "merchant": {
            "id": merchant.id,
            "name": merchant.name,
            "status": merchant.status,
        }
    }


@router.post("/{merchant_id}/test-tracking-url", response_model=dict)
def test_tracking_url(
    merchant_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Test if merchant's tracking URL is valid and accessible"""
    
    merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if not merchant.tracking_url:
        raise HTTPException(status_code=400, detail="Merchant has no tracking URL configured")

    is_valid, error = MerchantService.test_tracking_url(merchant.tracking_url)

    return {
        "success": is_valid,
        "merchant_id": merchant_id,
        "tracking_url": merchant.tracking_url,
        "is_valid": is_valid,
        "error": error,
    }


@router.get("/{merchant_id}/stats", response_model=dict)
def get_merchant_stats(
    merchant_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get merchant statistics (offers, clicks, etc.)"""
    
    stats = MerchantService.get_merchant_stats(db, merchant_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Merchant not found")

    return {
        "success": True,
        "merchant_id": merchant_id,
        "stats": stats,
    }


@router.delete("/{merchant_id}", response_model=dict)
def delete_merchant(
    merchant_id: int,
    _: bool = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a merchant (archive approach recommended)"""
    
    merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Instead of hard delete, deactivate
    merchant.is_active = False
    merchant.status = 'rejected'
    merchant.rejection_reason = 'Merchant deleted by admin'
    db.commit()

    cache_invalidate_prefix(rk("cache", "merchants"))

    return {
        "success": True,
        "message": f"Merchant '{merchant.name}' has been deactivated",
    }
