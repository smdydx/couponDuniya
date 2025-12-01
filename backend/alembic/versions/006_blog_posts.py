"""Add blog posts table

Revision ID: 006_blog_posts
Revises: 005_partition_and_new_tables
Create Date: 2025-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_blog_posts'
down_revision = '005_partition_and_new_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
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

    # Create indexes
    op.create_index('ix_blog_posts_slug', 'blog_posts', ['slug'], unique=True)
    op.create_index('ix_blog_posts_status', 'blog_posts', ['status'])
    op.create_index('ix_blog_posts_published_at', 'blog_posts', ['published_at'])
    op.create_index('ix_blog_posts_is_featured', 'blog_posts', ['is_featured'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_blog_posts_is_featured', table_name='blog_posts')
    op.drop_index('ix_blog_posts_published_at', table_name='blog_posts')
    op.drop_index('ix_blog_posts_status', table_name='blog_posts')
    op.drop_index('ix_blog_posts_slug', table_name='blog_posts')

    # Drop table
    op.drop_table('blog_posts')
