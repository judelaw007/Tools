import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { getToolsForCourse } from '@/lib/course-allocations';
import { getAllTools } from '@/lib/db';
import { getServerSession } from '@/lib/server-session';
import { createServiceClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  GraduationCap,
  Wrench,
  Lock,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface CoursePageProps {
  params: { courseId: string };
}

// Get course name from allocations table
async function getCourseName(courseId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('course_tool_allocations')
    .select('course_name')
    .eq('course_id', courseId)
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.course_name;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = params;

  // Get current user session
  const session = await getServerSession();

  if (!session) {
    redirect('/auth');
  }

  // Check if user has access to this course
  const userCourseIds = new Set(session.accessibleCourseIds || []);
  const hasAccess = userCourseIds.has(courseId);

  // Get tools allocated to this course
  const toolIds = await getToolsForCourse(courseId);

  // If no tools allocated, show not found
  if (toolIds.length === 0) {
    notFound();
  }

  // Get course name
  const courseName = await getCourseName(courseId) || courseId;

  // Get full tool details
  const allTools = await getAllTools();
  const courseTools = allTools.filter(tool => toolIds.includes(tool.id));

  // If user doesn't have access, show locked state
  if (!hasAccess) {
    return (
      <DashboardLayout>
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Course Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="warning" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-mojitax-navy mb-1">
              {courseName}
            </h1>
            <p className="text-slate-600">
              {courseTools.length} tool{courseTools.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Locked State */}
        <Card className="mb-8 overflow-hidden border-amber-200">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-mojitax-navy mb-2">
              Course Access Required
            </h2>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">
              You need to be enrolled in this course to access its tools.
              Enroll now to unlock {courseTools.length} demo tool{courseTools.length !== 1 ? 's' : ''}.
            </p>

            <a
              href={`https://www.mojitax.co.uk/course/${courseId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                <GraduationCap className="w-5 h-5" />
                Enroll in Course
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </Card>

        {/* Tool Preview (locked) */}
        <div>
          <h3 className="text-lg font-semibold text-mojitax-navy mb-4">
            Tools Included in This Course
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseTools.map((tool) => (
              <Card key={tool.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-mojitax-navy">{tool.name}</h4>
                      <Badge variant="default" size="sm" className="capitalize">
                        {tool.toolType.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {tool.shortDescription}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // User has access - show tools
  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-mojitax-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Course Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-mojitax-green/20 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-7 h-7 text-mojitax-green" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="active" size="sm">
              <Wrench className="w-3 h-3 mr-1" />
              {courseTools.length} Tool{courseTools.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-mojitax-navy mb-1">
            {courseName}
          </h1>
          <p className="text-slate-600">
            Access the demo tools included with this course
          </p>
        </div>
      </div>

      {/* Tool Disclaimer */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800 mb-1">Demo Tools for Learning</p>
          <p className="text-sm text-amber-700">
            These are educational demo tools. Results are illustrative only and should not be used for actual tax filings or professional advice.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} hasAccess={true} />
        ))}
      </div>
    </DashboardLayout>
  );
}

export async function generateMetadata({ params }: CoursePageProps) {
  const courseName = await getCourseName(params.courseId);

  return {
    title: `${courseName || 'Course'} Tools | MojiTax`,
    description: `Access demo tools for ${courseName || 'this course'}`,
  };
}
