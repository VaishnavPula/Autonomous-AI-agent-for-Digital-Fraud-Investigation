'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={cn(
      'min-h-screen bg-forensic-bg relative flex items-center justify-center px-4 py-12',
      'forensic-grid'
    )}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,212,170,0.02), rgba(0,212,170,0.02) 1px, transparent 1px, transparent 3px)',
          animation: 'scan 8s linear infinite',
        }} />
        <style jsx>{`
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `}</style>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-forensic-accent/20 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-forensic-accent" />
            </div>
            <span className="font-bold text-2xl text-forensic-text">TRACE X</span>
          </Link>
          <p className="text-forensic-muted">AI-Powered Fraud Investigation Platform</p>
        </div>
        
        <div className="bg-forensic-surface border border-forensic-border rounded-2xl p-8 shadow-2xl">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-forensic-muted">
          <Link href="/" className="hover:text-forensic-accent transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}