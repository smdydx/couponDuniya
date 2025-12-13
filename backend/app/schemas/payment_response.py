
from pydantic import BaseModel
from datetime import datetime

class PaymentResponseBase(BaseModel):
    payment_id: int
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str | None = None
    razorpay_signature: str | None = None
    payment_status: str = "initiated"
    payment_method: str | None = None
    razorpay_response: dict | None = None
    error_description: str | None = None

class PaymentResponseCreate(PaymentResponseBase):
    pass

class PaymentResponseRead(PaymentResponseBase):
    id: int
    created_at: datetime
    updated_at: datetime | None
    
    class Config:
        from_attributes = True
