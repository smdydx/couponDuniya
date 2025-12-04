
"""add product fields

Revision ID: add_product_fields
Revises: c8f47cf68892
Create Date: 2025-12-04

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_product_fields'
down_revision = 'c8f47cf68892'
branch_labels = None
depends_on = None


def upgrade():
    # Add description column
    op.add_column('products', sa.Column('description', sa.String(1000), nullable=True))
    
    # Add category_id column
    op.add_column('products', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_index('ix_products_category_id', 'products', ['category_id'])
    op.create_foreign_key('fk_products_category', 'products', 'categories', ['category_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_products_category', 'products', type_='foreignkey')
    op.drop_index('ix_products_category_id', 'products')
    op.drop_column('products', 'category_id')
    op.drop_column('products', 'description')
