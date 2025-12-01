from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base

class MerchantCommission(Base):
    __tablename__ = "merchant_commissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), index=True)
    commission_type: Mapped[str] = mapped_column(String(20))
    commission_value: Mapped[float] = mapped_column(Numeric(10,2))
    cashback_percentage: Mapped[float | None] = mapped_column(Numeric(5,2))
    valid_from: Mapped[datetime | None] = mapped_column(Date)
    valid_until: Mapped[datetime | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant")
    category = relationship("Category")
