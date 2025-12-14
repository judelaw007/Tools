import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getPlatformStats, getRecentTools } from '@/lib/db';
import {
  Wrench,
  Users,
  TrendingUp,
  ArrowRight,
  Settings,
  FolderOpen,
  BookOpen,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Fetch real data from database
  const stats = await getPlatformStats();
  const recentTools = await getRecentTools(5);

  const hasTools = stats.totalTools > 0;

  return (
    <DashboardLayout variant="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600">
            Manage tools, courses, and monitor platform usage
          </p>
        </div>
        <Link href="/admin/tools">
          <Button variant="primary">
            <Settings className="w-4 h-4" />
            Manage Tools
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Tools</p>
                <p className="text-2xl font-bold text-mojitax-navy">{stats.totalTools}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            {hasTools && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <Badge variant="active" size="sm">{stats.activeTools} Live</Badge>
                <Badge variant="draft" size="sm">{stats.draftTools} Draft</Badge>
              </div>
            )}
          </CardContent>
        </Card>


        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-mojitax-navy">
                  {stats.totalUsers > 0 ? stats.totalUsers : '—'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {stats.totalUsers > 0 ? 'From LearnWorlds' : 'Connect LearnWorlds'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Usage Today</p>
                <p className="text-2xl font-bold text-mojitax-navy">
                  {stats.usageToday > 0 ? stats.usageToday : '—'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tool submissions today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {!hasTools ? (
        /* Empty State - Awaiting Tools */
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mojitax-green/20 to-mojitax-navy/20 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-mojitax-green" />
            </div>
            <h3 className="text-2xl font-bold text-mojitax-navy mb-3">
              Welcome to MojiTax Tools Admin
            </h3>
            <p className="text-slate-500 mb-4 max-w-lg mx-auto">
              No tools have been uploaded yet. Once developers upload tools to the platform,
              you&apos;ll be able to manage them here.
            </p>
            <div className="bg-slate-50 rounded-lg p-6 max-w-md mx-auto mb-8">
              <h4 className="font-semibold text-mojitax-navy mb-3">Admin Responsibilities:</h4>
              <ul className="text-sm text-slate-600 text-left space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-mojitax-green mt-0.5">•</span>
                  Categorise uploaded tools
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mojitax-green mt-0.5">•</span>
                  Allocate tools to courses
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mojitax-green mt-0.5">•</span>
                  Provide tool descriptions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mojitax-green mt-0.5">•</span>
                  Activate, deactivate, or delete tools
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-mojitax-green mt-0.5">•</span>
                  Log issues with tools
                </li>
              </ul>
            </div>
            <Link href="/admin/courses">
              <Button variant="outline" size="lg">
                <BookOpen className="w-5 h-5" />
                Configure Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Recent Tools */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tools</CardTitle>
            <Link href="/admin/tools">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-mojitax-navy">{tool.name}</p>
                    <p className="text-xs text-slate-500">
                      Updated {tool.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={tool.status === 'active' ? 'active' : tool.status === 'draft' ? 'draft' : 'inactive'}
                    dot
                    size="sm"
                  >
                    {tool.status === 'active' ? 'Live' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </DashboardLayout>
  );
}
