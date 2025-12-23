/**
 * Admin Activity Logs API
 *
 * GET /api/admin/activity-logs - Get activity logs with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server-session';
import { getActivityLogs, getActivityStats, ActivityType } from '@/lib/activity-logs';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession();

    if (!session?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.role !== 'admin' && session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'logs' or 'stats'

    if (view === 'stats') {
      // Get activity statistics
      const days = parseInt(searchParams.get('days') || '7', 10);
      const stats = await getActivityStats(days);

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Get activity logs with filters
    const type = searchParams.get('type') as ActivityType | null;
    const userEmail = searchParams.get('userEmail');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { logs, total } = await getActivityLogs({
      type: type || undefined,
      userEmail: userEmail || undefined,
      limit,
      offset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json({
      success: true,
      logs,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/activity-logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}
