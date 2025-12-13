
"""add role column to users

Revision ID: add_role_column
Revises: 13808113360f
Create Date: 2024-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_role_column'
down_revision = '13808113360f'
branch_labels = None
depends_on = None


def upgrade():
    # Check if the column already exists
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'role' not in columns:
        # Add role column to users table with default value 'customer'
        op.add_column('users', sa.Column('role', sa.String(20), nullable=False, server_default='customer'))
        
        # All existing users default to 'customer' role
        # Admin users can be promoted manually after migration


def downgrade():
    op.drop_column('users', 'role')
