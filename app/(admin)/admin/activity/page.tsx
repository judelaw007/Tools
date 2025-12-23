'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Activity,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Download,
  Printer,
  Wrench,
  Save,
  UserCheck,
  LogIn,
  LogOut,
  BookOpen,
  Shield,
  QrCode,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  Users,
} from 'lucide-react';

type ActivityType =
  | 'skills_download'
  | 'skills_sync'
  | 'skills_verification'
  | 'tool_usage'
  | 'project_save'
  | 'user_login'
  | 'user_logout'
  | 'course_completion'
  | 'admin_action';

interface ActivityLog {
  id: string;
  activity_type: ActivityType;
  user_email: string | null;
  user_name: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ActivityStats {
  totalActivities: number;
  byType: Record<ActivityType, number>;
  recentUsers: string[];
  dailyCounts: { date: string; count: number }[];
}

const activityTypeConfig: Record<ActivityType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  skills_download: { label: 'Skills Download', icon: Download, color: 'bg-blue-100 text-blue-700' },
  skills_sync: { label: 'Skills Sync', icon: RefreshCw, color: 'bg-green-100 text-green-700' },
  skills_verification: { label: 'QR Verification', icon: QrCode, color: 'bg-purple-100 text-purple-700' },
  tool_usage: { label: 'Tool Access', icon: Wrench, color: 'bg-amber-100 text-amber-700' },
  project_save: { label: 'Project Save', icon: Save, color: 'bg-teal-100 text-teal-700' },
  user_login: { label: 'User Login', icon: LogIn, color: 'bg-emerald-100 text-emerald-700' },
  user_logout: { label: 'User Logout', icon: LogOut, color: 'bg-slate-100 text-slate-700' },
  course_completion: { label: 'Course Completed', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
  admin_action: { label: 'Admin Action', icon: Shield, color: 'bg-red-100 text-red-700' },
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<ActivityType | ''>('');
  const [selectedUser, setSelectedUser] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      if (selectedType) params.set('type', selectedType);
      if (selectedUser) params.set('userEmail', selectedUser);

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to fetch activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedType, selectedUser]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/activity-logs?view=stats&days=7');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, fetchStats]);

  const handleRefresh = () => {
    setIsLoading(true);
    setIsLoadingStats(true);
    fetchLogs();
    fetchStats();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout variant="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy">
              Activity Logs
            </h1>
          </div>
          <p className="text-slate-600">
            Monitor user activities, tool usage, and skills verifications in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Activities (7d)</p>
                  <p className="text-2xl font-bold text-mojitax-navy">{stats.totalActivities}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Active Users (7d)</p>
                  <p className="text-2xl font-bold text-mojitax-navy">{stats.recentUsers.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">QR Verifications</p>
                  <p className="text-2xl font-bold text-mojitax-navy">
                    {stats.byType.skills_verification || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Projects Saved</p>
                  <p className="text-2xl font-bold text-mojitax-navy">
                    {stats.byType.project_save || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Save className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Activity Type</label>
              <select
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as ActivityType | '');
                  setPage(0);
                }}
              >
                <option value="">All Types</option>
                {Object.entries(activityTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">User</label>
              <input
                type="text"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                placeholder="Filter by email..."
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {(selectedType || selectedUser) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType('');
                  setSelectedUser('');
                  setPage(0);
                }}
                className="mt-5"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
            {total > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-mojitax-navy mb-2">
                No Activity Yet
              </h3>
              <p className="text-slate-500">
                Activity will appear here as users interact with the platform.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const config = activityTypeConfig[log.activity_type] || {
                  label: log.activity_type,
                  icon: Activity,
                  color: 'bg-slate-100 text-slate-700',
                };
                const IconComponent = config.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" size="sm" className={config.color}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">
                        {log.description}
                      </p>
                      {log.user_email && (
                        <p className="text-xs text-slate-500">
                          User: {log.user_name || log.user_email}
                        </p>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                            View details
                          </summary>
                          <pre className="mt-1 text-xs bg-white p-2 rounded border border-slate-200 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity by Type Chart */}
      {stats && Object.keys(stats.byType).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity Breakdown (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const config = activityTypeConfig[type as ActivityType];
                  if (!config) return null;
                  const percentage = Math.round((count / stats.totalActivities) * 100);
                  const IconComponent = config.icon;

                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{config.label}</span>
                          <span className="text-sm text-slate-500">{count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-mojitax-green h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
