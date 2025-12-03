"""add product is_featured field

Revision ID: 007
Revises: 006_blog_posts
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006_blog_posts'
branch_label = None
depends_on = None

def upgrade():
    op.add_column('products', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))

def downgrade():
    op.drop_column('products', 'is_featured')