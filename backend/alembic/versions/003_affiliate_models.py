"""Affiliate click & transaction tables

Revision ID: 003_affiliate_models
Revises: 002_add_indexes
Create Date: 2025-11-24
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_affiliate_models'
down_revision = '002_add_indexes'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'affiliate_clicks',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('merchant_id', sa.Integer(), sa.ForeignKey('merchants.id'), index=True),
        sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id'), index=True),
        sa.Column('network', sa.String(40), index=True),
        sa.Column('external_click_id', sa.String(120), index=True),
        sa.Column('source', sa.String(60)),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('tracked_at', sa.DateTime()),
    )
    op.create_table(
        'affiliate_transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('click_id', sa.Integer(), sa.ForeignKey('affiliate_clicks.id'), index=True),
        sa.Column('merchant_id', sa.Integer(), sa.ForeignKey('merchants.id'), index=True),
        sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id'), index=True),
        sa.Column('network', sa.String(40), index=True),
        sa.Column('external_transaction_id', sa.String(120), index=True),
        sa.Column('status', sa.String(30), index=True),
        sa.Column('amount', sa.Numeric(10,2), default=0),
        sa.Column('currency', sa.String(10), default='INR'),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('imported_at', sa.DateTime()),
        sa.Column('confirmed_at', sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table('affiliate_transactions')
    op.drop_table('affiliate_clicks')
