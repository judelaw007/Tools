'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard,
  Wrench,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  variant?: 'user' | 'admin';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export function Sidebar({ variant = 'user', isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  
  const userNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/tools', label: 'Browse Tools', icon: <Wrench className="w-5 h-5" /> },
  ];
  
  const adminNavItems: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/admin/tools', label: 'Tools', icon: <Wrench className="w-5 h-5" /> },
    { href: '/admin/courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
  ];
  
  const navItems = variant === 'admin' ? adminNavItems : userNavItems;
  
  const isActive = (href: string) => {
    if (href === '/admin' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 border-b border-slate-200 flex items-center',
        isCollapsed ? 'justify-center px-2' : 'px-4'
      )}>
        <Link href={variant === 'admin' ? '/admin' : '/dashboard'}>
          <Logo showText={!isCollapsed} size="md" />
        </Link>
      </div>
      
      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 text-slate-600 transition-transform', isCollapsed && 'rotate-180')} />
        </button>
      )}
      
      {/* Admin Badge */}
      {variant === 'admin' && !isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-200">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mojitax-navy/5 text-mojitax-navy text-xs font-semibold rounded-full">
            <Settings className="w-3 h-3" />
            Admin Panel
          </span>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              isActive(item.href)
                ? 'bg-mojitax-green/10 text-mojitax-green-dark font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-mojitax-navy',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>
      
      {/* Footer Links */}
      <div className="border-t border-slate-200 px-3 py-4 space-y-1">
        {variant === 'admin' && (
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-mojitax-navy transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Exit Admin' : undefined}
          >
            <ExternalLink className="w-5 h-5" />
            {!isCollapsed && <span>Exit Admin</span>}
          </Link>
        )}
        
        <Link
          href="https://mojitax.co.uk/help"
          target="_blank"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-mojitax-navy transition-colors',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Help & Support' : undefined}
        >
          <HelpCircle className="w-5 h-5" />
          {!isCollapsed && <span>Help & Support</span>}
        </Link>
        
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
