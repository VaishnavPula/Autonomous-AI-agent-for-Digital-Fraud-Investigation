"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";

interface GraphCanvasProps {
  nodes: any[];
  edges: any[];
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onNodeClick: (node: any) => void;
  selectedNodeId: string | null;
  width: number;
  height: number;
}

const nodeTypeColors: Record<string, string> = {
  USER: "#3b82f6",
  ACCOUNT: "#22c55e",
  DEVICE: "#a855f7",
  IP: "#f97316",
  EMAIL: "#ec4899",
  PHONE: "#06b6d4",
  TRANSACTION: "#eab308",
  MERCHANT: "#6366f1",
  LOCATION: "#14b8a6",
  DOCUMENT: "#94a3b8",
  EVENT: "#ef4444",
  CASE: "#8b5cf6",
};

const riskColors: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
  VERY_LOW: "#10b981",
};

const TEMP = 1;

export function GraphCanvas({
  nodes,
  edges,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onNodeClick,
  selectedNodeId,
  width,
  height,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const centerX = width / 2 / zoom + pan.x;
    const centerY = height / 2 / zoom + pan.y;

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      pos[node.id] = {
        x: centerX + radius * Math.cos(i * 2 * Math.PI / nodes.length),
        y: centerY + radius * Math.sin(i * 2 * Math.PI / nodes.length),
      };
    });

    return pos;
  }, [nodes, edges, width, height, zoom, pan]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    const gridSize = 50 * zoom;
    const offsetX = pan.x * zoom;
    const offsetY = pan.y * zoom;
    
    for (let x = -offsetX % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -offsetY % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    for (const edge of edges) {
      const source = positions[edge.source];
      const target = positions[edge.target];
      if (!source || !target) continue;
      
      const sx = (source.x - pan.x) * zoom;
      const sy = (source.y - pan.y) * zoom;
      const tx = (target.x - pan.x) * zoom;
      const ty = (target.y - pan.y) * zoom;
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = Math.max(0.5, 1.5 * edge.weight * zoom);
      ctx.stroke();
      
      if (edge.direction === "directed") {
        const angle = Math.atan2(ty - sy, tx - sx);
        const arrowSize = 8 * zoom;
        ctx.beginPath();
        ctx.moveTo(tx - arrowSize * Math.cos(angle - Math.PI / 6), ty - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tx, ty);
        ctx.lineTo(tx - arrowSize * Math.cos(angle + Math.PI / 6), ty - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    for (const node of nodes) {
      const pos = positions[node.id];
      if (!pos) continue;
      
      const x = (pos.x - pan.x) * zoom;
      const y = (pos.y - pan.y) * zoom;
      const radius = Math.max(8, Math.min(30, 12 * zoom));
      const isSelected = node.id === selectedNodeId;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeTypeColors[node.node_type] || "#64748b";
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? "#22d3ee" : riskColors[node.risk_level] || "#64748b";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      
      if (isSelected) {
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.font = `${Math.max(10, 11 * zoom)}px monospace`;
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "center";
      ctx.fillText(node.node_id, x, y + radius + 14 * zoom);
      
      if (node.risk_level !== "VERY_LOW" && node.risk_level !== "LOW") {
        ctx.beginPath();
        ctx.arc(x + radius * 0.7, y - radius * 0.7, 6 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = riskColors[node.risk_level] || "#ef4444";
        ctx.fill();
      }
    }
  }, [nodes, edges, zoom, pan, selectedNodeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationRef.current!);
  }, [draw, width, height]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(3, zoom * delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = (e.clientX - rect.left) / zoom + pan.x;
    const mouseY = (e.clientY - rect.top) / zoom + pan.y;
    
    for (const node of nodes) {
      const pos = positions[node.id];
      if (pos) {
        const dx = pos.x - mouseX;
        const dy = pos.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25 / zoom) {
          onNodeClick(nodes.find(n => n.id === node.id));
          break;
        }
      }
    }
  }, [nodes, onNodeClick, pan, positions, zoom]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, cursor: "grab" }}
      onWheel={handleWheel}
      onClick={handleClick}
      tabIndex={0}
    />
  );
}