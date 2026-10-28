"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { casesService } from "@/lib/cases";
import { Case, CasesListResponse, CaseFilterParams } from "@/types/cases";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FolderOpen,
  AlertTriangle,
  Zap,
  Download,
  ArrowRight,
} from "lucide-react";

const statusOptions = ["NEW", "TRIAGING", "INVESTIGATING", "EVIDENCE_REVIEW", "RECONSTRUCTING", "REMEDIATION", "UNDER_REVIEW", "RESOLVED", "ESCALATED", "CLOSED"];
const riskOptions = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "VERY_LOW"];

interface CaseItem {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  case_type: string;
  priority: string;
  risk_level: string;
  status: string;
  financial_impact: number | null;
  affected_entities_count: number;
  evidence_count: number;
  ai_confidence: number | null;
  investigation_completeness: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface CasesResponse {
  items: CaseItem[];
  total: number;
  page: number;
  page_size: number;
}

function StatusCell({ status }: { status: string }) {
  const styles = {
    CRITICAL: "bg-red-900/30 text-red-400",
    HIGH: "bg-orange-900/30 text-orange-400",
    MEDIUM: "bg-yellow-900/30 text-yellow-400",
    DEFAULT: "bg-green-900/30 text-green-400",
  };
  const style = styles[status as keyof typeof styles] || styles.DEFAULT;
  return (
    <span className={"inline-flex items-center px-2 py-1 text-xs font-mono rounded-full " + style}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function RiskCell({ risk }: { risk: string }) {
  const styles = {
    CRITICAL: "bg-red-900/30 text-red-400 border border-red-500/30",
    HIGH: "bg-orange-900/30 text-orange-400 border border-orange-500/30",
    MEDIUM: "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30",
    LOW: "bg-green-900/30 text-green-400 border border-green-500/30",
    VERY_LOW: "bg-green-900/30 text-green-400 border border-green-500/30",
    DEFAULT: "bg-green-900/30 text-green-400 border border-green-500/30",
  };
  const style = styles[risk as keyof typeof styles] || styles.DEFAULT;
  return (
    <span className={"inline-flex items-center px-2 py-1 text-xs font-mono rounded-full " + style}>
      {risk}
    </span>
  );
}

function ActionCell({ row, router, setDeleteConfirm }: { row: any; router: any; setDeleteConfirm: any }) {
  return (
    <select
      value=""
      onChange={e => {
        const value = e.target.value;
        if (value === "open") router.push(`/cases/${row.id}`);
        else if (value === "board") router.push(`/cases/${row.id}/board`);
        else if (value === "delete") setDeleteConfirm({ case: row, open: true });
        e.target.value = "";
      }}
      className="w-full px-2 py-1 bg-transparent text-forensic-text text-sm"
    >
      <option value="" disabled>Actions</option>
      <option value="open">Open Case</option>
      <option value="board">Trace Board</option>
      <option value="delete">Delete</option>
    </select>
  );
}

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ case: any | null; open: boolean }>({ case: null, open: false });
  const [createFormData, setCreateFormData] = useState({
    case_id: "",
    title: "",
    description: "",
    case_type: "OTHER",
    priority: "MEDIUM",
  });
  const [creating, setCreating] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      if (search) params.append("search", search);
      if (statusFilter.length) params.append("status", statusFilter.join(","));
      if (riskFilter.length) params.append("risk_level", riskFilter.join(","));

      const response = await casesService.getCases({page: page, page_size: pageSize, search: search, status: statusFilter, risk_level: riskFilter});
      setCases(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch cases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, [page, pageSize, search, statusFilter, riskFilter]);

  const handleCreateCase = async () => {
    setCreating(true);
    try {
      await casesService.createCase(createFormData);
      setShowCreateModal(false);
      fetchCases();
    } catch (error) {
      console.error("Failed to create case:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (caseItem: any) => {
    try {
      await casesService.deleteCase(caseItem.id);
      fetchCases();
      setDeleteConfirm({ case: null, open: false });
    } catch (error) { console.error("Failed to delete case:", error); }
  };

  const columns = [
    { key: "case_id", header: "Case ID", render: (row: any) => <Link href={"/cases/" + row.id} className="font-mono text-forensic-accent hover:underline">{row.case_id}</Link> },
    { key: "title", header: "Title", render: (row: any) => <Link href={"/cases/" + row.id} className="font-medium text-forensic-text hover:text-forensic-accent">{row.title}</Link> },
    { key: "case_type", header: "Type", render: (row: any) => <span className="text-xs font-mono text-forensic-text">{row.case_type.replace(/_/g, " ")}</span> },
    { key: "status", header: "Status", render: (row: any) => <StatusCell status={row.status} /> },
    { key: "risk_level", header: "Risk", render: (row: any) => <RiskCell risk={row.risk_level} /> },
    { key: "priority", header: "Priority", render: (row: any) => <span className="text-xs font-mono text-forensic-text">{row.priority}</span> },
    { key: "evidence_count", header: "Evidence", align: "center" as const, render: (row: any) => <span className="font-mono text-forensic-text">{row.evidence_count}</span> },
    { key: "created_at", header: "Created", align: "center" as const, render: (row: any) => <span className="text-sm text-forensic-muted font-mono">{formatRelativeTime(row.created_at)}</span> },
    { key: "actions", header: "Actions", align: "center" as const, render: (row: any) => <ActionCell row={row} router={router} setDeleteConfirm={setDeleteConfirm} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Cases</h1>
          <p className="text-forensic-muted">Manage and investigate fraud cases</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>New Case</Button>
      </div>

      <div className="bg-forensic-surface border border-forensic-border rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
            <input type="text" placeholder="Search cases by ID, title, type..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" />
          </div>
          <select
            multiple
            value={statusFilter}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setStatusFilter(selected);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select
            multiple
            value={riskFilter}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              setRiskFilter(selected);
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {riskOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={cases}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyMessage="No cases found"
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
        <div className="text-sm text-forensic-muted">
          Showing {cases.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          >
            {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}
          </select>
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
          <button onClick={() => setPage(page + 1)} disabled={page * pageSize >= total} className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{display: showCreateModal ? "flex" : "none"}}>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
        <div className="relative w-full max-w-md bg-forensic-surface border border-forensic-border rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-forensic-text mb-4">Create New Case</h2>
          <form onSubmit={e => { e.preventDefault(); handleCreateCase(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-forensic-text mb-1">Case ID</label>
                <input type="text" placeholder="TX-2048" value={createFormData.case_id} onChange={e => setCreateFormData({ ...createFormData, case_id: e.target.value })} required className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-forensic-text mb-1">Title</label>
                <input type="text" placeholder="Case title" value={createFormData.title} onChange={e => setCreateFormData({ ...createFormData, title: e.target.value })} required className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-forensic-text mb-1">Description</label>
              <textarea placeholder="Case description" value={createFormData.description} onChange={e => setCreateFormData({ ...createFormData, description: e.target.value })} className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select value={createFormData.case_type} onChange={e => setCreateFormData({ ...createFormData, case_type: e.target.value })} className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50">
                <option value="ACCOUNT_TAKEOVER">Account Takeover</option>
                <option value="FRAUDULENT_TRANSACTION">Fraudulent Transaction</option>
                <option value="MONEY_LAUNDERING">Money Laundering</option>
                <option value="IDENTITY_THEFT">Identity Theft</option>
                <option value="INSIDER_THREAT">Insider Threat</option>
                <option value="OTHER">Other</option>
              </select>
              <select value={createFormData.priority} onChange={e => setCreateFormData({ ...createFormData, priority: e.target.value })} className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text hover:bg-forensic-elevated">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 bg-forensic-accent text-forensic-bg font-semibold rounded-lg hover:bg-forensic-accent/90 disabled:opacity-50">Create Case</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}