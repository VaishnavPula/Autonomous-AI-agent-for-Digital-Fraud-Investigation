import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    Index,
    DateTime,
    JSON,
    Float,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class TimelineEventType(str, enum.Enum):
    LOGIN = "LOGIN"
    TRANSACTION = "TRANSACTION"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    DEVICE_REGISTRATION = "DEVICE_REGISTRATION"
    IP_CHANGE = "IP_CHANGE"
    LOCATION_CHANGE = "LOCATION_CHANGE"
    COMMUNICATION = "COMMUNICATION"
    ACCOUNT_CREATION = "ACCOUNT_CREATION"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
    ALERT = "ALERT"
    INVESTIGATOR_ACTION = "INVESTIGATOR_ACTION"
    AI_DISCOVERY = "AI_DISCOVERY"
    PASSWORD_RESET = "PASSWORD_RESET"
    BENEFICIARY_ADDED = "BENEFICIARY_ADDED"
    ACCOUNT_LOCK = "ACCOUNT_LOCK"
    MFA_CHANGE = "MFA_CHANGE"
    SESSION_START = "SESSION_START"
    SESSION_END = "SESSION_END"


class TemporalRelation(str, enum.Enum):
    BEFORE = "BEFORE"
    AFTER = "AFTER"
    WITHIN_5_MINUTES = "WITHIN_5_MINUTES"
    WITHIN_1_HOUR = "WITHIN_1_HOUR"
    SAME_SESSION = "SAME_SESSION"
    SAME_DEVICE = "SAME_DEVICE"
    SAME_IP = "SAME_IP"
    NEAR_TRANSACTION = "NEAR_TRANSACTION"


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    event_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type: Mapped[TimelineEventType] = mapped_column(
        SQLEnum(TimelineEventType),
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    entity_ids: Mapped[list[uuid.UUID]] = mapped_column(
        JSON,
        default=list,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    details: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
    )
    evidence_ids: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    risk_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )
    is_suspicious: Mapped[bool] = mapped_column(
        default=False,
    )
    behavioral_deviation: Mapped[dict | None] = mapped_column(
        JSON,
    )
    source: Mapped[str | None] = mapped_column(
        String(100),
    )
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )

    case: Mapped["Case"] = relationship(
        "Case",
        back_populates="timeline_events",
    )

    __table_args__ = (
        Index("ix_timeline_case_time", "case_id", "timestamp"),
        Index("ix_timeline_type", "event_type"),
        Index("ix_timeline_suspicious", "is_suspicious"),
        Index("ix_timeline_entities", "entity_ids"),
    )


class TemporalCorrelation(Base):
    __tablename__ = "temporal_correlations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_a_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("timeline_events.id"),
        nullable=False,
    )
    event_b_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("timeline_events.id"),
        nullable=False,
    )
    relation_type: Mapped[TemporalRelation] = mapped_column(
        SQLEnum(TemporalRelation),
        nullable=False,
    )
    time_delta_seconds: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=1.0,
    )
    evidence_ids: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )

    event_a: Mapped["TimelineEvent"] = relationship(
        "TimelineEvent",
        foreign_keys=[event_a_id],
    )
    event_b: Mapped["TimelineEvent"] = relationship(
        "TimelineEvent",
        foreign_keys=[event_b_id],
    )

    __table_args__ = (
        Index("ix_temporal_corr_case", "case_id"),
        Index("ix_temporal_corr_events", "event_a_id", "event_b_id"),
        Index("ix_temporal_corr_type", "relation_type"),
    )


class ImpossibleTravel(Base):
    __tablename__ = "impossible_travel"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
        nullable=False,
    )
    previous_location_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    new_location_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    previous_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    new_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    distance_km: Mapped[float] = mapped_column(Float)
    min_travel_time_hours: Mapped[float] = mapped_column(Float)
    actual_time_hours: Mapped[float] = mapped_column(Float)
    is_impossible: Mapped[bool] = mapped_column(
        default=False,
    )
    possible_explanations: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    evidence_ids: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )

    entity: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[entity_id],
    )
    previous_location: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[previous_location_id],
    )
    new_location: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[new_location_id],
    )

    __table_args__ = (
        Index("ix_impossible_travel_case", "case_id"),
        Index("ix_impossible_travel_entity", "entity_id"),
        Index("ix_impossible_travel_flag", "is_impossible"),
    )
