/**
 * User Saved Work - Individual Item Routes
 *
 * GET    /api/user/saved-work/{id} - Get specific saved work
 * PUT    /api/user/saved-work/{id} - Update saved work
 * DELETE /api/user/saved-work/{id} - Delete saved work
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import {
  getSavedWorkById,
  updateSavedWork,
  deleteSavedWork,
} from '@/lib/saved-work';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/user/saved-work/{id}
 *
 * Returns a specific saved work item.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const item = await getSavedWorkById(id, session.email);

    if (!item) {
      return NextResponse.json(
        { error: 'Saved work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('GET /api/user/saved-work/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved work' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/saved-work/{id}
 *
 * Updates an existing saved work entry.
 *
 * Body (all optional):
 * - name: string
 * - data: object
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, data } = body;

    // Build updates object
    const updates: { name?: string; data?: unknown } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name;
    }

    if (data !== undefined) {
      if (typeof data !== 'object' || data === null) {
        return NextResponse.json(
          { error: 'data must be an object' },
          { status: 400 }
        );
      }
      updates.data = data;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedItem = await updateSavedWork(id, session.email, updates);

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Saved work not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error('PUT /api/user/saved-work/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved work' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/saved-work/{id}
 *
 * Deletes a saved work entry.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const success = await deleteSavedWork(id, session.email);

    if (!success) {
      return NextResponse.json(
        { error: 'Saved work not found or delete failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Saved work deleted',
    });
  } catch (error) {
    console.error('DELETE /api/user/saved-work/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved work' },
      { status: 500 }
    );
  }
}
