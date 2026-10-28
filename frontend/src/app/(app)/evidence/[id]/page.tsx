"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, EvidenceBadge, RiskBadge, StatusBadge, ConfidenceBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { evidenceService } from "@/lib/evidence";
import { EvidenceDetail, ChainOfCustodyEntry } from "@/types/evidence";
import {
  ArrowLeft,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  FileText,
  Eye,
  Copy,
  AlertCircle,
  HelpCircle,
  History,
  Share2,
} from "lucide-react";

const integrityConfig: Record<string, { label: string; color: string; icon: any }> = {
  VERIFIED: { label: 'Verified', color: 'text-green-400 bg-green-900/30 border-green-500/30', icon: CheckCircle },
  WARNING: { label: 'Warning', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30', icon: AlertTriangle },
  CORRUPTED: { label: 'Corrupted', color: 'text-red-400 bg-red-900/30 border-red-500/30', icon: XCircle },
  PENDING: { label: 'Pending', color: 'text-gray-400 bg-gray-900/30 border-gray-500/30', icon: Clock },
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'entities', label: 'Entities', icon: Hash },
  { id: 'integrity', label: 'Integrity', icon: Shield },
  { id: 'chain', label: 'Chain of Custody', icon: History },
  { id: 'access', label: 'Access Log', icon: Eye },
];

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const evidenceId = params.id as string;
  const [evidence, setEvidence] = useState<EvidenceDetail | null>(null);
  const [chainOfCustody, setChainOfCustody] = useState<ChainOfCustodyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; currentHash: string; expectedHash: string; hashAlgorithm: string; checkedAt: string } | null>(null);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const data = await evidenceService.getEvidenceById(evidenceId);
      setEvidence(data);
      if (data.access_history) {
        setChainOfCustody(data.access_history);
      }
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
      router.push('/evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [evidenceId, router]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await evidenceService.verifyIntegrity(evidenceId);
      setVerificationResult({
        isValid: result.is_valid,
        currentHash: result.current_hash,
        expectedHash: result.expected_hash,
        hashAlgorithm: result.hash_algorithm,
        checkedAt: result.checked_at,
      });
      setEvidence(prev => prev ? { ...prev, integrity_status: result.is_valid ? 'VERIFIED' : 'CORRUPTED' } : null);
    } catch (error) {
      console.error("Verification failed:", error);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  if (!evidence) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-forensic-text">Evidence not found</h2>
        <Button variant="secondary" onClick={() => router.back()}>Back to Vault</Button>
      </div>
    );
  }

  const integrityInfo = integrityConfig[evidence.integrity_status] || integrityConfig.PENDING;
  const IntegrityIcon = integrityInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <EvidenceBadge id={evidence.evidence_id} size="lg" />
            <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", integrityInfo.color)}>
              <IntegrityIcon className="w-3 h-3 mr-1" />
              {integrityInfo.label}
            </span>
            <Badge variant="default" size="sm">{evidence.evidence_type.replace(/_/g, ' ')}</Badge>
            <Badge variant="default" size="sm">{evidence.classification}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-forensic-text">{evidence.original_filename}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Download</Button>
          <Button variant="primary" leftIcon={<Shield className="w-4 h-4" />} onClick={handleVerify} loading={verifying}>
            {verifying ? "Verifying..." : "Verify Integrity"}
          </Button>
        </div>
      </div>

      {verificationResult && (
        <div className={cn(
          "p-4 rounded-lg border flex items-center gap-4 animate-slide-in",
          verificationResult.isValid
            ? "bg-green-900/30 border-green-500/30 text-green-400"
            : "bg-red-900/30 border-red-500/30 text-red-400"
        )}>
          {verificationResult.isValid ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <div>
            <p className="font-medium">Integrity Check {verificationResult.isValid ? 'Passed' : 'Failed'}</p>
            <p className="text-sm">Hash {verificationResult.isValid ? 'matches' : 'does not match'} expected value. Checked at {formatTimestamp(verificationResult.checkedAt)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{evidence.file_size ? formatFileSize(evidence.file_size) : '—'}</p>
          <p className="text-sm text-forensic-muted">File Size</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(evidence.reliability * 100)}%</p>
          <p className="text-sm text-forensic-muted">Reliability</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(evidence.relevance * 100)}%</p>
          <p className="text-sm text-forensic-muted">Relevance</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{evidence.hash_algorithm}</p>
          <p className="text-sm text-forensic-muted">Hash Algorithm</p>
        </Card>
      </div>

      <div className="border-b border-forensic-border/50">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Evidence tabs">
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
        {renderTabContent(activeTab, evidence!)}
      </div>
    </div>
  );

  function renderTabContent(tabId: string, evidence: EvidenceDetail) {
    switch (tabId) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-semibold text-forensic-text mb-4">Basic Information</h3>
                <dl className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Evidence ID</dt>
                      <dd className="font-mono text-forensic-text">{evidence.evidence_id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Type</dt>
                      <dd className="text-forensic-text">{evidence.evidence_type.replace(/_/g, ' ')}</dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Source</dt>
                      <dd className="text-forensic-text">{evidence.source}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Classification</dt>
                      <dd className="text-forensic-text">{evidence.classification}</dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Timestamp</dt>
                      <dd className="font-mono text-forensic-text">{evidence.timestamp ? formatTimestamp(evidence.timestamp) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Imported</dt>
                      <dd className="font-mono text-forensic-text">{formatTimestamp(evidence.imported_at)}</dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Hash Algorithm</dt>
                      <dd className="font-mono text-forensic-text">{evidence.hash_algorithm}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">MIME Type</dt>
                      <dd className="font-mono text-forensic-text">{evidence.mime_type || '—'}</dd>
                    </div>
                  </div>
                </dl>
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="text-lg font-semibold text-forensic-text mb-4">Integrity & Quality</h3>
                <dl className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Integrity Status</dt>
                      <dd className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", integrityInfo.color)}>
                        <IntegrityIcon className="w-3 h-3 mr-1" />
                        {integrityInfo.label}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Reliability</dt>
                      <dd className="flex items-center gap-2">
                        <ConfidenceBadge confidence={evidence.reliability} size="md" />
                      </dd>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Relevance</dt>
                      <dd className="flex items-center gap-2">
                        <ConfidenceBadge confidence={evidence.relevance} size="md" />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Collector</dt>
                      <dd className="text-forensic-text">{evidence.collector?.email || 'Unknown'}</dd>
                    </div>
                  </div>
                </dl>
              </Card>
            </div>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Hash Verification</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">SHA-256 Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm text-forensic-text bg-forensic-bg px-3 py-2 rounded border border-forensic-border/50 break-all">{evidence.hash}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(evidence.hash)} className="text-forensic-muted hover:text-forensic-accent">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Entity References</p>
                  <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-3 py-2 rounded border border-forensic-border/50 overflow-x-auto max-h-40">{JSON.stringify(evidence.entity_references, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Metadata</p>
                  <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-3 py-2 rounded border border-forensic-border/50 overflow-x-auto max-h-40">{JSON.stringify(evidence.metadata, null, 2)}</pre>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'content':
        return (
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">File Content</h3>
            <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-4 py-4 rounded border border-forensic-border/50 overflow-x-auto max-h-[500px] whitespace-pre-wrap">
              {evidence.content || '(No text content available - binary file or empty)'}
            </pre>
          </Card>
        );

      case 'entities':
        return (
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">Referenced Entities</h3>
            {Object.keys(evidence.entity_references).length > 0 ? (
              <Table
                columns={[
                  { key: 'key', header: 'Key', render: (row: any) => <span className="font-mono text-forensic-accent">{row.key}</span> },
                  { key: 'value', header: 'Value', render: (row: any) => <span className="font-mono text-forensic-text">{row.value}</span> },
                ]}
                data={Object.entries(evidence.entity_references).map(([key, value]) => ({ key, value: String(value) }))}
                keyExtractor={(row) => row.key}
                emptyMessage="No entity references"
              />
            ) : (
              <p className="text-forensic-muted text-center py-8">No entity references found</p>
            )}
          </Card>
        );

      case 'integrity':
        return (
          <div className="space-y-6">
            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Integrity Verification</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0", integrityInfo.color)}>
                    <IntegrityIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-forensic-text">Current Status: {integrityInfo.label}</h4>
                    <p className="text-forensic-muted">Last verified: {verificationResult ? formatTimestamp(verificationResult.checkedAt) : 'Not yet verified'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                    <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Expected Hash</p>
                    <code className="font-mono text-sm text-forensic-text break-all">{evidence.hash}</code>
                  </div>
                  <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50">
                    <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Hash Algorithm</p>
                    <p className="font-mono text-forensic-text">{evidence.hash_algorithm}</p>
                  </div>
                </div>
                <Button variant="primary" leftIcon={<Shield className="w-4 h-4" />} onClick={handleVerify} loading={verifying}>
                  {verifying ? "Verifying..." : "Run Integrity Check"}
                </Button>
              </div>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-lg font-semibold text-forensic-text mb-4">Quality Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Reliability</p>
                  <p className="font-mono text-3xl text-forensic-text">{Math.round(evidence.reliability * 100)}%</p>
                  <div className="h-2 bg-forensic-bg rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-blue-500" style={{ width: `${evidence.reliability * 100}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Relevance</p>
                  <p className="font-mono text-3xl text-forensic-text">{Math.round(evidence.relevance * 100)}%</p>
                  <div className="h-2 bg-forensic-bg rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-purple-500" style={{ width: `${evidence.relevance * 100}%` }} />
                  </div>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">File Size</p>
                  <p className="font-mono text-2xl text-forensic-text">{evidence.file_size ? formatFileSize(evidence.file_size) : '—'}</p>
                </div>
                <div className="p-4 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                  <p className="text-xs font-mono text-forensic-muted">Access Count</p>
                  <p className="font-mono text-2xl text-forensic-text">{evidence.access_history?.length || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'chain':
        return (
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">Chain of Custody</h3>
            <div className="space-y-3">
              {chainOfCustody.map((entry, index) => (
                <div key={entry.id} className={cn(
                  'flex items-start gap-4 p-3 rounded-lg border transition-colors',
                  index === 0 ? 'bg-forensic-accent/5 border-forensic-accent/30' : 'bg-forensic-bg/50 border-forensic-border/50'
                )}>
                  <div className="flex flex-col items-center relative flex-shrink-0">
                    <div className={cn(
                      'w-3 h-3 rounded-full border-2',
                      index === 0 ? 'bg-forensic-accent' : 'bg-forensic-muted'
                    )} />
                    {index < chainOfCustody.length - 1 && <div className="flex-1 w-0.5 bg-forensic-border/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-forensic-text">{entry.action}</span>
                      <span className="text-xs text-forensic-muted font-mono">{formatTimestamp(entry.timestamp)}</span>
                      <span className="text-xs text-forensic-muted">({formatRelativeTime(entry.timestamp)})</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-forensic-muted">
                      <span>{entry.user_name || entry.user_id}</span>
                      {entry.ip_address && <span className="font-mono">{entry.ip_address}</span>}
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <pre className="font-mono text-xs text-forensic-muted mt-1 overflow-x-auto">{JSON.stringify(entry.details, null, 2)}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );

      case 'access':
        return (
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-semibold text-forensic-text mb-4">Access Log</h3>
            <Table
              columns={[
                { key: 'action', header: 'Action', render: (row: any) => <Badge variant="default" size="sm">{row.action}</Badge> },
                { key: 'user_name', header: 'User' },
                { key: 'timestamp', header: 'Time', render: (row: any) => <span className="font-mono text-forensic-muted">{formatTimestamp(row.timestamp)}</span> },
                { key: 'ip_address', header: 'IP' },
                { key: 'details', header: 'Details', render: (row: any) => <pre className="font-mono text-xs text-forensic-muted">{JSON.stringify(row.details, null, 2)}</pre> },
              ]}
              data={chainOfCustody}
              keyExtractor={(row) => row.id}
              emptyMessage="No access logs found"
            />
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
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}