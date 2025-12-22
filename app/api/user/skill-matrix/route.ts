/**
 * User Skill Matrix API Routes (Portfolio Style)
 *
 * GET  /api/user/skill-matrix - Get user's portfolio skill matrix
 * POST /api/user/skill-matrix - Sync skills from course completions
 *
 * IMPORTANT: Knowledge achievements only appear when:
 * - Course is marked as completed in LearnWorlds (completed: true)
 * - Score reflects actual progress from LearnWorlds
 * - Date reflects actual completion date, not sync date
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getUserPortfolioMatrix,
  syncUserCoursesWithProgress,
} from '@/lib/skill-categories';
import { learnworlds } from '@/lib/learnworlds';

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
 *
 * CRITICAL: Only syncs courses that are ACTUALLY completed in LearnWorlds
 * - Fetches real progress data from LearnWorlds API
 * - Only includes courses where completed: true
 * - Uses actual progress score (not hardcoded 100%)
 * - Uses actual completion date from LearnWorlds
 * - REMOVES completions for courses that have been reset in LearnWorlds
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

    // Fetch REAL course progress from LearnWorlds API
    // This returns actual completion status, progress score, and completion date
    const courseProgress = await learnworlds.getUserCourseProgressByEmail(session.email);

    // Get ALL course IDs (completed and not completed) for proper sync
    // This allows the sync to remove completions that have been reset
    const allCourseIds = courseProgress.map((course) => course.courseId);

    // Build enrollment data for sync - include ALL courses with their status
    // The sync function will handle filtering and removing reset completions
    const enrollmentData = courseProgress.map((course) => ({
      courseId: course.courseId,
      courseName: course.courseTitle,
      progress: course.progress, // Actual score from LearnWorlds
      completed: course.completed, // True completion status
      completedAt: course.completedAt || undefined, // Actual completion date (convert null to undefined)
    }));

    // Sync course completions - this will:
    // 1. Add/update completed courses
    // 2. Remove completions for courses that are no longer completed (reset in LearnWorlds)
    const syncResult = await syncUserCoursesWithProgress(
      session.email,
      enrollmentData,
      allCourseIds
    );

    // Get updated portfolio
    const portfolio = await getUserPortfolioMatrix(session.email);

    return NextResponse.json({
      success: true,
      synced: syncResult.synced,
      removed: syncResult.removed,
      portfolio,
      count: portfolio.length,
      debug: {
        totalCoursesInLearnWorlds: courseProgress.length,
        completedCourses: enrollmentData.filter((c) => c.completed).length,
        resetCoursesRemoved: syncResult.removed,
      },
    });
  } catch (error) {
    console.error('POST /api/user/skill-matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to sync skill matrix' },
      { status: 500 }
    );
  }
}
