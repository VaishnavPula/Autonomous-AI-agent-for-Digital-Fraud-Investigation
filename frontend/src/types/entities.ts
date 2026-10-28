export interface EntityItem {
  id: string;
  entity_id: string;
  case_id: string;
  entity_type: string;
  name: string | null;
  value: string | null;
  attributes: Record<string, any>;
  risk_score: number;
  risk_level: string;
  confidence: number;
  first_seen: string | null;
  last_seen: string | null;
  is_resolved: boolean;
  resolved_from: string[];
  created_at: string;
  updated_at: string;
}

export interface EntityDetail extends EntityItem {
  source_relationships: EntityRelationshipSummary[];
  target_relationships: EntityRelationshipSummary[];
  evidence_count: number;
}

export interface EntityRelationshipSummary {
  id: string;
  relationship_type: string;
  target_entity_id?: string;
  target_entity_value?: string;
  source_entity_id?: string;
  source_entity_value?: string;
  confidence: number;
  strength: number;
}

export interface EntityListResponse {
  items: EntityItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface EntityFilterParams {
  search?: string;
  entity_type?: string[];
  risk_level?: string[];
  is_resolved?: boolean;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}

export interface EntityRelationshipItem {
  id: string;
  case_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  timestamp: string | null;
  confidence: number;
  evidence_ids: string[];
  metadata: Record<string, any>;
  strength: number;
  is_directional: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntityRelationshipListResponse {
  items: EntityRelationshipItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface EntityGraphResponse {
  nodes: EntityGraphNode[];
  edges: EntityGraphEdge[];
}

export interface EntityGraphNode {
  id: string;
  label: string;
  type: string;
  name: string | null;
  value: string | null;
  riskScore: number;
  riskLevel: string;
  riskColor: string;
  isResolved: boolean;
  confidence: number;
}

export interface EntityGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
  evidenceIds: string[];
}

export interface EntityStats {
  total: number;
  resolved: number;
  unresolved: number;
  by_type: Record<string, number>;
  by_risk: Record<string, number>;
  relationships: number;
}

export interface EntityResolutionRequest {
  entity_ids: string[];
  new_entity_id: string;
  new_entity_type: string;
  new_name?: string;
  new_value?: string;
}

export const entityTypeOptions = [
  'USER', 'ACCOUNT', 'DEVICE', 'IP', 'EMAIL', 'PHONE',
  'TRANSACTION', 'MERCHANT', 'LOCATION', 'DOCUMENT', 'EVENT', 'CASE'
];

export const relationshipTypeOptions = [
  'OWNS', 'USED', 'LOGGED_IN_FROM', 'TRANSFERRED_TO',
  'CONNECTED_TO', 'LOCATED_AT', 'ASSOCIATED_WITH',
  'COMMUNICATED_WITH', 'CREATED', 'MODIFIED', 'RECEIVED', 'SENT'
];

export const riskLevelOptions = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW'];