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

    // Build enrollment data for sync - ONLY include COMPLETED courses
    // This ensures knowledge achievements only appear when course is truly completed
    const enrollmentData = courseProgress
      .filter((course) => course.completed) // Only completed courses
      .map((course) => ({
        courseId: course.courseId,
        courseName: course.courseTitle,
        progress: course.progress, // Actual score from LearnWorlds
        completed: true,
        completedAt: course.completedAt || undefined, // Actual completion date (convert null to undefined)
      }));

    // Sync course completions (only completed courses will be recorded)
    const synced = await syncUserCoursesWithProgress(session.email, enrollmentData);

    // Get updated portfolio
    const portfolio = await getUserPortfolioMatrix(session.email);

    return NextResponse.json({
      success: true,
      synced,
      portfolio,
      count: portfolio.length,
      debug: {
        totalCoursesInLearnWorlds: courseProgress.length,
        completedCourses: enrollmentData.length,
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
