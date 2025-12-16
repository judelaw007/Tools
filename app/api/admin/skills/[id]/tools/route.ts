/**
 * Skill Category Tools API Routes
 *
 * GET  /api/admin/skills/[id]/tools - List tools for category
 * POST /api/admin/skills/[id]/tools - Add tool to category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getToolsForCategory,
  addToolToCategory,
  updateCategoryTool,
  removeToolFromCategory,
} from '@/lib/skill-categories';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/skills/[id]/tools
 * Get tools linked to this skill category
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
    const tools = await getToolsForCategory(id);

    return NextResponse.json({
      success: true,
      tools,
      count: tools.length,
    });
  } catch (error) {
    console.error('GET /api/admin/skills/[id]/tools error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/skills/[id]/tools
 * Add tool to skill category
 *
 * Body:
 * - toolId: string (required)
 * - toolName: string (optional)
 * - applicationDescription: string (optional)
 * - displayOrder: number (optional)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { toolId, toolName, applicationDescription, displayOrder } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: 'toolId is required' },
        { status: 400 }
      );
    }

    const tool = await addToolToCategory(id, toolId, toolName, applicationDescription, displayOrder);

    if (!tool) {
      return NextResponse.json(
        { error: 'Failed to add tool to category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tool,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/skills/[id]/tools error:', error);
    return NextResponse.json(
      { error: 'Failed to add tool' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/skills/[id]/tools
 * Update tool in skill category
 *
 * Body:
 * - toolId: string (required)
 * - applicationDescription: string (optional)
 * - displayOrder: number (optional)
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
    const { toolId, applicationDescription, displayOrder } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: 'toolId is required' },
        { status: 400 }
      );
    }

    const tool = await updateCategoryTool(id, toolId, {
      applicationDescription,
      displayOrder,
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Failed to update tool' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tool,
    });
  } catch (error) {
    console.error('PUT /api/admin/skills/[id]/tools error:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/skills/[id]/tools
 * Remove tool from skill category
 *
 * Body:
 * - toolId: string (required)
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
    const body = await request.json();
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json(
        { error: 'toolId is required' },
        { status: 400 }
      );
    }

    const success = await removeToolFromCategory(id, toolId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove tool from category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tool removed from category',
    });
  } catch (error) {
    console.error('DELETE /api/admin/skills/[id]/tools error:', error);
    return NextResponse.json(
      { error: 'Failed to remove tool' },
      { status: 500 }
    );
  }
}
