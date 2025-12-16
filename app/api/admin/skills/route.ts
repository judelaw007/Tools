/**
 * Admin Skills API Routes
 *
 * GET  /api/admin/skills - List all skill categories
 * POST /api/admin/skills - Create a new skill category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getAllFullSkillCategories,
  createSkillCategory,
} from '@/lib/skill-categories';

/**
 * GET /api/admin/skills
 * Returns all skill categories with their courses and tools
 */
export async function GET() {
  try {
    const session = await getServerSession();

    if (!(session?.role === 'admin' || session?.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const categories = await getAllFullSkillCategories();

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('GET /api/admin/skills error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/skills
 * Create a new skill category
 *
 * Body:
 * - name: string (required)
 * - slug: string (required)
 * - knowledgeDescription: string (optional)
 * - displayOrder: number (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!(session?.role === 'admin' || session?.role === 'super_admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, knowledgeDescription, displayOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const category = await createSkillCategory({
      name,
      slug,
      knowledgeDescription,
      displayOrder,
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Failed to create skill category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/skills error:', error);
    return NextResponse.json(
      { error: 'Failed to create skill category' },
      { status: 500 }
    );
  }
}
