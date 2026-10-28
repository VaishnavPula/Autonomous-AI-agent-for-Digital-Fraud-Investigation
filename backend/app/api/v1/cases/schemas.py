from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid
from app.auth.schemas import User


class CaseBase(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = None
    case_type: str = "OTHER"
    priority: str = "MEDIUM"


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    investigator_id: Optional[uuid.UUID] = None
    reviewer_id: Optional[uuid.UUID] = None


class CaseResponse(CaseBase):
    id: uuid.UUID
    risk_level: str
    status: str
    financial_impact: Optional[float] = None
    affected_entities_count: int
    evidence_count: int
    ai_confidence: Optional[float] = None
    investigation_completeness: float
    investigator_id: Optional[uuid.UUID] = None
    reviewer_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CaseDetail(CaseResponse):
    investigator: Optional[User] = None
    reviewer: Optional[User] = None
    evidence_count: int
    entities_count: int
    transactions_count: int
    fraud_signals_count: int
    hypotheses_count: int
    risk_scores_count: int


class CasesListResponse(BaseModel):
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int


class CaseFilterParams(BaseModel):
    search: Optional[str] = None
    status: Optional[List[str]] = None
    risk_level: Optional[List[str]] = None
    case_type: Optional[str] = None
    priority: Optional[str] = None
    investigator_id: Optional[uuid.UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class CaseAssignRequest(BaseModel):
    investigator_id: uuid.UUID


class CaseStatusUpdateRequest(BaseModel):
    status: str
    reason: Optional[str] = None


class CaseRiskUpdateRequest(BaseModel):
    risk_level: str
    reason: Optional[str] = None