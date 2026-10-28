'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  stickyHeader?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
  rowClassName,
  onRowClick,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  pagination,
  stickyHeader = true,
  className,
  ...props
}: TableProps<T>) {
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = new Set(selectedRows);
      if (checked) {
        data.forEach(row => newSelection.add(keyExtractor(row)));
      } else {
        data.forEach(row => newSelection.delete(keyExtractor(row)));
      }
      onSelectionChange(newSelection);
    }
  };

  const handleRowSelect = (row: T, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = new Set(selectedRows);
      const key = keyExtractor(row);
      if (checked) {
        newSelection.add(key);
      } else {
        newSelection.delete(key);
      }
      onSelectionChange(newSelection);
    }
  };

  const isSelected = (row: T) => selectedRows.has(keyExtractor(row));
  const allSelected = data.length > 0 && data.every(row => isSelected(row));
  const someSelected = data.some(row => isSelected(row)) && !allSelected;

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className={cn('w-full', className)} {...props}>
          <thead className="bg-forensic-bg border-b border-forensic-border">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-forensic-border text-forensic-accent focus:ring-forensic-accent"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-forensic-muted uppercase tracking-wider',
                    col.className,
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right'
                  )}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-forensic-border/50">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {selectable && <td className="px-4 py-3"><div className="w-4 h-4 bg-forensic-border rounded" /></td>}
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-forensic-border rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', className)} {...props}>
        <thead className={cn(
          'bg-forensic-bg border-b border-forensic-border',
          stickyHeader && 'sticky top-0 z-10'
        )}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  ref={inputRef => { if (inputRef) inputRef.indeterminate = someSelected; }}
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-forensic-border text-forensic-accent focus:ring-forensic-accent"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-forensic-muted uppercase tracking-wider',
                  col.className,
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-forensic-border/50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-forensic-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = keyExtractor(row);
              const selected = isSelected(row);
              return (
                <tr
                  key={key}
                  className={cn(
                    'transition-colors duration-150',
                    'hover:bg-forensic-elevated/50',
                    selected && 'bg-forensic-accent/5 border-l-2 border-forensic-accent',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row, index)
                  )}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && onRowClick) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={e => handleRowSelect(row, e.target.checked)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded border-forensic-border text-forensic-accent focus:ring-forensic-accent"
                        aria-label={`Select row ${index + 1}`}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-forensic-text',
                        col.className,
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right'
                      )}
                    >
                      {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-forensic-border bg-forensic-bg/50">
          <div className="text-sm text-forensic-muted">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={e => pagination.onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-3 py-1.5 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm hover:bg-forensic-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EvidenceTableColumn() {
  return (value: string) => <Badge variant="evidence" size="sm">{value}</Badge>;
}

export function RiskBadgeColumn() {
  return (value: string) => <Badge variant="risk" value={value} size="sm">{value}</Badge>;
}

export function SignalBadgeColumn() {
  return (value: string) => <Badge variant="signal" value={value} size="sm">{value}</Badge>;
}

export function StatusBadgeColumn() {
  return (value: string) => <Badge variant="status" size="sm">{value}</Badge>;
}

export function ConfidenceColumn() {
  return (value: number) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-forensic-bg rounded-full overflow-hidden">
        <div
          className="h-full bg-forensic-accent transition-all duration-300"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono text-forensic-muted w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function AmountColumn(currency = 'USD') {
  return (value: number) => (
    <span className="font-mono tabular-nums">
      {new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value)}
    </span>
  );
}

export function TimestampColumn() {
  return (value: string | Date) => (
    <span className="font-mono text-forensic-muted">
      {new Date(value).toISOString().replace('T', ' ').substring(0, 19)}
    </span>
  );
}