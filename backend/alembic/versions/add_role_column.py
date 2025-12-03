
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
        # Add role column to users table with default value
        op.add_column('users', sa.Column('role', sa.String(20), nullable=True, server_default='customer'))
        
        # Update existing users to have role based on is_admin
        op.execute("UPDATE users SET role = 'admin' WHERE is_admin = 1")
        op.execute("UPDATE users SET role = 'customer' WHERE is_admin = 0 OR is_admin IS NULL")


def downgrade():
    op.drop_column('users', 'role')
