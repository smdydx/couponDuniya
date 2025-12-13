"""Cart and Checkout schemas."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CartItem(BaseModel):
    """Single item in cart."""
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(ge=1, default=1)
    
    class Config:
        from_attributes = True


class CartValidateRequest(BaseModel):
    """Request to validate cart before checkout."""
    items: List[CartItem]
    promo_code: Optional[str] = None
    wallet_amount: Optional[float] = Field(default=0, ge=0)


class CartItemValidated(BaseModel):
    """Validated cart item with pricing."""
    product_id: int
    product_name: str
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    is_available: bool
    stock_available: int
    merchant_name: str


class PromoCodeInfo(BaseModel):
    """Promo code details."""
    code: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float
    discount_amount: float
    is_valid: bool
    message: Optional[str] = None


class CartValidateResponse(BaseModel):
    """Validated cart with totals."""
    items: List[CartItemValidated]
    subtotal: float
    discount_amount: float = 0
    wallet_used: float = 0
    tax_amount: float = 0
    total_amount: float
    promo_code: Optional[PromoCodeInfo] = None
    is_valid: bool
    errors: List[str] = []


class CheckoutRequest(BaseModel):
    """Checkout request to create order."""
    items: List[CartItem]
    promo_code: Optional[str] = None
    wallet_amount: Optional[float] = Field(default=0, ge=0)
    
    # Delivery details (for digital products, can be minimal)
    email: Optional[str] = None
    mobile: Optional[str] = None
    notes: Optional[str] = None


class PaymentDetails(BaseModel):
    """Razorpay payment details."""
    order_id: str
    amount: int  # In paisa (₹100 = 10000 paisa)
    currency: str = "INR"
    key: str


class CheckoutResponse(BaseModel):
    """Response after creating order."""
    success: bool
    order_id: int
    order_number: str
    uuid: str
    total_amount: float
    payment_required: float
    payment_details: Optional[PaymentDetails] = None
    message: str


class PaymentVerificationRequest(BaseModel):
    """Razorpay payment verification."""
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerificationResponse(BaseModel):
    """Payment verification response."""
    success: bool
    order_number: str
    message: str
    order_status: str


class PromoCodeCreate(BaseModel):
    """Create new promo code."""
    code: str = Field(min_length=3, max_length=50)
    description: Optional[str] = None
    discount_type: str = Field(pattern='^(percentage|fixed)$')
    discount_value: float = Field(gt=0)
    min_order_amount: Optional[float] = Field(default=0, ge=0)
    max_discount: Optional[float] = Field(default=None, ge=0)
    usage_limit: Optional[int] = Field(default=None, ge=1)
    user_limit: Optional[int] = Field(default=1, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True


class PromoCodeRead(PromoCodeCreate):
    """Promo code with ID."""
    id: int
    usage_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True
