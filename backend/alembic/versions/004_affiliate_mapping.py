"""Affiliate merchant mapping table

Revision ID: 004_affiliate_mapping
Revises: 003_affiliate_models
Create Date: 2025-11-24
"""
from alembic import op
import sqlalchemy as sa

revision = '004_affiliate_mapping'
down_revision = '003_affiliate_models'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'affiliate_merchant_map',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('network', sa.String(40), index=True),
        sa.Column('external_merchant_id', sa.String(120), index=True),
        sa.Column('merchant_id', sa.Integer(), sa.ForeignKey('merchants.id'), index=True),
        sa.Column('created_at', sa.DateTime()),
    )


def downgrade() -> None:
    op.drop_table('affiliate_merchant_map')
