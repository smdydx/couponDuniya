"""
CouponAli Backend - Pydantic Schemas
=====================================
Request/Response models for coupon & cashback platform.
"""

# User & Auth
from .user import UserCreate, UserRead
from .user_session import UserSessionRead, UserSessionCreate
from .user_kyc import UserKYCRead, UserKCCreate

# Merchants
from .merchant import MerchantRead
from .merchant_commission import MerchantCommissionRead, MerchantCommissionCreate

# Offers & Coupons
from .offer import OfferRead
from .offer_click import OfferClickRead
from .offer_view import OfferViewRead, OfferViewCreate
from .category import CategoryRead, CategoryCreate

# Gift Cards
from .gift_card import GiftCardRead, GiftCardCreate

# Wallet & Cashback
from .wallet import WalletTransactionRead
from .wallet_balance import WalletBalanceRead
from .cashback_event import CashbackEventRead, CashbackEventCreate
from .payout import PayoutRead, PayoutCreate
from .withdrawal import WithdrawalRead, WithdrawalCreate
from .withdrawal_request import WithdrawalRequestRead, WithdrawalRequestCreate

# Referrals
from .referral import ReferralRead, ReferralCreate

# Admin & Support
from .access_control import RoleRead, RoleCreate, PermissionRead, PermissionCreate, DepartmentRead, DepartmentCreate, AssignPermission, AssignRole, AssignDepartment
from .support_ticket import SupportTicketRead, SupportTicketCreate
from .notification import NotificationRead, NotificationCreate
from .audit_log import AuditLogRead
