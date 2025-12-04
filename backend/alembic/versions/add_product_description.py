
"""add product description column

Revision ID: add_product_description
Revises: add_product_fields
Create Date: 2024-12-04 08:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_product_description'
down_revision = 'add_product_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Add description column to products table
    op.add_column('products', sa.Column('description', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('products', 'description')
