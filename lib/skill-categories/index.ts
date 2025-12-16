/**
 * Skill Categories - Admin-defined Skills System
 *
 * This module provides the foundation for admin-defined skill categories.
 * Skills are grouped into categories (e.g., "Pillar 2 Skills") with:
 * - Knowledge: Earned by completing linked courses
 * - Application: Earned by completing projects with linked tools
 */

import { createServiceClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  knowledgeDescription: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillCategoryCourse {
  id: string;
  categoryId: string;
  courseId: string;
  courseName: string | null;
}

export interface SkillCategoryTool {
  id: string;
  categoryId: string;
  toolId: string;
  toolName: string | null;
  applicationDescription: string | null;
  displayOrder: number;
}

export interface UserSkillProgress {
  id: string;
  userEmail: string;
  categoryId: string;
  knowledgeCompleted: boolean;
  knowledgeCompletedAt: Date | null;
  knowledgeCourseId: string | null;
}

export interface UserToolProject {
  id: string;
  userEmail: string;
  toolId: string;
  projectCount: number;
  lastProjectAt: Date | null;
}

// Full skill category with all related data
export interface FullSkillCategory extends SkillCategory {
  courses: SkillCategoryCourse[];
  tools: SkillCategoryTool[];
}

// User's skill matrix entry
export interface UserSkillMatrixEntry {
  category: SkillCategory;
  knowledge: {
    completed: boolean;
    completedAt: Date | null;
    courseId: string | null;
  };
  application: {
    tools: Array<{
      toolId: string;
      toolName: string | null;
      description: string | null;
      projectCount: number;
      lastProjectAt: Date | null;
    }>;
  };
}

// ===========================================
// ROW CONVERTERS
// ===========================================

interface SkillCategoryRow {
  id: string;
  name: string;
  slug: string;
  knowledge_description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SkillCategoryCourseRow {
  id: string;
  category_id: string;
  course_id: string;
  course_name: string | null;
}

interface SkillCategoryToolRow {
  id: string;
  category_id: string;
  tool_id: string;
  tool_name: string | null;
  application_description: string | null;
  display_order: number;
}

interface UserSkillProgressRow {
  id: string;
  user_email: string;
  category_id: string;
  knowledge_completed: boolean;
  knowledge_completed_at: string | null;
  knowledge_course_id: string | null;
}

interface UserToolProjectRow {
  id: string;
  user_email: string;
  tool_id: string;
  project_count: number;
  last_project_at: string | null;
}

function rowToCategory(row: SkillCategoryRow): SkillCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    knowledgeDescription: row.knowledge_description,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToCourse(row: SkillCategoryCourseRow): SkillCategoryCourse {
  return {
    id: row.id,
    categoryId: row.category_id,
    courseId: row.course_id,
    courseName: row.course_name,
  };
}

function rowToTool(row: SkillCategoryToolRow): SkillCategoryTool {
  return {
    id: row.id,
    categoryId: row.category_id,
    toolId: row.tool_id,
    toolName: row.tool_name,
    applicationDescription: row.application_description,
    displayOrder: row.display_order,
  };
}

function rowToProgress(row: UserSkillProgressRow): UserSkillProgress {
  return {
    id: row.id,
    userEmail: row.user_email,
    categoryId: row.category_id,
    knowledgeCompleted: row.knowledge_completed,
    knowledgeCompletedAt: row.knowledge_completed_at ? new Date(row.knowledge_completed_at) : null,
    knowledgeCourseId: row.knowledge_course_id,
  };
}

function rowToProject(row: UserToolProjectRow): UserToolProject {
  return {
    id: row.id,
    userEmail: row.user_email,
    toolId: row.tool_id,
    projectCount: row.project_count,
    lastProjectAt: row.last_project_at ? new Date(row.last_project_at) : null,
  };
}

// ===========================================
// ADMIN FUNCTIONS - Categories
// ===========================================

/**
 * Get all skill categories
 */
export async function getAllSkillCategories(): Promise<SkillCategory[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_categories')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Error fetching skill categories:', error);
    return [];
  }

  return (data || []).map((row) => rowToCategory(row as SkillCategoryRow));
}

