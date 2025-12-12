"""
CouponAli Backend - Database Models
====================================
Domain-driven model organization for a professional coupon & cashback platform.

Core Domains:
- Users & Authentication
- Merchants & Affiliates  
- Offers & Coupons
- Gift Cards
- Wallet & Cashback
- Referrals
- Admin & Support
"""

# User & Authentication
from .user import User, UserStatus, AuthProvider, UserRole
from .social_account import SocialAccount
from .refresh_token import RefreshToken, OTPAttempt, PasswordResetToken
from .user_session import UserSession
from .user_kyc import UserKYC
from .user_2fa import User2FA

# Merchants & Affiliates
from .merchant import Merchant, MerchantDocument
from .merchant_category import MerchantCategory
from .merchant_commission import MerchantCommission
from .affiliate_click import AffiliateClick
from .affiliate_transaction import AffiliateTransaction
from .affiliate_merchant_map import AffiliateMerchantMap

# Offers & Coupons
from .offer import Offer
from .offer_click import OfferClick
from .offer_view import OfferView
from .category import Category
from .promo_code import PromoCode
from .banner import Banner

# Gift Cards
from .gift_card import GiftCard

# Products (Purchasable Gift Cards)
from .product import Product, ProductVariant

# Orders
from .order import Order

# Wallet & Cashback
from .wallet import WalletTransaction
from .wallet_balance import WalletBalance
from .cashback_event import CashbackEvent
from .cashback_rule import CashbackRule
from .payout import Payout
from .withdrawal import Withdrawal
from .withdrawal_request import WithdrawalRequest

# Referrals
from .referral import Referral

# Admin & Support
from .access_control import Role, Permission, RolePermission, Department, UserRole as AdminUserRole, UserDepartment
from .support_ticket import SupportTicket
from .notification import Notification
from .audit_log import AuditLog
from .newsletter import NewsletterSubscriber, NewsletterCampaign
from .push_subscription import PushSubscription, PushNotification
from .analytics import AnalyticsEvent, UserMetric
from .ab_test import ABTestExperiment, ABTestVariant

__all__ = [
    # User & Auth
    "User",
    "UserStatus", 
    "AuthProvider",
    "UserRole",
    "SocialAccount",
    "RefreshToken",
    "OTPAttempt",
    "PasswordResetToken",
    "UserSession",
    "UserKYC",
    "User2FA",
    
    # Merchants & Affiliates
    "Merchant",
    "MerchantDocument",
    "MerchantCategory",
    "MerchantCommission",
    "AffiliateClick",
    "AffiliateTransaction",
    "AffiliateMerchantMap",
    
    # Offers & Coupons
    "Offer",
    "OfferClick",
    "OfferView",
    "Category",
    "PromoCode",
    "Banner",
    
    # Gift Cards
    "GiftCard",
    
    # Products
    "Product",
    "ProductVariant",
    
    # Orders
    "Order",
    
    # Wallet & Cashback
    "WalletTransaction",
    "WalletBalance",
    "CashbackEvent",
    "CashbackRule",
    "Payout",
    "Withdrawal",
    "WithdrawalRequest",
    
    # Referrals
    "Referral",
    
    # Admin & Support
    "Role",
    "Permission",
    "RolePermission",
    "Department",
    "AdminUserRole",
    "UserDepartment",
    "SupportTicket",
    "Notification",
    "AuditLog",
    "NewsletterSubscriber",
    "NewsletterCampaign",
    "PushSubscription",
    "PushNotification",
    "AnalyticsEvent",
    "UserMetric",
    "ABTestExperiment",
    "ABTestVariant",
]
