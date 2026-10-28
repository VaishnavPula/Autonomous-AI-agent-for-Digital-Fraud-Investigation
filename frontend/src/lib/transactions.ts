import { apiClient } from '@/lib/api';
import {
  TransactionItem,
  TransactionDetail,
  TransactionListResponse,
  TransactionFilterParams,
  TransactionStats,
  MoneyFlowEdgeItem,
  MoneyFlowPathItem,
  MoneyFlowStats,
  MoneyFlowGraphResponse,
  TransactionImportRequest,
} from '@/types/transactions';

export const transactionsService = {
  async getTransactions(filters?: TransactionFilterParams, caseId?: string): Promise<TransactionListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.currency?.length) params.append('currency', filters.currency.join(','));
    if (filters?.min_amount !== undefined) params.append('min_amount', filters.min_amount.toString());
    if (filters?.max_amount !== undefined) params.append('max_amount', filters.max_amount.toString());
    if (filters?.min_risk_score !== undefined) params.append('min_risk_score', filters.min_risk_score.toString());
    if (filters?.max_risk_score !== undefined) params.append('max_risk_score', filters.max_risk_score.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from.toISOString());
    if (filters?.date_to) params.append('date_to', filters.date_to.toISOString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (caseId) params.append('case_id', caseId);

    return apiClient.get<TransactionListResponse>(`/transactions?${params.toString()}`);
  },

  async createTransaction(data: {
    case_id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    timestamp: Date;
    sender_entity_id?: string;
    receiver_entity_id?: string;
    merchant_entity_id?: string;
    payment_method?: string;
    device_entity_id?: string;
    ip_entity_id?: string;
    location_entity_id?: string;
    status?: string;
    risk_factors?: Record<string, any>;
    metadata?: Record<string, any>;
    evidence_ids?: string[];
  }): Promise<TransactionItem> {
    return apiClient.post<TransactionItem>('/transactions', data);
  },

  async importTransactions(
    file: File,
    caseId: string,
    columnMapping: Record<string, string>,
    defaultValues: Record<string, any> = {}
  ): Promise<TransactionListResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);
    formData.append('column_mapping', JSON.stringify(columnMapping));
    formData.append('default_values', JSON.stringify(defaultValues));

    return apiClient.upload<TransactionListResponse>('/transactions/import', formData);
  },

  async getTransactionById(transactionId: string): Promise<TransactionDetail> {
    return apiClient.get<TransactionDetail>(`/transactions/${transactionId}`);
  },

  async updateTransaction(transactionId: string, data: Partial<{
    amount: number;
    currency: string;
    timestamp: Date;
    sender_entity_id: string;
    receiver_entity_id: string;
    merchant_entity_id: string;
    payment_method: string;
    device_entity_id: string;
    ip_entity_id: string;
    location_entity_id: string;
    status: string;
    risk_score: number;
    risk_factors: Record<string, any>;
    metadata: Record<string, any>;
    evidence_ids: string[];
  }>): Promise<TransactionItem> {
    return apiClient.patch<TransactionItem>(`/transactions/${transactionId}`, data);
  },

  async deleteTransaction(transactionId: string): Promise<{ message: string }> {
    return apiClient.delete(`/transactions/${transactionId}`);
  },

  async getTransactionStats(caseId: string): Promise<TransactionStats> {
    return apiClient.get<TransactionStats>(`/transactions/case/${caseId}/stats`);
  },

  async getMoneyFlowStats(caseId: string): Promise<MoneyFlowStats> {
    return apiClient.get<MoneyFlowStats>(`/transactions/case/${caseId}/money-flow/stats`);
  },

  async getMoneyFlowPaths(
    caseId: string,
    minAmount?: number,
    maxHops?: number,
    minRisk?: number
  ): Promise<MoneyFlowPathItem[]> {
    const params = new URLSearchParams();
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());
    if (maxHops !== undefined) params.append('max_hops', maxHops.toString());
    if (minRisk !== undefined) params.append('min_risk', minRisk.toString());

    return apiClient.get<MoneyFlowPathItem[]>(`/transactions/case/${caseId}/money-flow/paths?${params.toString()}`);
  },

  async getMoneyFlowGraph(
    caseId: string,
    entityTypes?: string[],
    minAmount?: number
  ): Promise<MoneyFlowGraphResponse> {
    const params = new URLSearchParams();
    if (entityTypes?.length) params.append('entity_types', entityTypes.join(','));
    if (minAmount !== undefined) params.append('min_amount', minAmount.toString());

    return apiClient.get<MoneyFlowGraphResponse>(`/transactions/case/${caseId}/money-flow/graph?${params.toString()}`);
  },
};