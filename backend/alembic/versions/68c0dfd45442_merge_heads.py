"""merge heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '68c0dfd45442'
down_revision = ('add_category_description', 'd108a5fa2417')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

