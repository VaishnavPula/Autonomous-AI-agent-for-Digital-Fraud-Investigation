from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.auth.schemas import User


class FraudSignalBase(BaseModel):
    case_id: uuid.UUID
    entity_id: Optional[uuid.UUID] = None
    signal_type: str
    severity: str
    observed_value: str
    expected_value: Optional[str] = None
    deviation: float
    reason: str
    evidence_ids: List[str] = []
    score_contribution: float = 0.0
    confidence: float = 1.0
    metadata: Dict[str, Any] = {}


class FraudSignalCreate(FraudSignalBase):
    pass


class FraudSignalUpdate(BaseModel):
    signal_type: Optional[str] = None
    severity: Optional[str] = None
    observed_value: Optional[str] = None
    expected_value: Optional[str] = None
    deviation: Optional[float] = None
    reason: Optional[str] = None
    evidence_ids: Optional[List[str]] = None
    score_contribution: Optional[float] = None
    confidence: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None
    is_false_positive: Optional[bool] = None


class FraudSignalResponse(FraudSignalBase):
    id: uuid.UUID
    signal_id: str
    is_false_positive: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FraudSignalListResponse(BaseModel):
    items: List[FraudSignalResponse]
    total: int
    page: int
    page_size: int


class FraudSignalFilterParams(BaseModel):
    search: Optional[str] = None
    signal_type: Optional[List[str]] = None
    severity: Optional[List[str]] = None
    is_false_positive: Optional[bool] = None
    entity_id: Optional[uuid.UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class RiskScoreBase(BaseModel):
    case_id: uuid.UUID
    entity_id: Optional[uuid.UUID] = None
    overall_score: float
    risk_level: str
    financial_exposure: float = 0.0
    evidence_strength: float = 0.0
    investigation_confidence: float = 0.0
    fraud_probability: float = 0.0
    false_positive_risk: float = 0.0
    risk_factors: Dict[str, Any] = {}
    component_scores: Dict[str, Any] = {}
    unresolved_questions: List[str] = []
    version: str = "1.0"


class RiskScoreCreate(RiskScoreBase):
    pass


class RiskScoreUpdate(BaseModel):
    overall_score: Optional[float] = None
    risk_level: Optional[str] = None
    financial_exposure: Optional[float] = None
    evidence_strength: Optional[float] = None
    investigation_confidence: Optional[float] = None
    fraud_probability: Optional[float] = None
    false_positive_risk: Optional[float] = None
    risk_factors: Optional[Dict[str, Any]] = None
    component_scores: Optional[Dict[str, Any]] = None
    unresolved_questions: Optional[List[str]] = None
    version: Optional[str] = None


class RiskScoreResponse(RiskScoreBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RiskScoreListResponse(BaseModel):
    items: List[RiskScoreResponse]
    total: int
    page: int
    page_size: int


class RiskFactor(BaseModel):
    factor_id: str
    name: str
    description: str
    weight: float
    score: float
    evidence: List[str] = []
    category: str


class RiskAssessmentRequest(BaseModel):
    case_id: uuid.UUID
    entity_id: Optional[uuid.UUID] = None
    include_components: bool = True


class RiskAssessmentResponse(BaseModel):
    case_id: uuid.UUID
    entity_id: Optional[uuid.UUID] = None
    overall_score: float
    risk_level: str
    financial_exposure: float
    evidence_strength: float
    investigation_confidence: float
    fraud_probability: float
    false_positive_risk: float
    risk_factors: List[RiskFactor]
    component_scores: Dict[str, float]
    unresolved_questions: List[str]
    created_at: datetime


class RiskStats(BaseModel):
    total_scores: int
    by_level: Dict[str, int]
    avg_score: float
    max_score: float
    total_exposure: float
    total_signals: int
    signals_by_severity: Dict[str, int]
    signals_by_type: Dict[str, int]
    false_positive_rate: float


class HypothesisBase(BaseModel):
    case_id: uuid.UUID
    title: str
    description: str
    proposed_by: str
    confidence: float = 0.0
    supporting_evidence_ids: List[str] = []
    contradicting_evidence_ids: List[str] = []
    missing_evidence_ids: List[str] = []
    alternative_explanation: Optional[str] = None
    recommended_next_steps: List[str] = []
    metadata: Dict[str, Any] = {}


class HypothesisCreate(HypothesisBase):
    pass


class HypothesisUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[float] = None
    supporting_evidence_ids: Optional[List[str]] = None
    contradicting_evidence_ids: Optional[List[str]] = None
    missing_evidence_ids: Optional[List[str]] = None
    alternative_explanation: Optional[str] = None
    recommended_next_steps: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    reviewed_by: Optional[uuid.UUID] = None


class HypothesisResponse(HypothesisBase):
    id: uuid.UUID
    hypothesis_id: str
    status: str
    proposed_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[uuid.UUID] = None
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class HypothesisListResponse(BaseModel):
    items: List[HypothesisResponse]
    total: int
    page: int
    page_size: int


class HypothesisFilterParams(BaseModel):
    search: Optional[str] = None
    status: Optional[List[str]] = None
    min_confidence: Optional[float] = None
    max_confidence: Optional[float] = None
    proposed_by: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class BehavioralBaselineCreate(BaseModel):
    entity_id: uuid.UUID
    case_id: uuid.UUID
    metric_name: str
    metric_type: str
    baseline_value: float
    baseline_std: float = 0.0
    sample_count: int = 0
    time_window_days: int = 30
    metadata: Dict[str, Any] = {}


class BehavioralBaselineResponse(BaseModel):
    id: uuid.UUID
    entity_id: uuid.UUID
    case_id: uuid.UUID
    metric_name: str
    metric_type: str
    baseline_value: float
    baseline_std: float
    sample_count: int
    time_window_days: int
    last_updated: datetime
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class AnomalyDetectionResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    entity_id: uuid.UUID
    metric_name: str
    observed_value: float
    expected_value: float
    deviation_score: float
    detection_method: str
    severity: str
    explanation: str
    evidence_ids: List[str]
    context: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AnomalyDetectionListResponse(BaseModel):
    items: List[AnomalyDetectionResponse]
    total: int
    page: int
    page_size: int