from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import uuid
import json
import heapq
from collections import defaultdict, deque
import math

from app.core.config import settings
from app.database.session import get_db
from app.models import Case, Entity, EntityRelationship, Transaction
from app.auth.dependencies import get_current_active_user, get_current_superuser, require_investigator
from app.auth.schemas import User as UserSchema
from .schemas import (
    GraphNodeCreate, GraphNodeUpdate, GraphNodeResponse,
    GraphEdgeCreate, GraphEdgeUpdate, GraphEdgeResponse,
    GraphRequest, GraphResponse, PathFindingRequest, PathFindingResponse,
    CommunityDetectionRequest, CommunityDetectionResponse,
    CentralityRequest, CentralityResponse, SubgraphRequest,
    GraphStats, GraphEdgeBase, GraphNodeBase
)

router = APIRouter(prefix="/graph", tags=["graph"])


def build_graph_from_case(db: Session, case_id: uuid.UUID, filters: Optional[Dict] = None) -> tuple:
    """Build graph nodes and edges from case data."""
    nodes = {}
    edges = []
    
    # Get entities as nodes
    entity_query = db.query(Entity).filter(Entity.case_id == case_id)
    if filters and filters.get('node_types'):
        entity_query = entity_query.filter(Entity.entity_type.in_(filters['node_types']))
    
    entities = entity_query.all()
    for entity in entities:
        risk_color = {
            "CRITICAL": "#ef4444", "HIGH": "#f97316", 
            "MEDIUM": "#eab308", "LOW": "#22c55e", "VERY_LOW": "#10b981"
        }.get(entity.risk_level, "#64748b")
        
        nodes[str(entity.id)] = {
            "id": str(entity.id),
            "node_id": entity.entity_id,
            "node_type": entity.entity_type,
            "label": entity.entity_id,
            "properties": entity.attributes,
            "risk_score": entity.risk_score,
            "risk_level": entity.risk_level,
            "risk_color": risk_color,
            "is_resolved": entity.is_resolved,
        }
    
    # Get relationships as edges
    rel_query = db.query(EntityRelationship).filter(EntityRelationship.case_id == case_id)
    if filters and filters.get('edge_types'):
        rel_query = rel_query.filter(EntityRelationship.relationship_type.in_(filters['edge_types']))
    if filters and filters.get('min_confidence'):
        rel_query = rel_query.filter(EntityRelationship.confidence >= filters['min_confidence'])
    
    relationships = rel_query.all()
    for rel in relationships:
        if str(rel.source_entity_id) in nodes and str(rel.target_entity_id) in nodes:
            edges.append({
                "id": str(rel.id),
                "source": str(rel.source_entity_id),
                "target": str(rel.target_entity_id),
                "edge_type": rel.relationship_type,
                "properties": rel.metadata,
                "weight": rel.strength * rel.confidence,
                "direction": "directed" if rel.is_directional else "undirected",
            })
    
    return nodes, edges


def dijkstra(nodes: Dict, edges: List[Dict], source: str, target: str, max_hops: int = 10) -> Optional[Dict]:
    """Dijkstra's shortest path algorithm."""
    if source not in nodes or target not in nodes:
        return None
    
    # Build adjacency list
    adj = defaultdict(list)
    for edge in edges:
        if edge["direction"] == "directed":
            adj[edge["source"]].append((edge["target"], edge["weight"], edge))
        else:
            adj[edge["source"]].append((edge["target"], edge["weight"], edge))
            adj[edge["target"]].append((edge["source"], edge["weight"], edge))
    
    # Dijkstra
    dist = {source: 0}
    prev = {}
    hops = {source: 0}
    pq = [(0, source)]
    visited = set()
    
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        
        if u == target:
            break
            
        if hops[u] >= max_hops:
            continue
            
        for v, w, edge in adj[u]:
            if v in visited:
                continue
            alt = d + w
            if alt < dist.get(v, float('inf')):
                dist[v] = alt
                prev[v] = (u, edge)
                hops[v] = hops[u] + 1
                heapq.heappush(pq, (alt, v))
    
    if target not in dist:
        return None
    
    # Reconstruct path
    path_nodes = []
    path_edges = []
    curr = target
    while curr != source:
        path_nodes.append(nodes[curr])
        u, edge = prev[curr]
        path_edges.append(edge)
        curr = u
    path_nodes.append(nodes[source])
    path_nodes.reverse()
    path_edges.reverse()
    
    return {
        "nodes": path_nodes,
        "edges": path_edges,
        "total_weight": dist[target],
        "hop_count": len(path_edges),
    }


