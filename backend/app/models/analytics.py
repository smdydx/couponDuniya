from sqlalchemy import Integer, String, DateTime, Float, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(String(255), index=True)
    event_name: Mapped[str] = mapped_column(String(100), index=True)
    event_category: Mapped[str | None] = mapped_column(String(50))
    properties: Mapped[str | None] = mapped_column(Text)  # JSON
    page_url: Mapped[str | None] = mapped_column(String(512))
    referrer: Mapped[str | None] = mapped_column(String(512))
    device_type: Mapped[str | None] = mapped_column(String(50))
    browser: Mapped[str | None] = mapped_column(String(50))
    os: Mapped[str | None] = mapped_column(String(50))
    country: Mapped[str | None] = mapped_column(String(2))
    city: Mapped[str | None] = mapped_column(String(100))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user: Mapped["User"] = relationship()

    __table_args__ = (
        Index('ix_analytics_events_user_date', 'user_id', 'created_at'),
        Index('ix_analytics_events_name_date', 'event_name', 'created_at'),
    )


class UserMetric(Base):
    __tablename__ = "user_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)

    # Engagement metrics
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_page_views: Mapped[int] = mapped_column(Integer, default=0)
    avg_session_duration: Mapped[float] = mapped_column(Float, default=0.0)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Purchase metrics
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[float] = mapped_column(Float, default=0.0)
    avg_order_value: Mapped[float] = mapped_column(Float, default=0.0)
    total_cashback_earned: Mapped[float] = mapped_column(Float, default=0.0)

    # Behavioral metrics
    favorite_category: Mapped[str | None] = mapped_column(String(100))
    favorite_merchant: Mapped[str | None] = mapped_column(String(255))
    purchase_frequency: Mapped[str | None] = mapped_column(String(50))  # daily, weekly, monthly

    # RFM metrics
    recency_days: Mapped[int | None] = mapped_column(Integer)  # Days since last purchase
    frequency_score: Mapped[int | None] = mapped_column(Integer)  # 1-5 scale
    monetary_score: Mapped[int | None] = mapped_column(Integer)  # 1-5 scale
    rfm_segment: Mapped[str | None] = mapped_column(String(50))  # Champions, Loyal, etc.

    # Lifetime value
    predicted_ltv: Mapped[float | None] = mapped_column(Float)
    ltv_segment: Mapped[str | None] = mapped_column(String(50))  # high, medium, low

    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user: Mapped["User"] = relationship()


class Funnel(Base):
    __tablename__ = "funnels"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    steps: Mapped[str] = mapped_column(Text)  # JSON array of step names
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FunnelStep(Base):
    __tablename__ = "funnel_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    funnel_id: Mapped[int] = mapped_column(ForeignKey("funnels.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(String(255))
    step_name: Mapped[str] = mapped_column(String(100))
    step_index: Mapped[int] = mapped_column(Integer)
    completed: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    funnel: Mapped["Funnel"] = relationship()
    user: Mapped["User"] = relationship()


class Cohort(Base):
    __tablename__ = "cohorts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    cohort_type: Mapped[str] = mapped_column(String(50))  # registration_month, first_purchase_month
    cohort_period: Mapped[str] = mapped_column(String(50))  # 2025-01, Q1-2025, etc.
    size: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CohortMetric(Base):
    __tablename__ = "cohort_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    cohort_id: Mapped[int] = mapped_column(ForeignKey("cohorts.id"), index=True)
    period_offset: Mapped[int] = mapped_column(Integer)  # 0, 1, 2, ... months since cohort start
    active_users: Mapped[int] = mapped_column(Integer, default=0)
    retention_rate: Mapped[float] = mapped_column(Float, default=0.0)
    total_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    avg_revenue_per_user: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    cohort: Mapped["Cohort"] = relationship()
