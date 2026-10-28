from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class GraphNodeBase(BaseModel):
    node_id: str
    node_type: str
    label: str
    properties: Dict[str, Any] = {}
    risk_score: float = 0.0
    risk_level: str = "LOW"


class GraphNodeCreate(GraphNodeBase):
    case_id: uuid.UUID


class GraphNodeUpdate(BaseModel):
    node_type: Optional[str] = None
    label: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None


class GraphNodeResponse(GraphNodeBase):
    id: uuid.UUID
    case_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GraphEdgeBase(BaseModel):
    source_id: str
    target_id: str
    edge_type: str
    properties: Dict[str, Any] = {}
    weight: float = 1.0
    direction: str = "directed"


class GraphEdgeCreate(GraphEdgeBase):
    case_id: uuid.UUID


class GraphEdgeUpdate(BaseModel):
    edge_type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    weight: Optional[float] = None
    direction: Optional[str] = None


class GraphEdgeResponse(GraphEdgeBase):
    id: uuid.UUID
    case_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GraphRequest(BaseModel):
    case_id: uuid.UUID
    node_types: Optional[List[str]] = None
    edge_types: Optional[List[str]] = None
    min_confidence: float = 0.5
    max_depth: int = 3


class GraphResponse(BaseModel):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    stats: Dict[str, Any]


class PathFindingRequest(BaseModel):
    case_id: uuid.UUID
    source_id: str
    target_id: str
    algorithm: str = "dijkstra"  # dijkstra, a_star, bfs, dfs
    max_hops: int = 10
    edge_types: Optional[List[str]] = None
    min_weight: float = 0.0


class PathFindingResponse(BaseModel):
    path_id: str
    source: GraphNodeResponse
    target: GraphNodeResponse
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    total_weight: float
    hop_count: int
    algorithm: str


class CommunityDetectionRequest(BaseModel):
    case_id: uuid.UUID
    algorithm: str = "louvain"  # louvain, leiden, label_propagation
    min_community_size: int = 3
    resolution: float = 1.0


class CommunityDetectionResponse(BaseModel):
    communities: List[Dict[str, Any]]
    modularity: float
    algorithm: str
    node_count: int
    community_count: int


class CentralityRequest(BaseModel):
    case_id: uuid.UUID
    metric: str = "betweenness"  # betweenness, closeness, degree, eigenvector, pagerank
    top_k: int = 20


class CentralityResponse(BaseModel):
    scores: Dict[str, float]
    metric: str
    top_nodes: List[Dict[str, Any]]


class SubgraphRequest(BaseModel):
    case_id: uuid.UUID
    center_node_id: str
    radius: int = 2
    max_nodes: int = 100


class GraphStats(BaseModel):
    node_count: int
    edge_count: int
    density: float
    avg_degree: float
    clustering_coefficient: float
    connected_components: int
    by_type: Dict[str, int]
    by_risk_level: Dict[str, int]