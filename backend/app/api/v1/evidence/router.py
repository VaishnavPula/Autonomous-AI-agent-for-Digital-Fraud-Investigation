from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import uuid
import hashlib
import json

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, Evidence, EvidenceAccess, User, Entity, Transaction
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    EvidenceCreate, EvidenceUpdate, EvidenceResponse, EvidenceDetail,
    EvidenceListResponse, EvidenceFilterParams,
    EvidenceUploadRequest, EvidenceIntegrityCheck, EvidenceIntegrityResponse,
    ChainOfCustodyEntry, ChainOfCustodyResponse
)

router = APIRouter(prefix="/evidence", tags=["evidence"])


def apply_evidence_filters(query, filters: EvidenceFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                Evidence.evidence_id.ilike(search_term),
                Evidence.original_filename.ilike(search_term),
                Evidence.source.ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(Evidence.case_id == case_id)
    
    if filters.evidence_type:
        query = query.filter(Evidence.evidence_type.in_(filters.evidence_type))
    
    if filters.source:
        query = query.filter(Evidence.source.in_(filters.source))
    
    if filters.integrity_status:
        query = query.filter(Evidence.integrity_status.in_(filters.integrity_status))
    
    if filters.classification:
        query = query.filter(Evidence.classification.in_(filters.classification))
    
    if filters.date_from:
        query = query.filter(Evidence.imported_at >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Evidence.imported_at <= filters.date_to)
    
    return query


def calculate_hash(content: str, algorithm: str = "SHA-256") -> str:
    if algorithm == "SHA-256":
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    elif algorithm == "SHA-512":
        return hashlib.sha512(content.encode('utf-8')).hexdigest()
    elif algorithm == "MD5":
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    else:
        return hashlib.sha256(content.encode('utf-8')).hexdigest()


@router.get("", response_model=EvidenceListResponse)
def list_evidence(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    evidence_type: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    integrity_status: Optional[List[str]] = Query(None),
    classification: Optional[List[str]] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = EvidenceFilterParams(
        search=search,
        evidence_type=evidence_type,
        source=source,
        integrity_status=integrity_status,
        classification=classification,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(Evidence)
    query = apply_evidence_filters(query, filters, case_id)
    
    total = query.count()
    
    evidence_items = query.order_by(desc(Evidence.imported_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(item) for item in evidence_items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_evidence(
    evidence_data: EvidenceCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == evidence_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    content = evidence_data.content or ""
    evidence_hash = calculate_hash(content)
    
    evidence = Evidence(
        case_id=evidence_data.case_id,
        source=evidence_data.source,
        evidence_type=evidence_data.evidence_type,
        original_filename=evidence_data.original_filename,
        content=content,
        timestamp=evidence_data.timestamp,
        entity_references=evidence_data.entity_references,
        hash=evidence_hash,
        hash_algorithm="SHA-256",
        integrity_status="VERIFIED",
        classification=evidence_data.classification,
        file_size=evidence_data.file_size,
        mime_type=evidence_data.mime_type,
        collector_id=current_user.id,
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    access_log = EvidenceAccess(
        evidence_id=evidence.id,
        user_id=current_user.id,
        action="CREATE",
        details={"source": evidence_data.source, "type": evidence_data.evidence_type},
    )
    db.add(access_log)
    db.commit()
    
    return EvidenceResponse.model_validate(evidence)


@router.post("/upload", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    file: UploadFile = File(...),
    case_id: uuid.UUID = Form(...),
    source: str = Form(...),
    evidence_type: str = Form(...),
    timestamp: Optional[str] = Form(None),
    entity_references: str = Form("{}"),
    classification: str = Form("INTERNAL"),
    metadata: Optional[str] = Form(None),
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    content = await file.read()
    file_size = len(content)
    
    try:
        text_content = content.decode('utf-8')
    except UnicodeDecodeError:
        text_content = f"[Binary file: {file.filename}, size: {file_size} bytes]"
    
    evidence_hash = calculate_hash(text_content)
    
    timestamp_dt = None
    if timestamp:
        try:
            timestamp_dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    entity_refs = {}
    try:
        entity_refs = json.loads(entity_references)
    except json.JSONDecodeError:
        pass
    
    meta = {}
    if metadata:
        try:
            meta = json.loads(metadata)
        except json.JSONDecodeError:
            pass
    
    evidence = Evidence(
        case_id=case_id,
        source=source,
        evidence_type=evidence_type,
        original_filename=file.filename,
        content=text_content,
        timestamp=timestamp_dt,
        entity_references=entity_refs,
        hash=evidence_hash,
        hash_algorithm="SHA-256",
        integrity_status="VERIFIED",
        classification=classification,
        file_size=file_size,
        mime_type=file.content_type,
        collector_id=current_user.id,
        metadata=meta,
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    access_log = EvidenceAccess(
        evidence_id=evidence.id,
        user_id=current_user.id,
        action="UPLOAD",
        details={
            "filename": file.filename,
            "size": file_size,
            "mime_type": file.content_type,
            "source": source,
            "type": evidence_type,
        },
    )
    db.add(access_log)
    db.commit()
    
    return EvidenceResponse.model_validate(evidence)


@router.get("/{evidence_id}", response_model=EvidenceDetail)
def get_evidence(
    evidence_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    access_logs = db.query(EvidenceAccess).filter(
        EvidenceAccess.evidence_id == evidence_id
    ).order_by(EvidenceAccess.timestamp.desc()).all()
    
    evidence_detail = EvidenceDetail.model_validate(evidence)
    evidence_detail.access_history = [
        {
            "id": str(log.id),
            "action": log.action,
            "user_id": str(log.user_id),
            "timestamp": log.timestamp.isoformat(),
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "details": log.details,
        }
        for log in access_logs
    ]
    
    return evidence_detail


@router.patch("/{evidence_id}", response_model=EvidenceResponse)
def update_evidence(
    evidence_id: uuid.UUID,
    evidence_update: EvidenceUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    case = db.query(Case).filter(Case.id == evidence.case_id).first()
    if case.investigator_id != current_user.id and current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this evidence"
        )
    
    update_data = evidence_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evidence, field, value)
    
    db.commit()
    db.refresh(evidence)
    
    access_log = EvidenceAccess(
        evidence_id=evidence.id,
        user_id=current_user.id,
        action="UPDATE",
        details={"updated_fields": list(update_data.keys())},
    )
    db.add(access_log)
    db.commit()
    
    return EvidenceResponse.model_validate(evidence)


@router.post("/{evidence_id}/verify", response_model=EvidenceIntegrityResponse)
def verify_integrity(
    evidence_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    content = evidence.content or ""
    current_hash = calculate_hash(content, evidence.hash_algorithm)
    is_valid = current_hash == evidence.hash
    
    evidence.integrity_status = "VERIFIED" if is_valid else "CORRUPTED"
    db.commit()
    
    access_log = EvidenceAccess(
        evidence_id=evidence.id,
        user_id=current_user.id,
        action="VERIFY_INTEGRITY",
        details={"is_valid": is_valid, "current_hash": current_hash, "expected_hash": evidence.hash},
    )
    db.add(access_log)
    db.commit()
    
    return EvidenceIntegrityResponse(
        evidence_id=evidence.evidence_id,
        is_valid=is_valid,
        current_hash=current_hash,
        expected_hash=evidence.hash,
        hash_algorithm=evidence.hash_algorithm,
        checked_at=datetime.utcnow(),
    )


@router.get("/{evidence_id}/chain-of-custody", response_model=ChainOfCustodyResponse)
def get_chain_of_custody(
    evidence_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    access_logs = db.query(EvidenceAccess).filter(
        EvidenceAccess.evidence_id == evidence_id
    ).order_by(EvidenceAccess.timestamp.asc()).all()
    
    entries = []
    for log in access_logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        entries.append(ChainOfCustodyEntry(
            id=log.id,
            action=log.action,
            user_id=log.user_id,
            user_name=user.email if user else None,
            timestamp=log.timestamp,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            details=log.details,
        ))
    
    return ChainOfCustodyResponse(
        evidence_id=evidence.evidence_id,
        entries=entries,
        total=len(entries),
    )


@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    access_log = EvidenceAccess(
        evidence_id=evidence.id,
        user_id=current_user.id,
        action="DELETE",
        details={"evidence_id": evidence.evidence_id, "filename": evidence.original_filename},
    )
    db.add(access_log)
    
    db.delete(evidence)
    db.commit()
    
    return {"message": "Evidence deleted successfully"}


@router.get("/case/{case_id}/stats")
def get_evidence_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    total = db.query(Evidence).filter(Evidence.case_id == case_id).count()
    by_type = db.query(Evidence.evidence_type, func.count(Evidence.id)).filter(
        Evidence.case_id == case_id
    ).group_by(Evidence.evidence_type).all()
    
    by_source = db.query(Evidence.source, func.count(Evidence.id)).filter(
        Evidence.case_id == case_id
    ).group_by(Evidence.source).all()
    
    integrity = db.query(Evidence.integrity_status, func.count(Evidence.id)).filter(
        Evidence.case_id == case_id
    ).group_by(Evidence.integrity_status).all()
    
    total_size = db.query(func.sum(Evidence.file_size)).filter(
        Evidence.case_id == case_id
    ).scalar() or 0
    
    return {
        "total": total,
        "by_type": dict(by_type),
        "by_source": dict(by_source),
        "integrity": dict(integrity),
        "total_size_bytes": total_size,
    }