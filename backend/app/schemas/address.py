from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional

class AddressCreate(BaseModel):
    address_type: str = "shipping"
    label: str = "home"
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=15)
    alternate_phone: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    address_line1: str = Field(..., min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    landmark: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    state_code: Optional[str] = Field(None, max_length=5)
    country: str = "India"
    country_code: str = "IN"
    pincode: str = Field(..., min_length=6, max_length=6)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gstin: Optional[str] = Field(None, max_length=15)
    is_default: bool = False

class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    label: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gstin: Optional[str] = None
    is_default: Optional[bool] = None

class AddressRead(BaseModel):
    id: int
    user_id: int
    address_type: str
    label: str
    full_name: str
    phone: str
    alternate_phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    district: Optional[str] = None
    state: str
    state_code: Optional[str] = None
    country: str = "India"
    country_code: str = "IN"
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gstin: Optional[str] = None
    is_default: bool = False
    is_verified: bool = False
    is_active: bool = True
    is_serviceable: bool = True
    cod_available: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PincodeRead(BaseModel):
    id: int
    pincode: str
    city: str
    district: str
    state: str
    state_code: str
    region: Optional[str] = None
    zone: Optional[str] = None
    is_serviceable: bool = True
    cod_available: bool = True
    prepaid_only: bool = False
    delivery_days: int = 5
    is_metro: bool = False
    tier: str = "tier3"

    class Config:
        from_attributes = True
