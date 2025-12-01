from sqlalchemy import ForeignKey, DateTime, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class AffiliateTransaction(Base):
    __tablename__ = "affiliate_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    click_id: Mapped[int | None] = mapped_column(ForeignKey("affiliate_clicks.id"), index=True)
    merchant_id: Mapped[int | None] = mapped_column(ForeignKey("merchants.id"), index=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("offers.id"), index=True)
    network: Mapped[str] = mapped_column(String(40), index=True)
    external_transaction_id: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)  # pending/confirmed/rejected
    amount: Mapped[float] = mapped_column(Numeric(10,2), default=0)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime)