/**
 * Get active skill categories
 */
export async function getActiveSkillCategories(): Promise<SkillCategory[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching active skill categories:', error);
    return [];
  }

  return (data || []).map((row) => rowToCategory(row as SkillCategoryRow));
}

/**
 * Get skill category by ID
 */
export async function getSkillCategoryById(id: string): Promise<SkillCategory | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching skill category:', error);
    return null;
  }

  return rowToCategory(data as SkillCategoryRow);
}

/**
 * Create a new skill category
 */
export async function createSkillCategory(data: {
  name: string;
  slug: string;
  knowledgeDescription?: string;
  displayOrder?: number;
}): Promise<SkillCategory | null> {
  const supabase = createServiceClient();

  const { data: row, error } = await supabase
    .from('skill_categories')
    .insert({
      name: data.name,
      slug: data.slug,
      knowledge_description: data.knowledgeDescription || null,
      display_order: data.displayOrder || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating skill category:', error);
    return null;
  }

  return rowToCategory(row as SkillCategoryRow);
}

/**
 * Update a skill category
 */
export async function updateSkillCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    knowledgeDescription?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
): Promise<SkillCategory | null> {
  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.knowledgeDescription !== undefined) updates.knowledge_description = data.knowledgeDescription;
  if (data.displayOrder !== undefined) updates.display_order = data.displayOrder;
  if (data.isActive !== undefined) updates.is_active = data.isActive;

  const { data: row, error } = await supabase
    .from('skill_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating skill category:', error);
    return null;
  }

  return rowToCategory(row as SkillCategoryRow);
}

/**
 * Delete a skill category
 */
export async function deleteSkillCategory(id: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('skill_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting skill category:', error);
    return false;
  }

  return true;
}

// ===========================================
// ADMIN FUNCTIONS - Course Mappings
// ===========================================

/**
 * Get courses for a skill category
 */
export async function getCoursesForCategory(categoryId: string): Promise<SkillCategoryCourse[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_category_courses')
    .select('*')
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error fetching category courses:', error);
    return [];
  }

  return (data || []).map((row) => rowToCourse(row as SkillCategoryCourseRow));
}

/**
 * Add course to skill category
 */
export async function addCourseToCategory(
  categoryId: string,
  courseId: string,
  courseName?: string
): Promise<SkillCategoryCourse | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_category_courses')
    .insert({
      category_id: categoryId,
      course_id: courseId,
      course_name: courseName || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding course to category:', error);
    return null;
  }

  return rowToCourse(data as SkillCategoryCourseRow);
}

/**
 * Remove course from skill category
 */
export async function removeCourseFromCategory(categoryId: string, courseId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('skill_category_courses')
    .delete()
    .eq('category_id', categoryId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error removing course from category:', error);
    return false;
  }

  return true;
}

// ===========================================
// ADMIN FUNCTIONS - Tool Mappings
// ===========================================

/**
 * Get tools for a skill category
 */
export async function getToolsForCategory(categoryId: string): Promise<SkillCategoryTool[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_category_tools')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order');

  if (error) {
    console.error('Error fetching category tools:', error);
    return [];
  }

  return (data || []).map((row) => rowToTool(row as SkillCategoryToolRow));
}

/**
 * Add tool to skill category
 */
export async function addToolToCategory(
  categoryId: string,
  toolId: string,
  toolName?: string,
  applicationDescription?: string,
  displayOrder?: number
): Promise<SkillCategoryTool | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_category_tools')
    .insert({
      category_id: categoryId,
      tool_id: toolId,
      tool_name: toolName || null,
      application_description: applicationDescription || null,
      display_order: displayOrder || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding tool to category:', error);
    return null;
  }

  return rowToTool(data as SkillCategoryToolRow);
}

/**
 * Update tool in skill category
 */
