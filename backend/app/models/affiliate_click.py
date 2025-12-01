from sqlalchemy import ForeignKey, DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class AffiliateClick(Base):
    __tablename__ = "affiliate_clicks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    merchant_id: Mapped[int | None] = mapped_column(ForeignKey("merchants.id"), index=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("offers.id"), index=True)
    network: Mapped[str] = mapped_column(String(40), index=True)
    external_click_id: Mapped[str | None] = mapped_column(String(120), index=True)
    source: Mapped[str | None] = mapped_column(String(60))  # web, mobile, api
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    tracked_at: Mapped[datetime | None] = mapped_column(DateTime)  # when confirmed by network
