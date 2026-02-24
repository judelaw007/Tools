/**
 * Dynamic Tool Categories
 *
 * Fetches categories from the `tool_categories` Supabase table.
 * Falls back to the hardcoded CATEGORY_METADATA in registry.ts
 * when Supabase is not configured or the table doesn't exist yet.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { CATEGORY_METADATA } from '@/lib/tools/registry';

export interface ToolCategoryRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  description: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryMeta {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  displayOrder: number;
}

// ── Read ────────────────────────────────────────────────

/**
 * Fetch all active categories from the database, ordered by display_order.
 * Falls back to hardcoded CATEGORY_METADATA if the table is unavailable.
 */
export async function getCategories(): Promise<CategoryMeta[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tool_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(rowToMeta);
    }
  } catch (e) {
    console.error('[getCategories] DB fetch failed, using fallback:', e);
  }

  // Fallback to hardcoded
  return Object.entries(CATEGORY_METADATA).map(([slug, meta], i) => ({
    slug,
    name: meta.name,
    shortName: meta.shortName,
    description: meta.description,
    color: meta.color,
    displayOrder: i,
  }));
}

/**
 * Fetch ALL categories (including inactive) for admin management.
 */
export async function getAllCategories(): Promise<(CategoryMeta & { isActive: boolean })[]> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tool_categories')
      .select('*')
      .order('display_order');

    if (error) throw error;

    if (data && data.length > 0) {
      return data.map(row => ({ ...rowToMeta(row), isActive: row.is_active }));
    }
  } catch (e) {
    console.error('[getAllCategories] DB fetch failed, using fallback:', e);
  }

  return Object.entries(CATEGORY_METADATA).map(([slug, meta], i) => ({
    slug,
    name: meta.name,
    shortName: meta.shortName,
    description: meta.description,
    color: meta.color,
    displayOrder: i,
    isActive: true,
  }));
}

/**
 * Build a slug→CategoryMeta lookup map (for use in components).
 */
export async function getCategoryMap(): Promise<Record<string, CategoryMeta>> {
  const categories = await getCategories();
  const map: Record<string, CategoryMeta> = {};
  for (const cat of categories) {
    map[cat.slug] = cat;
  }
  return map;
}

// ── Write ───────────────────────────────────────────────

export async function createCategory(input: {
  slug: string;
  name: string;
  shortName: string;
  description?: string;
  color?: string;
  displayOrder?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('tool_categories').insert({
      slug: input.slug,
      name: input.name,
      short_name: input.shortName,
      description: input.description || null,
      color: input.color || 'slate',
      display_order: input.displayOrder ?? 0,
    });

    if (error) {
      if (error.code === '23505') return { success: false, error: 'A category with that slug already exists' };
      throw error;
    }
    return { success: true };
  } catch (e) {
    console.error('[createCategory]', e);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function updateCategory(
  slug: string,
  updates: Partial<{
    name: string;
    shortName: string;
    description: string;
    color: string;
    displayOrder: number;
    isActive: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.shortName !== undefined) dbUpdates.short_name = updates.shortName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('tool_categories')
      .update(dbUpdates)
      .eq('slug', slug);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('[updateCategory]', e);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function deleteCategory(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    // Check if any tools use this category
    const { data: tools } = await supabase
      .from('tools')
      .select('id')
      .eq('category', slug)
      .limit(1);

    if (tools && tools.length > 0) {
      return { success: false, error: 'Cannot delete a category that has tools assigned to it. Reassign the tools first.' };
    }

    const { error } = await supabase
      .from('tool_categories')
      .delete()
      .eq('slug', slug);

    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('[deleteCategory]', e);
    return { success: false, error: 'Failed to delete category' };
  }
}

// ── Helpers ─────────────────────────────────────────────

function rowToMeta(row: ToolCategoryRow): CategoryMeta {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    description: row.description || '',
    color: row.color,
    displayOrder: row.display_order,
  };
}
