"""Cart validation, Redis cart persistence, and checkout endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from datetime import datetime
from decimal import Decimal
import hmac
import hashlib

from ...database import get_db
from ...dependencies import get_current_user
from ...models import User, Product, ProductVariant, Order, OrderItem, PromoCode, Payment, WalletBalance
from ...schemas.cart import (
    CartValidateRequest,
    CartValidateResponse,
    CartItemValidated,
    PromoCodeInfo,
    CheckoutRequest,
    CheckoutResponse,
    PaymentDetails,
    PaymentVerificationRequest,
    PaymentVerificationResponse,
)
from ...config import get_settings
from ...email import send_order_confirmation, send_voucher_email
from ...sms import send_order_notification
from ...queue import get_cart as redis_get_cart, add_item, update_item, remove_item, clear_cart
from ...queue import get_cart as redis_get_cart, add_item, update_item, remove_item, clear_cart

settings = get_settings()
router = APIRouter(prefix="/cart", tags=["Cart & Checkout"])


def calculate_promo_discount(
    subtotal: float,
    promo: PromoCode
) -> tuple[float, PromoCodeInfo]:
    """Calculate discount from promo code."""
    discount_amount = 0.0
    
    if promo.discount_type == "percentage":
        discount_amount = subtotal * (promo.discount_value / 100)
        if promo.max_discount:
            discount_amount = min(discount_amount, float(promo.max_discount))
    else:  # fixed
        discount_amount = float(promo.discount_value)
    
    promo_info = PromoCodeInfo(
        code=promo.code,
        discount_type=promo.discount_type,
        discount_value=float(promo.discount_value),
        discount_amount=discount_amount,
        is_valid=True,
        message=f"Promo code applied: ₹{discount_amount:.2f} discount"
    )
    
    return discount_amount, promo_info


@router.post("/validate", response_model=CartValidateResponse)
def validate_cart(
    request: CartValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate cart items, check stock, apply promo code, calculate totals."""
    validated_items = []
    errors = []
    subtotal = 0.0
    
    # Validate each item
    for item in request.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        if not product:
            errors.append(f"Product {item.product_id} not found")
            continue
        
        if not product.is_active:
            errors.append(f"{product.name} is no longer available")
            continue
        
        # Check variant if specified
        variant = None
        variant_name = None
        unit_price = float(product.price)
        
        if item.variant_id:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == item.variant_id,
                ProductVariant.product_id == product.id
            ).first()
            
            if not variant:
                errors.append(f"Variant {item.variant_id} not found for {product.name}")
                continue
            
            if not variant.is_active:
                errors.append(f"{product.name} - {variant.name} is unavailable")
                continue
            
            variant_name = variant.name
            unit_price = float(variant.price)
        
        # Check stock
        stock_available = variant.stock if variant else product.stock
        is_available = stock_available >= item.quantity
        
        if not is_available:
            errors.append(f"{product.name} - only {stock_available} in stock")
        
        item_subtotal = unit_price * item.quantity
        subtotal += item_subtotal
        
        validated_items.append(CartItemValidated(
            product_id=product.id,
            product_name=product.name,
            variant_id=variant.id if variant else None,
            variant_name=variant_name,
            quantity=item.quantity,
            unit_price=unit_price,
            subtotal=item_subtotal,
            is_available=is_available,
            stock_available=stock_available,
            merchant_name=product.merchant.name if product.merchant else "Unknown"
        ))
    
    # Apply promo code if provided
    discount_amount = 0.0
    promo_info = None
    
    if request.promo_code:
        promo = db.query(PromoCode).filter(
            PromoCode.code == request.promo_code.upper(),
            PromoCode.is_active == True
        ).first()
        
        if not promo:
            promo_info = PromoCodeInfo(
                code=request.promo_code,
                discount_type="",
                discount_value=0,
                discount_amount=0,
                is_valid=False,
                message="Invalid promo code"
            )
        else:
            # Check validity period
            now = datetime.utcnow()
            if promo.valid_from and now < promo.valid_from:
                promo_info = PromoCodeInfo(
                    code=promo.code,
                    discount_type=promo.discount_type,
                    discount_value=0,
                    discount_amount=0,
                    is_valid=False,
                    message="Promo code not yet active"
                )
            elif promo.valid_until and now > promo.valid_until:
                promo_info = PromoCodeInfo(
                    code=promo.code,
                    discount_type=promo.discount_type,
                    discount_value=0,
                    discount_amount=0,
                    is_valid=False,
                    message="Promo code expired"
                )
            elif promo.usage_limit and promo.usage_count >= promo.usage_limit:
                promo_info = PromoCodeInfo(
                    code=promo.code,
                    discount_type=promo.discount_type,
                    discount_value=0,
                    discount_amount=0,
                    is_valid=False,
                    message="Promo code usage limit reached"
                )
            elif subtotal < float(promo.min_order_amount):
                promo_info = PromoCodeInfo(
                    code=promo.code,
                    discount_type=promo.discount_type,
                    discount_value=0,
                    discount_amount=0,
                    is_valid=False,
                    message=f"Minimum order amount ₹{promo.min_order_amount} required"
                )
            else:
                discount_amount, promo_info = calculate_promo_discount(subtotal, promo)
    
    # Apply wallet
    wallet_used = min(request.wallet_amount or 0, subtotal - discount_amount)
    
    # Calculate tax (18% GST on digital products)
    taxable_amount = subtotal - discount_amount
    tax_amount = taxable_amount * 0.18
    
    # Final total
    total_amount = subtotal - discount_amount - wallet_used + tax_amount
    
    is_valid = len(errors) == 0 and all(item.is_available for item in validated_items)
    
    return CartValidateResponse(
        items=validated_items,
        subtotal=subtotal,
        discount_amount=discount_amount,
        wallet_used=wallet_used,
        tax_amount=tax_amount,
        total_amount=max(0, total_amount),
        promo_code=promo_info,
        is_valid=is_valid,
        errors=errors
    )


