from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.auth.schemas import User


class EvidenceBase(BaseModel):
    case_id: uuid.UUID
    source: str
    evidence_type: str
    original_filename: str
    content: Optional[str] = None
    timestamp: Optional[datetime] = None
    entity_references: Dict[str, Any] = {}
    classification: str = "INTERNAL"
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    pass


class EvidenceUpdate(BaseModel):
    source: Optional[str] = None
    evidence_type: Optional[str] = None
    original_filename: Optional[str] = None
    content: Optional[str] = None
    timestamp: Optional[datetime] = None
    entity_references: Optional[Dict[str, Any]] = None
    classification: Optional[str] = None
    reliability: Optional[float] = None
    relevance: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class EvidenceResponse(EvidenceBase):
    id: uuid.UUID
    evidence_id: str
    hash: str
    hash_algorithm: str
    integrity_status: str
    reliability: float
    relevance: float
    collector_id: Optional[uuid.UUID] = None
    imported_at: datetime
    metadata: Dict[str, Any]
    storage_reference: Optional[str] = None

    class Config:
        from_attributes = True


class EvidenceDetail(EvidenceResponse):
    collector: Optional[User] = None
    access_history: List[Dict[str, Any]] = []


class EvidenceListResponse(BaseModel):
    items: List[EvidenceResponse]
    total: int
    page: int
    page_size: int


class EvidenceFilterParams(BaseModel):
    search: Optional[str] = None
    evidence_type: Optional[List[str]] = None
    source: Optional[List[str]] = None
    integrity_status: Optional[List[str]] = None
    classification: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class EvidenceUploadRequest(BaseModel):
    case_id: uuid.UUID
    source: str
    evidence_type: str
    original_filename: str
    content: Optional[str] = None
    timestamp: Optional[datetime] = None
    entity_references: Dict[str, Any] = {}
    classification: str = "INTERNAL"
    metadata: Optional[Dict[str, Any]] = None


class EvidenceIntegrityCheck(BaseModel):
    evidence_id: str
    expected_hash: str
    hash_algorithm: str = "SHA-256"


class EvidenceIntegrityResponse(BaseModel):
    evidence_id: str
    is_valid: bool
    current_hash: str
    expected_hash: str
    hash_algorithm: str
    checked_at: datetime


class ChainOfCustodyEntry(BaseModel):
    id: uuid.UUID
    action: str
    user_id: uuid.UUID
    user_name: Optional[str] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Dict[str, Any]

    class Config:
        from_attributes = True


class ChainOfCustodyResponse(BaseModel):
    evidence_id: str
    entries: List[ChainOfCustodyEntry]
    total: int