from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...database import get_db
from ...models import User, Referral
from ...dependencies import get_current_user
from ...gamification import (
    BADGES,
    REWARDS,
    increment_referral,
    evaluate_badges,
    list_user_badges,
    redeem_reward,
    list_user_rewards,
)
from ...redis_client import leaderboard_top, leaderboard_increment
from ...events import publish  # generic publish helper

router = APIRouter(prefix="/referrals", tags=["Engagement"])

@router.get("/my-code", response_model=dict)
def my_code(user: User = Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "referral_code": user.referral_code,
            "referral_link": f"https://yourcoupondomain.com/signup?ref={user.referral_code}",
        },
    }

@router.get("/leaderboard", response_model=dict)
def leaderboard(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    rows = leaderboard_top(limit)
    # Fetch minimal user info
    user_map = {}
    if rows:
        user_ids = [uid for uid, _ in rows]
        for u in db.query(User).filter(User.id.in_(user_ids)).all():
            user_map[u.id] = {"id": u.id, "name": u.full_name}
    leaderboard_rows = []
    for uid, score in rows:
        leaderboard_rows.append({
            "user": user_map.get(uid, {"id": uid, "name": "Unknown"}),
            "earnings": score,
        })
    return {"success": True, "data": {"rows": leaderboard_rows}}

@router.post("/", response_model=dict)
def create_referral(referral_code: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Find referrer by code
    referrer = db.query(User).filter(User.referral_code == referral_code).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")
    # Prevent duplicate referral record
    existing = db.query(Referral).filter(Referral.referrer_user_id == referrer.id, Referral.referred_user_id == user.id).first()
    if existing:
        return {"success": True, "message": "Already referred", "data": {"id": existing.id}}
    r = Referral(referrer_user_id=referrer.id, referred_user_id=user.id)
    db.add(r)
    db.commit()
    db.refresh(r)
    # Gamification counters
    counters = increment_referral(referrer.id)
    awarded = evaluate_badges(referrer.id)
    leaderboard_increment(referrer.id, 10)  # treat each referral as 10 earnings units
    publish("events:referrals", {"referrer_id": referrer.id, "referred_id": user.id, "awarded": awarded})
    return {"success": True, "data": {"referral_id": r.id, "counters": counters, "new_badges": awarded}}

@router.get("/my-badges", response_model=dict)
def my_badges(user: User = Depends(get_current_user)):
    return {"success": True, "data": {"badges": list_user_badges(user.id), "definitions": BADGES}}

@router.get("/badges", response_model=dict)
def badge_definitions():
    return {"success": True, "data": BADGES}

@router.get("/rewards", response_model=dict)
def rewards_catalog():
    return {"success": True, "data": REWARDS}

@router.get("/my-rewards", response_model=dict)
def my_rewards(user: User = Depends(get_current_user)):
    return {"success": True, "data": {"rewards": list_user_rewards(user.id)}}

@router.post("/rewards/redeem", response_model=dict)
def rewards_redeem(reward_code: str, user: User = Depends(get_current_user)):
    result = redeem_reward(user.id, reward_code)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    publish("events:rewards", {"user_id": user.id, "reward": reward_code})
    return {"success": True, "data": result}
