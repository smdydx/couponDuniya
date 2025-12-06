"""merge_heads"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5c90a02ae1fd'
down_revision = ('add_category_icon_url', 'payment_responses_001')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

