from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import uuid
import json

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, FraudSignal, RiskScore, Hypothesis, BehavioralBaseline, AnomalyDetection, Entity, Evidence
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    FraudSignalCreate, FraudSignalUpdate, FraudSignalResponse, FraudSignalListResponse, FraudSignalFilterParams,
    RiskScoreCreate, RiskScoreUpdate, RiskScoreResponse, RiskScoreListResponse, RiskAssessmentRequest, RiskAssessmentResponse,
    RiskFactor, RiskStats,
    HypothesisCreate, HypothesisUpdate, HypothesisResponse, HypothesisListResponse, HypothesisFilterParams,
    BehavioralBaselineCreate, BehavioralBaselineResponse,
    AnomalyDetectionResponse, AnomalyDetectionListResponse,
)

router = APIRouter(prefix="/risk", tags=["risk"])


def get_risk_level(score: float) -> str:
    if score >= 0.8:
        return "CRITICAL"
    elif score >= 0.6:
        return "HIGH"
    elif score >= 0.3:
        return "MEDIUM"
    elif score >= 0.1:
        return "LOW"
    else:
        return "VERY_LOW"


def apply_signal_filters(query, filters: FraudSignalFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                FraudSignal.signal_id.ilike(search_term),
                FraudSignal.reason.ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(FraudSignal.case_id == case_id)
    
    if filters.signal_type:
        query = query.filter(FraudSignal.signal_type.in_(filters.signal_type))
    
    if filters.severity:
        query = query.filter(FraudSignal.severity.in_(filters.severity))
    
    if filters.is_false_positive is not None:
        query = query.filter(FraudSignal.is_false_positive == filters.is_false_positive)
    
    if filters.entity_id:
        query = query.filter(FraudSignal.entity_id == filters.entity_id)
    
    if filters.date_from:
        query = query.filter(FraudSignal.created_at >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(FraudSignal.created_at <= filters.date_to)
    
    return query


@router.get("/signals", response_model=FraudSignalListResponse)
def list_fraud_signals(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    signal_type: Optional[List[str]] = Query(None),
    severity: Optional[List[str]] = Query(None),
    is_false_positive: Optional[bool] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = FraudSignalFilterParams(
        search=search,
        signal_type=signal_type,
        severity=severity,
        is_false_positive=is_false_positive,
        entity_id=entity_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(FraudSignal)
    query = apply_signal_filters(query, filters, case_id)
    
    total = query.count()
    
    signals = query.order_by(desc(FraudSignal.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return FraudSignalListResponse(
        items=[FraudSignalResponse.model_validate(signal) for signal in signals],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/signals", response_model=FraudSignalResponse, status_code=status.HTTP_201_CREATED)
def create_fraud_signal(
    signal_data: FraudSignalCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == signal_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if signal_data.entity_id:
        entity = db.query(Entity).filter(Entity.id == signal_data.entity_id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
    
    signal = FraudSignal(
        case_id=signal_data.case_id,
        entity_id=signal_data.entity_id,
        signal_type=signal_data.signal_type,
        severity=signal_data.severity,
        observed_value=signal_data.observed_value,
        expected_value=signal_data.expected_value,
        deviation=signal_data.deviation,
        reason=signal_data.reason,
        evidence_ids=signal_data.evidence_ids,
        score_contribution=signal_data.score_contribution,
        confidence=signal_data.confidence,
        metadata=signal_data.metadata,
    )
    
    db.add(signal)
    db.commit()
    db.refresh(signal)
    
    return FraudSignalResponse.model_validate(signal)


@router.get("/signals/{signal_id}", response_model=FraudSignalResponse)
def get_fraud_signal(
    signal_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    signal = db.query(FraudSignal).filter(FraudSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Fraud signal not found")
    
    return FraudSignalResponse.model_validate(signal)


@router.patch("/signals/{signal_id}", response_model=FraudSignalResponse)
def update_fraud_signal(
    signal_id: uuid.UUID,
    signal_update: FraudSignalUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    signal = db.query(FraudSignal).filter(FraudSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Fraud signal not found")
    
    case = db.query(Case).filter(Case.id == signal.case_id).first()
    if case.investigator_id != current_user.id and current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this signal"
        )
    
    update_data = signal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(signal, field, value)
    
    db.commit()
    db.refresh(signal)
    
    return FraudSignalResponse.model_validate(signal)


@router.delete("/signals/{signal_id}")
def delete_fraud_signal(
    signal_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    signal = db.query(FraudSignal).filter(FraudSignal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Fraud signal not found")
    
    db.delete(signal)
    db.commit()
    
    return {"message": "Fraud signal deleted successfully"}


@router.get("/scores", response_model=RiskScoreListResponse)
def list_risk_scores(
    case_id: Optional[uuid.UUID] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    risk_level: Optional[List[str]] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(RiskScore)
    
    if case_id:
        query = query.filter(RiskScore.case_id == case_id)
    if entity_id:
        query = query.filter(RiskScore.entity_id == entity_id)
    if risk_level:
        query = query.filter(RiskScore.risk_level.in_(risk_level))
    if min_score is not None:
        query = query.filter(RiskScore.overall_score >= min_score)
    if max_score is not None:
        query = query.filter(RiskScore.overall_score <= max_score)
    
    total = query.count()
    
    scores = query.order_by(desc(RiskScore.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return RiskScoreListResponse(
        items=[RiskScoreResponse.model_validate(score) for score in scores],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/scores", response_model=RiskScoreResponse, status_code=status.HTTP_201_CREATED)
def create_risk_score(
    score_data: RiskScoreCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == score_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if score_data.entity_id:
        entity = db.query(Entity).filter(Entity.id == score_data.entity_id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
    
    score = RiskScore(
        case_id=score_data.case_id,
        entity_id=score_data.entity_id,
        overall_score=score_data.overall_score,
        risk_level=score_data.risk_level,
        financial_exposure=score_data.financial_exposure,
        evidence_strength=score_data.evidence_strength,
        investigation_confidence=score_data.investigation_confidence,
        fraud_probability=score_data.fraud_probability,
        false_positive_risk=score_data.false_positive_risk,
        risk_factors=score_data.risk_factors,
        component_scores=score_data.component_scores,
        unresolved_questions=score_data.unresolved_questions,
        version=score_data.version,
    )
    
    db.add(score)
    db.commit()
    db.refresh(score)
    
    return RiskScoreResponse.model_validate(score)


@router.get("/scores/{score_id}", response_model=RiskScoreResponse)
def get_risk_score(
    score_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    score = db.query(RiskScore).filter(RiskScore.id == score_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Risk score not found")
    
    return RiskScoreResponse.model_validate(score)


@router.post("/assess", response_model=RiskAssessmentResponse)
def assess_risk(
    assessment: RiskAssessmentRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == assessment.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    entity = None
    if assessment.entity_id:
        entity = db.query(Entity).filter(Entity.id == assessment.entity_id).first()
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
    
    # Get signals for case/entity
    signal_query = db.query(FraudSignal).filter(FraudSignal.case_id == assessment.case_id)
    if assessment.entity_id:
        signal_query = signal_query.filter(FraudSignal.entity_id == assessment.entity_id)
    
    signals = signal_query.all()
    
    # Calculate component scores
    components = {
        "signal_severity": 0.0,
        "signal_count": 0.0,
        "financial_exposure": 0.0,
        "evidence_strength": 0.0,
        "behavioral_anomalies": 0.0,
        "entity_risk": 0.0,
    }
    
    risk_factors = []
    total_contribution = 0.0
    
    for signal in signals:
        factor = RiskFactor(
            factor_id=signal.signal_id,
            name=signal.signal_type,
            description=signal.reason,
            weight=signal.confidence,
            score=signal.deviation * signal.confidence,
            evidence=signal.evidence_ids,
            category=signal.severity,
        )
        risk_factors.append(factor)
        total_contribution += signal.score_contribution
        
        if signal.severity == "CRITICAL":
            components["signal_severity"] = max(components["signal_severity"], 0.9)
        elif signal.severity == "HIGH":
            components["signal_severity"] = max(components["signal_severity"], 0.7)
        elif signal.severity == "MEDIUM":
            components["signal_severity"] = max(components["signal_severity"], 0.5)
        
        components["signal_count"] += signal.score_contribution
    
    # Get transactions for financial exposure
    from app.models import Transaction
    tx_query = db.query(Transaction).filter(Transaction.case_id == assessment.case_id)
    if assessment.entity_id:
        tx_query = tx_query.filter(
            (Transaction.sender_entity_id == assessment.entity_id) |
            (Transaction.receiver_entity_id == assessment.entity_id)
        )
    
    transactions = tx_query.all()
    total_amount = sum(t.amount for t in transactions)
    components["financial_exposure"] = min(total_amount / 1000000, 1.0)  # Normalize
    
    # Calculate overall score
    weights = {
        "signal_severity": 0.3,
        "signal_count": 0.2,
        "financial_exposure": 0.2,
        "evidence_strength": 0.15,
        "behavioral_anomalies": 0.1,
        "entity_risk": 0.05,
    }
    
    overall_score = sum(components[k] * weights.get(k, 0) for k in components)
    overall_score = min(max(overall_score, 0.0), 1.0)
    
    risk_level = get_risk_level(overall_score)
    financial_exposure = total_amount
    evidence_strength = min(len([s for s in signals if not s.is_false_positive]) / 10, 1.0)
    investigation_confidence = 0.5  # placeholder
    fraud_probability = overall_score * 0.9
    false_positive_risk = len([s for s in signals if s.is_false_positive]) / max(len(signals), 1)
    
    unresolved = []
    if len(signals) == 0:
        unresolved.append("No fraud signals detected")
    if evidence_strength < 0.3:
        unresolved.append("Insufficient evidence to confirm fraud")
    if financial_exposure > 100000:
        unresolved.append("High financial exposure requires review")
    
    # Create or update risk score
    risk_score = RiskScore(
        case_id=assessment.case_id,
        entity_id=assessment.entity_id,
        overall_score=overall_score,
        risk_level=get_risk_level(overall_score),
        financial_exposure=financial_exposure,
        evidence_strength=evidence_strength,
        investigation_confidence=investigation_confidence,
        fraud_probability=fraud_probability,
        false_positive_risk=false_positive_risk,
        risk_factors={f.factor_id: f.dict() for f in risk_factors},
        component_scores=components,
        unresolved_questions=unresolved,
    )
    
    db.add(risk_score)
    db.commit()
    db.refresh(risk_score)
    
    return RiskAssessmentResponse(
        case_id=assessment.case_id,
        entity_id=assessment.entity_id,
        overall_score=overall_score,
        risk_level=risk_level,
        financial_exposure=financial_exposure,
        evidence_strength=evidence_strength,
        investigation_confidence=investigation_confidence,
        fraud_probability=fraud_probability,
        false_positive_risk=false_positive_risk,
        risk_factors=risk_factors,
        component_scores=components,
        unresolved_questions=unresolved,
        created_at=risk_score.created_at,
    )


@router.get("/case/{case_id}/stats", response_model=dict)
def get_risk_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    scores = db.query(RiskScore).filter(RiskScore.case_id == case_id).all()
    signals = db.query(FraudSignal).filter(FraudSignal.case_id == case_id).all()
    
    by_level = {}
    for score in scores:
        by_level[score.risk_level] = by_level.get(score.risk_level, 0) + 1
    
    signals_by_severity = {}
    signals_by_type = {}
    fp_count = 0
    for signal in signals:
        signals_by_severity[signal.severity] = signals_by_severity.get(signal.severity, 0) + 1
        signals_by_type[signal.signal_type] = signals_by_type.get(signal.signal_type, 0) + 1
        if signal.is_false_positive:
            fp_count += 1
    
    avg_score = sum(s.overall_score for s in scores) / len(scores) if scores else 0
    max_score = max((s.overall_score for s in scores), default=0)
    total_exposure = sum(s.financial_exposure for s in scores)
    
    return {
        "total_scores": len(scores),
        "by_level": by_level,
        "avg_score": avg_score,
        "max_score": max_score,
        "total_exposure": total_exposure,
        "total_signals": len(signals),
        "signals_by_severity": signals_by_severity,
        "signals_by_type": signals_by_type,
        "false_positive_rate": fp_count / max(len(signals), 1),
    }


# Hypothesis endpoints
def apply_hypothesis_filters(query, filters: HypothesisFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                Hypothesis.hypothesis_id.ilike(search_term),
                Hypothesis.title.ilike(search_term),
                Hypothesis.description.ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(Hypothesis.case_id == case_id)
    
    if filters.status:
        query = query.filter(Hypothesis.status.in_(filters.status))
    
    if filters.min_confidence is not None:
        query = query.filter(Hypothesis.confidence >= filters.min_confidence)
    
    if filters.max_confidence is not None:
        query = query.filter(Hypothesis.confidence <= filters.max_confidence)
    
    if filters.proposed_by:
        query = query.filter(Hypothesis.proposed_by.ilike(f"%{filters.proposed_by}%"))
    
    if filters.date_from:
        query = query.filter(Hypothesis.proposed_at >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Hypothesis.proposed_at <= filters.date_to)
    
    return query


@router.get("/hypotheses", response_model=HypothesisListResponse)
def list_hypotheses(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[List[str]] = Query(None),
    min_confidence: Optional[float] = Query(None),
    max_confidence: Optional[float] = Query(None),
    proposed_by: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = HypothesisFilterParams(
        search=search,
        status=status,
        min_confidence=min_confidence,
        max_confidence=max_confidence,
        proposed_by=proposed_by,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(Hypothesis)
    query = apply_hypothesis_filters(query, filters, case_id)
    
    total = query.count()
    
    hypotheses = query.order_by(desc(Hypothesis.proposed_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return HypothesisListResponse(
        items=[HypothesisResponse.model_validate(h) for h in hypotheses],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/hypotheses", response_model=HypothesisResponse, status_code=status.HTTP_201_CREATED)
def create_hypothesis(
    hypothesis_data: HypothesisCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == hypothesis_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    hypothesis = Hypothesis(
        case_id=hypothesis_data.case_id,
        title=hypothesis_data.title,
        description=hypothesis_data.description,
        confidence=hypothesis_data.confidence,
        supporting_evidence_ids=hypothesis_data.supporting_evidence_ids,
        contradicting_evidence_ids=hypothesis_data.contradicting_evidence_ids,
        missing_evidence_ids=hypothesis_data.missing_evidence_ids,
        alternative_explanation=hypothesis_data.alternative_explanation,
        recommended_next_steps=hypothesis_data.recommended_next_steps,
        proposed_by=hypothesis_data.proposed_by,
        metadata=hypothesis_data.metadata,
    )
    
    db.add(hypothesis)
    db.commit()
    db.refresh(hypothesis)
    
    return HypothesisResponse.model_validate(hypothesis)


@router.get("/hypotheses/{hypothesis_id}", response_model=HypothesisResponse)
def get_hypothesis(
    hypothesis_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    hypothesis = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not hypothesis:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    return HypothesisResponse.model_validate(hypothesis)


@router.patch("/hypotheses/{hypothesis_id}", response_model=HypothesisResponse)
def update_hypothesis(
    hypothesis_id: uuid.UUID,
    hypothesis_update: HypothesisUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    hypothesis = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not hypothesis:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    update_data = hypothesis_update.model_dump(exclude_unset=True)
    if "reviewed_by" in update_data:
        hypothesis.reviewed_at = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(hypothesis, field, value)
    
    db.commit()
    db.refresh(hypothesis)
    
    return HypothesisResponse.model_validate(hypothesis)


@router.delete("/hypotheses/{hypothesis_id}")
def delete_hypothesis(
    hypothesis_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    hypothesis = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not hypothesis:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    
    db.delete(hypothesis)
    db.commit()
    
    return {"message": "Hypothesis deleted successfully"}


# Behavioral baselines
@router.post("/baselines", response_model=BehavioralBaselineResponse, status_code=status.HTTP_201_CREATED)
def create_baseline(
    baseline_data: BehavioralBaselineCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    baseline = BehavioralBaseline(
        entity_id=baseline_data.entity_id,
        case_id=baseline_data.case_id,
        metric_name=baseline_data.metric_name,
        metric_type=baseline_data.metric_type,
        baseline_value=baseline_data.baseline_value,
        baseline_std=baseline_data.baseline_std,
        sample_count=baseline_data.sample_count,
        time_window_days=baseline_data.time_window_days,
        metadata=baseline_data.metadata,
    )
    
    db.add(baseline)
    db.commit()
    db.refresh(baseline)
    
    return BehavioralBaselineResponse.model_validate(baseline)


@router.get("/baselines", response_model=List[BehavioralBaselineResponse])
def list_baselines(
    case_id: Optional[uuid.UUID] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(BehavioralBaseline)
    if case_id:
        query = query.filter(BehavioralBaseline.case_id == case_id)
    if entity_id:
        query = query.filter(BehavioralBaseline.entity_id == entity_id)
    
    return [BehavioralBaselineResponse.model_validate(b) for b in query.all()]


# Anomaly detections
@router.get("/anomalies", response_model=AnomalyDetectionListResponse)
def list_anomalies(
    case_id: Optional[uuid.UUID] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    severity: Optional[List[str]] = Query(None),
    metric_name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyDetection)
    
    if case_id:
        query = query.filter(AnomalyDetection.case_id == case_id)
    if entity_id:
        query = query.filter(AnomalyDetection.entity_id == entity_id)
    if severity:
        query = query.filter(AnomalyDetection.severity.in_(severity))
    if metric_name:
        query = query.filter(AnomalyDetection.metric_name == metric_name)
    
    total = query.count()
    
    anomalies = query.order_by(desc(AnomalyDetection.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return AnomalyDetectionListResponse(
        items=[AnomalyDetectionResponse.model_validate(a) for a in anomalies],
        total=total,
        page=page,
        page_size=page_size,
    )