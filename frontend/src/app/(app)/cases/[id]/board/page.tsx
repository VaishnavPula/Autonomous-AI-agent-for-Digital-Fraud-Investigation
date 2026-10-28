"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge, EvidenceBadge, ConfidenceBadge, SignalBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { casesService } from "@/lib/cases";
import { CaseDetail, EvidenceItem, EntityItem, TransactionItem, TimelineEventItem, FraudSignalItem, RiskScoreItem, HypothesisItem } from "@/types/cases";
import {
  ArrowLeft,
  Zap,
  Search,
  Filter,
  Layers,
  Eye,
  Target,
  Link2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  BarChart3,
  Network,
  Clock,
  Shield,
  Users,
  DollarSign,
  FileText,
  Zap as ZapIcon,
  Settings,
  MoreHorizontal,
} from "lucide-react";

const panelTabs = [
  { id: 'evidence', label: 'Evidence', icon: FileText, count: 0 },
  { id: 'entities', label: 'Entities', icon: Users, count: 0 },
  { id: 'transactions', label: 'Transactions', icon: DollarSign, count: 0 },
  { id: 'timeline', label: 'Timeline', icon: Clock, count: 0 },
  { id: 'signals', label: 'Signals', icon: AlertTriangle, count: 0 },
  { id: 'risk', label: 'Risk', icon: Shield, count: 0 },
  { id: 'hypotheses', label: 'Hypotheses', icon: HelpCircle, count: 0 },
  { id: 'ai', label: 'AI', icon: ZapIcon, count: 0 },
];

const steps = [
  { label: 'Transaction', icon: DollarSign },
  { label: 'Account', icon: Users },
  { label: 'Device', icon: Shield },
  { label: 'IP', icon: Network },
  { label: 'Location', icon: Clock },
  { label: 'Related Account', icon: Link2 },
];

export default function TraceBoardPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState('evidence');
  const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
  const [traceModeActive, setTraceModeActive] = useState(false);
  const [traceEntities, setTraceEntities] = useState<EntityItem[]>([]);

  const fetchCase = useCallback(async () => {
    setLoading(true);
    try {
      const data = await casesService.getCase(caseId);
      setCaseData(data);
      if (data.evidence) panelTabs[0].count = data.evidence.length;
      if (data.entities) panelTabs[1].count = data.entities.length;
      if (data.transactions) panelTabs[2].count = data.transactions.length;
      if (data.timeline_events) panelTabs[3].count = data.timeline_events.length;
      if (data.fraud_signals) panelTabs[4].count = data.fraud_signals.length;
      if (data.risk_scores) panelTabs[5].count = data.risk_scores.length;
      if (data.hypotheses) panelTabs[6].count = data.hypotheses.length;
    } catch (error) {
      console.error('Failed to fetch case:', error);
      router.push('/cases');
    } finally {
      setLoading(false);
    }
  }, [caseId, router]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  if (loading) {
    return (
      <div className="h-screen bg-forensic-bg flex items-center justify-center">
        <div className="text-center">
          <ZapIcon className="w-16 h-16 text-forensic-accent animate-spin mx-auto mb-4" />
          <p className="text-forensic-muted">Loading Trace Board...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="h-screen bg-forensic-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-forensic-text">Case not found</h2>
          <Button variant="secondary" onClick={() => router.back()}>Back to Cases</Button>
        </div>
      </div>
    );
  }

  const latestRisk = caseData.risk_scores?.[0];

  return (
    <div className="h-screen bg-forensic-bg flex flex-col">
      <div className="h-14 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Link href={`/cases/${caseData.id}`} className="flex items-center gap-2">
              <Badge variant="evidence" size="md">{caseData.case_id}</Badge>
              <span className="font-bold text-lg text-forensic-text">TRACE BOARD</span>
            </Link>
            <StatusBadge status={caseData.status} size="sm" />
            <RiskBadge level={caseData.risk_level} size="sm" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-forensic-muted">
            <span className="font-mono">Completeness:</span>
            <span className="font-mono text-forensic-accent">{Math.round(caseData.investigation_completeness * 100)}%</span>
          </div>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
          <Button variant="primary" leftIcon={<ZapIcon className="w-4 h-4" />} onClick={() => { setTraceEntities(selectedEntity ? [selectedEntity] : []); setTraceModeActive(true); }}>
            Trace Mode
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <LeftPanel caseData={caseData} activePanel={activePanel} setActivePanel={setActivePanel} panelTabs={panelTabs} latestRisk={latestRisk} />
        <CenterPanel caseData={caseData} selectedEntity={selectedEntity} setSelectedEntity={setSelectedEntity} />
        <RightPanel activePanel={activePanel} caseData={caseData} selectedEntity={selectedEntity} setSelectedEntity={setSelectedEntity} onEntitySelect={setSelectedEntity} />
      </div>

      <Modal
        isOpen={traceModeActive}
        onClose={() => { setTraceModeActive(false); setTraceEntities([]); }}
        title="TRACE MODE"
        size="full"
      >
        <TraceModeView
          caseData={caseData}
          traceEntities={traceEntities}
          onClose={() => { setTraceModeActive(false); setTraceEntities([]); }}
        />
      </Modal>
    </div>
  );
}

