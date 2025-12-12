/**
 * Supabase Database Types
 *
 * These types match the schema defined in supabase/schema.sql
 */

export type ToolStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type ToolType = 'calculator' | 'search' | 'validator' | 'generator' | 'tracker' | 'reference' | 'external-link' | 'spreadsheet' | 'form';
export type ToolCategory = 'transfer_pricing' | 'vat' | 'fatca_crs' | 'withholding_tax' | 'pillar_two' | 'pe_assessment' | 'cross_category';
export type AccessLevel = 'full' | 'limited' | 'preview';
export type AdminRole = 'admin' | 'super_admin';
export type UsageAction = 'view' | 'calculate' | 'save' | 'export' | 'error';

// Database row types (as stored in Supabase)
export interface DbTool {
  id: string;
  name: string;
  slug: string;
  tool_type: ToolType;
  category: ToolCategory;
  icon: string | null;
  short_description: string | null;
  description: string | null;
  preview_image: string | null;
  config: Record<string, unknown>;
  status: ToolStatus;
  is_public: boolean;
  is_premium: boolean;
  version: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCourseToolAllocation {
  id: string;
  course_id: string;
  course_name: string | null;
  tool_id: string;
  access_level: AccessLevel;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbToolUsageLog {
  id: string;
  tool_id: string;
  user_email: string | null;
  learnworlds_user_id: string | null;
  action: UsageAction;
  metadata: Record<string, unknown> | null;
  session_id: string | null;
  created_at: string;
}

// Insert types (for creating new rows)
export type DbToolInsert = Omit<DbTool, 'id' | 'created_at' | 'updated_at'>;
export type DbToolUpdate = Partial<Omit<DbTool, 'id' | 'created_at' | 'updated_at'>>;

export type DbCourseToolAllocationInsert = Omit<DbCourseToolAllocation, 'id' | 'created_at' | 'updated_at'>;
export type DbCourseToolAllocationUpdate = Partial<Omit<DbCourseToolAllocation, 'id' | 'created_at' | 'updated_at'>>;

export type DbAdminUserInsert = Omit<DbAdminUser, 'created_at' | 'updated_at'>;
export type DbAdminUserUpdate = Partial<Omit<DbAdminUser, 'id' | 'created_at' | 'updated_at'>>;

export type DbToolUsageLogInsert = Omit<DbToolUsageLog, 'id' | 'created_at'>;

// Supabase Database type definition
export interface Database {
  public: {
    Tables: {
      tools: {
        Row: DbTool;
        Insert: DbToolInsert;
        Update: DbToolUpdate;
      };
      course_tool_allocations: {
        Row: DbCourseToolAllocation;
        Insert: DbCourseToolAllocationInsert;
        Update: DbCourseToolAllocationUpdate;
      };
      admin_users: {
        Row: DbAdminUser;
        Insert: DbAdminUserInsert;
        Update: DbAdminUserUpdate;
      };
      tool_usage_logs: {
        Row: DbToolUsageLog;
        Insert: DbToolUsageLogInsert;
        Update: never;
      };
    };
    Functions: {
      get_tools_for_course: {
        Args: { p_course_id: string };
        Returns: { tool_id: string }[];
      };
      get_courses_for_tool: {
        Args: { p_tool_id: string };
        Returns: { course_id: string }[];
      };
      is_admin: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };
  };
}

// Helper to convert DB row to app type
export function dbToolToAppTool(dbTool: DbTool): import('@/types').Tool {
  return {
    id: dbTool.id,
    name: dbTool.name,
    slug: dbTool.slug,
    toolType: dbTool.tool_type,
    category: dbTool.category,
    icon: dbTool.icon || undefined,
    shortDescription: dbTool.short_description || undefined,
    description: dbTool.description || undefined,
    previewImage: dbTool.preview_image || undefined,
    config: dbTool.config as import('@/types').ToolConfig,
    status: dbTool.status,
    isPublic: dbTool.is_public,
    isPremium: dbTool.is_premium,
    version: dbTool.version,
    createdBy: dbTool.created_by || undefined,
    createdAt: new Date(dbTool.created_at),
    updatedAt: new Date(dbTool.updated_at),
  };
}

// Helper to convert app type to DB update
export function appToolToDbUpdate(
  updates: Partial<Pick<import('@/types').Tool, 'name' | 'shortDescription' | 'description' | 'category' | 'status'>>
): DbToolUpdate {
  const dbUpdate: DbToolUpdate = {};

  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.shortDescription !== undefined) dbUpdate.short_description = updates.shortDescription;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.category !== undefined) dbUpdate.category = updates.category;
  if (updates.status !== undefined) dbUpdate.status = updates.status;

  return dbUpdate;
}
