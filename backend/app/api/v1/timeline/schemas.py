from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.auth.schemas import User


class TimelineEventBase(BaseModel):
    case_id: uuid.UUID
    event_type: str
    timestamp: datetime
    entity_ids: List[uuid.UUID] = []
    description: str
    details: Dict[str, Any] = {}
    evidence_ids: List[str] = []
    source: Optional[str] = None


class TimelineEventCreate(TimelineEventBase):
    pass


class TimelineEventUpdate(BaseModel):
    event_type: Optional[str] = None
    timestamp: Optional[datetime] = None
    entity_ids: Optional[List[uuid.UUID]] = None
    description: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    evidence_ids: Optional[List[str]] = None
    risk_score: Optional[float] = None
    is_suspicious: Optional[bool] = None
    behavioral_deviation: Optional[Dict[str, Any]] = None
    source: Optional[str] = None


class TimelineEventResponse(TimelineEventBase):
    id: uuid.UUID
    event_id: str
    risk_score: float
    is_suspicious: bool
    behavioral_deviation: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TimelineEventDetail(TimelineEventResponse):
    temporal_correlations: List[Dict[str, Any]] = []
    impossible_travel: List[Dict[str, Any]] = []


class TimelineListResponse(BaseModel):
    items: List[TimelineEventResponse]
    total: int
    page: int
    page_size: int


class TimelineFilterParams(BaseModel):
    search: Optional[str] = None
    event_type: Optional[List[str]] = None
    is_suspicious: Optional[bool] = None
    min_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    source: Optional[List[str]] = None
    page: int = 1
    page_size: int = 25


class TemporalCorrelationResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    event_a_id: uuid.UUID
    event_b_id: uuid.UUID
    relation_type: str
    time_delta_seconds: float
    confidence: float
    evidence_ids: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TemporalCorrelationListResponse(BaseModel):
    items: List[TemporalCorrelationResponse]
    total: int
    page: int
    page_size: int


class ImpossibleTravelResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    entity_id: uuid.UUID
    previous_location_id: Optional[uuid.UUID] = None
    new_location_id: Optional[uuid.UUID] = None
    previous_timestamp: datetime
    new_timestamp: datetime
    distance_km: float
    min_travel_time_hours: float
    actual_time_hours: float
    is_impossible: bool
    possible_explanations: List[str]
    evidence_ids: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ImpossibleTravelListResponse(BaseModel):
    items: List[ImpossibleTravelResponse]
    total: int
    page: int
    page_size: int


class TimelineStats(BaseModel):
    total_events: int
    suspicious_events: int
    by_type: Dict[str, int]
    by_source: Dict[str, int]
    by_risk_level: Dict[str, int]
    date_range: Dict[str, Optional[str]]
    top_suspicious_entities: List[Dict[str, Any]]
    temporal_correlations: int
    impossible_travel_incidents: int


class TimelineExportRequest(BaseModel):
    case_id: uuid.UUID
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    event_types: Optional[List[str]] = None
    format: str = "json"  # json, csv