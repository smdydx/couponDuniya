
"""add offer priority column

Revision ID: 010
Revises: 009
Create Date: 2024-12-03 10:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '010'
down_revision = '009'
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
    
    # Only add column if offers table exists
    if table_exists(connection, 'offers'):
        if not column_exists(connection, 'offers', 'priority'):
            op.add_column('offers', sa.Column('priority', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    connection = op.get_bind()
    
    if table_exists(connection, 'offers'):
        if column_exists(connection, 'offers', 'priority'):
            op.drop_column('offers', 'priority')
