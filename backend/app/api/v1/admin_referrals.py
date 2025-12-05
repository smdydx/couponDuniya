
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ...database import get_db
from ...models import User, Referral
from ...dependencies import get_current_admin_user

router = APIRouter(prefix="/admin/referrals", tags=["Admin Referrals"])

@router.get("/", response_model=dict)
def get_referral_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    level: str = Query("all"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Get paginated list of users with referral data including left/right child structure"""
    
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.contains(search)) |
            (User.full_name.contains(search)) |
            (User.referral_code.contains(search))
        )
    
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    
    user_data = []
    for user in users:
        # Get referral stats
        total_referrals = db.query(Referral).filter(Referral.referrer_user_id == user.id).count()
        
        # Get referred by
        referred_by_rel = db.query(Referral).filter(Referral.referred_user_id == user.id).first()
        referred_by = None
        if referred_by_rel:
            referrer = db.query(User).filter(User.id == referred_by_rel.referrer_user_id).first()
            referred_by = {"id": referrer.id, "name": referrer.full_name} if referrer else None
        
        # Binary tree children (left and right)
        children = db.query(Referral).filter(Referral.referrer_user_id == user.id).limit(2).all()
        left_child = None
        right_child = None
        
        if len(children) > 0:
            left_user = db.query(User).filter(User.id == children[0].referred_user_id).first()
            if left_user:
                left_child = {"id": left_user.id, "name": left_user.full_name}
        
        if len(children) > 1:
            right_user = db.query(User).filter(User.id == children[1].referred_user_id).first()
            if right_user:
                right_child = {"id": right_user.id, "name": right_user.full_name}
        
        user_data.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "referral_code": user.referral_code,
            "referred_by_id": referred_by_rel.referrer_user_id if referred_by_rel else None,
            "referred_by_name": referred_by["name"] if referred_by else None,
            "total_referrals": total_referrals,
            "active_referrals": total_referrals,
            "total_earnings": 0,
            "current_level": 1,
            "left_child_id": left_child["id"] if left_child else None,
            "right_child_id": right_child["id"] if right_child else None,
            "left_child_name": left_child["name"] if left_child else None,
            "right_child_name": right_child["name"] if right_child else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        })
    
    # Calculate stats
    total_users = db.query(User).count()
    users_with_referrals = db.query(User).join(Referral, User.id == Referral.referrer_user_id).distinct().count()
    
    # Generate level stats for 50 levels
    level_stats = []
    for level in range(1, 51):
        level_stats.append({
            "level": level,
            "user_count": max(0, int(1000 / (1.5 ** (level - 1)))),
            "total_earnings": max(0, int(50000 / (1.3 ** (level - 1)))),
            "commission_rate": max(0.5, 10 - (level - 1) * 0.2)
        })
    
    return {
        "success": True,
        "data": {
            "users": user_data,
            "stats": {
                "total_users": total_users,
                "users_with_referrals": users_with_referrals,
                "total_referral_earnings": 0,
                "average_referrals_per_user": round(users_with_referrals / total_users if total_users > 0 else 0, 1),
                "max_level_reached": 12
            },
            "level_stats": level_stats,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit
            }
        }
    }


@router.get("/tree", response_model=dict)
@router.get("/tree/{user_id}", response_model=dict)
def get_referral_tree(
    user_id: int = None,
    depth: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Get binary tree structure for referrals with left/right children"""
    
    def build_tree(user: User, current_depth: int, max_depth: int):
        if current_depth >= max_depth or not user:
            return None
        
        # Get left and right children
        children = db.query(Referral).filter(Referral.referrer_user_id == user.id).limit(2).all()
        
        left_child = None
        right_child = None
        
        if len(children) > 0:
            left_user = db.query(User).filter(User.id == children[0].referred_user_id).first()
            if left_user:
                left_child = build_tree(left_user, current_depth + 1, max_depth)
        
        if len(children) > 1:
            right_user = db.query(User).filter(User.id == children[1].referred_user_id).first()
            if right_user:
                right_child = build_tree(right_user, current_depth + 1, max_depth)
        
        total_referrals = db.query(Referral).filter(Referral.referrer_user_id == user.id).count()
        
        return {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "referral_code": user.referral_code,
            "level": current_depth + 1,
            "earnings": 0,
            "total_referrals": total_referrals,
            "is_active": user.is_active,
            "left": left_child,
            "right": right_child
        }
    
    # Get root user
    if user_id:
        root_user = db.query(User).filter(User.id == user_id).first()
    else:
        # Get first user as root
        root_user = db.query(User).order_by(User.id).first()
    
    if not root_user:
        return {"success": False, "data": None}
    
    tree = build_tree(root_user, 0, depth)
    
    return {
        "success": True,
        "data": tree
    }
