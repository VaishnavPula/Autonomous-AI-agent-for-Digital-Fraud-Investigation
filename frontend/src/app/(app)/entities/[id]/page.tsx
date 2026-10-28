"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge, StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { entitiesService } from "@/lib/entities";
import { EntityDetail, EntityRelationshipItem, entityTypeOptions, relationshipTypeOptions, riskLevelOptions } from "@/types/entities";
import {
  ArrowLeft,
  Download,
  Link2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  Hash,
  Eye,
  Copy,
  AlertCircle,
  HelpCircle,
  History,
  Network,
  Plus,
  Search,
  Merge,
  Settings,
  Share2,
  FileText,
} from "lucide-react";

const tabs = [
  { id: 'overview', label: 'Overview', icon: Network },
  { id: 'relationships', label: 'Relationships', icon: Link2 },
  { id: 'attributes', label: 'Attributes', icon: Hash },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'resolve', label: 'Resolve', icon: Merge },
];

const riskColors: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-900/30 border-red-500/30",
  HIGH: "text-orange-400 bg-orange-900/30 border-orange-500/30",
  MEDIUM: "text-yellow-400 bg-yellow-900/30 border-yellow-500/30",
  LOW: "text-green-400 bg-green-900/30 border-green-500/30",
  VERY_LOW: "text-emerald-400 bg-emerald-900/30 border-emerald-500/30",
};

