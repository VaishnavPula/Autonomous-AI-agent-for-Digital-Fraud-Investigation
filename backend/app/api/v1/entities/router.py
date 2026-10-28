from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import uuid
import json

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, Entity, EntityRelationship, Evidence
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    EntityCreate, EntityUpdate, EntityResponse, EntityDetail,
    EntityListResponse, EntityFilterParams,
    EntityRelationshipCreate, EntityRelationshipUpdate, EntityRelationshipResponse, EntityRelationshipListResponse,
    EntityResolutionRequest, EntityGraphResponse
)

router = APIRouter(prefix="/entities", tags=["entities"])


def apply_entity_filters(query, filters: EntityFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                Entity.entity_id.ilike(search_term),
                Entity.name.ilike(search_term),
                Entity.value.ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(Entity.case_id == case_id)
    
    if filters.entity_type:
        query = query.filter(Entity.entity_type.in_(filters.entity_type))
    
    if filters.risk_level:
        query = query.filter(Entity.risk_level.in_(filters.risk_level))
    
    if filters.is_resolved is not None:
        query = query.filter(Entity.is_resolved == filters.is_resolved)
    
    if filters.date_from:
        query = query.filter(Entity.created_at >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Entity.created_at <= filters.date_to)
    
    return query


@router.get("", response_model=EntityListResponse)
def list_entities(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    entity_type: Optional[List[str]] = Query(None),
    risk_level: Optional[List[str]] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = EntityFilterParams(
        search=search,
        entity_type=entity_type,
        risk_level=risk_level,
        is_resolved=is_resolved,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(Entity)
    query = apply_entity_filters(query, filters, case_id)
    
    total = query.count()
    
    entities = query.order_by(desc(Entity.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return EntityListResponse(
        items=[EntityResponse.model_validate(entity) for entity in entities],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
def create_entity(
    entity_data: EntityCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == entity_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    entity = Entity(
        case_id=entity_data.case_id,
        entity_type=entity_data.entity_type,
        name=entity_data.name,
        value=entity_data.value,
        attributes=entity_data.attributes,
        first_seen=entity_data.first_seen,
        last_seen=entity_data.last_seen,
    )
    
    db.add(entity)
    db.commit()
    db.refresh(entity)
    
    return EntityResponse.model_validate(entity)


@router.get("/{entity_id}", response_model=EntityDetail)
def get_entity(
    entity_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Get relationship counts
    source_rels = db.query(EntityRelationship).filter(
        EntityRelationship.source_entity_id == entity_id
    ).all()
    target_rels = db.query(EntityRelationship).filter(
        EntityRelationship.target_entity_id == entity_id
    ).all()
    
    evidence_count = db.query(Evidence).filter(
        Evidence.entity_references.op('?')('entity_id')
    ).filter(Evidence.case_id == entity.case_id).count()
    
    entity_detail = EntityDetail.model_validate(entity)
    entity_detail.evidence_count = evidence_count
    entity_detail.source_relationships = [
        {
            "id": str(rel.id),
            "relationship_type": rel.relationship_type,
            "target_entity_id": str(rel.target_entity_id),
            "target_entity_value": rel.target_entity.entity_id if rel.target_entity else None,
            "confidence": rel.confidence,
            "strength": rel.strength,
        }
        for rel in source_rels
    ]
    entity_detail.target_relationships = [
        {
            "id": str(rel.id),
            "relationship_type": rel.relationship_type,
            "source_entity_id": str(rel.source_entity_id),
            "source_entity_value": rel.source_entity.entity_id if rel.source_entity else None,
            "confidence": rel.confidence,
            "strength": rel.strength,
        }
        for rel in target_rels
    ]
    
    return entity_detail


@router.patch("/{entity_id}", response_model=EntityResponse)
def update_entity(
    entity_id: uuid.UUID,
    entity_update: EntityUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    case = db.query(Case).filter(Case.id == entity.case_id).first()
    if case.investigator_id != current_user.id and current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this entity"
        )
    
    update_data = entity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entity, field, value)
    
    entity.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entity)
    
    return EntityResponse.model_validate(entity)


@router.post("/relationships", response_model=EntityRelationshipResponse, status_code=status.HTTP_201_CREATED)
def create_relationship(
    rel_data: EntityRelationshipCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == rel_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    source = db.query(Entity).filter(Entity.id == rel_data.source_entity_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source entity not found")
    
    target = db.query(Entity).filter(Entity.id == rel_data.target_entity_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target entity not found")
    
    # Check if relationship already exists
    existing = db.query(EntityRelationship).filter(
        EntityRelationship.source_entity_id == rel_data.source_entity_id,
        EntityRelationship.target_entity_id == rel_data.target_entity_id,
        EntityRelationship.relationship_type == rel_data.relationship_type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship already exists"
        )
    
    relationship = EntityRelationship(
        case_id=rel_data.case_id,
        source_entity_id=rel_data.source_entity_id,
        target_entity_id=rel_data.target_entity_id,
        relationship_type=rel_data.relationship_type,
        timestamp=rel_data.timestamp,
        confidence=rel_data.confidence,
        evidence_ids=rel_data.evidence_ids,
        metadata=rel_data.metadata,
        strength=rel_data.strength,
        is_directional=rel_data.is_directional,
    )
    
    db.add(relationship)
    db.commit()
    db.refresh(relationship)
    
    return EntityRelationshipResponse.model_validate(relationship)


@router.get("/relationships", response_model=EntityRelationshipListResponse)
def list_relationships(
    case_id: Optional[uuid.UUID] = Query(None),
    source_entity_id: Optional[uuid.UUID] = Query(None),
    target_entity_id: Optional[uuid.UUID] = Query(None),
    relationship_type: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(EntityRelationship)
    
    if case_id:
        query = query.filter(EntityRelationship.case_id == case_id)
    if source_entity_id:
        query = query.filter(EntityRelationship.source_entity_id == source_entity_id)
    if target_entity_id:
        query = query.filter(EntityRelationship.target_entity_id == target_entity_id)
    if relationship_type:
        query = query.filter(EntityRelationship.relationship_type.in_(relationship_type))
    
    total = query.count()
    
    relationships = query.order_by(desc(EntityRelationship.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return EntityRelationshipListResponse(
        items=[EntityRelationshipResponse.model_validate(rel) for rel in relationships],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/relationships/{relationship_id}", response_model=EntityRelationshipResponse)
def update_relationship(
    relationship_id: uuid.UUID,
    rel_update: EntityRelationshipUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    relationship = db.query(EntityRelationship).filter(EntityRelationship.id == relationship_id).first()
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    update_data = rel_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(relationship, field, value)
    
    relationship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(relationship)
    
    return EntityRelationshipResponse.model_validate(relationship)


@router.delete("/relationships/{relationship_id}")
def delete_relationship(
    relationship_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    relationship = db.query(EntityRelationship).filter(EntityRelationship.id == relationship_id).first()
    if not relationship:
        raise HTTPException(status_code=404, detail="Relationship not found")
    
    db.delete(relationship)
    db.commit()
    
    return {"message": "Relationship deleted successfully"}


@router.post("/resolve", response_model=EntityResponse)
def resolve_entities(
    resolution: EntityResolutionRequest,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    if len(resolution.entity_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 entities required for resolution"
        )
    
    entities = db.query(Entity).filter(Entity.id.in_(resolution.entity_ids)).all()
    if len(entities) != len(resolution.entity_ids):
        raise HTTPException(status_code=404, detail="One or more entities not found")
    
    # Create new resolved entity
    new_entity = Entity(
        case_id=entities[0].case_id,
        entity_type=resolution.new_entity_type,
        name=resolution.new_name,
        value=resolution.new_value,
        attributes={
            "resolved_from": [str(e.id) for e in entities],
            "merged_count": len(entities),
        },
        risk_score=max(e.risk_score for e in entities),
        risk_level=max(entities, key=lambda e: ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "CRITICAL"].index(e.risk_level)).risk_level,
        is_resolved=True,
        resolved_from=[e.id for e in entities],
    )
    
    db.add(new_entity)
    
    # Mark old entities as resolved
    for entity in entities:
        entity.is_resolved = True
        entity.resolved_from = [e.id for e in entities if e.id != entity.id]
    
    # Update relationships to point to new entity
    for entity in entities:
        # Source relationships
        source_rels = db.query(EntityRelationship).filter(
            EntityRelationship.source_entity_id == entity.id
        ).all()
        for rel in source_rels:
            rel.source_entity_id = new_entity.id
        
        # Target relationships
        target_rels = db.query(EntityRelationship).filter(
            EntityRelationship.target_entity_id == entity.id
        ).all()
        for rel in target_rels:
            rel.target_entity_id = new_entity.id
    
    db.commit()
    db.refresh(new_entity)
    
    return EntityResponse.model_validate(new_entity)


@router.get("/case/{case_id}/graph", response_model=EntityGraphResponse)
def get_entity_graph(
    case_id: uuid.UUID,
    entity_types: Optional[List[str]] = Query(None),
    relationship_types: Optional[List[str]] = Query(None),
    min_confidence: float = Query(0.5, ge=0.0, le=1.0),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    entity_query = db.query(Entity).filter(Entity.case_id == case_id)
    if entity_types:
        entity_query = entity_query.filter(Entity.entity_type.in_(entity_types))
    
    entities = entity_query.all()
    
    rel_query = db.query(EntityRelationship).filter(EntityRelationship.case_id == case_id)
    if relationship_types:
        rel_query = rel_query.filter(EntityRelationship.relationship_type.in_(relationship_types))
    if min_confidence > 0:
        rel_query = rel_query.filter(EntityRelationship.confidence >= min_confidence)
    
    relationships = rel_query.all()
    
    # Build nodes
    nodes = []
    for entity in entities:
        risk_color = {
            "CRITICAL": "#ef4444",
            "HIGH": "#f97316",
            "MEDIUM": "#eab308",
            "LOW": "#22c55e",
            "VERY_LOW": "#10b981",
        }.get(entity.risk_level, "#64748b")
        
        nodes.append({
            "id": str(entity.id),
            "label": entity.entity_id,
            "type": entity.entity_type,
            "name": entity.name,
            "value": entity.value,
            "riskScore": entity.risk_score,
            "riskLevel": entity.risk_level,
            "riskColor": risk_color,
            "isResolved": entity.is_resolved,
            "confidence": entity.confidence,
        })
    
    # Build edges
    edges = []
    for rel in relationships:
        edges.append({
            "id": str(rel.id),
            "source": str(rel.source_entity_id),
            "target": str(rel.target_entity_id),
            "type": rel.relationship_type,
            "confidence": rel.confidence,
            "strength": rel.strength,
            "isDirectional": rel.is_directional,
            "evidenceIds": rel.evidence_ids,
        })
    
    return EntityGraphResponse(nodes=nodes, edges=edges)


@router.get("/case/{case_id}/stats")
def get_entity_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    total = db.query(Entity).filter(Entity.case_id == case_id).count()
    resolved = db.query(Entity).filter(Entity.case_id == case_id, Entity.is_resolved == True).count()
    
    by_type = db.query(Entity.entity_type, func.count(Entity.id)).filter(
        Entity.case_id == case_id
    ).group_by(Entity.entity_type).all()
    
    by_risk = db.query(Entity.risk_level, func.count(Entity.id)).filter(
        Entity.case_id == case_id
    ).group_by(Entity.risk_level).all()
    
    relationships = db.query(EntityRelationship).filter(
        EntityRelationship.case_id == case_id
    ).count()
    
    return {
        "total": total,
        "resolved": resolved,
        "unresolved": total - resolved,
        "by_type": dict(by_type),
        "by_risk": dict(by_risk),
        "relationships": relationships,
    }


@router.delete("/{entity_id}")
def delete_entity(
    entity_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    entity = db.query(Entity).filter(Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Delete relationships first
    db.query(EntityRelationship).filter(
        or_(
            EntityRelationship.source_entity_id == entity_id,
            EntityRelationship.target_entity_id == entity_id
        )
    ).delete(synchronize_session=False)
    
    db.delete(entity)
    db.commit()
    
    return {"message": "Entity deleted successfully"}