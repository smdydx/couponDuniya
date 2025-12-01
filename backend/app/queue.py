"""Simple Redis-backed cart utilities and lightweight email/SMS job queue helpers."""
from typing import Any
from datetime import datetime, timezone
import json
from .redis_client import redis_client, rk, cache_get, cache_set

# Queue key helpers
EMAIL_QUEUE = rk("queue", "email")
SMS_QUEUE = rk("queue", "sms")
EMAIL_PROCESSING = rk("queue", "email", "processing")
SMS_PROCESSING = rk("queue", "sms", "processing")
EMAIL_DLQ = rk("queue", "email", "dlq")
SMS_DLQ = rk("queue", "sms", "dlq")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def cart_key(user_id: int) -> str:
    return rk("cart", str(user_id))


def get_cart(user_id: int) -> dict:
    return cache_get(cart_key(user_id)) or {"items": []}


def save_cart(user_id: int, cart: dict, ttl: int = 60 * 60 * 24 * 3):
    cache_set(cart_key(user_id), cart, ttl)


def clear_cart(user_id: int):
    redis_client.delete(cart_key(user_id))


def add_item(user_id: int, item: dict):
    cart = get_cart(user_id)
    items = cart.get("items", [])
    # If variant matches, increment quantity
    for existing in items:
        if existing["variant_id"] == item["variant_id"]:
            existing["quantity"] += item["quantity"]
            break
    else:
        items.append(item)
    cart["items"] = items
    save_cart(user_id, cart)


def update_item(user_id: int, variant_id: int, quantity: int):
    cart = get_cart(user_id)
    items = cart.get("items", [])
    for existing in items:
        if existing["variant_id"] == variant_id:
            if quantity <= 0:
                items.remove(existing)
            else:
                existing["quantity"] = quantity
            break
    cart["items"] = items
    save_cart(user_id, cart)


def remove_item(user_id: int, variant_id: int):
    cart = get_cart(user_id)
    cart["items"] = [i for i in cart.get("items", []) if i["variant_id"] != variant_id]
    save_cart(user_id, cart)


# ---------------- Job Queue Helpers ----------------

def push_email_job(email_type: str, to_email: str, data: dict):
    job = {
        "type": email_type,
        "to": to_email,
        "data": data,
        "enqueued_at": _now_iso(),
        "attempts": 0,
    }
    redis_client.rpush(EMAIL_QUEUE, json.dumps(job))


def push_sms_job(sms_type: str, mobile: str, data: dict):
    job = {
        "type": sms_type,
        "mobile": mobile,
        "data": data,
        "enqueued_at": _now_iso(),
        "attempts": 0,
    }
    redis_client.rpush(SMS_QUEUE, json.dumps(job))


def get_queue_stats() -> dict:
    return {
        "email": {
            "pending": redis_client.llen(EMAIL_QUEUE),
            "processing": redis_client.scard(EMAIL_PROCESSING),
            "dlq": redis_client.llen(EMAIL_DLQ),
        },
        "sms": {
            "pending": redis_client.llen(SMS_QUEUE),
            "processing": redis_client.scard(SMS_PROCESSING),
            "dlq": redis_client.llen(SMS_DLQ),
        },
    }


def _dlq_key(queue_name: str) -> str:
    return EMAIL_DLQ if queue_name == "email" else SMS_DLQ


def _queue_key(queue_name: str) -> str:
    return EMAIL_QUEUE if queue_name == "email" else SMS_QUEUE


def get_dead_letter_jobs(queue_name: str) -> list[dict]:
    raw = redis_client.lrange(_dlq_key(queue_name), 0, -1)
    jobs = []
    for r in raw:
        try:
            jobs.append(json.loads(r))
        except Exception:
            jobs.append({"raw": r})
    return jobs


def retry_dead_letter_job(queue_name: str, index: int) -> bool:
    dlq = _dlq_key(queue_name)
    items = redis_client.lrange(dlq, 0, -1)
    if index < 0 or index >= len(items):
        return False
    job_str = items.pop(index)
    # Push back to main queue
    redis_client.rpush(_queue_key(queue_name), job_str)
    # Rebuild DLQ list
    redis_client.delete(dlq)
    for item in items:
        redis_client.rpush(dlq, item)
    return True


def clear_dead_letter_queue(queue_name: str) -> int:
    dlq = _dlq_key(queue_name)
    count = redis_client.llen(dlq)
    if count:
        redis_client.delete(dlq)
    return count
