from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
import uuid

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, User, Evidence, Entity, Transaction, FraudSignal, Hypothesis, RiskScore
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    CaseCreate, CaseUpdate, CaseResponse, CaseDetail, CasesListResponse,
    CaseFilterParams, CaseAssignRequest, CaseStatusUpdateRequest, CaseRiskUpdateRequest
)

router = APIRouter(prefix="/cases", tags=["cases"])


def apply_filters(query, filters: CaseFilterParams, current_user: UserSchema):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                Case.case_id.ilike(search_term),
                Case.title.ilike(search_term),
                Case.description.ilike(search_term),
            )
        )
    
    if filters.status:
        query = query.filter(Case.status.in_(filters.status))
    
    if filters.risk_level:
        query = query.filter(Case.risk_level.in_(filters.risk_level))
    
    if filters.case_type:
        query = query.filter(Case.case_type == filters.case_type)
    
    if filters.priority:
        query = query.filter(Case.priority == filters.priority)
    
    if filters.investigator_id:
        query = query.filter(Case.investigator_id == filters.investigator_id)
    
    if filters.date_from:
        query = query.filter(Case.created_at >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Case.created_at <= filters.date_to)
    
    # Role-based access control
    # VIEWER and ANALYST can only see cases they're assigned to or have access to
    # For now, allow all authenticated users to see all cases
    # TODO: Implement proper case access control
    
    return query


@router.get("", response_model=CasesListResponse)
def list_cases(
    search: Optional[str] = Query(None),
    status: Optional[List[str]] = Query(None),
    risk_level: Optional[List[str]] = Query(None),
    case_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    investigator_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = CaseFilterParams(
        search=search,
        status=status,
        risk_level=risk_level,
        case_type=case_type,
        priority=priority,
        investigator_id=investigator_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(Case)
    query = apply_filters(query, filters, current_user)
    
    total = query.count()
    
    cases = query.order_by(desc(Case.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return CasesListResponse(
        items=[CaseResponse.model_validate(case) for case in cases],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    case_data: CaseCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    # Check if case_id already exists
    existing = db.query(Case).filter(Case.case_id == case_data.case_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Case with ID {case_data.case_id} already exists"
        )
    
    case = Case(
        case_id=case_data.case_id,
        title=case_data.title,
        description=case_data.description,
        case_type=case_data.case_type,
        priority=case_data.priority,
        investigator_id=current_user.id,
    )
    
    db.add(case)
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(
    case_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get counts
    evidence_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    entities_count = db.query(Entity).filter(Entity.case_id == case.id).count()
    transactions_count = db.query(Transaction).filter(Transaction.case_id == case.id).count()
    fraud_signals_count = db.query(FraudSignal).filter(FraudSignal.case_id == case.id).count()
    hypotheses_count = db.query(Hypothesis).filter(Hypothesis.case_id == case.id).count()
    risk_scores_count = db.query(RiskScore).filter(RiskScore.case_id == case.id).count()
    
    case_detail = CaseDetail.model_validate(case)
    case_detail.evidence_count = evidence_count
    case_detail.entities_count = entities_count
    case_detail.transactions_count = transactions_count
    case_detail.fraud_signals_count = fraud_signals_count
    case_detail.hypotheses_count = hypotheses_count
    case_detail.risk_scores_count = risk_scores_count
    
    return case_detail


@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    case_update: CaseUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check permissions - only investigator, lead investigator, or admin can update
    if (case.investigator_id != current_user.id and 
        current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this case"
        )
    
    update_data = case_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.post("/{case_id}/assign", response_model=CaseResponse)
def assign_case(
    case_id: str,
    assign_request: CaseAssignRequest,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    investigator = db.query(User).filter(User.id == assign_request.investigator_id).first()
    if not investigator:
        raise HTTPException(status_code=404, detail="Investigator not found")
    
    case.investigator_id = assign_request.investigator_id
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}/status", response_model=CaseResponse)
def update_case_status(
    case_id: str,
    status_update: CaseStatusUpdateRequest,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    valid_statuses = [
        "NEW", "TRIAGING", "INVESTIGATING", "EVIDENCE_REVIEW",
        "RECONSTRUCTING", "REMEDIATION", "UNDER_REVIEW",
        "RESOLVED", "ESCALATED", "CLOSED"
    ]
    
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Valid: {', '.join(valid_statuses)}"
        )
    
    case.status = status_update.status
    case.updated_at = datetime.utcnow()
    
    if status_update.status in ["RESOLVED", "CLOSED"] and not case.closed_at:
        case.closed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}/risk", response_model=CaseResponse)
def update_case_risk(
    case_id: str,
    risk_update: CaseRiskUpdateRequest,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    valid_risk_levels = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    
    if risk_update.risk_level not in valid_risk_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid risk level. Valid: {', '.join(valid_risk_levels)}"
        )
    
    case.risk_level = risk_update.risk_level
    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}")
def delete_case(
    case_id: str,
    current_user: UserSchema = Depends(get_current_superuser),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    db.delete(case)
    db.commit()
    
    return {"message": "Case deleted successfully"}


@router.get("/{case_id}/summary")
def get_case_summary(
    case_id: str,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    entities_count = db.query(Entity).filter(Entity.case_id == case.id).count()
    transactions_count = db.query(Transaction).filter(Transaction.case_id == case.id).count()
    fraud_signals_count = db.query(FraudSignal).filter(FraudSignal.case_id == case.id).count()
    hypotheses_count = db.query(Hypothesis).filter(Hypothesis.case_id == case.id).count()
    risk_scores = db.query(RiskScore).filter(RiskScore.case_id == case.id).all()
    latest_risk = risk_scores[-1] if risk_scores else None
    
    return {
        "case": CaseResponse.model_validate(case),
        "counts": {
            "evidence": evidence_count,
            "entities": entities_count,
            "transactions": transactions_count,
            "fraud_signals": fraud_signals_count,
            "hypotheses": hypotheses_count,
        },
        "latest_risk": {
            "overall_score": latest_risk.overall_score if latest_risk else 0,
            "risk_level": latest_risk.risk_level if latest_risk else "UNKNOWN",
            "financial_exposure": latest_risk.financial_exposure if latest_risk else 0,
            "investigation_confidence": latest_risk.investigation_confidence if latest_risk else 0,
        } if latest_risk else None,
    }