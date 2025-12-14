'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { useStudentView } from '@/lib/student-view';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  Wrench,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  User,
  UserX,
  ChevronDown,
  Loader2,
  X,
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
  const { logout } = useAuth();
  const {
    mode,
    selectedCourseName,
    setViewMode,
    exitStudentView,
    isInStudentView,
    isLoading,
    availableCourses,
    loadCourses,
  } = useStudentView();

  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
  const [showCourseSelect, setShowCourseSelect] = useState(false);

  // Load courses when dropdown opens
  useEffect(() => {
    if (isStudentViewOpen && availableCourses.length === 0) {
      loadCourses();
    }
  }, [isStudentViewOpen, availableCourses.length, loadCourses]);

  const handleModeSelect = (newMode: 'no-account' | 'no-courses' | 'with-course') => {
    if (newMode === 'with-course') {
      setShowCourseSelect(true);
    } else {
      setViewMode(newMode);
      setIsStudentViewOpen(false);
    }
  };

  const handleCourseSelect = (courseId: string, courseName: string) => {
    setViewMode('with-course', courseId, courseName);
    setShowCourseSelect(false);
    setIsStudentViewOpen(false);
  };

  const handleExitStudentView = () => {
    exitStudentView();
    setIsStudentViewOpen(false);
    setShowCourseSelect(false);
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/';
  };

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
      {variant === 'admin' && !isInStudentView && !isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-200">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mojitax-navy/5 text-mojitax-navy text-xs font-semibold rounded-full">
            <Settings className="w-3 h-3" />
            Admin Panel
          </span>
        </div>
      )}

      {/* Student View Active Banner - shows on any sidebar when in student view */}
      {isInStudentView && !isCollapsed && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
            <Eye className="w-3.5 h-3.5" />
            <span className="flex-1 truncate">
              Viewing as: {mode === 'no-account' && 'No Account'}
              {mode === 'no-courses' && 'No Courses'}
              {mode === 'with-course' && selectedCourseName}
            </span>
          </div>
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
        {/* Exit Student View button - shows on any sidebar when in student view */}
        {isInStudentView && (
          <button
            onClick={handleExitStudentView}
            disabled={isLoading}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Exit Student View' : undefined}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
            {!isCollapsed && <span>Exit Student View</span>}
          </button>
        )}

        {/* Student View Button (Admin sidebar only, when not in student view) */}
        {variant === 'admin' && !isInStudentView && (
          <div className="relative">
            <button
              onClick={() => setIsStudentViewOpen(!isStudentViewOpen)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-mojitax-navy transition-colors',
                isStudentViewOpen && 'bg-slate-100',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? 'Student View' : undefined}
            >
              <Eye className="w-5 h-5" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Student View</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isStudentViewOpen && 'rotate-180')} />
                </>
              )}
            </button>

            {/* Student View Dropdown */}
            {isStudentViewOpen && !isCollapsed && !isInStudentView && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                {!showCourseSelect ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-mojitax-navy">Preview as Student</p>
                    </div>

                    <button
                      onClick={() => handleModeSelect('no-account')}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <UserX className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">No Account</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleModeSelect('no-courses')}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">Account, No Courses</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleModeSelect('with-course')}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-t border-slate-100"
                    >
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">With Specific Course</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setShowCourseSelect(false)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-500 rotate-90" />
                      </button>
                      <p className="text-sm font-medium text-mojitax-navy">Select Course</p>
                    </div>

                    {isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      </div>
                    ) : availableCourses.length === 0 ? (
                      <div className="px-4 py-4 text-center text-sm text-slate-500">
                        No courses available
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        {availableCourses.map((course) => (
                            <button
                              key={course.id}
                              onClick={() => handleCourseSelect(course.id, course.title)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-700 truncate">{course.title}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
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

      {/* Click outside to close dropdown */}
      {isStudentViewOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsStudentViewOpen(false);
            setShowCourseSelect(false);
          }}
        />
      )}
    </aside>
  );
}
