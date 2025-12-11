import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { getActiveTools, getActiveCourses } from '@/lib/db';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import { filterToolsByAccess, getServerSession } from '@/lib/server-session';
import {
  Calculator,
  BookOpen,
  Wrench,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Star,
  Lock,
  Unlock,
} from 'lucide-react';

export default async function DashboardPage() {
  // Fetch tools and courses from database
  const allToolsRaw = await getActiveTools();
  const courses = await getActiveCourses();

  // Get current user session
  const session = await getServerSession();

  // Add access flags to tools based on user's enrollments
  const allTools = await filterToolsByAccess(allToolsRaw);

  // Count accessible tools
  const accessibleToolsCount = allTools.filter((t) => t.hasAccess).length;

  const hasTools = allTools.length > 0;
  const hasCourses = courses.length > 0;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
          Welcome to Your Dashboard
        </h1>
        <p className="text-slate-600">
          Access your demo tools and continue learning
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Unlock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Your Tools</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {accessibleToolsCount}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  / {allTools.length}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Locked Tools</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {allTools.length - accessibleToolsCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {hasTools ? new Set(allTools.map(t => t.category)).size : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Your Courses</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {session?.enrollments?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Section */}
      {hasTools ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-mojitax-navy">
              Your Tools
            </h2>
            <Link href="/tools" className="text-sm text-mojitax-green-dark hover:text-mojitax-green flex items-center gap-1">
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTools.slice(0, 6).map((tool) => (
              <ToolCard key={tool.id} tool={tool} hasAccess={tool.hasAccess} />
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="mb-8">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-mojitax-navy mb-2">
              No Tools Available Yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Demo tools are being developed. Once tools are created and published, they will appear here for you to use.
            </p>
            <Link href="https://mojitax.co.uk/courses" target="_blank">
              <Button variant="primary">
                <BookOpen className="w-4 h-4" />
                Browse MojiTax Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tools by Category */}
      {hasTools && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tools by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  allTools.reduce((acc, tool) => {
                    if (!acc[tool.category]) acc[tool.category] = [];
                    acc[tool.category].push(tool);
                    return acc;
                  }, {} as Record<string, typeof allTools>)
                ).map(([category, tools]) => (
                  <div
                    key={category}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-mojitax-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-mojitax-navy">
                        {CATEGORY_METADATA[category]?.name || category.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500">{tools.length} tools available</p>
                    </div>
                    <Link href="/tools" className="text-xs text-mojitax-green-dark hover:underline">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Courses Card */}
          <Card className="bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">MojiTax Courses</h3>
              <p className="text-sm text-white/80 mb-4">
                Access professional tax courses at MojiTax.
              </p>

              {hasCourses ? (
                <div className="space-y-3 mb-6">
                  {courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="p-3 bg-white/10 rounded-lg">
                      <p className="text-sm font-medium">{course.name}</p>
                      <p className="text-xs text-white/60">{course.description?.slice(0, 50)}...</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60 mb-6">
                  Courses will be linked here once configured.
                </p>
              )}

              <Link href="https://mojitax.co.uk/courses" target="_blank">
                <Button
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10"
                >
                  Browse Courses
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
