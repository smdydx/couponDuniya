"""remove_unique_constraint_from_merchant_name"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '83e77e51394d'
down_revision = '0a2c0df86c83'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop unique constraint from merchants.name
    # First, drop the existing index
    # op.drop_constraint('merchants_name_key', 'merchants', type_='unique')
    pass

def downgrade() -> None:
    # Re-add unique constraint to merchants.name
    op.create_unique_constraint('merchants_name_key', 'merchants', ['name'])

