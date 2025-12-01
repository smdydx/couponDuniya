from sqlalchemy import ForeignKey, DateTime, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10,2))
    status: Mapped[str] = mapped_column(String(30), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)
