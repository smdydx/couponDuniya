"""merge heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '26476542c253'
down_revision = ('0025f9da2cd0', 'add_banner_columns')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

