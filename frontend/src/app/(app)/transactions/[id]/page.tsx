"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { transactionsService } from "@/lib/transactions";
import { TransactionDetail, MoneyFlowPathItem, MoneyFlowEdgeItem } from "@/types/transactions";
import {
  ArrowLeft,
  Download,
  Link2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Hash,
  Eye,
  Copy,
  AlertCircle,
  HelpCircle,
  History,
  Network,
  Plus,
  Search,
  Merge,
  Settings,
  Share2,
  FileText,
  DollarSign,
  ArrowRight,
  Zap,
  RefreshCw,
  BarChart3,
} from "lucide-react";

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'entities', label: 'Entities', icon: Link2 },
  { id: 'risk', label: 'Risk Analysis', icon: AlertTriangle },
  { id: 'flow', label: 'Money Flow', icon: ArrowRight },
  { id: 'metadata', label: 'Metadata', icon: Hash },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400' },
  COMPLETED: { label: 'Completed', color: 'bg-green-900/30 border-green-500/30 text-green-400' },
  FAILED: { label: 'Failed', color: 'bg-red-900/30 border-red-500/30 text-red-400' },
  REVERSED: { label: 'Reversed', color: 'bg-blue-900/30 border-blue-500/30 text-blue-400' },
  FLAGGED: { label: 'Flagged', color: 'bg-orange-900/30 border-orange-500/30 text-orange-400' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-900/30 border-purple-500/30 text-purple-400' },
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [moneyFlowPaths, setMoneyFlowPaths] = useState<MoneyFlowPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGraph, setShowGraph] = useState(false);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const tx = await transactionsService.getTransactionById(transactionId);
      setTransaction(tx);
      if (tx.case_id) {
        const paths = await transactionsService.getMoneyFlowPaths(tx.case_id);
        setMoneyFlowPaths(paths);
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      router.push('/transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [transactionId, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.3) return 'MEDIUM';
    if (score >= 0.1) return 'LOW';
    return 'VERY_LOW';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-forensic-text">Loading...</h1>
          </div>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-forensic-border rounded w-1/4 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-forensic-border rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-forensic-text">Transaction not found</h2>
        <Button variant="secondary" onClick={() => router.back()}>Back to Vault</Button>
      </div>
    );
  }

  const statusInfo = statusConfig[transaction.status] || { label: transaction.status, color: 'bg-forensic-border text-forensic-muted' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-forensic-accent text-lg">{transaction.transaction_id}</span>
            <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", statusInfo.color)}>
              {statusInfo.label}
            </span>
            <RiskBadge level={getRiskLevel(transaction.risk_score)} size="sm" />
          </div>
          <h1 className="text-2xl font-bold text-forensic-text">{formatCurrency(transaction.amount, transaction.currency)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Download</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(transaction.amount, transaction.currency)}</p>
          <p className="text-sm text-forensic-muted">Amount</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(transaction.risk_score * 100)}%</p>
          <p className="text-sm text-forensic-muted">Risk Score</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{formatTimestamp(transaction.timestamp)}</p>
          <p className="text-sm text-forensic-muted">Timestamp</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{transaction.money_flow_edges.length}</p>
          <p className="text-sm text-forensic-muted">Flow Edges</p>
        </Card>
      </div>

      <div className="border-b border-forensic-border/50">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Transaction tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-forensic-accent/10 text-forensic-accent border-b-2 border-forensic-accent'
                    : 'text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated'
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-4" role="tabpanel">
        {renderTabContent(activeTab, transaction!)}
      </div>
    </div>
  );

  function renderTabContent(tabId: string, transaction: TransactionDetail) {
    switch (tabId) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-semibold text-forensic-text mb-4">Transaction Details</h3>
                <dl className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Transaction ID</dt>
                      <dd className="font-mono text-forensic-text">{transaction.transaction_id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Status</dt>
                      <dd className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", statusInfo.color)}>
                        {statusInfo.label}
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Amount</dt>
                      <dd className="font-mono text-forensic-text">{formatCurrency(transaction.amount, transaction.currency)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Currency</dt>
                      <dd className="text-forensic-text">{transaction.currency}</dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Timestamp</dt>
                      <dd className="font-mono text-forensic-text">{formatTimestamp(transaction.timestamp)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Risk Score</dt>
                      <dd className="flex items-center gap-2">
                        <RiskBadge level={getRiskLevel(transaction.risk_score)} size="sm" />
                        <span className="font-mono text-forensic-text">{Math.round(transaction.risk_score * 100)}%</span>
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Payment Method</dt>
                      <dd className="text-forensic-text">{transaction.payment_method || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Created</dt>
                      <dd className="font-mono text-forensic-text">{formatTimestamp(transaction.created_at)}</dd>
                    </div>
                  </div>
                </dl>
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="text-lg font-semibold text-forensic-text mb-4">Risk Factors</h3>
                {Object.keys(transaction.risk_factors).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(transaction.risk_factors).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                        <span className="text-sm font-medium text-forensic-text">{key.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-forensic-text">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-forensic-muted">No risk factors recorded</p>
                )}
              </Card>
            </div>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Related Entities</h3>
              <Table
                columns={[
                  { key: 'role', header: 'Role' },
                  { key: 'entity_id', header: 'Entity ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.entity_id}</span> },
                  { key: 'entity_type', header: 'Type' },
                  { key: 'value', header: 'Value', render: (row: any) => <span className="font-mono text-forensic-text truncate max-w-[200px]">{row.value}</span> },
                ]}
                data={[
                  transaction.sender && { role: 'Sender', ...transaction.sender },
                  transaction.receiver && { role: 'Receiver', ...transaction.receiver },
                  transaction.merchant && { role: 'Merchant', ...transaction.merchant },
                  transaction.device && { role: 'Device', ...transaction.device },
                  transaction.ip && { role: 'IP', ...transaction.ip },
                  transaction.location && { role: 'Location', ...transaction.location },
                ].filter(Boolean)}
                keyExtractor={(row) => row.id}
                emptyMessage="No related entities"
              />
            </Card>
          </div>
        );

      case 'entities':
        return (
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">Transaction Entity Graph</h3>
            <div className="space-y-4">
              {[
                { label: 'Sender', entity: transaction.sender, color: 'blue' },
                { label: 'Receiver', entity: transaction.receiver, color: 'green' },
                { label: 'Merchant', entity: transaction.merchant, color: 'purple' },
                { label: 'Device', entity: transaction.device, color: 'orange' },
                { label: 'IP', entity: transaction.ip, color: 'red' },
                { label: 'Location', entity: transaction.location, color: 'teal' },
              ].filter(e => e.entity).map(({ label, entity, color }) => (
                <div key={label} className="flex items-center gap-4 p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", `bg-${color}-900/30 border-${color}-500/30`)}>
                    <span className="font-mono text-lg">{entity?.entity_type?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-forensic-text">{label}</h4>
                    <p className="font-mono text-forensic-accent">{entity?.entity_id}</p>
                    <p className="text-sm text-forensic-muted">{entity?.entity_type}</p>
                    <p className="font-mono text-forensic-text truncate">{entity?.value}</p>
                  </div>
                  <Button variant="ghost" size="icon" leftIcon={<ArrowRight className="w-4 h-4" />} onClick={() => entity && router.push(`/entities/${entity.id}`)}>
                    View Entity
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        );

      case 'risk':
        return (
          <div className="space-y-6">
            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Risk Score Breakdown</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Overall Risk Score</p>
                  <p className="font-mono text-4xl text-forensic-accent">{Math.round(transaction.risk_score * 100)}%</p>
                  <RiskBadge level={getRiskLevel(transaction.risk_score)} size="lg" />
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Risk Factors</p>
                  <p className="font-mono text-3xl text-forensic-text">{Object.keys(transaction.risk_factors).length}</p>
                  <p className="text-sm text-forensic-muted">Identified</p>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Evidence Links</p>
                  <p className="font-mono text-3xl text-forensic-text">{transaction.evidence_ids.length}</p>
                  <p className="text-sm text-forensic-muted">Connected</p>
                </div>
              </div>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Risk Factors Detail</h3>
              {Object.keys(transaction.risk_factors).length > 0 ? (
                <Table
                  columns={[
                    { key: 'factor', header: 'Factor', render: (row: any) => <span className="font-medium text-forensic-text">{row.factor.replace(/_/g, ' ')}</span> },
                    { key: 'value', header: 'Value', render: (row: any) => <pre className="font-mono text-sm text-forensic-text">{JSON.stringify(row.value, null, 2)}</pre> },
                  ]}
                  data={Object.entries(transaction.risk_factors).map(([factor, value]) => ({ factor, value }))}
                  keyExtractor={(row) => row.factor}
                  emptyMessage="No risk factors"
                />
              ) : (
                <p className="text-forensic-muted">No risk factors recorded</p>
              )}
            </Card>
          </div>
        );

      case 'flow':
        return (
          <div className="space-y-6">
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-forensic-text">Money Flow Paths</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" leftIcon={<BarChart3 className="w-4 h-4" />} onClick={() => setShowGraph(!showGraph)}>
                    {showGraph ? 'Hide Graph' : 'Show Graph'}
                  </Button>
                </div>
              </div>

              {showGraph && (
                <div className="mb-6 p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <p className="text-forensic-muted mb-4">Money flow graph visualization would be rendered here with nodes and edges</p>
                  <div className="h-64 bg-forensic-surface rounded border border-forensic-border/50 flex items-center justify-center">
                    <span className="text-forensic-muted">Graph visualization placeholder</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {moneyFlowPaths.length > 0 ? (
                  moneyFlowPaths.map((path, index) => (
                    <Card key={path.path_id} variant="default" padding="md">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-forensic-text">Path: {path.path_id}</h4>
                          <p className="text-sm text-forensic-muted">{path.hops.length} hops • {formatCurrency(path.total_amount)} • Risk: {Math.round(path.risk_score * 100)}%</p>
                        </div>
                        <RiskBadge level={path.risk_score >= 0.8 ? 'CRITICAL' : path.risk_score >= 0.6 ? 'HIGH' : path.risk_score >= 0.3 ? 'MEDIUM' : 'LOW'} size="sm" />
                      </div>
                      <div className="space-y-2">
                        {path.hops.map((hop, hopIndex) => (
                          <div key={hop.id} className="flex items-center gap-3 p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                            <span className="w-8 h-8 rounded-full bg-forensic-accent/10 border border-forensic-accent/30 flex items-center justify-center font-mono text-forensic-accent text-sm">
                              {hop.hop_number}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-forensic-text">Source: {hop.source_entity_id.slice(0, 12)}...</span>
                                <ArrowRight className="w-4 h-4 text-forensic-muted" />
                                <span className="font-mono text-forensic-text">Target: {hop.target_entity_id.slice(0, 12)}...</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-forensic-muted mt-1">
                                <span className="font-mono">{formatCurrency(hop.amount)}</span>
                                <span>Risk: {Math.round(hop.risk * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-forensic-muted text-center py-8">No money flow paths found for this transaction</p>
                )}
              </div>
            </Card>
          </div>
        );

      case 'metadata':
        return (
          <div className="space-y-6">
            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Transaction Metadata</h3>
              <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-4 py-4 rounded border border-forensic-border/50 overflow-x-auto max-h-[500px]">
                {JSON.stringify(transaction.metadata, null, 2) || '{}'}
              </pre>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Evidence Links</h3>
              {transaction.evidence_ids.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {transaction.evidence_ids.map(id => (
                    <Badge key={id} variant="evidence" size="sm">{id}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-forensic-muted">No evidence linked to this transaction</p>
              )}
            </Card>
          </div>
        );

      default:
        return (
          <Card variant="default" padding="lg" className="text-center">
            <HelpCircle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-forensic-text mb-2">{tabs.find(t => t.id === activeTab)?.label}</h3>
            <p className="text-forensic-muted">This section is under development.</p>
          </Card>
        );
    }
  }
}