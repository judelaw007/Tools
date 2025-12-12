/**
 * Server-side Session Utilities
 *
 * Use these functions in Server Components and API routes
 * to access session data and check permissions.
 */

import { cookies } from 'next/headers';
import { getCoursesForTool } from '@/lib/course-allocations';

export interface ServerSessionData {
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  learnworldsId?: string;
  learnworldsUser?: {
    id: string;
    email: string;
    username?: string;
  };
  /**
   * Course IDs the user has access to (via direct purchase, bundle, or subscription)
   * This is the KEY field for tool access control.
   */
  accessibleCourseIds?: string[];
  /**
   * Enrollments are kept for display purposes only - NOT used for access control
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
 * Get current user session from cookies (Server Component)
 */
export async function getServerSession(): Promise<ServerSessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('mojitax-session')?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get accessible course IDs from session
 * These are courses the user can access via direct purchase, bundle, or subscription
 */
export async function getAccessibleCourseIds(): Promise<string[]> {
  const session = await getServerSession();
  if (!session?.accessibleCourseIds) return [];
  return session.accessibleCourseIds;
}

/**
 * @deprecated Use getAccessibleCourseIds for access control
 * Get enrolled product IDs from session (for display purposes only)
 */
export async function getEnrolledCourseIds(): Promise<string[]> {
  const session = await getServerSession();
  if (!session?.enrollments) return [];
  return session.enrollments.map((e) => e.product_id);
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getServerSession();
  return session?.role === 'admin' || session?.role === 'super_admin';
}

/**
 * Check if user has access to a specific tool
 *
 * Access is granted if:
 * 1. User is admin (always has access)
 * 2. User can access ANY course that has this tool allocated
 *    (access can be via direct purchase, bundle, or subscription)
 */
export async function hasToolAccess(toolId: string): Promise<boolean> {
  const session = await getServerSession();

  if (!session) return false;

  // Admins always have access
  if (session.role === 'admin' || session.role === 'super_admin') {
    return true;
  }

  // Get user's accessible course IDs (from direct purchase, bundle, or subscription)
  const userCourseIds = session.accessibleCourseIds || [];

  // Get courses that have this tool allocated
  const allocatedCourseIds = getCoursesForTool(toolId);

  // User has access if they can access any course with this tool
  return allocatedCourseIds.some((courseId) =>
    userCourseIds.includes(courseId)
  );
}

/**
 * Get tool access map for multiple tools
 *
 * Returns a Map of toolId -> hasAccess
 * Efficient for checking access to many tools at once
 *
 * Access is based on accessible courses (via direct purchase, bundle, or subscription)
 */
export async function getToolAccessMap(
  toolIds: string[]
): Promise<Map<string, boolean>> {
  const session = await getServerSession();
  const accessMap = new Map<string, boolean>();

  // No session = no access to anything
  if (!session) {
    toolIds.forEach((id) => accessMap.set(id, false));
    return accessMap;
  }

  // Admins have access to everything
  if (session.role === 'admin' || session.role === 'super_admin') {
    toolIds.forEach((id) => accessMap.set(id, true));
    return accessMap;
  }

  // Get user's accessible course IDs (from direct purchase, bundle, or subscription)
  const userCourseIds = new Set(session.accessibleCourseIds || []);

  // Check each tool
  for (const toolId of toolIds) {
    const allocatedCourseIds = getCoursesForTool(toolId);
    const hasAccess = allocatedCourseIds.some((courseId) =>
      userCourseIds.has(courseId)
    );
    accessMap.set(toolId, hasAccess);
  }

  return accessMap;
}

/**
 * Get tools the user has access to from a list
 *
 * Returns tools with hasAccess flag added
 */
export async function filterToolsByAccess<T extends { id: string }>(
  tools: T[]
): Promise<Array<T & { hasAccess: boolean }>> {
  const toolIds = tools.map((t) => t.id);
  const accessMap = await getToolAccessMap(toolIds);

  return tools.map((tool) => ({
    ...tool,
    hasAccess: accessMap.get(tool.id) ?? false,
  }));
}
