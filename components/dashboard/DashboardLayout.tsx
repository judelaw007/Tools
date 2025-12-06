'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: 'user' | 'admin';
}

export function DashboardLayout({ children, variant = 'user' }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        variant={variant}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className={cn(
        'transition-all duration-300',
        isCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Header />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