@router.get("/", response_model=dict)
def get_cart_state(current_user: User = Depends(get_current_user)):
    """Return the user's cart stored in Redis."""
    return {"success": True, "data": redis_get_cart(current_user.id)}


@router.post("/add", response_model=dict)
def add_to_cart(item: Dict, current_user: User = Depends(get_current_user)):
    """Add item to cart stored in Redis. Expect variant_id and quantity."""
    if "variant_id" not in item or "quantity" not in item:
        raise HTTPException(status_code=400, detail="variant_id and quantity required")
    add_item(
        current_user.id,
        {"variant_id": int(item["variant_id"]), "quantity": int(item["quantity"]), "product_id": item.get("product_id")},
    )
    return {"success": True, "data": redis_get_cart(current_user.id)}


@router.post("/update", response_model=dict)
def update_cart_item(item: Dict, current_user: User = Depends(get_current_user)):
    """Update quantity for an item."""
    if "variant_id" not in item or "quantity" not in item:
        raise HTTPException(status_code=400, detail="variant_id and quantity required")
    update_item(current_user.id, int(item["variant_id"]), int(item["quantity"]))
    return {"success": True, "data": redis_get_cart(current_user.id)}


@router.post("/remove", response_model=dict)
def remove_cart_item(item: Dict, current_user: User = Depends(get_current_user)):
    """Remove an item."""
    if "variant_id" not in item:
        raise HTTPException(status_code=400, detail="variant_id required")
    remove_item(current_user.id, int(item["variant_id"]))
    return {"success": True, "data": redis_get_cart(current_user.id)}


