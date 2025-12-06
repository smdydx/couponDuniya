
"""create payment_responses table

Revision ID: payment_responses_001
Revises: f4f635f290c8
Create Date: 2024-12-06 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'payment_responses_001'
down_revision = 'f4f635f290c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('payment_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('payment_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('razorpay_order_id', sa.String(255), nullable=False),
        sa.Column('razorpay_payment_id', sa.String(255), nullable=True),
        sa.Column('razorpay_signature', sa.String(500), nullable=True),
        sa.Column('payment_status', sa.String(50), nullable=False, server_default='initiated'),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('razorpay_response', sa.JSON(), nullable=True),
        sa.Column('error_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['payment_id'], ['payments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE')
    )
    
    op.create_index('ix_payment_responses_id', 'payment_responses', ['id'])
    op.create_index('ix_payment_responses_payment_id', 'payment_responses', ['payment_id'])
    op.create_index('ix_payment_responses_order_id', 'payment_responses', ['order_id'])
    op.create_index('ix_payment_responses_razorpay_order_id', 'payment_responses', ['razorpay_order_id'])
    op.create_index('ix_payment_responses_razorpay_payment_id', 'payment_responses', ['razorpay_payment_id'])


def downgrade() -> None:
    op.drop_index('ix_payment_responses_razorpay_payment_id', 'payment_responses')
    op.drop_index('ix_payment_responses_razorpay_order_id', 'payment_responses')
    op.drop_index('ix_payment_responses_order_id', 'payment_responses')
    op.drop_index('ix_payment_responses_payment_id', 'payment_responses')
    op.drop_index('ix_payment_responses_id', 'payment_responses')
    op.drop_table('payment_responses')
