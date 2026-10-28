"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { timelineService } from "@/lib/timeline";
import { TimelineEventItem, TimelineFilterParams, TimelineStats } from "@/types/timeline";
import { TimelineUpload } from "@/components/timeline/TimelineUpload";
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
} from "lucide-react";

const eventTypeColors: Record<string, string> = {
  LOGIN: "bg-blue-900/30 border-blue-500/30 text-blue-400",
  TRANSACTION: "bg-green-900/30 border-green-500/30 text-green-400",
  PASSWORD_CHANGE: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  DEVICE_REGISTRATION: "bg-purple-900/30 border-purple-500/30 text-purple-400",
  IP_CHANGE: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  LOCATION_CHANGE: "bg-teal-900/30 border-teal-500/30 text-teal-400",
  COMMUNICATION: "bg-indigo-900/30 border-indigo-500/30 text-indigo-400",
  ACCOUNT_CREATION: "bg-emerald-900/30 border-emerald-500/30 text-emerald-400",
  DOCUMENT_UPLOAD: "bg-violet-900/30 border-violet-500/30 text-violet-400",
  SUSPICIOUS_ACTIVITY: "bg-red-900/30 border-red-500/30 text-red-400",
  ALERT: "bg-red-900/30 border-red-500/30 text-red-400",
  INVESTIGATOR_ACTION: "bg-gray-900/30 border-gray-500/30 text-gray-400",
  AI_DISCOVERY: "bg-pink-900/30 border-pink-500/30 text-pink-400",
  PASSWORD_RESET: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  BENEFICIARY_ADDED: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  ACCOUNT_LOCK: "bg-red-900/30 border-red-500/30 text-red-400",
  MFA_CHANGE: "bg-blue-900/30 border-blue-500/30 text-blue-400",
  SESSION_START: "bg-cyan-900/30 border-cyan-500/30 text-cyan-400",
  SESSION_END: "bg-cyan-900/30 border-cyan-500/30 text-cyan-400",
};

export default function TimelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [events, setEvents] = useState<TimelineEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [suspiciousFilter, setSuspiciousFilter] = useState<boolean | null>(null);
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [allSources, setAllSources] = useState<string[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (typeFilter.length) params.append('event_type', typeFilter.join(','));
      if (suspiciousFilter !== null) params.append('is_suspicious', suspiciousFilter.toString());
      if (riskFilter.length) params.append('risk_level', riskFilter.join(','));

      const response = await timelineService.getEvents({
        search,
        event_type: typeFilter,
        is_suspicious: suspiciousFilter === null ? undefined : suspiciousFilter,
        min_risk_score: riskFilter.includes('CRITICAL') ? 0.8 :
                       riskFilter.includes('HIGH') ? 0.6 :
                       riskFilter.includes('MEDIUM') ? 0.3 :
                       riskFilter.includes('LOW') ? 0.1 : 0,
        page,
        page_size: pageSize,
      }, caseId || undefined);

      setEvents(response.items);
      setTotal(response.total);

      const types = Array.from(new Set(response.items.map(e => e.event_type)));
      const sources = Array.from(new Set(response.items.map(e => e.source).filter((s): s is string => Boolean(s))));
      setAllTypes(types);
      setAllSources(sources);
    } catch (error) {
      console.error("Failed to fetch timeline events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const data = await timelineService.getStats(caseId);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (caseId) fetchStats();
  }, [page, pageSize, search, typeFilter, riskFilter, suspiciousFilter, caseId]);

  const columns = useMemo(() => [
    { key: 'event_id', header: 'Event ID', render: (row: any) => <span className="font-mono text-forensic-accent">{row.event_id}</span> },
    { key: 'timestamp', header: 'Timestamp', render: (row: any) => <span className="font-mono text-forensic-muted">{formatTimestamp(row.timestamp)}</span> },
    { key: 'event_type', header: 'Type', render: (row: any) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", eventTypeColors[row.event_type] || "bg-forensic-border text-forensic-muted")}>{row.event_type}</span> },
    { key: 'description', header: 'Description', render: (row: any) => <span className="text-forensic-text truncate max-w-[300px]">{row.description}</span> },
    { key: 'risk_score', header: 'Risk', render: (row: any) => <RiskBadge level={row.risk_score >= 0.8 ? 'CRITICAL' : row.risk_score >= 0.6 ? 'HIGH' : row.risk_score >= 0.3 ? 'MEDIUM' : row.risk_score >= 0.1 ? 'LOW' : 'VERY_LOW'} size="sm" /> },
    { key: 'is_suspicious', header: 'Suspicious', render: (row: any) => row.is_suspicious ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-full bg-red-900/30 text-red-400">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-full bg-green-900/30 text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        No
      </span>
    )},
    { key: 'source', header: 'Source' },
    { key: 'created_at', header: 'Created', render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
  ], [eventTypeColors]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchEvents();
    if (caseId) fetchStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Timeline</h1>
          <p className="text-forensic-muted">Chronological view of case events and activities</p>
        </div>
        <div className="flex items-center gap-2">
          {caseId && (
            <>
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { fetchEvents(); fetchStats(); }}>
              Refresh
            </Button>
            <Button variant="primary" leftIcon={<Brain className="w-4 h-4" />} onClick={async () => {
              if (!caseId) return;
              await timelineService.analyzeTimeline(caseId);
              fetchEvents();
              fetchStats();
            }}>
              <Brain className="w-4 h-4 mr-2" />
              Analyze Timeline
            </Button>
            </>
          )}
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Event
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.total_events}</p>
            <p className="text-sm text-forensic-muted">Total Events</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.suspicious_events}</p>
            <p className="text-sm text-forensic-muted">Suspicious</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.temporal_correlations}</p>
            <p className="text-sm text-forensic-muted">Correlations</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.impossible_travel_incidents}</p>
            <p className="text-sm text-forensic-muted">Impossible Travel</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.by_risk_level.CRITICAL || 0}</p>
            <p className="text-sm text-forensic-muted">Critical Risk</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-orange-400 font-mono">{stats.by_risk_level.HIGH || 0}</p>
            <p className="text-sm text-forensic-muted">High Risk</p>
          </Card>
        </div>
      )}

      <div className="bg-forensic-surface border border-forensic-border rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
            <input
              type="text"
              placeholder="Search events by ID, description..."
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
            {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={suspiciousFilter !== null ? suspiciousFilter.toString() : ""}
            onChange={(e) => {
              const val = e.target.value;
              setSuspiciousFilter(val === "" ? null : val === "true");
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            <option value="">All</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Non-Suspicious</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={events}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No timeline events found"
        onRowClick={(row) => router.push(`/timeline/${row.id}`)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
        <div className="text-sm text-forensic-muted">
          Showing {events.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
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

      <TimelineUpload
        caseId={caseId || ""}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
}