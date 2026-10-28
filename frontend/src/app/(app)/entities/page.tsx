"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { entitiesService } from "@/lib/entities";
import { EntityItem, EntityFilterParams, EntityStats, entityTypeOptions, riskLevelOptions } from "@/types/entities";
import { EntityUpload } from "@/components/entities/EntityUpload";
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
  Link2,
  Network,
  Users,
  Database,
  Globe,
  Mail,
  Smartphone,
  CreditCard,
  MapPin,
  FileText,
  Zap,
} from "lucide-react";

const entityTypeIcons: Record<string, any> = {
  USER: Users,
  ACCOUNT: Database,
  DEVICE: Smartphone,
  IP: Globe,
  EMAIL: Mail,
  PHONE: Smartphone,
  TRANSACTION: CreditCard,
  MERCHANT: Database,
  LOCATION: MapPin,
  DOCUMENT: FileText,
  EVENT: Zap,
  CASE: FileText,
};

const riskColors: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-green-400",
  VERY_LOW: "text-emerald-400",
};

export default function EntityVaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EntityStats | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [resolvedFilter, setResolvedFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (typeFilter.length) params.append('entity_type', typeFilter.join(','));
      if (riskFilter.length) params.append('risk_level', riskFilter.join(','));
      if (resolvedFilter !== null) params.append('is_resolved', resolvedFilter.toString());

      const response = await entitiesService.getEntities({
        search,
        entity_type: typeFilter,
        risk_level: riskFilter,
        is_resolved: resolvedFilter === null ? undefined : resolvedFilter,
        page,
        page_size: pageSize,
      }, caseId || undefined);

      setEntities(response.items);
      setTotal(response.total);

      const types = Array.from(new Set(response.items.map(e => e.entity_type)));
      setAllTypes(types);
    } catch (error) {
      console.error("Failed to fetch entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const data = await entitiesService.getEntityStats(caseId);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchEntities();
    if (caseId) fetchStats();
  }, [page, pageSize, search, typeFilter, riskFilter, resolvedFilter, caseId]);

  const columns = [
    { key: 'entity_id', header: 'ID', render: (row: EntityItem) => <span className="font-mono text-forensic-accent">{row.entity_id}</span> },
    { key: 'entity_type', header: 'Type', render: (row: EntityItem) => {
      const Icon = entityTypeIcons[row.entity_type] || Database;
      return (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-forensic-muted" />
          <span className="font-medium text-forensic-text">{row.entity_type}</span>
        </div>
      );
    }},
    { key: 'name', header: 'Name', render: (row: EntityItem) => <span className="text-forensic-text">{row.name || '—'}</span> },
    { key: 'value', header: 'Value', render: (row: EntityItem) => <span className="font-mono text-forensic-text truncate max-w-[200px]">{row.value || '—'}</span> },
    { key: 'risk_score', header: 'Risk Score', render: (row: EntityItem) => <span className="font-mono tabular-nums text-forensic-text">{Math.round(row.risk_score * 100)}%</span> },
    { key: 'risk_level', header: 'Risk', render: (row: EntityItem) => <RiskBadge level={row.risk_level} size="sm" /> },
    { key: 'confidence', header: 'Confidence', render: (row: EntityItem) => <span className="font-mono text-forensic-text">{Math.round(row.confidence * 100)}%</span> },
    { key: 'is_resolved', header: 'Resolved', render: (row: EntityItem) => (
      <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full",
        row.is_resolved ? "bg-green-900/30 text-green-400" : "bg-gray-900/30 text-gray-400"
      )}>
        {row.is_resolved ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
        {row.is_resolved ? 'Yes' : 'No'}
      </span>
    )},
    { key: 'last_seen', header: 'Last Seen', render: (row: EntityItem) => <span className="text-sm text-forensic-muted font-mono">{row.last_seen ? formatTimestamp(row.last_seen) : '—'}</span> },
    { key: 'created_at', header: 'Created', render: (row: EntityItem) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
  ];

  const handleCreateSuccess = (entity: EntityItem) => {
    setShowCreateModal(false);
    fetchEntities();
    if (caseId) fetchStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Entity Vault</h1>
          <p className="text-forensic-muted">Manage and resolve entities across cases</p>
        </div>
        <div className="flex items-center gap-2">
          {caseId && (
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { fetchEntities(); fetchStats(); }}>
              Refresh
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Users className="w-4 h-4" />}>
            New Entity
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.total}</p>
            <p className="text-sm text-forensic-muted">Total Entities</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-green-400 font-mono">{stats.resolved}</p>
            <p className="text-sm text-forensic-muted">Resolved</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-orange-400 font-mono">{stats.unresolved}</p>
            <p className="text-sm text-forensic-muted">Unresolved</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.relationships}</p>
            <p className="text-sm text-forensic-muted">Relationships</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.by_risk.CRITICAL || 0}</p>
            <p className="text-sm text-forensic-muted">Critical Risk</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.by_risk.HIGH || 0}</p>
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
              placeholder="Search entities by ID, name, value..."
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
            multiple
            value={riskFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setRiskFilter(selected);
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {riskLevelOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={resolvedFilter !== null ? resolvedFilter.toString() : ""}
            onChange={(e) => {
              const val = e.target.value;
              setResolvedFilter(val === "" ? null : val === "true");
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            <option value="">All</option>
            <option value="true">Resolved</option>
            <option value="false">Unresolved</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={entities}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No entities found"
        onRowClick={(row) => router.push(`/entities/${row.id}`)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
        <div className="text-sm text-forensic-muted">
          Showing {entities.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
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

      <EntityUpload
        caseId={caseId || ""}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}