/**
 * Course-Tool Allocations Storage
 *
 * Uses Supabase for persistent storage of course-tool allocations.
 *
 * Required Supabase table:
 * CREATE TABLE course_tool_allocations (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   course_id TEXT NOT NULL,
 *   course_name TEXT,
 *   tool_id TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(course_id, tool_id)
 * );
 *
 * CREATE INDEX idx_course_allocations_course ON course_tool_allocations(course_id);
 * CREATE INDEX idx_course_allocations_tool ON course_tool_allocations(tool_id);
 */

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Get all tool IDs allocated to a course
 */
export async function getToolsForCourse(courseId: string): Promise<string[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('tool_id')
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching tools for course:', error);
      return [];
    }

    return data?.map((row: { tool_id: string }) => row.tool_id) || [];
  } catch (error) {
    console.error('getToolsForCourse error:', error);
    return [];
  }
}

/**
 * Get all course IDs that have a specific tool allocated
 */
export async function getCoursesForTool(toolId: string): Promise<string[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('course_id')
      .eq('tool_id', toolId);

    if (error) {
      console.error('Error fetching courses for tool:', error);
      return [];
    }

    return data?.map((row: { course_id: string }) => row.course_id) || [];
  } catch (error) {
    console.error('getCoursesForTool error:', error);
    return [];
  }
}

/**
 * Set tool allocations for a course (replaces existing)
 */
export async function setToolsForCourse(courseId: string, toolIds: string[], courseName?: string): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    // First, delete existing allocations for this course
    const { error: deleteError } = await supabase
      .from('course_tool_allocations')
      .delete()
      .eq('course_id', courseId);

    if (deleteError) {
      console.error('Error deleting existing allocations:', deleteError);
      return false;
    }

    // If no tools to add, we're done
    if (toolIds.length === 0) {
      return true;
    }

    // Insert new allocations
    const allocations = toolIds.map(toolId => ({
      course_id: courseId,
      course_name: courseName || null,
      tool_id: toolId,
    }));

    const { error: insertError } = await supabase
      .from('course_tool_allocations')
      .insert(allocations);

    if (insertError) {
      console.error('Error inserting allocations:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('setToolsForCourse error:', error);
    return false;
  }
}

/**
 * Add a tool to a course
 */
export async function addToolToCourse(courseId: string, toolId: string): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('course_tool_allocations')
      .upsert({
        course_id: courseId,
        tool_id: toolId,
      }, {
        onConflict: 'course_id,tool_id'
      });

    if (error) {
      console.error('Error adding tool to course:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('addToolToCourse error:', error);
    return false;
  }
}

/**
 * Remove a tool from a course
 */
export async function removeToolFromCourse(courseId: string, toolId: string): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('course_tool_allocations')
      .delete()
      .eq('course_id', courseId)
      .eq('tool_id', toolId);

    if (error) {
      console.error('Error removing tool from course:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('removeToolFromCourse error:', error);
    return false;
  }
}

/**
 * Remove all allocations for a course
 */
export async function clearCourseAllocations(courseId: string): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase
      .from('course_tool_allocations')
      .delete()
      .eq('course_id', courseId);

    if (error) {
      console.error('Error clearing course allocations:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('clearCourseAllocations error:', error);
    return false;
  }
}

/**
 * Get all allocations (for debugging/admin)
 */
export async function getAllAllocations(): Promise<Record<string, string[]>> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('course_id, tool_id');

    if (error) {
      console.error('Error fetching all allocations:', error);
      return {};
    }

    const result: Record<string, string[]> = {};
    data?.forEach((row: { course_id: string; tool_id: string }) => {
      if (!result[row.course_id]) {
        result[row.course_id] = [];
      }
      result[row.course_id].push(row.tool_id);
    });

    return result;
  } catch (error) {
    console.error('getAllAllocations error:', error);
    return {};
  }
}

/**
 * Check if a user (with their enrolled course IDs) has access to a tool
 */
export async function checkUserToolAccess(
  enrolledCourseIds: string[],
  toolId: string
): Promise<{ hasAccess: boolean; viaCourses: string[] }> {
  const coursesWithTool = await getCoursesForTool(toolId);
  const matchingCourses = coursesWithTool.filter(courseId =>
    enrolledCourseIds.includes(courseId)
  );

  return {
    hasAccess: matchingCourses.length > 0,
    viaCourses: matchingCourses,
  };
}

/**
 * Course with tools info for dashboard display
 */
export interface CourseWithTools {
  courseId: string;
  courseName: string;
  toolCount: number;
  toolIds: string[];
}

/**
 * Get all courses that have tools allocated, with their tool counts
 * Used for the user dashboard to show courses with tools
 */
export async function getCoursesWithTools(): Promise<CourseWithTools[]> {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('course_id, course_name, tool_id');

    if (error) {
      console.error('Error fetching courses with tools:', error);
      return [];
    }

    // Group by course
    const courseMap = new Map<string, { name: string; toolIds: string[] }>();

    data?.forEach((row: { course_id: string; course_name: string | null; tool_id: string }) => {
      if (!courseMap.has(row.course_id)) {
        courseMap.set(row.course_id, {
          name: row.course_name || row.course_id,
          toolIds: [],
        });
      }
      courseMap.get(row.course_id)!.toolIds.push(row.tool_id);
    });

    // Convert to array
    const result: CourseWithTools[] = [];
    courseMap.forEach((value, courseId) => {
      result.push({
        courseId,
        courseName: value.name,
        toolCount: value.toolIds.length,
        toolIds: value.toolIds,
      });
    });

    return result;
  } catch (error) {
    console.error('getCoursesWithTools error:', error);
    return [];
  }
}
