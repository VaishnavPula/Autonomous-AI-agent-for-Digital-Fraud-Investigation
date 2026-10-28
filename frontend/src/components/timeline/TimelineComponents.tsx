'use client';

import { ReactNode } from 'react';
import { cn, formatTimestamp, formatRelativeTime } from '@/lib/utils';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  User,
  DollarSign,
  Smartphone,
  Wifi,
  MapPin,
  MessageSquare,
  PlusCircle,
  FileText,
  AlertTriangle,
  Shield,
  Search,
  Zap,
  Key,
  Lock,
  Unlock,
  UserPlus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Filter,
  Download,
} from 'lucide-react';

export interface TimelineEventItem {
  id: string;
  eventId: string;
  type: string;
  timestamp: string;
  entityIds: string[];
  description: string;
  details?: Record<string, unknown>;
  evidenceIds: string[];
  riskScore: number;
  isSuspicious: boolean;
  behavioralDeviation?: Record<string, unknown>;
  source?: string;
}

const eventTypeConfig: Record<string, { icon: ReactNode; color: string; label: string }> = {
  LOGIN: { icon: <User className="w-4 h-4" />, color: 'text-blue-400', label: 'Login' },
  TRANSACTION: { icon: <DollarSign className="w-4 h-4" />, color: 'text-green-400', label: 'Transaction' },
  PASSWORD_CHANGE: { icon: <Key className="w-4 h-4" />, color: 'text-orange-400', label: 'Password Change' },
  PASSWORD_RESET: { icon: <Key className="w-4 h-4" />, color: 'text-red-400', label: 'Password Reset' },
  DEVICE_REGISTRATION: { icon: <Smartphone className="w-4 h-4" />, color: 'text-purple-400', label: 'Device Registration' },
  IP_CHANGE: { icon: <Wifi className="w-4 h-4" />, color: 'text-cyan-400', label: 'IP Change' },
  LOCATION_CHANGE: { icon: <MapPin className="w-4 h-4" />, color: 'text-emerald-400', label: 'Location Change' },
  COMMUNICATION: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-pink-400', label: 'Communication' },
  ACCOUNT_CREATION: { icon: <UserPlus className="w-4 h-4" />, color: 'text-indigo-400', label: 'Account Creation' },
  DOCUMENT_UPLOAD: { icon: <FileText className="w-4 h-4" />, color: 'text-amber-400', label: 'Document Upload' },
  BENEFICIARY_ADDED: { icon: <UserPlus className="w-4 h-4" />, color: 'text-red-400', label: 'Beneficiary Added' },
  ACCOUNT_LOCK: { icon: <Lock className="w-4 h-4" />, color: 'text-red-400', label: 'Account Lock' },
  MFA_CHANGE: { icon: <Shield className="w-4 h-4" />, color: 'text-blue-400', label: 'MFA Change' },
  SUSPICIOUS_ACTIVITY: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', label: 'Suspicious Activity' },
  ALERT: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-orange-400', label: 'Alert' },
  INVESTIGATOR_ACTION: { icon: <Search className="w-4 h-4" />, color: 'text-forensic-accent', label: 'Investigator Action' },
  AI_DISCOVERY: { icon: <Zap className="w-4 h-4" />, color: 'text-purple-400', label: 'AI Discovery' },
  SESSION_START: { icon: <Unlock className="w-4 h-4" />, color: 'text-green-400', label: 'Session Start' },
  SESSION_END: { icon: <Lock className="w-4 h-4" />, color: 'text-gray-400', label: 'Session End' },
  DEFAULT: { icon: <Clock className="w-4 h-4" />, color: 'text-forensic-muted', label: 'Event' },
};

