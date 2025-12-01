from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime

from ...database import get_db
from ...dependencies import get_current_user
from ...models import User, Order, OrderItem
from ...schemas.order import (
    OrderSummary,
    OrderRead,
    OrderItemRead,
    OrderStatusUpdate,
    VoucherDelivery,
)
from ...sms import send_voucher_sms
from ...email import send_voucher_email
from ...events import publish_order_event

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=dict)
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's orders with pagination and filtering."""
    # Build query
    query = db.query(Order).filter(Order.user_id == current_user.id)
    
    if status:
        query = query.filter(Order.status == status)
    
    # Get total count
    total_items = query.count()
    
    # Paginate
    offset = (page - 1) * limit
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()
    
    # Convert to summaries
    order_summaries = []
    for order in orders:
        items_count = db.query(OrderItem).filter(OrderItem.order_id == order.id).count()
        order_summaries.append(OrderSummary(
            id=order.id,
            order_number=order.order_number,
            uuid=str(order.uuid),
            total_amount=float(order.total_amount),
            status=order.status,
            payment_status=order.payment_status,
            fulfillment_status=order.fulfillment_status,
            items_count=items_count,
            created_at=order.created_at
        ))
    
    total_pages = (total_items + limit - 1) // limit
    
    return {
        "success": True,
        "data": {
            "orders": [o.model_dump() for o in order_summaries],
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_items": total_items,
                "per_page": limit,
            },
        },
    }


@router.get("/{order_number}", response_model=dict)
def get_order(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete order details."""
    order = db.query(Order).options(
        joinedload(Order.items)
    ).filter(
        Order.order_number == order_number,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Convert items
    items_data = []
    for item in order.items:
        items_data.append(OrderItemRead(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product_name,
            variant_id=item.variant_id,
            variant_name=item.variant_name,
            quantity=item.quantity,
            unit_price=float(item.unit_price),
            subtotal=float(item.subtotal),
            fulfillment_status=item.fulfillment_status,
            voucher_code=item.voucher_code
        ))
    
    order_data = OrderRead(
        id=order.id,
        uuid=str(order.uuid),
        order_number=order.order_number,
        user_id=order.user_id,
        subtotal=float(order.subtotal),
        discount_amount=float(order.discount_amount),
        wallet_used=float(order.wallet_used),
        tax_amount=float(order.tax_amount),
        total_amount=float(order.total_amount),
        promo_code=order.promo_code,
        status=order.status,
        payment_status=order.payment_status,
        fulfillment_status=order.fulfillment_status,
        items=items_data,
        created_at=order.created_at,
        updated_at=order.updated_at
    )
    
    return {
        "success": True,
        "data": order_data.model_dump()
    }


@router.post("/{order_id}/fulfill", response_model=dict)
def fulfill_order(
    order_id: int,
    vouchers: List[VoucherDelivery],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fulfill order by adding voucher codes to items (Admin only).
    For now, allows any authenticated user for testing.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order items with voucher codes
    fulfilled_items = []
    for voucher_data in vouchers:
        item = db.query(OrderItem).filter(
            OrderItem.id == voucher_data.order_item_id,
            OrderItem.order_id == order_id
        ).first()
        
        if not item:
            continue
        
        item.voucher_code = voucher_data.voucher_code
        item.fulfillment_status = "delivered"
        fulfilled_items.append(item)
    
    # Update order status
    all_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    if all(item.fulfillment_status == "delivered" for item in all_items):
        order.fulfillment_status = "delivered"
        order.status = "fulfilled"
    else:
        order.fulfillment_status = "processing"
    
    db.commit()
    # Publish status change event
    publish_order_event(order.order_number, order.status, order.payment_status, order.fulfillment_status)
    
    # Send SMS notification with voucher codes
    user = db.query(User).filter(User.id == order.user_id).first()
    if user and user.mobile:
        for item in fulfilled_items:
            if item.voucher_code:
                send_voucher_sms(
                    user.mobile,
                    item.voucher_code,
                    item.product_name
                )
    
    # Send email with voucher codes
    if user and user.email and fulfilled_items:
        vouchers_data = [{
            'product_name': item.product_name,
            'code': item.voucher_code,
            'value': float(item.unit_price),
            'instructions': 'Use this code at checkout on the merchant website.'
        } for item in fulfilled_items if item.voucher_code]
        
        if vouchers_data:
            send_voucher_email(
                user.email,
                order.order_number,
                vouchers_data
            )
    
    return {
        "success": True,
        "message": f"Fulfilled {len(fulfilled_items)} items",
        "data": {
            "order_number": order.order_number,
            "fulfillment_status": order.fulfillment_status,
            "fulfilled_items": len(fulfilled_items)
        }
    }


@router.patch("/{order_id}/status", response_model=dict)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status (Admin only - for now any user for testing)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status fields
    if status_update.status:
        order.status = status_update.status
    if status_update.payment_status:
        order.payment_status = status_update.payment_status
    if status_update.fulfillment_status:
        order.fulfillment_status = status_update.fulfillment_status
    
    order.updated_at = datetime.utcnow()
    db.commit()
    publish_order_event(order.order_number, order.status, order.payment_status, order.fulfillment_status)
    
    return {
        "success": True,
        "message": "Order status updated",
        "data": {
            "order_number": order.order_number,
            "status": order.status,
            "payment_status": order.payment_status,
            "fulfillment_status": order.fulfillment_status
        }
    }
