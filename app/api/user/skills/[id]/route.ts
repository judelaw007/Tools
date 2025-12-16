/**
 * Individual Skill API Routes
 *
 * PATCH /api/user/skills/[id] - Update skill (visibility)
 *
 * All operations require authentication and verify skill ownership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { updateSkillVisibility } from '@/lib/skills';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/user/skills/[id]
 *
 * Update a skill's visibility.
 *
 * Body:
 * - isVisible: boolean (required)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Get current user session
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'isVisible must be a boolean' },
        { status: 400 }
      );
    }

    // Update visibility
    const success = await updateSkillVisibility(id, session.email, isVisible);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update skill or skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Skill visibility updated',
    });
  } catch (error) {
    console.error('PATCH /api/user/skills/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}
