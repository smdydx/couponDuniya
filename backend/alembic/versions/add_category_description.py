
"""add category description

Revision ID: add_category_description
Revises: add_product_fields
Create Date: 2025-12-06

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_category_description'
down_revision = 'add_product_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Add description column to categories
    op.add_column('categories', sa.Column('description', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('categories', 'description')
