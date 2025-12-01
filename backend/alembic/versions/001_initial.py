"""Initial database schema with all models

Revision ID: 001_initial
Revises: 
Create Date: 2025-11-24

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create all initial tables with complete schema"""
    # PromoCode table
    op.create_table('promo_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('min_order_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('max_discount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('usage_limit', sa.Integer(), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('user_limit', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_promo_codes_id', 'promo_codes', ['id'])
    op.create_index('ix_promo_codes_code', 'promo_codes', ['code'], unique=True)
    
    # Add missing columns to existing tables
    # Users table enhancements
    op.add_column('users', sa.Column('uuid', sa.String(length=36), nullable=True))
    op.add_column('users', sa.Column('mobile', sa.String(length=15), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('referral_code', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('wallet_balance', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('pending_cashback', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Make email nullable
    op.alter_column('users', 'email', nullable=True)
    
    # Drop old password column if exists
    try:
        op.drop_column('users', 'hashed_password')
    except:
        pass
    
    # Create indexes
    op.create_index('ix_users_uuid', 'users', ['uuid'], unique=True)
    op.create_index('ix_users_mobile', 'users', ['mobile'], unique=True)
    op.create_index('ix_users_referral_code', 'users', ['referral_code'], unique=True)
    
    # Orders table enhancements
    op.add_column('orders', sa.Column('uuid', sa.String(length=36), nullable=True))
    op.add_column('orders', sa.Column('order_number', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('wallet_used', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('tax_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'))
    op.add_column('orders', sa.Column('promo_code', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('payment_status', sa.String(length=20), nullable=False, server_default='pending'))
    op.add_column('orders', sa.Column('fulfillment_status', sa.String(length=20), nullable=False, server_default='pending'))
    op.add_column('orders', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    op.create_index('ix_orders_uuid', 'orders', ['uuid'], unique=True)
    op.create_index('ix_orders_order_number', 'orders', ['order_number'], unique=True)
    
    # OrderItems table enhancements
    op.add_column('order_items', sa.Column('variant_id', sa.Integer(), nullable=True))
    op.add_column('order_items', sa.Column('product_name', sa.String(length=255), nullable=True))
    op.add_column('order_items', sa.Column('variant_name', sa.String(length=255), nullable=True))
    op.add_column('order_items', sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0'))
    op.add_column('order_items', sa.Column('fulfillment_status', sa.String(length=20), nullable=False, server_default='pending'))
    op.add_column('order_items', sa.Column('voucher_code', sa.String(length=255), nullable=True))
    
    try:
        op.create_foreign_key('fk_order_items_variant', 'order_items', 'product_variants', ['variant_id'], ['id'])
    except:
        pass
    
    # WalletTransactions table enhancements
    op.add_column('wallet_transactions', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('wallet_transactions', sa.Column('balance_after', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
    
    op.create_index('ix_wallet_transactions_type', 'wallet_transactions', ['type'])
    op.create_index('ix_wallet_transactions_created_at', 'wallet_transactions', ['created_at'])
    
    # Withdrawals table enhancements
    op.add_column('withdrawals', sa.Column('upi_id', sa.String(length=255), nullable=True))
    op.add_column('withdrawals', sa.Column('bank_account_number', sa.String(length=50), nullable=True))
    op.add_column('withdrawals', sa.Column('bank_ifsc', sa.String(length=20), nullable=True))
    op.add_column('withdrawals', sa.Column('bank_account_name', sa.String(length=255), nullable=True))
    op.add_column('withdrawals', sa.Column('admin_notes', sa.Text(), nullable=True))
    op.add_column('withdrawals', sa.Column('transaction_id', sa.String(length=255), nullable=True))
    op.add_column('withdrawals', sa.Column('processed_at', sa.DateTime(), nullable=True))


def downgrade():
    """Remove all additions from this migration"""
    # Drop PromoCode table
    op.drop_index('ix_promo_codes_code', 'promo_codes')
    op.drop_index('ix_promo_codes_id', 'promo_codes')
    op.drop_table('promo_codes')
    
    # Remove Users columns
    op.drop_index('ix_users_referral_code', 'users')
    op.drop_index('ix_users_mobile', 'users')
    op.drop_index('ix_users_uuid', 'users')
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'pending_cashback')
    op.drop_column('users', 'wallet_balance')
    op.drop_column('users', 'referral_code')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'mobile')
    op.drop_column('users', 'uuid')
    
    # Remove Orders columns
    op.drop_index('ix_orders_order_number', 'orders')
    op.drop_index('ix_orders_uuid', 'orders')
    op.drop_column('orders', 'updated_at')
    op.drop_column('orders', 'fulfillment_status')
    op.drop_column('orders', 'payment_status')
    op.drop_column('orders', 'promo_code')
    op.drop_column('orders', 'tax_amount')
    op.drop_column('orders', 'wallet_used')
    op.drop_column('orders', 'discount_amount')
    op.drop_column('orders', 'subtotal')
    op.drop_column('orders', 'order_number')
    op.drop_column('orders', 'uuid')
    
    # Remove OrderItems columns
    try:
        op.drop_constraint('fk_order_items_variant', 'order_items', type_='foreignkey')
    except:
        pass
    op.drop_column('order_items', 'voucher_code')
    op.drop_column('order_items', 'fulfillment_status')
    op.drop_column('order_items', 'subtotal')
    op.drop_column('order_items', 'variant_name')
    op.drop_column('order_items', 'product_name')
    op.drop_column('order_items', 'variant_id')
    
    # Remove WalletTransactions columns
    op.drop_index('ix_wallet_transactions_created_at', 'wallet_transactions')
    op.drop_index('ix_wallet_transactions_type', 'wallet_transactions')
    op.drop_column('wallet_transactions', 'balance_after')
    op.drop_column('wallet_transactions', 'description')
    
    # Remove Withdrawals columns
    op.drop_column('withdrawals', 'processed_at')
    op.drop_column('withdrawals', 'transaction_id')
    op.drop_column('withdrawals', 'admin_notes')
    op.drop_column('withdrawals', 'bank_account_name')
    op.drop_column('withdrawals', 'bank_ifsc')
    op.drop_column('withdrawals', 'bank_account_number')
    op.drop_column('withdrawals', 'upi_id')
