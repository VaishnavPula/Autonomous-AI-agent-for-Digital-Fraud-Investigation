'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className={cn('min-h-screen bg-forensic-bg flex items-center justify-center', 'forensic-grid')}>
        <div className="text-center">
          <div className="w-16 h-16 bg-forensic-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-forensic-accent animate-spin" />
          </div>
          <Loader2 className="w-8 h-8 text-forensic-accent animate-spin mx-auto" />
          <p className="mt-4 text-forensic-muted">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-forensic-bg flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-900/30 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-forensic-text mb-2">Access Denied</h1>
          <p className="text-forensic-muted">
            You don't have permission to access this page. Required role: {allowedRoles.join(' or ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/cases');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forensic-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-forensic-accent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}