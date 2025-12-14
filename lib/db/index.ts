import type { Tool, Course, CourseTool, ToolStatus, ToolCategory } from '@/types';
import { createServiceClient } from '@/lib/supabase/server';
import { dbToolToAppTool, appToolToDbUpdate, type DbTool } from '@/lib/supabase/types';
import { SEED_TOOLS } from './seed-data';

/**
 * Database abstraction layer
 *
 * Uses Supabase for production, with fallback to seed data when:
 * - Supabase is not configured (missing env vars)
 * - Database tables are empty (initial setup)
 *
 * The service client is used to bypass RLS for server-side operations.
 */

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// ============================================
// TOOLS
// ============================================

export async function getAllTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('name');

    if (error) throw error;

    // Fallback to seed data if database is empty
    if (!data || data.length === 0) {
      return SEED_TOOLS;
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching tools from Supabase:', error);
    return SEED_TOOLS;
  }
}

export async function getActiveTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.filter(tool => tool.status === 'active');
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return SEED_TOOLS.filter(tool => tool.status === 'active');
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching active tools from Supabase:', error);
    return SEED_TOOLS.filter(tool => tool.status === 'active');
  }
}

export async function getPublicTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.filter(tool => tool.status === 'active' && tool.isPublic);
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return SEED_TOOLS.filter(tool => tool.status === 'active' && tool.isPublic);
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching public tools from Supabase:', error);
    return SEED_TOOLS.filter(tool => tool.status === 'active' && tool.isPublic);
  }
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.find(tool => tool.slug === slug) || null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found in DB, try seed data
        return SEED_TOOLS.find(tool => tool.slug === slug) || null;
      }
      throw error;
    }

    return dbToolToAppTool(data);
  } catch (error) {
    console.error('Error fetching tool by slug from Supabase:', error);
    return SEED_TOOLS.find(tool => tool.slug === slug) || null;
  }
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.find(tool => tool.id === id) || null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return SEED_TOOLS.find(tool => tool.id === id) || null;
      }
      throw error;
    }

    return dbToolToAppTool(data);
  } catch (error) {
    console.error('Error fetching tool by ID from Supabase:', error);
    return SEED_TOOLS.find(tool => tool.id === id) || null;
  }
}

export async function getToolsByCategory(category: ToolCategory): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.filter(tool => tool.category === category && tool.status === 'active');
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return SEED_TOOLS.filter(tool => tool.category === category && tool.status === 'active');
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching tools by category from Supabase:', error);
    return SEED_TOOLS.filter(tool => tool.category === category && tool.status === 'active');
  }
}

export async function getToolsByStatus(status: ToolStatus): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.filter(tool => tool.status === status);
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('status', status)
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      return SEED_TOOLS.filter(tool => tool.status === status);
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching tools by status from Supabase:', error);
    return SEED_TOOLS.filter(tool => tool.status === status);
  }
}

export async function searchTools(query: string): Promise<Tool[]> {
  const lowerQuery = query.toLowerCase();

  if (!isSupabaseConfigured()) {
    return SEED_TOOLS.filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.shortDescription?.toLowerCase().includes(lowerQuery) ||
      tool.description?.toLowerCase().includes(lowerQuery)
    );
  }

  try {
    const supabase = createServiceClient();
    // Use ilike for case-insensitive search
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .or(`name.ilike.%${query}%,short_description.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    if (!data || data.length === 0) {
      // Fallback to seed data search
      return SEED_TOOLS.filter(tool =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.shortDescription?.toLowerCase().includes(lowerQuery) ||
        tool.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error searching tools in Supabase:', error);
    return SEED_TOOLS.filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.shortDescription?.toLowerCase().includes(lowerQuery) ||
      tool.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Update a tool's properties
 * Admin function to modify tool metadata
 */
export async function updateTool(
  id: string,
  updates: Partial<Pick<Tool, 'name' | 'shortDescription' | 'description' | 'category' | 'status'>>
): Promise<Tool | null> {
  if (!isSupabaseConfigured()) {
    // Fallback to in-memory update (for development only)
    const tool = SEED_TOOLS.find(t => t.id === id);
    if (!tool) return null;
    Object.assign(tool, updates, { updatedAt: new Date() });
    return tool;
  }

  try {
    const supabase = createServiceClient();
    const dbUpdates = appToolToDbUpdate(updates);

    const { data, error } = await supabase
      .from('tools')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return dbToolToAppTool(data);
  } catch (error) {
    console.error('Error updating tool in Supabase:', error);
    return null;
  }
}

// ============================================
// COURSE-TOOL ALLOCATIONS
// ============================================

/**
 * Get tools allocated to a specific course
 * Used for displaying tools available in a course
 */
export async function getToolsForCourse(courseId: string): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select(`
        tool_id,
        tools (*)
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter(row => row.tools)
      .map(row => dbToolToAppTool(row.tools as unknown as DbTool));
  } catch (error) {
    console.error('Error fetching tools for course from Supabase:', error);
    return [];
  }
}

/**
 * Get course IDs that have access to a specific tool
 * Used by access control to check user enrollments
 */
export async function getCourseIdsForTool(toolId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('course_id')
      .eq('tool_id', toolId)
      .eq('is_active', true);

    if (error) throw error;

    return data?.map(row => row.course_id) || [];
  } catch (error) {
    console.error('Error fetching course IDs for tool from Supabase:', error);
    return [];
  }
}

/**
 * Get all course-tool allocations
 * Used by admin dashboard
 */