export async function updateCategoryTool(
  categoryId: string,
  toolId: string,
  data: {
    applicationDescription?: string;
    displayOrder?: number;
  }
): Promise<SkillCategoryTool | null> {
  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (data.applicationDescription !== undefined) updates.application_description = data.applicationDescription;
  if (data.displayOrder !== undefined) updates.display_order = data.displayOrder;

  const { data: row, error } = await supabase
    .from('skill_category_tools')
    .update(updates)
    .eq('category_id', categoryId)
    .eq('tool_id', toolId)
    .select()
    .single();

  if (error) {
    console.error('Error updating category tool:', error);
    return null;
  }

  return rowToTool(row as SkillCategoryToolRow);
}

/**
 * Remove tool from skill category
 */
export async function removeToolFromCategory(categoryId: string, toolId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('skill_category_tools')
    .delete()
    .eq('category_id', categoryId)
    .eq('tool_id', toolId);

  if (error) {
    console.error('Error removing tool from category:', error);
    return false;
  }

  return true;
}

// ===========================================
// USER FUNCTIONS - Progress & Projects
// ===========================================

/**
 * Get user's skill progress for all categories
 */
export async function getUserSkillProgress(userEmail: string): Promise<UserSkillProgress[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_skill_progress')
    .select('*')
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error fetching user skill progress:', error);
    return [];
  }

  return (data || []).map((row) => rowToProgress(row as UserSkillProgressRow));
}

/**
 * Get user's tool project counts
 */
export async function getUserToolProjects(userEmail: string): Promise<UserToolProject[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_tool_projects')
    .select('*')
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error fetching user tool projects:', error);
    return [];
  }

  return (data || []).map((row) => rowToProject(row as UserToolProjectRow));
}

/**
 * Mark knowledge as completed for a user
 */
export async function markKnowledgeCompleted(
  userEmail: string,
  categoryId: string,
  courseId: string
): Promise<UserSkillProgress | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_skill_progress')
    .upsert({
      user_email: userEmail,
      category_id: categoryId,
      knowledge_completed: true,
      knowledge_completed_at: new Date().toISOString(),
      knowledge_course_id: courseId,
    }, {
      onConflict: 'user_email,category_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error marking knowledge completed:', error);
    return null;
  }

  return rowToProgress(data as UserSkillProgressRow);
}

/**
 * Increment user's project count for a tool
 */
export async function incrementToolProjectCount(
  userEmail: string,
  toolId: string
): Promise<UserToolProject | null> {
  const supabase = createServiceClient();

  // First try to get existing record
  const { data: existing } = await supabase
    .from('user_tool_projects')
    .select('*')
    .eq('user_email', userEmail)
    .eq('tool_id', toolId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('user_tool_projects')
      .update({
        project_count: (existing as UserToolProjectRow).project_count + 1,
        last_project_at: new Date().toISOString(),
      })
      .eq('id', (existing as UserToolProjectRow).id)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing project count:', error);
      return null;
    }

    return rowToProject(data as UserToolProjectRow);
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('user_tool_projects')
      .insert({
        user_email: userEmail,
        tool_id: toolId,
        project_count: 1,
        last_project_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project count:', error);
      return null;
    }

    return rowToProject(data as UserToolProjectRow);
  }
}

// ===========================================
// USER FUNCTIONS - Full Skill Matrix
// ===========================================

/**
 * Get user's complete skill matrix
 */
