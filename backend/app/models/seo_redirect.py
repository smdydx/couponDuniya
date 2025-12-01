from sqlalchemy import DateTime, String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from ..database import Base

class SEORedirect(Base):
    __tablename__ = "seo_redirects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_path: Mapped[str] = mapped_column(String(500), index=True)
    target_path: Mapped[str] = mapped_column(String(500))
    http_status: Mapped[int] = mapped_column(Integer, default=301)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
