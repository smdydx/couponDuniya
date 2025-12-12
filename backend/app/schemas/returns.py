from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ReturnRequestCreate(BaseModel):
    order_id: int
    order_item_id: Optional[int] = None
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    return_type: str = Field(default="return")
    return_reason: str = Field(..., min_length=2, max_length=100)
    return_reason_detail: Optional[str] = None
    customer_images: Optional[List[str]] = None
    customer_video_url: Optional[str] = None
    customer_notes: Optional[str] = None

class ReturnRequestRead(BaseModel):
    id: int
    uuid: str
    return_number: str
    rma_number: Optional[str] = None
    order_id: int
    order_item_id: Optional[int] = None
    user_id: int
    merchant_id: Optional[int] = None
    return_type: str
    return_reason: str
    return_reason_detail: Optional[str] = None
    product_id: int
    product_name: str
    variant_id: Optional[int] = None
    variant_name: Optional[str] = None
    quantity: int
    item_price: float
    return_amount: float
    shipping_deduction: float = 0
    restocking_fee: float = 0
    refund_amount: float = 0
    status: str
    pickup_scheduled_date: Optional[datetime] = None
    pickup_time_slot: Optional[str] = None
    pickup_courier: Optional[str] = None
    pickup_awb: Optional[str] = None
    picked_up_at: Optional[datetime] = None
    inspection_status: Optional[str] = None
    qc_passed: Optional[bool] = None
    refund_method: str = "original_payment"
    refund_status: str = "pending"
    refunded_at: Optional[datetime] = None
    customer_images: Optional[List[str]] = None
    customer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReturnStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ReturnPickupSchedule(BaseModel):
    pickup_scheduled_date: datetime
    pickup_time_slot: str
    pickup_courier: Optional[str] = None
    pickup_address_id: Optional[int] = None

class ReturnInspectionUpdate(BaseModel):
    inspection_status: str
    inspection_notes: Optional[str] = None
    qc_passed: bool
    is_resaleable: bool = False
    inspection_images: Optional[List[str]] = None

class RefundRead(BaseModel):
    id: int
    uuid: str
    refund_number: str
    order_id: int
    return_request_id: Optional[int] = None
    user_id: int
    refund_type: str
    refund_reason: str
    order_amount: float
    refund_amount: float
    shipping_refund: float = 0
    tax_refund: float = 0
    refund_method: str
    refund_to: Optional[str] = None
    status: str
    gateway: Optional[str] = None
    gateway_refund_id: Optional[str] = None
    initiated_at: datetime
    processed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class RefundCreate(BaseModel):
    order_id: int
    return_request_id: Optional[int] = None
    refund_type: str = "full"
    refund_reason: str
    refund_amount: float = Field(..., gt=0)
    refund_method: str = "original_payment"
    notes: Optional[str] = None

class ReturnListResponse(BaseModel):
    items: List[ReturnRequestRead]
    total: int
    page: int
    size: int
    pages: int
