export interface TransactionItem {
  id: string;
  transaction_id: string;
  case_id: string;
  amount: number;
  currency: string;
  timestamp: string;
  sender_entity_id: string | null;
  receiver_entity_id: string | null;
  merchant_entity_id: string | null;
  payment_method: string | null;
  device_entity_id: string | null;
  ip_entity_id: string | null;
  location_entity_id: string | null;
  status: string;
  risk_score: number;
  risk_factors: Record<string, any>;
  metadata: Record<string, any>;
  evidence_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TransactionDetail extends TransactionItem {
  sender?: EntitySummary;
  receiver?: EntitySummary;
  merchant?: EntitySummary;
  device?: EntitySummary;
  ip?: EntitySummary;
  location?: EntitySummary;
  money_flow_edges: MoneyFlowEdgeSummary[];
}

export interface EntitySummary {
  id: string;
  entity_id: string;
  entity_type: string;
  value: string;
}

export interface MoneyFlowEdgeSummary {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  amount: number;
  hop_number: number;
  path_id: string | null;
  risk: number;
}

export interface TransactionListResponse {
  items: TransactionItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface TransactionFilterParams {
  search?: string;
  status?: string[];
  currency?: string[];
  min_amount?: number;
  max_amount?: number;
  min_risk_score?: number;
  max_risk_score?: number;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}

export interface TransactionStats {
  total: number;
  total_amount: number;
  by_currency: Record<string, number>;
  by_status: Record<string, number>;
  by_risk_level: Record<string, number>;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
  date_range: {
    from: string | null;
    to: string | null;
  };
}

export interface MoneyFlowEdgeItem {
  id: string;
  case_id: string;
  source_entity_id: string;
  target_entity_id: string;
  transaction_id: string;
  amount: number;
  timestamp: string;
  hop_number: number;
  path_id: string | null;
  risk: number;
  evidence_ids: string[];
  created_at: string;
}

export interface MoneyFlowPathItem {
  path_id: string;
  hops: MoneyFlowEdgeItem[];
  total_amount: number;
  risk_score: number;
  start_entity?: EntitySummary;
  end_entity?: EntitySummary;
}

export interface MoneyFlowStats {
  total_paths: number;
  total_amount: number;
  max_hops: number;
  avg_path_length: number;
  highest_risk_path?: MoneyFlowPathItem;
}

export interface MoneyFlowGraphResponse {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowGraphEdge[];
}

export interface MoneyFlowNode {
  id: string;
  label: string;
  type: string;
  value: string | null;
  riskScore: number;
  riskLevel: string;
  riskColor: string;
  totalIn: number;
  totalOut: number;
  netFlow: number;
}

export interface MoneyFlowGraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  hopNumber: number;
  pathId: string | null;
  risk: number;
  transactionId: string;
}

export interface TransactionImportRequest {
  case_id: string;
  file_content: string;
  file_type: string;
  column_mapping: Record<string, string>;
  default_values: Record<string, any>;
}

export const transactionStatusOptions = [
  'PENDING', 'COMPLETED', 'FAILED', 'REVERSED', 'FLAGGED', 'UNDER_REVIEW'
];

export const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];