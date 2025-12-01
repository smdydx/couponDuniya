"""Redis-backed feature flag utilities.
Allows dynamic enabling/disabling of features without redeploying.
"""
from typing import Dict
from .redis_client import redis_client, rk

FLAGS_KEY = rk("feature", "flags")  # Hash storing flag states


def set_flag(name: str, enabled: bool) -> None:
    redis_client.hset(FLAGS_KEY, name, "1" if enabled else "0")


def get_flag(name: str, default: bool = False) -> bool:
    raw = redis_client.hget(FLAGS_KEY, name)
    if raw is None:
        return default
    return raw == "1"


def list_flags() -> Dict[str, bool]:
    data = redis_client.hgetall(FLAGS_KEY)
    return {k: v == "1" for k, v in data.items()}


def is_enabled(name: str) -> bool:
    return get_flag(name, False)


def enable(name: str) -> None:
    set_flag(name, True)


def disable(name: str) -> None:
    set_flag(name, False)