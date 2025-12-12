from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, Dict, List, Any

class MerchantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255)
    display_name: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None

class MerchantBusinessDetails(BaseModel):
    business_type: str = Field(default="individual")
    legal_business_name: Optional[str] = None
    gstin: Optional[str] = Field(None, max_length=15, description="15-character GSTIN")
    pan_number: Optional[str] = Field(None, max_length=10, description="10-character PAN")
    cin_number: Optional[str] = Field(None, max_length=21, description="CIN for companies")
    msme_number: Optional[str] = Field(None, max_length=20, description="MSME/Udyam number")
    tan_number: Optional[str] = Field(None, max_length=10, description="TAN number")

class MerchantContactInfo(BaseModel):
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=15)
    contact_phone_secondary: Optional[str] = None
    contact_person_name: Optional[str] = None
    contact_person_designation: Optional[str] = None
    website_url: Optional[str] = None

class MerchantAddress(BaseModel):
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=6)
    country: str = "India"

class MerchantBankDetails(BaseModel):
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = Field(None, max_length=11)
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_account_type: str = "current"
    upi_id: Optional[str] = None

class MerchantCreate(MerchantBase):
    business_type: str = "individual"
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    registered_address_line1: Optional[str] = None
    registered_city: Optional[str] = None
    registered_state: Optional[str] = None
    registered_pincode: Optional[str] = None

class MerchantUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    business_type: Optional[str] = None
    legal_business_name: Optional[str] = None
    gstin: Optional[str] = None
    pan_number: Optional[str] = None
    cin_number: Optional[str] = None
    msme_number: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    return_policy: Optional[str] = None
    refund_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    cod_enabled: Optional[bool] = None
    free_shipping_threshold: Optional[float] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

class MerchantRead(BaseModel):
    id: int
    name: str
    slug: str
    display_name: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    business_type: str = "individual"
    is_active: bool
    is_featured: bool = False
    is_verified: bool = False
    is_trusted: bool = False
    verification_status: str = "pending"
    average_rating: float = 0
    total_reviews: int = 0
    total_products: int = 0
    total_orders: int = 0
    seller_tier: str = "bronze"
    created_at: datetime

    class Config:
        from_attributes = True

class MerchantDetailRead(MerchantRead):
    legal_business_name: Optional[str] = None
    gstin: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    registered_city: Optional[str] = None
    registered_state: Optional[str] = None
    return_policy: Optional[str] = None
    refund_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    return_window_days: int = 7
    default_shipping_days: int = 5
    free_shipping_threshold: Optional[float] = None
    cod_enabled: bool = False
    cod_limit: Optional[float] = None
    order_fulfillment_rate: float = 0
    on_time_delivery_rate: float = 0
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None

class MerchantOnboardingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    business_type: str = Field(default="individual")
    legal_business_name: Optional[str] = None
    gstin: Optional[str] = Field(None, max_length=15)
    pan_number: Optional[str] = Field(None, max_length=10)
    contact_email: EmailStr
    contact_phone: str = Field(..., min_length=10, max_length=15)
    contact_person_name: str
    registered_address_line1: str
    registered_city: str
    registered_state: str
    registered_pincode: str = Field(..., min_length=6, max_length=6)
    bank_account_name: str
    bank_account_number: str
    bank_ifsc_code: str = Field(..., min_length=11, max_length=11)
    bank_name: str

class MerchantKYCSubmission(BaseModel):
    pan_card_url: str
    gstin_certificate_url: Optional[str] = None
    cancelled_cheque_url: str
    address_proof_url: str
    business_registration_url: Optional[str] = None

class MerchantPerformanceRead(BaseModel):
    merchant_id: int
    total_orders: int = 0
    total_revenue: float = 0
    average_rating: float = 0
    total_reviews: int = 0
    order_fulfillment_rate: float = 0
    on_time_delivery_rate: float = 0
    return_rate: float = 0
    cancellation_rate: float = 0
    seller_tier: str = "bronze"
    seller_score: int = 0

    class Config:
        from_attributes = True
