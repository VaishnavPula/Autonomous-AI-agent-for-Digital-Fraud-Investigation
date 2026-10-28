import enum
from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum, Index, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from app.models.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LEAD_INVESTIGATOR = "LEAD_INVESTIGATOR"
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)

    assigned_cases: Mapped[list["Case"]] = relationship("Case", back_populates="investigator", foreign_keys="Case.investigator_id")
    reviewed_cases: Mapped[list["Case"]] = relationship("Case", back_populates="reviewer", foreign_keys="Case.reviewer_id")
    evidence_uploaded: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="collector")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="user")
    decisions: Mapped[list["InvestigatorDecision"]] = relationship("InvestigatorDecision", back_populates="investigator")
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_email_active", "email", "is_active"),
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    permissions: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column()
    replaced_by_token: Mapped[str | None] = mapped_column(String(255))
    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(45))

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (
        Index("ix_refresh_tokens_user_expires", "user_id", "expires_at"),
        Index("ix_refresh_tokens_token", "token"),
    )


class CaseStatus(str, enum.Enum):
    NEW = "NEW"
    TRIAGING = "TRIAGING"
    INVESTIGATING = "INVESTIGATING"
    EVIDENCE_REVIEW = "EVIDENCE_REVIEW"
    RECONSTRUCTING = "RECONSTRUCTING"
    REMEDIATION = "REMEDIATION"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"


class CasePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CaseType(str, enum.Enum):
    ACCOUNT_TAKEOVER = "ACCOUNT_TAKEOVER"
    FRAUDULENT_TRANSACTION = "FRAUDULENT_TRANSACTION"
    MONEY_LAUNDERING = "MONEY_LAUNDERING"
    IDENTITY_THEFT = "IDENTITY_THEFT"
    INSIDER_THREAT = "INSIDER_THREAT"
    OTHER = "OTHER"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    case_type: Mapped[CaseType] = mapped_column(SQLEnum(CaseType), default=CaseType.OTHER, nullable=False)
    priority: Mapped[CasePriority] = mapped_column(SQLEnum(CasePriority), default=CasePriority.MEDIUM, nullable=False)
    risk_level: Mapped[CasePriority] = mapped_column(SQLEnum(CasePriority), default=CasePriority.MEDIUM, nullable=False)
    status: Mapped[CaseStatus] = mapped_column(SQLEnum(CaseStatus), default=CaseStatus.NEW, nullable=False)
    financial_impact: Mapped[float | None] = mapped_column()
    affected_entities_count: Mapped[int] = mapped_column(default=0)
    evidence_count: Mapped[int] = mapped_column(default=0)
    ai_confidence: Mapped[float | None] = mapped_column()
    investigation_completeness: Mapped[float] = mapped_column(default=0.0)
    investigator_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now(), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column()

    investigator: Mapped["User"] = relationship("User", back_populates="assigned_cases", foreign_keys=[investigator_id])
    reviewer: Mapped["User"] = relationship("User", back_populates="reviewed_cases", foreign_keys=[reviewer_id])
    evidence: Mapped[list["Evidence"]] = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    entities: Mapped[list["Entity"]] = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="case", cascade="all, delete-orphan")
    timeline_events: Mapped[list["TimelineEvent"]] = relationship("TimelineEvent", back_populates="case", cascade="all, delete-orphan")
    fraud_signals: Mapped[list["FraudSignal"]] = relationship("FraudSignal", back_populates="case", cascade="all, delete-orphan")
    risk_scores: Mapped[list["RiskScore"]] = relationship("RiskScore", back_populates="case", cascade="all, delete-orphan")
    hypotheses: Mapped[list["Hypothesis"]] = relationship("Hypothesis", back_populates="case", cascade="all, delete-orphan")
    investigation_runs: Mapped[list["InvestigationRun"]] = relationship("InvestigationRun", back_populates="case", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="case", cascade="all, delete-orphan")
    decisions: Mapped[list["InvestigatorDecision"]] = relationship("InvestigatorDecision", back_populates="case", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="case", cascade="all, delete-orphan")
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="case", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_cases_status_priority", "status", "priority"),
        Index("ix_cases_investigator_status", "investigator_id", "status"),
        Index("ix_cases_created_at", "created_at"),
    )


class InvestigationState(str, enum.Enum):
    NEW = "NEW"
    TRIAGING = "TRIAGING"
    COLLECTING_EVIDENCE = "COLLECTING_EVIDENCE"
    ANALYZING = "ANALYZING"
    HYPOTHESIS_REVIEW = "HYPOTHESIS_REVIEW"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    ACTION_PENDING = "ACTION_PENDING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"