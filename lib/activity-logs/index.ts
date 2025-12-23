/**
 * Activity Logging System
 *
 * Tracks user and system activities for admin monitoring:
 * - Skills downloads/prints
 * - Skills sync from LearnWorlds
 * - Tools usage
 * - Project completions
 * - Skills verifications (QR scans)
 * - User sessions
 */

import { createClient } from '@supabase/supabase-js';

// Activity types
export type ActivityType =
  | 'skills_download'      // User downloaded/printed skills portfolio
  | 'skills_sync'          // User synced skills from LearnWorlds
  | 'skills_verification'  // Someone verified skills via QR code
  | 'tool_usage'           // User accessed a tool
  | 'project_save'         // User saved a project
  | 'user_login'           // User logged in
  | 'user_logout'          // User logged out
  | 'course_completion'    // Course marked as completed
  | 'admin_action';        // Admin performed an action

export interface ActivityLogEntry {
  id: string;
  activity_type: ActivityType;
  user_email: string | null;
  user_name: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogActivityParams {
  type: ActivityType;
  userEmail?: string | null;
  userName?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Get Supabase client with service role for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Log an activity to the database
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        activity_type: params.type,
        user_email: params.userEmail || null,
        user_name: params.userName || null,
        description: params.description,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return false;
  }
}

/**
 * Get activity logs with filtering and pagination
 */
export async function getActivityLogs(options: {
  type?: ActivityType;
  userEmail?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ logs: ActivityLogEntry[]; total: number }> {
  const supabase = getSupabase();

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options.type) {
    query = query.eq('activity_type', options.type);
  }

  if (options.userEmail) {
    query = query.eq('user_email', options.userEmail);
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data || []) as ActivityLogEntry[],
    total: count || 0,
  };
}

/**
 * Get activity summary/stats for dashboard
 */
export async function getActivityStats(days: number = 7): Promise<{
  totalActivities: number;
  byType: Record<ActivityType, number>;
  recentUsers: string[];
  dailyCounts: { date: string; count: number }[];
}> {
  const supabase = getSupabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all activities in the time range
  const { data: activities, error } = await supabase
    .from('activity_logs')
    .select('activity_type, user_email, created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error || !activities) {
    console.error('Error fetching activity stats:', error);
    return {
      totalActivities: 0,
      byType: {} as Record<ActivityType, number>,
      recentUsers: [],
      dailyCounts: [],
    };
  }

  // Count by type
  const byType: Record<string, number> = {};
  const userSet = new Set<string>();
  const dailyMap = new Map<string, number>();

  for (const activity of activities) {
    // Count by type
    byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;

    // Collect unique users
    if (activity.user_email) {
      userSet.add(activity.user_email);
    }

    // Count by day
    const date = new Date(activity.created_at).toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  }

  // Convert daily map to array
  const dailyCounts = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalActivities: activities.length,
    byType: byType as Record<ActivityType, number>,
    recentUsers: Array.from(userSet).slice(0, 20),
    dailyCounts,
  };
}

/**
 * Helper to extract IP and User Agent from Next.js request
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const headers = request.headers;
  return {
    ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headers.get('x-real-ip') ||
               null,
    userAgent: headers.get('user-agent') || null,
  };
}
