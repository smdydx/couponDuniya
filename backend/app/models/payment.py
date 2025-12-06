from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    gateway: Mapped[str] = mapped_column(String(50), default="razorpay")
    gateway_order_id: Mapped[str | None] = mapped_column(String(255), index=True)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(255))
    gateway_signature: Mapped[str | None] = mapped_column(String(512))
    amount: Mapped[float] = mapped_column(Numeric(10,2))
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[str] = mapped_column(String(50), default="initiated", index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime)

    order = relationship("Order")
    user = relationship("User")