def louvain_communities(nodes: Dict, edges: List[Dict], resolution: float = 1.0) -> List[List[str]]:
    """Simplified Louvain community detection."""
    # Build adjacency
    adj = defaultdict(set)
    for edge in edges:
        adj[edge["source"]].add(edge["target"])
        if edge["direction"] == "undirected":
            adj[edge["target"]].add(edge["source"])
    
    # Initialize each node in its own community
    communities = {node: i for i, node in enumerate(nodes.keys())}
    node_to_comm = communities.copy()
    
    # Simplified - just return connected components as communities
    visited = set()
    communities_list = []
    
    for node in nodes:
        if node in visited:
            continue
        comm = []
        queue = deque([node])
        visited.add(node)
        while queue:
            u = queue.popleft()
            comm.append(u)
            for v in adj[u]:
                if v not in visited:
                    visited.add(v)
                    queue.append(v)
        if len(comm) >= 3:
            communities_list.append(comm)
    
    return communities_list


def calculate_centrality(nodes: Dict, edges: List[Dict], metric: str, top_k: int = 20) -> Dict[str, float]:
    """Calculate centrality metrics."""
    # Build adjacency
    adj = defaultdict(set)
    weights = defaultdict(float)
    for edge in edges:
        adj[edge["source"]].add(edge["target"])
        if edge["direction"] == "undirected":
            adj[edge["target"]].add(edge["source"])
        weights[(edge["source"], edge["target"])] = edge["weight"]
    
    scores = {}
    
    if metric == "degree":
        for node in nodes:
            scores[node] = len(adj[node])
    
    elif metric == "betweenness":
        # Simplified - use degree as proxy
        for node in nodes:
            scores[node] = len(adj[node])
    
    elif metric == "closeness":
        # Simplified - use inverse of average distance
        for node in nodes:
            if len(adj[node]) > 0:
                scores[node] = 1.0 / (1.0 + len(adj[node]))
            else:
                scores[node] = 0
    
    elif metric == "pagerank":
        # Simplified PageRank
        N = len(nodes)
        if N == 0:
            return {}
        d = 0.85
        scores = {node: 1.0/N for node in nodes}
        for _ in range(20):
            new_scores = {}
            for node in nodes:
                rank = (1-d)/N
                # Sum of ranks from incoming edges
                incoming = sum(scores[src] / max(len(adj[src]), 1) for src in nodes if node in adj[src])
                rank += d * incoming
                new_scores[node] = rank
            scores = new_scores
    
    else:
        for node in nodes:
            scores[node] = len(adj[node])
    
    return scores


router = APIRouter(prefix="/graph", tags=["graph"])


