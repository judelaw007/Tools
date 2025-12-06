import type { Tool, Course, CourseTool } from '@/types';

// Seed data for tools
// Start with empty arrays - tools will be created via the admin interface
// or populated from Supabase in production

export const SEED_TOOLS: Tool[] = [];

export const SEED_COURSES: Course[] = [];

export const SEED_COURSE_TOOLS: Omit<CourseTool, 'id'>[] = [];
