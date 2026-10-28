'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime, formatTimestamp, formatBytes, cn } from '@/lib/utils';
import {
  Card,
  Table,
  Badge,
  Button,
} from '@/components/ui';
import {
  Activity,
  AlertCircle,
  FileText as CaseIcon,
  Users,
  Database,
  DollarSign,
  Clock,
  Shield,
  Search,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  Network,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import { RiskBadge } from '@/components/risk/RiskComponents';

interface DashboardStats {
  total_cases: number;
  active_cases: number;
  total_evidence: number;
  total_entities: number;
  total_transactions: number;
  avg_risk_score: number;
  open_alerts: number;
  timeline_events: number;
}

interface Alert {
  type: 'critical' | 'warning';
  message: string;
  count: number;
}

interface RecentCase {
  id: string;
  case_id: string;
  title: string;
  status: string;
  risk_level: string;
  created_at: string;
}

interface RecentEvidence {
  id: string;
  evidence_id: string;
  original_filename: string;
  evidence_type: string;
  integrity_status: string;
  imported_at: string;
}

interface RecentEntity {
  id: string;
  entity_id: string;
  entity_type: string;
  risk_level: string;
  created_at: string;
}

interface RecentTransaction {
  id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
}

interface CaseStats {
  total: number;
  by_status: Record<string, number>;
  by_risk: Record<string, number>;
  avg_completeness: number;
}

interface EntityStats {
  total: number;
  resolved: number;
  unresolved: number;
  relationships: number;
  by_type: Record<string, number>;
  by_risk: Record<string, number>;
}

interface EvidenceStats {
  total: number;
  total_size_bytes: number;
  integrity: Record<string, number>;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
}

interface TransactionStats {
  total: number;
  total_amount: number;
  avg_amount: number;
  max_amount: number;
  by_status: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_currency: Record<string, number>;
}

interface TimelineStats {
  total_events: number;
  suspicious_events: number;
  correlations: number;
  impossible_travel_incidents: number;
  by_type: Record<string, number>;
  by_source: Record<string, number>;
}

interface RiskStats {
  by_level: Record<string, number>;
  signals_by_severity: Record<string, number>;
  signals_by_type: Record<string, number>;
  false_positive_rate: number;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-900/30 text-green-400 border-green-500/30',
  IN_PROGRESS: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  PENDING_REVIEW: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  CLOSED: 'bg-gray-700 text-gray-400 border-gray-500/30',
  RESOLVED: 'bg-purple-900/30 text-purple-400 border-purple-500/30',
};

const riskLevelColors: Record<string, string> = {
  CRITICAL: 'bg-red-900/30 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-900/30 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-green-900/30 text-green-400 border-green-500/30',
  VERIFIED: 'bg-green-900/30 text-green-400 border-green-500/30',
  WARNING: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
  CORRUPTED: 'bg-red-900/30 text-red-400 border-red-500/30',
};

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cases', label: 'Cases', icon: CaseIcon },
  { id: 'entities', label: 'Entities', icon: Users },
  { id: 'evidence', label: 'Evidence', icon: Database },
  { id: 'transactions', label: 'Transactions', icon: DollarSign },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'risk', label: 'Risk', icon: Shield },
];

const statsCards = [
  { label: 'Total Cases', value: 0, icon: CaseIcon, color: 'text-forensic-accent', trend: '+12%', trendIcon: TrendingUp },
  { label: 'Active Investigations', value: 0, icon: Activity, color: 'text-blue-400', trend: '+5%', trendIcon: TrendingUp },
  { label: 'Total Evidence', value: 0, icon: FileText, color: 'text-purple-400', trend: '+23%', trendIcon: TrendingUp },
  { label: 'Total Entities', value: 0, icon: Users, color: 'text-orange-400', trend: '+8%', trendIcon: TrendingUp },
  { label: 'Transaction Volume', value: '$0.00', icon: DollarSign, color: 'text-green-400', trend: '+15%', trendIcon: TrendingUp },
  { label: 'Avg Risk Score', value: 0, icon: Shield, color: 'text-red-400', trend: '-2%', trendIcon: TrendingDown },
  { label: 'Open Alerts', value: 0, icon: AlertTriangle, color: 'text-yellow-400', trend: '+3', trendIcon: TrendingUp },
  { label: 'Timeline Events', value: 0, icon: Clock, color: 'text-cyan-400', trend: '+42%', trendIcon: TrendingUp },
];

