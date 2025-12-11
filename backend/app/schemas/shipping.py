from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ShippingZoneCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    zone_type: str = "state"
    states: Optional[List[str]] = None
    pincode_ranges: Optional[List[str]] = None
    is_active: bool = True

class ShippingZoneRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    zone_type: str
    states: Optional[List[str]] = None
    pincode_ranges: Optional[List[str]] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ShippingRateCreate(BaseModel):
    zone_id: int
    rate_type: str = "weight_based"
    shipping_method: str = "standard"
    min_weight: float = 0
    max_weight: Optional[float] = None
    min_order_value: float = 0
    max_order_value: Optional[float] = None
    base_rate: float = Field(..., ge=0)
    per_kg_rate: float = 0
    cod_charges: float = 0
    min_delivery_days: int = 3
    max_delivery_days: int = 7
    is_active: bool = True

class ShippingRateRead(BaseModel):
    id: int
    zone_id: int
    rate_type: str
    shipping_method: str
    min_weight: float
    max_weight: Optional[float] = None
    min_order_value: float
    max_order_value: Optional[float] = None
    base_rate: float
    per_kg_rate: float
    cod_charges: float
    min_delivery_days: int
    max_delivery_days: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CourierPartnerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=50)
    logo_url: Optional[str] = None
    api_type: str = "direct"
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    supports_cod: bool = True
    supports_prepaid: bool = True
    supports_reverse: bool = True
    max_weight: float = 25
    max_length: float = 100
    max_value: Optional[float] = None
    priority: int = 0
    is_active: bool = True

class CourierPartnerRead(BaseModel):
    id: int
    name: str
    code: str
    logo_url: Optional[str] = None
    api_type: str
    supports_cod: bool
    supports_prepaid: bool
    supports_reverse: bool
    supports_surface: bool
    supports_air: bool
    max_weight: float
    max_length: float
    max_value: Optional[float] = None
    priority: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ShipmentTrackingRead(BaseModel):
    id: int
    order_id: int
    shipment_id: Optional[int] = None
    awb_number: str
    courier_code: str
    status: str
    status_code: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    event_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class FreeShippingRuleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    min_order_value: float = Field(..., ge=0)
    applicable_zones: Optional[List[int]] = None
    applicable_categories: Optional[List[int]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int = 0
    is_active: bool = True

class FreeShippingRuleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    min_order_value: float
    applicable_zones: Optional[List[int]] = None
    applicable_categories: Optional[List[int]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ShippingCalculateRequest(BaseModel):
    from_pincode: str = Field(..., min_length=6, max_length=6)
    to_pincode: str = Field(..., min_length=6, max_length=6)
    weight: float = Field(..., gt=0)
    order_value: float = Field(..., gt=0)
    is_cod: bool = False

class ShippingCalculateResponse(BaseModel):
    is_serviceable: bool
    shipping_cost: float = 0
    cod_charges: float = 0
    total_shipping: float = 0
    min_delivery_days: int = 3
    max_delivery_days: int = 7
    shipping_method: str = "standard"
    free_shipping_eligible: bool = False
    free_shipping_threshold: Optional[float] = None
    available_couriers: List[str] = []

class PincodeCheckRequest(BaseModel):
    pincode: str = Field(..., min_length=6, max_length=6)

class PincodeCheckResponse(BaseModel):
    pincode: str
    is_serviceable: bool
    city: Optional[str] = None
    state: Optional[str] = None
    cod_available: bool = True
    delivery_days: int = 5
    zone: Optional[str] = None