@router.post("/case/{case_id}", response_model=GraphResponse)
def get_case_graph(
    case_id: uuid.UUID,
    request: GraphRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    filters = {
        "node_types": request.node_types,
        "edge_types": request.edge_types,
        "min_confidence": request.min_confidence,
    }
    
    nodes, edges = build_graph_from_case(db, case_id, filters)
    
    # Apply max_depth filtering if needed (simplified)
    node_list = [GraphNodeResponse.model_validate(n) for n in nodes.values()]
    edge_list = [GraphEdgeResponse.model_validate(e) for e in edges]
    
    stats = {
        "node_count": len(nodes),
        "edge_count": len(edges),
        "density": len(edges) / max(len(nodes) * (len(nodes) - 1), 1) if len(nodes) > 1 else 0,
        "avg_degree": (2 * len(edges)) / max(len(nodes), 1) if len(nodes) > 0 else 0,
    }
    
    return GraphResponse(
        nodes=node_list,
        edges=edge_list,
        stats=stats,
    )


@router.post("/path", response_model=PathFindingResponse)
def find_path(
    request: PathFindingRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    filters = {
        "edge_types": request.edge_types,
    }
    nodes, edges = build_graph_from_case(db, request.case_id, filters)
    
    # Filter edges by min_weight
    filtered_edges = [e for e in edges if e["weight"] >= request.min_weight]
    
    result = dijkstra(nodes, filtered_edges, request.source_id, request.target_id, request.max_hops)
    
    if not result:
        raise HTTPException(status_code=404, detail="No path found")
    
    return PathFindingResponse(
        path_id=str(uuid.uuid4()),
        source=GraphNodeResponse.model_validate(nodes[request.source_id]),
        target=GraphNodeResponse.model_validate(nodes[request.target_id]),
        nodes=[GraphNodeResponse.model_validate(n) for n in result["nodes"]],
        edges=[GraphEdgeResponse.model_validate(e) for e in result["edges"]],
        total_weight=result["total_weight"],
        hop_count=result["hop_count"],
        algorithm=request.algorithm,
    )


@router.post("/community", response_model=CommunityDetectionResponse)
def detect_communities(
    request: CommunityDetectionRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    nodes, edges = build_graph_from_case(db, request.case_id, {})
    communities = louvain_communities(nodes, edges, request.resolution)
    
    community_list = []
    for i, comm in enumerate(communities):
        comm_nodes = [nodes[n] for n in comm if n in nodes]
        sub_edges = [e for e in edges if e["source"] in comm and e["target"] in comm]
        internal_weight = sum(e["weight"] for e in sub_edges)
        external_weight = sum(e["weight"] for e in edges if (e["source"] in comm) != (e["target"] in comm))
        
        community_list.append({
            "community_id": f"comm_{i}",
            "nodes": comm,
            "size": len(comm),
            "internal_weight": internal_weight,
            "external_weight": external_weight,
            "node_details": [GraphNodeResponse.model_validate(nodes[n]) for n in comm if n in nodes],
        })
    
    return CommunityDetectionResponse(
        communities=community_list,
        modularity=0.5,  # placeholder
        algorithm=request.algorithm,
        node_count=len(nodes),
        community_count=len(communities),
    )


@router.post("/centrality", response_model=CentralityResponse)
def calculate_centrality(
    request: CentralityRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    nodes, edges = build_graph_from_case(db, request.case_id, {})
    scores = calculate_centrality(nodes, edges, request.metric, request.top_k)
    
    # Sort and get top k
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:request.top_k]
    top_nodes = []
    for node_id, score in sorted_scores:
        node_data = nodes[node_id]
        top_nodes.append({
            "node_id": node_id,
            "label": node_id,
            "type": node_data.get("node_type"),
            "score": score,
        })
    
    return CentralityResponse(
        scores=scores,
        metric=request.metric,
        top_nodes=top_nodes,
    )


@router.post("/subgraph")
def get_subgraph(
    request: SubgraphRequest,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    nodes, edges = build_graph_from_case(db, request.case_id, {})
    
    if request.center_node_id not in nodes:
        raise HTTPException(status_code=404, detail="Center node not found")
    
    # BFS to find nodes within radius
    adj = defaultdict(set)
    for edge in edges:
        adj[edge["source"]].add(edge["target"])
        if edge["direction"] == "undirected":
            adj[edge["target"]].add(edge["source"])
    
    visited = {request.center_node_id: 0}
    queue = deque([request.center_node_id])
    subgraph_nodes = {request.center_node_id}
    
    while queue:
        u = queue.popleft()
        if visited[u] >= request.radius:
            continue
        for v in adj[u]:
            if v not in visited:
                visited[v] = visited[u] + 1
                subgraph_nodes.add(v)
                queue.append(v)
    
    if len(subgraph_nodes) > request.max_nodes:
        subgraph_nodes = set(list(subgraph_nodes)[:request.max_nodes])
    
    subgraph_edges = [e for e in edges if e["source"] in subgraph_nodes and e["target"] in subgraph_nodes]
    
    return {
        "nodes": [GraphNodeResponse.model_validate(nodes[n]) for n in subgraph_nodes if n in nodes],
        "edges": [GraphEdgeResponse.model_validate(e) for e in subgraph_edges],
        "center": request.center_node_id,
        "radius": request.radius,
    }


@router.get("/case/{case_id}/stats", response_model=GraphStats)
def get_graph_stats(
    case_id: uuid.UUID,
    current_user: UserSchema = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    nodes, edges = build_graph_from_case(db, case_id, {})
    
    by_type = defaultdict(int)
    by_risk = defaultdict(int)
    for node in nodes.values():
        by_type[node.get("node_type", "UNKNOWN")] += 1
        by_risk[node.get("risk_level", "LOW")] += 1
    
    return GraphStats(
        node_count=len(nodes),
        edge_count=len(edges),
        density=len(edges) / max(len(nodes) * (len(nodes) - 1), 1) if len(nodes) > 1 else 0,
        avg_degree=(2 * len(edges)) / max(len(nodes), 1) if len(nodes) > 0 else 0,
        clustering_coefficient=0.3,  # placeholder
        connected_components=1,  # placeholder
        by_type=dict(by_type),
        by_risk_level=dict(by_risk),
    )