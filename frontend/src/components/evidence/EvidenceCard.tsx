'use client';

import { ReactNode } from 'react';
import { cn, formatTimestamp, formatRelativeTime } from '@/lib/utils';
import { Badge, EvidenceBadge, IntegrityBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  FileSpreadsheet,
  Image,
  Database,
  Clock,
  Hash,
  Link2,
  Tag,
  Flag,
  Eye,
  Download,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  History,
} from 'lucide-react';

export interface EvidenceItem {
  id: string;
  evidenceId: string;
  type: string;
  source: string;
  originalFilename: string;
  timestamp?: string;
  importedAt: string;
  hash: string;
  integrityStatus: 'VERIFIED' | 'WARNING' | 'CORRUPTED' | 'PENDING';
  reliability: number;
  relevance: number;
  classification: string;
  fileSize?: number;
  mimeType?: string;
  entityReferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  linkedEntities?: string[];
  linkedEvents?: string[];
  notes?: string;
}

const typeIcons: Record<string, ReactNode> = {
  CSV: <FileSpreadsheet className="w-5 h-5 text-green-400" />,
  JSON: <FileText className="w-5 h-5 text-blue-400" />,
  TXT: <FileText className="w-5 h-5 text-gray-400" />,
  PDF: <FileText className="w-5 h-5 text-red-400" />,
  IMAGE: <Image className="w-5 h-5 text-purple-400" />,
  LOG: <Database className="w-5 h-5 text-orange-400" />,
  TRANSACTION_EXPORT: <FileSpreadsheet className="w-5 h-5 text-yellow-400" />,
  ACCOUNT_RECORD: <FileText className="w-5 h-5 text-cyan-400" />,
  DEVICE_RECORD: <Database className="w-5 h-5 text-pink-400" />,
  IP_LOG: <Database className="w-5 h-5 text-indigo-400" />,
  COMMUNICATION_METADATA: <FileText className="w-5 h-5 text-emerald-400" />,
  DOCUMENT: <FileText className="w-5 h-5 text-amber-400" />,
  BROWSER_FINGERPRINT: <Database className="w-5 h-5 text-violet-400" />,
  DEVICE_FINGERPRINT: <Database className="w-5 h-5 text-rose-400" />,
  DEFAULT: <FileText className="w-5 h-5 text-forensic-muted" />,
};

