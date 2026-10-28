from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import uuid
import json

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, TimelineEvent, TemporalCorrelation, ImpossibleTravel, Entity, Evidence
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    TimelineEventCreate, TimelineEventUpdate, TimelineEventResponse, TimelineEventDetail,
    TimelineListResponse, TimelineFilterParams,
    TemporalCorrelationResponse, TemporalCorrelationListResponse,
    ImpossibleTravelResponse, ImpossibleTravelListResponse,
    TimelineStats, TimelineExportRequest
)

router = APIRouter(prefix="/timeline", tags=["timeline"])


def apply_timeline_filters(query, filters: TimelineFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                TimelineEvent.event_id.ilike(search_term),
                TimelineEvent.description.ilike(search_term),
                TimelineEvent.details.cast(str).ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(TimelineEvent.case_id == case_id)
    
    if filters.event_type:
        query = query.filter(TimelineEvent.event_type.in_(filters.event_type))
    
    if filters.is_suspicious is not None:
        query = query.filter(TimelineEvent.is_suspicious == filters.is_suspicious)
    
    if filters.min_risk_score is not None:
        query = query.filter(TimelineEvent.risk_score >= filters.min_risk_score)
    
    if filters.max_risk_score is not None:
        query = query.filter(TimelineEvent.risk_score <= filters.max_risk_score)
    
    if filters.date_from:
        query = query.filter(TimelineEvent.timestamp >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(TimelineEvent.timestamp <= filters.date_to)
    
    if filters.source:
        query = query.filter(TimelineEvent.source.in_(filters.source))
    
    return query


def get_risk_level(risk_score: float) -> str:
    if risk_score >= 0.8:
        return "CRITICAL"
    elif risk_score >= 0.6:
        return "HIGH"
    elif risk_score >= 0.3:
        return "MEDIUM"
    elif risk_score >= 0.1:
        return "LOW"
    else:
        return "VERY_LOW"


@router.get("", response_model=TimelineListResponse)
def list_timeline_events(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    event_type: Optional[List[str]] = Query(None),
    is_suspicious: Optional[bool] = Query(None),
    min_risk_score: Optional[float] = Query(None),
    max_risk_score: Optional[float] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    source: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = TimelineFilterParams(
        search=search,
        event_type=event_type,
        is_suspicious=is_suspicious,
        min_risk_score=min_risk_score,
        max_risk_score=max_risk_score,
        date_from=date_from,
        date_to=date_to,
        source=source,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(TimelineEvent)
    query = apply_timeline_filters(query, filters, case_id)
    
    total = query.count()
    
    events = query.order_by(desc(TimelineEvent.timestamp)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return TimelineListResponse(
        items=[TimelineEventResponse.model_validate(event) for event in events],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=TimelineEventResponse, status_code=status.HTTP_201_CREATED)
def create_timeline_event(
    event_data: TimelineEventCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == event_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    event = TimelineEvent(
        case_id=event_data.case_id,
        event_type=event_data.event_type,
        timestamp=event_data.timestamp,
        entity_ids=event_data.entity_ids,
        description=event_data.description,
        details=event_data.details,
        evidence_ids=event_data.evidence_ids,
        source=event_data.source,
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return TimelineEventResponse.model_validate(event)


@router.get("/{event_id}", response_model=TimelineEventDetail)
def get_timeline_event(
    event_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    event = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    # Get temporal correlations
    correlations_a = db.query(TemporalCorrelation).filter(
        TemporalCorrelation.event_a_id == event_id
    ).all()
    correlations_b = db.query(TemporalCorrelation).filter(
        TemporalCorrelation.event_b_id == event_id
    ).all()
    
    # Get impossible travel incidents
    impossible_travel = db.query(ImpossibleTravel).filter(
        or_(
            ImpossibleTravel.previous_location_id.in_([str(eid) for eid in event.entity_ids]),
            ImpossibleTravel.new_location_id.in_([str(eid) for eid in event.entity_ids]),
            ImpossibleTravel.entity_id.in_([str(eid) for eid in event.entity_ids]),
        )
    ).all() if event.entity_ids else []
    
    event_detail = TimelineEventDetail.model_validate(event)
    event_detail.temporal_correlations = [
        {
            "id": str(c.id),
            "relation_type": c.relation_type,
            "time_delta_seconds": c.time_delta_seconds,
            "confidence": c.confidence,
            "other_event_id": str(c.event_b_id) if c.event_a_id == event_id else str(c.event_a_id),
            "other_event_type": None,  # Would need to fetch
        }
        for c in correlations_a + correlations_b
    ]
    event_detail.impossible_travel = [
        {
            "id": str(t.id),
            "entity_id": str(t.entity_id),
            "distance_km": t.distance_km,
            "actual_time_hours": t.actual_time_hours,
            "is_impossible": t.is_impossible,
        }
        for t in impossible_travel
    ]
    
    return event_detail


@router.patch("/{event_id}", response_model=TimelineEventResponse)
def update_timeline_event(
    event_id: uuid.UUID,
    event_update: TimelineEventUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    event = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    case = db.query(Case).filter(Case.id == event.case_id).first()
    if case.investigator_id != current_user.id and current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this event"
        )
    
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
    
    db.commit()
    db.refresh(event)
    
    return TimelineEventResponse.model_validate(event)


@router.delete("/{event_id}")
def delete_timeline_event(
    event_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    event = db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Timeline event deleted successfully"}


@router.get("/correlations", response_model=TemporalCorrelationListResponse)
def list_temporal_correlations(
    case_id: Optional[uuid.UUID] = Query(None),
    relation_type: Optional[List[str]] = Query(None),
    min_confidence: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(TemporalCorrelation)
    
    if case_id:
        query = query.filter(TemporalCorrelation.case_id == case_id)
    if relation_type:
        query = query.filter(TemporalCorrelation.relation_type.in_(relation_type))
    if min_confidence is not None:
        query = query.filter(TemporalCorrelation.confidence >= min_confidence)
    
    total = query.count()
    
    correlations = query.order_by(desc(TemporalCorrelation.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return TemporalCorrelationListResponse(
        items=[TemporalCorrelationResponse.model_validate(c) for c in correlations],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/impossible-travel", response_model=ImpossibleTravelListResponse)
def list_impossible_travel(
    case_id: Optional[uuid.UUID] = Query(None),
    entity_id: Optional[uuid.UUID] = Query(None),
    is_impossible: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(ImpossibleTravel)
    
    if case_id:
        query = query.filter(ImpossibleTravel.case_id == case_id)
    if entity_id:
        query = query.filter(ImpossibleTravel.entity_id == entity_id)
    if is_impossible is not None:
        query = query.filter(ImpossibleTravel.is_impossible == is_impossible)
    
    total = query.count()
    
    travel = query.order_by(desc(ImpossibleTravel.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return ImpossibleTravelListResponse(
        items=[ImpossibleTravelResponse.model_validate(t) for t in travel],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/case/{case_id}/stats", response_model=TimelineStats)
def get_timeline_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    total_events = db.query(TimelineEvent).filter(TimelineEvent.case_id == case_id).count()
    suspicious_events = db.query(TimelineEvent).filter(
        TimelineEvent.case_id == case_id,
        TimelineEvent.is_suspicious == True
    ).count()
    
    by_type = dict(db.query(TimelineEvent.event_type, func.count(TimelineEvent.id)).filter(
        TimelineEvent.case_id == case_id
    ).group_by(TimelineEvent.event_type).all())
    
    by_source = dict(db.query(TimelineEvent.source, func.count(TimelineEvent.id)).filter(
        TimelineEvent.case_id == case_id,
        TimelineEvent.source.isnot(None)
    ).group_by(TimelineEvent.source).all())
    
    by_risk = {}
    events = db.query(TimelineEvent.risk_score).filter(TimelineEvent.case_id == case_id).all()
    for (score,) in events:
        level = get_risk_level(score)
        by_risk[level] = by_risk.get(level, 0) + 1
    
    date_range = db.query(
        func.min(TimelineEvent.timestamp).label('min_date'),
        func.max(TimelineEvent.timestamp).label('max_date'),
    ).filter(TimelineEvent.case_id == case_id).first()
    
    # Top suspicious entities
    suspicious_events = db.query(TimelineEvent).filter(
        TimelineEvent.case_id == case_id,
        TimelineEvent.is_suspicious == True
    ).all()
    
    entity_suspicion = {}
    for event in suspicious_events:
        for eid in event.entity_ids:
            entity_suspicion[str(eid)] = entity_suspicion.get(str(eid), 0) + 1
    
    top_suspicious = sorted(entity_suspicion.items(), key=lambda x: x[1], reverse=True)[:10]
    
    correlations = db.query(TemporalCorrelation).filter(TemporalCorrelation.case_id == case_id).count()
    impossible = db.query(ImpossibleTravel).filter(ImpossibleTravel.case_id == case_id, ImpossibleTravel.is_impossible == True).count()
    
    return TimelineStats(
        total_events=total_events,
        suspicious_events=suspicious_events,
        by_type=by_type,
        by_source=by_source,
        by_risk_level=by_risk,
        date_range={
            "from": date_range.min_date.isoformat() if date_range and date_range.min_date else None,
            "to": date_range.max_date.isoformat() if date_range and date_range.max_date else None,
        },
        top_suspicious_entities=[{"entity_id": k, "suspicious_count": v} for k, v in top_suspicious],
        temporal_correlations=correlations,
        impossible_travel_incidents=impossible,
    )


@router.post("/case/{case_id}/analyze")
def analyze_timeline(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    events = db.query(TimelineEvent).filter(
        TimelineEvent.case_id == case_id
    ).order_by(TimelineEvent.timestamp).all()
    
    # Find temporal correlations
    correlations = []
    for i, event_a in enumerate(events):
        for event_b in events[i+1:]:
            time_delta = (event_b.timestamp - event_a.timestamp).total_seconds()
            
            if time_delta <= 300:  # 5 minutes
                relation = "WITHIN_5_MINUTES"
            elif time_delta <= 3600:  # 1 hour
                relation = "WITHIN_1_HOUR"
            elif time_delta <= 86400:  # 1 day
                relation = "SAME_DAY"
            else:
                continue
            
            # Check for shared entities
            shared_entities = set(event_a.entity_ids) & set(event_b.entity_ids)
            confidence = 0.5 + (len(shared_entities) * 0.2)
            
            correlation = TemporalCorrelation(
                case_id=case_id,
                event_a_id=event_a.id,
                event_b_id=event_b.id,
                relation_type=relation,
                time_delta_seconds=time_delta,
                confidence=min(confidence, 1.0),
                evidence_ids=list(set(event_a.evidence_ids + event_b.evidence_ids)),
            )
            db.add(correlation)
            correlations.append(correlation)
    
    # Detect impossible travel
    impossible_travel = []
    entity_events = {}
    for event in events:
        for eid in event.entity_ids:
            if eid not in entity_events:
                entity_events[eid] = []
            entity_events[eid].append(event)
    
    for entity_id, ent_events in entity_events.items():
        if len(ent_events) < 2:
            continue
        
        for i in range(len(ent_events) - 1):
            for j in range(i + 1, len(ent_events)):
                e1 = ent_events[i]
                e2 = ent_events[j]
                
                # Check for location changes
                loc1 = None
                loc2 = None
                for detail_key, detail_val in e1.details.items():
                    if 'location' in detail_key.lower() and detail_val:
                        loc1 = detail_val
                for detail_key, detail_val in e2.details.items():
                    if 'location' in detail_key.lower() and detail_val:
                        loc2 = detail_val
                
                if loc1 and loc2 and loc1 != loc2:
                    time_delta = (e2.timestamp - e1.timestamp).total_seconds() / 3600
                    distance = 100  # placeholder
                    min_travel = distance / 800  # flight speed
                    
                    if time_delta < min_travel:
                        travel = ImpossibleTravel(
                            case_id=case_id,
                            entity_id=entity_id,
                            previous_timestamp=e1.timestamp,
                            new_timestamp=e2.timestamp,
                            distance_km=distance,
                            min_travel_time_hours=min_travel,
                            actual_time_hours=time_delta,
                            is_impossible=True,
                            possible_explanations=["VPN", "Proxy", "Compromised credentials", "Physical travel"],
                            evidence_ids=list(set(e1.evidence_ids + e2.evidence_ids)),
                        )
                        db.add(travel)
                        impossible_travel.append(travel)
    
    db.commit()
    
    return {
        "message": "Timeline analysis completed",
        "temporal_correlations_found": len(correlations),
        "impossible_travel_incidents": len(impossible_travel),
    }


@router.post("/export")
def export_timeline(
    export_request: TimelineExportRequest,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == export_request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    query = db.query(TimelineEvent).filter(TimelineEvent.case_id == export_request.case_id)
    
    if export_request.date_from:
        query = query.filter(TimelineEvent.timestamp >= export_request.date_from)
    if export_request.date_to:
        query = query.filter(TimelineEvent.timestamp <= export_request.date_to)
    if export_request.event_types:
        query = query.filter(TimelineEvent.event_type.in_(export_request.event_types))
    
    events = query.order_by(TimelineEvent.timestamp).all()
    
    if export_request.format == "csv":
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Event ID", "Type", "Timestamp", "Description", "Risk Score", "Suspicious", "Entities", "Evidence", "Source"])
        for event in events:
            writer.writerow([
                event.event_id,
                event.event_type,
                event.timestamp.isoformat(),
                event.description,
                event.risk_score,
                event.is_suspicious,
                json.dumps(event.entity_ids),
                json.dumps(event.evidence_ids),
                event.source or "",
            ])
        return {"format": "csv", "data": output.getvalue(), "count": len(events)}
    else:
        return {
            "format": "json",
            "data": [TimelineEventResponse.model_validate(e).model_dump() for e in events],
            "count": len(events),
        }