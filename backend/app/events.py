"""High-level event publish helpers wrapping Redis Pub/Sub.
Used by API endpoints to broadcast real-time changes to clients.
"""
from .redis_client import publish, rk


def publish_order_event(order_number: str, status: str, payment_status: str, fulfillment_status: str):
    publish("events:orders", {
        "order_number": order_number,
        "status": status,
        "payment_status": payment_status,
        "fulfillment_status": fulfillment_status,
    })


def publish_cashback_event(event_id: int, status: str, user_id: int):
    publish("events:cashback", {
        "id": event_id,
        "status": status,
        "user_id": user_id,
    })