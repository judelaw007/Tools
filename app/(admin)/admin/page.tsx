import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getPlatformStats, getRecentTools, getAllCourses } from '@/lib/db';
import {
  Wrench,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  // Fetch real data from database
  const stats = await getPlatformStats();
  const recentTools = await getRecentTools(5);
  const courses = await getAllCourses();

  const hasTools = stats.totalTools > 0;
  const hasCourses = courses.length > 0;

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

      {/* Main Content */}
      {!hasTools ? (
        /* Empty State - Get Started */
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mojitax-green/20 to-mojitax-navy/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-mojitax-green" />
            </div>
            <h3 className="text-2xl font-bold text-mojitax-navy mb-3">
              Welcome to MojiTax Tools Admin
            </h3>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto">
              Get started by creating your first demo tool. Tools you create will be available
              to users through the MojiTax platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/admin/tools/new">
                <Button variant="primary" size="lg">
                  <Plus className="w-5 h-5" />
                  Create Your First Tool
                </Button>
              </Link>
              <Link href="/admin/courses">
                <Button variant="outline" size="lg">
                  <BookOpen className="w-5 h-5" />
                  Configure Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Tools & Courses Grid */
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
                {recentTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/admin/tools/${tool.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
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
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-400" />
                Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasCourses ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm mb-4">No courses configured yet</p>
                  <Link href="/admin/courses">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                      Add Course
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {courses.slice(0, 4).map((course) => (
                    <div key={course.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-mojitax-green/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-mojitax-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-mojitax-navy truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {course.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/admin/courses"
                className="mt-4 inline-flex items-center gap-1 text-sm text-mojitax-green-dark hover:text-mojitax-green"
              >
                Manage all courses
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

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
            <Link href="/admin/tools">
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <Wrench className="w-4 h-4" />
                All Tools
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
