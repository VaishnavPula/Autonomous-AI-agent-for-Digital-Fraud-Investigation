'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge, RiskBadge, EvidenceBadge, IntegrityBadge, ConfidenceBadge, SignalBadge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatRelativeTime, formatTimestamp, formatCurrency } from '@/lib/utils';
import { casesService } from '@/lib/cases';
import { CaseDetail } from '@/types/cases';
import {
  ArrowLeft,
  Zap,
  FileText,
  Users,
  DollarSign,
  Network,
  Clock,
  Shield,
  Activity,
  FileOutput,
  History,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Plus,
  Eye,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'entities', label: 'Entities', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: DollarSign },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'signals', label: 'Signals', icon: AlertTriangle },
  { id: 'risk', label: 'Risk', icon: Shield },
  { id: 'hypotheses', label: 'Hypotheses', icon: HelpCircle },
  { id: 'ai', label: 'AI Investigation', icon: Zap },
  { id: 'actions', label: 'Actions', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileOutput },
  { id: 'audit', label: 'Audit', icon: History },
];

const evidenceColumns = [
  { key: 'evidence_id', header: 'ID', render: (row: any) => <EvidenceBadge id={row.evidence_id} size="sm" /> },
  { key: 'original_filename', header: 'Filename' },
  { key: 'type', header: 'Type', render: (row: any) => <Badge variant="default" size="sm">{row.type}</Badge> },
  { key: 'source', header: 'Source' },
  { key: 'timestamp', header: 'Timestamp', render: (row: any) => <span className="font-mono text-forensic-muted">{row.timestamp ? formatTimestamp(row.timestamp) : '—'}</span> },
  { key: 'integrity_status', header: 'Integrity', render: (row: any) => <IntegrityBadge status={row.integrity_status} size="sm" /> },
  { key: 'reliability', header: 'Reliability', render: (row: any) => <ConfidenceBadge confidence={row.reliability} size="sm" /> },
];

const entityColumns = [
  { key: 'entity_id', header: 'ID', render: (row: any) => <Badge variant="evidence" size="sm">{row.entity_id}</Badge> },
  { key: 'entity_type', header: 'Type', render: (row: any) => <Badge variant="default" size="sm">{row.entity_type}</Badge> },
  { key: 'name', header: 'Name' },
  { key: 'value', header: 'Value', render: (row: any) => <span className="font-mono text-forensic-text truncate max-w-[200px]">{row.value || '—'}</span> },
  { key: 'risk_score', header: 'Risk', render: (row: any) => <RiskBadge level={row.risk_level} size="sm" /> },
];

const transactionColumns = [
  { key: 'transaction_id', header: 'ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.transaction_id}</span> },
  { key: 'timestamp', header: 'Time', render: (row: any) => <span className="font-mono text-forensic-muted">{formatTimestamp(row.timestamp)}</span> },
  { key: 'amount', header: 'Amount', render: (row: any) => <span className="font-mono tabular-nums">{formatCurrency(row.amount, row.currency)}</span> },
  { key: 'currency', header: 'Currency' },
  { key: 'status', header: 'Status', render: (row: any) => <Badge variant="default" size="sm">{row.status}</Badge> },
  { key: 'risk_score', header: 'Risk', render: (row: any) => <ConfidenceBadge confidence={row.risk_score} size="sm" /> },
];

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchCase = async () => {
    setLoading(true);
    try {
      const data = await casesService.getCase(caseId);
      setCaseData(data);
    } catch (error) {
      console.error('Failed to fetch case:', error);
      router.push('/cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId, router]);

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

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-forensic-text">Case not found</h2>
        <Button variant="secondary" onClick={() => router.push('/cases')}>Back to Cases</Button>
      </div>
    );
  }

  const stats = [
    { label: 'Evidence', value: caseData.evidence_count, icon: FileText, color: 'text-blue-400' },
    { label: 'Entities', value: caseData.affected_entities_count, icon: Users, color: 'text-green-400' },
    { label: 'Transactions', value: caseData.transactions?.length || 0, icon: DollarSign, color: 'text-yellow-400' },
    { label: 'Completeness', value: `${Math.round(caseData.investigation_completeness * 100)}%`, icon: CheckCircle, color: 'text-forensic-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="lg:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="evidence" size="lg">{caseData.case_id}</Badge>
            <StatusBadge status={caseData.status} size="md" />
            <RiskBadge level={caseData.risk_level} size="md" />
          </div>
          <h1 className="text-2xl font-bold text-forensic-text">{caseData.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)} leftIcon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Link href={`/cases/${caseData.id}/board`}>
            <Button variant="primary" leftIcon={<Zap className="w-4 h-4 mr-2" />}>
              Trace Board
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} variant="elevated" padding="md" className="text-center">
            <stat.icon className={cn('w-6 h-6 mx-auto mb-2', stat.color)} />
            <p className="text-2xl font-bold text-forensic-text font-mono">{stat.value}</p>
            <p className="text-sm text-forensic-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="border-b border-forensic-border/50">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Case tabs">
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
        {renderTabContent(activeTab, caseData, activeTab)}
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Case"
        size="lg"
      >
        <EditCaseForm caseData={caseData} onSuccess={fetchCase} />
      </Modal>
    </div>
  );
}

