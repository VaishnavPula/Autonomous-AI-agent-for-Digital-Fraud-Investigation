"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatRelativeTime, formatTimestamp, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { graphService } from "@/lib/graph";
import { GraphNodeItem, GraphEdgeItem, GraphStats, CommunityItem, PathFindingResponse } from "@/types/graph";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
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
  Search as SearchIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Users,
  Link2,
  Settings,
  Layers,
  Minus,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

const riskLevelColors: Record<string, string> = {
  CRITICAL: "bg-red-900/30 border-red-500/30 text-red-400",
  HIGH: "bg-orange-900/30 border-orange-500/30 text-orange-400",
  MEDIUM: "bg-yellow-900/30 border-yellow-500/30 text-yellow-400",
  LOW: "bg-green-900/30 border-green-500/30 text-green-400",
  VERY_LOW: "bg-emerald-900/30 border-emerald-500/30 text-emerald-400",
};

const entityTypeColors: Record<string, string> = {
  USER: "bg-blue-500",
  ACCOUNT: "bg-green-500",
  DEVICE: "bg-purple-500",
  IP: "bg-orange-500",
  EMAIL: "bg-pink-500",
  PHONE: "bg-cyan-500",
  TRANSACTION: "bg-yellow-500",
  MERCHANT: "bg-indigo-500",
  LOCATION: "bg-teal-500",
  DOCUMENT: "bg-gray-500",
  EVENT: "bg-red-500",
  CASE: "bg-violet-500",
};

