"""Create all database tables from SQLAlchemy models."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base, engine
from app.models import (
    User, Merchant, Category, Offer, OfferClick, OfferView,
    Product, ProductVariant, Order, OrderItem,
    WalletTransaction, WalletBalance, Withdrawal, WithdrawalRequest,
    Payout, MerchantCommission, Payment,
    GiftCard, Referral, CashbackEvent,
    SupportTicket, Notification,
    Role, Permission, RolePermission, Department, UserRole, UserDepartment,
    AuditLog, UserSession, UserKYC, Inventory, CMSPage, SEORedirect
)

print("🔨 Creating all database tables...")
Base.metadata.create_all(bind=engine)
print("✅ All tables created successfully!")

# List all tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\n📊 Created {len(tables)} tables:")
for table in sorted(tables):
    print(f"  - {table}")
