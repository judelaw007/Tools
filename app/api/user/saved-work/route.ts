/**
 * User Saved Work API Routes
 *
 * GET  /api/user/saved-work?toolId={toolId} - List saved work for a tool
 * POST /api/user/saved-work - Create new saved work
 *
 * All operations require authentication and are scoped to the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getSavedWork,
  createSavedWork,
  SavedWorkItem,
} from '@/lib/saved-work';
import { getToolById } from '@/lib/db';
import { awardSavedWorkSkill } from '@/lib/skills';
import { incrementToolProjectCount } from '@/lib/skill-categories';
import { logActivity, extractRequestInfo } from '@/lib/activity-logs';

/**
 * GET /api/user/saved-work?toolId={toolId}
 *
 * Returns all saved work for the current user and specified tool.
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

    // Get toolId from query params
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json(
        { error: 'toolId parameter is required' },
        { status: 400 }
      );
    }

    // Fetch saved work
    const items = await getSavedWork({
      toolId,
      userEmail: session.email,
    });

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('GET /api/user/saved-work error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved work' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/saved-work
 *
 * Creates a new saved work entry.
 *
 * Body:
 * - toolId: string (required)
 * - name: string (required)
 * - data: object (required)
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

    // Parse request body
    const body = await request.json();
    const { toolId, name, data } = body;

    // Validate required fields
    if (!toolId) {
      return NextResponse.json(
        { error: 'toolId is required' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'data is required and must be an object' },
        { status: 400 }
      );
    }

    // Create saved work
    const savedItem = await createSavedWork(
      { toolId, userEmail: session.email },
      name,
      data
    );

    if (!savedItem) {
      return NextResponse.json(
        { error: 'Failed to create saved work' },
        { status: 500 }
      );
    }

    // Award skill and increment project count (non-blocking)
    const tool = await getToolById(toolId);
    Promise.all([
      // Legacy skill system
      tool ? awardSavedWorkSkill(
        session.email!,
        toolId,
        tool.name,
        tool.category
      ) : Promise.resolve(),
      // New admin-defined skill system - increment project count
      incrementToolProjectCount(session.email!, toolId),
    ]).catch((err) => {
      console.error('Error updating skills:', err);
    });

    // Log the project save activity
    const userName = session.learnworldsUser?.username || session.email.split('@')[0];
    const { ipAddress, userAgent } = extractRequestInfo(request);
    await logActivity({
      type: 'project_save',
      userEmail: session.email,
      userName,
      description: `${userName} saved project "${name}" using ${tool?.name || toolId}`,
      metadata: {
        projectId: savedItem.id,
        projectName: name,
        toolId,
        toolName: tool?.name || null,
        toolCategory: tool?.category || null,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      item: savedItem,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/user/saved-work error:', error);
    return NextResponse.json(
      { error: 'Failed to create saved work' },
      { status: 500 }
    );
  }
}
