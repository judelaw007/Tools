/**
 * Session Management Utilities
 *
 * Handles session validation, enrollment refresh, and access control.
 *
 * REFRESH POLICY:
 * - Enrollments are refreshed every 24 hours
 * - If user no longer exists in LearnWorlds → immediate session invalidation
 * - If user exists but enrollments changed → session updated with new enrollments
 */

import { learnworlds } from '@/lib/learnworlds';
import { cookies } from 'next/headers';

// Session refresh interval: 24 hours in milliseconds
const ENROLLMENT_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

export interface SessionData {
  email: string;
  role: 'user' | 'admin';
  learnworldsId?: string;
  learnworldsUser?: {
    id: string;
    email: string;
    username?: string;
  };
  /**
   * Course IDs the user has access to (via direct purchase, bundle, or subscription)
   * This is the KEY field for tool access control - tools are allocated to courses,
   * and users get access if they can access ANY course with the tool allocated.
   */
  accessibleCourseIds?: string[];
  /**
   * Enrollments are kept for display purposes (showing what products user owns)
   * but NOT used for access control - use accessibleCourseIds instead.
   */
  enrollments?: Array<{
    product_id: string;
    product_name: string;
    product_type: string;
    enrolled_date?: string;
  }>;
  authenticatedAt: string;
  lastEnrollmentCheck?: string;
}

/**
 * Parse session data from cookie
 */
export function parseSession(sessionCookie: string | undefined): SessionData | null {
  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Encode session data for cookie
 */
export function encodeSession(session: SessionData): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

/**
 * Check if enrollments need to be refreshed
 */
export function needsEnrollmentRefresh(session: SessionData): boolean {
  // Admin sessions don't need enrollment refresh
  if (session.role === 'admin') return false;

  // No LearnWorlds ID means this is not a LearnWorlds user
  if (!session.learnworldsId) return false;

  const lastCheck = session.lastEnrollmentCheck
    ? new Date(session.lastEnrollmentCheck).getTime()
    : 0;

  const now = Date.now();
  return now - lastCheck > ENROLLMENT_REFRESH_INTERVAL;
}

/**
 * Refresh user enrollments from LearnWorlds
 *
 * Returns:
 * - Updated session data if user exists
 * - null if user no longer exists (session should be invalidated)
 */
export async function refreshEnrollments(
  session: SessionData
): Promise<SessionData | null> {
  // Admin sessions don't need refresh
  if (session.role === 'admin') {
    return session;
  }

  // No LearnWorlds ID - can't refresh
  if (!session.learnworldsId) {
    return session;
  }

  try {
    // First, verify user still exists in LearnWorlds
    const user = await learnworlds.getUserById(session.learnworldsId);

    // User no longer exists - invalidate session immediately
    if (!user) {
      console.log(`User ${session.email} no longer exists in LearnWorlds - invalidating session`);
      return null;
    }

    // User exists - fetch fresh course access and enrollments
    const [accessibleCourseIds, enrollments] = await Promise.all([
      learnworlds.getUserCourseAccess(session.learnworldsId),
      learnworlds.getUserEnrollments(session.learnworldsId),
    ]);

    // Update session with fresh data
    const updatedSession: SessionData = {
      ...session,
      learnworldsUser: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      // KEY: Refresh accessible course IDs for tool access control
      accessibleCourseIds,
      enrollments: enrollments.map((e) => ({
        product_id: e.product_id,
        product_name: e.product_title || 'Unknown',
        product_type: e.product_type || 'course',
        enrolled_date: e.enrolled_at,
      })),
      lastEnrollmentCheck: new Date().toISOString(),
    };

    return updatedSession;
  } catch (error) {
    console.error('Error refreshing enrollments:', error);
    // On API error, keep existing session (don't lock out users due to temporary issues)
    return session;
  }
}

/**
 * Get accessible course IDs from session
 * These are courses the user can access via direct purchase, bundle, or subscription
 */
export function getAccessibleCourseIds(session: SessionData | null): string[] {
  if (!session || !session.accessibleCourseIds) return [];
  return session.accessibleCourseIds;
}

/**
 * @deprecated Use getAccessibleCourseIds for access control
 * Get enrolled product IDs from session (for display purposes only)
 */
export function getEnrolledProductIds(session: SessionData | null): string[] {
  if (!session || !session.enrollments) return [];
  return session.enrollments.map((e) => e.product_id);
}

/**
 * Check if session has access to a specific course
 * Access can be via direct purchase, bundle, or subscription
 */
export function hasAccessToCourse(
  session: SessionData | null,
  courseId: string
): boolean {
  if (!session) return false;
  if (session.role === 'admin') return true;

  const accessibleIds = getAccessibleCourseIds(session);
  return accessibleIds.includes(courseId);
}
