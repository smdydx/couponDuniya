"""merge_all_heads_final"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'bb1236091115'
down_revision = ('0359a010d225', 'add_payment_gateway_fields')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

