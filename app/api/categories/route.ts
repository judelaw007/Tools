import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/categories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories
 * Returns active categories (public endpoint — used by client components).
 */
export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({ success: true, categories });
}
