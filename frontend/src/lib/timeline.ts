import { apiClient } from '@/lib/api';
import {
  TimelineEventItem,
  TimelineEventDetail,
  TimelineListResponse,
  TimelineFilterParams,
  TimelineStats,
  TemporalCorrelationItem,
  TemporalCorrelationListResponse,
  ImpossibleTravelItem,
  ImpossibleTravelListResponse,
  TimelineExportRequest,
} from '@/types/timeline';

export const timelineService = {
  async getEvents(filters?: TimelineFilterParams, caseId?: string): Promise<TimelineListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.event_type?.length) params.append('event_type', filters.event_type.join(','));
    if (filters?.is_suspicious !== undefined) params.append('is_suspicious', filters.is_suspicious.toString());
    if (filters?.min_risk_score !== undefined) params.append('min_risk_score', filters.min_risk_score.toString());
    if (filters?.max_risk_score !== undefined) params.append('max_risk_score', filters.max_risk_score.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.source?.length) params.append('source', filters.source.join(','));
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<TimelineListResponse>(`/timeline?${params.toString()}`);
  },

  async createEvent(data: {
    case_id: string;
    event_type: string;
    timestamp: Date;
    entity_ids?: string[];
    description: string;
    details?: Record<string, any>;
    evidence_ids?: string[];
    source?: string;
  }): Promise<TimelineEventItem> {
    return apiClient.post<TimelineEventItem>('/timeline', data);
  },

  async getEventById(eventId: string): Promise<TimelineEventDetail> {
    return apiClient.get<TimelineEventDetail>(`/timeline/${eventId}`);
  },

  async updateEvent(eventId: string, data: Partial<{
    event_type: string;
    timestamp: Date;
    entity_ids: string[];
    description: string;
    details: Record<string, any>;
    evidence_ids: string[];
    risk_score: number;
    is_suspicious: boolean;
    behavioral_deviation: Record<string, any>;
    source: string;
  }>): Promise<TimelineEventItem> {
    return apiClient.patch<TimelineEventItem>(`/timeline/${eventId}`, data);
  },

  async deleteEvent(eventId: string): Promise<{ message: string }> {
    return apiClient.delete(`/timeline/${eventId}`);
  },

  async getCorrelations(
    caseId?: string,
    relationType?: string[],
    minConfidence?: number,
    page = 1,
    pageSize = 25
  ): Promise<{ items: TemporalCorrelationItem[]; total: number; page: number; page_size: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (caseId) params.append('case_id', caseId);
    if (relationType?.length) params.append('relation_type', relationType.join(','));
    if (minConfidence !== undefined) params.append('min_confidence', minConfidence.toString());

    return apiClient.get<{ items: TemporalCorrelationItem[]; total: number; page: number; page_size: number }>(`/timeline/correlations?${params.toString()}`);
  },

  async getImpossibleTravel(
    caseId?: string,
    entityId?: string,
    isImpossible?: boolean,
    page = 1,
    pageSize = 25
  ): Promise<{ items: any[]; total: number; page: number; page_size: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (caseId) params.append('case_id', caseId);
    if (entityId) params.append('entity_id', entityId);
    if (isImpossible !== undefined) params.append('is_impossible', isImpossible.toString());

    return apiClient.get<{ items: any[]; total: number; page: number; page_size: number }>(`/timeline/impossible-travel?${params.toString()}`);
  },

  async getStats(caseId: string): Promise<TimelineStats> {
    return apiClient.get<TimelineStats>(`/timeline/case/${caseId}/stats`);
  },

  async analyzeTimeline(caseId: string): Promise<{ message: string; temporal_correlations_found: number; impossible_travel_incidents: number }> {
    return apiClient.post<{ message: string; temporal_correlations_found: number; impossible_travel_incidents: number }>(`/timeline/case/${caseId}/analyze`);
  },

  async exportTimeline(data: TimelineExportRequest): Promise<{ format: string; data: string; count: number }> {
    return apiClient.post<{ format: string; data: string; count: number }>('/timeline/export', data);
  },
};