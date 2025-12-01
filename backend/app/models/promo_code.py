"""Promo code model for discounts."""
from sqlalchemy import String, Boolean, DateTime, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base


class PromoCode(Base):
    """Promo codes for order discounts."""
    __tablename__ = "promo_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(500))
    
    # Discount configuration
    discount_type: Mapped[str] = mapped_column(String(20))  # 'percentage' or 'fixed'
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2))
    min_order_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    max_discount: Mapped[float | None] = mapped_column(Numeric(10, 2))
    
    # Usage limits
    usage_limit: Mapped[int | None] = mapped_column(Integer)  # Total uses allowed
    usage_count: Mapped[int] = mapped_column(Integer, default=0)  # Current uses
    user_limit: Mapped[int] = mapped_column(Integer, default=1)  # Uses per user
    
    # Validity
    valid_from: Mapped[datetime | None] = mapped_column(DateTime)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
