from sqlalchemy import ForeignKey, DateTime, String, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_id: Mapped[int | None] = mapped_column(ForeignKey("merchants.id"), nullable=True)
    
    order_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cashback_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    
    status: Mapped[str] = mapped_column(String(50), default="pending")
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
