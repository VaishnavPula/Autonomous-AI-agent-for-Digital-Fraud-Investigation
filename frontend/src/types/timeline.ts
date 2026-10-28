export interface TimelineEventItem {
  id: string;
  event_id: string;
  case_id: string;
  event_type: string;
  timestamp: string;
  entity_ids: string[];
  description: string;
  details: Record<string, any>;
  evidence_ids: string[];
  risk_score: number;
  is_suspicious: boolean;
  behavioral_deviation: Record<string, any> | null;
  source: string | null;
  created_at: string;
}

export interface TimelineEventDetail extends TimelineEventItem {
  temporal_correlations: TemporalCorrelationSummary[];
  impossible_travel: ImpossibleTravelSummary[];
}

export interface TemporalCorrelationSummary {
  id: string;
  relation_type: string;
  time_delta_seconds: number;
  confidence: number;
  other_event_id: string;
  other_event_type?: string;
}

export interface ImpossibleTravelSummary {
  id: string;
  entity_id: string;
  distance_km: number;
  actual_time_hours: number;
  is_impossible: boolean;
}

export interface TimelineListResponse {
  items: TimelineEventItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface TimelineFilterParams {
  search?: string;
  event_type?: string[];
  is_suspicious?: boolean;
  min_risk_score?: number;
  max_risk_score?: number;
  date_from?: Date;
  date_to?: Date;
  source?: string[];
  page?: number;
  page_size?: number;
}

export interface TemporalCorrelationItem {
  id: string;
  case_id: string;
  event_a_id: string;
  event_b_id: string;
  relation_type: string;
  time_delta_seconds: number;
  confidence: number;
  evidence_ids: string[];
  created_at: string;
}

export interface TemporalCorrelationListResponse {
  items: TemporalCorrelationItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImpossibleTravelItem {
  id: string;
  case_id: string;
  entity_id: string;
  previous_location_id: string | null;
  new_location_id: string | null;
  previous_timestamp: string;
  new_timestamp: string;
  distance_km: number;
  min_travel_time_hours: number;
  actual_time_hours: number;
  is_impossible: boolean;
  possible_explanations: string[];
  evidence_ids: string[];
  created_at: string;
}

export interface ImpossibleTravelListResponse {
  items: ImpossibleTravelItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface TimelineStats {
  total_events: number;
  suspicious_events: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
  by_risk_level: Record<string, number>;
  date_range: {
    from: string | null;
    to: string | null;
  };
  top_suspicious_entities: Array<{ entity_id: string; suspicious_count: number }>;
  temporal_correlations: number;
  impossible_travel_incidents: number;
}

export interface TimelineExportRequest {
  case_id: string;
  date_from?: Date;
  date_to?: Date;
  event_types?: string[];
  format: 'json' | 'csv';
}

export const timelineEventTypeOptions = [
  'LOGIN', 'TRANSACTION', 'PASSWORD_CHANGE', 'DEVICE_REGISTRATION',
  'IP_CHANGE', 'LOCATION_CHANGE', 'COMMUNICATION', 'ACCOUNT_CREATION',
  'DOCUMENT_UPLOAD', 'SUSPICIOUS_ACTIVITY', 'ALERT', 'INVESTIGATOR_ACTION',
  'AI_DISCOVERY', 'PASSWORD_RESET', 'BENEFICIARY_ADDED', 'ACCOUNT_LOCK',
  'MFA_CHANGE', 'SESSION_START', 'SESSION_END'
];

export const temporalRelationOptions = [
  'BEFORE', 'AFTER', 'WITHIN_5_MINUTES', 'WITHIN_1_HOUR',
  'SAME_SESSION', 'SAME_DEVICE', 'SAME_IP', 'NEAR_TRANSACTION'
];