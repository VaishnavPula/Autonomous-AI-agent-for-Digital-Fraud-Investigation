import { apiClient } from '@/lib/api';
import {
  GraphNodeItem,
  GraphEdgeItem,
  GraphResponse,
  GraphRequest,
  PathFindingRequest,
  PathFindingResponse,
  CommunityDetectionRequest,
  CommunityDetectionResponse,
  CentralityRequest,
  CentralityResponse,
  SubgraphRequest,
  GraphStats,
} from '@/types/graph';

export const graphService = {
  async getGraph(data: GraphRequest): Promise<GraphResponse> {
    return apiClient.post<GraphResponse>(`/graph/${data.case_id}`, data);
  },

  async findPath(data: PathFindingRequest): Promise<PathFindingResponse> {
    return apiClient.post<PathFindingResponse>('/graph/path', data);
  },

  async detectCommunities(data: CommunityDetectionRequest): Promise<CommunityDetectionResponse> {
    return apiClient.post<CommunityDetectionResponse>('/graph/community', data);
  },

  async getCentrality(data: CentralityRequest): Promise<CentralityResponse> {
    return apiClient.post<CentralityResponse>('/graph/centrality', data);
  },

  async getSubgraph(data: SubgraphRequest): Promise<{ nodes: any[]; edges: any[]; center: string; radius: number }> {
    return apiClient.post<{ nodes: any[]; edges: any[]; center: string; radius: number }>('/graph/subgraph', data);
  },

  async getStats(caseId: string): Promise<any> {
    return apiClient.get<any>(`/graph/case/${caseId}/stats`);
  },
};