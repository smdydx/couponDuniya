from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base


class User2FA(Base):
    __tablename__ = "user_2fa"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    secret: Mapped[str] = mapped_column(String(255))  # TOTP secret
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    backup_codes: Mapped[str | None] = mapped_column(String(1024))  # JSON array of backup codes
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    enabled_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Relationship
    user: Mapped["User"] = relationship(back_populates="two_factor_auth")


class User2FALog(Base):
    __tablename__ = "user_2fa_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(50))  # enabled, disabled, verified, failed
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    user: Mapped["User"] = relationship()
