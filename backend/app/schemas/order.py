from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float
    fulfillment_status: str
    voucher_code: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    """Order summary for listing."""
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


class OrderRead(BaseModel):
    """Complete order details."""
    id: int
    uuid: str
    order_number: str
    user_id: int
    
    # Amounts
    subtotal: float
    discount_amount: float
    wallet_used: float
    tax_amount: float
    total_amount: float
    
    # Promo
    promo_code: Optional[str] = None
    
    # Status
    status: str
    payment_status: str
    fulfillment_status: str
    
    # Items
    items: List[OrderItemRead] = []
    
    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    """Update order status."""
    status: Optional[str] = None
    payment_status: Optional[str] = None
    fulfillment_status: Optional[str] = None


class VoucherDelivery(BaseModel):
    """Deliver voucher code for order item."""
    order_item_id: int
    voucher_code: str