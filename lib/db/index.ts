import type { Tool, Course, CourseTool, ToolStatus, ToolCategory } from '@/types';
import { SEED_TOOLS } from './seed-data';

// Database abstraction layer
// Currently uses in-memory seed data for tools
// Courses and course-tool mappings are managed by admins via API (Supabase)
// Will be fully replaced with Supabase queries in production

// ============================================
// TOOLS
// ============================================

export async function getAllTools(): Promise<Tool[]> {
  const { data } = await supabase.from('tools').select('*');
  return data || [];
}

export async function getActiveTools(): Promise<Tool[]> {
  // In production: return supabase.from('tools').select('*').eq('status', 'active')
  return SEED_TOOLS.filter(tool => tool.status === 'active');
}

export async function getPublicTools(): Promise<Tool[]> {
  // In production: return supabase.from('tools').select('*').eq('status', 'active').eq('is_public', true)
  return SEED_TOOLS.filter(tool => tool.status === 'active' && tool.isPublic);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  // In production: return supabase.from('tools').select('*').eq('slug', slug).single()
  return SEED_TOOLS.find(tool => tool.slug === slug) || null;
}

export async function getToolById(id: string): Promise<Tool | null> {
  // In production: return supabase.from('tools').select('*').eq('id', id).single()
  return SEED_TOOLS.find(tool => tool.id === id) || null;
}

export async function getToolsByCategory(category: ToolCategory): Promise<Tool[]> {
  // In production: return supabase.from('tools').select('*').eq('category', category).eq('status', 'active')
  return SEED_TOOLS.filter(tool => tool.category === category && tool.status === 'active');
}

export async function getToolsByStatus(status: ToolStatus): Promise<Tool[]> {
  // In production: return supabase.from('tools').select('*').eq('status', status)
  return SEED_TOOLS.filter(tool => tool.status === status);
}

export async function searchTools(query: string): Promise<Tool[]> {
  const lowerQuery = query.toLowerCase();
  return SEED_TOOLS.filter(tool =>
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.shortDescription?.toLowerCase().includes(lowerQuery) ||
    tool.description?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// COURSES (managed by admin via Supabase)
// ============================================

export async function getAllCourses(): Promise<Course[]> {
  // TODO: return supabase.from('courses').select('*')
  return [];
}

export async function getActiveCourses(): Promise<Course[]> {
  // TODO: return supabase.from('courses').select('*').eq('is_active', true)
  return [];
}

export async function getCourseById(id: string): Promise<Course | null> {
  // TODO: return supabase.from('courses').select('*').eq('id', id).single()
  return null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  // TODO: return supabase.from('courses').select('*').eq('slug', slug).single()
  return null;
}

// ============================================
// COURSE-TOOL MAPPINGS (managed by admin via Supabase)
// ============================================

export async function getToolsForCourse(courseId: string): Promise<Tool[]> {
  // TODO: join query with course_tools and tools tables from Supabase
  return [];
}

export async function getCoursesForTool(toolId: string): Promise<Course[]> {
  // TODO: join query with course_tools and courses tables from Supabase
  return [];
}

export async function getCourseToolMapping(courseId: string, toolId: string): Promise<Omit<CourseTool, 'id'> | null> {
  // TODO: return supabase.from('course_tools').select('*').eq('course_id', courseId).eq('tool_id', toolId).single()
  return null;
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
  // TODO: Get course stats from Supabase
  return {
    totalCourses: 0,
    activeCourses: 0,
  };
}

export async function getPlatformStats() {
  const toolStats = await getToolStats();
  const courseStats = await getCourseStats();

  return {
    ...toolStats,
    ...courseStats,
    // These would come from actual usage tracking in production
    totalUsers: 0, // Will be populated from Supabase auth
    usageToday: 0, // Will be populated from usage logs
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
  const tools = await getAllTools();
  return tools
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}
