"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatCurrency, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { transactionsService } from "@/lib/transactions";
import { TransactionItem, TransactionFilterParams, TransactionStats } from "@/types/transactions";
import { TransactionUpload } from "@/components/transactions/TransactionUpload";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Upload,
  FileText,
  ArrowRight,
  Share2,
  Network,
  DollarSign,
  BarChart3,
  Loader2,
  Download,
} from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  COMPLETED: "bg-green-900/30 border-green-500/30 text-green-400",
  FAILED: "bg-red-900/30 border-red-500/30 text-red-400",
  REVERSED: "bg-blue-900/30 border-blue-500/30 text-blue-400",
  FLAGGED: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  UNDER_REVIEW: "bg-purple-900/30 border-purple-500/30 text-purple-400",
};

export default function TransactionVaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [moneyFlowStats, setMoneyFlowStats] = useState<{ total_paths: number; total_amount: number; max_hops: number } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [currencyFilter, setCurrencyFilter] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);
  const [allCurrencies, setAllCurrencies] = useState<string[]>([]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter.length) params.append('status', statusFilter.join(','));
      if (currencyFilter.length) params.append('currency', currencyFilter.join(','));
      if (minAmount !== null) params.append('min_amount', minAmount.toString());
      if (maxAmount !== null) params.append('max_amount', maxAmount.toString());

      const response = await transactionsService.getTransactions({
        search,
        status: statusFilter,
        currency: currencyFilter,
        min_amount: minAmount || undefined,
        max_amount: maxAmount || undefined,
        page,
        page_size: pageSize,
      }, caseId || undefined);

      setTransactions(response.items);
      setTotal(response.total);

      const statuses = Array.from(new Set(response.items.map(t => t.status)));
      const currencies = Array.from(new Set(response.items.map(t => t.currency)));
      setAllStatuses(statuses);
      setAllCurrencies(currencies);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const [txStats, mfStats] = await Promise.all([
        transactionsService.getTransactionStats(caseId),
        transactionsService.getMoneyFlowStats(caseId),
      ]);
      setStats(txStats);
      setMoneyFlowStats(mfStats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    if (caseId) fetchStats();
  }, [page, pageSize, search, statusFilter, currencyFilter, minAmount, maxAmount, caseId]);

  const columns = [
    { key: 'transaction_id', header: 'Transaction ID', render: (row: TransactionItem) => <span className="font-mono text-forensic-accent">{row.transaction_id}</span> },
    { key: 'timestamp', header: 'Timestamp', render: (row: TransactionItem) => <span className="font-mono text-forensic-muted">{formatTimestamp(row.timestamp)}</span> },
    { key: 'amount', header: 'Amount', render: (row: TransactionItem) => <span className="font-mono tabular-nums text-forensic-text">{formatCurrency(row.amount, row.currency)}</span> },
    { key: 'currency', header: 'Currency', render: (row: TransactionItem) => <Badge variant="default" size="sm">{row.currency}</Badge> },
    { key: 'status', header: 'Status', render: (row: TransactionItem) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", statusColors[row.status] || "bg-forensic-border text-forensic-muted")}>{row.status}</span> },
    { key: 'risk_score', header: 'Risk', render: (row: TransactionItem) => <RiskBadge level={row.risk_score >= 0.8 ? 'CRITICAL' : row.risk_score >= 0.6 ? 'HIGH' : row.risk_score >= 0.3 ? 'MEDIUM' : row.risk_score >= 0.1 ? 'LOW' : 'VERY_LOW'} size="sm" /> },
    { key: 'sender_entity_id', header: 'Sender', render: (row: TransactionItem) => <span className="text-forensic-text truncate max-w-[150px]">{row.sender_entity_id ? `Entity: ${row.sender_entity_id.slice(0,8)}...` : '—'}</span> },
    { key: 'receiver_entity_id', header: 'Receiver', render: (row: TransactionItem) => <span className="text-forensic-text truncate max-w-[150px]">{row.receiver_entity_id ? `Entity: ${row.receiver_entity_id.slice(0,8)}...` : '—'}</span> },
    { key: 'created_at', header: 'Created', render: (row: TransactionItem) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
  ];

  const handleUploadSuccess = (tx: TransactionItem) => {
    setShowUploadModal(false);
    fetchTransactions();
    if (caseId) fetchStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Transaction Vault</h1>
          <p className="text-forensic-muted">Analyze and trace financial transactions</p>
        </div>
        <div className="flex items-center gap-2">
          {caseId && (
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { fetchTransactions(); fetchStats(); }}>
              Refresh
            </Button>
          )}
          <Button onClick={() => setShowUploadModal(true)} leftIcon={<Upload className="w-4 h-4" />}>
            Import Transactions
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.total}</p>
            <p className="text-sm text-forensic-muted">Total Transactions</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(stats.total_amount)}</p>
            <p className="text-sm text-forensic-muted">Total Volume</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(stats.avg_amount)}</p>
            <p className="text-sm text-forensic-muted">Avg Amount</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(stats.max_amount)}</p>
            <p className="text-sm text-forensic-muted">Max Amount</p>
          </Card>
          {moneyFlowStats && (
            <>
            <Card variant="elevated" padding="md" className="text-center">
              <p className="text-2xl font-bold text-forensic-text font-mono">{moneyFlowStats.total_paths}</p>
              <p className="text-sm text-forensic-muted">Money Flow Paths</p>
            </Card>
            <Card variant="elevated" padding="md" className="text-center">
              <p className="text-2xl font-bold text-red-400 font-mono">{moneyFlowStats.max_hops}</p>
              <p className="text-sm text-forensic-muted">Max Hops</p>
            </Card>
            </>
          )}
        </div>
      )}

      <div className="bg-forensic-surface border border-forensic-border rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
            <input
              type="text"
              placeholder="Search by transaction ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
          <select
            multiple
            value={statusFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setStatusFilter(selected);
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            multiple
            value={currencyFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setCurrencyFilter(selected);
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Min Amount"
              value={minAmount !== null ? minAmount : ""}
              onChange={(e) => { setMinAmount(e.target.value ? parseFloat(e.target.value) : null); setPage(1); }}
              className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 w-[120px]"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Amount"
              value={maxAmount !== null ? maxAmount : ""}
              onChange={(e) => { setMaxAmount(e.target.value ? parseFloat(e.target.value) : null); setPage(1); }}
              className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 w-[120px]"
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={transactions}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No transactions found"
        onRowClick={(row) => router.push(`/transactions/${row.id}`)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
        <div className="text-sm text-forensic-muted">
          Showing {transactions.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          >
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}
          </select>
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
          <button onClick={() => setPage(page + 1)} disabled={page * pageSize >= total} className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
        </div>
      </div>

      <TransactionUpload
        caseId={caseId || ""}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}