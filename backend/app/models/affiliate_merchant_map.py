from sqlalchemy import ForeignKey, DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class AffiliateMerchantMap(Base):
    __tablename__ = "affiliate_merchant_map"

    id: Mapped[int] = mapped_column(primary_key=True)
    network: Mapped[str] = mapped_column(String(40), index=True)
    external_merchant_id: Mapped[str] = mapped_column(String(120), index=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
