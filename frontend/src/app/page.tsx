'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, RiskBadge, StatusBadge } from '@/components/ui/Badge';
import {
  Zap,
  ArrowRight,
  Shield,
  Users,
  Network,
  Clock,
  Brain,
  Eye,
  Layers,
  RefreshCw,
  Play,
  Pause,
  FastForward,
  Terminal,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Search,
  FileText,
  DollarSign,
  Target,
  Activity,
  GitBranch,
  Hash,
  Microscope,
  Command,
  Link2,
  Globe,
  BarChart3,
  ShieldCheck,
  Fingerprint,
  Route,
  Code2,
  Server,
  Wifi,
  Database as DatabaseIcon,
} from 'lucide-react';

const features = [
  {
    icon: Link2,
    title: 'Evidence Reconstruction',
    desc: 'Normalize, hash, and chain-of-custody track every piece of digital evidence from ingestion to report.',
    accent: 'text-blue-400',
  },
  {
    icon: Users,
    title: 'Entity Intelligence',
    desc: 'Resolve identities across transactions, devices, IPs, and accounts with deterministic matching and confidence scoring.',
    accent: 'text-green-400',
  },
  {
    icon: Clock,
    title: 'Temporal Investigation',
    desc: 'Build precise timelines with sub-minute correlation, impossible travel detection, and behavioral baseline comparison.',
    accent: 'text-yellow-400',
  },
  {
    icon: DollarSign,
    title: 'Money-Flow Tracing',
    desc: 'Follow multi-hop transfers, detect fan-in/fan-out patterns, and visualize rapid fund movement with full evidence provenance.',
    accent: 'text-orange-400',
  },
  {
    icon: Brain,
    title: 'Explainable AI',
    desc: 'Multi-agent investigation with structured findings, evidence citations, competing hypotheses, and confidence calibration.',
    accent: 'text-purple-400',
  },
  {
    icon: RefreshCw,
    title: 'Investigation Replay',
    desc: 'Time-machine replay of evidence arrival, graph evolution, risk changes, and human decisions for full auditability.',
    accent: 'text-cyan-400',
  },
];

const demoCase = {
  id: 'TX-2048',
  title: 'Coordinated Account Takeover & Rapid Fund Movement',
  status: 'INVESTIGATING',
  riskLevel: 'CRITICAL',
  evidenceCount: 47,
  entitiesCount: 23,
  transactionsCount: 156,
  hypothesesCount: 4,
  timeline: [
    { time: '10:04', event: 'New device login', risk: 'medium' },
    { time: '10:07', event: 'New IP address detected', risk: 'medium' },
    { time: '10:09', event: 'Password reset initiated', risk: 'high' },
    { time: '10:11', event: 'High-value transaction ($47,500)', risk: 'critical' },
    { time: '10:12', event: 'Rapid transfer to Account B', risk: 'critical' },
    { time: '10:14', event: 'Account locked by system', risk: 'high' },
  ],
};

function AnimatedGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 opacity-30 pointer-events-none',
        'background-[linear-gradient(rgba(0,212,170,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,170,0.03)_1px,transparent_1px)]',
        'background-[size:40px_40px]',
        className
      )}
      aria-hidden="true"
    />
  );
}

function Scanline({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,212,170,0.02), rgba(0,212,170,0.02) 1px, transparent 1px, transparent 3px)',
          animation: 'scan 8s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-forensic-accent/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
          25% { transform: translate(30px, -30px) scale(1.2); opacity: 0.2; }
          50% { transform: translate(-20px, 20px) scale(0.8); opacity: 0.15; }
          75% { transform: translate(10px, -40px) scale(1.1); opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}

