from fastapi import APIRouter, status, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ...redis_client import acquire_lock, release_lock, enqueue, publish, rk
from ...queue import push_email_job, push_sms_job
from ...database import get_db
from ...models import Order
from ...config import get_settings
import uuid

settings = get_settings()

router = APIRouter(tags=["Checkout"])


class CartItem(BaseModel):
    variant_id: int
    quantity: int


class CartValidateRequest(BaseModel):
    items: list[CartItem]
    promo_code: str | None = None


class CreateOrderRequest(BaseModel):
    items: list[CartItem]
    promo_code: str | None = None
    use_wallet_balance: bool | None = None
    wallet_amount: float | None = None
    delivery_email: str
    delivery_mobile: str


class VerifyPaymentRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/cart/validate", response_model=dict)
def validate_cart(payload: CartValidateRequest):
    return {
        "success": True,
        "data": {
            "items": [
                {
                    "variant_id": item.variant_id,
                    "product_name": "Flipkart E-Gift Voucher",
                    "denomination": 100.00,
                    "quantity": item.quantity,
                    "unit_price": 100.00,
                    "total_price": 100.00 * item.quantity,
                    "is_available": True,
                }
                for item in payload.items
            ],
            "subtotal": 700.00,
            "discount": 70.00 if payload.promo_code else 0.0,
            "tax": 0.00,
            "total": 630.00 if payload.promo_code else 700.00,
            "promo_applied": {
                "code": payload.promo_code or "NONE",
                "discount_type": "percentage",
                "discount_value": 10,
            }
            if payload.promo_code
            else None,
        },
    }


@router.post("/checkout/create-order", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_order(payload: CreateOrderRequest):
    lock_name = rk("checkout", payload.delivery_email or payload.delivery_mobile)
    if not acquire_lock(lock_name, ttl=15):
        raise HTTPException(status_code=429, detail="Another checkout is in progress. Please retry.")
    
    try:
        order_id = uuid.uuid4().int >> 96
        response = {
            "success": True,
            "data": {
                "order_id": order_id,
                "order_number": f"ORD-{order_id}",
                "uuid": str(uuid.uuid4()),
                "total_amount": 530.00,
                "payment_required": True,
                "payment_details": {
                    "gateway": "razorpay",
                    "order_id": "order_Nkd...",
                    "amount": 53000,
                    "currency": "INR",
                    "key": "rzp_live_mock",
                },
            },
        }
        enqueue("queue:checkout", {"event": "order_created", "order_id": order_id, "email": payload.delivery_email})
        publish("events:checkout", {"order_id": order_id, "status": "created"})
        return response
    finally:
        release_lock(lock_name)


@router.post("/checkout/payment-webhook", status_code=status.HTTP_204_NO_CONTENT)
def payment_webhook():
    # In production, verify Razorpay signature and update order status
    return


@router.post("/checkout/verify-payment", response_model=dict)
def verify_payment(payload: VerifyPaymentRequest, db: Session = Depends(get_db)):
    publish("events:payments", {"order_id": payload.order_id, "status": "paid", "razorpay_payment_id": payload.razorpay_payment_id})
    
    # Queue order confirmation email (in production, get actual order details from DB)
    if settings.EMAIL_ENABLED:
        # In production, fetch order from DB to get user email and order details
        # For now, this is a placeholder structure
        push_email_job(
            "order_confirmation",
            "user@example.com",  # TODO: Get from order.user.email
            {
                "user_name": "Customer",  # TODO: Get from order.user.name
                "order_number": f"ORD-{payload.order_id}",
                "total_amount": 0,  # TODO: Get from order.total_amount
                "items_count": 0,  # TODO: Get from order items
                "payment_id": payload.razorpay_payment_id,
                "order_url": f"https://app.example.com/orders/{payload.order_id}"
            }
        )
    
    return {
        "success": True,
        "data": {
            "payment_verified": True,
            "order_status": "paid",
            "message": "Payment successful! Order processing started.",
        },
    }
