'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  DollarSign,
  Users,
  Clock,
  Zap,
  FileText,
  HelpCircle,
} from 'lucide-react';

export interface RiskFactor {
  id: string;
  name: string;
  value: number;
  maxValue?: number;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'verified';
  trend?: 'up' | 'down' | 'stable';
  evidenceCount?: number;
}

export interface RiskAssessment {
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'verified';
  financialExposure: number;
  evidenceStrength: number;
  investigationConfidence: number;
  fraudProbability: number;
  falsePositiveRisk: number;
  factors: RiskFactor[];
  unresolvedQuestions: string[];
}

const riskLevelConfig = {
  critical: { label: 'CRITICAL', color: 'text-red-400 bg-red-900/30 border-red-500/30', icon: <XCircle className="w-5 h-5" /> },
  high: { label: 'HIGH', color: 'text-orange-400 bg-orange-900/30 border-orange-500/30', icon: <AlertTriangle className="w-5 h-5" /> },
  medium: { label: 'MEDIUM', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30', icon: <AlertCircle className="w-5 h-5" /> },
  low: { label: 'LOW', color: 'text-green-400 bg-green-900/30 border-green-500/30', icon: <CheckCircle className="w-5 h-5" /> },
  verified: { label: 'VERIFIED', color: 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30', icon: <Shield className="w-5 h-5" /> },
};

export function RiskBadge({ level, size = 'md', dot = true, ...props }: { level: string; size?: 'xs' | 'sm' | 'md' | 'lg'; dot?: boolean }) {
  const config = riskLevelConfig[level.toLowerCase() as keyof typeof riskLevelConfig] || riskLevelConfig.medium;
  return (
    <Badge variant="risk" value={level} size={size} dot={dot} className={config.color} {...props}>
      {config.label}
    </Badge>
  );
}

export function RiskGauge({
  value,
  label,
  size = 'md',
  showValue = true,
  thresholds = [0.3, 0.6, 0.8],
}: {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  thresholds?: number[];
}) {
  const sizes = {
    sm: { width: 60, height: 60, stroke: 6, fontSize: 'text-xs' },
    md: { width: 100, height: 100, stroke: 8, fontSize: 'text-sm' },
    lg: { width: 140, height: 140, stroke: 10, fontSize: 'text-base' },
  };

  const { width, height, stroke, fontSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  let color = '#22c55e';
  if (value > thresholds[2]) color = '#ef4444';
  else if (value > thresholds[1]) color = '#f59e0b';
  else if (value > thresholds[0]) color = '#3b82f6';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="transform -rotate-90">
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#1a2330"
            strokeWidth={stroke}
          />
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-mono font-bold', fontSize)}>
              {Math.round(value * 100)}%
            </span>
          </div>
        )}
      </div>
      {label && <p className="mt-2 text-sm text-forensic-muted text-center">{label}</p>}
    </div>
  );
}

