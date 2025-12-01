"""Add cashback_rules, blog_posts, partition triggers for offer_clicks/order_items"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "005_partition_and_new_tables"
down_revision = "004_affiliate_mapping"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Cashback rules table (table-driven rates)
    op.create_table(
        "cashback_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id"), nullable=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("rule_name", sa.String(length=255), nullable=False, server_default="default"),
        sa.Column("rate_percent", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("max_cashback", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_cashback_rules_merchant", "cashback_rules", ["merchant_id"])
    op.create_index("ix_cashback_rules_category", "cashback_rules", ["category_id"])

    # Blog / article table
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=255), unique=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("author", sa.String(length=255), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_status", "blog_posts", ["status"])

    # Add created_at to order_items to support partitioning
    op.add_column("order_items", sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Partitioning via trigger-based inheritance (works on existing tables)
    op.execute(
        """
        CREATE OR REPLACE FUNCTION ensure_offer_clicks_partition()
        RETURNS TRIGGER AS $$
        DECLARE
          partition_date date := date_trunc('month', NEW.created_at)::date;
          partition_name text := format('offer_clicks_%s', to_char(partition_date, 'YYYYMM'));
          start_date date := partition_date;
          end_date date := (partition_date + INTERVAL '1 month')::date;
          ddl text;
        BEGIN
          ddl := format(
            'CREATE TABLE IF NOT EXISTS %I (CHECK (created_at >= %L AND created_at < %L)) INHERITS (offer_clicks);',
            partition_name,
            start_date,
            end_date
          );
          EXECUTE ddl;
          EXECUTE format('INSERT INTO %I VALUES ($1.*)', partition_name) USING NEW;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offer_clicks_partition'
          ) THEN
            CREATE TRIGGER trg_offer_clicks_partition
            BEFORE INSERT ON offer_clicks
            FOR EACH ROW EXECUTE FUNCTION ensure_offer_clicks_partition();
          END IF;
        END$$;
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION ensure_order_items_partition()
        RETURNS TRIGGER AS $$
        DECLARE
          partition_date date := date_trunc('month', NEW.created_at)::date;
          partition_name text := format('order_items_%s', to_char(partition_date, 'YYYYMM'));
          start_date date := partition_date;
          end_date date := (partition_date + INTERVAL '1 month')::date;
          ddl text;
        BEGIN
          ddl := format(
            'CREATE TABLE IF NOT EXISTS %I (CHECK (created_at >= %L AND created_at < %L)) INHERITS (order_items);',
            partition_name,
            start_date,
            end_date
          );
          EXECUTE ddl;
          EXECUTE format('INSERT INTO %I VALUES ($1.*)', partition_name) USING NEW;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trg_order_items_partition'
          ) THEN
            CREATE TRIGGER trg_order_items_partition
            BEFORE INSERT ON order_items
            FOR EACH ROW EXECUTE FUNCTION ensure_order_items_partition();
          END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_offer_clicks_partition ON offer_clicks;")
    op.execute("DROP FUNCTION IF EXISTS ensure_offer_clicks_partition;")
    op.execute("DROP TRIGGER IF EXISTS trg_order_items_partition ON order_items;")
    op.execute("DROP FUNCTION IF EXISTS ensure_order_items_partition;")
    op.drop_column("order_items", "created_at")
    op.drop_index("ix_blog_posts_status", table_name="blog_posts")
    op.drop_index("ix_blog_posts_slug", table_name="blog_posts")
    op.drop_table("blog_posts")
    op.drop_index("ix_cashback_rules_category", table_name="cashback_rules")
    op.drop_index("ix_cashback_rules_merchant", table_name="cashback_rules")
    op.drop_table("cashback_rules")
