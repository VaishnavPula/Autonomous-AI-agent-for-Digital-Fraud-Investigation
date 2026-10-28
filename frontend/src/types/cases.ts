import { User } from './auth';

export interface Case {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  case_type: string;
  priority: string;
  risk_level: string;
  status: string;
  financial_impact: number | null;
  affected_entities_count: number;
  evidence_count: number;
  ai_confidence: number | null;
  investigation_completeness: number;
  investigator_id: string | null;
  reviewer_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface EvidenceItem {
  id: string;
  evidence_id: string;
  type: string;
  source: string;
  original_filename: string;
  timestamp: string | null;
  imported_at: string;
  hash: string;
  integrity_status: string;
  reliability: number;
  relevance: number;
}

export interface EntityItem {
  id: string;
  entity_id: string;
  entity_type: string;
  name: string | null;
  value: string | null;
  risk_score: number;
  risk_level: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  sender_entity_id: string | null;
  receiver_entity_id: string | null;
  status: string;
  risk_score: number;
}

export interface TimelineEventItem {
  id: string;
  event_id: string;
  event_type: string;
  timestamp: string;
  description: string;
  is_suspicious: boolean;
  risk_score: number;
  entity_ids: string[];
  evidence_ids: string[];
}

export interface FraudSignalItem {
  id: string;
  signal_id: string;
  signal_type: string;
  severity: string;
  description: string;
  evidence_ids: string[];
}

export interface RiskScoreItem {
  id: string;
  overall_score: number;
  risk_level: string;
  financial_exposure: number;
  investigation_confidence: number;
  evidence_strength: number;
}

export interface HypothesisItem {
  id: string;
  hypothesis_id: string;
  title: string;
  description: string;
  status: string;
  confidence: number;
  supporting_evidence_ids: string[];
  contradicting_evidence_ids: string[];
  alternative_explanation: string | null;
}

export interface CaseDetail extends Case {
  investigator?: User;
  reviewer?: User;
  evidence?: EvidenceItem[];
  entities?: EntityItem[];
  transactions?: TransactionItem[];
  timeline_events?: TimelineEventItem[];
  fraud_signals?: FraudSignalItem[];
  risk_scores?: RiskScoreItem[];
  hypotheses?: HypothesisItem[];
}

export interface CasesListResponse {
  items: Case[];
  total: number;
  page: number;
  page_size: number;
}

export interface CaseFilterParams {
  search?: string;
  status?: string[];
  risk_level?: string[];
  case_type?: string;
  priority?: string;
  investigator_id?: string;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}