function LeftPanel({ caseData, activePanel, setActivePanel, panelTabs, latestRisk }: { caseData: CaseDetail; activePanel: string; setActivePanel: (id: string) => void; panelTabs: any[]; latestRisk: any }) {
  return (
    <div className="w-72 lg:w-80 border-r border-forensic-border bg-forensic-surface flex flex-col overflow-hidden">
      <div className="p-4 border-b border-forensic-border">
        <h3 className="font-semibold text-forensic-text mb-3">Case Context</h3>
        <div className="space-y-3 text-sm">
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
        </div>
      </div>

      <div className="p-4 border-b border-forensic-border">
        <h3 className="font-semibold text-forensic-text mb-3">Risk Assessment</h3>
        {latestRisk && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-forensic-text">Overall Risk</p>
                <p className="text-xs text-forensic-muted">Latest assessment</p>
              </div>
              <RiskBadge level={latestRisk.risk_level} size="lg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                <p className="text-xs font-mono text-forensic-muted">Overall Score</p>
                <p className="font-mono text-2xl text-forensic-accent">{Math.round(latestRisk.overall_score * 100)}%</p>
              </div>
              <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                <p className="text-xs font-mono text-forensic-muted">Financial Exposure</p>
                <p className="font-mono text-xl text-forensic-text">{formatCurrency(latestRisk.financial_exposure)}</p>
              </div>
              <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                <p className="text-xs font-mono text-forensic-muted">Confidence</p>
                <p className="font-mono text-2xl text-forensic-text">{Math.round(latestRisk.investigation_confidence * 100)}%</p>
              </div>
              <div className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 text-center">
                <p className="text-xs font-mono text-forensic-muted">Evidence Strength</p>
                <p className="font-mono text-2xl text-forensic-text">{Math.round(latestRisk.evidence_strength * 100)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold text-forensic-text mb-3">Panels</h3>
        <div className="space-y-1">
          {panelTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  activePanel === tab.id
                    ? 'bg-forensic-accent/10 text-forensic-accent border border-forensic-accent/30'
                    : 'text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 truncate">{tab.label}</span>
                <Badge variant="default" size="xs">{tab.count}</Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CenterPanel({ caseData, selectedEntity, setSelectedEntity }: { caseData: CaseDetail; selectedEntity: EntityItem | null; setSelectedEntity: (e: EntityItem | null) => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="h-14 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-14 z-30">
        <h3 className="font-semibold text-forensic-text">Entity Network Graph</h3>
        <div className="flex items-center gap-2">
          <select
            value="dagre"
            onChange={e => e.target.value}
            className="px-3 py-1.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          >
            <option value="dagre">Hierarchical</option>
            <option value="cose">Force Directed</option>
            <option value="circle">Circular</option>
          </select>
          <Button variant="ghost" size="icon" leftIcon={<RotateCcw className="w-4 h-4" />}>Reset</Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {caseData.entities && caseData.entities.length > 0 ? (
          <EntityGraphSimple
            entities={caseData.entities}
            selectedEntity={selectedEntity}
            onEntitySelect={setSelectedEntity}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-forensic-muted">
            <div className="text-center">
              <Network className="w-16 h-16 mx-auto mb-4" />
              <p>No entities to display</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EntityGraphSimple({ entities, selectedEntity, onEntitySelect }: { entities: EntityItem[]; selectedEntity: EntityItem | null; onEntitySelect: (e: EntityItem | null) => void }) {
  return (
    <div className="h-full w-full p-6" style={{ background: '#0a0f1a' }}>
      <div className="h-full w-full flex items-center justify-center">
        <div className="relative w-[500px] h-[400px]">
          {entities.map((entity, index) => {
            const angle = (index / entities.length) * 2 * Math.PI;
            const radius = 180;
            const x = 250 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);
            const isSelected = selectedEntity?.id === entity.id;
            const riskColor = entity.risk_level === 'CRITICAL' ? '#ef4444' :
                              entity.risk_level === 'HIGH' ? '#f97316' :
                              entity.risk_level === 'MEDIUM' ? '#eab308' : '#22c55e';
            return (
              <div
                key={entity.id}
                onClick={() => onEntitySelect(entity)}
                className="absolute w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all select-none"
                style={{
                  left: x - 20,
                  top: y - 20,
                  background: isSelected ? riskColor : '#1e293b',
                  border: isSelected ? `3px solid #fff` : `2px solid ${riskColor}`,
                  boxShadow: `0 0 12px ${riskColor}80`,
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                <span className="font-mono text-white text-xs font-bold">{entity.entity_type[0]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 p-2 bg-forensic-surface/90 backdrop-blur rounded-lg border border-forensic-border/50 text-xs text-forensic-muted">
        {entities.length} entities • Click to select
      </div>
    </div>
  );
}

function RightPanel({ activePanel, caseData, selectedEntity, setSelectedEntity, onEntitySelect }: { activePanel: string; caseData: CaseDetail; selectedEntity: EntityItem | null; setSelectedEntity: (e: EntityItem | null) => void; onEntitySelect: (e: EntityItem) => void }) {
  return (
    <div className="w-80 lg:w-96 border-l border-forensic-border bg-forensic-surface flex flex-col overflow-hidden">
      <div className="h-14 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-14 z-30">
        <h3 className="font-semibold text-forensic-text capitalize">{activePanel} Details</h3>
        <Button variant="ghost" size="icon" onClick={() => setSelectedEntity(null)}>
          <XCircle className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {selectedEntity ? (
          <EntityDetailPanel entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
        ) : (
          <PanelContent
            panel={activePanel}
            caseData={caseData}
            onEntitySelect={onEntitySelect}
          />
        )}
      </div>
    </div>
  );
}

function EntityDetailPanel({ entity, onClose }: { entity: EntityItem; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', 'bg-forensic-accent/10 border border-forensic-accent/30')}>
          <span className="font-mono text-forensic-accent">{entity.entity_type[0]}</span>
        </div>
        <div>
          <h4 className="font-mono text-forensic-text">{entity.entity_id}</h4>
          <p className="text-sm text-forensic-muted capitalize">{entity.entity_type}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs text-forensic-muted">Risk Score</p>
          <p className="font-mono text-forensic-text">{Math.round(entity.risk_score * 100)}%</p>
        </div>
        <div className="p-2 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs text-forensic-muted">Risk Level</p>
          <RiskBadge level={entity.risk_level} size="sm" />
        </div>
      </div>
      {entity.name && (
        <div className="p-3 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Name</p>
          <p className="text-forensic-text">{entity.name}</p>
        </div>
      )}
      {entity.value && (
        <div className="p-3 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Value</p>
          <p className="font-mono text-forensic-text truncate">{entity.value}</p>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Eye className="w-3 h-3" />}>
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Link2 className="w-3 h-3" />}>
          Trace Path
        </Button>
      </div>
    </div>
  );
}

function PanelContent({ panel, caseData, onEntitySelect }: { panel: string; caseData: CaseDetail; onEntitySelect: (e: EntityItem) => void }) {
  switch (panel) {
    case 'evidence':
      return (
        <div className="space-y-3">
          {(caseData.evidence || []).slice(0, 10).map(item => (
            <div key={item.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 hover:border-forensic-accent/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <EvidenceBadge id={item.evidence_id} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forensic-text truncate">{item.original_filename}</p>
                  <p className="text-xs text-forensic-muted">{item.type} • {item.source}</p>
                </div>
                <RiskBadge level={item.integrity_status} size="xs" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'entities':
      return (
        <div className="space-y-2">
          {(caseData.entities || []).map(entity => (
            <button
              key={entity.id}
              onClick={() => onEntitySelect(entity)}
              className="w-full p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 hover:border-forensic-accent/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', 'bg-forensic-accent/10 border border-forensic-accent/30')}>
                  <span className="font-mono text-forensic-accent text-sm">{entity.entity_type[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-forensic-text truncate">{entity.entity_id}</p>
                  <p className="text-xs text-forensic-muted capitalize">{entity.entity_type}</p>
                </div>
                <RiskBadge level={entity.risk_level} size="xs" />
              </div>
            </button>
          ))}
        </div>
      );

    case 'transactions':
      return (
        <div className="space-y-2">
          {(caseData.transactions || []).slice(0, 10).map(tx => (
            <div key={tx.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-forensic-accent">{tx.transaction_id}</span>
                <ConfidenceBadge confidence={tx.risk_score} size="xs" />
              </div>
              <div className="flex items-center gap-4 text-sm text-forensic-muted">
                <span>{formatCurrency(tx.amount, tx.currency)}</span>
                <span className="font-mono">{formatTimestamp(tx.timestamp)}</span>
                <Badge variant="default" size="xs">{tx.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <div className="space-y-3">
          {(caseData.timeline_events || []).map(event => (
            <div key={event.id} className={cn(
              'p-3 rounded-lg border transition-colors',
              event.is_suspicious ? 'bg-red-900/10 border-red-500/30' : 'bg-forensic-bg/50 border-forensic-border/50'
            )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-forensic-text">{event.event_type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-forensic-muted font-mono">{formatTimestamp(event.timestamp)}</span>
                <span className="text-xs text-forensic-muted">({formatRelativeTime(event.timestamp)})</span>
                {event.is_suspicious && <SignalBadge severity="high" size="xs" />}
                <RiskBadge level={event.risk_score > 0.8 ? 'critical' : event.risk_score > 0.6 ? 'high' : event.risk_score > 0.3 ? 'medium' : 'low'} size="xs" />
              </div>
              <p className="text-forensic-text">{event.description}</p>
              {(event.evidence_ids.length > 0 || event.entity_ids.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {event.evidence_ids.map(id => <EvidenceBadge key={id} id={id} size="xs" />)}
                  {event.entity_ids.map(id => (
                    <Badge key={id} variant="default" size="xs" className="bg-blue-900/30 border-blue-500/30 text-blue-400">{id}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'signals':
      return (
        <div className="space-y-2">
          {(caseData.fraud_signals || []).map(signal => (
            <div key={signal.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-forensic-text">{signal.signal_type.replace(/_/g, ' ')}</span>
                <RiskBadge level={signal.severity} size="sm" />
              </div>
              <p className="text-sm text-forensic-muted">{signal.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {signal.evidence_ids.slice(0, 3).map(id => <EvidenceBadge key={id} id={id} size="xs" />)}
              </div>
            </div>
          ))}
        </div>
      );

    case 'risk':
      return (
        <div className="space-y-4">
          {(caseData.risk_scores || []).map(score => (
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
        </div>
      );

    case 'hypotheses':
      return (
        <div className="space-y-3">
          {(caseData.hypotheses || []).map(h => (
            <div key={h.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-forensic-text">{h.title}</h4>
                <ConfidenceBadge confidence={h.confidence} size="sm" showValue />
              </div>
              <p className="text-sm text-forensic-muted">{h.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {h.supporting_evidence_ids.map(id => <EvidenceBadge key={id} id={id} size="xs" />)}
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="text-center py-12 text-forensic-muted">
          <HelpCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Select a panel from the left to view details</p>
        </div>
      );
  }
}

function TraceModeView({ caseData, traceEntities, onClose }: { caseData: CaseDetail; traceEntities: EntityItem[]; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-forensic-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-forensic-text">Trace Mode - Follow the Evidence</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono',
                  i <= currentStep ? 'bg-forensic-accent text-forensic-bg' : 'bg-forensic-bg border border-forensic-border text-forensic-muted'
                )}>
                  <step.icon className="w-4 h-4 mx-auto" />
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-forensic-muted" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {traceEntities.map((entity, index) => (
            <div key={entity.id} className="relative">
              <div className="flex items-center gap-4">
                <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0',
                  'bg-forensic-accent/10 border border-forensic-accent/30'
                )}>
                  <span className="font-mono text-forensic-accent text-lg">{entity.entity_type[0]}</span>
                </div>
                <div>
                  <h3 className="font-mono text-lg text-forensic-text">{entity.entity_id}</h3>
                  <p className="text-sm text-forensic-muted capitalize">{entity.entity_type}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RiskBadge level={entity.risk_level} size="sm" />
                    <ConfidenceBadge confidence={entity.risk_score} size="sm" />
                  </div>
                </div>
              </div>
              {index < traceEntities.length - 1 && (
                <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-forensic-border/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-forensic-border flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Exit Trace Mode</Button>
      </div>
    </div>
  );
}