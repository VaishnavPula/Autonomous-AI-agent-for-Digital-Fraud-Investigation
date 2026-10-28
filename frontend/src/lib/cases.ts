import { apiClient } from '@/lib/api';
import { Case, CaseDetail, CasesListResponse, CaseFilterParams } from '@/types/cases';

export const casesService = {
  async getCases(filters?: CaseFilterParams): Promise<CasesListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.risk_level?.length) params.append('risk_level', filters.risk_level.join(','));
    if (filters?.case_type) params.append('case_type', filters.case_type);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.investigator_id) params.append('investigator_id', filters.investigator_id);
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    return apiClient.get<CasesListResponse>(`/cases?${params.toString()}`);
  },

  async getCase(caseId: string): Promise<CaseDetail> {
    return apiClient.get<CaseDetail>(`/cases/${caseId}`);
  },

  async createCase(data: { case_id: string; title: string; description?: string; case_type: string; priority: string }): Promise<Case> {
    return apiClient.post<Case>('/cases', data);
  },

  async updateCase(caseId: string, data: Partial<{ title: string; description?: string; case_type: string; priority: string; status: string; risk_level: string }>): Promise<Case> {
    return apiClient.patch<Case>(`/cases/${caseId}`, data);
  },

  async deleteCase(caseId: string): Promise<{ message: string }> {
    return apiClient.delete(`/cases/${caseId}`);
  },

  async assignCase(caseId: string, investigatorId: string): Promise<Case> {
    return apiClient.post<Case>(`/cases/${caseId}/assign`, { investigator_id: investigatorId });
  },

  async updateStatus(caseId: string, status: string, reason?: string): Promise<Case> {
    return apiClient.patch<Case>(`/cases/${caseId}/status`, { status, reason });
  },

  async updateRisk(caseId: string, risk_level: string, reason?: string): Promise<Case> {
    return apiClient.patch<Case>(`/cases/${caseId}/risk`, { risk_level, reason });
  },

  async getSummary(caseId: string): Promise<any> {
    return apiClient.get(`/cases/${caseId}/summary`);
  },

  async assignCaseToUser(caseId: string, investigatorId: string): Promise<Case> {
    return apiClient.post<Case>(`/cases/${caseId}/assign`, { investigator_id: investigatorId });
  },
};