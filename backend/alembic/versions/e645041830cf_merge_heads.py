"""merge heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e645041830cf'
down_revision = ('86f9d562e006', 'add_avatar_url')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

