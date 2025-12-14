import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { getCoursesWithTools } from '@/lib/course-allocations';

/**
 * GET /api/debug/session
 *
 * Debug endpoint to view current session data and course allocations.
 * Helps diagnose why a user might not have access to tools.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const coursesWithTools = await getCoursesWithTools();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
      });
    }

    // Find matches between user's accessible courses and allocated courses
    const userCourseIds = new Set(session.accessibleCourseIds || []);
    const matchingCourses = coursesWithTools.filter(c => userCourseIds.has(c.courseId));

    return NextResponse.json({
      authenticated: true,
      session: {
        email: session.email,
        role: session.role,
        learnworldsId: session.learnworldsId,
        accessibleCourseIds: session.accessibleCourseIds || [],
        enrollments: session.enrollments || [],
        authenticatedAt: session.authenticatedAt,
        lastEnrollmentCheck: session.lastEnrollmentCheck,
      },
      allocations: {
        coursesWithTools: coursesWithTools.map(c => ({
          courseId: c.courseId,
          courseName: c.courseName,
          toolCount: c.toolCount,
          userHasAccess: userCourseIds.has(c.courseId),
        })),
      },
      access: {
        userCourseCount: session.accessibleCourseIds?.length || 0,
        allocatedCourseCount: coursesWithTools.length,
        matchingCourses: matchingCourses.map(c => c.courseName),
        accessibleToolCount: matchingCourses.reduce((sum, c) => sum + c.toolCount, 0),
      },
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
