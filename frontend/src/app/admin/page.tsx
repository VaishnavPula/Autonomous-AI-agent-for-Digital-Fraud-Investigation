'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { UserManagement } from '@/components/admin/UserManagement';
import { Shield, Users, Settings, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

const adminTabs = [
  { id: 'users', label: 'Users', icon: Users, component: UserManagement },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield, component: null },
  { id: 'audit', label: 'Audit Logs', icon: Activity, component: null },
  { id: 'settings', label: 'Settings', icon: Settings, component: null },
];

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.is_superuser)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !isAuthenticated || !user?.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const ActiveComponent = adminTabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-background text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {ActiveComponent ? <ActiveComponent /> : (
          <div className="text-center py-12">
            {(() => {
              const tab = adminTabs.find(t => t.id === activeTab);
              if (tab?.icon) {
                const Icon = tab.icon;
                return <Icon className="w-12 h-12 mx-auto text-muted-foreground" />;
              }
              return null;
            })()}
            <h2 className="mt-4 text-xl font-semibold">{adminTabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="mt-2 text-muted-foreground">This section is under development.</p>
          </div>
        )}
      </main>
    </div>
  );
}