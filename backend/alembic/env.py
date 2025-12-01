from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlalchemy import create_engine
from alembic import context
import os
import sys

# Add app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from app.database import Base  # noqa
from app.config import get_settings

# Import all models so they're registered with Base.metadata
from app.models import (  # noqa
    User, Merchant, Category, Offer, OfferClick, OfferView,
    Product, ProductVariant, Order, OrderItem, PromoCode,
    WalletTransaction, WalletBalance, Withdrawal, WithdrawalRequest,
    Payout, MerchantCommission, Payment,
    GiftCard, Referral, CashbackEvent,
    SupportTicket, Notification,
    Role, Permission, RolePermission, Department, UserRole, UserDepartment,
    AuditLog, UserSession, UserKYC, Inventory, CMSPage, SEORedirect
)

settings = get_settings()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()