export default function GraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');
  const [graphData, setGraphData] = useState<{ nodes: GraphNodeItem[]; edges: GraphEdgeItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [riskFilter, setRiskFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [showPathModal, setShowPathModal] = useState(false);
  const [pathResult, setPathResult] = useState<PathFindingResponse | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [showCentralityModal, setShowCentralityModal] = useState(false);
  const [centralityData, setCentralityData] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<'graph' | 'nodes' | 'edges'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNodeItem | null>(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [allTypes, setAllTypes] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const fetchGraph = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const response = await graphService.getGraph({
        case_id: caseId,
        node_types: typeFilter.length > 0 ? typeFilter : undefined,
        edge_types: undefined,
        min_confidence: 0.5,
        max_depth: 3,
      });
      setGraphData({ nodes: response.nodes, edges: response.edges });
      const types = Array.from(new Set(response.nodes.map(n => n.node_type)));
      setAllTypes(types);
    } catch (error) {
      console.error("Failed to fetch graph:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!caseId) return;
    try {
      const data = await graphService.getStats(caseId);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchGraph();
    if (caseId) fetchStats();
  }, [caseId, typeFilter, riskFilter]);

  const handleFindPath = async (sourceId: string, targetId: string) => {
    if (!caseId) return;
    try {
      const result = await graphService.findPath({
        case_id: caseId,
        source_id: sourceId,
        target_id: targetId,
        algorithm: "dijkstra",
        max_hops: 10,
        min_weight: 0,
      });
      setPathResult(result);
      setShowPathModal(true);
    } catch (error) {
      console.error("Path finding failed:", error);
    }
  };

  const handleDetectCommunities = async () => {
    if (!caseId) return;
    try {
      const result = await graphService.detectCommunities({
        case_id: caseId,
        algorithm: "louvain",
        min_community_size: 3,
        resolution: 1.0,
      });
      setCommunities(result.communities);
      setShowCommunityModal(true);
    } catch (error) {
      console.error("Community detection failed:", error);
    }
  };

  const handleCentrality = async () => {
    if (!caseId) return;
    try {
      const result = await graphService.getCentrality({
        case_id: caseId,
        metric: "pagerank",
        top_k: 20,
      });
      setCentralityData(result.top_nodes);
      setShowCentralityModal(true);
    } catch (error) {
      console.error("Centrality calculation failed:", error);
    }
  };

  const handleNodeClick = (node: GraphNodeItem) => {
    setSelectedNode(node);
    setShowNodeDetail(true);
  };

  const columns = [
    { key: 'node_id', header: 'Node ID', render: (row: GraphNodeItem) => <span className="font-mono text-forensic-accent">{row.node_id}</span> },
    { key: 'node_type', header: 'Type', render: (row: GraphNodeItem) => (
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", entityTypeColors[row.node_type] || "bg-gray-500")} />
        <span className="font-medium text-forensic-text">{row.node_type}</span>
      </div>
    )},
    { key: 'label', header: 'Label', render: (row: GraphNodeItem) => <span className="font-mono text-forensic-text">{row.label}</span> },
    { key: 'risk_level', header: 'Risk', render: (row: GraphNodeItem) => <span className={cn("inline-flex items-center px-2 py-1 text-xs font-mono rounded-full", riskLevelColors[row.risk_level] || "bg-forensic-border text-forensic-muted")}>{row.risk_level}</span> },
    { key: 'risk_score', header: 'Risk Score', render: (row: GraphNodeItem) => <span className="font-mono text-forensic-text">{Math.round(row.risk_score * 100)}%</span> },
  ];

  if (!caseId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-forensic-text">Network Graph</h1>
          <p className="text-forensic-muted">Select a case to view the network graph</p>
        </div>
        <Card variant="default" padding="lg" className="text-center">
          <Network className="w-16 h-16 mx-auto mb-4 text-forensic-muted" />
          <p className="text-forensic-muted">No case selected. Navigate from a case detail page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-forensic-bg flex flex-col">
      <div className="h-14 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg text-forensic-text">NETWORK GRAPH</span>
            <Badge variant="evidence" size="sm">{caseId.slice(0, 8)}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-forensic-muted">
            <span className="font-mono">Nodes: {graphData?.nodes.length || 0}</span>
            <span className="font-mono">Edges: {graphData?.edges.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(3, zoom + 0.2))} title="Zoom In"><ZoomIn className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.2))} title="Zoom Out"><ZoomOut className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset View"><RotateCcw className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" leftIcon={<Brain className="w-4 h-4" />} onClick={handleDetectCommunities}>Communities</Button>
            <Button variant="outline" size="sm" leftIcon={<Target className="w-4 h-4" />} onClick={handleCentrality}>Centrality</Button>
            <Button variant="primary" leftIcon={<Network className="w-4 h-4" />} onClick={fetchGraph}>Refresh</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={cn(
          "flex-1 flex flex-col",
          activePanel === 'graph' ? 'block' : 'hidden'
        )}>
          <div className="h-full w-full relative">
            <GraphCanvas
              nodes={graphData?.nodes || []}
              edges={graphData?.edges || []}
              zoom={zoom}
              pan={pan}
              onZoomChange={setZoom}
              onPanChange={setPan}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id ?? null}
              width={window.innerWidth - 320}
              height={window.innerHeight - 80}
            />
          </div>
        </div>

        <div className={cn(
          "w-80 border-l border-forensic-border bg-forensic-surface flex flex-col overflow-hidden",
          activePanel !== 'graph' ? 'hidden' : 'block'
        )}>
          <div className="h-14 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm flex items-center justify-between px-4">
            <h3 className="font-semibold text-forensic-text">Graph Controls</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-forensic-text">Filters</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={typeFilter.includes('USER')} onChange={e => setTypeFilter(e.target.checked ? [...typeFilter, 'USER'] : typeFilter.filter(t => t !== 'USER'))} className="rounded border-forensic-border text-forensic-accent" />
                  <span className="text-sm text-forensic-text">Users</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={typeFilter.includes('ACCOUNT')} onChange={e => setTypeFilter(e.target.checked ? [...typeFilter, 'ACCOUNT'] : typeFilter.filter(t => t !== 'ACCOUNT'))} className="rounded border-forensic-border text-forensic-accent" />
                  <span className="text-sm text-forensic-text">Accounts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={typeFilter.includes('DEVICE')} onChange={e => setTypeFilter(e.target.checked ? [...typeFilter, 'DEVICE'] : typeFilter.filter(t => t !== 'DEVICE'))} className="rounded border-forensic-border text-forensic-accent" />
                  <span className="text-sm text-forensic-text">Devices</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={typeFilter.includes('IP')} onChange={e => setTypeFilter(e.target.checked ? [...typeFilter, 'IP'] : typeFilter.filter(t => t !== 'IP'))} className="rounded border-forensic-border text-forensic-accent" />
                  <span className="text-sm text-forensic-text">IPs</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={typeFilter.includes('TRANSACTION')} onChange={e => setTypeFilter(e.target.checked ? [...typeFilter, 'TRANSACTION'] : typeFilter.filter(t => t !== 'TRANSACTION'))} className="rounded border-forensic-border text-forensic-accent" />
                  <span className="text-sm text-forensic-text">Transactions</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-forensic-text">Actions</h4>
              <Button variant="outline" className="w-full justify-start" leftIcon={<Users className="w-4 h-4" />} onClick={handleDetectCommunities}>Find Communities</Button>
              <Button variant="outline" className="w-full justify-start" leftIcon={<Target className="w-4 h-4" />} onClick={handleCentrality}>Centrality Analysis</Button>
              <Button variant="outline" className="w-full justify-start" leftIcon={<Link2 className="w-4 h-4" />} onClick={() => setShowPathModal(true)}>Find Path</Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-forensic-text">Stats</h4>
              {stats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-forensic-muted">Nodes</span><span className="font-mono text-forensic-text">{stats.node_count}</span></div>
                  <div className="flex justify-between"><span className="text-forensic-muted">Edges</span><span className="font-mono text-forensic-text">{stats.edge_count}</span></div>
                  <div className="flex justify-between"><span className="text-forensic-muted">Density</span><span className="font-mono text-forensic-text">{stats.density.toFixed(4)}</span></div>
                  <div className="flex justify-between"><span className="text-forensic-muted">Avg Degree</span><span className="font-mono text-forensic-text">{stats.avg_degree.toFixed(2)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        showPathModal ? "flex" : "hidden"
      )}>
        <Modal isOpen={showPathModal} onClose={() => setShowPathModal(false)} title="Find Path" size="lg">
          <PathFinder caseId={caseId!} onClose={() => setShowPathModal(false)} onPathFound={setPathResult} />
        </Modal>
      </div>

      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        showCommunityModal ? "flex" : "hidden"
      )}>
        <Modal isOpen={showCommunityModal} onClose={() => setShowCommunityModal(false)} title="Communities" size="lg">
          <CommunityView communities={communities} onClose={() => setShowCommunityModal(false)} />
        </Modal>
      </div>

      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        showCentralityModal ? "flex" : "hidden"
      )}>
        <Modal isOpen={showCentralityModal} onClose={() => setShowCentralityModal(false)} title="Centrality Analysis" size="lg">
          <CentralityView data={centralityData} onClose={() => setShowCentralityModal(false)} />
        </Modal>
      </div>

      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        showNodeDetail ? "flex" : "hidden"
      )}>
        <Modal isOpen={showNodeDetail} onClose={() => { setShowNodeDetail(false); setSelectedNode(null); }} title="Node Details" size="md">
          <NodeDetailView node={selectedNode} onClose={() => { setShowNodeDetail(false); setSelectedNode(null); }} />
        </Modal>
      </div>
    </div>
  );
}

