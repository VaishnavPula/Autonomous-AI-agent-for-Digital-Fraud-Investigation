import { apiClient } from '@/lib/api';
import {
  FraudSignalItem,
  FraudSignalListResponse,
  FraudSignalFilterParams,
  RiskScoreItem,
  RiskScoreListResponse,
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  RiskStats,
  HypothesisItem,
  HypothesisListResponse,
  HypothesisFilterParams,
  BehavioralBaselineItem,
  AnomalyDetectionItem,
  AnomalyDetectionListResponse,
} from '@/types/risk';

export const riskService = {
  async getSignals(filters?: FraudSignalFilterParams, caseId?: string): Promise<FraudSignalListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.signal_type?.length) params.append('signal_type', filters.signal_type.join(','));
    if (filters?.severity?.length) params.append('severity', filters.severity.join(','));
    if (filters?.is_false_positive !== undefined) params.append('is_false_positive', filters.is_false_positive.toString());
    if (filters?.entity_id) params.append('entity_id', filters.entity_id);
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<FraudSignalListResponse>(`/risk/signals?${params.toString()}`);
  },

  async createSignal(data: {
    case_id: string;
    entity_id?: string;
    signal_type: string;
    severity: string;
    observed_value: string;
    expected_value?: string;
    deviation: number;
    reason: string;
    evidence_ids?: string[];
    score_contribution?: number;
    confidence?: number;
    metadata?: Record<string, any>;
  }): Promise<FraudSignalItem> {
    return apiClient.post<FraudSignalItem>('/risk/signals', data);
  },

  async getSignalById(signalId: string): Promise<FraudSignalItem> {
    return apiClient.get<FraudSignalItem>(`/risk/signals/${signalId}`);
  },

  async updateSignal(signalId: string, data: Partial<{
    signal_type: string;
    severity: string;
    observed_value: string;
    expected_value: string;
    deviation: number;
    reason: string;
    evidence_ids: string[];
    score_contribution: number;
    confidence: number;
    metadata: Record<string, any>;
    is_false_positive: boolean;
  }>): Promise<FraudSignalItem> {
    return apiClient.patch<FraudSignalItem>(`/risk/signals/${signalId}`, data);
  },

  async deleteSignal(signalId: string): Promise<{ message: string }> {
    return apiClient.delete(`/risk/signals/${signalId}`);
  },

  async getScores(
    caseId?: string,
    entityId?: string,
    riskLevel?: string[],
    minScore?: number,
    maxScore?: number,
    page = 1,
    pageSize = 25
  ): Promise<RiskScoreListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (caseId) params.append('case_id', caseId);
    if (entityId) params.append('entity_id', entityId);
    if (riskLevel?.length) params.append('risk_level', riskLevel.join(','));
    if (minScore !== undefined) params.append('min_score', minScore.toString());
    if (maxScore !== undefined) params.append('max_score', maxScore.toString());

    return apiClient.get<RiskScoreListResponse>(`/risk/scores?${params.toString()}`);
  },

  async createScore(data: {
    case_id: string;
    entity_id?: string;
    overall_score: number;
    risk_level: string;
    financial_exposure?: number;
    evidence_strength?: number;
    investigation_confidence?: number;
    fraud_probability?: number;
    false_positive_risk?: number;
    risk_factors?: Record<string, any>;
    component_scores?: Record<string, number>;
    unresolved_questions?: string[];
    version?: string;
  }): Promise<RiskScoreItem> {
    return apiClient.post<RiskScoreItem>('/risk/scores', data);
  },

  async getScoreById(scoreId: string): Promise<RiskScoreItem> {
    return apiClient.get<RiskScoreItem>(`/risk/scores/${scoreId}`);
  },

  async assessRisk(data: RiskAssessmentRequest): Promise<RiskAssessmentResponse> {
    return apiClient.post<RiskAssessmentResponse>('/risk/assess', data);
  },

  async getStats(caseId: string): Promise<RiskStats> {
    return apiClient.get<RiskStats>(`/risk/case/${caseId}/stats`);
  },

  async getHypotheses(filters?: HypothesisFilterParams, caseId?: string): Promise<HypothesisListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.min_confidence !== undefined) params.append('min_confidence', filters.min_confidence.toString());
    if (filters?.max_confidence !== undefined) params.append('max_confidence', filters.max_confidence.toString());
    if (filters?.proposed_by) params.append('proposed_by', filters.proposed_by);
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<HypothesisListResponse>(`/risk/hypotheses?${params.toString()}`);
  },

  async createHypothesis(data: {
    case_id: string;
    title: string;
    description: string;
    proposed_by: string;
    confidence?: number;
    supporting_evidence_ids?: string[];
    contradicting_evidence_ids?: string[];
    missing_evidence_ids?: string[];
    alternative_explanation?: string;
    recommended_next_steps?: string[];
    metadata?: Record<string, any>;
  }): Promise<any> {
    return apiClient.post<any>('/risk/hypotheses', data);
  },

  async getHypothesisById(hypothesisId: string): Promise<any> {
    return apiClient.get<any>(`/risk/hypotheses/${hypothesisId}`);
  },

  async updateHypothesis(hypothesisId: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    confidence: number;
    supporting_evidence_ids: string[];
    contradicting_evidence_ids: string[];
    missing_evidence_ids: string[];
    alternative_explanation: string;
    recommended_next_steps: string[];
    metadata: Record<string, any>;
    reviewed_by: string;
  }>): Promise<any> {
    return apiClient.patch<any>(`/risk/hypotheses/${hypothesisId}`, data);
  },

  async deleteHypothesis(hypothesisId: string): Promise<{ message: string }> {
    return apiClient.delete(`/risk/hypotheses/${hypothesisId}`);
  },

  async getBaselines(caseId?: string, entityId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (entityId) params.append('entity_id', entityId);

    return apiClient.get<any[]>(`/risk/baselines?${params.toString()}`);
  },

  async createBaseline(data: {
    entity_id: string;
    case_id: string;
    metric_name: string;
    metric_type: string;
    baseline_value: number;
    baseline_std?: number;
    sample_count?: number;
    time_window_days?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    return apiClient.post<any>('/risk/baselines', data);
  },

  async getAnomalies(
    caseId?: string,
    entityId?: string,
    severity?: string[],
    metricName?: string,
    page = 1,
    pageSize = 25
  ): Promise<AnomalyDetectionListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (caseId) params.append('case_id', caseId);
    if (entityId) params.append('entity_id', entityId);
    if (severity?.length) params.append('severity', severity.join(','));
    if (metricName) params.append('metric_name', metricName);

    return apiClient.get<AnomalyDetectionListResponse>(`/risk/anomalies?${params.toString()}`);
  },
};