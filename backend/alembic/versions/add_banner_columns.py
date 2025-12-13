
"""add banner columns for promo support

Revision ID: add_banner_columns
Revises: 5ac81d8d3c15
Create Date: 2025-12-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_banner_columns'
down_revision = '5ac81d8d3c15'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to banners table
    op.add_column('banners', sa.Column('banner_type', sa.String(50), nullable=False, server_default='hero'))
    op.add_column('banners', sa.Column('brand_name', sa.String(255), nullable=True))
    op.add_column('banners', sa.Column('badge_text', sa.String(100), nullable=True))
    op.add_column('banners', sa.Column('badge_color', sa.String(100), nullable=True))
    op.add_column('banners', sa.Column('headline', sa.String(255), nullable=True))
    op.add_column('banners', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('banners', sa.Column('code', sa.String(100), nullable=True))
    op.add_column('banners', sa.Column('style_metadata', sa.Text(), nullable=True))
    
    # Make image_url nullable since promo banners don't need it
    op.alter_column('banners', 'image_url', existing_type=sa.String(500), nullable=True)

def downgrade():
    op.drop_column('banners', 'style_metadata')
    op.drop_column('banners', 'code')
    op.drop_column('banners', 'description')
    op.drop_column('banners', 'headline')
    op.drop_column('banners', 'badge_color')
    op.drop_column('banners', 'badge_text')
    op.drop_column('banners', 'brand_name')
    op.drop_column('banners', 'banner_type')
    op.alter_column('banners', 'image_url', existing_type=sa.String(500), nullable=False)
