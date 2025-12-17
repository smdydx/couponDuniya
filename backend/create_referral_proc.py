import os
from sqlalchemy import create_engine, text

# Manually parse .env
db_url = "postgresql+psycopg://coupon:hardik123@127.0.0.1:5432/couponali"
try:
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.strip().split("=", 1)[1]
                break
except:
    pass

print(f"Connecting to: {db_url}")
engine = create_engine(db_url)

create_proc_sql = """
CREATE OR REPLACE FUNCTION get_admin_referrals(
    p_limit INTEGER,
    p_offset INTEGER,
    p_search TEXT,
    p_level TEXT
)
RETURNS TABLE (
    id INTEGER,
    email VARCHAR,
    full_name VARCHAR,
    referral_code VARCHAR,
    referred_by_id INTEGER,
    referred_by_name VARCHAR,
    total_referrals BIGINT,
    active_referrals BIGINT,
    total_earnings NUMERIC,
    left_child_id INTEGER,
    right_child_id INTEGER,
    left_child_name VARCHAR,
    right_child_name VARCHAR,
    created_at TIMESTAMP,
    items_total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH referral_counts AS (
        SELECT 
            referrer_user_id,
            COUNT(*) as total_refs
        FROM referrals
        GROUP BY referrer_user_id
    ),
    children_info AS (
        SELECT 
            referrer_user_id,
            MAX(CASE WHEN child_rank = 1 THEN referred_user_id END) as left_id,
            MAX(CASE WHEN child_rank = 2 THEN referred_user_id END) as right_id
        FROM (
            SELECT 
                referrer_user_id,
                referred_user_id,
                ROW_NUMBER() OVER (PARTITION BY referrer_user_id ORDER BY created_at) as child_rank
            FROM referrals
        ) ranked
        WHERE child_rank <= 2
        GROUP BY referrer_user_id
    ),
    filtered_users AS (
        SELECT u.*, r_ref.referrer_user_id as parent_id
        FROM users u
        LEFT JOIN referrals r_ref ON u.id = r_ref.referred_user_id
        WHERE 
            (p_search IS NULL OR p_search = '' OR 
             u.email ILIKE '%' || p_search || '%' OR 
             u.full_name ILIKE '%' || p_search || '%' OR
             u.referral_code ILIKE '%' || p_search || '%')
    ),
    total_count AS (
        SELECT COUNT(*) as cnt FROM filtered_users
    )
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.referral_code,
        u.parent_id,
        u_parent.full_name as referred_by_name,
        COALESCE(rc.total_refs, 0) as total_referrals,
        COALESCE(rc.total_refs, 0) as active_referrals,
        COALESCE(u.total_earnings, 0) as total_earnings,
        ci.left_id,
        ci.right_id,
        u_left.full_name as left_child_name,
        u_right.full_name as right_child_name,
        u.created_at,
        tc.cnt
    FROM filtered_users u
    LEFT JOIN users u_parent ON u.parent_id = u_parent.id
    LEFT JOIN referral_counts rc ON u.id = rc.referrer_user_id
    LEFT JOIN children_info ci ON u.id = ci.referrer_user_id
    LEFT JOIN users u_left ON ci.left_id = u_left.id
    LEFT JOIN users u_right ON ci.right_id = u_right.id
    CROSS JOIN total_count tc
    ORDER BY u.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
"""

with engine.connect() as conn:
    conn.execute(text(create_proc_sql))
    conn.commit()
    print("✅ Stored procedure 'get_admin_referrals' created successfully!")
