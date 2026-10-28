"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { riskService } from "@/lib/risk";
import { FraudSignalItem, FraudSignalFilterParams, RiskScoreItem, RiskStats, RiskAssessmentRequest, HypothesisItem, HypothesisFilterParams } from "@/types/risk";
import { RiskUpload } from "@/components/risk/RiskUpload";
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
  Plus,
  Download,
  Upload,
  Clock,
  AlertTriangle as AlertTriangleIcon,
  Brain,
  Network,
  Zap,
  FileText,
  BarChart3,
  Share2,
  Shield,
  AlertCircle,
  Target,
  Gauge,
  Lightbulb,
  Search as SearchIcon,
} from "lucide-react";

const severityColors: Record<string, string> = {
  LOW: "bg-green-900/30 border-green-500/30 text-green-400",
  MEDIUM: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  HIGH: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  CRITICAL: "bg-red-900/30 border-red-500/30 text-red-400",
};

const riskLevelColors: Record<string, string> = {
  VERY_LOW: "bg-emerald-900/30 border-emerald-500/30 text-emerald-400",
  LOW: "bg-green-900/30 border-green-500/30 text-green-400",
  MEDIUM: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  HIGH: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  CRITICAL: "bg-red-900/30 border-red-500/30 text-red-400",
};

