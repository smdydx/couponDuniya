from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timedelta
from uuid import uuid4
from ..database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    __table_args__ = (
        Index('idx_refresh_tokens_user_id', 'user_id'),
        Index('idx_refresh_tokens_token_hash', 'token_hash'),
        Index('idx_refresh_tokens_expires_at', 'expires_at'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    token_family: Mapped[str] = mapped_column(String(36), index=True, default=lambda: str(uuid4()))
    
    device_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="refresh_tokens")
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        return not self.is_revoked and not self.is_expired()
    
    def revoke(self, reason: str = "manual"):
        self.is_revoked = True
        self.revoked_at = datetime.utcnow()
        self.revoked_reason = reason


class OTPAttempt(Base):
    __tablename__ = "otp_attempts"
    
    __table_args__ = (
        Index('idx_otp_attempts_identifier', 'identifier'),
        Index('idx_otp_attempts_expires_at', 'expires_at'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identifier: Mapped[str] = mapped_column(String(255), index=True)
    otp_hash: Mapped[str] = mapped_column(String(255))
    purpose: Mapped[str] = mapped_column(String(50), default="login")
    
    attempts: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=5)
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        return not self.is_verified and not self.is_expired() and self.attempts < self.max_attempts


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    __table_args__ = (
        Index('idx_password_reset_tokens_user_id', 'user_id'),
        Index('idx_password_reset_tokens_token_hash', 'token_hash'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired()
