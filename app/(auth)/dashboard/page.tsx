import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { getActiveTools, getActiveCourses, getToolsForCourse } from '@/lib/db';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import {
  Calculator,
  Search,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Wrench,
  ArrowRight,
  ExternalLink,
  Clock,
  Star,
} from 'lucide-react';

export default async function DashboardPage() {
  // Fetch tools and courses from database
  const allTools = await getActiveTools();
  const courses = await getActiveCourses();

  // For dev mode, we show all tools as accessible
  // In production, this would be filtered by user's enrolled courses
  const userTools = allTools.slice(0, 4); // Show first 4 as "user's tools"
  const otherTools = allTools.slice(4); // Rest as "locked"

  // Get a sample course for display
  const userCourse = courses.length > 0 ? courses[0] : null;

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
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Your Tools</p>
              <p className="text-2xl font-bold text-mojitax-navy">{userTools.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available Tools</p>
              <p className="text-2xl font-bold text-mojitax-navy">{allTools.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tool Types</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {new Set(allTools.map(t => t.toolType)).size}
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
              <p className="text-sm text-slate-500">Courses</p>
              <p className="text-2xl font-bold text-mojitax-navy">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Tools Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-mojitax-navy">
              Your Tools
            </h2>
            {userCourse && (
              <Badge variant="success" dot size="sm">
                {userCourse.name}
              </Badge>
            )}
          </div>
          <Link
            href="https://mojitax.co.uk/courses"
            target="_blank"
            className="text-sm text-mojitax-green-dark hover:text-mojitax-green flex items-center gap-1"
          >
            View Courses
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {userTools.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-mojitax-navy mb-2">No tools available yet</h3>
              <p className="text-slate-500 text-sm mb-4">
                Enroll in a course to access demo tools.
              </p>
              <Link href="https://mojitax.co.uk/courses" target="_blank">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} hasAccess={true} />
            ))}
          </div>
        )}
      </div>

      {/* Categories & Unlock More */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools by Category */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Tools by Category
            </CardTitle>
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

        {/* Unlock More Tools */}
        <Card className="bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Explore More Tools</h3>
            <p className="text-sm text-white/80 mb-4">
              Get access to more demo tools by enrolling in additional courses.
            </p>

            <div className="space-y-3 mb-6">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="p-3 bg-white/10 rounded-lg">
                  <p className="text-sm font-medium">{course.name}</p>
                  <p className="text-xs text-white/60">{course.description?.slice(0, 50)}...</p>
                </div>
              ))}
            </div>

            <Link href="https://mojitax.co.uk/courses" target="_blank">
              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Other Available Tools */}
      {otherTools.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-mojitax-navy">
              Other Available Tools
            </h2>
            <Badge variant="default" size="sm">
              Preview
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} hasAccess={true} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