export default function RiskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [signals, setSignals] = useState<FraudSignalItem[]>([]);
  const [scores, setScores] = useState<RiskScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [fpFilter, setFpFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'signals' | 'scores' | 'hypotheses'>('signals');

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (typeFilter.length) params.append('signal_type', typeFilter.join(','));
      if (severityFilter.length) params.append('severity', severityFilter.join(','));
      if (fpFilter !== null) params.append('is_false_positive', fpFilter.toString());

      const response = await riskService.getSignals({
        search,
        signal_type: typeFilter,
        severity: severityFilter,
        is_false_positive: fpFilter === null ? undefined : fpFilter,
        page,
        page_size: pageSize,
      }, caseId || undefined);

      setSignals(response.items);
      setTotal(response.total);

      const types = Array.from(new Set(response.items.map(e => e.signal_type)));
      setAllTypes(types);
    } catch (error) {
      console.error("Failed to fetch fraud signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    if (!caseId) return;
    try {
      const response = await riskService.getScores(caseId);
      setScores(response.items);
    } catch (error) {
      console.error("Failed to fetch risk scores:", error);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const data = await riskService.getStats(caseId);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'signals') {
      fetchSignals();
    } else if (activeTab === 'scores') {
      fetchScores();
    }
    if (caseId) fetchStats();
  }, [page, pageSize, search, typeFilter, severityFilter, fpFilter, caseId, activeTab]);

  const signalColumns = [
    { key: 'signal_id', header: 'Signal ID', render: (row: FraudSignalItem) => <span className="font-mono text-forensic-accent">{row.signal_id}</span> },
    { key: 'signal_type', header: 'Type', render: (row: FraudSignalItem) => <Badge variant="default" size="sm">{row.signal_type.replace(/_/g, ' ')}</Badge> },
    { key: 'severity', header: 'Severity', render: (row: FraudSignalItem) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", severityColors[row.severity] || "bg-forensic-border text-forensic-muted")}>{row.severity}</span> },
    { key: 'reason', header: 'Reason', render: (row: FraudSignalItem) => <span className="text-forensic-text truncate max-w-[300px]">{row.reason}</span> },
    { key: 'deviation', header: 'Deviation', render: (row: FraudSignalItem) => <span className="font-mono text-forensic-text">{Math.round(row.deviation * 100)}%</span> },
    { key: 'confidence', header: 'Confidence', render: (row: FraudSignalItem) => <ConfidenceBadge confidence={row.confidence} size="sm" /> },
    { key: 'is_false_positive', header: 'False Positive', render: (row: FraudSignalItem) => row.is_false_positive ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-full bg-red-900/30 text-red-400">
        <XCircle className="w-3 h-3 mr-1" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-full bg-green-900/30 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        No
      </span>
    )},
    { key: 'created_at', header: 'Created', render: (row: FraudSignalItem) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
  ];

  const scoreColumns = [
    { key: 'overall_score', header: 'Score', render: (row: RiskScoreItem) => <RiskBadge level={row.risk_level} size="md" /> },
    { key: 'risk_level', header: 'Level', render: (row: RiskScoreItem) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", riskLevelColors[row.risk_level] || "bg-forensic-border text-forensic-muted")}>{row.risk_level}</span> },
    { key: 'financial_exposure', header: 'Exposure', render: (row: RiskScoreItem) => <span className="font-mono tabular-nums text-forensic-text">{formatCurrency(row.financial_exposure)}</span> },
    { key: 'evidence_strength', header: 'Evidence', render: (row: RiskScoreItem) => <span className="font-mono text-forensic-text">{Math.round(row.evidence_strength * 100)}%</span> },
    { key: 'investigation_confidence', header: 'Confidence', render: (row: RiskScoreItem) => <span className="font-mono text-forensic-text">{Math.round(row.investigation_confidence * 100)}%</span> },
    { key: 'fraud_probability', header: 'Fraud Prob.', render: (row: RiskScoreItem) => <span className="font-mono text-forensic-text">{Math.round(row.fraud_probability * 100)}%</span> },
    { key: 'false_positive_risk', header: 'FP Risk', render: (row: RiskScoreItem) => <span className="font-mono text-forensic-text">{Math.round(row.false_positive_risk * 100)}%</span> },
    { key: 'created_at', header: 'Created', render: (row: RiskScoreItem) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
  ];

  const handleSignalCreate = () => {
    setShowSignalModal(false);
    fetchSignals();
    if (caseId) fetchStats();
  };

  const handleAssessRisk = async () => {
    if (!caseId) return;
    try {
      await riskService.assessRisk({ case_id: caseId });
      fetchScores();
      fetchStats();
    } catch (error) {
      console.error("Risk assessment failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Risk Assessment</h1>
          <p className="text-forensic-muted">Monitor fraud signals and risk scores</p>
        </div>
        <div className="flex items-center gap-2">
          {caseId && (
            <>
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { 
              if (activeTab === 'signals') fetchSignals();
              else if (activeTab === 'scores') fetchScores();
              fetchStats();
            }}>
              Refresh
            </Button>
            <Button variant="primary" leftIcon={<Gauge className="w-4 h-4" />} onClick={handleAssessRisk}>
              <Gauge className="w-4 h-4 mr-2" />
              Assess Risk
            </Button>
            <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowSignalModal(true)}>
              Add Signal
            </Button>
            </>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.total_signals}</p>
            <p className="text-sm text-forensic-muted">Total Signals</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.by_level.CRITICAL || 0}</p>
            <p className="text-sm text-forensic-muted">Critical Risk</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-orange-400 font-mono">{stats.by_level.HIGH || 0}</p>
            <p className="text-sm text-forensic-muted">High Risk</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(stats.total_exposure)}</p>
            <p className="text-sm text-forensic-muted">Total Exposure</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{Math.round(stats.false_positive_rate * 100)}%</p>
            <p className="text-sm text-forensic-muted">False Positive Rate</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(stats.avg_score * 100)}%</p>
            <p className="text-sm text-forensic-muted">Avg Score</p>
          </Card>
        </div>
      )}

      <div className="border-b border-forensic-border/50">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Risk tabs">
          {[
            { id: 'signals', label: 'Fraud Signals', icon: AlertTriangle },
            { id: 'scores', label: 'Risk Scores', icon: Gauge },
            { id: 'hypotheses', label: 'Hypotheses', icon: Lightbulb },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
        {activeTab === 'signals' && (
          <>
          <div className="bg-forensic-surface border border-forensic-border rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
                <input
                  type="text"
                  placeholder="Search signals by ID, reason..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
                />
              </div>
              <select
                multiple
                value={typeFilter}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  setTypeFilter(selected);
                  setPage(1);
                }}
                className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
              >
                {allTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select
                multiple
                value={severityFilter}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  setSeverityFilter(selected);
                  setPage(1);
                }}
                className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
              >
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={fpFilter !== null ? fpFilter.toString() : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFpFilter(val === "" ? null : val === "true");
                  setPage(1);
                }}
                className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
              >
                <option value="">All</option>
                <option value="true">False Positives Only</option>
                <option value="false">Valid Signals</option>
              </select>
            </div>
          </div>

          <Table
            columns={signalColumns}
            data={signals}
            keyExtractor={(row) => row.id}
            loading={loading}
            emptyMessage="No fraud signals found"
          />

          <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
            <div className="text-sm text-forensic-muted">
              Showing {signals.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
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
          </>
        )}

        {activeTab === 'scores' && (
          <>
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="primary" leftIcon={<Gauge className="w-4 h-4" />} onClick={handleAssessRisk} disabled={!caseId}>
              Run Risk Assessment
            </Button>
          </div>

          <Table
            columns={scoreColumns}
            data={scores}
            keyExtractor={(row) => row.id}
            loading={loading}
            emptyMessage="No risk scores found. Run an assessment to generate scores."
          />

          <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
            <div className="text-sm text-forensic-muted">
              Showing {scores.length} scores
            </div>
          </div>
          </>
        )}

        {activeTab === 'hypotheses' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" leftIcon={<Lightbulb className="w-4 h-4" />} onClick={() => {}}>
                Create Hypothesis
              </Button>
            </div>
            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Hypothesis Management</h3>
              <p className="text-forensic-muted">Create and manage investigation hypotheses with supporting/contradicting evidence.</p>
            </Card>
          </div>
        )}
      </div>

      <RiskUpload
        caseId={caseId || ""}
        isOpen={showSignalModal}
        onClose={() => setShowSignalModal(false)}
        onSuccess={handleSignalCreate}
      />
    </div>
  );
}