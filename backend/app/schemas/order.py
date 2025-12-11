from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List

class OrderItemRead(BaseModel):
    id: int
    order_id: int
    product_id: int
    variant_id: Optional[int] = None
    merchant_id: Optional[int] = None
    product_name: str
    variant_name: Optional[str] = None
    sku: Optional[str] = None
    image_url: Optional[str] = None
    quantity: int
    mrp: float = 0
    unit_price: float
    discount_amount: float = 0
    subtotal: float
    tax_rate: float = 18
    tax_amount: float = 0
    total_amount: float = 0
    fulfillment_status: str = "pending"
    is_returnable: bool = True
    return_status: Optional[str] = None
    awb_number: Optional[str] = None
    courier_partner: Optional[str] = None
    voucher_code: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    id: int
    order_number: str
    uuid: str
    total_amount: float
    status: str
    payment_status: str
    fulfillment_status: str
    items_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ShippingAddressCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    address_line1: str = Field(..., min_length=5, max_length=500)
    address_line2: Optional[str] = Field(None, max_length=500)
    landmark: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    state_code: Optional[str] = Field(None, max_length=5)
    pincode: str = Field(..., min_length=6, max_length=6)
    country: str = "India"


class BillingAddressCreate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = Field(None, max_length=15)


class OrderCreate(BaseModel):
    shipping_address: ShippingAddressCreate
    billing_address: Optional[BillingAddressCreate] = None
    payment_method: str = "online"
    promo_code: Optional[str] = None
    use_wallet: bool = False
    wallet_amount: float = 0
    customer_notes: Optional[str] = None


class OrderRead(BaseModel):
    id: int
    uuid: str
    order_number: str
    user_id: int
    merchant_id: Optional[int] = None
    subtotal: float
    discount_amount: float = 0
    coupon_discount: float = 0
    wallet_used: float = 0
    cashback_used: float = 0
    shipping_amount: float = 0
    shipping_discount: float = 0
    cod_charges: float = 0
    tax_amount: float = 0
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0
    total_amount: float
    payable_amount: Optional[float] = None
    promo_code: Optional[str] = None
    status: str
    payment_status: str
    fulfillment_status: str
    payment_method: str = "online"
    payment_gateway: Optional[str] = None
    gateway_order_id: Optional[str] = None
    shipping_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_email: Optional[str] = None
    shipping_address_line1: Optional[str] = None
    shipping_address_line2: Optional[str] = None
    shipping_landmark: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_pincode: Optional[str] = None
    shipping_country: str = "India"
    shipping_method: str = "standard"
    courier_partner: Optional[str] = None
    awb_number: Optional[str] = None
    tracking_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    estimated_delivery_date: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    invoice_number: Optional[str] = None
    invoice_url: Optional[str] = None
    is_cod: bool = False
    is_cancelled: bool = False
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    is_returnable: bool = True
    customer_notes: Optional[str] = None
    source: str = "web"
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    items: List[OrderItemRead] = []

    class Config:
        from_attributes = True


class OrderDetailRead(OrderRead):
    billing_name: Optional[str] = None
    billing_phone: Optional[str] = None
    billing_address_line1: Optional[str] = None
    billing_address_line2: Optional[str] = None
    billing_city: Optional[str] = None
    billing_state: Optional[str] = None
    billing_state_code: Optional[str] = None
    billing_pincode: Optional[str] = None
    billing_gstin: Optional[str] = None
    package_weight: Optional[float] = None
    delivery_attempts: int = 0
    return_window_ends_at: Optional[datetime] = None
    cod_collected: bool = False
    cod_collected_at: Optional[datetime] = None
    seller_payout_amount: float = 0
    platform_commission: float = 0
    seller_payout_status: str = "pending"
    internal_notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    fulfillment_status: Optional[str] = None
    notes: Optional[str] = None


class OrderShipmentUpdate(BaseModel):
    courier_partner: str
    awb_number: str
    tracking_url: Optional[str] = None
    estimated_delivery_date: Optional[datetime] = None
    package_weight: Optional[float] = None
    package_length: Optional[float] = None
    package_width: Optional[float] = None
    package_height: Optional[float] = None


class OrderStatusHistoryRead(BaseModel):
    id: int
    order_id: int
    from_status: Optional[str] = None
    to_status: str
    status_type: str
    notes: Optional[str] = None
    changed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: List[OrderRead]
    total: int
    page: int
    size: int
    pages: int


class OrderTrackingRead(BaseModel):
    order_number: str
    status: str
    courier_partner: Optional[str] = None
    awb_number: Optional[str] = None
    tracking_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    estimated_delivery_date: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    tracking_events: List[OrderStatusHistoryRead] = []


class VoucherDelivery(BaseModel):
    order_item_id: int
    voucher_code: str
