export interface FraudSignalItem {
  id: string;
  signal_id: string;
  case_id: string;
  entity_id: string | null;
  signal_type: string;
  severity: string;
  observed_value: string;
  expected_value: string | null;
  deviation: number;
  reason: string;
  evidence_ids: string[];
  score_contribution: number;
  confidence: number;
  metadata: Record<string, any>;
  is_false_positive: boolean;
  created_at: string;
}

export interface FraudSignalListResponse {
  items: FraudSignalItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface FraudSignalFilterParams {
  search?: string;
  signal_type?: string[];
  severity?: string[];
  is_false_positive?: boolean;
  entity_id?: string;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}

export interface RiskScoreItem {
  id: string;
  case_id: string;
  entity_id: string | null;
  overall_score: number;
  risk_level: string;
  financial_exposure: number;
  evidence_strength: number;
  investigation_confidence: number;
  fraud_probability: number;
  false_positive_risk: number;
  risk_factors: Record<string, any>;
  component_scores: Record<string, number>;
  unresolved_questions: string[];
  version: string;
  created_at: string;
  updated_at: string;
}

export interface RiskScoreListResponse {
  items: RiskScoreItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface RiskFactor {
  factor_id: string;
  name: string;
  description: string;
  weight: number;
  score: number;
  evidence: string[];
  category: string;
}

export interface RiskAssessmentRequest {
  case_id: string;
  entity_id?: string;
  include_components?: boolean;
}

export interface RiskAssessmentResponse {
  case_id: string;
  entity_id?: string;
  overall_score: number;
  risk_level: string;
  financial_exposure: number;
  evidence_strength: number;
  investigation_confidence: number;
  fraud_probability: number;
  false_positive_risk: number;
  risk_factors: RiskFactor[];
  component_scores: Record<string, number>;
  unresolved_questions: string[];
  created_at: string;
}

export interface RiskStats {
  total_scores: number;
  by_level: Record<string, number>;
  avg_score: number;
  max_score: number;
  total_exposure: number;
  total_signals: number;
  signals_by_severity: Record<string, number>;
  signals_by_type: Record<string, number>;
  false_positive_rate: number;
}

export interface HypothesisItem {
  id: string;
  hypothesis_id: string;
  case_id: string;
  title: string;
  description: string;
  status: string;
  confidence: number;
  supporting_evidence_ids: string[];
  contradicting_evidence_ids: string[];
  missing_evidence_ids: string[];
  alternative_explanation: string | null;
  recommended_next_steps: string[];
  proposed_by: string;
  proposed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  metadata: Record<string, any>;
}

export interface HypothesisListResponse {
  items: HypothesisItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface HypothesisFilterParams {
  search?: string;
  status?: string[];
  min_confidence?: number;
  max_confidence?: number;
  proposed_by?: string;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}

export interface BehavioralBaselineItem {
  id: string;
  entity_id: string;
  case_id: string;
  metric_name: string;
  metric_type: string;
  baseline_value: number;
  baseline_std: number;
  sample_count: number;
  time_window_days: number;
  last_updated: string;
  metadata: Record<string, any>;
}

export interface AnomalyDetectionItem {
  id: string;
  case_id: string;
  entity_id: string;
  metric_name: string;
  observed_value: number;
  expected_value: number;
  deviation_score: number;
  detection_method: string;
  severity: string;
  explanation: string;
  evidence_ids: string[];
  context: Record<string, any>;
  created_at: string;
}

export interface AnomalyDetectionListResponse {
  items: AnomalyDetectionItem[];
  total: number;
  page: number;
  page_size: number;
}

export const signalTypeOptions = [
  'UNUSUAL_AMOUNT', 'UNUSUAL_TIME', 'UNUSUAL_LOCATION', 'NEW_DEVICE',
  'NEW_IP', 'RAPID_TRANSACTION_SEQUENCE', 'REPEATED_FAILED_ATTEMPTS',
  'ACCOUNT_TAKEOVER_INDICATORS', 'UNUSUAL_TRANSFER_CHAIN',
  'MULTIPLE_ACCOUNTS_SHARING_DEVICE', 'MULTIPLE_ACCOUNTS_SHARING_IP',
  'IMPOSSIBLE_TRAVEL', 'SUDDEN_BEHAVIOR_CHANGE', 'TRANSACTION_VELOCITY',
  'UNUSUAL_MERCHANT', 'SUSPICIOUS_ACCOUNT_RELATIONSHIP'
];

export const signalSeverityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const riskLevelOptions = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const hypothesisStatusOptions = [
  'PROPOSED', 'TESTING', 'SUPPORTED', 'REJECTED', 'NEEDS_MORE_EVIDENCE'
];