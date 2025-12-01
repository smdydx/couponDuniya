from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional

from ...database import get_db
from ...models import User
from ...models.push_subscription import PushSubscription, PushNotification
from ...security import get_current_user
from ...push_notifications import send_web_push, create_notification_payload

router = APIRouter(prefix="/push", tags=["Push Notifications"])


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str
    device_type: Optional[str] = "web"


class SendNotificationRequest(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    image: Optional[str] = None
    url: Optional[str] = None
    data: Optional[Dict] = None


@router.post("/subscribe", response_model=dict)
def subscribe_to_push(
    payload: SubscribeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to push notifications"""

    # Check if subscription exists
    existing = db.scalar(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )

    if existing:
        # Update existing subscription
        existing.user_id = current_user.id
        existing.p256dh_key = payload.p256dh_key
        existing.auth_key = payload.auth_key
        existing.device_type = payload.device_type
        existing.is_active = True
        existing.last_used_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "Push subscription updated"
        }

    # Create new subscription
    subscription = PushSubscription(
        user_id=current_user.id,
        endpoint=payload.endpoint,
        p256dh_key=payload.p256dh_key,
        auth_key=payload.auth_key,
        device_type=payload.device_type,
        user_agent=request.headers.get("user-agent")
    )

    db.add(subscription)
    db.commit()

    return {
        "success": True,
        "message": "Subscribed to push notifications successfully"
    }


@router.post("/unsubscribe", response_model=dict)
def unsubscribe_from_push(
    endpoint: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unsubscribe from push notifications"""

    subscription = db.scalar(
        select(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.endpoint == endpoint
        )
    )

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription.is_active = False
    db.commit()

    return {
        "success": True,
        "message": "Unsubscribed from push notifications"
    }


@router.get("/subscriptions", response_model=dict)
def get_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active push subscriptions"""

    subscriptions = db.scalars(
        select(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.is_active == True
        )
    ).all()

    return {
        "success": True,
        "data": {
            "subscriptions": [
                {
                    "endpoint": sub.endpoint,
                    "device_type": sub.device_type,
                    "created_at": sub.created_at.isoformat(),
                    "last_used_at": sub.last_used_at.isoformat() if sub.last_used_at else None
                }
                for sub in subscriptions
            ]
        }
    }


@router.post("/send", response_model=dict)
async def send_push_notification(
    payload: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a push notification to current user (for testing)"""

    # Get active subscriptions
    subscriptions = db.scalars(
        select(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.is_active == True
        )
    ).all()

    if not subscriptions:
        raise HTTPException(status_code=404, detail="No active subscriptions found")

    sent_count = 0
    failed_subscriptions = []

    for subscription in subscriptions:
        subscription_info = {
            "endpoint": subscription.endpoint,
            "p256dh_key": subscription.p256dh_key,
            "auth_key": subscription.auth_key
        }

        success = send_web_push(
            subscription_info,
            payload.title,
            payload.body,
            payload.icon,
            payload.image,
            payload.url,
            payload.data
        )

        if success:
            sent_count += 1
            subscription.last_used_at = datetime.utcnow()
        else:
            failed_subscriptions.append(subscription.endpoint)
            subscription.is_active = False

    # Create notification record
    notification = PushNotification(
        user_id=current_user.id,
        title=payload.title,
        body=payload.body,
        icon=payload.icon,
        image=payload.image,
        url=payload.url,
        data=str(payload.data) if payload.data else None,
        status="sent" if sent_count > 0 else "failed",
        sent_at=datetime.utcnow() if sent_count > 0 else None
    )
    db.add(notification)
    db.commit()

    return {
        "success": sent_count > 0,
        "message": f"Notification sent to {sent_count} device(s)",
        "data": {
            "sent_count": sent_count,
            "failed_count": len(failed_subscriptions)
        }
    }


@router.get("/history", response_model=dict)
def get_notification_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get push notification history"""

    from sqlalchemy import func, desc

    query = select(PushNotification).where(PushNotification.user_id == current_user.id)

    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    )

    # Apply pagination
    query = query.order_by(desc(PushNotification.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    notifications = db.scalars(query).all()

    return {
        "success": True,
        "data": {
            "notifications": [
                {
                    "id": notif.id,
                    "title": notif.title,
                    "body": notif.body,
                    "status": notif.status,
                    "sent_at": notif.sent_at.isoformat() if notif.sent_at else None,
                    "created_at": notif.created_at.isoformat()
                }
                for notif in notifications
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit
            }
        }
    }


# Admin endpoint to send notifications to all users or specific users
@router.post("/admin/broadcast", response_model=dict)
async def broadcast_notification(
    payload: SendNotificationRequest,
    user_ids: Optional[list[int]] = None,
    db: Session = Depends(get_db)
):
    """Broadcast push notification to users (Admin only)"""
    # TODO: Add admin authentication

    query = select(PushSubscription).where(PushSubscription.is_active == True)

    if user_ids:
        query = query.where(PushSubscription.user_id.in_(user_ids))

    subscriptions = db.scalars(query).all()

    if not subscriptions:
        raise HTTPException(status_code=404, detail="No active subscriptions found")

    sent_count = 0
    failed_count = 0

    for subscription in subscriptions:
        subscription_info = {
            "endpoint": subscription.endpoint,
            "p256dh_key": subscription.p256dh_key,
            "auth_key": subscription.auth_key
        }

        success = send_web_push(
            subscription_info,
            payload.title,
            payload.body,
            payload.icon,
            payload.image,
            payload.url,
            payload.data
        )

        if success:
            sent_count += 1
            subscription.last_used_at = datetime.utcnow()

            # Create notification record
            notification = PushNotification(
                user_id=subscription.user_id,
                title=payload.title,
                body=payload.body,
                icon=payload.icon,
                image=payload.image,
                url=payload.url,
                data=str(payload.data) if payload.data else None,
                status="sent",
                sent_at=datetime.utcnow()
            )
            db.add(notification)
        else:
            failed_count += 1
            subscription.is_active = False

    db.commit()

    return {
        "success": True,
        "message": f"Broadcast sent to {sent_count} subscribers",
        "data": {
            "sent_count": sent_count,
            "failed_count": failed_count,
            "total_subscriptions": len(subscriptions)
        }
    }
