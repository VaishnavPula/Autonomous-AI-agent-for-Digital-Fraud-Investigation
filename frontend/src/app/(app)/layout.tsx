'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout>{children}</Layout>
      </ProtectedRoute>
    </AuthProvider>
  );
}