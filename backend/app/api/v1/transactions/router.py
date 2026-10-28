from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func, case
import uuid
import json
import csv
import io

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, Transaction, Entity, MoneyFlowEdge
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator, require_lead_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse, TransactionDetail,
    TransactionListResponse, TransactionFilterParams,
    MoneyFlowEdgeResponse, MoneyFlowPathResponse, MoneyFlowStats,
    TransactionImportRequest, TransactionStats
)

router = APIRouter(prefix="/transactions", tags=["transactions"])


def apply_transaction_filters(query, filters: TransactionFilterParams, case_id: Optional[uuid.UUID] = None):
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                Transaction.transaction_id.ilike(search_term),
            )
        )
    
    if case_id:
        query = query.filter(Transaction.case_id == case_id)
    
    if filters.status:
        query = query.filter(Transaction.status.in_(filters.status))
    
    if filters.currency:
        query = query.filter(Transaction.currency.in_(filters.currency))
    
    if filters.min_amount is not None:
        query = query.filter(Transaction.amount >= filters.min_amount)
    
    if filters.max_amount is not None:
        query = query.filter(Transaction.amount <= filters.max_amount)
    
    if filters.min_risk_score is not None:
        query = query.filter(Transaction.risk_score >= filters.min_risk_score)
    
    if filters.max_risk_score is not None:
        query = query.filter(Transaction.risk_score <= filters.max_risk_score)
    
    if filters.date_from:
        query = query.filter(Transaction.timestamp >= filters.date_from)
    
    if filters.date_to:
        query = query.filter(Transaction.timestamp <= filters.date_to)
    
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


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    case_id: Optional[uuid.UUID] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[List[str]] = Query(None),
    currency: Optional[List[str]] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    min_risk_score: Optional[float] = Query(None),
    max_risk_score: Optional[float] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    filters = TransactionFilterParams(
        search=search,
        status=status,
        currency=currency,
        min_amount=min_amount,
        max_amount=max_amount,
        min_risk_score=min_risk_score,
        max_risk_score=max_risk_score,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    
    query = db.query(Transaction)
    query = apply_transaction_filters(query, filters, case_id)
    
    total = query.count()
    
    transactions = query.order_by(desc(Transaction.timestamp)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return TransactionListResponse(
        items=[TransactionResponse.model_validate(tx) for tx in transactions],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_data: TransactionCreate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == tx_data.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    existing = db.query(Transaction).filter(Transaction.transaction_id == tx_data.transaction_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction with ID {tx_data.transaction_id} already exists"
        )
    
    transaction = Transaction(
        case_id=tx_data.case_id,
        transaction_id=tx_data.transaction_id,
        amount=tx_data.amount,
        currency=tx_data.currency,
        timestamp=tx_data.timestamp,
        sender_entity_id=tx_data.sender_entity_id,
        receiver_entity_id=tx_data.receiver_entity_id,
        merchant_entity_id=tx_data.merchant_entity_id,
        payment_method=tx_data.payment_method,
        device_entity_id=tx_data.device_entity_id,
        ip_entity_id=tx_data.ip_entity_id,
        location_entity_id=tx_data.location_entity_id,
        status=tx_data.status,
        risk_factors=tx_data.risk_factors,
        metadata=tx_data.metadata,
        evidence_ids=tx_data.evidence_ids,
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)


@router.post("/import", response_model=TransactionListResponse, status_code=status.HTTP_201_CREATED)
async def import_transactions(
    file: UploadFile = File(...),
    case_id: uuid.UUID = Form(...),
    column_mapping: str = Form(...),
    default_values: str = Form("{}"),
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    mapping = json.loads(column_mapping)
    defaults = json.loads(default_values)
    
    content = await file.read()
    text_content = content.decode('utf-8')
    
    if file.filename.endswith('.csv'):
        reader = csv.DictReader(io.StringIO(text_content))
        rows = list(reader)
    elif file.filename.endswith('.json'):
        rows = json.loads(text_content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or JSON")
    
    created = []
    errors = []
    
    for i, row in enumerate(rows):
        try:
            tx_data = {}
            for field, col in mapping.items():
                if col in row:
                    tx_data[field] = row[col]
                elif field in defaults:
                    tx_data[field] = defaults[field]
            
            # Parse amount
            if 'amount' in tx_data:
                tx_data['amount'] = float(tx_data['amount'])
            
            # Parse timestamp
            if 'timestamp' in tx_data:
                try:
                    tx_data['timestamp'] = datetime.fromisoformat(tx_data['timestamp'].replace('Z', '+00:00'))
                except ValueError:
                    tx_data['timestamp'] = datetime.utcnow()
            
            tx_data['case_id'] = case_id
            
            if 'transaction_id' not in tx_data or not tx_data['transaction_id']:
                tx_data['transaction_id'] = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            
            transaction = Transaction(
                case_id=tx_data['case_id'],
                transaction_id=tx_data['transaction_id'],
                amount=tx_data.get('amount', 0),
                currency=tx_data.get('currency', 'USD'),
                timestamp=tx_data.get('timestamp', datetime.utcnow()),
                sender_entity_id=tx_data.get('sender_entity_id'),
                receiver_entity_id=tx_data.get('receiver_entity_id'),
                merchant_entity_id=tx_data.get('merchant_entity_id'),
                payment_method=tx_data.get('payment_method'),
                device_entity_id=tx_data.get('device_entity_id'),
                ip_entity_id=tx_data.get('ip_entity_id'),
                location_entity_id=tx_data.get('location_entity_id'),
                status=tx_data.get('status', 'COMPLETED'),
                risk_factors=tx_data.get('risk_factors', {}),
                metadata=tx_data.get('metadata', {}),
                evidence_ids=tx_data.get('evidence_ids', []),
            )
            
            db.add(transaction)
            created.append(transaction)
            
        except Exception as e:
            errors.append({"row": i + 1, "error": str(e)})
    
    db.commit()
    
    for tx in created:
        db.refresh(tx)
    
    return TransactionListResponse(
        items=[TransactionResponse.model_validate(tx) for tx in created],
        total=len(created),
        page=1,
        page_size=len(created),
    )


@router.get("/{transaction_id}", response_model=TransactionDetail)
def get_transaction(
    transaction_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Get related entities
    sender = db.query(Entity).filter(Entity.id == transaction.sender_entity_id).first() if transaction.sender_entity_id else None
    receiver = db.query(Entity).filter(Entity.id == transaction.receiver_entity_id).first() if transaction.receiver_entity_id else None
    merchant = db.query(Entity).filter(Entity.id == transaction.merchant_entity_id).first() if transaction.merchant_entity_id else None
    device = db.query(Entity).filter(Entity.id == transaction.device_entity_id).first() if transaction.device_entity_id else None
    ip = db.query(Entity).filter(Entity.id == transaction.ip_entity_id).first() if transaction.ip_entity_id else None
    location = db.query(Entity).filter(Entity.id == transaction.location_entity_id).first() if transaction.location_entity_id else None
    
    # Get money flow edges
    flow_edges = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.transaction_id == transaction.id).all()
    
    detail = TransactionDetail.model_validate(transaction)
    detail.sender = {"id": str(sender.id), "entity_id": sender.entity_id, "entity_type": sender.entity_type, "value": sender.value} if sender else None
    detail.receiver = {"id": str(receiver.id), "entity_id": receiver.entity_id, "entity_type": receiver.entity_type, "value": receiver.value} if receiver else None
    detail.merchant = {"id": str(merchant.id), "entity_id": merchant.entity_id, "entity_type": merchant.entity_type, "value": merchant.value} if merchant else None
    detail.device = {"id": str(device.id), "entity_id": device.entity_id, "entity_type": device.entity_type, "value": device.value} if device else None
    detail.ip = {"id": str(ip.id), "entity_id": ip.entity_id, "entity_type": ip.entity_type, "value": ip.value} if ip else None
    detail.location = {"id": str(location.id), "entity_id": location.entity_id, "entity_type": location.entity_type, "value": location.value} if location else None
    detail.money_flow_edges = [
        {
            "id": str(edge.id),
            "source_entity_id": str(edge.source_entity_id),
            "target_entity_id": str(edge.target_entity_id),
            "amount": edge.amount,
            "hop_number": edge.hop_number,
            "path_id": edge.path_id,
            "risk": edge.risk,
        }
        for edge in flow_edges
    ]
    
    return detail


@router.patch("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: uuid.UUID,
    tx_update: TransactionUpdate,
    current_user: UserSchema = Depends(require_investigator),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    case = db.query(Case).filter(Case.id == transaction.case_id).first()
    if case.investigator_id != current_user.id and current_user.role not in ["ADMIN", "LEAD_INVESTIGATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this transaction"
        )
    
    update_data = tx_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    transaction.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse.model_validate(transaction)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: UserSchema = Depends(require_lead_investigator),
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Delete money flow edges
    db.query(MoneyFlowEdge).filter(MoneyFlowEdge.transaction_id == transaction_id).delete()
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}


@router.get("/case/{case_id}/stats", response_model=TransactionStats)
def get_transaction_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    total = db.query(Transaction).filter(Transaction.case_id == case_id).count()
    
    agg = db.query(
        func.sum(Transaction.amount).label('total_amount'),
        func.avg(Transaction.amount).label('avg_amount'),
        func.max(Transaction.amount).label('max_amount'),
        func.min(Transaction.amount).label('min_amount'),
        func.min(Transaction.timestamp).label('min_date'),
        func.max(Transaction.timestamp).label('max_date'),
    ).filter(Transaction.case_id == case_id).first()
    
    by_currency = dict(db.query(Transaction.currency, func.count(Transaction.id)).filter(
        Transaction.case_id == case_id
    ).group_by(Transaction.currency).all())
    
    by_status = dict(db.query(Transaction.status, func.count(Transaction.id)).filter(
        Transaction.case_id == case_id
    ).group_by(Transaction.status).all())
    
    by_risk = {}
    transactions = db.query(Transaction.risk_score).filter(Transaction.case_id == case_id).all()
    for (score,) in transactions:
        level = get_risk_level(score)
        by_risk[level] = by_risk.get(level, 0) + 1
    
    return TransactionStats(
        total=total,
        total_amount=float(agg.total_amount) if agg.total_amount else 0,
        by_currency=by_currency,
        by_status=by_status,
        by_risk_level=by_risk,
        avg_amount=float(agg.avg_amount) if agg.avg_amount else 0,
        max_amount=float(agg.max_amount) if agg.max_amount else 0,
        min_amount=float(agg.min_amount) if agg.min_amount else 0,
        date_range={
            "from": agg.min_date.isoformat() if agg.min_date else None,
            "to": agg.max_date.isoformat() if agg.max_date else None,
        },
    )


@router.get("/case/{case_id}/money-flow/stats", response_model=MoneyFlowStats)
def get_money_flow_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    edges = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id).all()
    
    if not edges:
        return MoneyFlowStats(
            total_paths=0,
            total_amount=0,
            max_hops=0,
            avg_path_length=0,
        )
    
    # Group by path_id
    paths = {}
    for edge in edges:
        path_id = edge.path_id or "unknown"
        if path_id not in paths:
            paths[path_id] = []
        paths[path_id].append(edge)
    
    total_paths = len(paths)
    total_amount = sum(edge.amount for edge in edges)
    max_hops = max(len(hops) for hops in paths.values())
    avg_path_length = sum(len(hops) for hops in paths.values()) / len(paths)
    
    highest_risk = None
    max_risk = 0
    for path_id, hops in paths.items():
        path_risk = sum(h.risk for h in hops) / len(hops) if hops else 0
        if path_risk > max_risk:
            max_risk = path_risk
            path_amount = sum(h.amount for h in hops)
            highest_risk = MoneyFlowPathResponse(
                path_id=path_id,
                hops=[MoneyFlowEdgeResponse.model_validate(h) for h in hops],
                total_amount=path_amount,
                risk_score=path_risk,
            )
    
    return MoneyFlowStats(
        total_paths=total_paths,
        total_amount=total_amount,
        max_hops=max_hops,
        avg_path_length=avg_path_length,
        highest_risk_path=highest_risk,
    )


@router.get("/case/{case_id}/money-flow/paths", response_model=List[MoneyFlowPathResponse])
def get_money_flow_paths(
    case_id: uuid.UUID,
    min_amount: Optional[float] = Query(None),
    max_hops: Optional[int] = Query(None),
    min_risk: Optional[float] = Query(None),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    edges = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id).all()
    
    if min_amount:
        edges = [e for e in edges if e.amount >= min_amount]
    if min_risk:
        edges = [e for e in edges if e.risk >= min_risk]
    
    # Group by path_id
    paths = {}
    for edge in edges:
        path_id = edge.path_id or "unknown"
        if path_id not in paths:
            paths[path_id] = []
        paths[path_id].append(edge)
    
    if max_hops:
        paths = {k: v for k, v in paths.items() if len(v) <= max_hops}
    
    result = []
    for path_id, hops in paths.items():
        hops_sorted = sorted(hops, key=lambda h: h.hop_number)
        path_amount = sum(h.amount for h in hops_sorted)
        path_risk = sum(h.risk for h in hops_sorted) / len(hops_sorted) if hops_sorted else 0
        
        result.append(MoneyFlowPathResponse(
            path_id=path_id,
            hops=[MoneyFlowEdgeResponse.model_validate(h) for h in hops_sorted],
            total_amount=path_amount,
            risk_score=path_risk,
        ))
    
    return result


@router.get("/case/{case_id}/money-flow/graph")
def get_money_flow_graph(
    case_id: uuid.UUID,
    entity_types: Optional[List[str]] = Query(None),
    min_amount: Optional[float] = Query(None),
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Get entities in money flow
    edge_query = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id)
    if min_amount:
        edge_query = edge_query.filter(MoneyFlowEdge.amount >= min_amount)
    
    edges = edge_query.all()
    
    entity_ids = set()
    for edge in edges:
        entity_ids.add(edge.source_entity_id)
        entity_ids.add(edge.target_entity_id)
    
    entity_query = db.query(Entity).filter(Entity.id.in_(entity_ids))
    if entity_types:
        entity_query = entity_query.filter(Entity.entity_type.in_(entity_types))
    
    entities = entity_query.all()
    
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
        
        total_in = sum(e.amount for e in edges if e.target_entity_id == entity.id)
        total_out = sum(e.amount for e in edges if e.source_entity_id == entity.id)
        
        nodes.append({
            "id": str(entity.id),
            "label": entity.entity_id,
            "type": entity.entity_type,
            "value": entity.value,
            "riskScore": entity.risk_score,
            "riskLevel": entity.risk_level,
            "riskColor": risk_color,
            "totalIn": total_in,
            "totalOut": total_out,
            "netFlow": total_in - total_out,
        })
    
    # Build edges
    graph_edges = []
    for edge in edges:
        graph_edges.append({
            "id": str(edge.id),
            "source": str(edge.source_entity_id),
            "target": str(edge.target_entity_id),
            "amount": edge.amount,
            "timestamp": edge.timestamp.isoformat(),
            "hopNumber": edge.hop_number,
            "pathId": edge.path_id,
            "risk": edge.risk,
            "transactionId": str(edge.transaction_id),
        })
    
    return {"nodes": nodes, "edges": graph_edges}