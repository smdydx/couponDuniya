"""Junction table for Merchant-Category many-to-many relationship"""
from sqlalchemy import ForeignKey, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base


class MerchantCategory(Base):
    __tablename__ = "merchant_categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        # Unique constraint to prevent duplicate merchant-category pairs
        __import__('sqlalchemy').UniqueConstraint('merchant_id', 'category_id', name='uq_merchant_category'),
    )
