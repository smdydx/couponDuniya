
"""add payment gateway fields

Revision ID: add_payment_gateway_fields
Revises: add_avatar_url
Create Date: 2025-01-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_payment_gateway_fields'
down_revision = 'add_avatar_url'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to payments table
    op.add_column('payments', sa.Column('gateway', sa.String(length=50), nullable=True))
    op.add_column('payments', sa.Column('gateway_order_id', sa.String(length=255), nullable=True))
    op.add_column('payments', sa.Column('gateway_payment_id', sa.String(length=255), nullable=True))
    op.add_column('payments', sa.Column('gateway_signature', sa.String(length=512), nullable=True))
    op.add_column('payments', sa.Column('currency', sa.String(length=10), nullable=True))
    op.add_column('payments', sa.Column('paid_at', sa.DateTime(), nullable=True))
    
    # Set default values for existing rows
    op.execute("UPDATE payments SET gateway = 'razorpay' WHERE gateway IS NULL")
    op.execute("UPDATE payments SET currency = 'INR' WHERE currency IS NULL")
    
    # Make gateway and currency non-nullable
    op.alter_column('payments', 'gateway', nullable=False)
    op.alter_column('payments', 'currency', nullable=False)
    
    # Add indexes
    op.create_index(op.f('ix_payments_gateway_order_id'), 'payments', ['gateway_order_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_payments_gateway_order_id'), table_name='payments')
    op.drop_column('payments', 'paid_at')
    op.drop_column('payments', 'currency')
    op.drop_column('payments', 'gateway_signature')
    op.drop_column('payments', 'gateway_payment_id')
    op.drop_column('payments', 'gateway_order_id')
    op.drop_column('payments', 'gateway')
