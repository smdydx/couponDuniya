
"""add merchant is_featured field

Revision ID: add_merchant_featured
Revises: c8f47cf68892
Create Date: 2024-12-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_merchant_featured'
down_revision = 'c8f47cf68892'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_featured column to merchants table
    op.add_column('merchants', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'))


def downgrade():
    # Remove is_featured column from merchants table
    op.drop_column('merchants', 'is_featured')