export function TimelineEvent({
  event,
  index,
  total,
  onClick,
  onExpand,
  expanded = false,
  showEvidence = true,
  showEntities = true,
  compact = false,
}: {
  event: TimelineEventItem;
  index: number;
  total: number;
  onClick?: () => void;
  onExpand?: () => void;
  expanded?: boolean;
  showEvidence?: boolean;
  showEntities?: boolean;
  compact?: boolean;
}) {
  const config = eventTypeConfig[event.type] || eventTypeConfig.DEFAULT;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const riskLevel = event.riskScore > 0.8 ? 'critical' : event.riskScore > 0.6 ? 'high' : event.riskScore > 0.3 ? 'medium' : 'low';

  if (compact) {
    return (
      <div
        className={cn('flex items-start gap-3 p-2', onClick && 'cursor-pointer hover:bg-forensic-elevated/50 rounded-lg')}
        onClick={onClick}
      >
        <div className="flex flex-col items-center relative">
          <div className={cn('w-3 h-3 rounded-full border-2', config.color.replace('text-', 'bg-'))} />
          {!isLast && <div className="flex-1 w-0.5 bg-forensic-border/50" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
            <span className="text-xs text-forensic-muted font-mono">{formatTimestamp(event.timestamp)}</span>
            {event.isSuspicious && <Badge variant="signal" value="high" size="xs">High</Badge>}
            <Badge variant="risk" value={riskLevel} size="xs">{riskLevel}</Badge>
          </div>
          <p className="text-sm text-forensic-text truncate mt-0.5">{event.description}</p>
          {showEvidence && event.evidenceIds.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {event.evidenceIds.slice(0, 3).map(id => (
                <Badge key={id} variant="evidence" size="xs">{id}</Badge>
              ))}
              {event.evidenceIds.length > 3 && (
                <Badge variant="default" size="xs">+{event.evidenceIds.length - 3}</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center relative flex-shrink-0">
          <div className={cn('w-4 h-4 rounded-full border-3 z-10 flex items-center justify-center', config.color.replace('text-', 'bg-'))}>
            {config.icon}
          </div>
          {!isLast && <div className="flex-1 w-0.5 bg-forensic-border/50" />}
        </div>

        <div className="flex-1 min-w-0" onClick={onClick}>
          <Card variant="outlined" padding="md" className={cn(onClick && 'cursor-pointer hover:border-forensic-accent/50 transition-colors')}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
                  <span className="text-xs text-forensic-muted font-mono">{formatTimestamp(event.timestamp)}</span>
                  <span className="text-xs text-forensic-muted">({formatRelativeTime(event.timestamp)})</span>
                  {event.isSuspicious && <Badge variant="signal" value="high" size="sm">High</Badge>}
                  <Badge variant="risk" value={riskLevel} size="sm">{riskLevel}</Badge>
                  {event.source && <Badge variant="default" size="sm">{event.source}</Badge>}
                </div>

                <p className="text-forensic-text">{event.description}</p>

                {event.behavioralDeviation && Object.keys(event.behavioralDeviation).length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs font-mono text-yellow-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Behavioral Deviation Detected
                    </p>
                    <pre className="text-xs text-forensic-text overflow-auto max-h-32">
                      {JSON.stringify(event.behavioralDeviation, null, 2)}
                    </pre>
                  </div>
                )}

                {(showEvidence && event.evidenceIds.length > 0) || (showEntities && event.entityIds.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {showEvidence && event.evidenceIds.map(id => (
                      <span key={id} onClick={e => { e.stopPropagation(); }} className="cursor-pointer">
                        <Badge variant="evidence" size="sm">{id}</Badge>
                      </span>
                    ))}
                    {showEntities && event.entityIds.map(id => (
                      <span key={id} onClick={e => { e.stopPropagation(); }} className="cursor-pointer">
                        <Badge variant="default" size="sm" className="bg-blue-900/30 border-blue-500/30 text-blue-400">{id}</Badge>
                      </span>
                    ))}
                  </div>
                )}

                {expanded && event.details && (
                  <div className="mt-3 pt-3 border-t border-forensic-border/50">
                    <pre className="text-xs text-forensic-muted bg-forensic-bg p-3 rounded border border-forensic-border/50 overflow-auto max-h-64">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onExpand?.(); }} aria-label={expanded ? 'Collapse' : 'Expand'}>
                  {expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); }} aria-label="View evidence">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export interface TimelineFilters {
  types?: string[];
  dateRange?: { start: string; end: string };
  riskRange?: { min: number; max: number };
  entities?: string[];
  search?: string;
}

export function Timeline({
  events,
  onEventClick,
  onEventExpand,
  expandedEvents = new Set(),
  filters = {},
  onFilterChange,
  loading = false,
  compact = false,
  emptyMessage = 'No timeline events found',
}: {
  events: TimelineEventItem[];
  onEventClick?: (event: TimelineEventItem) => void;
  onEventExpand?: (eventId: string) => void;
  expandedEvents?: Set<string>;
  filters?: TimelineFilters;
  onFilterChange?: (filters: TimelineFilters) => void;
  loading?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}) {
  const eventTypes = [
    'LOGIN', 'TRANSACTION', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
    'DEVICE_REGISTRATION', 'IP_CHANGE', 'LOCATION_CHANGE', 'COMMUNICATION',
    'ACCOUNT_CREATION', 'DOCUMENT_UPLOAD', 'BENEFICIARY_ADDED', 'ACCOUNT_LOCK',
    'MFA_CHANGE', 'SUSPICIOUS_ACTIVITY', 'ALERT', 'INVESTIGATOR_ACTION', 'AI_DISCOVERY',
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full border-3 bg-forensic-border" />
              <div className="flex-1 w-0.5 bg-forensic-border/50" />
            </div>
            <Card variant="outlined" padding="md" className="flex-1">
              <div className="h-4 bg-forensic-border rounded w-1/4 mb-2" />
              <div className="h-3 bg-forensic-border rounded w-3/4" />
              <div className="h-3 bg-forensic-border rounded w-1/2" />
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card variant="outlined" padding="lg" className="text-center">
        <Clock className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
        <p className="text-forensic-muted">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-forensic-surface rounded-xl border border-forensic-border">
        <div className="flex-1">
          <label className="block text-xs font-mono text-forensic-muted mb-1">Search Events</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
            <input
              type="text"
              placeholder="Search by description, entity, evidence..."
              value={filters.search || ''}
              onChange={e => onFilterChange?.({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            multiple
            value={filters.types || []}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
              onFilterChange?.({ ...filters, types: selected });
            }}
            className="px-3 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 min-w-[150px]"
          >
            {eventTypes.map(type => {
              const config = eventTypeConfig[type];
              return (
                <option key={type} value={type} className="bg-forensic-bg text-forensic-text">
                  {config.label}
                </option>
              );
            })}
          </select>
          <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />}>
            Filters
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-3" role="timeline" aria-label="Investigation timeline">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            index={index}
            total={events.length}
            onClick={() => onEventClick?.(event)}
            onExpand={() => onEventExpand?.(event.id)}
            expanded={expandedEvents.has(event.id)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

export function TimelineZoomControls({
  scale,
  onScaleChange,
  onReset,
  onJumpToNow,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
  onJumpToNow: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-3 bg-forensic-surface border border-forensic-border rounded-lg">
      <Button variant="ghost" size="icon" onClick={() => onScaleChange(scale / 1.5)} aria-label="Zoom out">
        <Minus className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset zoom">
        <Clock className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onScaleChange(scale * 1.5)} aria-label="Zoom in">
        <Plus className="w-4 h-4" />
      </Button>
      <span className="px-3 text-sm font-mono text-forensic-text">{Math.round(scale * 100)}%</span>
      <Button variant="ghost" size="sm" onClick={onJumpToNow} className="ml-auto">
        <Clock className="w-4 h-4 mr-1" />
        Now
      </Button>
    </div>
  );
}

export function TimelineEventGroup({
  date,
  events,
  onEventClick,
  onEventExpand,
  expandedEvents,
}: {
  date: string;
  events: TimelineEventItem[];
  onEventClick?: (event: TimelineEventItem) => void;
  onEventExpand?: (eventId: string) => void;
  expandedEvents?: Set<string>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-forensic-border/50" />
        <span className="px-3 py-1 bg-forensic-bg border border-forensic-border rounded-full text-xs font-mono text-forensic-muted">
          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <div className="flex-1 h-px bg-forensic-border/50" />
      </div>
      <div className="space-y-3 ml-6 border-l border-forensic-border/50 pl-4">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            index={index}
            total={events.length}
            onClick={() => onEventClick?.(event)}
            onExpand={() => onEventExpand?.(event.id)}
            expanded={expandedEvents?.has(event.id)}
          />
        ))}
      </div>
    </div>
  );
}