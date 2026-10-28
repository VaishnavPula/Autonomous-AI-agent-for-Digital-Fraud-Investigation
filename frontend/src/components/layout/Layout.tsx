'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  currentCase?: { id: string; title: string; riskLevel: string; status: string } | null;
  investigationState?: string;
  threatLevel?: string;
  user?: { name: string; role: string; avatar?: string };
  notifications?: number;
}

export function Layout({
  children,
  currentCase,
  investigationState,
  threatLevel,
  user,
  notifications,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-forensic-bg">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentCase={currentCase ? { id: currentCase.id, title: currentCase.title } : null}
      />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Header
          currentCase={currentCase}
          investigationState={investigationState}
          threatLevel={threatLevel}
          onMenuClick={() => setSidebarOpen(true)}
          onCommandPalette={() => {}}
          user={user}
          notifications={notifications}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageLayout({ children, title, description, actions, breadcrumbs }: PageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-forensic-muted mb-2" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.label} className="flex items-center gap-2">
                  {index > 0 && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-forensic-accent transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-forensic-text font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-forensic-text tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-forensic-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Section({ children, title, description, className }: SectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {title && <h2 className="text-lg font-semibold text-forensic-text">{title}</h2>}
            {description && <p className="text-sm text-forensic-muted mt-0.5">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}