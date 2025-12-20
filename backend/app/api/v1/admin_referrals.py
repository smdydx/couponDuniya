
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
    """Get paginated list of users with referral data using Stored Procedure"""
    from sqlalchemy import text
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Call Stored Procedure
    result = db.execute(
        text("SELECT * FROM get_admin_referrals(:limit, :offset, :search, :level)"),
        {"limit": limit, "offset": offset, "search": search, "level": level}
    ).all()
    
    user_data = []
    total = 0
    
    if result:
        total = result[0].items_total
        
        for row in result:
            user_data.append({
                "id": row.id,
                "email": row.email,
                "full_name": row.full_name,
                "referral_code": row.referral_code,
                "referred_by_id": row.referred_by_id,
                "referred_by_name": row.referred_by_name,
                "total_referrals": row.total_referrals,
                "active_referrals": row.active_referrals,
                "total_earnings": float(row.total_earnings) if row.total_earnings else 0,
                "current_level": 1, # Placeholder, calculation requires more complex logic
                "left_child_id": row.left_child_id,
                "right_child_id": row.right_child_id,
                "left_child_name": row.left_child_name,
                "right_child_name": row.right_child_name,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
    
    # Stats (Simplified queries for speed)
    total_users = db.query(User).count()
    users_with_referrals = db.query(func.count(func.distinct(Referral.referrer_user_id))).scalar() or 0
    
    # Generate level stats for 50 levels (Dynamic based on real data would be better but keeping structure)
    level_stats = []
    for level in range(1, 51):
        level_stats.append({
            "level": level,
            "user_count": max(0, int(1000 / (1.5 ** (level - 1)))), # Dummy distribution as placeholder
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
                "total_pages": (total + limit - 1) // limit if limit > 0 else 1
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
