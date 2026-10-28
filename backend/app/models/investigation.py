import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    Index,
    JSON,
    Float,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class FindingClassification(str, enum.Enum):
    OBSERVED = "OBSERVED"
    INFERRED = "INFERRED"
    SUSPECTED = "SUSPECTED"
    VERIFIED = "VERIFIED"
    UNKNOWN = "UNKNOWN"


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    finding_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    investigation_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("investigation_runs.id")
    )
    agent_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agent_runs.id")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    classification: Mapped[FindingClassification] = mapped_column(
        SQLEnum(FindingClassification),
        default=FindingClassification.OBSERVED,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    supporting_evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    contradicting_evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    missing_information: Mapped[list[str]] = mapped_column(JSON, default=list)
    alternative_explanation: Mapped[str | None] = mapped_column(Text)
    recommended_next_step: Mapped[str | None] = mapped_column(Text)
    derived_from_finding_ids: Mapped[list[uuid.UUID]] = mapped_column(
        JSON, default=list
    )
    finding_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(), onupdate=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="findings")

    __table_args__ = (
        Index("ix_findings_case_class", "case_id", "classification"),
        Index("ix_findings_confidence", "confidence"),
        Index("ix_findings_run", "investigation_run_id"),
    )


class DecisionAction(str, enum.Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    MODIFY = "MODIFY"
    DEFER = "DEFER"
    REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE"


class InvestigatorDecision(Base):
    __tablename__ = "investigator_decisions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    decision_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    finding_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("findings.id")
    )
    investigator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    action: Mapped[DecisionAction] = mapped_column(
        SQLEnum(DecisionAction), nullable=False
    )
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    previous_state: Mapped[dict] = mapped_column(JSON, default=dict)
    new_state: Mapped[dict] = mapped_column(JSON, default=dict)
    simulated_action: Mapped[str | None] = mapped_column(String(100))
    simulated_action_params: Mapped[dict] = mapped_column(JSON, default=dict)
    decision_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="decisions")
    investigator: Mapped["User"] = relationship("User", back_populates="decisions")
    finding: Mapped["Finding"] = relationship("Finding")

    __table_args__ = (
        Index("ix_decisions_case", "case_id"),
        Index("ix_decisions_investigator", "investigator_id"),
        Index("ix_decisions_action", "action"),
    )


class ActionType(str, enum.Enum):
    FLAG_ENTITY = "FLAG_ENTITY"
    REQUEST_VERIFICATION = "REQUEST_VERIFICATION"
    ESCALATE = "ESCALATE"
    CREATE_TASK = "CREATE_TASK"
    SIMULATE_FREEZE = "SIMULATE_FREEZE"
    REQUEST_MORE_EVIDENCE = "REQUEST_MORE_EVIDENCE"
    GENERATE_REPORT = "GENERATE_REPORT"
    CLOSE_CASE = "CLOSE_CASE"


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    action_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("investigator_decisions.id")
    )
    action_type: Mapped[ActionType] = mapped_column(
        SQLEnum(ActionType), nullable=False
    )
    target_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("entities.id")
    )
    status: Mapped[str] = mapped_column(String(50), default="PENDING")
    parameters: Mapped[dict] = mapped_column(JSON, default=dict)
    result: Mapped[dict | None] = mapped_column(JSON)
    executed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    executed_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )

    case: Mapped["Case"] = relationship("Case")
    decision: Mapped["InvestigatorDecision"] = relationship("InvestigatorDecision")
    target_entity: Mapped["Entity"] = relationship("Entity")

    __table_args__ = (
        Index("ix_actions_case", "case_id"),
        Index("ix_actions_status", "status"),
    )


class InvestigationRunStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"


class InvestigationRun(Base):
    __tablename__ = "investigation_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    investigation_run_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column()
    status: Mapped[InvestigationRunStatus] = mapped_column(
        SQLEnum(InvestigationRunStatus),
        default=InvestigationRunStatus.QUEUED,
        nullable=False,
    )
    agents_executed: Mapped[list[str]] = mapped_column(JSON, default=list)
    inputs: Mapped[dict] = mapped_column(JSON, default=dict)
    outputs: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence_used: Mapped[list[str]] = mapped_column(JSON, default=list)
    findings_generated: Mapped[list[uuid.UUID]] = mapped_column(JSON, default=list)
    errors: Mapped[list[dict]] = mapped_column(JSON, default=list)
    model_provider: Mapped[str | None] = mapped_column(String(100))
    model_name: Mapped[str | None] = mapped_column(String(100))
    analysis_version: Mapped[str] = mapped_column(String(50), default="1.0")
    risk_engine_version: Mapped[str] = mapped_column(String(50), default="1.0")
    fraud_rules_version: Mapped[str] = mapped_column(String(50), default="1.0")
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    run_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    case: Mapped["Case"] = relationship("Case", back_populates="investigation_runs")
    agent_runs: Mapped[list["AgentRun"]] = relationship(
        "AgentRun",
        back_populates="investigation_run",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_inv_runs_case_status", "case_id", "status"),
        Index("ix_inv_runs_started", "started_at"),
    )


class AgentRunStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RETRYING = "RETRYING"


class AgentType(str, enum.Enum):
    CASE_ANALYST = "CASE_ANALYST"
    EVIDENCE_ANALYST = "EVIDENCE_ANALYST"
    ENTITY_RESOLUTION = "ENTITY_RESOLUTION"
    TIMELINE_ANALYST = "TIMELINE_ANALYST"
    TRANSACTION_ANALYST = "TRANSACTION_ANALYST"
    NETWORK_ANALYST = "NETWORK_ANALYST"
    BEHAVIORAL_ANALYST = "BEHAVIORAL_ANALYST"
    FRAUD_PATTERN_ANALYST = "FRAUD_PATTERN_ANALYST"
    HYPOTHESIS_ANALYST = "HYPOTHESIS_ANALYST"
    RISK_ANALYST = "RISK_ANALYST"
    INVESTIGATOR_AGENT = "INVESTIGATOR_AGENT"
    REPORT_AGENT = "REPORT_AGENT"


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_run_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    investigation_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("investigation_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    agent_type: Mapped[AgentType] = mapped_column(
        SQLEnum(AgentType), nullable=False
    )
    status: Mapped[AgentRunStatus] = mapped_column(
        SQLEnum(AgentRunStatus), default=AgentRunStatus.QUEUED, nullable=False
    )
    task: Mapped[str] = mapped_column(Text)
    input_data: Mapped[dict] = mapped_column(JSON, default=dict)
    output_data: Mapped[dict] = mapped_column(JSON, default=dict)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    findings_generated: Mapped[list[uuid.UUID]] = mapped_column(JSON, default=list)
    error: Mapped[str | None] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column()
    completed_at: Mapped[datetime | None] = mapped_column()
    duration_seconds: Mapped[float | None] = mapped_column(Float)
    agent_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    investigation_run: Mapped["InvestigationRun"] = relationship(
        "InvestigationRun", back_populates="agent_runs"
    )

    __table_args__ = (
        Index("ix_agent_runs_inv_run", "investigation_run_id"),
        Index("ix_agent_runs_type_status", "agent_type", "status"),
    )


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    UPLOAD = "UPLOAD"
    DOWNLOAD = "DOWNLOAD"
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    ESCALATE = "ESCALATE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    EXPORT = "EXPORT"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    log_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cases.id")
    )
    evidence_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence.id")
    )
    action: Mapped[AuditAction] = mapped_column(SQLEnum(AuditAction), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    previous_state: Mapped[dict | None] = mapped_column(JSON)
    new_state: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)
    request_id: Mapped[str | None] = mapped_column(String(100))
    timestamp: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="audit_logs")
    case: Mapped["Case"] = relationship("Case", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_user_time", "user_id", "timestamp"),
        Index("ix_audit_case_time", "case_id", "timestamp"),
        Index("ix_audit_action_time", "action", "timestamp"),
        Index("ix_audit_resource", "resource_type", "resource_id"),
    )


class ReportFormat(str, enum.Enum):
    PDF = "PDF"
    JSON = "JSON"
    CSV = "CSV"
    MARKDOWN = "MARKDOWN"


class ReportStatus(str, enum.Enum):
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    report_id: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    generated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    format: Mapped[ReportFormat] = mapped_column(SQLEnum(ReportFormat), nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        SQLEnum(ReportStatus), default=ReportStatus.GENERATING, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    file_path: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column()
    sections: Mapped[list[str]] = mapped_column(JSON, default=list)
    investigation_run_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("investigation_runs.id")
    )
    report_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column()

    case: Mapped["Case"] = relationship("Case", back_populates="reports")

    __table_args__ = (
        Index("ix_reports_case", "case_id"),
        Index("ix_reports_status", "status"),
    )
