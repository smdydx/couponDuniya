"""Merchant service layer for business logic"""
import re
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from ..models import Merchant, MerchantCategory, Category, Offer, User, AffiliateTransaction
from ..schemas.merchant_admin import (
    MerchantCreateRequest, MerchantUpdateRequest, MerchantApprovalRequest
)


class MerchantService:
    """Service for merchant operations"""

    @staticmethod
    def generate_slug(name: str) -> str:
        """Generate URL-friendly slug from merchant name"""
        slug = name.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special characters
        slug = re.sub(r'[-\s]+', '-', slug)  # Replace spaces and multiple dashes with single dash
        slug = slug.strip('-')  # Remove leading/trailing dashes
        return slug

    @staticmethod
    def make_slug_unique(base_slug: str, db: Session, exclude_id: Optional[int] = None) -> str:
        """Ensure slug is unique by appending number if needed"""
        slug = base_slug
        counter = 1
        
        query = select(Merchant).where(Merchant.slug == slug)
        if exclude_id:
            query = query.where(Merchant.id != exclude_id)
        
        while db.scalar(query):
            slug = f"{base_slug}-{counter}"
            counter += 1
            query = select(Merchant).where(Merchant.slug == slug)
            if exclude_id:
                query = query.where(Merchant.id != exclude_id)
        
        return slug

    @staticmethod
    def validate_affiliate_settings(affiliate_settings: dict) -> Tuple[bool, Optional[str]]:
        """Validate affiliate settings"""
        if not affiliate_settings:
            return True, None

        network = affiliate_settings.get('affiliate_network')
        if network and network not in ['admitad', 'impact', 'cuelinks', 'inhouse']:
            return False, "Invalid affiliate network"

        if network != 'inhouse':
            if not affiliate_settings.get('affiliate_network_id'):
                return False, f"Network ID is required for {network}"
            if not affiliate_settings.get('tracking_url'):
                return False, f"Tracking URL is required for {network}"

        return True, None

    @staticmethod
    def create_merchant(
        db: Session,
        data: MerchantCreateRequest,
        created_by_admin_id: Optional[int] = None
    ) -> Tuple[Merchant, Optional[str]]:
        """Create a new merchant with validation"""
        
        # Check if merchant already exists
        existing = db.scalar(select(Merchant).where(Merchant.name == data.name))
        if existing:
            return None, f"Merchant '{data.name}' already exists"

        # Validate affiliate settings if provided
        affiliate_dict = data.affiliate_settings.dict() if data.affiliate_settings else {}
        is_valid, error = MerchantService.validate_affiliate_settings(affiliate_dict)
        if not is_valid:
            return None, error

        # Generate slug
        base_slug = MerchantService.generate_slug(data.name)
        slug = MerchantService.make_slug_unique(base_slug, db)

        # Create merchant
        merchant = Merchant(
            name=data.name,
            slug=slug,
            logo_url=data.logo_url,
            description=data.description,
            website_url=data.website_url,
            affiliate_network=affiliate_dict.get('affiliate_network'),
            affiliate_network_id=affiliate_dict.get('affiliate_network_id'),
            tracking_url=affiliate_dict.get('tracking_url'),
            base_commission=affiliate_dict.get('base_commission'),
            status='pending',  # All new merchants start as pending
            is_active=data.is_active,
            is_featured=data.is_featured,
            show_on_homepage=data.show_on_homepage,
        )

        db.add(merchant)
        db.flush()  # Get the merchant ID

        # Add categories
        if data.category_ids:
            for category_id in data.category_ids:
                category = db.scalar(select(Category).where(Category.id == category_id))
                if not category:
                    return None, f"Category with ID {category_id} not found"
                
                merchant_cat = MerchantCategory(
                    merchant_id=merchant.id,
                    category_id=category_id
                )
                db.add(merchant_cat)

        db.commit()
        db.refresh(merchant)
        return merchant, None

    @staticmethod
    def update_merchant(
        db: Session,
        merchant_id: int,
        data: MerchantUpdateRequest
    ) -> Tuple[Merchant, Optional[str]]:
        """Update merchant details"""
        
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            return None, "Merchant not found"

        # Update basic fields
        if data.name:
            # Check if name is already taken
            existing = db.scalar(
                select(Merchant).where(
                    Merchant.name == data.name,
                    Merchant.id != merchant_id
                )
            )
            if existing:
                return None, f"Merchant '{data.name}' already exists"
            
            merchant.name = data.name
            # Regenerate slug if name changed
            base_slug = MerchantService.generate_slug(data.name)
            merchant.slug = MerchantService.make_slug_unique(base_slug, db, exclude_id=merchant_id)

        if data.website_url is not None:
            merchant.website_url = data.website_url
        if data.logo_url is not None:
            merchant.logo_url = data.logo_url
        if data.description is not None:
            merchant.description = data.description
        if data.is_featured is not None:
            merchant.is_featured = data.is_featured
        if data.show_on_homepage is not None:
            merchant.show_on_homepage = data.show_on_homepage
        if data.is_active is not None:
            merchant.is_active = data.is_active

        # Update affiliate settings
        if data.affiliate_settings:
            affiliate_dict = data.affiliate_settings.dict()
            is_valid, error = MerchantService.validate_affiliate_settings(affiliate_dict)
            if not is_valid:
                return None, error
            
            merchant.affiliate_network = affiliate_dict.get('affiliate_network')
            merchant.affiliate_network_id = affiliate_dict.get('affiliate_network_id')
            merchant.tracking_url = affiliate_dict.get('tracking_url')
            merchant.base_commission = affiliate_dict.get('base_commission')

        # Update categories
        if data.category_ids is not None:
            # Remove old categories
            db.execute(
                delete(MerchantCategory).where(MerchantCategory.merchant_id == merchant_id)
            )
            
            # Add new categories
            for category_id in data.category_ids:
                category = db.scalar(select(Category).where(Category.id == category_id))
                if not category:
                    return None, f"Category with ID {category_id} not found"
                
                merchant_cat = MerchantCategory(
                    merchant_id=merchant_id,
                    category_id=category_id
                )
                db.add(merchant_cat)

        merchant.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(merchant)
        return merchant, None

    @staticmethod
    def approve_merchant(
        db: Session,
        merchant_id: int,
        approved_by: int
    ) -> Tuple[Merchant, Optional[str]]:
        """Approve a merchant"""
        
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            return None, "Merchant not found"

        if merchant.status == 'approved':
            return None, "Merchant is already approved"

        merchant.status = 'approved'
        merchant.approved_at = datetime.utcnow()
        merchant.is_active = True  # Activate on approval
        merchant.rejection_reason = None
        merchant.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(merchant)
        return merchant, None

    @staticmethod
    def reject_merchant(
        db: Session,
        merchant_id: int,
        reason: str,
        rejected_by: int
    ) -> Tuple[Merchant, Optional[str]]:
        """Reject a merchant"""
        
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            return None, "Merchant not found"

        merchant.status = 'rejected'
        merchant.rejection_reason = reason
        merchant.is_active = False  # Deactivate on rejection
        merchant.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(merchant)
        return merchant, None

    @staticmethod
    def set_review_status(
        db: Session,
        merchant_id: int
    ) -> Tuple[Merchant, Optional[str]]:
        """Set merchant to reviewing status"""
        
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            return None, "Merchant not found"

        if merchant.status not in ['pending', 'reviewing']:
            return None, "Only pending or reviewing merchants can be set to review"

        merchant.status = 'reviewing'
        merchant.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(merchant)
        return merchant, None

    @staticmethod
    def test_tracking_url(tracking_url: str) -> Tuple[bool, Optional[str]]:
        """Test if tracking URL is valid and accessible"""
        import requests
        
        if not tracking_url:
            return False, "No tracking URL provided"

        try:
            response = requests.head(tracking_url, timeout=5, allow_redirects=True)
            if response.status_code < 400:
                return True, None
            else:
                return False, f"Tracking URL returned status code {response.status_code}"
        except requests.exceptions.Timeout:
            return False, "Tracking URL request timed out"
        except requests.exceptions.RequestException as e:
            return False, f"Failed to reach tracking URL: {str(e)}"

    @staticmethod
    def get_merchant_stats(db: Session, merchant_id: int) -> dict:
        """Get merchant statistics"""
        
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            return None

        # Count offers
        offers_count = db.scalar(
            select(len(db.query(Offer).filter(
                Offer.merchant_id == merchant_id,
                Offer.is_active == True
            ).all()))
        )

        # Count clicks (if offer_click table exists)
        try:
            from ..models import OfferClick
            clicks_count = db.scalar(
                select(len(db.query(OfferClick).filter(
                    OfferClick.offer_id.in_(
                        db.query(Offer.id).filter(Offer.merchant_id == merchant_id)
                    )
                ).all()))
            )
        except:
            clicks_count = 0

        return {
            "offers_count": offers_count or 0,
            "clicks_count": clicks_count,
            "status": merchant.status,
            "is_active": merchant.is_active,
        }
