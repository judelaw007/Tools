/**
 * Access Control Service
 *
 * Determines whether a user can access a specific tool based on:
 * 1. Admin role - admins can access everything
 * 2. Course enrollment - users enrolled in allocated courses can access
 *
 * This implements the access model from MASTER-PLAN-v2.md:
 * User Access = (User Enrollments) ∩ (Tool Course Allocations)
 */

import { learnworlds } from './client';
import { AccessCheckResult, LearnWorldsEnrollment } from './types';
import { getCoursesByToolId, getToolBySlug } from '@/lib/db';

interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  learnworldsId?: string;
}

/**
 * Check if a user can access a specific tool
 */
export async function checkToolAccess(
  user: UserProfile | null,
  toolSlug: string
): Promise<AccessCheckResult> {
  // Not authenticated
  if (!user) {
    return {
      hasAccess: false,
      reason: 'not_authenticated',
    };
  }

  // Admins have access to everything
  if (user.role === 'admin' || user.role === 'super_admin') {
    return {
      hasAccess: true,
      reason: 'admin',
    };
  }

  // Get tool information
  const tool = await getToolBySlug(toolSlug);
  if (!tool) {
    return {
      hasAccess: false,
      reason: 'no_enrollment',
    };
  }

  // Get courses this tool is allocated to
  const allocatedCourses = await getCoursesByToolId(tool.id);

  // If tool has no course allocations, it might be free/public
  if (allocatedCourses.length === 0) {
    // Check if tool is marked as public and not premium
    if (tool.isPublic && !tool.isPremium) {
      return {
        hasAccess: true,
        reason: 'enrolled', // Free tool
      };
    }
    return {
      hasAccess: false,
      reason: 'no_enrollment',
      requiredCourses: [],
    };
  }

  // Get user's LearnWorlds enrollments
  let enrollments: LearnWorldsEnrollment[] = [];

  if (user.learnworldsId) {
    enrollments = await learnworlds.getUserEnrollments(user.learnworldsId);
  } else if (user.email) {
    // Try to find user by email if no LearnWorlds ID stored
    enrollments = await learnworlds.getUserEnrollmentsByEmail(user.email);
  }

  // Extract product IDs from enrollments
  const enrolledProductIds = enrollments.map((e) => e.product_id);

  // Check for overlap between allocated courses and user enrollments
  const matchingCourses = allocatedCourses.filter((course) =>
    enrolledProductIds.includes(course.id)
  );

  if (matchingCourses.length > 0) {
    return {
      hasAccess: true,
      reason: 'enrolled',
      enrolledCourses: enrollments.filter((e) =>
        matchingCourses.some((c) => c.id === e.product_id)
      ),
    };
  }

  // No access - return required courses for "Get Access" display
  return {
    hasAccess: false,
    reason: 'no_enrollment',
    requiredCourses: allocatedCourses.map((course) => ({
      id: course.id,
      name: course.name,
      url: course.learnworldsUrl,
    })),
  };
}

/**
 * Check if user can access the dashboard (any authenticated user)
 */
export async function checkDashboardAccess(
  user: UserProfile | null
): Promise<boolean> {
  if (!user) return false;
  return true; // Any authenticated user can access dashboard
}

/**
 * Check if user can access admin area
 */
export async function checkAdminAccess(
  user: UserProfile | null
): Promise<boolean> {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Get all tools a user has access to
 */
export async function getUserAccessibleTools(
  user: UserProfile | null
): Promise<{ toolId: string; accessReason: 'admin' | 'enrolled' }[]> {
  if (!user) return [];

  // Admins have access to all tools
  if (user.role === 'admin' || user.role === 'super_admin') {
    // Return empty - caller should fetch all tools
    return [];
  }

  // Get user's enrollments
  let enrollments: LearnWorldsEnrollment[] = [];

  if (user.learnworldsId) {
    enrollments = await learnworlds.getUserEnrollments(user.learnworldsId);
  } else if (user.email) {
    enrollments = await learnworlds.getUserEnrollmentsByEmail(user.email);
  }

  // This would need to query course_tools table to get all tools
  // for the user's enrolled courses
  // For now, return the enrollment info for the caller to process
  return [];
}

/**
 * Sync LearnWorlds user data to local profile
 * Called after SSO login to update local user data
 */
export async function syncLearnWorldsUser(
  email: string
): Promise<{ learnworldsId: string; enrollments: LearnWorldsEnrollment[] } | null> {
  try {
    const lwUser = await learnworlds.getUserByEmail(email);
    if (!lwUser) return null;

    const enrollments = await learnworlds.getUserEnrollments(lwUser.id);

    return {
      learnworldsId: lwUser.id,
      enrollments,
    };
  } catch (error) {
    console.error('Error syncing LearnWorlds user:', error);
    return null;
  }
}
