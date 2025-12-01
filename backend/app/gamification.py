"""Referral gamification configuration and helpers (Redis-backed, static config)."""
from typing import List, Dict
from .redis_client import redis_client, rk

# Static badge definitions (threshold based on successful referrals count)
BADGES: List[Dict] = [
    {"code": "rookie", "name": "Rookie Referrer", "desc": "First referral completed", "threshold": 1},
    {"code": "scout", "name": "Scout", "desc": "5 successful referrals", "threshold": 5},
    {"code": "ambassador", "name": "Brand Ambassador", "desc": "25 successful referrals", "threshold": 25},
    {"code": "evangelist", "name": "Evangelist", "desc": "100 successful referrals", "threshold": 100},
]

# Static rewards catalog (cost is in referral points; each successful referral = 10 points)
REWARDS: List[Dict] = [
    {"code": "voucher_100", "name": "₹100 Gift Voucher", "cost": 100},
    {"code": "voucher_250", "name": "₹250 Gift Voucher", "cost": 250},
    {"code": "wallet_bonus", "name": "₹150 Wallet Bonus", "cost": 150},
    {"code": "swag_pack", "name": "Swag Pack", "cost": 500},
]

def _user_referral_count_key(user_id: int) -> str:
    return rk("referral", "user", str(user_id), "count")

def _user_points_key(user_id: int) -> str:
    return rk("referral", "user", str(user_id), "points")

def _user_badges_key(user_id: int) -> str:
    return rk("referral", "user", str(user_id), "badges")

def _user_rewards_key(user_id: int) -> str:
    return rk("referral", "user", str(user_id), "rewards")

def increment_referral(user_id: int) -> Dict[str, int]:
    """Increment referral counters and points (10 points per referral)."""
    count = redis_client.incr(_user_referral_count_key(user_id))
    points = redis_client.incrby(_user_points_key(user_id), 10)
    return {"count": count, "points": points}

def evaluate_badges(user_id: int) -> List[str]:
    """Grant any new badges whose thresholds have been met."""
    count_raw = redis_client.get(_user_referral_count_key(user_id)) or "0"
    count = int(count_raw)
    awarded = []
    for badge in BADGES:
        if count >= badge["threshold"]:
            # Use Redis set for idempotent storage
            added = redis_client.sadd(_user_badges_key(user_id), badge["code"])
            if added:
                awarded.append(badge["code"])
    return awarded

def list_user_badges(user_id: int) -> List[str]:
    return list(redis_client.smembers(_user_badges_key(user_id)))

def list_user_rewards(user_id: int) -> List[str]:
    return list(redis_client.smembers(_user_rewards_key(user_id)))

def redeem_reward(user_id: int, reward_code: str) -> Dict[str, str]:
    reward = next((r for r in REWARDS if r["code"] == reward_code), None)
    if not reward:
        return {"error": "invalid_reward"}
    points_raw = redis_client.get(_user_points_key(user_id)) or "0"
    points = int(points_raw)
    if points < reward["cost"]:
        return {"error": "insufficient_points"}
    # Deduct cost atomically via Lua or simple pipeline
    pipe = redis_client.pipeline()
    pipe.decrby(_user_points_key(user_id), reward["cost"])
    pipe.sadd(_user_rewards_key(user_id), reward_code)
    pipe.execute()
    return {"status": "redeemed", "reward": reward_code}
