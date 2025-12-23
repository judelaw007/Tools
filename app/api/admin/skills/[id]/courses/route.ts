/**
 * Skill Category Courses API Routes
 *
 * GET    /api/admin/skills/[id]/courses - List courses for category
 * POST   /api/admin/skills/[id]/courses - Add course to category
 * PUT    /api/admin/skills/[id]/courses - Update course details (description, learning hours)
 * DELETE /api/admin/skills/[id]/courses - Remove course from category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getCoursesForCategory,
  addCourseToCategory,
  removeCourseFromCategory,
  updateCourseDetails,
} from '@/lib/skill-categories';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/skills/[id]/courses
 * Get courses linked to this skill category
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
    const courses = await getCoursesForCategory(id);

    return NextResponse.json({
      success: true,
      courses,
      count: courses.length,
    });
  } catch (error) {
    console.error('GET /api/admin/skills/[id]/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/skills/[id]/courses
 * Add course to skill category
 *
 * Body:
 * - courseId: string (required)
 * - courseName: string (optional)
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
    const { courseId, courseName } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const course = await addCourseToCategory(id, courseId, courseName);

    if (!course) {
      return NextResponse.json(
        { error: 'Failed to add course to category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      course,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/skills/[id]/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to add course' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/skills/[id]/courses
 * Update course details (knowledge description and/or learning hours)
 *
 * Body:
 * - courseId: string (required)
 * - knowledgeDescription: string (optional)
 * - learningHours: number | null (optional) - Estimated learning hours
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
    const { courseId, knowledgeDescription, learningHours } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    // Build updates object with only provided fields
    const updates: { knowledgeDescription?: string; learningHours?: number | null } = {};
    if (knowledgeDescription !== undefined) {
      updates.knowledgeDescription = knowledgeDescription;
    }
    if (learningHours !== undefined) {
      // Parse to number or null
      updates.learningHours = learningHours === null || learningHours === ''
        ? null
        : parseFloat(learningHours);
    }

    const course = await updateCourseDetails(id, courseId, updates);

    if (!course) {
      return NextResponse.json(
        { error: 'Failed to update course details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error('PUT /api/admin/skills/[id]/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/skills/[id]/courses
 * Remove course from skill category
 *
 * Body:
 * - courseId: string (required)
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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const success = await removeCourseFromCategory(id, courseId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove course from category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course removed from category',
    });
  } catch (error) {
    console.error('DELETE /api/admin/skills/[id]/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to remove course' },
      { status: 500 }
    );
  }
}
