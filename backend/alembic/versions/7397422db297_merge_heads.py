"""merge heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '7397422db297'
down_revision = ('3b5680f9aead', 'add_merchant_featured')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

