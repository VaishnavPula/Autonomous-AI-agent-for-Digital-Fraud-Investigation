from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.auth.schemas import User


class EntityBase(BaseModel):
    case_id: uuid.UUID
    entity_type: str
    name: Optional[str] = None
    value: Optional[str] = None
    attributes: Dict[str, Any] = {}
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class EntityCreate(EntityBase):
    pass


class EntityUpdate(BaseModel):
    entity_type: Optional[str] = None
    name: Optional[str] = None
    value: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    confidence: Optional[float] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    is_resolved: Optional[bool] = None
    resolved_from: Optional[List[uuid.UUID]] = None


class EntityResponse(EntityBase):
    id: uuid.UUID
    entity_id: str
    risk_score: float
    risk_level: str
    confidence: float
    is_resolved: bool
    resolved_from: List[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EntityDetail(EntityResponse):
    source_relationships: List[Dict[str, Any]] = []
    target_relationships: List[Dict[str, Any]] = []
    evidence_count: int = 0


class EntityListResponse(BaseModel):
    items: List[EntityResponse]
    total: int
    page: int
    page_size: int


class EntityFilterParams(BaseModel):
    search: Optional[str] = None
    entity_type: Optional[List[str]] = None
    risk_level: Optional[List[str]] = None
    is_resolved: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class EntityRelationshipBase(BaseModel):
    case_id: uuid.UUID
    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    relationship_type: str
    timestamp: Optional[datetime] = None
    confidence: float = 1.0
    evidence_ids: List[str] = []
    metadata: Dict[str, Any] = {}
    strength: float = 1.0
    is_directional: bool = True


class EntityRelationshipCreate(EntityRelationshipBase):
    pass


class EntityRelationshipUpdate(BaseModel):
    relationship_type: Optional[str] = None
    timestamp: Optional[datetime] = None
    confidence: Optional[float] = None
    evidence_ids: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    strength: Optional[float] = None
    is_directional: Optional[bool] = None


class EntityRelationshipResponse(EntityRelationshipBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EntityRelationshipListResponse(BaseModel):
    items: List[EntityRelationshipResponse]
    total: int
    page: int
    page_size: int


class EntityResolutionRequest(BaseModel):
    entity_ids: List[uuid.UUID]
    new_entity_id: str
    new_entity_type: str
    new_name: Optional[str] = None
    new_value: Optional[str] = None


class EntityGraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]