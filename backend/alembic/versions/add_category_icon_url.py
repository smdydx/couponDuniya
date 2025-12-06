
"""add category icon_url

Revision ID: add_category_icon_url
Revises: add_banner_columns
Create Date: 2025-12-06 10:50:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_category_icon_url'
down_revision = 'add_banner_columns'
branch_labels = None
depends_on = None


def upgrade():
    # Add icon_url column to categories table
    op.add_column('categories', sa.Column('icon_url', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('categories', 'icon_url')
