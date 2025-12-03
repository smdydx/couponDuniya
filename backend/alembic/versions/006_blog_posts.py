"""Add blog posts table - additional columns and indexes

Revision ID: 006_blog_posts
Revises: 005_partition_and_new_tables
Create Date: 2025-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_blog_posts'
down_revision = '005_partition_and_new_tables'
branch_labels = None
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


def index_exists(connection, index_name, table_name):
    """Check if an index exists on a table"""
    inspector = inspect(connection)
    indexes = inspector.get_indexes(table_name)
    return any(idx['name'] == index_name for idx in indexes)


def upgrade() -> None:
    connection = op.get_bind()
    
    # Check if blog_posts table already exists (created in migration 005)
    if not table_exists(connection, 'blog_posts'):
        # Create blog_posts table
        op.create_table(
            'blog_posts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('slug', sa.String(length=255), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('excerpt', sa.Text(), nullable=True),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('featured_image', sa.String(length=512), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
            sa.Column('author', sa.String(length=255), nullable=True),
            sa.Column('published_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('meta_title', sa.String(length=255), nullable=True),
            sa.Column('meta_description', sa.Text(), nullable=True),
            sa.Column('meta_keywords', sa.Text(), nullable=True),
            sa.Column('og_image', sa.String(length=512), nullable=True),
            sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
            sa.PrimaryKeyConstraint('id')
        )
    else:
        # Table exists, add any missing columns
        if not column_exists(connection, 'blog_posts', 'excerpt'):
            op.add_column('blog_posts', sa.Column('excerpt', sa.Text(), nullable=True))
        if not column_exists(connection, 'blog_posts', 'featured_image'):
            op.add_column('blog_posts', sa.Column('featured_image', sa.String(length=512), nullable=True))
        if not column_exists(connection, 'blog_posts', 'meta_title'):
            op.add_column('blog_posts', sa.Column('meta_title', sa.String(length=255), nullable=True))
        if not column_exists(connection, 'blog_posts', 'meta_description'):
            op.add_column('blog_posts', sa.Column('meta_description', sa.Text(), nullable=True))
        if not column_exists(connection, 'blog_posts', 'meta_keywords'):
            op.add_column('blog_posts', sa.Column('meta_keywords', sa.Text(), nullable=True))
        if not column_exists(connection, 'blog_posts', 'og_image'):
            op.add_column('blog_posts', sa.Column('og_image', sa.String(length=512), nullable=True))
        if not column_exists(connection, 'blog_posts', 'view_count'):
            op.add_column('blog_posts', sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'))

    # Create indexes (only if they don't exist)
    if table_exists(connection, 'blog_posts'):
        if not index_exists(connection, 'ix_blog_posts_slug', 'blog_posts'):
            op.create_index('ix_blog_posts_slug', 'blog_posts', ['slug'], unique=True)
        if not index_exists(connection, 'ix_blog_posts_status', 'blog_posts'):
            op.create_index('ix_blog_posts_status', 'blog_posts', ['status'])
        if not index_exists(connection, 'ix_blog_posts_published_at', 'blog_posts'):
            op.create_index('ix_blog_posts_published_at', 'blog_posts', ['published_at'])
        if not index_exists(connection, 'ix_blog_posts_is_featured', 'blog_posts'):
            op.create_index('ix_blog_posts_is_featured', 'blog_posts', ['is_featured'])


def downgrade() -> None:
    connection = op.get_bind()
    
    if table_exists(connection, 'blog_posts'):
        # Drop indexes
        op.drop_index('ix_blog_posts_is_featured', table_name='blog_posts', if_exists=True)
        op.drop_index('ix_blog_posts_published_at', table_name='blog_posts', if_exists=True)
        op.drop_index('ix_blog_posts_status', table_name='blog_posts', if_exists=True)
        op.drop_index('ix_blog_posts_slug', table_name='blog_posts', if_exists=True)

        # Drop additional columns added in this migration
        if column_exists(connection, 'blog_posts', 'excerpt'):
            op.drop_column('blog_posts', 'excerpt')
        if column_exists(connection, 'blog_posts', 'featured_image'):
            op.drop_column('blog_posts', 'featured_image')
        if column_exists(connection, 'blog_posts', 'meta_title'):
            op.drop_column('blog_posts', 'meta_title')
        if column_exists(connection, 'blog_posts', 'meta_description'):
            op.drop_column('blog_posts', 'meta_description')
        if column_exists(connection, 'blog_posts', 'meta_keywords'):
            op.drop_column('blog_posts', 'meta_keywords')
        if column_exists(connection, 'blog_posts', 'og_image'):
            op.drop_column('blog_posts', 'og_image')
        if column_exists(connection, 'blog_posts', 'view_count'):
            op.drop_column('blog_posts', 'view_count')
