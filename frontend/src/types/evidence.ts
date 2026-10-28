export interface EvidenceItem {
  id: string;
  evidence_id: string;
  case_id: string;
  source: string;
  evidence_type: string;
  original_filename: string;
  content: string | null;
  timestamp: string | null;
  entity_references: Record<string, any>;
  hash: string;
  hash_algorithm: string;
  integrity_status: string;
  reliability: number;
  relevance: number;
  collector_id: string | null;
  imported_at: string;
  metadata: Record<string, any>;
  storage_reference: string | null;
  classification: string;
  file_size: number | null;
  mime_type: string | null;
}

export interface EvidenceDetail extends EvidenceItem {
  collector?: {
    id: string;
    email: string;
    full_name: string;
  };
  access_history: EvidenceAccessLog[];
}

export interface EvidenceAccessLog {
  id: string;
  action: string;
  user_id: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, any>;
}

export interface EvidenceListResponse {
  items: EvidenceItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface EvidenceFilterParams {
  search?: string;
  evidence_type?: string[];
  source?: string[];
  integrity_status?: string[];
  classification?: string[];
  date_from?: Date;
  date_to?: Date;
  page?: number;
  page_size?: number;
}

export interface EvidenceUploadRequest {
  case_id: string;
  source: string;
  evidence_type: string;
  original_filename: string;
  content?: string;
  timestamp?: Date;
  entity_references?: Record<string, any>;
  classification?: string;
  file_size?: number;
  mime_type?: string;
  metadata?: Record<string, any>;
}

export interface EvidenceIntegrityResponse {
  evidence_id: string;
  is_valid: boolean;
  current_hash: string;
  expected_hash: string;
  hash_algorithm: string;
  checked_at: string;
}

export interface ChainOfCustodyEntry {
  id: string;
  action: string;
  user_id: string;
  user_name?: string;
  timestamp: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, any>;
}

export interface ChainOfCustodyResponse {
  evidence_id: string;
  entries: ChainOfCustodyEntry[];
  total: number;
}

export interface EvidenceStats {
  total: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
  integrity: Record<string, number>;
  total_size_bytes: number;
}

export const evidenceTypeOptions = [
  'CSV', 'JSON', 'TXT', 'PDF', 'IMAGE', 'LOG',
  'TRANSACTION_EXPORT', 'ACCOUNT_RECORD', 'DEVICE_RECORD',
  'IP_LOG', 'COMMUNICATION_METADATA', 'DOCUMENT',
  'BROWSER_FINGERPRINT', 'DEVICE_FINGERPRINT', 'OTHER'
];

export const evidenceClassificationOptions = [
  'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'
];

export const integrityStatusOptions = [
  'VERIFIED', 'WARNING', 'CORRUPTED', 'PENDING'
];