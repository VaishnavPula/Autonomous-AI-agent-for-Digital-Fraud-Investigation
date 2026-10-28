'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  FolderOpen,
  FileText,
  Clock,
  Users,
  DollarSign,
  Network,
  Search,
  Shield,
  Activity,
  FileOutput,
  History,
  Settings,
  ChevronRight,
  Zap,
  AlertTriangle,
  Eye,
  Layers,
  Command,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: Home, shortcut: 'G O' },
  { name: 'Cases', href: '/cases', icon: FolderOpen, shortcut: 'G C' },
  { name: 'Evidence', href: '/evidence', icon: FileText, shortcut: 'G E' },
  { name: 'Timeline', href: '/timeline', icon: Clock, shortcut: 'G T' },
  { name: 'Entities', href: '/entities', icon: Users, shortcut: 'G N' },
  { name: 'Transactions', href: '/transactions', icon: DollarSign, shortcut: 'G X' },
  { name: 'Network', href: '/network', icon: Network, shortcut: 'G N' },
  { name: 'Investigator', href: '/investigator', icon: Search, shortcut: 'G I' },
  { name: 'Risk', href: '/risk', icon: Shield, shortcut: 'G R' },
  { name: 'Actions', href: '/actions', icon: Activity, shortcut: 'G A' },
  { name: 'Reports', href: '/reports', icon: FileOutput, shortcut: 'G R' },
  { name: 'Audit', href: '/audit', icon: History, shortcut: 'G U' },
  { name: 'Settings', href: '/settings', icon: Settings, shortcut: 'G S' },
];

const quickActions = [
  { name: 'New Case', href: '/cases/new', icon: FileText },
  { name: 'Upload Evidence', href: '/evidence/upload', icon: AlertTriangle },
  { name: 'Trace Mode', href: '/trace', icon: Eye },
  { name: 'Trace Board', href: '/board', icon: Layers },
  { name: 'Command Palette', href: '#', icon: Command, shortcut: '⌘K' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase?: { id: string; title: string } | null;
  children?: ReactNode;
}

export function Sidebar({ isOpen, onClose, currentCase, children }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-forensic-surface border-r border-forensic-border',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-forensic-border">
            <Link href="/" className="flex items-center gap-2" onClick={onClose}>
              <div className="w-10 h-10 bg-forensic-accent/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-forensic-accent" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-forensic-text">TRACE X</h1>
                <p className="text-xs text-forensic-muted font-mono">v0.1.0-dev</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary navigation">
            {navigation.map(item => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-forensic-accent/10 text-forensic-accent border border-forensic-accent/30'
                      : 'text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-forensic-accent')} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 text-forensic-accent" />}
                  <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs font-mono bg-forensic-bg border border-forensic-border rounded text-forensic-muted/50">
                    {item.shortcut}
                  </kbd>
                </Link>
              );
            })}
          </nav>

          {currentCase && (
            <div className="p-3 border-t border-forensic-border bg-forensic-bg/50">
              <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-2">Current Case</p>
              <Link
                href={`/cases/${currentCase.id}`}
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 bg-forensic-elevated rounded-lg border border-forensic-border hover:border-forensic-accent/50 transition-colors"
              >
                <FolderOpen className="w-5 h-5 text-forensic-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-forensic-text truncate">{currentCase.id}</p>
                  <p className="text-xs text-forensic-muted truncate">{currentCase.title}</p>
                </div>
              </Link>
            </div>
          )}

          <div className="p-3 border-t border-forensic-border">
            <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-2">Quick Actions</p>
            <div className="space-y-1">
              {quickActions.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated transition-colors"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-forensic-bg border border-forensic-border rounded text-forensic-muted/50">
                        {item.shortcut}
                      </kbd>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-forensic-border bg-forensic-bg/50">
            <p className="text-xs font-mono text-forensic-muted uppercase tracking-wider mb-2">System Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-forensic-text">API</span>
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-forensic-muted">Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-forensic-text">Database</span>
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-forensic-muted">Connected</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-forensic-text">AI Provider</span>
                <span className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-forensic-accent" />
                  <span className="text-forensic-muted">Mock</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}