"""Add denomination and selling_price fields to product_variants

Revision ID: add_variant_pricing
Revises: f39206cf76a4
Create Date: 2025-12-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_variant_pricing'
down_revision = 'f39206cf76a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to product_variants table
    op.add_column('product_variants', sa.Column('denomination', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('product_variants', sa.Column('selling_price', sa.Numeric(precision=10, scale=2), nullable=True))
    
    # Set default values for existing records (use price column as fallback)
    op.execute('UPDATE product_variants SET denomination = price, selling_price = price WHERE denomination IS NULL')


def downgrade() -> None:
    # Remove the new columns
    op.drop_column('product_variants', 'selling_price')
    op.drop_column('product_variants', 'denomination')
