import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wrench,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Activity,
  Clock,
} from 'lucide-react';

// Mock stats
const stats = {
  totalTools: 6,
  activeTools: 4,
  draftTools: 2,
  totalCourses: 4,
  totalUsers: 127,
  usageToday: 45,
};

const recentTools = [
  { name: 'TP Margin Calculator', status: 'active', updated: '2 hours ago' },
  { name: 'VAT Calculator', status: 'active', updated: '1 day ago' },
  { name: 'GIIN Search Demo', status: 'draft', updated: '3 days ago' },
];

const recentActivity = [
  { user: 'Sarah J.', action: 'Used TP Margin Calculator', time: '5 min ago' },
  { user: 'John D.', action: 'Saved calculation', time: '15 min ago' },
  { user: 'Emily R.', action: 'Viewed VAT Rate Lookup', time: '1 hour ago' },
  { user: 'Michael S.', action: 'Exported PDF', time: '2 hours ago' },
];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout variant="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
            Admin Dashboard
          </h1>
          <p className="text-slate-600">
            Manage your demo tools and monitor platform usage
          </p>
        </div>
        <Link href="/admin/tools/new">
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            New Tool
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
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Badge variant="active" size="sm">{stats.activeTools} Live</Badge>
              <Badge variant="draft" size="sm">{stats.draftTools} Draft</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Courses</p>
                <p className="text-2xl font-bold text-mojitax-navy">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Link
              href="/admin/courses"
              className="mt-3 inline-flex items-center gap-1 text-xs text-mojitax-green-dark hover:text-mojitax-green"
            >
              Manage courses
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-mojitax-navy">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              From LearnWorlds
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Usage Today</p>
                <p className="text-2xl font-bold text-mojitax-navy">{stats.usageToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <Link
              href="/admin/analytics"
              className="mt-3 inline-flex items-center gap-1 text-xs text-mojitax-green-dark hover:text-mojitax-green"
            >
              View analytics
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tools */}
        <Card className="lg:col-span-2">
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
              {recentTools.map((tool, i) => (
                <Link
                  key={i}
                  href={`/admin/tools/${tool.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-mojitax-navy">{tool.name}</p>
                    <p className="text-xs text-slate-500">Updated {tool.updated}</p>
                  </div>
                  <Badge
                    variant={tool.status === 'active' ? 'active' : 'draft'}
                    dot
                    size="sm"
                  >
                    {tool.status === 'active' ? 'Live' : 'Draft'}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-mojitax-navy/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-mojitax-navy">
                      {activity.user.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-mojitax-navy">
                      <span className="font-medium">{activity.user}</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">{activity.action}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-mojitax-navy to-mojitax-navy-light rounded-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Quick Actions</h3>
            <p className="text-sm text-white/70">
              Common tasks to manage your demo tools platform
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/tools/new">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <Plus className="w-4 h-4" />
                New Tool
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <BookOpen className="w-4 h-4" />
                Manage Courses
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <TrendingUp className="w-4 h-4" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
