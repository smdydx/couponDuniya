"""merge all heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2a45323c7d8e'
down_revision = ('0359a010d225', 'add_payment_gateway_fields', 'db4fa25de4b6')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

