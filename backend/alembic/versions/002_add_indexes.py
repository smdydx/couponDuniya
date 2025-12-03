"""Add performance indexes for offers, clicks, views

Revision ID: 002_add_indexes
Revises: 001_initial
Create Date: 2025-01-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '002_add_indexes'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def table_exists(connection, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(connection)
    return table_name in inspector.get_table_names()


def index_exists(connection, index_name, table_name):
    """Check if an index exists on a table"""
    inspector = inspect(connection)
    indexes = inspector.get_indexes(table_name)
    return any(idx['name'] == index_name for idx in indexes)


def upgrade():
    """Add indexes for frequently queried columns"""
    connection = op.get_bind()
    
    # Offers table - additional indexes (merchant_id and category_id already created in 001_initial)
    if table_exists(connection, 'offers'):
        if not index_exists(connection, 'ix_offers_is_active', 'offers'):
            op.create_index('ix_offers_is_active', 'offers', ['is_active'])
        if not index_exists(connection, 'ix_offers_end_date', 'offers'):
            op.create_index('ix_offers_end_date', 'offers', ['end_date'])
        if not index_exists(connection, 'ix_offers_start_date', 'offers'):
            op.create_index('ix_offers_start_date', 'offers', ['start_date'])

    # Offer clicks - created_at used for analytics/trending calculations
    if table_exists(connection, 'offer_clicks'):
        if not index_exists(connection, 'ix_offer_clicks_created_at', 'offer_clicks'):
            op.create_index('ix_offer_clicks_created_at', 'offer_clicks', ['created_at'])
        if not index_exists(connection, 'ix_offer_clicks_offer_id_created_at', 'offer_clicks'):
            op.create_index('ix_offer_clicks_offer_id_created_at', 'offer_clicks', ['offer_id', 'created_at'])

    # Offer views - created_at used for analytics/trending calculations
    if table_exists(connection, 'offer_views'):
        if not index_exists(connection, 'ix_offer_views_created_at', 'offer_views'):
            op.create_index('ix_offer_views_created_at', 'offer_views', ['created_at'])
        if not index_exists(connection, 'ix_offer_views_offer_id_created_at', 'offer_views'):
            op.create_index('ix_offer_views_offer_id_created_at', 'offer_views', ['offer_id', 'created_at'])


def downgrade():
    """Remove indexes"""
    connection = op.get_bind()
    
    if table_exists(connection, 'offer_views'):
        op.drop_index('ix_offer_views_offer_id_created_at', table_name='offer_views', if_exists=True)
        op.drop_index('ix_offer_views_created_at', table_name='offer_views', if_exists=True)
    
    if table_exists(connection, 'offer_clicks'):
        op.drop_index('ix_offer_clicks_offer_id_created_at', table_name='offer_clicks', if_exists=True)
        op.drop_index('ix_offer_clicks_created_at', table_name='offer_clicks', if_exists=True)
    
    if table_exists(connection, 'offers'):
        op.drop_index('ix_offers_start_date', table_name='offers', if_exists=True)
        op.drop_index('ix_offers_end_date', table_name='offers', if_exists=True)
        op.drop_index('ix_offers_is_active', table_name='offers', if_exists=True)
