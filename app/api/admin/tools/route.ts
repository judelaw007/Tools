import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/db';

export async function GET() {
  try {
    const tools = await getAllTools();
    return NextResponse.json({ tools });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}
