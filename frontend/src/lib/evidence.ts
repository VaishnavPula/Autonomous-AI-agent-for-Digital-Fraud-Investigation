import { apiClient } from '@/lib/api';
import {
  EvidenceItem,
  EvidenceDetail,
  EvidenceListResponse,
  EvidenceFilterParams,
  EvidenceUploadRequest,
  EvidenceIntegrityResponse,
  ChainOfCustodyResponse,
  EvidenceStats,
} from '@/types/evidence';

export const evidenceService = {
  async getEvidence(filters?: EvidenceFilterParams, caseId?: string): Promise<EvidenceListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.evidence_type?.length) params.append('evidence_type', filters.evidence_type.join(','));
    if (filters?.source?.length) params.append('source', filters.source.join(','));
    if (filters?.integrity_status?.length) params.append('integrity_status', filters.integrity_status.join(','));
    if (filters?.classification?.length) params.append('classification', filters.classification.join(','));
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<EvidenceListResponse>(`/evidence?${params.toString()}`);
  },

  async createEvidence(data: EvidenceUploadRequest): Promise<EvidenceItem> {
    return apiClient.post<EvidenceItem>('/evidence', data);
  },

  async uploadEvidence(file: File, data: Omit<EvidenceUploadRequest, 'content'>): Promise<EvidenceItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', data.case_id);
    formData.append('source', data.source);
    formData.append('evidence_type', data.evidence_type);
    formData.append('original_filename', data.original_filename);
    if (data.timestamp) formData.append('timestamp', data.timestamp.toISOString());
    formData.append('entity_references', JSON.stringify(data.entity_references || {}));
    formData.append('classification', data.classification || 'INTERNAL');
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));

    return apiClient.upload<EvidenceItem>('/evidence/upload', formData);
  },

  async getEvidenceById(evidenceId: string): Promise<EvidenceDetail> {
    return apiClient.get<EvidenceDetail>(`/evidence/${evidenceId}`);
  },

  async updateEvidence(evidenceId: string, data: Partial<EvidenceUploadRequest>): Promise<EvidenceItem> {
    return apiClient.patch<EvidenceItem>(`/evidence/${evidenceId}`, data);
  },

  async verifyIntegrity(evidenceId: string): Promise<EvidenceIntegrityResponse> {
    return apiClient.post<EvidenceIntegrityResponse>(`/evidence/${evidenceId}/verify`);
  },

  async getChainOfCustody(evidenceId: string): Promise<ChainOfCustodyResponse> {
    return apiClient.get<ChainOfCustodyResponse>(`/evidence/${evidenceId}/chain-of-custody`);
  },

  async deleteEvidence(evidenceId: string): Promise<{ message: string }> {
    return apiClient.delete(`/evidence/${evidenceId}`);
  },

  async getEvidenceStats(caseId: string): Promise<EvidenceStats> {
    return apiClient.get<EvidenceStats>(`/evidence/case/${caseId}/stats`);
  },
};