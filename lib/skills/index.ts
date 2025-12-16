/**
 * Skills Matrix - Types and Utilities
 *
 * This module provides automatic skill detection and management
 * based on user activity: course completions, tool usage, and saved work.
 *
 * Skills are awarded automatically - no admin configuration needed.
 */

import { createServiceClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export type SkillLevel = 'familiar' | 'proficient' | 'expert';
export type EvidenceType = 'course_completed' | 'tool_used' | 'work_saved';
export type SkillCategory =
  | 'pillar_two'
  | 'transfer_pricing'
  | 'vat'
  | 'fatca_crs'
  | 'withholding_tax'
  | 'pe_assessment'
  | 'cross_category';

export interface UserSkill {
  id: string;
  skillName: string;
  skillCategory: SkillCategory;
  skillLevel: SkillLevel;
  evidenceType: EvidenceType;
  evidenceSourceId: string;
  evidenceSourceName: string | null;
  evidenceCount: number;
  isVisible: boolean;
  acquiredAt: Date;
  updatedAt: Date;
}

export interface SkillSummary {
  totalSkills: number;
  byCategory: Record<string, number>;
  byLevel: Record<SkillLevel, number>;
  byEvidence: Record<EvidenceType, number>;
}

interface SkillRow {
  id: string;
  user_email: string;
  skill_name: string;
  skill_category: string;
  skill_level: string;
  evidence_type: string;
  evidence_source_id: string;
  evidence_source_name: string | null;
  evidence_count: number;
  is_visible: boolean;
  acquired_at: string;
  updated_at: string;
}

// ===========================================
// SKILL LEVEL HELPERS
// ===========================================

/**
 * Determine skill level based on usage count
 */
export function getSkillLevelFromCount(count: number): SkillLevel {
  if (count >= 15) return 'expert';
  if (count >= 5) return 'proficient';
  return 'familiar';
}

/**
 * Get numeric value for skill level (for sorting/comparison)
 */
export function getSkillLevelValue(level: SkillLevel): number {
  switch (level) {
    case 'expert': return 3;
    case 'proficient': return 2;
    case 'familiar': return 1;
    default: return 0;
  }
}

/**
 * Get display label for skill level
 */
export function getSkillLevelLabel(level: SkillLevel): string {
  switch (level) {
    case 'expert': return 'Expert';
    case 'proficient': return 'Proficient';
    case 'familiar': return 'Familiar';
    default: return 'Unknown';
  }
}

/**
 * Get display label for evidence type
 */
export function getEvidenceTypeLabel(type: EvidenceType): string {
  switch (type) {
    case 'course_completed': return 'Completed Course';
    case 'tool_used': return 'Used Tool';
    case 'work_saved': return 'Saved Work';
    default: return 'Unknown';
  }
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: SkillCategory): string {
  switch (category) {
    case 'pillar_two': return 'Pillar Two / GloBE';
    case 'transfer_pricing': return 'Transfer Pricing';
    case 'vat': return 'VAT';
    case 'fatca_crs': return 'FATCA/CRS';
    case 'withholding_tax': return 'Withholding Tax';
    case 'pe_assessment': return 'PE Assessment';
    case 'cross_category': return 'Cross-Category';
    default: return category;
  }
}

// ===========================================
// SKILL NAME EXTRACTION
// ===========================================

/**
 * Extract skill name from course title for course completion
 * Format: "[Course Name] - Course Certified"
 */
export function extractSkillFromCourse(courseTitle: string): string {
  // Clean up common suffixes from course title
  const cleanTitle = courseTitle
    .replace(/\s*(masterclass|course|training|certification|fundamentals|advanced|basics|module|program)/gi, '')
    .trim();

  return `${cleanTitle} - Course Certified`;
}

/**
 * Extract skill name from tool for tool usage
 * Format: "[Tool Name] - Tool Proficiency"
 */
export function extractSkillFromTool(toolName: string): string {
  // Clean up common suffixes from tool name
  const cleanName = toolName
    .replace(/\s*(calculator|tool|checker|validator|generator|assessment|form)/gi, '')
    .trim();

  return `${cleanName} - Tool Proficiency`;
}

/**
 * Extract skill name from tool for saved work
 * Format: "[Tool Name] - Applied Practice"
 */
export function extractSkillFromSavedWork(toolName: string): string {
  const cleanName = toolName
    .replace(/\s*(calculator|tool|checker|validator|generator|assessment|form)/gi, '')
    .trim();

  return `${cleanName} - Applied Practice`;
}

/**
 * Map tool category to skill category
 */
export function mapToolCategoryToSkillCategory(toolCategory: string): SkillCategory {
  const mapping: Record<string, SkillCategory> = {
    'transfer_pricing': 'transfer_pricing',
    'vat': 'vat',
    'fatca_crs': 'fatca_crs',
    'withholding_tax': 'withholding_tax',
    'pillar_two': 'pillar_two',
    'pe_assessment': 'pe_assessment',
    'cross_category': 'cross_category',
  };
  return mapping[toolCategory] || 'cross_category';
}

// ===========================================
// DATABASE OPERATIONS
// ===========================================

/**
 * Convert database row to UserSkill
 */
function rowToSkill(row: SkillRow): UserSkill {
  return {
    id: row.id,
    skillName: row.skill_name,
    skillCategory: row.skill_category as SkillCategory,
    skillLevel: row.skill_level as SkillLevel,
    evidenceType: row.evidence_type as EvidenceType,
    evidenceSourceId: row.evidence_source_id,
    evidenceSourceName: row.evidence_source_name,
    evidenceCount: row.evidence_count,
    isVisible: row.is_visible,
    acquiredAt: new Date(row.acquired_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Get all skills for a user
 */
export async function getUserSkills(userEmail: string): Promise<UserSkill[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_email', userEmail)
    .order('skill_level', { ascending: false })
    .order('acquired_at', { ascending: false });

  if (error) {
    console.error('Error fetching user skills:', error);
    return [];
  }

  return (data || []).map((row) => rowToSkill(row as SkillRow));
}

/**
 * Get visible skills for a user (for public display)
 */
export async function getVisibleUserSkills(userEmail: string): Promise<UserSkill[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_email', userEmail)
    .eq('is_visible', true)
    .order('skill_level', { ascending: false })
    .order('acquired_at', { ascending: false });

  if (error) {
    console.error('Error fetching visible skills:', error);
    return [];
  }

  return (data || []).map((row) => rowToSkill(row as SkillRow));
}

/**
 * Get skill summary for a user
 */
export async function getSkillSummary(userEmail: string): Promise<SkillSummary> {
  const skills = await getUserSkills(userEmail);

  const summary: SkillSummary = {
    totalSkills: skills.length,
    byCategory: {},
    byLevel: { familiar: 0, proficient: 0, expert: 0 },
    byEvidence: { course_completed: 0, tool_used: 0, work_saved: 0 },
  };

  for (const skill of skills) {
    // Count by category
    summary.byCategory[skill.skillCategory] =
      (summary.byCategory[skill.skillCategory] || 0) + 1;

    // Count by level
    summary.byLevel[skill.skillLevel]++;

    // Count by evidence type
    summary.byEvidence[skill.evidenceType]++;
  }

  return summary;
}

/**
 * Add or update a skill for a user
 */
export async function upsertSkill(
  userEmail: string,
  skillData: {
    skillName: string;
    skillCategory: SkillCategory;
    skillLevel: SkillLevel;
    evidenceType: EvidenceType;
    evidenceSourceId: string;
    evidenceSourceName?: string;
    evidenceCount?: number;
  }
): Promise<UserSkill | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_skills')
    .upsert({
      user_email: userEmail,
      skill_name: skillData.skillName,
      skill_category: skillData.skillCategory,
      skill_level: skillData.skillLevel,
      evidence_type: skillData.evidenceType,
      evidence_source_id: skillData.evidenceSourceId,
      evidence_source_name: skillData.evidenceSourceName || null,
      evidence_count: skillData.evidenceCount || 1,
    }, {
      onConflict: 'user_email,skill_name,evidence_type,evidence_source_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting skill:', error);
    return null;
  }

  return rowToSkill(data as SkillRow);
}

/**
 * Update skill visibility
 */
export async function updateSkillVisibility(
  skillId: string,
  userEmail: string,
  isVisible: boolean
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('user_skills')
    .update({ is_visible: isVisible })
    .eq('id', skillId)
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error updating skill visibility:', error);
    return false;
  }

  return true;
}

/**
 * Increment tool usage evidence count and update level
 */
export async function incrementToolUsage(
  userEmail: string,
  toolId: string,
  toolName: string,
  toolCategory: string
): Promise<UserSkill | null> {
  const supabase = createServiceClient();
  const skillCategory = mapToolCategoryToSkillCategory(toolCategory);
  const skillName = extractSkillFromTool(toolName);

  // First, try to get existing skill
  const { data: existing } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_email', userEmail)
    .eq('skill_name', skillName)
    .eq('evidence_type', 'tool_used')
    .eq('evidence_source_id', toolId)
    .single();

  if (existing) {
    // Increment count and potentially update level
    const newCount = (existing as SkillRow).evidence_count + 1;
    const newLevel = getSkillLevelFromCount(newCount);

    const { data, error } = await supabase
      .from('user_skills')
      .update({
        evidence_count: newCount,
        skill_level: newLevel,
      })
      .eq('id', (existing as SkillRow).id)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing tool usage:', error);
      return null;
    }

    return rowToSkill(data as SkillRow);
  } else {
    // Create new skill entry
    return upsertSkill(userEmail, {
      skillName,
      skillCategory,
      skillLevel: 'familiar',
      evidenceType: 'tool_used',
      evidenceSourceId: toolId,
      evidenceSourceName: toolName,
      evidenceCount: 1,
    });
  }
}

/**
 * Award skill for course completion
 */
export async function awardCourseSkill(
  userEmail: string,
  courseId: string,
  courseName: string,
  courseCategory?: string
): Promise<UserSkill | null> {
  const skillCategory = courseCategory
    ? mapToolCategoryToSkillCategory(courseCategory)
    : 'cross_category';
  const skillName = extractSkillFromCourse(courseName);

  return upsertSkill(userEmail, {
    skillName,
    skillCategory,
    skillLevel: 'proficient', // Course completion = proficient
    evidenceType: 'course_completed',
    evidenceSourceId: courseId,
    evidenceSourceName: courseName,
    evidenceCount: 1,
  });
}

/**
 * Award skill for saving work
 */
export async function awardSavedWorkSkill(
  userEmail: string,
  toolId: string,
  toolName: string,
  toolCategory: string
): Promise<UserSkill | null> {
  const skillCategory = mapToolCategoryToSkillCategory(toolCategory);
  const skillName = extractSkillFromSavedWork(toolName);

  // First check if already has this skill
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_email', userEmail)
    .eq('skill_name', skillName)
    .eq('evidence_type', 'work_saved')
    .eq('evidence_source_id', toolId)
    .single();

  if (existing) {
    // Increment evidence count
    const newCount = (existing as SkillRow).evidence_count + 1;
    const newLevel = newCount >= 5 ? 'proficient' : 'familiar';

    const { data, error } = await supabase
      .from('user_skills')
      .update({
        evidence_count: newCount,
        skill_level: newLevel,
      })
      .eq('id', (existing as SkillRow).id)
      .select()
      .single();

    if (error) return null;
    return rowToSkill(data as SkillRow);
  }

  return upsertSkill(userEmail, {
    skillName,
    skillCategory,
    skillLevel: 'familiar',
    evidenceType: 'work_saved',
    evidenceSourceId: toolId,
    evidenceSourceName: toolName,
    evidenceCount: 1,
  });
}

// ===========================================
// SKILL SYNC / REFRESH
// ===========================================

/**
 * Sync skills from tool usage logs
 * Call this to reconcile skills with actual usage data
 */
export async function syncToolUsageSkills(userEmail: string): Promise<number> {
  const supabase = createServiceClient();

  // Get aggregated tool usage from logs
  const { data: usageLogs, error } = await supabase
    .from('tool_usage_logs')
    .select(`
      tool_id,
      tools (
        id,
        name,
        category
      )
    `)
    .eq('user_email', userEmail)
    .in('action', ['view', 'calculate']);

  if (error || !usageLogs) {
    console.error('Error fetching usage logs:', error);
    return 0;
  }

  // Aggregate by tool
  const toolUsage: Record<string, { count: number; name: string; category: string }> = {};
  for (const log of usageLogs) {
    const tool = log.tools as unknown as { id: string; name: string; category: string } | null;
    if (tool) {
      if (!toolUsage[tool.id]) {
        toolUsage[tool.id] = { count: 0, name: tool.name, category: tool.category };
      }
      toolUsage[tool.id].count++;
    }
  }

  // Update skills for each tool
  let skillsUpdated = 0;
  for (const [toolId, usage] of Object.entries(toolUsage)) {
    const skillCategory = mapToolCategoryToSkillCategory(usage.category);
    const skillName = extractSkillFromTool(usage.name);
    const skillLevel = getSkillLevelFromCount(usage.count);

    const result = await upsertSkill(userEmail, {
      skillName,
      skillCategory,
      skillLevel,
      evidenceType: 'tool_used',
      evidenceSourceId: toolId,
      evidenceSourceName: usage.name,
      evidenceCount: usage.count,
    });

    if (result) skillsUpdated++;
  }

  return skillsUpdated;
}

/**
 * Sync skills from saved work
 */
export async function syncSavedWorkSkills(userEmail: string): Promise<number> {
  const supabase = createServiceClient();

  // Get saved work counts by tool
  const { data: savedWork, error } = await supabase
    .from('user_saved_work')
    .select(`
      tool_id,
      tools (
        id,
        name,
        category
      )
    `)
    .eq('user_email', userEmail);

  if (error || !savedWork) {
    console.error('Error fetching saved work:', error);
    return 0;
  }

  // Aggregate by tool
  const workByTool: Record<string, { count: number; name: string; category: string }> = {};
  for (const work of savedWork) {
    const tool = work.tools as unknown as { id: string; name: string; category: string } | null;
    if (tool) {
      if (!workByTool[tool.id]) {
        workByTool[tool.id] = { count: 0, name: tool.name, category: tool.category };
      }
      workByTool[tool.id].count++;
    }
  }

  // Update skills for each tool
  let skillsUpdated = 0;
  for (const [toolId, work] of Object.entries(workByTool)) {
    const skillCategory = mapToolCategoryToSkillCategory(work.category);
    const skillName = extractSkillFromSavedWork(work.name);
    const skillLevel = work.count >= 5 ? 'proficient' : 'familiar';

    const result = await upsertSkill(userEmail, {
      skillName,
      skillCategory,
      skillLevel,
      evidenceType: 'work_saved',
      evidenceSourceId: toolId,
      evidenceSourceName: work.name,
      evidenceCount: work.count,
    });

    if (result) skillsUpdated++;
  }

  return skillsUpdated;
}