export function EvidenceCard({
  evidence,
  variant = 'default',
  onClick,
  onView,
  onLink,
  onTag,
  onCompare,
  onExport,
  onFlag,
  showActions = true,
  compact = false,
}: {
  evidence: EvidenceItem;
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
  onView?: () => void;
  onLink?: () => void;
  onTag?: () => void;
  onCompare?: () => void;
  onExport?: () => void;
  onFlag?: () => void;
  showActions?: boolean;
  compact?: boolean;
}) {
  const Icon = typeIcons[evidence.type] || typeIcons.DEFAULT;
  const isCompact = compact || variant === 'compact';
  const isDetailed = variant === 'detailed';

  const integrityIcon = {
    VERIFIED: <CheckCircle className="w-4 h-4 text-green-400" />,
    WARNING: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    CORRUPTED: <XCircle className="w-4 h-4 text-red-400" />,
    PENDING: <HelpCircle className="w-4 h-4 text-blue-400" />,
  };

  if (isCompact) {
    return (
      <div
        className={cn(
          'evidence-card flex items-center gap-3 p-3',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-forensic-bg rounded-lg flex items-center justify-center">
          {Icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <EvidenceBadge id={evidence.evidenceId} size="sm" />
            <span className="text-sm font-medium text-forensic-text truncate">{evidence.originalFilename}</span>
            <IntegrityBadge status={evidence.integrityStatus} size="sm" dot />
          </div>
          <div className="flex items-center gap-3 text-xs text-forensic-muted mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {evidence.timestamp ? formatRelativeTime(evidence.timestamp) : 'No timestamp'}
            </span>
            <span className="font-mono">{evidence.hash.substring(0, 16)}...</span>
            <span>Reliability: {Math.round(evidence.reliability * 100)}%</span>
          </div>
        </div>
        {showActions && (
          <Button variant="ghost" size="icon" className="text-forensic-muted hover:text-forensic-accent">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card variant="evidence" hover={!!onClick} onClick={onClick} padding="md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 bg-forensic-bg rounded-xl flex items-center justify-center">
          {Icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <EvidenceBadge id={evidence.evidenceId} size="md" />
            <h3 className="font-medium text-forensic-text truncate">{evidence.originalFilename}</h3>
            <Badge variant="default" size="sm">{evidence.type}</Badge>
            <IntegrityBadge status={evidence.integrityStatus} size="sm" />
            <Badge variant="confidence" value={evidence.reliability} size="sm">{Math.round(evidence.reliability * 100)}%</Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-forensic-muted">Source</p>
              <p className="font-mono text-forensic-text truncate">{evidence.source}</p>
            </div>
            <div>
              <p className="text-forensic-muted">Timestamp</p>
              <p className="font-mono text-forensic-text">
                {evidence.timestamp ? formatTimestamp(evidence.timestamp) : '—'}
              </p>
            </div>
            <div>
              <p className="text-forensic-muted">Imported</p>
              <p className="font-mono text-forensic-text">{formatRelativeTime(evidence.importedAt)}</p>
            </div>
            <div>
              <p className="text-forensic-muted">Hash (SHA-256)</p>
              <p className="font-mono text-forensic-text truncate">{evidence.hash}</p>
            </div>
          </div>

          {isDetailed && (
            <div className="mt-4 pt-4 border-t border-forensic-border/50 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-forensic-muted">Classification</p>
                  <Badge variant="default" size="sm">{evidence.classification}</Badge>
                </div>
                <div>
                  <p className="text-forensic-muted">File Size</p>
                  <p className="font-mono text-forensic-text">
                    {evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(1)} KB` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-forensic-muted">MIME Type</p>
                  <p className="font-mono text-forensic-text truncate">{evidence.mimeType || '—'}</p>
                </div>
                <div>
                  <p className="text-forensic-muted">Relevance</p>
                  <Badge variant="confidence" value={evidence.relevance} size="sm">{Math.round(evidence.relevance * 100)}%</Badge>
                </div>
              </div>

              {(evidence.linkedEntities?.length || evidence.linkedEvents?.length) && (
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-2">Linked References</p>
                  <div className="flex flex-wrap gap-2">
                    {evidence.linkedEntities?.map((entityId: string) => (
                      <Badge key={entityId} variant="default" size="sm">{entityId}</Badge>
                    ))}
                    {evidence.linkedEvents?.map((eventId: string) => (
                      <Badge key={eventId} variant="default" size="sm" className="bg-blue-900/30 border-blue-500/30 text-blue-400">
                        {eventId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {evidence.notes && (
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-forensic-text bg-forensic-bg p-3 rounded border border-forensic-border/50">
                    {evidence.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {showActions && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onView} leftIcon={<Eye className="w-4 h-4" />}>
                View
              </Button>
              <Button variant="outline" size="sm" onClick={onLink} leftIcon={<Link2 className="w-4 h-4" />}>
                Link
              </Button>
              <Button variant="outline" size="sm" onClick={onTag} leftIcon={<Tag className="w-4 h-4" />}>
                Tag
              </Button>
              <Button variant="outline" size="sm" onClick={onCompare} leftIcon={<Database className="w-4 h-4" />}>
                Compare
              </Button>
              <Button variant="outline" size="sm" onClick={onExport} leftIcon={<Download className="w-4 h-4" />}>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onFlag} leftIcon={<Flag className="w-4 h-4" />} className="text-yellow-400 border-yellow-500/30 hover:bg-yellow-900/20">
                Flag
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function EvidenceList({
  evidence,
  onItemClick,
  onView,
  onLink,
  onTag,
  onCompare,
  onExport,
  onFlag,
  variant = 'default',
  emptyMessage = 'No evidence items found',
}: {
  evidence: EvidenceItem[];
  onItemClick?: (evidence: EvidenceItem) => void;
  onView?: (evidence: EvidenceItem) => void;
  onLink?: (evidence: EvidenceItem) => void;
  onTag?: (evidence: EvidenceItem) => void;
  onCompare?: (evidence: EvidenceItem) => void;
  onExport?: (evidence: EvidenceItem) => void;
  onFlag?: (evidence: EvidenceItem) => void;
  variant?: 'default' | 'compact' | 'detailed';
  emptyMessage?: string;
}) {
  if (evidence.length === 0) {
    return (
      <Card variant="outlined" padding="lg" className="text-center">
        <FileText className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <p className="text-forensic-muted">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', variant === 'compact' && 'space-y-2')}>
      {evidence.map(item => (
        <EvidenceCard
          key={item.id}
          evidence={item}
          variant={variant}
          onClick={() => onItemClick?.(item)}
          onView={() => onView?.(item)}
          onLink={() => onLink?.(item)}
          onTag={() => onTag?.(item)}
          onCompare={() => onCompare?.(item)}
          onExport={() => onExport?.(item)}
          onFlag={() => onFlag?.(item)}
        />
      ))}
    </div>
  );
}

export function EvidenceDetailTabs({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
}) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'metadata', label: 'Metadata', icon: <Database className="w-4 h-4" /> },
    { id: 'integrity', label: 'Integrity', icon: <Hash className="w-4 h-4" /> },
    { id: 'entities', label: 'Linked Entities', icon: <Link2 className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'ai-relevance', label: 'AI Relevance', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="border-b border-forensic-border">
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Evidence detail tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              'whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-forensic-accent/10 text-forensic-accent border-b-2 border-forensic-accent'
                : 'text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="mt-4" role="tabpanel">{children}</div>
    </div>
  );
}