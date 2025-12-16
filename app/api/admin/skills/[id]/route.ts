/**
 * Individual Skill Category API Routes
 *
 * GET    /api/admin/skills/[id] - Get skill category details
 * PUT    /api/admin/skills/[id] - Update skill category
 * DELETE /api/admin/skills/[id] - Delete skill category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getFullSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
} from '@/lib/skill-categories';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/skills/[id]
 * Get skill category with courses and tools
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!(session?.role === 'admin' || session?.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const category = await getFullSkillCategory(id);

    if (!category) {
      return NextResponse.json(
        { error: 'Skill category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('GET /api/admin/skills/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/skills/[id]
 * Update skill category
 *
 * Body:
 * - name: string (optional)
 * - slug: string (optional)
 * - knowledgeDescription: string (optional)
 * - displayOrder: number (optional)
 * - isActive: boolean (optional)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!(session?.role === 'admin' || session?.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const category = await updateSkillCategory(id, body);

    if (!category) {
      return NextResponse.json(
        { error: 'Failed to update skill category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('PUT /api/admin/skills/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update skill category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/skills/[id]
 * Delete skill category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!(session?.role === 'admin' || session?.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const success = await deleteSkillCategory(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete skill category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Skill category deleted',
    });
  } catch (error) {
    console.error('DELETE /api/admin/skills/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill category' },
      { status: 500 }
    );
  }
}
