'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn, getRiskColor, getSignalColor, getIntegrityColor, getConfidenceColor } from '@/lib/utils';
import { XCircle, AlertTriangle as AlertTriangleIcon, AlertCircle as AlertCircleIcon, CheckCircle, Shield } from 'lucide-react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'risk' | 'signal' | 'integrity' | 'confidence' | 'status' | 'evidence' | 'accent';
  value?: string | number;
size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const baseStyles = 'inline-flex items-center font-mono font-medium rounded-full transition-all duration-200';

const sizes = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-0.5',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const riskLevelConfig = {
  critical: { label: 'CRITICAL', color: 'text-red-400 bg-red-900/30 border-red-500/30', icon: <XCircle className="w-5 h-5" /> },
  high: { label: 'HIGH', color: 'text-orange-400 bg-orange-900/30 border-orange-500/30', icon: <AlertTriangleIcon className="w-5 h-5" /> },
  medium: { label: 'MEDIUM', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30', icon: <AlertCircleIcon className="w-5 h-5" /> },
  low: { label: 'LOW', color: 'text-green-400 bg-green-900/30 border-green-500/30', icon: <CheckCircle className="w-5 h-5" /> },
  verified: { label: 'VERIFIED', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30', icon: <Shield className="w-5 h-5" /> },
};

const variants = {
  default: 'bg-forensic-surface border border-forensic-border text-forensic-text',
  risk: 'font-semibold',
  signal: 'font-semibold',
  integrity: 'font-semibold',
  confidence: 'font-semibold',
  status: 'font-medium',
  evidence: 'bg-forensic-accent/10 border-forensic-accent/30 text-forensic-accent font-mono',
  accent: 'bg-forensic-accent/10 border-forensic-accent/30 text-forensic-accent font-mono',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', value, size = 'md', dot = false, children, ...props }, ref) => {
    let variantClass = variants[variant];
    let content = children;

    if (variant === 'risk' && value) {
      variantClass = getRiskColor(String(value));
    } else if (variant === 'signal' && value) {
      variantClass = `bg-forensic-surface border-forensic-border ${getSignalColor(String(value))}`;
    } else if (variant === 'integrity' && value) {
      variantClass = getIntegrityColor(String(value));
    } else if (variant === 'confidence' && typeof value === 'number') {
      variantClass = `bg-forensic-surface border-forensic-border ${getConfidenceColor(value)}`;
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, sizes[size], variantClass, className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              variant === 'risk' && value && getRiskColor(String(value)).replace('bg-', 'bg-').replace('text-', 'bg-').replace('border-', 'bg-'),
              variant === 'signal' && value && getSignalColor(String(value)).replace('text-', 'bg-'),
              variant === 'integrity' && value && getIntegrityColor(String(value)).replace('text-', 'bg-').replace('border-', 'bg-'),
              variant === 'confidence' && typeof value === 'number' && getConfidenceColor(value).replace('text-', 'bg-'),
              variant === 'default' && 'bg-forensic-accent',
            )}
          />
        )}
        {content}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export function RiskBadge({ level, size = 'md', dot = true, ...props }: { level: string; size?: 'xs' | 'sm' | 'md' | 'lg'; dot?: boolean }) {
  const config = riskLevelConfig[level.toLowerCase() as keyof typeof riskLevelConfig] || riskLevelConfig.medium;
  return (
    <Badge variant="risk" value={level} size={size} dot={dot} {...props}>
      {config.label}
    </Badge>
  );
}

export function SignalBadge({ severity, size = 'md', dot = true, ...props }: { severity: string; size?: 'xs' | 'sm' | 'md' | 'lg'; dot?: boolean }) {
  return <Badge variant="signal" value={severity} size={size} dot={dot} {...props}>{severity}</Badge>;
}

export function IntegrityBadge({ status, size = 'md', dot = true, ...props }: { status: string; size?: 'xs' | 'sm' | 'md' | 'lg'; dot?: boolean }) {
  return <Badge variant="integrity" value={status} size={size} dot={dot} {...props}>{status}</Badge>;
}

export function ConfidenceBadge({ confidence, size = 'md', dot = true, showValue = true, ...props }: { confidence: number; size?: 'xs' | 'sm' | 'md' | 'lg'; dot?: boolean; showValue?: boolean }) {
  return (
    <Badge variant="confidence" value={confidence} size={size} dot={dot} {...props}>
      {showValue && `${Math.round(confidence * 100)}%`}
    </Badge>
  );
}

export function EvidenceBadge({ id, size = 'md', ...props }: { id: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return <Badge variant="evidence" size={size} {...props}>{id.toUpperCase()}</Badge>;
}

export function StatusBadge({ status, size = 'md', dot = true, ...props }: { status: string; size?: 'sm' | 'md' | 'lg'; dot?: boolean }) {
  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-900/30 border-blue-500/30 text-blue-400',
    TRIAGING: 'bg-purple-900/30 border-purple-500/30 text-purple-400',
    INVESTIGATING: 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400',
    EVIDENCE_REVIEW: 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400',
    RECONSTRUCTING: 'bg-violet-900/30 border-violet-500/30 text-violet-400',
    REMEDIATION: 'bg-orange-900/30 border-orange-500/30 text-orange-400',
    UNDER_REVIEW: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
    RESOLVED: 'bg-green-900/30 border-green-500/30 text-green-400',
    ESCALATED: 'bg-red-900/30 border-red-500/30 text-red-400',
    CLOSED: 'bg-gray-900/30 border-gray-500/30 text-gray-400',
    QUEUED: 'bg-gray-900/30 border-gray-500/30 text-gray-400',
    RUNNING: 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400',
    COMPLETED: 'bg-green-900/30 border-green-500/30 text-green-400',
    FAILED: 'bg-red-900/30 border-red-500/30 text-red-400',
    PARTIAL: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
    PROPOSED: 'bg-blue-900/30 border-blue-500/30 text-blue-400',
    TESTING: 'bg-purple-900/30 border-purple-500/30 text-purple-400',
    SUPPORTED: 'bg-green-900/30 border-green-500/30 text-green-400',
    REJECTED: 'bg-red-900/30 border-red-500/30 text-red-400',
    NEEDS_MORE_EVIDENCE: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
    GENERATING: 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400',
    PENDING: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
  };

  return (
    <Badge
      variant="status"
      className={statusColors[status.toUpperCase()] || statusColors.NEW}
      size={size}
      dot={dot}
      {...props}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}