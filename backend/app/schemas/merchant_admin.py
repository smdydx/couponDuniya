"""Schemas for Merchant operations"""
from pydantic import BaseModel, Field, HttpUrl, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class AffiliateNetworkEnum(str, Enum):
    ADMITAD = "admitad"
    IMPACT = "impact"
    CUELINKS = "cuelinks"
    INHOUSE = "inhouse"


class MerchantStatusEnum(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"


# Request Schemas
class MerchantAffiliateSettings(BaseModel):
    affiliate_network: Optional[AffiliateNetworkEnum] = Field(None, description="Affiliate partner network")
    affiliate_network_id: Optional[str] = Field(None, max_length=120, description="Campaign ID or Network ID from affiliate partner")
    tracking_url: Optional[str] = Field(None, max_length=500, description="Base tracking URL for redirects")
    base_commission: Optional[float] = Field(None, ge=0, description="Base commission percentage or fixed amount")

    @field_validator('tracking_url')
    @classmethod
    def validate_tracking_url(cls, v):
        if v and not (v.startswith('http://') or v.startswith('https://')):
            raise ValueError('tracking_url must start with http:// or https://')
        return v


class MerchantCreateRequest(BaseModel):
    # Basic Details
    name: str = Field(..., min_length=1, max_length=255, description="Merchant name")
    email: str = Field(..., description="Merchant email")
    phone: Optional[str] = Field(None, max_length=20, description="Merchant phone")
    website_url: Optional[str] = Field(None, max_length=500, description="Merchant website")
    logo_url: Optional[str] = Field(None, max_length=500, description="Logo image URL")
    description: Optional[str] = Field(None, description="Company description for SEO")
    
    # Category Mapping
    category_ids: List[int] = Field(default_factory=list, description="IDs of categories this merchant belongs to")
    
    # Affiliate Settings
    affiliate_settings: Optional[MerchantAffiliateSettings] = None
    
    # Display Options
    is_featured: bool = Field(default=False, description="Show in featured merchants")
    show_on_homepage: bool = Field(default=False, description="Show on homepage")
    is_active: bool = Field(default=True, description="Merchant status")

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower()

    @field_validator('website_url')
    @classmethod
    def validate_website_url(cls, v):
        if v and not (v.startswith('http://') or v.startswith('https://')):
            v = f'https://{v}'
        return v


class MerchantUpdateRequest(BaseModel):
    # Basic Details
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None, max_length=20)
    website_url: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    
    # Category Mapping
    category_ids: Optional[List[int]] = None
    
    # Affiliate Settings
    affiliate_settings: Optional[MerchantAffiliateSettings] = None
    
    # Display Options
    is_featured: Optional[bool] = None
    show_on_homepage: Optional[bool] = None
    is_active: Optional[bool] = None


class MerchantApprovalRequest(BaseModel):
    status: MerchantStatusEnum = Field(..., description="New merchant status")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection if applicable")

    @field_validator('rejection_reason')
    @classmethod
    def validate_rejection_reason(cls, v, info):
        if info.data.get('status') == MerchantStatusEnum.REJECTED and not v:
            raise ValueError('rejection_reason is required when status is REJECTED')
        return v


# Response Schemas
class MerchantCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon_url: Optional[str] = None

    class Config:
        from_attributes = True


class MerchantAffiliateSettingsResponse(BaseModel):
    affiliate_network: Optional[str] = None
    affiliate_network_id: Optional[str] = None
    tracking_url: Optional[str] = None
    base_commission: Optional[float] = None


class MerchantDetailedResponse(BaseModel):
    id: int
    name: str
    slug: str
    email: str
    phone: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    status: str
    is_active: bool
    is_featured: bool
    show_on_homepage: bool
    categories: List[MerchantCategoryResponse] = []
    affiliate_settings: Optional[MerchantAffiliateSettingsResponse] = None
    offers_count: int = 0
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class MerchantListResponse(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    status: str
    is_active: bool
    is_featured: bool
    offers_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class MerchantApprovalResponse(BaseModel):
    success: bool
    message: str
    merchant: Optional[MerchantDetailedResponse] = None


class AdminMerchantListResponse(BaseModel):
    success: bool
    merchants: List[MerchantListResponse]
    pagination: dict
