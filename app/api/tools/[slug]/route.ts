import { NextResponse } from 'next/server';
import { getToolBySlug } from '@/lib/db';
import { getCoursesForTool } from '@/lib/course-allocations';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await getToolBySlug(params.slug);

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Only return active tools
    if (tool.status !== 'active') {
      return NextResponse.json(
        { error: 'Tool not available' },
        { status: 404 }
      );
    }

    // Unallocated tools are invisible
    const allocatedCourses = await getCoursesForTool(tool.id);
    if (allocatedCourses.length === 0) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
