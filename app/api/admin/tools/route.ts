import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, updateTool } from '@/lib/db';

export async function GET() {
  try {
    const tools = await getAllTools();
    return NextResponse.json({ tools });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    const updatedTool = await updateTool(id, updates);

    if (!updatedTool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tool: updatedTool });
  } catch (error) {
    console.error('Failed to update tool:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}
