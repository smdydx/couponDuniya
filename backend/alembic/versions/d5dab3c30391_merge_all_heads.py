"""merge all heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd5dab3c30391'
down_revision = ('2a45323c7d8e', 'bb1236091115')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

