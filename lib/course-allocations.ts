/**
 * Course-Tool Allocations Storage
 *
 * In-memory storage for course-tool allocations.
 * This will be replaced with Supabase in production.
 *
 * Key: courseId (LearnWorlds course/product ID)
 * Value: array of toolIds allocated to that course
 */

// Global in-memory storage
const allocations: Map<string, string[]> = new Map();

/**
 * Get all tool IDs allocated to a course
 */
export function getToolsForCourse(courseId: string): string[] {
  return allocations.get(courseId) || [];
}

/**
 * Get all course IDs that have a specific tool allocated
 */
export function getCoursesForTool(toolId: string): string[] {
  const courses: string[] = [];

  allocations.forEach((toolIds, courseId) => {
    if (toolIds.includes(toolId)) {
      courses.push(courseId);
    }
  });

  return courses;
}

/**
 * Set tool allocations for a course (replaces existing)
 */
export function setToolsForCourse(courseId: string, toolIds: string[]): void {
  allocations.set(courseId, toolIds);
}

/**
 * Add a tool to a course
 */
export function addToolToCourse(courseId: string, toolId: string): void {
  const existing = allocations.get(courseId) || [];
  if (!existing.includes(toolId)) {
    allocations.set(courseId, [...existing, toolId]);
  }
}

/**
 * Remove a tool from a course
 */
export function removeToolFromCourse(courseId: string, toolId: string): void {
  const existing = allocations.get(courseId) || [];
  allocations.set(courseId, existing.filter(id => id !== toolId));
}

/**
 * Remove all allocations for a course
 */
export function clearCourseAllocations(courseId: string): void {
  allocations.delete(courseId);
}

/**
 * Get all allocations (for debugging/admin)
 */
export function getAllAllocations(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  allocations.forEach((toolIds, courseId) => {
    result[courseId] = toolIds;
  });
  return result;
}

/**
 * Check if a user (with their enrolled course IDs) has access to a tool
 */
export function checkUserToolAccess(
  enrolledCourseIds: string[],
  toolId: string
): { hasAccess: boolean; viaCourses: string[] } {
  const coursesWithTool = getCoursesForTool(toolId);
  const matchingCourses = coursesWithTool.filter(courseId =>
    enrolledCourseIds.includes(courseId)
  );

  return {
    hasAccess: matchingCourses.length > 0,
    viaCourses: matchingCourses,
  };
}
