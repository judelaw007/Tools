import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkillsMatrix } from '@/components/dashboard/SkillsMatrix';
import { getCoursesWithTools } from '@/lib/course-allocations';
import { getServerSession } from '@/lib/server-session';
import {
  BookOpen,
  Wrench,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Lock,
  Unlock,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';

export default async function DashboardPage() {
  // Get current user session
  const session = await getServerSession();

  // Get all courses that have tools allocated
  const coursesWithTools = await getCoursesWithTools();

  // Get user's accessible course IDs
  const userCourseIds = new Set(session?.accessibleCourseIds || []);

  // Determine which courses the user has access to
  const coursesWithAccess = coursesWithTools.map(course => ({
    ...course,
    hasAccess: userCourseIds.has(course.courseId),
  }));

  // Count stats
  const accessibleCoursesCount = coursesWithAccess.filter(c => c.hasAccess).length;
  const totalToolsCount = coursesWithTools.reduce((sum, c) => sum + c.toolCount, 0);
  const accessibleToolsCount = coursesWithAccess
    .filter(c => c.hasAccess)
    .reduce((sum, c) => sum + c.toolCount, 0);

  const hasCourses = coursesWithTools.length > 0;

  // Get username for greeting - prefer LearnWorlds username, fallback to email
  const username = session?.learnworldsUser?.username ||
                   session?.email?.split('@')[0] ||
                   'there';

  return (
    <DashboardLayout>
      {/* Page Header with personalized greeting */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
          Hello, {username}!
        </h1>
        <p className="text-slate-600">
          Welcome to your MojiTax Tools dashboard. Access your course tools and continue learning.
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
              <p className="text-sm text-slate-500">Your Courses</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {accessibleCoursesCount}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  / {coursesWithTools.length}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tools Available</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {accessibleToolsCount}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  / {totalToolsCount}
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
              <p className="text-sm text-slate-500">Locked Courses</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {coursesWithTools.length - accessibleCoursesCount}
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
              <p className="text-sm text-slate-500">Your Enrollments</p>
              <p className="text-2xl font-bold text-mojitax-navy">
                {session?.enrollments?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses with Tools */}
      {hasCourses ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-mojitax-navy">
              Courses with Tools
            </h2>
            <a
              href="https://www.mojitax.co.uk/courses"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-mojitax-green-dark hover:text-mojitax-green flex items-center gap-1"
            >
              Browse All Courses
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesWithAccess.map((course) => (
              <Card
                key={course.courseId}
                className={`overflow-hidden transition-all ${
                  course.hasAccess
                    ? 'hover:shadow-lg hover:border-mojitax-green/30'
                    : 'opacity-75'
                }`}
              >
                <CardContent className="p-0">
                  {/* Course Header */}
                  <div className={`p-4 ${course.hasAccess ? 'bg-gradient-to-r from-mojitax-green/10 to-transparent' : 'bg-slate-50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        course.hasAccess ? 'bg-mojitax-green/20' : 'bg-slate-200'
                      }`}>
                        <GraduationCap className={`w-5 h-5 ${
                          course.hasAccess ? 'text-mojitax-green' : 'text-slate-400'
                        }`} />
                      </div>
                      <Badge
                        variant={course.hasAccess ? 'active' : 'default'}
                        size="sm"
                      >
                        {course.hasAccess ? (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            Access Granted
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </>
                        )}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-mojitax-navy mb-1 line-clamp-2">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {course.toolCount} tool{course.toolCount !== 1 ? 's' : ''} available
                    </p>
                  </div>

                  {/* Course Actions */}
                  <div className="p-4 border-t border-slate-100">
                    {course.hasAccess ? (
                      <Link href={`/dashboard/course/${course.courseId}`}>
                        <Button variant="primary" size="sm" className="w-full">
                          <Wrench className="w-4 h-4" />
                          View Tools
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : (
                      <a
                        href={`https://www.mojitax.co.uk/course/${course.courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <GraduationCap className="w-4 h-4" />
                          Enroll to Access
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
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
              No Courses with Tools Yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Demo tools are being developed. Once tools are allocated to courses, they will appear here for you to access.
            </p>
            <a href="https://www.mojitax.co.uk/courses" target="_blank" rel="noopener noreferrer">
              <Button variant="primary">
                <BookOpen className="w-4 h-4" />
                Browse MojiTax Courses
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Skills Matrix Section */}
      <div className="mb-8">
        <SkillsMatrix />
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How Tool Access Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-mojitax-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-mojitax-green">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-mojitax-navy">Enroll in a Course</p>
                  <p className="text-xs text-slate-500">Purchase a course, bundle, or subscription at mojitax.co.uk</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-mojitax-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-mojitax-green">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-mojitax-navy">Verify Your Email</p>
                  <p className="text-xs text-slate-500">Use the same email you used for your MojiTax account</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-mojitax-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-mojitax-green">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-mojitax-navy">Access Course Tools</p>
                  <p className="text-xs text-slate-500">All tools allocated to your courses will be available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MojiTax Courses Card */}
        <Card className="bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">MojiTax Courses</h3>
            <p className="text-sm text-white/80 mb-4">
              Explore professional tax courses at MojiTax and unlock access to demo tools.
            </p>

            {session?.enrollments && session.enrollments.length > 0 ? (
              <div className="space-y-3 mb-6">
                <p className="text-xs text-white/60 font-medium uppercase tracking-wide">Your Enrollments</p>
                {session.enrollments.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.product_id} className="p-3 bg-white/10 rounded-lg">
                    <p className="text-sm font-medium">{enrollment.product_name}</p>
                    <p className="text-xs text-white/60 capitalize">{enrollment.product_type}</p>
                  </div>
                ))}
                {session.enrollments.length > 3 && (
                  <p className="text-xs text-white/60">
                    +{session.enrollments.length - 3} more enrollments
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/60 mb-6">
                Enroll in a course to unlock access to demo tools.
              </p>
            )}

            <a href="https://www.mojitax.co.uk/courses" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10"
              >
                Browse Courses
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