function OverviewTab({ entity }: { entity: EntityDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Basic Information</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Entity ID</dt>
                <dd className="font-mono text-forensic-text">{entity.entity_id}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Type</dt>
                <dd className="text-forensic-text">{entity.entity_type}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Name</dt>
                <dd className="text-forensic-text">{entity.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Value</dt>
                <dd className="font-mono text-forensic-text">{entity.value}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">First Seen</dt>
                <dd className="font-mono text-forensic-text">{entity.first_seen ? formatTimestamp(entity.first_seen) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Last Seen</dt>
                <dd className="font-mono text-forensic-text">{entity.last_seen ? formatTimestamp(entity.last_seen) : '—'}</dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Created</dt>
                <dd className="font-mono text-forensic-text">{formatTimestamp(entity.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Updated</dt>
                <dd className="font-mono text-forensic-text">{formatTimestamp(entity.updated_at)}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card variant="default" padding="lg">
          <h3 className="text-lg font-semibold text-forensic-text mb-4">Risk & Quality</h3>
          <dl className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Risk Level</dt>
                <dd className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", riskColors[entity.risk_level] || riskColors.LOW)}>
                  {entity.risk_level}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Risk Score</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-forensic-text">{Math.round(entity.risk_score * 100)}%</span>
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Confidence</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono text-forensic-text">{Math.round(entity.confidence * 100)}%</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Resolution Status</dt>
                <dd className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full",
                  entity.is_resolved ? "bg-green-900/30 text-green-400" : "bg-gray-900/30 text-gray-400"
                )}>
                  {entity.is_resolved ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {entity.is_resolved ? 'Resolved' : 'Active'}
                </dd>
              </div>
            </div>
          </dl>
        </Card>
      </div>

      <Card variant="default" padding="lg">
        <h3 className="text-lg font-semibold text-forensic-text mb-4">Attributes</h3>
        <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-4 py-4 rounded border border-forensic-border/50 overflow-x-auto max-h-96">
          {JSON.stringify(entity.attributes, null, 2) || '{}'}
        </pre>
      </Card>
    </div>
  );
}

function RelationshipsTab({ entity }: { entity: EntityDetail }) {
  return (
    <div className="space-y-4">
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-forensic-text">Outgoing Relationships</h3>
          <span className="text-sm text-forensic-muted">{entity.source_relationships.length} relationships</span>
        </div>
        <Table
          columns={[
            { key: 'relationship_type', header: 'Type' },
            { key: 'target_entity_value', header: 'Target Entity', render: (row: any) => <span className="font-mono text-forensic-accent">{row.target_entity_value}</span> },
            { key: 'confidence', header: 'Confidence', render: (row: any) => <span className="font-mono text-forensic-text">{Math.round(row.confidence * 100)}%</span> },
            { key: 'strength', header: 'Strength', render: (row: any) => <span className="font-mono text-forensic-text">{Math.round(row.strength * 100)}%</span> },
            { key: 'evidence_ids', header: 'Evidence', render: (row: any) => <span className="text-sm text-forensic-muted">{row.evidence_ids?.length || 0} items</span> },
          ]}
          data={entity.source_relationships}
          keyExtractor={(row) => row.id}
          emptyMessage="No outgoing relationships"
        />
      </Card>

      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-forensic-text">Incoming Relationships</h3>
          <span className="text-sm text-forensic-muted">{entity.target_relationships.length} relationships</span>
        </div>
        <Table
          columns={[
            { key: 'relationship_type', header: 'Type' },
            { key: 'source_entity_value', header: 'Source Entity', render: (row: any) => <span className="font-mono text-forensic-accent">{row.source_entity_value}</span> },
            { key: 'confidence', header: 'Confidence', render: (row: any) => <span className="font-mono text-forensic-text">{Math.round(row.confidence * 100)}%</span> },
            { key: 'strength', header: 'Strength', render: (row: any) => <span className="font-mono text-forensic-text">{Math.round(row.strength * 100)}%</span> },
            { key: 'evidence_ids', header: 'Evidence', render: (row: any) => <span className="text-sm text-forensic-muted">{row.evidence_ids?.length || 0} items</span> },
          ]}
          data={entity.target_relationships}
          keyExtractor={(row) => row.id}
          emptyMessage="No incoming relationships"
        />
      </Card>
    </div>
  );
}

function AttributesTab({ entity }: { entity: EntityDetail }) {
  return (
    <Card variant="default" padding="lg">
      <h3 className="text-lg font-semibold text-forensic-text mb-4">Entity Attributes</h3>
      <pre className="font-mono text-sm text-forensic-text bg-forensic-bg px-4 py-4 rounded border border-forensic-border/50 overflow-x-auto max-h-[500px]">
        {JSON.stringify(entity.attributes, null, 2) || '{}'}
      </pre>
    </Card>
  );
}

function EvidenceTab({ entity }: { entity: EntityDetail }) {
  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-forensic-text">Related Evidence</h3>
        <span className="text-sm text-forensic-muted">{entity.evidence_count} items</span>
      </div>
      <p className="text-forensic-muted">Evidence linking will be available when evidence entity references are implemented.</p>
    </Card>
  );
}

function TimelineTab() {
  return (
    <Card variant="default" padding="lg">
      <h3 className="text-lg font-semibold text-forensic-text mb-4">Entity Timeline</h3>
      <p className="text-forensic-muted">Timeline events for this entity will be shown here.</p>
    </Card>
  );
}

function ResolveTab({ entity }: { entity: EntityDetail }) {
  return (
    <Card variant="default" padding="lg">
      <h3 className="text-lg font-semibold text-forensic-text mb-4">Entity Resolution</h3>
      <p className="text-forensic-muted mb-6">Merge this entity with others to create a unified view.</p>
      <Button variant="outline" leftIcon={<Merge className="w-4 h-4" />} onClick={() => {}}>
        Start Resolution
      </Button>
    </Card>
  );
}

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateRelModal, setShowCreateRelModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    entity_ids: [entityId],
    new_entity_id: '',
    new_entity_type: 'USER',
    new_name: '',
    new_value: '',
  });

  const fetchEntity = async () => {
    setLoading(true);
    try {
      const data = await entitiesService.getEntityById(entityId);
      setEntity(data);
      const rels = await entitiesService.getRelationships(undefined, entityId, entityId);
      setRelationships(rels.items);
    } catch (error) {
      console.error("Failed to fetch entity:", error);
      router.push('/entities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntity();
  }, [entityId, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEntity = await entitiesService.resolveEntities(resolveForm);
      setShowResolveModal(false);
      setResolveForm({
        entity_ids: [entityId],
        new_entity_id: '',
        new_entity_type: 'USER',
        new_name: '',
        new_value: '',
      });
      router.push(`/entities/${newEntity.id}`);
    } catch (error) {
      console.error("Resolution failed:", error);
    }
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

  if (!entity) {
    return (
      <div className="text-center py-12">
        <HelpCircle className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-forensic-text">Entity not found</h2>
        <Button variant="secondary" onClick={() => router.back()}>Back to Vault</Button>
      </div>
    );
  }

  const tabComponents = {
    overview: <OverviewTab entity={entity} />,
    relationships: <RelationshipsTab entity={entity} />,
    attributes: <AttributesTab entity={entity} />,
    evidence: <EvidenceTab entity={entity} />,
    timeline: <TimelineTab />,
    resolve: <ResolveTab entity={entity} />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-forensic-accent text-lg">{entity.entity_id}</span>
            <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", riskColors[entity.risk_level] || riskColors.LOW)}>
              {entity.risk_level}
            </span>
            <Badge variant="default" size="sm">{entity.entity_type}</Badge>
            {entity.is_resolved && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-full bg-green-900/30 text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolved
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-forensic-text">{entity.name || entity.value}</h1>
          <p className="text-forensic-muted font-mono">{entity.value}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateRelModal(true)}>
            Add Relationship
          </Button>
          {!entity.is_resolved && (
            <Button variant="primary" leftIcon={<Merge className="w-4 h-4" />} onClick={() => setShowResolveModal(true)}>
              Resolve
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(entity.risk_score * 100)}%</p>
          <p className="text-sm text-forensic-muted">Risk Score</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{Math.round(entity.confidence * 100)}%</p>
          <p className="text-sm text-forensic-muted">Confidence</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{entity.evidence_count}</p>
          <p className="text-sm text-forensic-muted">Evidence Count</p>
        </Card>
        <Card variant="elevated" padding="md" className="text-center">
          <p className="text-2xl font-bold text-forensic-text font-mono">{entity.source_relationships.length + entity.target_relationships.length}</p>
          <p className="text-sm text-forensic-muted">Relationships</p>
        </Card>
      </div>

      <div className="border-b border-forensic-border/50">
        <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Entity tabs">
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
        {tabComponents[activeTab as keyof typeof tabComponents]}
      </div>

      <Modal
        isOpen={showCreateRelModal}
        onClose={() => setShowCreateRelModal(false)}
        title="Create Relationship"
        size="lg"
      >
        <CreateRelationshipModal
          sourceEntityId={entityId}
          onClose={() => setShowCreateRelModal(false)}
          onSuccess={fetchEntity}
        />
      </Modal>

      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Entity"
        size="lg"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Merge with Entities</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forensic-text mb-1">New Entity Type *</label>
              <select
                value={resolveForm.new_entity_type}
                onChange={(e) => setResolveForm({ ...resolveForm, new_entity_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              >
                {entityTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-forensic-text mb-1">New Entity ID *</label>
              <input
                type="text"
                value={resolveForm.new_entity_id}
                onChange={(e) => setResolveForm({ ...resolveForm, new_entity_id: e.target.value })}
                placeholder="ENT-12345"
                className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forensic-text mb-1">New Name</label>
              <input
                type="text"
                value={resolveForm.new_name}
                onChange={(e) => setResolveForm({ ...resolveForm, new_name: e.target.value })}
                className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forensic-text mb-1">New Value</label>
              <input
                type="text"
                value={resolveForm.new_value}
                onChange={(e) => setResolveForm({ ...resolveForm, new_value: e.target.value })}
                className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button type="submit">Resolve Entities</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CreateRelationshipModal({ sourceEntityId, onClose, onSuccess }: { sourceEntityId: string; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    target_entity_id: '',
    relationship_type: 'ASSOCIATED_WITH',
    confidence: 1.0,
    strength: 1.0,
    evidence_ids: '',
    metadata: '',
    is_directional: true,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_entity_id) {
      setError("Please select a target entity");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let evidenceIds: string[] = [];
      if (formData.evidence_ids) {
        evidenceIds = formData.evidence_ids.split(',').map(id => id.trim()).filter(Boolean);
      }

      let meta: Record<string, any> = {};
      if (formData.metadata) {
        try {
          meta = JSON.parse(formData.metadata);
        } catch {
          setError("Invalid JSON in metadata");
          setCreating(false);
          return;
        }
      }

      await entitiesService.createRelationship({
        case_id: '',
        source_entity_id: sourceEntityId,
        target_entity_id: formData.target_entity_id,
        relationship_type: formData.relationship_type,
        confidence: formData.confidence,
        strength: formData.strength,
        evidence_ids: evidenceIds,
        metadata: meta,
        is_directional: formData.is_directional,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Create relationship failed:", err);
      setError("Failed to create relationship. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Target Entity ID *</label>
        <input
          type="text"
          value={formData.target_entity_id}
          onChange={(e) => setFormData({ ...formData, target_entity_id: e.target.value })}
          placeholder="ENT-12345"
          className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Relationship Type *</label>
          <select
            value={formData.relationship_type}
            onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
            className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          >
            {relationshipTypeOptions.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Confidence</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={formData.confidence}
            onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Strength</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={formData.strength}
            onChange={(e) => setFormData({ ...formData, strength: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_directional}
              onChange={(e) => setFormData({ ...formData, is_directional: e.target.checked })}
              className="rounded border-forensic-border text-forensic-accent focus:ring-forensic-accent"
            />
            <span className="text-sm text-forensic-text">Directional</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Evidence IDs (comma-separated)</label>
        <input
          type="text"
          value={formData.evidence_ids}
          onChange={(e) => setFormData({ ...formData, evidence_ids: e.target.value })}
          placeholder="EV-001, EV-002"
          className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Metadata (JSON)</label>
        <textarea
          value={formData.metadata}
          onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
          placeholder='{"notes": "Manual link"}'
          rows={3}
          className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={creating}>Cancel</Button>
        <Button type="submit" loading={creating} disabled={creating}>
          {creating ? "Creating..." : "Create Relationship"}
        </Button>
      </div>
    </form>
  );
}