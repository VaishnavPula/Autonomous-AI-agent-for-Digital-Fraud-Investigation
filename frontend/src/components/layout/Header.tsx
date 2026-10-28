'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
  Menu,
  X,
  ChevronDown,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Evidence', href: '/evidence', icon: FileText },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Entities', href: '/entities', icon: Users },
  { name: 'Transactions', href: '/transactions', icon: DollarSign },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Investigator', href: '/investigator', icon: Search },
  { name: 'Risk', href: '/risk', icon: Shield },
  { name: 'Actions', href: '/actions', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileOutput },
  { name: 'Audit', href: '/audit', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface HeaderProps {
  currentCase?: { id: string; title: string; riskLevel: string; status: string } | null;
  investigationState?: string;
  threatLevel?: string;
  onMenuClick?: () => void;
  onCommandPalette?: () => void;
  user?: { name: string; role: string; avatar?: string };
  notifications?: number;
}

export function Header({
  currentCase,
  investigationState,
  threatLevel = 'LOW',
  onMenuClick,
  onCommandPalette,
  user,
  notifications = 0,
}: HeaderProps) {
  const pathname = usePathname();

  const threatColors: Record<string, string> = {
    LOW: 'text-green-400 bg-green-900/30 border-green-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
    HIGH: 'text-orange-400 bg-orange-900/30 border-orange-500/30',
    CRITICAL: 'text-red-400 bg-red-900/30 border-red-500/30',
  };

  return (
    <header className="h-16 border-b border-forensic-border bg-forensic-surface/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-forensic-text hover:text-forensic-accent"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Link href="/" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-forensic-elevated transition-colors">
            <div className="w-8 h-8 bg-forensic-accent/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-forensic-accent" />
            </div>
            <span className="font-bold text-lg text-forensic-text hidden sm:block">TRACE X</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Primary navigation">
            {navigation.map(item => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-forensic-accent/10 text-forensic-accent border border-forensic-accent/30'
                      : 'text-forensic-muted hover:text-forensic-text hover:bg-forensic-elevated'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
          {currentCase && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-forensic-bg rounded-lg border border-forensic-border">
              <div className="text-right">
                <p className="text-xs font-mono text-forensic-muted">CASE</p>
                <p className="font-mono text-sm text-forensic-text">{currentCase.id}</p>
              </div>
              <div className="w-px h-8 bg-forensic-border" />
              <div className="text-right">
                <p className="text-xs font-mono text-forensic-muted">STATE</p>
                <Badge variant="status" value={investigationState || 'NEW'} size="sm">{investigationState || 'NEW'}</Badge>
              </div>
              <div className="w-px h-8 bg-forensic-border" />
              <div className="text-right">
                <p className="text-xs font-mono text-forensic-muted">THREAT</p>
                <Badge
                  variant="risk"
                  value={threatLevel}
                  size="sm"
                  className={threatColors[threatLevel]}
                >{threatLevel}</Badge>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onCommandPalette}
            className="text-forensic-muted hover:text-forensic-accent"
            aria-label="Command palette (⌘K)"
          >
            <Search className="w-5 h-5" />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-forensic-bg border border-forensic-border rounded ml-1">
              ⌘K
            </kbd>
          </Button>

          {notifications > 0 && (
            <Button variant="ghost" size="icon" className="relative text-forensic-muted hover:text-forensic-accent">
              <AlertTriangle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-forensic-border">
            <div className="text-right">
              <p className="text-xs font-mono text-forensic-muted">{user?.role || 'ANALYST'}</p>
              <p className="font-medium text-forensic-text">{user?.name || 'Investigator'}</p>
            </div>
            <div className="w-8 h-8 bg-forensic-accent/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-forensic-accent" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}