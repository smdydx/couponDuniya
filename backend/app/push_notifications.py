from pywebpush import webpush, WebPushException
import json
from typing import Dict, List, Optional
from .config import get_settings

settings = get_settings()


def send_web_push(
    subscription_info: Dict[str, str],
    title: str,
    body: str,
    icon: Optional[str] = None,
    image: Optional[str] = None,
    url: Optional[str] = None,
    data: Optional[Dict] = None
) -> bool:
    """Send a web push notification"""

    try:
        payload = {
            "title": title,
            "body": body,
            "icon": icon or "/logo.png",
            "badge": "/badge.png",
        }

        if image:
            payload["image"] = image

        if url:
            payload["url"] = url

        if data:
            payload["data"] = data

        subscription = {
            "endpoint": subscription_info["endpoint"],
            "keys": {
                "p256dh": subscription_info["p256dh_key"],
                "auth": subscription_info["auth_key"]
            }
        }

        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"
            }
        )

        return True

    except WebPushException as e:
        print(f"Web push failed: {e}")
        if e.response and e.response.status_code in [404, 410]:
            # Subscription expired or invalid
            return False
        return False
    except Exception as e:
        print(f"Push notification error: {e}")
        return False


async def send_fcm_notification(
    fcm_token: str,
    title: str,
    body: str,
    data: Optional[Dict] = None
) -> bool:
    """Send FCM notification (Android/iOS)"""
    import httpx

    try:
        url = f"https://fcm.googleapis.com/fcm/send"

        headers = {
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "to": fcm_token,
            "notification": {
                "title": title,
                "body": body,
            },
            "priority": "high"
        }

        if data:
            payload["data"] = data

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)

            return response.status_code == 200

    except Exception as e:
        print(f"FCM notification error: {e}")
        return False


def create_notification_payload(
    notification_type: str,
    **kwargs
) -> Dict:
    """Create notification payload based on type"""

    templates = {
        "cashback_earned": {
            "title": "Cashback Earned!",
            "body": "You've earned ₹{amount} cashback on your recent purchase",
            "icon": "/icons/cashback.png",
            "url": "/wallet"
        },
        "order_confirmed": {
            "title": "Order Confirmed",
            "body": "Your order #{order_id} has been confirmed",
            "icon": "/icons/order.png",
            "url": "/orders/{order_id}"
        },
        "withdrawal_approved": {
            "title": "Withdrawal Approved",
            "body": "Your withdrawal of ₹{amount} has been approved",
            "icon": "/icons/money.png",
            "url": "/wallet"
        },
        "new_offer": {
            "title": "New Offer Available!",
            "body": "{merchant_name}: {offer_title}",
            "icon": "/icons/offer.png",
            "url": "/offers/{offer_id}",
            "image": "{offer_image}"
        },
        "referral_signup": {
            "title": "Referral Successful!",
            "body": "{referee_name} joined using your referral link",
            "icon": "/icons/referral.png",
            "url": "/referrals"
        }
    }

    template = templates.get(notification_type, {
        "title": "Notification",
        "body": "You have a new notification"
    })

    # Format template with kwargs
    return {
        key: value.format(**kwargs) if isinstance(value, str) else value
        for key, value in template.items()
    }
