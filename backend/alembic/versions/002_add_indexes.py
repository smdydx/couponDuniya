"""Add performance indexes for offers, clicks, views

Revision ID: 002_add_indexes
Revises: 001_initial
Create Date: 2025-01-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_indexes'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes for frequently queried columns"""
    # Offers table - end_date used for filtering expiring/active offers
    op.create_index('ix_offers_merchant_id', 'offers', ['merchant_id'])
    op.create_index('ix_offers_category_id', 'offers', ['category_id'])
    op.create_index('ix_offers_is_active', 'offers', ['is_active'])
    op.create_index('ix_offers_end_date', 'offers', ['end_date'])
    op.create_index('ix_offers_starts_at', 'offers', ['starts_at'])

    # Offer clicks - created_at used for analytics/trending calculations
    op.create_index('ix_offer_clicks_created_at', 'offer_clicks', ['created_at'])
    op.create_index('ix_offer_clicks_offer_id_created_at', 'offer_clicks', ['offer_id', 'created_at'])

    # Offer views - created_at used for analytics/trending calculations
    op.create_index('ix_offer_views_created_at', 'offer_views', ['created_at'])
    op.create_index('ix_offer_views_offer_id_created_at', 'offer_views', ['offer_id', 'created_at'])


def downgrade():
    """Remove indexes"""
    op.drop_index('ix_offer_views_offer_id_created_at', table_name='offer_views')
    op.drop_index('ix_offer_views_created_at', table_name='offer_views')
    op.drop_index('ix_offer_clicks_offer_id_created_at', table_name='offer_clicks')
    op.drop_index('ix_offer_clicks_created_at', table_name='offer_clicks')
    op.drop_index('ix_offers_starts_at', table_name='offers')
    op.drop_index('ix_offers_end_date', table_name='offers')
    op.drop_index('ix_offers_is_active', table_name='offers')
    op.drop_index('ix_offers_category_id', table_name='offers')
    op.drop_index('ix_offers_merchant_id', table_name='offers')