export async function getUserSkillMatrix(userEmail: string): Promise<UserSkillMatrixEntry[]> {
  const supabase = createServiceClient();

  // Get all active categories with their courses and tools
  const { data: categories, error: catError } = await supabase
    .from('skill_categories')
    .select(`
      *,
      skill_category_courses (*),
      skill_category_tools (*)
    `)
    .eq('is_active', true)
    .order('display_order');

  if (catError) {
    console.error('Error fetching skill matrix categories:', catError);
    return [];
  }

  // Get user's progress
  const { data: progress } = await supabase
    .from('user_skill_progress')
    .select('*')
    .eq('user_email', userEmail);

  // Get user's tool projects
  const { data: projects } = await supabase
    .from('user_tool_projects')
    .select('*')
    .eq('user_email', userEmail);

  // Build the matrix
  const progressMap = new Map<string, UserSkillProgressRow>();
  for (const p of (progress || [])) {
    progressMap.set((p as UserSkillProgressRow).category_id, p as UserSkillProgressRow);
  }

  const projectMap = new Map<string, UserToolProjectRow>();
  for (const p of (projects || [])) {
    projectMap.set((p as UserToolProjectRow).tool_id, p as UserToolProjectRow);
  }

  const matrix: UserSkillMatrixEntry[] = [];

  for (const cat of (categories || [])) {
    const categoryRow = cat as SkillCategoryRow & {
      skill_category_courses: SkillCategoryCourseRow[];
      skill_category_tools: SkillCategoryToolRow[];
    };

    const userProgress = progressMap.get(categoryRow.id);
    const tools = (categoryRow.skill_category_tools || []).map((t) => {
      const project = projectMap.get(t.tool_id);
      return {
        toolId: t.tool_id,
        toolName: t.tool_name,
        description: t.application_description,
        projectCount: project?.project_count || 0,
        lastProjectAt: project?.last_project_at ? new Date(project.last_project_at) : null,
      };
    });

    matrix.push({
      category: rowToCategory(categoryRow),
      knowledge: {
        completed: userProgress?.knowledge_completed || false,
        completedAt: userProgress?.knowledge_completed_at ? new Date(userProgress.knowledge_completed_at) : null,
        courseId: userProgress?.knowledge_course_id || null,
      },
      application: {
        tools: tools.sort((a, b) => (categoryRow.skill_category_tools || [])
          .findIndex(t => t.tool_id === a.toolId) -
          (categoryRow.skill_category_tools || [])
          .findIndex(t => t.tool_id === b.toolId)),
      },
    });
  }

  return matrix;
}

/**
 * Check if user has completed any course linked to a category
 * and update their knowledge status
 */
export async function syncUserKnowledgeFromCourses(
  userEmail: string,
  completedCourseIds: string[]
): Promise<number> {
  const supabase = createServiceClient();

  // Get all course-to-category mappings
  const { data: mappings, error } = await supabase
    .from('skill_category_courses')
    .select('*');

  if (error || !mappings) {
    console.error('Error fetching course mappings:', error);
    return 0;
  }

  let updated = 0;

  for (const mapping of mappings) {
    const m = mapping as SkillCategoryCourseRow;
    if (completedCourseIds.includes(m.course_id)) {
      const result = await markKnowledgeCompleted(userEmail, m.category_id, m.course_id);
      if (result) updated++;
    }
  }

  return updated;
}

/**
 * Get full category data (for admin)
 */
export async function getFullSkillCategory(id: string): Promise<FullSkillCategory | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_categories')
    .select(`
      *,
      skill_category_courses (*),
      skill_category_tools (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching full skill category:', error);
    return null;
  }

  const row = data as SkillCategoryRow & {
    skill_category_courses: SkillCategoryCourseRow[];
    skill_category_tools: SkillCategoryToolRow[];
  };

  return {
    ...rowToCategory(row),
    courses: (row.skill_category_courses || []).map(rowToCourse),
    tools: (row.skill_category_tools || []).map(rowToTool).sort((a, b) => a.displayOrder - b.displayOrder),
  };
}

/**
 * Get all categories with full data (for admin)
 */
export async function getAllFullSkillCategories(): Promise<FullSkillCategory[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('skill_categories')
    .select(`
      *,
      skill_category_courses (*),
      skill_category_tools (*)
    `)
    .order('display_order');

  if (error) {
    console.error('Error fetching all full skill categories:', error);
    return [];
  }

  return (data || []).map((row) => {
    const r = row as SkillCategoryRow & {
      skill_category_courses: SkillCategoryCourseRow[];
      skill_category_tools: SkillCategoryToolRow[];
    };
    return {
      ...rowToCategory(r),
      courses: (r.skill_category_courses || []).map(rowToCourse),
      tools: (r.skill_category_tools || []).map(rowToTool).sort((a, b) => a.displayOrder - b.displayOrder),
    };
  });
}