function PathFinder({ caseId, onClose, onPathFound }: { caseId: string; onClose: () => void; onPathFound: (path: any) => void }) {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;
    setLoading(true);
    try {
      const result = await graphService.findPath({
        case_id: caseId,
        source_id: sourceId,
        target_id: targetId,
        algorithm: "dijkstra",
        max_hops: 10,
        min_weight: 0,
      });
      onPathFound(result);
      onClose();
    } catch (err) {
      setError("No path found between selected nodes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Source Node ID *</label>
        <input type="text" value={sourceId} onChange={e => setSourceId(e.target.value)} placeholder="ENT-001" className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-forensic-text mb-1">Target Node ID *</label>
        <input type="text" value={targetId} onChange={e => setTargetId(e.target.value)} placeholder="ENT-002" className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50" required />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Find Path</Button>
      </div>
    </form>
  );
}

function CommunityView({ communities, onClose }: { communities: CommunityItem[]; onClose: () => void }) {
  return (
    <div className="space-y-4">
      {communities.map((comm, i) => (
        <Card key={comm.community_id} variant="default" padding="md" className="border-l-4 border-forensic-accent">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-forensic-text">Community {i + 1}</h4>
            <Badge variant="default" size="sm">{comm.size} nodes</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {comm.node_details.slice(0, 10).map(node => (
              <span key={node.id} className="px-2 py-1 bg-forensic-bg rounded text-xs font-mono text-forensic-accent">{node.node_id}</span>
            ))}
            {comm.size > 10 && <span className="text-xs text-forensic-muted">+{comm.size - 10} more</span>}
          </div>
          <div className="text-xs text-forensic-muted mt-2">
            Internal weight: {comm.internal_weight.toFixed(2)} • External weight: {comm.external_weight.toFixed(2)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CentralityView({ data, onClose }: { data: any[]; onClose: () => void }) {
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {data.map((item, i) => (
        <div key={item.node_id} className="flex items-center justify-between p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-forensic-accent/10 border border-forensic-accent/30 flex items-center justify-center font-mono text-forensic-accent text-sm">{i + 1}</span>
            <div>
              <p className="font-mono text-forensic-text">{item.label}</p>
              <p className="text-xs text-forensic-muted">{item.type}</p>
            </div>
          </div>
          <span className="font-mono text-forensic-accent">{item.score.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
}

function NodeDetailView({ node, onClose }: { node: GraphNodeItem | null; onClose: () => void }) {
  if (!node) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", entityTypeColors[node.node_type] + "/20 border " + entityTypeColors[node.node_type])}>
          <span className="font-mono text-lg">{node.node_type[0]}</span>
        </div>
        <div>
          <h4 className="font-mono text-forensic-text">{node.node_id}</h4>
          <p className="text-sm text-forensic-muted">{node.node_type}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs text-forensic-muted">Risk Score</p>
          <p className="font-mono text-forensic-text">{Math.round(node.risk_score * 100)}%</p>
        </div>
        <div className="p-2 bg-forensic-bg rounded border border-forensic-border/50">
          <p className="text-xs text-forensic-muted">Risk Level</p>
          <RiskBadge level={node.risk_level} size="sm" />
        </div>
      </div>
      <div className="p-3 bg-forensic-bg rounded border border-forensic-border/50">
        <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-1">Properties</p>
        <pre className="font-mono text-xs text-forensic-text overflow-x-auto">{JSON.stringify(node.properties, null, 2)}</pre>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}