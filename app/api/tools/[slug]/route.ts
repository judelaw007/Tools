import { NextResponse } from 'next/server';
import { getToolBySlug } from '@/lib/db';

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

    // Only return active tools to non-admin users
    // In production, you would check the user's role here
    if (tool.status !== 'active') {
      return NextResponse.json(
        { error: 'Tool not available' },
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