export async function getAllCourseToolAllocations(): Promise<{
  courseId: string;
  courseName: string | null;
  toolId: string;
  accessLevel: 'full' | 'limited' | 'preview';
  displayOrder: number;
  isActive: boolean;
}[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('*')
      .order('course_id')
      .order('display_order');

    if (error) throw error;

    return (data || []).map(row => ({
      courseId: row.course_id,
      courseName: row.course_name,
      toolId: row.tool_id,
      accessLevel: row.access_level,
      displayOrder: row.display_order,
      isActive: row.is_active,
    }));
  } catch (error) {
    console.error('Error fetching course-tool allocations from Supabase:', error);
    return [];
  }
}

/**
 * Allocate a tool to a course
 * Admin function to create course-tool mappings
 */
export async function allocateToolToCourse(
  toolId: string,
  courseId: string,
  courseName?: string,
  accessLevel: 'full' | 'limited' | 'preview' = 'full',
  displayOrder: number = 0
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('course_tool_allocations')
      .upsert({
        tool_id: toolId,
        course_id: courseId,
        course_name: courseName || null,
        access_level: accessLevel,
        display_order: displayOrder,
        is_active: true,
      }, {
        onConflict: 'course_id,tool_id',
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error allocating tool to course in Supabase:', error);
    return false;
  }
}

/**
 * Remove tool allocation from a course
 */
export async function removeToolFromCourse(toolId: string, courseId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('course_tool_allocations')
      .delete()
      .eq('tool_id', toolId)
      .eq('course_id', courseId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error removing tool from course in Supabase:', error);
    return false;
  }
}

// ============================================
// LEGACY COURSE FUNCTIONS (for compatibility)
// ============================================

// Note: Courses are managed via LearnWorlds, not stored locally
// These functions exist for backward compatibility

export async function getAllCourses(): Promise<Course[]> {
  return [];
}

export async function getActiveCourses(): Promise<Course[]> {
  return [];
}

export async function getCourseById(id: string): Promise<Course | null> {
  return null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return null;
}

export async function getCoursesForTool(toolId: string): Promise<Course[]> {
  return [];
}

export async function getCoursesByToolId(toolId: string): Promise<Course[]> {
  return [];
}

export async function getCourseToolMapping(courseId: string, toolId: string): Promise<Omit<CourseTool, 'id'> | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('*')
      .eq('course_id', courseId)
      .eq('tool_id', toolId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return {
      courseId: data.course_id,
      toolId: data.tool_id,
      accessLevel: data.access_level,
      displayOrder: data.display_order,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('Error fetching course-tool mapping from Supabase:', error);
    return null;
  }
}

// ============================================
// STATISTICS (for admin dashboard)
// ============================================

export async function getToolStats() {
  const tools = await getAllTools();
  return {
    totalTools: tools.length,
    activeTools: tools.filter(t => t.status === 'active').length,
    draftTools: tools.filter(t => t.status === 'draft').length,
    inactiveTools: tools.filter(t => t.status === 'inactive').length,
    archivedTools: tools.filter(t => t.status === 'archived').length,
  };
}

export async function getCourseStats() {
  if (!isSupabaseConfigured()) {
    return {
      totalCourses: 0,
      totalAllocations: 0,
      allocatedTools: 0,
    };
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('course_tool_allocations')
      .select('course_id, tool_id');

    if (error) throw error;

    const uniqueCourses = new Set(data?.map(row => row.course_id) || []);
    const uniqueTools = new Set(data?.map(row => row.tool_id) || []);

    return {
      totalCourses: uniqueCourses.size,
      totalAllocations: data?.length || 0,
      allocatedTools: uniqueTools.size,
    };
  } catch (error) {
    console.error('Error fetching course stats from Supabase:', error);
    return {
      totalCourses: 0,
      totalAllocations: 0,
      allocatedTools: 0,
    };
  }
}

export async function getPlatformStats() {
  const toolStats = await getToolStats();
  const courseStats = await getCourseStats();

  return {
    ...toolStats,
    ...courseStats,
    // Usage stats would come from tool_usage_logs table
    totalUsers: 0,
    usageToday: 0,
  };
}

// ============================================
// TOOLS BY CATEGORY (for grouped display)
// ============================================

export async function getToolsGroupedByCategory(): Promise<Record<ToolCategory, Tool[]>> {
  const tools = await getActiveTools();
  const grouped: Record<string, Tool[]> = {};

  tools.forEach(tool => {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  });

  return grouped as Record<ToolCategory, Tool[]>;
}

// ============================================
// RECENT TOOLS (for dashboard)
// ============================================

export async function getRecentTools(limit: number = 5): Promise<Tool[]> {
  if (!isSupabaseConfigured()) {
    return SEED_TOOLS
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      return SEED_TOOLS
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit);
    }

    return data.map(dbToolToAppTool);
  } catch (error) {
    console.error('Error fetching recent tools from Supabase:', error);
    return SEED_TOOLS
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }
}

// ============================================
// TOOL USAGE LOGGING
// ============================================

export async function logToolUsage(
  toolId: string,
  action: 'view' | 'calculate' | 'save' | 'export' | 'error',
  userEmail?: string,
  learnworldsUserId?: string,
  metadata?: Record<string, unknown>,
  sessionId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('tool_usage_logs')
      .insert({
        tool_id: toolId,
        user_email: userEmail || null,
        learnworlds_user_id: learnworldsUserId || null,
        action,
        metadata: metadata || null,
        session_id: sessionId || null,
      });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error logging tool usage to Supabase:', error);
    return false;
  }
}
