from sqlalchemy import String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class GiftCard(Base):
    __tablename__ = "gift_cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    initial_value: Mapped[float] = mapped_column(Numeric(10,2))
    remaining_value: Mapped[float] = mapped_column(Numeric(10,2))
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
