import { NextRequest, NextResponse } from 'next/server';
import { getAllTools } from '@/lib/db';

// In-memory storage for course-tool allocations (replace with Supabase in production)
// Key: courseId, Value: array of toolIds
const courseToolAllocations: Map<string, string[]> = new Map();

/**
 * GET /api/admin/courses/[courseId]/tools
 * Get all tools allocated to a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    const allocatedToolIds = courseToolAllocations.get(courseId) || [];
    const allTools = await getAllTools();

    const allocatedTools = allTools.filter(tool =>
      allocatedToolIds.includes(tool.id)
    );

    return NextResponse.json({
      success: true,
      courseId,
      tools: allocatedTools,
      toolIds: allocatedToolIds,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocated tools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses/[courseId]/tools
 * Allocate tools to a course (replaces all existing allocations)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    const body = await request.json();
    const { toolIds } = body;

    if (!Array.isArray(toolIds)) {
      return NextResponse.json(
        { success: false, error: 'toolIds must be an array' },
        { status: 400 }
      );
    }

    // Store the allocation
    courseToolAllocations.set(courseId, toolIds);

    return NextResponse.json({
      success: true,
      courseId,
      toolIds,
      message: `Allocated ${toolIds.length} tools to course`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to allocate tools' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[courseId]/tools
 * Remove all tool allocations from a course
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    courseToolAllocations.delete(courseId);

    return NextResponse.json({
      success: true,
      courseId,
      message: 'All tool allocations removed',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to remove allocations' },
      { status: 500 }
    );
  }
}
