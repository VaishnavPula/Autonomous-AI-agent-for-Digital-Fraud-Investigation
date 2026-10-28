'use client';

import { useCallback, useMemo, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edge, Node, useNodesState, useEdgesState, addEdge, Connection, NodeTypes, EdgeTypes, MarkerType, Handle, Position, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import {
  User,
  CreditCard,
  Smartphone,
  Wifi,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Building,
  FileText,
  Calendar,
  Search,
  Zap,
  Target,
  Link2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Layers,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export interface GraphNodeData {
  id: string;
  label: string;
  type: string;
  riskScore: number;
  riskLevel: string;
  entityId?: string;
  caseId?: string;
  details?: Record<string, unknown>;
  isSuspicious?: boolean;
  [key: string]: unknown;
}

export interface GraphEdgeData {
  id: string;
  relationshipType: string;
  timestamp?: string;
  confidence: number;
  evidenceIds: string[];
  strength: number;
  label?: string;
  [key: string]: unknown;
}

const nodeTypeConfig: Record<string, { icon: ReactNode; color: string; bgColor: string }> = {
  USER: { icon: <User className="w-4 h-4" />, color: 'text-blue-400', bgColor: 'bg-blue-900/30' },
  ACCOUNT: { icon: <CreditCard className="w-4 h-4" />, color: 'text-green-400', bgColor: 'bg-green-900/30' },
  DEVICE: { icon: <Smartphone className="w-4 h-4" />, color: 'text-purple-400', bgColor: 'bg-purple-900/30' },
  IP: { icon: <Wifi className="w-4 h-4" />, color: 'text-cyan-400', bgColor: 'bg-cyan-900/30' },
  EMAIL: { icon: <Mail className="w-4 h-4" />, color: 'text-amber-400', bgColor: 'bg-amber-900/30' },
  PHONE: { icon: <Phone className="w-4 h-4" />, color: 'text-pink-400', bgColor: 'bg-pink-900/30' },
  TRANSACTION: { icon: <DollarSign className="w-4 h-4" />, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  MERCHANT: { icon: <Building className="w-4 h-4" />, color: 'text-indigo-400', bgColor: 'bg-indigo-900/30' },
  LOCATION: { icon: <MapPin className="w-4 h-4" />, color: 'text-emerald-400', bgColor: 'bg-emerald-900/30' },
  DOCUMENT: { icon: <FileText className="w-4 h-4" />, color: 'text-orange-400', bgColor: 'bg-orange-900/30' },
  EVENT: { icon: <Calendar className="w-4 h-4" />, color: 'text-violet-400', bgColor: 'bg-violet-900/30' },
  CASE: { icon: <Target className="w-4 h-4" />, color: 'text-red-400', bgColor: 'bg-red-900/30' },
  DEFAULT: { icon: <Search className="w-4 h-4" />, color: 'text-forensic-muted', bgColor: 'bg-forensic-bg' },
};

const riskColors = {
  critical: 'border-red-500/50 bg-red-900/20',
  high: 'border-orange-500/50 bg-orange-900/20',
  medium: 'border-yellow-500/50 bg-yellow-900/20',
  low: 'border-green-500/50 bg-green-900/20',
  verified: 'border-emerald-500/50 bg-emerald-900/20',
};

function CustomNode({ data, selected }: { data: GraphNodeData; selected: boolean }) {
  const config = nodeTypeConfig[data.type] || nodeTypeConfig.DEFAULT;
  const riskClass = riskColors[data.riskLevel as keyof typeof riskColors] || riskColors.low;

  return (
    <div
      className={cn(
        'custom-node flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200',
        'min-w-[140px] max-w-[180px]',
        riskClass,
        selected && 'ring-2 ring-forensic-accent ring-offset-2 ring-offset-forensic-bg shadow-lg shadow-forensic-accent/20'
      )}
      style={{ boxShadow: selected ? '0 0 20px rgba(0, 212, 170, 0.4)' : undefined }}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bgColor, 'border', config.color.replace('text-', 'border-'))}>
        {config.icon}
      </div>
      <div className="text-center">
        <p className="font-mono text-xs font-bold text-forensic-text truncate w-full px-1">{data.label}</p>
        <p className="text-[10px] text-forensic-muted capitalize">{data.type.toLowerCase()}</p>
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="risk" value={data.riskLevel} size="xs">{data.riskLevel}</Badge>
          {data.isSuspicious && <Badge variant="signal" value="high" size="xs">High</Badge>}
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-forensic-accent border-2 border-forensic-bg" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-forensic-accent border-2 border-forensic-bg" />
      <Handle type="source" position={Position.Left} className="w-3 h-3 bg-forensic-accent border-2 border-forensic-bg" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 bg-forensic-accent border-2 border-forensic-bg" />
    </div>
  );
}

function CustomEdge({ data }: { data: GraphEdgeData }) {
  const relationshipLabels: Record<string, string> = {
    OWNS: 'owns',
    USED: 'used',
    LOGGED_IN_FROM: 'logged in from',
    TRANSFERRED_TO: 'transferred to',
    CONNECTED_TO: 'connected to',
    LOCATED_AT: 'located at',
    ASSOCIATED_WITH: 'associated with',
    COMMUNICATED_WITH: 'communicated with',
    CREATED: 'created',
    MODIFIED: 'modified',
    RECEIVED: 'received',
    SENT: 'sent',
  };

  const label = data.label || relationshipLabels[data.relationshipType] || data.relationshipType.toLowerCase().replace(/_/g, ' ');

  return (
    <>
      <path
        stroke={data.strength > 0.7 ? '#ef4444' : data.strength > 0.4 ? '#f59e0b' : '#00d4aa'}
        strokeWidth={Math.max(1, data.strength * 3)}
        strokeDasharray={data.confidence < 0.5 ? '5,5' : 'none'}
        markerEnd={MarkerType.ArrowClosed}
        className="transition-all duration-200"
      />
      {data.evidenceIds.length > 0 && (
        <text
          x="50%"
          y="-10"
          textAnchor="middle"
          className="text-[10px] font-mono text-forensic-accent"
          dominantBaseline="middle"
        >
          {data.evidenceIds[0]}
        </text>
      )}
    </>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface GraphCanvasProps {
  nodes: Node<GraphNodeData>[];
  edges: Edge<GraphEdgeData>[];
  onNodesChange: OnNodesChange<Node<GraphNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<GraphEdgeData>>;
  onConnect: OnConnect;
  onNodeClick?: (node: Node<GraphNodeData>) => void;
  onEdgeClick?: (edge: Edge<GraphEdgeData>) => void;
  fitView?: boolean;
  showControls?: boolean;
  className?: string;
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
}

export function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  fitView = false,
  showControls = true,
  className,
}: GraphCanvasProps) {
  return (
    <div className={cn('relative h-full w-full bg-forensic-bg', className)} style={{ height: '100%' }}>
      <div className="absolute top-4 right-4 z-10 flex gap-2" style={{ pointerEvents: 'none' }}>
        {showControls && (
          <>
            <Button variant="outline" size="icon" className="bg-forensic-surface border-forensic-border" onClick={() => {}} style={{ pointerEvents: 'auto' }}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-forensic-surface border-forensic-border" onClick={() => {}} style={{ pointerEvents: 'auto' }}>
              <Minus className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-forensic-surface border-forensic-border" onClick={() => {}} style={{ pointerEvents: 'auto' }}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-forensic-surface border-forensic-border" onClick={() => {}} style={{ pointerEvents: 'auto' }}>
              <Layers className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <div className="h-full w-full" style={{ pointerEvents: 'auto' }}>
        <div className="h-full w-full">
          <div className="h-full w-full">
            <div className="h-full w-full">
              <div className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EntityGraph({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onNodeSelect,
  onEdgeSelect,
  fitView = true,
  className,
}: {
  nodes?: Node<GraphNodeData>[];
  edges?: Edge<GraphEdgeData>[];
  onNodeSelect?: (node: Node<GraphNodeData>) => void;
  onEdgeSelect?: (edge: Edge<GraphEdgeData>) => void;
  fitView?: boolean;
  className?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<GraphNodeData> | null>(null);

  const handleNodeClick = useCallback((node: Node<GraphNodeData>) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  const handleEdgeClick = useCallback((edge: Edge<GraphEdgeData>) => {
    onEdgeSelect?.(edge);
  }, [onEdgeSelect]);

  const handleConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge({ ...connection, type: 'custom', data: { 
      id: `edge-${Date.now()}`, 
      relationshipType: 'CONNECTED_TO', 
      confidence: 1, 
      evidenceIds: [], 
      strength: 1 
    } as GraphEdgeData }, eds));
  }, [setEdges]);

  return (
    <Card variant="default" padding="none" className={cn('h-[600px]', className)}>
      <div className="h-full">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          fitView={fitView}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
        />
      </div>

      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-forensic-text">Node Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-forensic-bg flex items-center justify-center">
                  {nodeTypeConfig[selectedNode.data.type]?.icon || nodeTypeConfig.DEFAULT.icon}
                </span>
                <div>
                  <p className="font-mono text-forensic-text">{selectedNode.data.label}</p>
                  <p className="text-xs text-forensic-muted capitalize">{selectedNode.data.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-forensic-muted">Risk Score</p>
                  <p className="font-mono text-forensic-text">{Math.round(selectedNode.data.riskScore * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs text-forensic-muted">Risk Level</p>
                  <Badge variant="risk" value={selectedNode.data.riskLevel} size="xs">{selectedNode.data.riskLevel}</Badge>
                </div>
              </div>
              { (selectedNode.data.evidenceIds as string[])?.length && (
                <div>
                  <p className="text-xs text-forensic-muted mb-1">Evidence</p>
                  <div className="flex flex-wrap gap-1">
                    {(selectedNode.data.evidenceIds as string[]).map((id: string) => (
                      <Badge key={id} variant="evidence" size="xs">{id}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" leftIcon={<Eye className="w-3 h-3" />} className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Link2 className="w-3 h-3" />} className="flex-1">
                  Trace
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}

export interface GraphControlsFilters {
  types: string[];
  relationshipTypes: string[];
  minConfidence: number;
}

export function GraphControls({
  layout,
  onLayoutChange,
  filters,
  onFiltersChange,
  onFitView,
  onReset,
  onExport,
}: {
  layout: string;
  onLayoutChange: (layout: string) => void;
  filters: GraphControlsFilters;
  onFiltersChange: (filters: GraphControlsFilters) => void;
  onFitView: () => void;
  onReset: () => void;
  onExport: () => void;
}) {
  const layouts = [
    { value: 'dagre', label: 'Hierarchical' },
    { value: 'force', label: 'Force Directed' },
    { value: 'circular', label: 'Circular' },
    { value: 'grid', label: 'Grid' },
  ];

  const nodeTypes = ['USER', 'ACCOUNT', 'DEVICE', 'IP', 'EMAIL', 'PHONE', 'TRANSACTION', 'MERCHANT', 'LOCATION', 'DOCUMENT'];
  const relTypes = ['OWNS', 'USED', 'LOGGED_IN_FROM', 'TRANSFERRED_TO', 'CONNECTED_TO', 'LOCATED_AT', 'ASSOCIATED_WITH', 'COMMUNICATED_WITH'];

  return (
    <Card variant="default" padding="md">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-mono text-forensic-muted mb-1">Layout</label>
            <select
              value={layout}
              onChange={e => onLayoutChange(e.target.value)}
              className="px-3 py-1.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            >
              {layouts.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-forensic-muted mb-1">Node Types</label>
            <select
              multiple
              value={filters.types}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                onFiltersChange({ ...filters, types: selected });
              }}
              className="px-3 py-1.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
            >
              {nodeTypes.map(type => (
                <option key={type} value={type} className="bg-forensic-bg text-forensic-text">{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-forensic-muted mb-1">Relationships</label>
            <select
              multiple
              value={filters.relationshipTypes}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                onFiltersChange({ ...filters, relationshipTypes: selected });
              }}
              className="px-3 py-1.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
            >
              {relTypes.map(type => (
                <option key={type} value={type} className="bg-forensic-bg text-forensic-text">{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onFitView} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Fit View
          </Button>
          <Button variant="outline" size="sm" onClick={onReset} leftIcon={<Layers className="w-4 h-4" />}>
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function GraphLegend() {
  return (
    <Card variant="default" padding="md" className="w-64">
      <h4 className="font-semibold text-forensic-text mb-3">Legend</h4>
      <div className="space-y-2">
        {Object.entries(nodeTypeConfig).map(([type, config]) => (
          type !== 'DEFAULT' && (
            <div key={type} className="flex items-center gap-2">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center border', config.bgColor, config.color.replace('text-', 'border-'))}>
                {config.icon}
              </div>
              <span className="text-sm text-forensic-text capitalize">{type.toLowerCase().replace(/_/g, ' ')}</span>
            </div>
          )
        ))}
        <div className="pt-2 border-t border-forensic-border/50">
          <p className="text-xs font-mono text-forensic-muted mb-2">Risk Levels</p>
          <div className="space-y-1">
            {Object.entries(riskColors).map(([level, style]) => (
              <div key={level} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded', style)} />
                <span className="text-xs text-forensic-text capitalize">{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}