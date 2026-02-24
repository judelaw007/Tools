import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/categories';

function isAdmin(role?: string) {
  return role === 'admin' || role === 'super_admin';
}

/**
 * GET /api/admin/categories
 * Returns all categories (including inactive) for admin management.
 */
export async function GET() {
  const session = await getServerSession();
  if (!isAdmin(session?.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const categories = await getAllCategories();
  return NextResponse.json({ success: true, categories });
}

/**
 * POST /api/admin/categories
 * Create a new category.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session?.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { slug, name, shortName, description, color, displayOrder } = body;

  if (!slug || !name || !shortName) {
    return NextResponse.json(
      { success: false, error: 'slug, name, and shortName are required' },
      { status: 400 }
    );
  }

  const result = await createCategory({ slug, name, shortName, description, color, displayOrder });
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}

/**
 * PATCH /api/admin/categories
 * Update an existing category.
 */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session?.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { slug, ...updates } = body;

  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'slug is required' },
      { status: 400 }
    );
  }

  const result = await updateCategory(slug, updates);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

/**
 * DELETE /api/admin/categories
 * Delete a category (only if no tools are assigned to it).
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session?.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'slug query parameter is required' },
      { status: 400 }
    );
  }

  const result = await deleteCategory(slug);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