export function RiskScoreCard({
  assessment,
  compact = false,
}: {
  assessment: RiskAssessment;
  compact?: boolean;
}) {
  const config = riskLevelConfig[assessment.riskLevel];

  if (compact) {
    return (
      <Card variant="elevated" padding="md" className="min-w-[200px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Overall Risk</p>
            <div className="flex items-center gap-2 mt-1">
              <RiskGauge value={assessment.overallScore} size="sm" label="" />
              <RiskBadge level={assessment.riskLevel} size="sm" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-forensic-muted">Financial Exposure</p>
            <p className="font-mono text-lg text-forensic-text">
              ${assessment.financialExposure.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs font-mono text-forensic-muted">Confidence</p>
            <p className="font-mono text-forensic-text">{Math.round(assessment.investigationConfidence * 100)}%</p>
          </div>
          <div>
            <p className="text-xs font-mono text-forensic-muted">Evidence Strength</p>
            <p className="font-mono text-forensic-text">{Math.round(assessment.evidenceStrength * 100)}%</p>
          </div>
          <div>
            <p className="text-xs font-mono text-forensic-muted">False Positive</p>
            <p className="font-mono text-forensic-text">{Math.round(assessment.falsePositiveRisk * 100)}%</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-forensic-bg rounded-xl border border-forensic-border">
            {config.icon}
          </div>
          <div>
            <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">Overall Risk Score</p>
            <div className="flex items-center gap-3 mt-1">
              <RiskBadge level={assessment.riskLevel} size="lg" />
              <RiskGauge value={assessment.overallScore} size="md" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-forensic-bg rounded-xl border border-forensic-border">
            <p className="text-xs font-mono text-forensic-muted">Financial Exposure</p>
            <p className="font-mono text-2xl text-forensic-text">${assessment.financialExposure.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-forensic-bg rounded-xl border border-forensic-border">
            <p className="text-xs font-mono text-forensic-muted">Investigation Confidence</p>
            <p className="font-mono text-2xl text-forensic-text">{Math.round(assessment.investigationConfidence * 100)}%</p>
          </div>
          <div className="p-3 bg-forensic-bg rounded-xl border border-forensic-border">
            <p className="text-xs font-mono text-forensic-muted">Evidence Strength</p>
            <p className="font-mono text-2xl text-forensic-text">{Math.round(assessment.evidenceStrength * 100)}%</p>
          </div>
          <div className="p-3 bg-forensic-bg rounded-xl border border-forensic-border">
            <p className="text-xs font-mono text-forensic-muted">False Positive Risk</p>
            <p className="font-mono text-2xl text-forensic-text">{Math.round(assessment.falsePositiveRisk * 100)}%</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-forensic-text mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-forensic-accent" />
            Risk Factors
          </h3>
          <div className="space-y-3">
            {assessment.factors.map(factor => {
              const factorConfig = riskLevelConfig[factor.severity];
              return (
                <div key={factor.id} className="p-4 bg-forensic-bg rounded-xl border border-forensic-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-forensic-text">{factor.name}</h4>
<Badge variant="risk" value={factor.severity} size="sm" className={factorConfig.color}>{factor.severity}</Badge>
                        {factor.trend && (
                          <span className={cn('flex items-center gap-1 text-xs', factor.trend === 'up' && 'text-red-400', factor.trend === 'down' && 'text-green-400', factor.trend === 'stable' && 'text-forensic-muted')}>
                            {factor.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                            {factor.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                            {factor.trend === 'stable' && <Minus className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-forensic-muted">{factor.description}</p>
                      <div className="mt-2 h-2 bg-forensic-bg rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${(factor.value / (factor.maxValue || 1)) * 100}%`, backgroundColor: factorConfig.color.split(' ')[0].replace('text-', '') }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      {factor.evidenceCount !== undefined && (
                        <span className="text-xs text-forensic-muted flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {factor.evidenceCount} evidence
                        </span>
                      )}
                      <span className="font-mono text-forensic-text">
                        {(factor.value / (factor.maxValue || 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-forensic-text mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-forensic-accent" />
            Unresolved Questions
          </h3>
          {assessment.unresolvedQuestions.length > 0 ? (
            <div className="space-y-2">
              {assessment.unresolvedQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-forensic-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-forensic-text">{question}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-forensic-muted border border-forensic-border/50 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p>No unresolved questions</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function RiskFactorList({ factors, title = 'Risk Factors' }: { factors: RiskFactor[]; title?: string }) {
  return (
    <Card variant="default" padding="md">
      <h3 className="text-lg font-semibold text-forensic-text mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-forensic-accent" />
        {title}
      </h3>
      <div className="space-y-2">
        {factors.map(factor => {
          const factorConfig = riskLevelConfig[factor.severity];
          return (
            <div key={factor.id} className="p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-forensic-text">{factor.name}</h4>
                  <Badge variant="risk" value={factor.severity} size="sm" className={factorConfig.color}>{factor.severity}</Badge>
                </div>
                <span className="font-mono text-forensic-text">
                  {(factor.value / (factor.maxValue || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-forensic-bg rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(factor.value / (factor.maxValue || 1)) * 100}%`, backgroundColor: factorConfig.color.split(' ')[0].replace('text-', '') }}
                />
              </div>
              <p className="text-xs text-forensic-muted mt-1">{factor.description}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function RiskTrendIndicator({ value, previousValue, label }: { value: number; previousValue: number; label: string }) {
  const change = value - previousValue;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="flex items-center gap-2 p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
      <div className="flex-1">
        <p className="text-xs font-mono text-forensic-muted">{label}</p>
        <p className="font-mono text-lg text-forensic-text">{Math.round(value * 100)}%</p>
      </div>
      <div className={cn('flex items-center gap-1 font-mono', isPositive && 'text-red-400', isNegative && 'text-green-400', !isPositive && !isNegative && 'text-forensic-muted')}>
        {isPositive && <TrendingUp className="w-5 h-5" />}
        {isNegative && <TrendingDown className="w-5 h-5" />}
        {!isPositive && !isNegative && <Minus className="w-5 h-5" />}
        <span>{change > 0 ? '+' : ''}{Math.round(change * 100)}%</span>
      </div>
    </div>
  );
}

export function RiskSummaryCards({ assessment }: { assessment: RiskAssessment }) {
  const cards = [
    { label: 'Risk Score', value: `${Math.round(assessment.overallScore * 100)}%`, icon: Target, trend: assessment.factors.reduce((sum, f) => sum + f.value, 0) / Math.max(assessment.factors.length, 1) },
    { label: 'Confidence', value: `${Math.round(assessment.investigationConfidence * 100)}%`, icon: CheckCircle },
    { label: 'Evidence Strength', value: `${Math.round(assessment.evidenceStrength * 100)}%`, icon: FileText },
    { label: 'Financial Exposure', value: `$${assessment.financialExposure.toLocaleString()}`, icon: DollarSign },
    { label: 'Fraud Probability', value: `${Math.round(assessment.fraudProbability * 100)}%`, icon: AlertTriangle },
    { label: 'False Positive Risk', value: `${Math.round(assessment.falsePositiveRisk * 100)}%`, icon: XCircle },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card key={index} variant="elevated" padding="md" className="text-center">
          <card.icon className="w-6 h-6 text-forensic-accent mx-auto mb-2" />
          <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider">{card.label}</p>
          <p className="font-mono text-2xl text-forensic-text mt-1">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}