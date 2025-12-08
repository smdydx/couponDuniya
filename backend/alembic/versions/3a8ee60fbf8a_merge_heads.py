"""merge heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3a8ee60fbf8a'
down_revision = ('a03c3f32cc6c', 'add_category_icon_url')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

