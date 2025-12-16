/**
 * User Skill Matrix API Routes
 *
 * GET  /api/user/skill-matrix - Get user's complete skill matrix
 * POST /api/user/skill-matrix/sync - Sync skills from course completions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getUserSkillMatrix,
  syncUserKnowledgeFromCourses,
} from '@/lib/skill-categories';

/**
 * GET /api/user/skill-matrix
 * Get user's complete skill matrix
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

    const matrix = await getUserSkillMatrix(session.email);

    return NextResponse.json({
      success: true,
      matrix,
      count: matrix.length,
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
 * This checks their LearnWorlds enrollments against skill category mappings
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

    // Get user's accessible course IDs from session
    const completedCourseIds = session.accessibleCourseIds || [];

    // Sync knowledge from course completions
    const synced = await syncUserKnowledgeFromCourses(session.email, completedCourseIds);

    // Get updated matrix
    const matrix = await getUserSkillMatrix(session.email);

    return NextResponse.json({
      success: true,
      synced,
      matrix,
      count: matrix.length,
    });
  } catch (error) {
    console.error('POST /api/user/skill-matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to sync skill matrix' },
      { status: 500 }
    );
  }
}
