"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatFileSize } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, EvidenceBadge, RiskBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { evidenceService } from "@/lib/evidence";
import { EvidenceItem, EvidenceFilterParams, EvidenceStats } from "@/types/evidence";
import { EvidenceUpload } from "@/components/evidence/EvidenceUpload";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Image,
  File,
  Database,
} from "lucide-react";

const evidenceTypeIcons: Record<string, any> = {
  CSV: FileText,
  JSON: Database,
  TXT: FileText,
  PDF: FileText,
  IMAGE: Image,
  LOG: FileText,
  TRANSACTION_EXPORT: Database,
  ACCOUNT_RECORD: Database,
  DEVICE_RECORD: Database,
  IP_LOG: FileText,
  COMMUNICATION_METADATA: FileText,
  DOCUMENT: FileText,
  BROWSER_FINGERPRINT: FileText,
  DEVICE_FINGERPRINT: FileText,
  OTHER: File,
};

const integrityColors: Record<string, string> = {
  VERIFIED: "text-green-400",
  WARNING: "text-yellow-400",
  CORRUPTED: "text-red-400",
  PENDING: "text-gray-400",
};

export default function EvidenceVaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [integrityFilter, setIntegrityFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [allSources, setAllSources] = useState<string[]>([]);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append('search', search);
      if (typeFilter.length) params.append('evidence_type', typeFilter.join(','));
      if (sourceFilter.length) params.append('source', sourceFilter.join(','));
      if (integrityFilter.length) params.append('integrity_status', integrityFilter.join(','));

      const response = await evidenceService.getEvidence({
        search,
        evidence_type: typeFilter,
        source: sourceFilter,
        integrity_status: integrityFilter,
        page,
        page_size: pageSize,
      }, caseId || undefined);

      setEvidence(response.items);
      setTotal(response.total);

      // Collect unique types and sources
      const types = Array.from(new Set(response.items.map(e => e.evidence_type)));
      const sources = Array.from(new Set(response.items.map(e => e.source)));
      setAllTypes(types);
      setAllSources(sources);
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const data = await evidenceService.getEvidenceStats(caseId);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchEvidence();
    if (caseId) fetchStats();
  }, [page, pageSize, search, typeFilter, sourceFilter, integrityFilter, caseId]);

  const columns = [
    { key: 'evidence_id', header: 'ID', render: (row: EvidenceItem) => <EvidenceBadge id={row.evidence_id} size="sm" /> },
    { key: 'original_filename', header: 'Filename', render: (row: EvidenceItem) => {
      const Icon = evidenceTypeIcons[row.evidence_type] || File;
      return (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-forensic-muted" />
          <span className="font-medium text-forensic-text truncate max-w-[300px]">{row.original_filename}</span>
        </div>
      );
    }},
    { key: 'evidence_type', header: 'Type', render: (row: EvidenceItem) => <Badge variant="default" size="sm">{row.evidence_type.replace(/_/g, ' ')}</Badge> },
    { key: 'source', header: 'Source' },
    { key: 'timestamp', header: 'Timestamp', render: (row: EvidenceItem) => <span className="font-mono text-forensic-muted">{row.timestamp ? formatTimestamp(row.timestamp) : '—'}</span> },
    { key: 'file_size', header: 'Size', render: (row: EvidenceItem) => <span className="font-mono text-forensic-text">{row.file_size ? formatFileSize(row.file_size) : '—'}</span> },
    { key: 'integrity_status', header: 'Integrity', render: (row: EvidenceItem) => (
      <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", integrityColors[row.integrity_status] || "text-forensic-muted")}>
        {row.integrity_status === 'VERIFIED' && <CheckCircle className="w-3 h-3 mr-1" />}
        {row.integrity_status === 'WARNING' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {row.integrity_status === 'CORRUPTED' && <XCircle className="w-3 h-3 mr-1" />}
        {row.integrity_status}
      </span>
    )},
    { key: 'reliability', header: 'Reliability', render: (row: EvidenceItem) => <ConfidenceBadge confidence={row.reliability} size="sm" /> },
    { key: 'imported_at', header: 'Imported', render: (row: EvidenceItem) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.imported_at)}</span> },
  ];

  const handleUploadSuccess = (evidence: EvidenceItem) => {
    setShowUploadModal(false);
    fetchEvidence();
    if (caseId) fetchStats();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Evidence Vault</h1>
          <p className="text-forensic-muted">Manage and analyze evidence items</p>
        </div>
        <div className="flex items-center gap-2">
          {caseId && (
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => { fetchEvidence(); fetchStats(); }}>
              Refresh
            </Button>
          )}
          <Button onClick={() => setShowUploadModal(true)} leftIcon={<FileText className="w-4 h-4" />}>
            Upload Evidence
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{stats.total}</p>
            <p className="text-sm text-forensic-muted">Total Items</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-forensic-text font-mono">{formatFileSize(stats.total_size_bytes)}</p>
            <p className="text-sm text-forensic-muted">Total Size</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-green-400 font-mono">{stats.integrity.VERIFIED || 0}</p>
            <p className="text-sm text-forensic-muted">Verified</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.integrity.WARNING || 0}</p>
            <p className="text-sm text-forensic-muted">Warning</p>
          </Card>
          <Card variant="elevated" padding="md" className="text-center">
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.integrity.CORRUPTED || 0}</p>
            <p className="text-sm text-forensic-muted">Corrupted</p>
          </Card>
        </div>
      )}

      <div className="bg-forensic-surface border border-forensic-border rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
            <input
              type="text"
              placeholder="Search evidence by ID, filename, source..."
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
            value={sourceFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setSourceFilter(selected);
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {allSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            multiple
            value={integrityFilter}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setIntegrityFilter(selected);
              setPage(1);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {Object.keys(integrityColors).map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={evidence}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No evidence items found"
        onRowClick={(row) => router.push(`/evidence/${row.id}`)}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
        <div className="text-sm text-forensic-muted">
          Showing {evidence.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
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

      <EvidenceUpload
        caseId={caseId || ""}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}