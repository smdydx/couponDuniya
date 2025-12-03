
"""add offer is_featured and is_exclusive fields

Revision ID: 009
Revises: 008
Create Date: 2024-12-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
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
    
    # Only add columns if offers table exists
    if table_exists(connection, 'offers'):
        if not column_exists(connection, 'offers', 'is_featured'):
            op.add_column('offers', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))
        if not column_exists(connection, 'offers', 'is_exclusive'):
            op.add_column('offers', sa.Column('is_exclusive', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    connection = op.get_bind()
    
    if table_exists(connection, 'offers'):
        if column_exists(connection, 'offers', 'is_exclusive'):
            op.drop_column('offers', 'is_exclusive')
        if column_exists(connection, 'offers', 'is_featured'):
            op.drop_column('offers', 'is_featured')
