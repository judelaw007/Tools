/**
 * User Skills API Routes
 *
 * GET  /api/user/skills - List all skills for the current user
 * POST /api/user/skills/sync - Sync skills from activity data
 *
 * All operations require authentication and are scoped to the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getUserSkills,
  getSkillSummary,
  syncToolUsageSkills,
  syncSavedWorkSkills,
} from '@/lib/skills';

/**
 * GET /api/user/skills
 *
 * Returns all skills for the current user with optional summary.
 * Query params:
 * - includeSummary: boolean - include skill summary statistics
 * - visibleOnly: boolean - only return visible skills
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const includeSummary = searchParams.get('includeSummary') === 'true';

    // Fetch skills
    const skills = await getUserSkills(session.email);

    // Build response
    const response: {
      success: boolean;
      skills: typeof skills;
      count: number;
      summary?: Awaited<ReturnType<typeof getSkillSummary>>;
    } = {
      success: true,
      skills,
      count: skills.length,
    };

    // Include summary if requested
    if (includeSummary) {
      response.summary = await getSkillSummary(session.email);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/user/skills error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/skills
 *
 * Sync skills from user activity data.
 * This recalculates skills based on:
 * - Tool usage logs
 * - Saved work
 *
 * Note: Course completion skills are synced separately when
 * the user's session is refreshed (LearnWorlds integration).
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Sync skills from different sources
    const [toolUsageCount, savedWorkCount] = await Promise.all([
      syncToolUsageSkills(session.email),
      syncSavedWorkSkills(session.email),
    ]);

    // Get updated skills and summary
    const skills = await getUserSkills(session.email);
    const summary = await getSkillSummary(session.email);

    return NextResponse.json({
      success: true,
      message: 'Skills synced successfully',
      synced: {
        toolUsage: toolUsageCount,
        savedWork: savedWorkCount,
        total: toolUsageCount + savedWorkCount,
      },
      skills,
      summary,
    });
  } catch (error) {
    console.error('POST /api/user/skills error:', error);
    return NextResponse.json(
      { error: 'Failed to sync skills' },
      { status: 500 }
    );
  }
}
