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
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class FraudSignalType(str, enum.Enum):
    UNUSUAL_AMOUNT = "UNUSUAL_AMOUNT"
    UNUSUAL_TIME = "UNUSUAL_TIME"
    UNUSUAL_LOCATION = "UNUSUAL_LOCATION"
    NEW_DEVICE = "NEW_DEVICE"
    NEW_IP = "NEW_IP"
    RAPID_TRANSACTION_SEQUENCE = "RAPID_TRANSACTION_SEQUENCE"
    REPEATED_FAILED_ATTEMPTS = "REPEATED_FAILED_ATTEMPTS"
    ACCOUNT_TAKEOVER_INDICATORS = "ACCOUNT_TAKEOVER_INDICATORS"
    UNUSUAL_TRANSFER_CHAIN = "UNUSUAL_TRANSFER_CHAIN"
    MULTIPLE_ACCOUNTS_SHARING_DEVICE = "MULTIPLE_ACCOUNTS_SHARING_DEVICE"
    MULTIPLE_ACCOUNTS_SHARING_IP = "MULTIPLE_ACCOUNTS_SHARING_IP"
    IMPOSSIBLE_TRAVEL = "IMPOSSIBLE_TRAVEL"
    SUDDEN_BEHAVIOR_CHANGE = "SUDDEN_BEHAVIOR_CHANGE"
    TRANSACTION_VELOCITY = "TRANSACTION_VELOCITY"
    UNUSUAL_MERCHANT = "UNUSUAL_MERCHANT"
    SUSPICIOUS_ACCOUNT_RELATIONSHIP = "SUSPICIOUS_ACCOUNT_RELATIONSHIP"


class SignalSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FraudSignal(Base):
    __tablename__ = "fraud_signals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    signal_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id")
    )
    signal_type: Mapped[FraudSignalType] = mapped_column(
        SQLEnum(FraudSignalType), nullable=False
    )
    severity: Mapped[SignalSeverity] = mapped_column(
        SQLEnum(SignalSeverity), nullable=False
    )
    observed_value: Mapped[str] = mapped_column(Text, nullable=False)
    expected_value: Mapped[str | None] = mapped_column(Text)
    deviation: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    score_contribution: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

    signal_metadata: Mapped[dict] = mapped_column(
        "metadata", JSON, default=dict
    )

    is_false_positive: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship(
        "Case", back_populates="fraud_signals"
    )
    entity: Mapped["Entity"] = relationship("Entity")

    __table_args__ = (
        Index("ix_fraud_signals_case_type", "case_id", "signal_type"),
        Index("ix_fraud_signals_entity", "entity_id"),
        Index("ix_fraud_signals_severity", "severity"),
        Index("ix_fraud_signals_fp", "is_false_positive"),
    )


class RiskLevel(str, enum.Enum):
    VERY_LOW = "VERY_LOW"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id")
    )
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[RiskLevel] = mapped_column(
        SQLEnum(RiskLevel), nullable=False
    )
    financial_exposure: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_strength: Mapped[float] = mapped_column(Float, default=0.0)
    investigation_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_probability: Mapped[float] = mapped_column(Float, default=0.0)
    false_positive_risk: Mapped[float] = mapped_column(Float, default=0.0)
    risk_factors: Mapped[dict] = mapped_column(JSON, default=dict)
    component_scores: Mapped[dict] = mapped_column(JSON, default=dict)
    unresolved_questions: Mapped[list[str]] = mapped_column(JSON, default=list)
    version: Mapped[str] = mapped_column(String(50), default="1.0")
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship(
        "Case", back_populates="risk_scores"
    )
    entity: Mapped["Entity"] = relationship("Entity")

    __table_args__ = (
        Index("ix_risk_scores_case", "case_id"),
        Index("ix_risk_scores_entity", "entity_id"),
        Index("ix_risk_scores_level", "risk_level"),
    )


class HypothesisStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    TESTING = "TESTING"
    SUPPORTED = "SUPPORTED"
    REJECTED = "REJECTED"
    NEEDS_MORE_EVIDENCE = "NEEDS_MORE_EVIDENCE"


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    hypothesis_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[HypothesisStatus] = mapped_column(
        SQLEnum(HypothesisStatus),
        default=HypothesisStatus.PROPOSED,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    supporting_evidence_ids: Mapped[list[str]] = mapped_column(
        JSON, default=list
    )
    contradicting_evidence_ids: Mapped[list[str]] = mapped_column(
        JSON, default=list
    )
    missing_evidence_ids: Mapped[list[str]] = mapped_column(
        JSON, default=list
    )
    alternative_explanation: Mapped[str | None] = mapped_column(Text)
    recommended_next_steps: Mapped[list[str]] = mapped_column(
        JSON, default=list
    )
    proposed_by: Mapped[str] = mapped_column(String(100))
    proposed_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )
    reviewed_at: Mapped[datetime | None] = mapped_column()
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )

    hypothesis_metadata: Mapped[dict] = mapped_column(
        "metadata", JSON, default=dict
    )

    case: Mapped["Case"] = relationship(
        "Case", back_populates="hypotheses"
    )

    __table_args__ = (
        Index("ix_hypotheses_case_status", "case_id", "status"),
        Index("ix_hypotheses_confidence", "confidence"),
    )


class BehavioralBaseline(Base):
    __tablename__ = "behavioral_baselines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)
    baseline_value: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_std: Mapped[float] = mapped_column(Float, default=0.0)
    sample_count: Mapped[int] = mapped_column(Integer, default=0)
    time_window_days: Mapped[int] = mapped_column(Integer, default=30)
    last_updated: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )

    baseline_metadata: Mapped[dict] = mapped_column(
        "metadata", JSON, default=dict
    )

    entity: Mapped["Entity"] = relationship("Entity")

    __table_args__ = (
        Index(
            "ix_baseline_entity_metric",
            "entity_id",
            "metric_name",
            unique=True,
        ),
        Index("ix_baseline_case", "case_id"),
    )


class AnomalyDetection(Base):
    __tablename__ = "anomaly_detections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False
    )
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    observed_value: Mapped[float] = mapped_column(Float, nullable=False)
    expected_value: Mapped[float] = mapped_column(Float, nullable=False)
    deviation_score: Mapped[float] = mapped_column(Float, nullable=False)
    detection_method: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[SignalSeverity] = mapped_column(
        SQLEnum(SignalSeverity), nullable=False
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship("Case")
    entity: Mapped["Entity"] = relationship("Entity")

    __table_args__ = (
        Index("ix_anomaly_case_entity", "case_id", "entity_id"),
        Index("ix_anomaly_metric", "metric_name"),
        Index("ix_anomaly_severity", "severity"),
    )
