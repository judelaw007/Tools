/**
 * User Skill Matrix API Routes (Portfolio Style)
 *
 * GET  /api/user/skill-matrix - Get user's portfolio skill matrix
 * POST /api/user/skill-matrix - Sync skills from course completions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getUserPortfolioMatrix,
  syncUserCoursesWithProgress,
} from '@/lib/skill-categories';

/**
 * GET /api/user/skill-matrix
 * Get user's portfolio-style skill matrix
 * Only shows categories where user has completed at least one course
 */
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const portfolio = await getUserPortfolioMatrix(session.email);

    return NextResponse.json({
      success: true,
      portfolio,
      count: portfolio.length,
    });
  } catch (error) {
    console.error('GET /api/user/skill-matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill matrix' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/skill-matrix
 * Sync user's skills from their course completions
 * This records completed courses with their progress scores
 */
export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get enrollments from session
    const enrollments = session.enrollments || [];
    const accessibleCourseIds = session.accessibleCourseIds || [];

    // Build enrollment data for sync
    // For now, assume 100% progress for accessible courses
    // TODO: Fetch actual progress from LearnWorlds API
    const enrollmentData = accessibleCourseIds.map((courseId) => {
      const enrollment = enrollments.find((e) => e.product_id === courseId);
      return {
        courseId,
        courseName: enrollment?.product_name || courseId,
        progress: 100, // Assume completed since they have access
        completed: true,
      };
    });

    // Sync course completions
    const synced = await syncUserCoursesWithProgress(session.email, enrollmentData);

    // Get updated portfolio
    const portfolio = await getUserPortfolioMatrix(session.email);

    return NextResponse.json({
      success: true,
      synced,
      portfolio,
      count: portfolio.length,
    });
  } catch (error) {
    console.error('POST /api/user/skill-matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to sync skill matrix' },
      { status: 500 }
    );
  }
}
