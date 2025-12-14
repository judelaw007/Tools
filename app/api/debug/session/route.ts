import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { getCoursesWithTools } from '@/lib/course-allocations';
import { learnworlds } from '@/lib/learnworlds';

/**
 * GET /api/debug/session
 *
 * Debug endpoint to view current session data and course allocations.
 * Helps diagnose why a user might not have access to tools.
 *
 * Add ?refresh=true to re-fetch data from LearnWorlds
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refreshFromLW = searchParams.get('refresh') === 'true';

    const session = await getServerSession();
    const coursesWithTools = await getCoursesWithTools();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
      });
    }

    // Optionally refresh data directly from LearnWorlds
    let liveLearnWorldsData = null;
    if (refreshFromLW && session.email) {
      try {
        const lwUser = await learnworlds.getUserByEmail(session.email);
        if (lwUser) {
          const [enrollments, courseAccess] = await Promise.all([
            learnworlds.getUserEnrollments(lwUser.id),
            learnworlds.getUserCourseAccess(lwUser.id),
          ]);

          liveLearnWorldsData = {
            user: {
              id: lwUser.id,
              email: lwUser.email,
              username: lwUser.username,
            },
            enrollments: enrollments.map(e => ({
              product_id: e.product_id,
              product_title: e.product_title,
              product_type: e.product_type,
              enrolled_at: e.enrolled_at,
            })),
            courseAccess,
            comparison: {
              sessionCourseCount: session.accessibleCourseIds?.length || 0,
              liveCourseCount: courseAccess.length,
              sessionEnrollmentCount: session.enrollments?.length || 0,
              liveEnrollmentCount: enrollments.length,
              coursesDiffer: JSON.stringify(session.accessibleCourseIds?.sort()) !== JSON.stringify(courseAccess.sort()),
            },
          };
        } else {
          liveLearnWorldsData = {
            error: 'User not found in LearnWorlds',
            searchedEmail: session.email,
          };
        }
      } catch (error) {
        liveLearnWorldsData = {
          error: 'Failed to fetch from LearnWorlds',
          details: String(error),
        };
      }
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
      liveLearnWorldsData,
      hint: !refreshFromLW ? 'Add ?refresh=true to fetch live data from LearnWorlds' : undefined,
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