const recentAlerts: Alert[] = [
  { type: 'critical', message: '3 entities with CRITICAL risk score detected', count: 3 },
  { type: 'warning', message: 'Velocity anomaly: 50+ transactions in 1 hour', count: 1 },
  { type: 'warning', message: 'Impossible travel detected for entity_042', count: 2 },
];

function OverviewTab({ recentCases, recentEvidence, recentEntities, recentTransactions }: {
  recentCases: RecentCase[];
  recentEvidence: RecentEvidence[];
  recentEntities: RecentEntity[];
  recentTransactions: RecentTransaction[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Recent Cases</h3>
          <Table
            columns={[
              { key: 'case_id', header: 'Case ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.case_id}</span> },
              { key: 'title', header: 'Title' },
              { key: 'status', header: 'Status', render: (row: any) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", statusColors[row.status] || "bg-forensic-border text-forensic-muted")}>{row.status}</span> },
              { key: 'risk_level', header: 'Risk', render: (row: any) => <RiskBadge level={row.risk_level} size="sm" /> },
              { key: 'created_at', header: 'Created', render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
            ]}
            data={recentCases}
            keyExtractor={(row) => row.id}
            emptyMessage="No recent cases"
          />
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Recent Evidence</h3>
          <Table
            columns={[
              { key: 'evidence_id', header: 'ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.evidence_id}</span> },
              { key: 'original_filename', header: 'Filename' },
              { key: 'evidence_type', header: 'Type', render: (row: any) => <Badge variant="default" size="sm">{row.evidence_type}</Badge> },
              { key: 'integrity_status', header: 'Integrity', render: (row: any) => <Badge variant="default" size="sm" className={riskLevelColors[row.integrity_status] || ""}>{row.integrity_status}</Badge> },
              { key: 'imported_at', header: 'Imported', render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.imported_at)}</span> },
            ]}
            data={recentEvidence}
            keyExtractor={(row) => row.id}
            emptyMessage="No recent evidence"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Recent Entities</h3>
          <Table
            columns={[
              { key: 'entity_id', header: 'ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.entity_id}</span> },
              { key: 'entity_type', header: 'Type', render: (row: any) => <Badge variant="default" size="sm">{row.entity_type}</Badge> },
              { key: 'risk_level', header: 'Risk', render: (row: any) => <RiskBadge level={row.risk_level} size="sm" /> },
              { key: 'created_at', header: 'Created', render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
            ]}
            data={recentEntities}
            keyExtractor={(row) => row.id}
            emptyMessage="No recent entities"
          />
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Recent Transactions</h3>
          <Table
            columns={[
              { key: 'transaction_id', header: 'ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.transaction_id}</span> },
              { key: 'amount', header: 'Amount', render: (row: any) => <span className="font-mono tabular-nums">{formatCurrency(row.amount, row.currency)}</span> },
              { key: 'status', header: 'Status', render: (row: any) => <Badge variant="default" size="sm">{row.status}</Badge> },
              { key: 'timestamp', header: 'Time', render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatTimestamp(row.timestamp)}</span> },
            ]}
            data={recentTransactions}
            keyExtractor={(row) => row.id}
            emptyMessage="No recent transactions"
          />
        </Card>
      </div>
    </div>
  );
}

function CasesTab({ caseStats }: { caseStats: CaseStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Case Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Total</p>
            <p className="font-mono text-2xl text-forensic-text">{caseStats?.total || 0}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Open</p>
            <p className="font-mono text-2xl text-forensic-text">{Object.entries(caseStats?.by_status || {}).reduce((sum, [_, v]) => sum + v, 0) - (caseStats?.by_status?.CLOSED || 0) - (caseStats?.by_status?.RESOLVED || 0)}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">By Risk</p>
            <p className="font-mono text-2xl text-forensic-text">{Object.values(caseStats?.by_risk || {}).reduce((a, b) => a + b, 0)}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Avg Completeness</p>
            <p className="font-mono text-2xl text-forensic-text">{Math.round((caseStats?.avg_completeness || 0) * 100)}%</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Status</h3>
          <div className="space-y-2">
            {Object.entries(caseStats?.by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", statusColors[status] || "bg-forensic-border text-forensic-muted")}>{status}</span>
                <span className="font-mono text-forensic-text">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Risk Level</h3>
          <div className="space-y-2">
            {Object.entries(caseStats?.by_risk || {}).map(([risk, count]) => (
              <div key={risk} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <RiskBadge level={risk} size="sm" />
                <span className="font-mono text-forensic-text">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EntitiesTab({ entityStats }: { entityStats: EntityStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Entity Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Total Entities</p>
            <p className="font-mono text-2xl text-forensic-text">{entityStats?.total || 0}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Resolved</p>
            <p className="font-mono text-2xl text-green-400">{entityStats?.resolved || 0}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Unresolved</p>
            <p className="font-mono text-2xl text-orange-400">{entityStats?.unresolved || 0}</p>
          </div>
          <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
            <p className="text-xs font-mono text-forensic-muted">Relationships</p>
            <p className="font-mono text-2xl text-forensic-text">{entityStats?.relationships || 0}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card variant="default" padding="md">
            <h4 className="font-semibold text-forensic-text mb-3">By Type</h4>
            <div className="space-y-2">
              {Object.entries(entityStats?.by_type || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-forensic-text">{type}</span>
                  <span className="font-mono text-forensic-accent">{count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="default" padding="md">
            <h4 className="font-semibold text-forensic-text mb-3">By Risk</h4>
            <div className="space-y-2">
              {Object.entries(entityStats?.by_risk || {}).map(([risk, count]) => (
                <div key={risk} className="flex items-center justify-between">
                  <RiskBadge level={risk} size="sm" />
                  <span className="font-mono text-forensic-text">{count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}

function EvidenceTab({ evidenceStats }: { evidenceStats: EvidenceStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Evidence Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{evidenceStats?.total || 0}</p>
            <p className="text-sm text-forensic-muted">Total Items</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{evidenceStats?.total_size_bytes ? formatBytes(evidenceStats.total_size_bytes) : '0 B'}</p>
            <p className="text-sm text-forensic-muted">Total Size</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-green-400 font-mono">{evidenceStats?.integrity?.VERIFIED || 0}</p>
            <p className="text-sm text-forensic-muted">Verified</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-yellow-400 font-mono">{evidenceStats?.integrity?.WARNING || 0}</p>
            <p className="text-sm text-forensic-muted">Warning</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{evidenceStats?.integrity?.CORRUPTED || 0}</p>
            <p className="text-sm text-forensic-muted">Corrupted</p>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Type</h3>
          <div className="space-y-2">
            {Object.entries(evidenceStats?.by_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <span className="text-forensic-text">{type}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Source</h3>
          <div className="space-y-2">
            {Object.entries(evidenceStats?.by_source || {}).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <span className="text-forensic-text">{source}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TransactionsTab({ transactionStats }: { transactionStats: TransactionStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Transaction Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{transactionStats?.total || 0}</p>
            <p className="text-sm text-forensic-muted">Total Transactions</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(transactionStats?.total_amount || 0)}</p>
            <p className="text-sm text-forensic-muted">Total Volume</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(transactionStats?.avg_amount || 0)}</p>
            <p className="text-sm text-forensic-muted">Avg Amount</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatCurrency(transactionStats?.max_amount || 0)}</p>
            <p className="text-sm text-forensic-muted">Max Amount</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{Object.values(transactionStats?.by_currency || {}).reduce((a, b) => a + b, 0)}</p>
            <p className="text-sm text-forensic-muted">Currencies</p>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Status</h3>
          <div className="space-y-2">
            {Object.entries(transactionStats?.by_status || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <span className="text-forensic-text">{status}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">By Risk Level</h3>
          <div className="space-y-2">
            {Object.entries(transactionStats?.by_risk_level || {}).map(([risk, count]) => (
              <div key={risk} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <RiskBadge level={risk} size="sm" />
                <span className="font-mono text-forensic-text">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TimelineTab({ timelineStats }: { timelineStats: TimelineStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Timeline Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{timelineStats?.total_events || 0}</p>
            <p className="text-sm text-forensic-muted">Total Events</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{timelineStats?.suspicious_events || 0}</p>
            <p className="text-sm text-forensic-muted">Suspicious</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-orange-400 font-mono">{timelineStats?.correlations || 0}</p>
            <p className="text-sm text-forensic-muted">Correlations</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{timelineStats?.impossible_travel_incidents || 0}</p>
            <p className="text-sm text-forensic-muted">Impossible Travel</p>
          </Card>
        </div>
      </Card>

      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">By Event Type</h3>
        <div className="space-y-2">
          {Object.entries(timelineStats?.by_type || {}).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <span className="text-forensic-text">{type.replace(/_/g, ' ')}</span>
              <Badge variant="default" size="sm">{count}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">By Source</h3>
        <div className="space-y-2">
          {Object.entries(timelineStats?.by_source || {}).map(([source, count]) => (
            <div key={source} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <span className="text-forensic-text">{source}</span>
              <Badge variant="default" size="sm">{count}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RiskTab({ riskStats }: { riskStats: RiskStats | undefined }) {
  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Risk Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{riskStats?.by_level?.CRITICAL || 0}</p>
            <p className="text-sm text-forensic-muted">Critical</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-orange-400 font-mono">{riskStats?.by_level?.HIGH || 0}</p>
            <p className="text-sm text-forensic-muted">High</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-yellow-400 font-mono">{riskStats?.by_level?.MEDIUM || 0}</p>
            <p className="text-sm text-forensic-muted">Medium</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-green-400 font-mono">{riskStats?.by_level?.LOW || 0}</p>
            <p className="text-sm text-forensic-muted">Low</p>
          </Card>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Signals by Severity</h3>
          <div className="space-y-2">
            {Object.entries(riskStats?.signals_by_severity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <RiskBadge level={severity} size="sm" />
                <span className="text-forensic-text">{severity.replace(/_/g, ' ')}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Signals by Type</h3>
          <div className="space-y-2">
            {Object.entries(riskStats?.signals_by_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                <span className="text-forensic-text">{type.replace(/_/g, ' ')}</span>
                <Badge variant="default" size="sm">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">False Positive Rate</h3>
        <div className="text-center">
          <p className="text-4xl font-bold text-forensic-text font-mono">{riskStats?.false_positive_rate ? (riskStats.false_positive_rate * 100).toFixed(1) : 0}%</p>
          <p className="text-sm text-forensic-muted mt-2">of signals marked as false positive</p>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [cases, evidence, entities, transactions, timeline, risk] = await Promise.all([
        api.get<any>('/cases/stats/summary'),
        api.get<any>('/evidence/stats/summary'),
        api.get<any>('/entities/stats/summary'),
        api.get<any>('/transactions/stats/summary'),
        api.get<any>('/timeline/stats/summary'),
        api.get<any>('/risk/stats/summary'),
      ]);
      return {
        total_cases: cases.data?.total || 0,
        active_cases: cases.data?.by_status?.OPEN || 0,
        total_evidence: evidence.data?.total || 0,
        total_entities: entities.data?.total || 0,
        total_transactions: transactions.data?.total || 0,
        avg_risk_score: risk.data?.avg_score || 0,
        open_alerts: risk.data?.by_severity?.CRITICAL || 0,
        timeline_events: timeline.data?.total_events || 0,
      };
    },
  });

  const { data: recentCases } = useQuery<RecentCase[]>({
    queryKey: ['recent-cases'],
    queryFn: async () => {
      const response = await api.get<any>('/cases/?page_size=5&sort_by=created_at&sort_order=desc');
      return response.data?.items || [];
    },
  });

  const { data: recentEvidence } = useQuery<RecentEvidence[]>({
    queryKey: ['recent-evidence'],
    queryFn: async () => {
      const response = await api.get<any>('/evidence/?page_size=5&sort_by=imported_at&sort_order=desc');
      return response.data?.items || [];
    },
  });

  const { data: recentEntities } = useQuery<RecentEntity[]>({
    queryKey: ['recent-entities'],
    queryFn: async () => {
      const response = await api.get<any>('/entities/?page_size=5&sort_by=created_at&sort_order=desc');
      return response.data?.items || [];
    },
  });

  const { data: recentTransactions } = useQuery<RecentTransaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await api.get<any>('/transactions/?page_size=5&sort_by=timestamp&sort_order=desc');
      return response.data?.items || [];
    },
  });

  const { data: caseStats } = useQuery<CaseStats>({
    queryKey: ['case-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/cases/stats/summary');
      return response.data;
    },
  });

  const { data: entityStats } = useQuery<EntityStats>({
    queryKey: ['entity-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/entities/stats/summary');
      return response.data;
    },
  });

  const { data: evidenceStats } = useQuery<EvidenceStats>({
    queryKey: ['evidence-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/evidence/stats/summary');
      return response.data;
    },
  });

  const { data: transactionStats } = useQuery<TransactionStats>({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/transactions/stats/summary');
      return response.data;
    },
  });

  const { data: timelineStats } = useQuery<TimelineStats>({
    queryKey: ['timeline-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/timeline/stats/summary');
      return response.data;
    },
  });

  const { data: riskStats } = useQuery<RiskStats>({
    queryKey: ['risk-stats'],
    queryFn: async () => {
      const response = await api.get<any>('/risk/stats/summary');
      return response.data;
    },
  });

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab recentCases={recentCases || []} recentEvidence={recentEvidence || []} recentEntities={recentEntities || []} recentTransactions={recentTransactions || []} />;
      case 'cases':
        return <CasesTab caseStats={caseStats} />;
      case 'entities':
        return <EntitiesTab entityStats={entityStats} />;
      case 'evidence':
        return <EvidenceTab evidenceStats={evidenceStats} />;
      case 'transactions':
        return <TransactionsTab transactionStats={transactionStats} />;
      case 'timeline':
        return <TimelineTab timelineStats={timelineStats} />;
      case 'risk':
        return <RiskTab riskStats={riskStats} />;
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

  return (
    <div className="min-h-screen bg-forensic-bg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-forensic-text">Dashboard</h1>
            <p className="text-forensic-muted mt-1">Overview of your fraud investigation platform</p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {recentAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-forensic-text mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Alerts
            </h2>
            <div className="space-y-2">
              {recentAlerts.map((alert, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-lg border flex items-center gap-3",
                  alert.type === 'critical' 
                    ? "bg-red-900/30 border-red-500/30 text-red-400" 
                    : "bg-yellow-900/30 border-yellow-500/30 text-yellow-400"
                )}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{alert.message}</span>
                  <Badge variant="default" size="sm" className="ml-auto">{alert.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          {statsCards.map((stat, i) => (
            <Card key={i} variant="elevated" padding="md" className="text-center">
              <stat.icon className={cn('w-6 h-6 mx-auto mb-2', stat.color)} />
              <p className="text-2xl font-bold text-forensic-text font-mono">{stat.value}</p>
              <p className="text-sm text-forensic-muted">{stat.label}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <stat.trendIcon className={cn('w-4 h-4', stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400')} />
                <span className={cn('text-xs font-mono', stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400')}>{stat.trend}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="border-b border-forensic-border/50">
          <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Dashboard tabs">
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
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}