function TracePathAnimation() {
  const pathRef = useRef<SVGPathElement>(null);
  const pathLength = 1200;

  useEffect(() => {
    if (pathRef.current) {
      pathRef.current.style.strokeDasharray = `${pathLength}`;
      pathRef.current.style.strokeDashoffset = `${pathLength}`;
      pathRef.current.style.animation = `traceDraw 3s ease-in-out infinite`;
    }
  }, []);

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <style jsx>{`
          @keyframes traceDraw {
            0% { stroke-dashoffset: 1200; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0; }
          }
        `}</style>
      </defs>
      <path
        ref={pathRef}
        d="M10,50 Q25,10 50,50 T90,50"
        stroke="url(#traceGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="traceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0" />
          <stop offset="50%" stopColor="#00d4aa" stopOpacity="1" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EvidenceNetworkViz() {
  const nodes = useRef([
    { id: 1, x: 50, y: 20, type: 'user', label: 'User A' },
    { id: 2, x: 30, y: 40, type: 'device', label: 'Device 1' },
    { id: 3, x: 70, y: 40, type: 'ip', label: '192.168.1.1' },
    { id: 4, x: 20, y: 60, type: 'tx', label: 'TX-001' },
    { id: 5, x: 50, y: 60, type: 'account', label: 'Account B' },
    { id: 6, x: 80, y: 60, type: 'tx', label: 'TX-002' },
    { id: 7, x: 40, y: 80, type: 'merchant', label: 'Merchant' },
  ]);

  const edges = [
    { from: 1, to: 2, type: 'used' },
    { from: 1, to: 3, type: 'logged' },
    { from: 2, to: 4, type: 'tx' },
    { from: 1, to: 5, type: 'owns' },
    { from: 5, to: 6, type: 'tx' },
    { from: 6, to: 7, type: 'tx' },
  ];

  const nodeColors: Record<string, string> = {
    user: '#3b82f6',
    device: '#8b5cf6',
    ip: '#06b6d4',
    tx: '#f59e0b',
    account: '#22c55e',
    merchant: '#ec4899',
  };

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes flow {
            0% { stroke-dashoffset: 20; opacity: 0.3; }
            100% { stroke-dashoffset: 0; opacity: 0.6; }
          }
        `}</style>
      </defs>
      {edges.map((edge, i) => {
        const from = nodes.current.find(n => n.id === edge.from);
        const to = nodes.current.find(n => n.id === edge.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#00d4aa"
            strokeWidth="1.5"
            strokeDasharray="5,5"
            strokeLinecap="round"
            opacity="0.4"
            style={{ animation: `flow 2s linear infinite`, animationDelay: `${i * 0.3}s` }}
          />
        );
      })}
      {nodes.current.map(node => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="6"
            fill={nodeColors[node.type]}
            opacity="0.8"
            style={{ animation: `pulse 2s ease-in-out infinite`, animationDelay: `${Math.random() * 2}s` }}
          />
          <text
            x={node.x}
            y={node.y + 14}
            fontSize="6"
            fill="#7a8a9a"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const nodeColors = {
  user: '#3b82f6',
  device: '#8b5cf6',
  ip: '#06b6d4',
  tx: '#f59e0b',
  account: '#22c55e',
  merchant: '#ec4899',
};

const sections = [
  {
    id: 'why',
    icon: Shield,
    title: 'Why TRACE X',
    desc: 'Traditional fraud tools flag anomalies. TRACE X reconstructs the complete evidence chain — from device fingerprint to fund destination — with full auditability and human oversight.',
    items: [
      'Evidence-first architecture, not alert-first',
      'Deterministic entity resolution before AI',
      'Chain-of-custody for every artifact',
      'Competing hypotheses, not single verdicts',
      'Human-in-the-loop for high-impact actions',
      'Full investigation replay for audit',
    ],
  },
  {
    id: 'evidence',
    icon: FileText,
    title: 'Evidence Reconstruction',
    desc: 'Normalize, hash, and chain-of-custody track every piece of digital evidence from ingestion to report.',
    items: [
      'SHA-256 hashing on ingestion',
      'Automatic format normalization (CSV, JSON, PDF, logs)',
      'Immutable chain-of-custody ledger',
      'Integrity verification on every access',
      'Evidence linking to entities & timeline',
      'Metadata preservation',
    ],
  },
  {
    id: 'entities',
    icon: Users,
    title: 'Entity Intelligence',
    desc: 'Resolve identities across transactions, devices, IPs, and accounts with deterministic matching and confidence scoring.',
    items: [
      'Multi-factor entity resolution (email, phone, device, IP)',
      'Confidence-scored merges with audit trail',
      'Cross-case entity tracking',
      'Risk scoring per entity',
      'Behavioral baseline per entity',
      'Real-time risk updates',
    ],
  },
  {
    id: 'temporal',
    icon: Clock,
    title: 'Temporal Investigation',
    desc: 'Build precise timelines with sub-minute correlation, impossible travel detection, and behavioral baseline comparison.',
    items: [
      'Sub-minute event correlation',
      'Impossible travel detection (geo + time)',
      'Behavioral baseline comparison',
      'Session reconstruction',
      'Temporal correlation graph',
      'Timeline replay with zoom',
    ],
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'Explainable AI',
    desc: 'Multi-agent investigation with structured findings, evidence citations, competing hypotheses, and confidence calibration.',
    items: [
      '12 specialized investigation agents',
      'Structured findings with evidence citations',
      'Competing hypotheses with confidence',
      'Alternative explanations required',
      'Missing evidence identification',
      'Deterministic fallback when AI unavailable',
    ],
  },
  {
    id: 'human',
    icon: Fingerprint,
    title: 'Human-in-the-Loop',
    desc: 'Investigators approve, reject, or modify every high-impact action with full audit trail.',
    items: [
      'Approve / Reject / Modify / Defer workflow',
      'Simulated actions (freeze, flag, escalate)',
      'Mandatory rationale for decisions',
      'Decision audit trail with before/after state',
      'Escalation paths for uncertainty',
      'Analyst feedback loop for model improvement',
    ],
  },
  {
    id: 'audit',
    icon: ShieldCheck,
    title: 'Auditability',
    desc: 'Every action, finding, and decision is logged with full provenance for regulatory and internal review.',
    items: [
      'Append-only audit log',
      'Evidence provenance tracking',
      'Investigation run reproducibility',
      'Model/rule versioning',
      'Chain-of-custody verification',
      'Regulatory export (PDF, JSON, CSV)',
    ],
  },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [intersecting, setIntersecting] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!demoPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % demoCase.timeline.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [demoPlaying]);

  const observer = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIntersecting(entry.target.id);
          }
        });
      }, { threshold: 0.1, rootMargin: '-50px' });

    document.querySelectorAll('section[id]').forEach(section => {
      observer.current?.observe(section);
    });

    return () => observer.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen relative bg-forensic-bg">
      <AnimatedGrid />
      <Scanline />
      <ParticleBackground />

      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-forensic-border/50 bg-forensic-surface/80 backdrop-blur-sm">
        <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="TRACE X Home">
            <div className="w-10 h-10 bg-forensic-accent/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-forensic-accent" />
            </div>
            <span className="font-bold text-xl text-forensic-text hidden sm:block">TRACE X</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            <Link href="#why" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Why TRACE X</Link>
            <Link href="#evidence" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Evidence</Link>
            <Link href="#entities" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Entities</Link>
            <Link href="#temporal" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Temporal</Link>
            <Link href="#ai" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">AI</Link>
            <Link href="#human" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Human-in-Loop</Link>
            <Link href="#audit" className="text-sm text-forensic-muted hover:text-forensic-accent transition-colors">Audit</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-forensic-muted hover:text-forensic-accent" aria-label="Command palette">
              <Command className="w-5 h-5" />
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-forensic-bg border border-forensic-border rounded">⌘K</kbd>
            </Button>
            <Link href="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Enter Investigation</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20">
          <div className="absolute inset-0 pointer-events-none">
            <EvidenceNetworkViz />
            <TracePathAnimation />
          </div>

          <AnimatedGrid />
          <Scanline />
          <ParticleBackground />

          <div className="relative max-w-5xl w-full space-y-12 text-center z-10">
            <Badge variant="accent" className="mb-6" size="lg">
              <Zap className="w-3 h-3 mr-1" />
              HACKATHON DEMO · PHASE 4 COMPLETE
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-forensic-text leading-[1.05]">
              Follow the Evidence.
              <br />
              <span className="text-forensic-accent">Reconstruct the Truth.</span>
            </h1>

            <p className="text-lg md:text-xl text-forensic-muted max-w-3xl mx-auto leading-relaxed">
              TRACE X transforms fragmented digital evidence into auditable investigation stories.
              Connect entities, trace money flows, detect anomalies, and generate evidence-grounded findings
              that survive scrutiny from both technical and non-technical judges.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/cases/TX-2048/board">
                <Button variant="primary" size="lg" className="group">
                  Enter Investigation
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="secondary" size="lg">Explore Live Demo</Button>
              </Link>
              <Link href="/docs/ARCHITECTURE.md">
                <Button variant="ghost" size="lg">View Architecture</Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-forensic-muted pt-8 border-t border-forensic-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Backend API: Running</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Database: Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-forensic-accent animate-pulse" />
                <span>AI Provider: Mock (Deterministic)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Graph Engine: Ready</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-forensic-muted" />
          </div>
        </section>

        <section id="why" className="relative px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="accent" size="md">Why TRACE X</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-forensic-text mt-4 mb-4">
                Built for Forensic Intelligence
              </h2>
              <p className="text-lg text-forensic-muted max-w-2xl mx-auto">
                Traditional fraud tools flag anomalies. TRACE X reconstructs the complete evidence chain — from device fingerprint to fund destination — with full auditability and human oversight.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections[0].items.map((item, i) => (
                <Card key={i} variant="elevated" padding="lg" className="group hover:border-forensic-accent/30 transition-all duration-300">
                  <div className="w-10 h-10 bg-forensic-accent/10 border border-forensic-accent/30 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-forensic-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-forensic-text mb-2">Evidence-first architecture</h3>
                  <p className="text-forensic-muted text-sm">{item}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {sections.slice(1).map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="relative px-6 py-24 border-t border-forensic-border/50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <Badge variant="accent" size="md">{section.title}</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-forensic-text mt-4 mb-4">
                  {section.title}
                </h2>
                <p className="text-lg text-forensic-muted max-w-2xl mx-auto">
                  {section.desc}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((item, i) => (
                  <Card key={i} variant="elevated" padding="lg" className="group hover:border-forensic-accent/30 transition-all duration-300">
                    <div className="w-10 h-10 bg-forensic-accent/10 border border-forensic-accent/30 rounded-xl flex items-center justify-center mb-4">
                      <section.icon className="w-5 h-5 text-forensic-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-forensic-text mb-2">{item}</h3>
                    <p className="text-forensic-muted text-sm">TRACE X implements this with deterministic, auditable pipelines.</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section id="demo" className="relative px-6 py-24 border-t border-forensic-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="accent" size="md">Live Demo</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-forensic-text mt-4 mb-4">
                Primary Demo Case: TX-2048
              </h2>
              <p className="text-lg text-forensic-muted max-w-2xl mx-auto">
                Coordinated Account Takeover & Rapid Fund Movement — watch the investigation unfold in real-time.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card variant="elevated" padding="lg" className="lg:col-span-2">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="evidence" size="sm">{demoCase.id}</Badge>
                      <StatusBadge status={demoCase.status} size="sm" />
                      <RiskBadge level={demoCase.riskLevel} size="sm" />
                    </div>
                    <h3 className="text-xl font-bold text-forensic-text">{demoCase.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDemoPlaying(!demoPlaying)} leftIcon={demoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}>
                      {demoPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(0)} leftIcon={<RefreshCw className="w-4 h-4" />}>
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentStep(Math.min(currentStep + 1, demoCase.timeline.length - 1))} leftIcon={<FastForward className="w-4 h-4" />}>
                      Step
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-forensic-bg p-4 rounded-lg border border-forensic-border">
                    <p className="text-forensic-muted text-sm">Evidence Items</p>
                    <p className="text-3xl font-bold text-forensic-accent font-mono">{demoCase.evidenceCount}</p>
                  </div>
                  <div className="bg-forensic-bg p-4 rounded-lg border border-forensic-border">
                    <p className="text-forensic-muted text-sm">Entities Resolved</p>
                    <p className="text-3xl font-bold text-forensic-accent font-mono">{demoCase.entitiesCount}</p>
                  </div>
                  <div className="bg-forensic-bg p-4 rounded-lg border border-forensic-border">
                    <p className="text-forensic-muted text-sm">Transactions</p>
                    <p className="text-3xl font-bold text-forensic-accent font-mono">{demoCase.transactionsCount}</p>
                  </div>
                  <div className="bg-forensic-bg p-4 rounded-lg border border-forensic-border">
                    <p className="text-forensic-muted text-sm">AI Hypotheses</p>
                    <p className="text-3xl font-bold text-forensic-accent font-mono">{demoCase.hypothesesCount}</p>
                  </div>
                </div>

                <div className="space-y-3" role="timeline" aria-label="Investigation timeline">
                  {demoCase.timeline.map((item, index) => (
                    <div
                      key={item.time}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg border transition-all duration-300',
                        index <= currentStep
                          ? 'bg-forensic-surface border-forensic-accent/30'
                          : 'bg-forensic-bg/50 border-forensic-border/50 opacity-50'
                      )}
                    >
                      <div className="flex flex-col items-center min-w-[80px]">
                        <span className="font-mono text-forensic-text">{item.time}</span>
                        <div className="w-0.5 h-8 bg-forensic-border/50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-forensic-text">{item.event}</p>
                        <RiskBadge level={item.risk} size="xs" />
                      </div>
                      <div className={cn(
                        'w-3 h-3 rounded-full transition-all duration-300',
                        index <= currentStep
                          ? 'bg-forensic-accent shadow-lg shadow-forensic-accent/50'
                          : 'bg-forensic-border/50'
                      )} />
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <Link href="/cases/TX-2048/board">
                    <Button variant="primary" className="flex-1">Open Trace Board</Button>
                  </Link>
                  <Link href="/cases/TX-2048/timeline">
                    <Button variant="outline" className="flex-1">View Full Timeline</Button>
                  </Link>
                  <Link href="/cases/TX-2048/network">
                    <Button variant="outline" className="flex-1">View Network Graph</Button>
                  </Link>
                </div>
              </Card>

              <Card variant="elevated" padding="lg">
                <h3 className="text-lg font-semibold text-forensic-text mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-forensic-accent" />
                  AI Hypotheses
                </h3>
                <div className="space-y-3">
                  {[
                    { title: 'Account Takeover', confidence: 87, evidence: ['EV-001', 'EV-007', 'EV-013'], alt: 'Legitimate new-device activity' },
                    { title: 'Coordinated Fraud', confidence: 72, evidence: ['EV-005', 'EV-011', 'EV-019'], alt: 'Data quality anomaly' },
                    { title: 'Insider Threat', confidence: 45, evidence: ['EV-003', 'EV-009'], alt: 'Authorized user behavior' },
                    { title: 'System Error', confidence: 12, evidence: ['EV-021'], alt: 'Timestamp synchronization issue' },
                  ].map((h, i) => (
                    <div key={i} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-forensic-text">{h.title}</span>
                        <Badge variant="confidence" value={h.confidence / 100} size="sm">{Math.round(h.confidence)}%</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {h.evidence.map(e => <Badge key={e} variant="evidence" size="xs">{e}</Badge>)}
                      </div>
                      <p className="text-xs text-forensic-muted">Alt: {h.alt}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-24 border-t border-forensic-border/50">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="accent" size="md">Ready to Investigate</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-forensic-text mt-4 mb-4">
              Start Your Investigation
            </h2>
            <p className="text-lg text-forensic-muted max-w-2xl mx-auto mb-8">
              Deploy TRACE X in your environment or explore the live demo. Every feature is built for production-grade forensic intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/cases/TX-2048/board">
                <Button variant="primary" size="lg" className="group">
                  Enter Investigation
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="secondary" size="lg">Explore Live Demo</Button>
              </Link>
              <Link href="/docs/ARCHITECTURE.md">
                <Button variant="ghost" size="lg">View Architecture</Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="relative border-t border-forensic-border/50 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-forensic-accent/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-forensic-accent" />
                  </div>
                  <span className="font-bold text-xl text-forensic-text">TRACE X</span>
                </Link>
                <p className="text-forensic-muted text-sm">"Follow the evidence. Reconstruct the truth."</p>
              </div>
              <div>
                <h4 className="font-semibold text-forensic-text mb-3">Product</h4>
                <ul className="space-y-2 text-sm text-forensic-muted">
                  <li><Link href="/cases" className="hover:text-forensic-accent transition-colors">Cases</Link></li>
                  <li><Link href="/evidence" className="hover:text-forensic-accent transition-colors">Evidence</Link></li>
                  <li><Link href="/network" className="hover:text-forensic-accent transition-colors">Network</Link></li>
                  <li><Link href="/reports" className="hover:text-forensic-accent transition-colors">Reports</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-forensic-text mb-3">Resources</h4>
                <ul className="space-y-2 text-sm text-forensic-muted">
                  <li><Link href="/docs" className="hover:text-forensic-accent transition-colors">Documentation</Link></li>
                  <li><Link href="/api" className="hover:text-forensic-accent transition-colors">API Reference</Link></li>
                  <li><Link href="/security" className="hover:text-forensic-accent transition-colors">Security</Link></li>
                  <li><Link href="/changelog" className="hover:text-forensic-accent transition-colors">Changelog</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-forensic-text mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-forensic-muted">
                  <li><Link href="/about" className="hover:text-forensic-accent transition-colors">About</Link></li>
                  <li><Link href="/careers" className="hover:text-forensic-accent transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-forensic-accent transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-forensic-accent transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-forensic-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-forensic-muted">2024 TRACE X. Built for hackathon demonstration.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-forensic-muted hover:text-forensic-accent transition-colors" aria-label="GitHub">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="#" className="text-forensic-muted hover:text-forensic-accent transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </main>
  );
}