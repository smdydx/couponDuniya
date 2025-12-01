from sqlalchemy import Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..database import Base


class ABTestExperiment(Base):
    __tablename__ = "ab_test_experiments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    hypothesis: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, running, paused, concluded
    start_date: Mapped[datetime | None] = mapped_column(DateTime)
    end_date: Mapped[datetime | None] = mapped_column(DateTime)

    # Configuration
    traffic_allocation: Mapped[float] = mapped_column(Float, default=1.0)  # 0.0 to 1.0
    primary_goal: Mapped[str | None] = mapped_column(String(100))  # conversion, revenue, retention, etc.
    secondary_goals: Mapped[str | None] = mapped_column(Text)  # JSON array

    # Results
    winner_variant_id: Mapped[int | None] = mapped_column(Integer)
    confidence_level: Mapped[float | None] = mapped_column(Float)
    statistical_significance: Mapped[bool | None] = mapped_column(Boolean)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ABTestVariant(Base):
    __tablename__ = "ab_test_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("ab_test_experiments.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    is_control: Mapped[bool] = mapped_column(Boolean, default=False)
    traffic_weight: Mapped[float] = mapped_column(Float, default=0.5)  # 0.0 to 1.0

    # Configuration (JSON)
    config: Mapped[str | None] = mapped_column(Text)  # JSON object with variant config

    # Metrics
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    total_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    avg_revenue_per_user: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    experiment: Mapped["ABTestExperiment"] = relationship()


class ABTestAssignment(Base):
    __tablename__ = "ab_test_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("ab_test_experiments.id"), index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("ab_test_variants.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(String(255), index=True)

    # Tracking
    converted: Mapped[bool] = mapped_column(Boolean, default=False)
    conversion_value: Mapped[float | None] = mapped_column(Float)
    converted_at: Mapped[datetime | None] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment: Mapped["ABTestExperiment"] = relationship()
    variant: Mapped["ABTestVariant"] = relationship()
    user: Mapped["User"] = relationship()


class ABTestGoal(Base):
    __tablename__ = "ab_test_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("ab_test_experiments.id"), index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("ab_test_variants.id"), index=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("ab_test_assignments.id"), index=True)
    goal_type: Mapped[str] = mapped_column(String(50))  # click, purchase, signup, etc.
    goal_value: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    experiment: Mapped["ABTestExperiment"] = relationship()
    variant: Mapped["ABTestVariant"] = relationship()
    assignment: Mapped["ABTestAssignment"] = relationship()
