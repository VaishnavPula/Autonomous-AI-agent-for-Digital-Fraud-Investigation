import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEvidenceId(id: string): string {
  return id.toUpperCase();
}

export function formatCaseId(id: string): string {
  return id.toUpperCase();
}

export function formatEntityId(id: string): string {
  return id.toUpperCase();
}

export function formatTransactionId(id: string): string {
  return id.toUpperCase();
}

export function formatTimestamp(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(d);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getRiskColor(risk: string): string {
  const riskLower = risk.toLowerCase();
  if (riskLower === 'critical') return 'text-red-400 bg-red-900/30 border-red-500/30';
  if (riskLower === 'high') return 'text-orange-400 bg-orange-900/30 border-orange-500/30';
  if (riskLower === 'medium') return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
  if (riskLower === 'low') return 'text-green-400 bg-green-900/30 border-green-500/30';
  if (riskLower === 'verified') return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30';
  return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
}

export function getSignalColor(severity: string): string {
  const sevLower = severity.toLowerCase();
  if (sevLower === 'critical') return 'text-red-400';
  if (sevLower === 'high') return 'text-orange-400';
  if (sevLower === 'medium') return 'text-yellow-400';
  if (sevLower === 'low') return 'text-blue-400';
  return 'text-gray-400';
}

export function getIntegrityColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower === 'verified') return 'text-green-400 bg-green-900/30 border-green-500/30';
  if (statusLower === 'warning') return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
  if (statusLower === 'corrupted') return 'text-red-400 bg-red-900/30 border-red-500/30';
  if (statusLower === 'pending') return 'text-blue-400 bg-blue-900/30 border-blue-500/30';
  return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-emerald-400';
  if (confidence >= 0.7) return 'text-green-400';
  if (confidence >= 0.5) return 'text-yellow-400';
  if (confidence >= 0.3) return 'text-orange-400';
  return 'text-red-400';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length - 3)}...`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBytes(bytes: number): string {
  return formatFileSize(bytes);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}