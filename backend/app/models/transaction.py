import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String,
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


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REVERSED = "REVERSED"
    FLAGGED = "FLAGGED"
    UNDER_REVIEW = "UNDER_REVIEW"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    transaction_id: Mapped[str] = mapped_column(
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
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10),
        default="USD",
        nullable=False,
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    sender_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    receiver_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    merchant_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    payment_method: Mapped[str | None] = mapped_column(String(100))
    device_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    ip_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )
    location_entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
    )

    status: Mapped[TransactionStatus] = mapped_column(
        SQLEnum(TransactionStatus),
        default=TransactionStatus.COMPLETED,
        nullable=False,
    )
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_factors: Mapped[dict] = mapped_column(JSON, default=dict)

    # "metadata" is reserved by SQLAlchemy.
    # Keep the database column name but use a different Python attribute.
    transaction_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSON,
        default=dict,
    )

    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    case: Mapped["Case"] = relationship(
        "Case",
        back_populates="transactions",
    )
    sender: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[sender_entity_id],
    )
    receiver: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[receiver_entity_id],
    )
    merchant: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[merchant_entity_id],
    )
    device: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[device_entity_id],
    )
    ip: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[ip_entity_id],
    )
    location: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[location_entity_id],
    )

    __table_args__ = (
        Index("ix_transactions_case_time", "case_id", "timestamp"),
        Index("ix_transactions_sender", "sender_entity_id"),
        Index("ix_transactions_receiver", "receiver_entity_id"),
        Index("ix_transactions_amount", "amount"),
        Index("ix_transactions_risk", "risk_score"),
        Index("ix_transactions_status", "status"),
    )


class MoneyFlowEdge(Base):
    __tablename__ = "money_flow_edges"

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
    source_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
        nullable=False,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id"),
        nullable=False,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id"),
        nullable=False,
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    hop_number: Mapped[int] = mapped_column(Integer, default=1)
    path_id: Mapped[str | None] = mapped_column(String(100))
    risk: Mapped[float] = mapped_column(Float, default=0.0)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )

    source_entity: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[source_entity_id],
    )
    target_entity: Mapped["Entity"] = relationship(
        "Entity",
        foreign_keys=[target_entity_id],
    )
    transaction: Mapped["Transaction"] = relationship("Transaction")

    __table_args__ = (
        Index("ix_money_flow_case", "case_id"),
        Index("ix_money_flow_path", "path_id", "hop_number"),
        Index(
            "ix_money_flow_source_target",
            "source_entity_id",
            "target_entity_id",
        ),
    )