function renderTabContent(tabId: string, caseData: any, activeTab: string) {
  if (!caseData) return null;

  switch (tabId) {
    case 'overview':
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="default" padding="lg" className="md:col-span-2">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Case Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Type</p>
                  <p className="text-forensic-text">{caseData.case_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Priority</p>
                  <Badge variant="default">{caseData.priority}</Badge>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Financial Impact</p>
                  <p className="font-mono text-forensic-text">{caseData.financial_impact ? formatCurrency(caseData.financial_impact) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">AI Confidence</p>
                  <p className="font-mono text-forensic-text">{caseData.ai_confidence ? `${Math.round(caseData.ai_confidence * 100)}%` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Created</p>
                  <p className="font-mono text-forensic-text">{formatTimestamp(caseData.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Updated</p>
                  <p className="font-mono text-forensic-text">{formatTimestamp(caseData.updated_at)}</p>
                </div>
              </div>
              {caseData.description && (
                <div className="pt-4 border-t border-forensic-border/50">
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-2">Description</p>
                  <p className="text-forensic-text">{caseData.description}</p>
                </div>
              )}
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/cases/${caseData.id}/board`}>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<Zap className="w-4 h-4" />}>
                    Open Trace Board
                  </Button>
                </Link>
                <Link href={`/cases/${caseData.id}/timeline`}>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<Clock className="w-4 h-4" />}>
                    View Timeline
                  </Button>
                </Link>
                <Link href={`/cases/${caseData.id}/network`}>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<Network className="w-4 h-4" />}>
                    View Network
                  </Button>
                </Link>
                <Link href={`/cases/${caseData.id}/reports`}>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<FileText className="w-4 h-4" />}>
                    Generate Report
                  </Button>
                </Link>
                <Link href={`/cases/${caseData.id}/ai`}>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<Zap className="w-4 h-4" />}>
                    Run AI Investigation
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">Investigation Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-forensic-text">Investigation Completeness</span>
                  <span className="font-mono text-forensic-accent">{Math.round(caseData.investigation_completeness * 100)}%</span>
                </div>
                <div className="h-2 bg-forensic-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forensic-accent transition-all duration-500"
                    style={{ width: `${caseData.investigation_completeness * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <p className="text-xs font-mono text-forensic-muted">Evidence Collected</p>
                  <p className="font-mono text-2xl text-forensic-text">{caseData.evidence_count}</p>
                </div>
                <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <p className="text-xs font-mono text-forensic-muted">Entities Resolved</p>
                  <p className="font-mono text-2xl text-forensic-text">{caseData.affected_entities_count}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );

    case 'evidence':
      return (
        <Card variant="default" padding="md">
          <Table
            columns={evidenceColumns}
            data={caseData.evidence || []}
            keyExtractor={(row) => row.id}
            emptyMessage="No evidence items found"
          />
        </Card>
      );

    case 'entities':
      return (
        <Card variant="default" padding="md">
          <Table
            columns={entityColumns}
            data={caseData.entities || []}
            keyExtractor={(row) => row.id}
            emptyMessage="No entities found"
          />
        </Card>
      );

    case 'transactions':
      return (
        <Card variant="default" padding="md">
          <Table
            columns={transactionColumns}
            data={caseData.transactions || []}
            keyExtractor={(row) => row.id}
            emptyMessage="No transactions found"
          />
        </Card>
      );

    case 'timeline':
      return (
        <Card variant="default" padding="md">
          <div className="space-y-3">
            {(caseData.timeline_events || []).map((event: any, index: number) => (
              <div
                key={event.id}
                className={cn(
                  'flex items-start gap-4 p-3 rounded-lg border transition-colors',
                  event.is_suspicious ? 'bg-red-900/10 border-red-500/30' : 'bg-forensic-bg/50 border-forensic-border/50'
                )}
              >
                <div className="flex flex-col items-center relative flex-shrink-0">
                  <div className={cn('w-3 h-3 rounded-full border-2', event.is_suspicious ? 'bg-red-500' : 'bg-forensic-accent')} />
                  {index < (caseData.timeline_events?.length || 0) - 1 && <div className="flex-1 w-0.5 bg-forensic-border/50" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-forensic-text">{event.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-forensic-muted font-mono">{formatTimestamp(event.timestamp)}</span>
                    {event.is_suspicious && <SignalBadge severity="high" size="xs" />}
                    <RiskBadge level={event.risk_score > 0.8 ? 'critical' : event.risk_score > 0.6 ? 'high' : event.risk_score > 0.3 ? 'medium' : 'low'} size="xs" />
                  </div>
                  <p className="text-forensic-text">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );

    case 'signals':
      return (
        <Card variant="default" padding="md">
          <div className="space-y-2">
            {(caseData.fraud_signals || []).map((signal: any) => (
              <div key={signal.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-forensic-text">{signal.signal_type.replace(/_/g, ' ')}</span>
                  <RiskBadge level={signal.severity} size="sm" />
                </div>
                <p className="text-sm text-forensic-muted">{signal.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {signal.evidence_ids.slice(0, 3).map((id: string) => <EvidenceBadge key={id} id={id} size="xs" />)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );

    case 'risk':
      return (
        <Card variant="default" padding="lg">
          {caseData.risk_scores?.map((score: any) => (
            <div key={score.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-forensic-text">Risk Assessment</h3>
                  <p className="text-forensic-muted">Latest risk calculation</p>
                </div>
                <RiskBadge level={score.risk_level} size="lg" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Overall Score</p>
                  <p className="font-mono text-3xl text-forensic-accent">{Math.round(score.overall_score * 100)}%</p>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Financial Exposure</p>
                  <p className="font-mono text-2xl text-forensic-text">{formatCurrency(score.financial_exposure)}</p>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Confidence</p>
                  <p className="font-mono text-2xl text-forensic-text">{Math.round(score.investigation_confidence * 100)}%</p>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Evidence Strength</p>
                  <p className="font-mono text-2xl text-forensic-text">{Math.round(score.evidence_strength * 100)}%</p>
                </div>
              </div>
            </div>
          ))}
        </Card>
      );

    case 'hypotheses':
      return (
        <Card variant="default" padding="md">
          <div className="space-y-4">
            {(caseData.hypotheses || []).map((hypothesis: any) => (
              <div key={hypothesis.id} className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-forensic-text">{hypothesis.title}</h3>
                    <p className="text-sm text-forensic-muted">{hypothesis.description}</p>
                  </div>
                  <Badge variant="confidence" value={hypothesis.confidence} size="md">{Math.round(hypothesis.confidence)}%</Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Supporting Evidence</p>
                    <div className="flex flex-wrap gap-1">
                      {hypothesis.supporting_evidence_ids.map((id: string) => <EvidenceBadge key={id} id={id} size="xs" />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Contradicting Evidence</p>
                    <div className="flex flex-wrap gap-1">
                      {hypothesis.contradicting_evidence_ids.map((id: string) => <Badge key={id} variant="default" size="xs" className="bg-red-900/30 border-red-500/30 text-red-400">{id}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Alternative</p>
                    <p className="text-forensic-muted">{hypothesis.alternative_explanation || 'None provided'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
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

function EditCaseForm({ caseData, onSuccess }: { caseData: any; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: caseData.title,
    description: caseData.description || '',
    case_type: caseData.case_type,
    priority: caseData.priority,
    status: caseData.status,
    risk_level: caseData.risk_level,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await casesService.updateCase(caseData.id, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to update case:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <select
          value={formData.case_type}
          onChange={e => setFormData({ ...formData, case_type: e.target.value })}
          className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        >
          <option value="ACCOUNT_TAKEOVER">Account Takeover</option>
          <option value="FRAUDULENT_TRANSACTION">Fraudulent Transaction</option>
          <option value="MONEY_LAUNDERING">Money Laundering</option>
          <option value="IDENTITY_THEFT">Identity Theft</option>
          <option value="INSIDER_THREAT">Insider Threat</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={formData.priority}
          onChange={e => setFormData({ ...formData, priority: e.target.value })}
          className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <select
          value={formData.status}
          onChange={e => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        >
          <option value="NEW">New</option>
          <option value="TRIAGING">Triage</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="EVIDENCE_REVIEW">Evidence Review</option>
          <option value="RECONSTRUCTING">Reconstructing</option>
          <option value="REMEDIATION">Remediation</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ESCALATED">Escalated</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={formData.risk_level}
          onChange={e => setFormData({ ...formData, risk_level: e.target.value })}
          className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        >
          <option value="VERY_LOW">Very Low</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" type="button" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" loading={submitting}>Save Changes</Button>
      </div>
    </form>
  );
}