'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  showSearch?: boolean;
}

export function Header({ showSearch = false }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    window.location.href = '/tools';
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Left side - Breadcrumb or search can go here */}
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="relative">
            {/* Search input placeholder */}
          </div>
        )}
      </div>
      
      {/* Right side - User menu */}
      <div className="flex items-center gap-3">
        {/* Back to Courses Link */}
        <Link
          href="https://mojitax.co.uk/courses"
          target="_blank"
          className="text-sm text-slate-600 hover:text-mojitax-navy flex items-center gap-1.5 transition-colors"
        >
          Back to Courses
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        
        <div className="h-6 w-px bg-slate-200" />
        
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {/* Notification dot */}
          {/* <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /> */}
        </button>
        
        {/* User Menu */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-mojitax-navy flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-mojitax-navy">{user.name}</p>
                {isAdmin && (
                  <p className="text-xs text-mojitax-green">Admin</p>
                )}
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-slate-400 transition-transform',
                isProfileOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-mojitax-navy">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    My Dashboard
                  </Link>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={handleLogin}>
            Log In
          </Button>
        )}
      </div>
    </header>
  );
}
