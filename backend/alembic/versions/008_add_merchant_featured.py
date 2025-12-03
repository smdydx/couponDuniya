
"""add merchant is_featured field

Revision ID: 008
Revises: 007
Create Date: 2024-12-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_label = None
depends_on = None


def table_exists(connection, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(connection)
    return table_name in inspector.get_table_names()


def column_exists(connection, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(connection)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    connection = op.get_bind()
    
    # Only add column if merchants table exists
    if table_exists(connection, 'merchants'):
        if not column_exists(connection, 'merchants', 'is_featured'):
            op.add_column('merchants', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    connection = op.get_bind()
    
    if table_exists(connection, 'merchants'):
        if column_exists(connection, 'merchants', 'is_featured'):
            op.drop_column('merchants', 'is_featured')
