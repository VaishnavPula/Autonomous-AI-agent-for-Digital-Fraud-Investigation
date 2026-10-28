export interface GraphNodeItem {
  id: string;
  node_id: string;
  node_type: string;
  label: string;
  properties: Record<string, any>;
  risk_score: number;
  risk_level: string;
  risk_color: string;
  is_resolved: boolean;
}

export interface GraphEdgeItem {
  id: string;
  source: string;
  target: string;
  edge_type: string;
  properties: Record<string, any>;
  weight: number;
  direction: string;
}

export interface GraphResponse {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  stats: {
    node_count: number;
    edge_count: number;
    density: number;
    avg_degree: number;
  };
}

export interface GraphRequest {
  case_id: string;
  node_types?: string[];
  edge_types?: string[];
  min_confidence: number;
  max_depth: number;
}

export interface PathFindingRequest {
  case_id: string;
  source_id: string;
  target_id: string;
  algorithm: string;
  max_hops: number;
  edge_types?: string[];
  min_weight: number;
}

export interface PathFindingResponse {
  path_id: string;
  source: GraphNodeItem;
  target: GraphNodeItem;
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  total_weight: number;
  hop_count: number;
  algorithm: string;
}

export interface CommunityDetectionRequest {
  case_id: string;
  algorithm: string;
  min_community_size: number;
  resolution: number;
}

export interface CommunityItem {
  community_id: string;
  nodes: string[];
  size: number;
  internal_weight: number;
  external_weight: number;
  node_details: GraphNodeItem[];
}

export interface CommunityDetectionResponse {
  communities: CommunityItem[];
  modularity: number;
  algorithm: string;
  node_count: number;
  community_count: number;
}

export interface CentralityRequest {
  case_id: string;
  metric: string;
  top_k: number;
}

export interface CentralityResponse {
  scores: Record<string, number>;
  metric: string;
  top_nodes: Array<{
    node_id: string;
    label: string;
    type: string;
    score: number;
  }>;
}

export interface SubgraphRequest {
  case_id: string;
  center_node_id: string;
  radius: number;
  max_nodes: number;
}

export interface GraphStats {
  node_count: number;
  edge_count: number;
  density: number;
  avg_degree: number;
  clustering_coefficient: number;
  connected_components: number;
  by_type: Record<string, number>;
  by_risk_level: Record<string, number>;
}