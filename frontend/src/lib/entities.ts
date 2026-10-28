import { apiClient } from '@/lib/api';
import {
  EntityItem,
  EntityDetail,
  EntityListResponse,
  EntityFilterParams,
  EntityGraphResponse,
  EntityStats,
  EntityRelationshipItem,
  EntityRelationshipListResponse,
  EntityResolutionRequest,
} from '@/types/entities';

export const entitiesService = {
  async getEntities(filters?: EntityFilterParams, caseId?: string): Promise<EntityListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.entity_type?.length) params.append('entity_type', filters.entity_type.join(','));
    if (filters?.risk_level?.length) params.append('risk_level', filters.risk_level.join(','));
    if (filters?.is_resolved !== undefined) params.append('is_resolved', filters.is_resolved.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<EntityListResponse>(`/entities?${params.toString()}`);
  },

  async createEntity(data: {
    case_id: string;
    entity_type: string;
    name?: string;
    value?: string;
    attributes?: Record<string, any>;
    first_seen?: Date;
    last_seen?: Date;
  }): Promise<EntityItem> {
    return apiClient.post<EntityItem>('/entities', data);
  },

  async getEntityById(entityId: string): Promise<EntityDetail> {
    return apiClient.get<EntityDetail>(`/entities/${entityId}`);
  },

  async updateEntity(entityId: string, data: Partial<{
    entity_type: string;
    name: string;
    value: string;
    attributes: Record<string, any>;
    risk_score: number;
    risk_level: string;
    confidence: number;
    first_seen: Date;
    last_seen: Date;
    is_resolved: boolean;
    resolved_from: string[];
  }>): Promise<EntityItem> {
    return apiClient.patch<EntityItem>(`/entities/${entityId}`, data);
  },

  async deleteEntity(entityId: string): Promise<{ message: string }> {
    return apiClient.delete(`/entities/${entityId}`);
  },

  async createRelationship(data: {
    case_id: string;
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    timestamp?: Date;
    confidence?: number;
    evidence_ids?: string[];
    metadata?: Record<string, any>;
    strength?: number;
    is_directional?: boolean;
  }): Promise<EntityRelationshipItem> {
    return apiClient.post<EntityRelationshipItem>('/entities/relationships', data);
  },

  async getRelationships(
    caseId?: string,
    sourceEntityId?: string,
    targetEntityId?: string,
    relationshipType?: string[],
    page = 1,
    pageSize = 25
  ): Promise<EntityRelationshipListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (caseId) params.append('case_id', caseId);
    if (sourceEntityId) params.append('source_entity_id', sourceEntityId);
    if (targetEntityId) params.append('target_entity_id', targetEntityId);
    if (relationshipType?.length) params.append('relationship_type', relationshipType.join(','));

    return apiClient.get<EntityRelationshipListResponse>(`/entities/relationships?${params.toString()}`);
  },

  async updateRelationship(relationshipId: string, data: Partial<{
    relationship_type: string;
    timestamp: Date;
    confidence: number;
    evidence_ids: string[];
    metadata: Record<string, any>;
    strength: number;
    is_directional: boolean;
  }>): Promise<EntityRelationshipItem> {
    return apiClient.patch<EntityRelationshipItem>(`/entities/relationships/${relationshipId}`, data);
  },

  async deleteRelationship(relationshipId: string): Promise<{ message: string }> {
    return apiClient.delete(`/entities/relationships/${relationshipId}`);
  },

  async resolveEntities(data: EntityResolutionRequest): Promise<EntityItem> {
    return apiClient.post<EntityItem>('/entities/resolve', data);
  },

  async getEntityGraph(
    caseId: string,
    entityTypes?: string[],
    relationshipTypes?: string[],
    minConfidence = 0.5
  ): Promise<EntityGraphResponse> {
    const params = new URLSearchParams();
    if (entityTypes?.length) params.append('entity_types', entityTypes.join(','));
    if (relationshipTypes?.length) params.append('relationship_types', relationshipTypes.join(','));
    params.append('min_confidence', minConfidence.toString());

    return apiClient.get<EntityGraphResponse>(`/entities/case/${caseId}/graph?${params.toString()}`);
  },

  async getEntityStats(caseId: string): Promise<EntityStats> {
    return apiClient.get<EntityStats>(`/entities/case/${caseId}/stats`);
  },
};