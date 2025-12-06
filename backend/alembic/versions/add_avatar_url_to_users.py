
"""add avatar_url to users

Revision ID: add_avatar_url
Revises: f4f635f290c8
Create Date: 2024-12-06 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_avatar_url'
down_revision = 'f4f635f290c8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('avatar_url', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_url')