@router.post("/clear", response_model=dict)
def clear_cart_items(current_user: User = Depends(get_current_user)):
    """Clear cart."""
    clear_cart(current_user.id)
    return {"success": True, "data": redis_get_cart(current_user.id)}


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create order and initiate payment."""
    # First validate cart
    validation = validate_cart(
        CartValidateRequest(
            items=request.items,
            promo_code=request.promo_code,
            wallet_amount=request.wallet_amount
        ),
        db,
        current_user
    )
    
    if not validation.is_valid:
        raise HTTPException(status_code=400, detail={
            "message": "Cart validation failed",
            "errors": validation.errors
        })
    
    # Generate order number
    import uuid
    order_uuid = uuid.uuid4()
    order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Create order
    order = Order(
        uuid=order_uuid,
        order_number=order_number,
        user_id=current_user.id,
        subtotal=Decimal(str(validation.subtotal)),
        discount_amount=Decimal(str(validation.discount_amount)),
        wallet_used=Decimal(str(validation.wallet_used)),
        tax_amount=Decimal(str(validation.tax_amount)),
        total_amount=Decimal(str(validation.total_amount)),
        promo_code=request.promo_code,
        status="pending",
        payment_status="pending",
        fulfillment_status="pending"
    )
    
    db.add(order)
    db.flush()
    
    # Create order items
    for item in validation.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            product_name=item.product_name,
            variant_name=item.variant_name,
            quantity=item.quantity,
            unit_price=Decimal(str(item.unit_price)),
            subtotal=Decimal(str(item.subtotal)),
            fulfillment_status="pending"
        )
        db.add(order_item)
    
    # Deduct wallet if used
    if validation.wallet_used > 0:
        wallet = db.query(WalletBalance).filter(
            WalletBalance.user_id == current_user.id
        ).first()
        
        if not wallet or float(wallet.balance) < validation.wallet_used:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        
        wallet.balance = Decimal(str(float(wallet.balance) - validation.wallet_used))
    
    # Update promo code usage
    if request.promo_code and validation.promo_code and validation.promo_code.is_valid:
        promo = db.query(PromoCode).filter(PromoCode.code == request.promo_code.upper()).first()
        if promo:
            promo.usage_count += 1
    
    db.commit()
    db.refresh(order)
    
    # Create Razorpay order if payment required
    payment_details = None
    payment_required = validation.total_amount
    
    if payment_required > 0:
        # TODO: Integrate actual Razorpay API
        # For now, create mock payment details
        razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"
        
        payment = Payment(
            order_id=order.id,
            gateway="razorpay",
            gateway_order_id=razorpay_order_id,
            amount=Decimal(str(payment_required)),
            currency="INR",
            status="initiated"
        )
        db.add(payment)
        db.commit()
        
        payment_details = PaymentDetails(
            order_id=razorpay_order_id,
            amount=int(payment_required * 100),  # Convert to paisa
            currency="INR",
            key=settings.RAZORPAY_KEY_ID if hasattr(settings, 'RAZORPAY_KEY_ID') else "rzp_test_key"
        )
    else:
        # Order paid via wallet completely
        order.payment_status = "completed"
        order.status = "paid"
        db.commit()
    
    return CheckoutResponse(
        success=True,
        order_id=order.id,
        order_number=order.order_number,
        uuid=str(order.uuid),
        total_amount=float(validation.total_amount),
        payment_required=payment_required,
        payment_details=payment_details,
        message="Order created successfully" if payment_required == 0 else "Proceed to payment"
    )


@router.post("/verify-payment", response_model=PaymentVerificationResponse)
def verify_payment(
    request: PaymentVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify Razorpay payment and update order status."""
    # Get order
    order = db.query(Order).filter(
        Order.id == request.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get payment record
    payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.gateway_order_id == request.razorpay_order_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    # Verify signature
    # TODO: Integrate actual Razorpay signature verification
    razorpay_key_secret = settings.RAZORPAY_KEY_SECRET if hasattr(settings, 'RAZORPAY_KEY_SECRET') else "test_secret"
    
    message = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected_signature = hmac.new(
        razorpay_key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # For development, skip actual verification
    # if expected_signature != request.razorpay_signature:
    #     raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # Update payment
    payment.gateway_payment_id = request.razorpay_payment_id
    payment.gateway_signature = request.razorpay_signature
    payment.status = "completed"
    payment.paid_at = datetime.utcnow()
    
    # Update order
    order.payment_status = "completed"
    order.status = "paid"
    
    db.commit()
    db.refresh(order)
    
    # Send order confirmation email
    if current_user.email:
        items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        items_data = [{
            'product_name': item.product_name,
            'quantity': item.quantity,
            'unit_price': float(item.unit_price),
            'subtotal': float(item.subtotal)
        } for item in items]
        
        send_order_confirmation(
            current_user.email,
            order.order_number,
            float(order.total_amount),
            items_data
        )
    
    # Send SMS notification
    if current_user.mobile:
        send_order_notification(
            current_user.mobile,
            order.order_number,
            float(order.total_amount)
        )
    
    return PaymentVerificationResponse(
        success=True,
        order_number=order.order_number,
        message="Payment verified successfully",
        order_status=order.status
    )
