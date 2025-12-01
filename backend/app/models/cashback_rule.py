from sqlalchemy import Integer, ForeignKey, Numeric, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base


class CashbackRule(Base):
    __tablename__ = "cashback_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int | None] = mapped_column(ForeignKey("merchants.id"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)
    rule_name: Mapped[str] = mapped_column(String(255), default="default")
    rate_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    max_cashback: Mapped[float | None] = mapped_column(Numeric(10, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
