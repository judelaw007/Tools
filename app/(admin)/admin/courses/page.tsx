'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  Plus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wrench,
  ArrowLeft,
} from 'lucide-react';

interface LearnWorldsProduct {
  id: string;
  title: string;
  type: string;
}

interface ConnectionStatus {
  success: boolean;
  configured: boolean;
  message: string;
  courseCount?: number;
  courses?: LearnWorldsProduct[];
  missing?: string[];
}

export default function AdminCoursesPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const testConnection = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/learnworlds/test');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        success: false,
        configured: false,
        message: 'Failed to connect to API',
      });
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

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
              Course Management
            </h1>
          </div>
          <p className="text-slate-600">
            Connect courses from LearnWorlds and allocate tools to them
          </p>
        </div>
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-400" />
            LearnWorlds Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              <span className="text-slate-600">Testing connection...</span>
            </div>
          ) : connectionStatus?.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected to LearnWorlds</p>
                  <p className="text-sm text-green-600">
                    Found {connectionStatus.courseCount} courses
                  </p>
                </div>
              </div>

              {/* Courses from LearnWorlds */}
              {connectionStatus.courses && connectionStatus.courses.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-700 mb-3">
                    Available Courses from LearnWorlds
                  </h3>
                  <div className="space-y-2">
                    {connectionStatus.courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-mojitax-green/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-mojitax-green" />
                          </div>
                          <div>
                            <p className="font-medium text-mojitax-navy">{course.title}</p>
                            <p className="text-xs text-slate-500">ID: {course.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="active" size="sm">{course.type}</Badge>
                          <Button variant="outline" size="sm">
                            <Wrench className="w-3 h-3" />
                            Allocate Tools
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">
                    {connectionStatus?.configured
                      ? 'Connection Failed'
                      : 'LearnWorlds Not Configured'}
                  </p>
                  <p className="text-sm text-amber-600 mt-1">
                    {connectionStatus?.message}
                  </p>
                  {connectionStatus?.missing && connectionStatus.missing.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-amber-800">Missing environment variables:</p>
                      <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                        {connectionStatus.missing.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-700 mb-2">Setup Instructions</h4>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Go to LearnWorlds Admin → Settings → Developers → API</li>
                  <li>Copy your Client ID, Client Secret, and Access Token</li>
                  <li>Add them to your Replit Secrets with these exact names:
                    <ul className="ml-6 mt-1 space-y-1 list-disc">
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_SCHOOL_URL</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_API_URL</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_CLIENT_ID</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_CLIENT_SECRET</code></li>
                      <li><code className="bg-slate-200 px-1 rounded">LEARNWORLDS_ACCESS_TOKEN</code></li>
                    </ul>
                  </li>
                  <li>Restart the application and refresh this page</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Course Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Local Course Registry</CardTitle>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Add Course Manually
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="mb-2">No courses registered locally yet</p>
            <p className="text-sm">
              Connect to LearnWorlds above to import courses, or add them manually.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">How Course-Tool Allocation Works</h4>
        <p className="text-sm text-blue-700 mb-3">
          When a user purchases a course on LearnWorlds, they automatically get access to all tools
          allocated to that course on this platform.
        </p>
        <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
          <li>Courses are synced from LearnWorlds (or added manually)</li>
          <li>Admin allocates tools to each course</li>
          <li>When users log in via SSO, we check their LearnWorlds enrollments</li>
          <li>Users see only the tools for courses they&apos;ve purchased</li>
        </ol>
      </div>
    </DashboardLayout>
  );
}
