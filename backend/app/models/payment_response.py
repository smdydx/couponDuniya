
from sqlalchemy import ForeignKey, DateTime, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class PaymentResponse(Base):
    __tablename__ = "payment_responses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id", ondelete="CASCADE"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    
    # Razorpay response details
    razorpay_order_id: Mapped[str] = mapped_column(String(255), index=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(255), index=True)
    razorpay_signature: Mapped[str | None] = mapped_column(String(500))
    
    # Payment status and details
    payment_status: Mapped[str] = mapped_column(String(50), default="initiated")  # initiated, success, failed
    payment_method: Mapped[str | None] = mapped_column(String(50))  # card, upi, netbanking, wallet
    
    # Full response from Razorpay
    razorpay_response: Mapped[dict | None] = mapped_column(JSON)
    error_description: Mapped[str | None] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow)
