import enum
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, Index, DateTime, JSON, BigInteger, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from app.models.base import Base


class EvidenceType(str, enum.Enum):
    CSV = "CSV"
    JSON = "JSON"
    TXT = "TXT"
    PDF = "PDF"
    IMAGE = "IMAGE"
    LOG = "LOG"
    TRANSACTION_EXPORT = "TRANSACTION_EXPORT"
    ACCOUNT_RECORD = "ACCOUNT_RECORD"
    DEVICE_RECORD = "DEVICE_RECORD"
    IP_LOG = "IP_LOG"
    COMMUNICATION_METADATA = "COMMUNICATION_METADATA"
    DOCUMENT = "DOCUMENT"
    BROWSER_FINGERPRINT = "BROWSER_FINGERPRINT"
    DEVICE_FINGERPRINT = "DEVICE_FINGERPRINT"
    OTHER = "OTHER"


class EvidenceClassification(str, enum.Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"


class IntegrityStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    WARNING = "WARNING"
    CORRUPTED = "CORRUPTED"
    PENDING = "PENDING"


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    evidence_type: Mapped[EvidenceType] = mapped_column(SQLEnum(EvidenceType), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    entity_references: Mapped[dict] = mapped_column(JSON, default=dict)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash_algorithm: Mapped[str] = mapped_column(String(20), default="SHA-256", nullable=False)
    integrity_status: Mapped[IntegrityStatus] = mapped_column(SQLEnum(IntegrityStatus), default=IntegrityStatus.PENDING, nullable=False)
    reliability: Mapped[float] = mapped_column(default=1.0)
    relevance: Mapped[float] = mapped_column(default=0.5)
    collector_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    imported_at: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    storage_reference: Mapped[str | None] = mapped_column(String(500))
    classification: Mapped[EvidenceClassification] = mapped_column(SQLEnum(EvidenceClassification), default=EvidenceClassification.INTERNAL)
    file_size: Mapped[int | None] = mapped_column(BigInteger)
    mime_type: Mapped[str | None] = mapped_column(String(100))

    case: Mapped["Case"] = relationship("Case", back_populates="evidence")
    collector: Mapped["User"] = relationship("User", back_populates="evidence_uploaded")
    access_history: Mapped[list["EvidenceAccess"]] = relationship("EvidenceAccess", back_populates="evidence", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_evidence_case_type", "case_id", "evidence_type"),
        Index("ix_evidence_timestamp", "timestamp"),
        Index("ix_evidence_hash", "hash"),
        Index("ix_evidence_integrity", "integrity_status"),
    )


class EvidenceAccess(Base):
    __tablename__ = "evidence_access"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(default=func.now(), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict] = mapped_column(JSON, default=dict)

    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="access_history")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("ix_evidence_access_evidence_time", "evidence_id", "timestamp"),
        Index("ix_evidence_access_user_time", "user_id", "timestamp"),
    )