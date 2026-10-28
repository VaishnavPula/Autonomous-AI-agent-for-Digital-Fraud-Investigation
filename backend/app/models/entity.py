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
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class EntityType(str, enum.Enum):
    USER = "USER"
    ACCOUNT = "ACCOUNT"
    DEVICE = "DEVICE"
    IP = "IP"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    TRANSACTION = "TRANSACTION"
    MERCHANT = "MERCHANT"
    LOCATION = "LOCATION"
    DOCUMENT = "DOCUMENT"
    EVENT = "EVENT"
    CASE = "CASE"


class Entity(Base):
    __tablename__ = "entities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    entity_id: Mapped[str] = mapped_column(
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
    entity_type: Mapped[EntityType] = mapped_column(
        SQLEnum(EntityType),
        nullable=False,
    )
    name: Mapped[str | None] = mapped_column(String(255))
    value: Mapped[str | None] = mapped_column(String(500))
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="LOW")
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    first_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    last_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    is_resolved: Mapped[bool] = mapped_column(default=False)
    resolved_from: Mapped[list[uuid.UUID]] = mapped_column(
        JSON,
        default=list,
    )
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
        back_populates="entities",
    )
    source_relationships: Mapped[list["EntityRelationship"]] = relationship(
        "EntityRelationship",
        back_populates="source_entity",
        foreign_keys="EntityRelationship.source_entity_id",
    )
    target_relationships: Mapped[list["EntityRelationship"]] = relationship(
        "EntityRelationship",
        back_populates="target_entity",
        foreign_keys="EntityRelationship.target_entity_id",
    )

    __table_args__ = (
        Index("ix_entities_case_type", "case_id", "entity_type"),
        Index("ix_entities_value", "value"),
        Index("ix_entities_risk", "risk_score"),
        Index("ix_entities_resolved", "is_resolved"),
    )


class RelationshipType(str, enum.Enum):
    OWNS = "OWNS"
    USED = "USED"
    LOGGED_IN_FROM = "LOGGED_IN_FROM"
    TRANSFERRED_TO = "TRANSFERRED_TO"
    CONNECTED_TO = "CONNECTED_TO"
    LOCATED_AT = "LOCATED_AT"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    COMMUNICATED_WITH = "COMMUNICATED_WITH"
    CREATED = "CREATED"
    MODIFIED = "MODIFIED"
    RECEIVED = "RECEIVED"
    SENT = "SENT"


class EntityRelationship(Base):
    __tablename__ = "entity_relationships"

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
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    target_entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship_type: Mapped[RelationshipType] = mapped_column(
        SQLEnum(RelationshipType),
        nullable=False,
    )
    timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    evidence_ids: Mapped[list[str]] = mapped_column(JSON, default=list)

    # "metadata" is reserved by SQLAlchemy, so use another Python attribute.
    relationship_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSON,
        default=dict,
    )

    strength: Mapped[float] = mapped_column(Float, default=1.0)
    is_directional: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    source_entity: Mapped["Entity"] = relationship(
        "Entity",
        back_populates="source_relationships",
        foreign_keys=[source_entity_id],
    )
    target_entity: Mapped["Entity"] = relationship(
        "Entity",
        back_populates="target_relationships",
        foreign_keys=[target_entity_id],
    )

    __table_args__ = (
        Index("ix_entity_rels_case", "case_id"),
        Index("ix_entity_rels_source", "source_entity_id"),
        Index("ix_entity_rels_target", "target_entity_id"),
        Index("ix_entity_rels_type", "relationship_type"),
        Index(
            "ix_entity_rels_source_target",
            "source_entity_id",
            "target_entity_id",
            "relationship_type",
            unique=True,
        ),
    )
