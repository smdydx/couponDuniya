"""
CouponAli API v1 - Endpoint Modules
====================================
Clean API organization for coupon & cashback platform.

Domains:
- Auth & Users
- Merchants & Offers
- Gift Cards & Wallet
- Referrals & Cashback
- Admin & Support
"""

from . import (
    # Auth & Users
    auth,
    users,
    sessions,
    social_auth,
    two_factor,
    kyc,
    
    # Merchants & Offers
    merchants,
    offers,
    categories,
    gift_cards,
    products,
    
    # Wallet & Cashback
    wallet,
    cashback,
    withdrawals,
    payouts,
    
    # Referrals & Affiliates
    referrals,
    affiliate,
    commissions,
    
    # Homepage & Content
    homepage,
    newsletter,
    
    # Admin
    admin,
    admin_referrals,
    admin_support,
    access,
    audit_logs,
    
    # Notifications & Support
    notifications,
    push,
    support_tickets,
    
    # System
    health,
    uploads,
    queue,
    realtime,
    flags,
    offer_views,
)
