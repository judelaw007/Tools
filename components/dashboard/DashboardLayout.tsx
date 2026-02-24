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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless drawer is open */}
      <div className={cn(
        'md:block',
        isMobileOpen ? 'block' : 'hidden'
      )}>
        <Sidebar
          variant={variant}
          isCollapsed={false}
          onToggleCollapse={() => {
            // On mobile, close the drawer; on desktop, toggle collapse
            if (window.innerWidth < 768) {
              setIsMobileOpen(false);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          isMobile={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
      </div>

      <div className={cn(
        'transition-all duration-300',
        // No margin on mobile, sidebar is an overlay
        'ml-0 md:ml-64',
        isCollapsed && 'md:ml-16'
      )}>
        <Header
          showSearch={variant === 'user'}
          onMobileMenuToggle={() => setIsMobileOpen(true)}
        />

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
