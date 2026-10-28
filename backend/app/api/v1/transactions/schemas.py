from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.auth.schemas import User


class TransactionBase(BaseModel):
    case_id: uuid.UUID
    transaction_id: str
    amount: float
    currency: str = "USD"
    timestamp: datetime
    sender_entity_id: Optional[uuid.UUID] = None
    receiver_entity_id: Optional[uuid.UUID] = None
    merchant_entity_id: Optional[uuid.UUID] = None
    payment_method: Optional[str] = None
    device_entity_id: Optional[uuid.UUID] = None
    ip_entity_id: Optional[uuid.UUID] = None
    location_entity_id: Optional[uuid.UUID] = None
    status: str = "COMPLETED"
    risk_factors: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    evidence_ids: List[str] = []


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    currency: Optional[str] = None
    timestamp: Optional[datetime] = None
    sender_entity_id: Optional[uuid.UUID] = None
    receiver_entity_id: Optional[uuid.UUID] = None
    merchant_entity_id: Optional[uuid.UUID] = None
    payment_method: Optional[str] = None
    device_entity_id: Optional[uuid.UUID] = None
    ip_entity_id: Optional[uuid.UUID] = None
    location_entity_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    risk_score: Optional[float] = None
    risk_factors: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    evidence_ids: Optional[List[str]] = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    risk_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionDetail(TransactionResponse):
    sender: Optional[Dict[str, Any]] = None
    receiver: Optional[Dict[str, Any]] = None
    merchant: Optional[Dict[str, Any]] = None
    device: Optional[Dict[str, Any]] = None
    ip: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    money_flow_edges: List[Dict[str, Any]] = []


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int


class TransactionFilterParams(BaseModel):
    search: Optional[str] = None
    status: Optional[List[str]] = None
    currency: Optional[List[str]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    min_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 25


class MoneyFlowEdgeResponse(BaseModel):
    id: uuid.UUID
    case_id: uuid.UUID
    source_entity_id: uuid.UUID
    target_entity_id: uuid.UUID
    transaction_id: uuid.UUID
    amount: float
    timestamp: datetime
    hop_number: int
    path_id: Optional[str] = None
    risk: float
    evidence_ids: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MoneyFlowPathResponse(BaseModel):
    path_id: str
    hops: List[MoneyFlowEdgeResponse]
    total_amount: float
    risk_score: float
    start_entity: Optional[Dict[str, Any]] = None
    end_entity: Optional[Dict[str, Any]] = None


class TransactionImportRequest(BaseModel):
    case_id: uuid.UUID
    file_content: str
    file_type: str  # CSV, JSON
    column_mapping: Dict[str, str]  # Maps CSV columns to transaction fields
    default_values: Dict[str, Any] = {}


class TransactionStats(BaseModel):
    total: int
    total_amount: float
    by_currency: Dict[str, int]
    by_status: Dict[str, int]
    by_risk_level: Dict[str, int]
    avg_amount: float
    max_amount: float
    min_amount: float
    date_range: Dict[str, Optional[str]]


class MoneyFlowStats(BaseModel):
    total_paths: int
    total_amount: float
    max_hops: int
    avg_path_length: float
    highest_risk_path: Optional[MoneyFlowPathResponse] = None