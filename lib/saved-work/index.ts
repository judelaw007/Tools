/**
 * User Saved Work - Types and Utilities
 *
 * This module provides the foundation for persistent, database-backed
 * storage of user work across all MojiTax tools.
 *
 * Usage in tools:
 * 1. Import the useSavedWork hook
 * 2. Define your tool's data type
 * 3. Use the hook's save/load/delete functions
 *
 * @example
 * ```tsx
 * const { items, save, remove, isLoading } = useSavedWork<MyToolData>({
 *   toolId: 'my-tool-id',
 *   userEmail: 'user@example.com',
 * });
 * ```
 */

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Base interface for all saved work items
 */
export interface SavedWorkItem<T = unknown> {
  id: string;
  name: string;
  data: T;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database row structure
 */
export interface SavedWorkRow {
  id: string;
  user_email: string;
  tool_id: string;
  name: string;
  data: unknown;
  created_at: string;
  updated_at: string;
}

/**
 * Options for saved work operations
 */
export interface SavedWorkOptions {
  toolId: string;
  userEmail: string;
}

/**
 * Convert database row to SavedWorkItem
 */
export function rowToSavedWork<T>(row: SavedWorkRow): SavedWorkItem<T> {
  return {
    id: row.id,
    name: row.name,
    data: row.data as T,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Server-side: Get all saved work for a user and tool
 */
export async function getSavedWork<T>(
  options: SavedWorkOptions
): Promise<SavedWorkItem<T>[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_saved_work')
    .select('*')
    .eq('user_email', options.userEmail)
    .eq('tool_id', options.toolId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved work:', error);
    return [];
  }

  return (data || []).map((row) => rowToSavedWork<T>(row as SavedWorkRow));
}

/**
 * Server-side: Get a specific saved work item by ID
 */
export async function getSavedWorkById<T>(
  id: string,
  userEmail: string
): Promise<SavedWorkItem<T> | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_saved_work')
    .select('*')
    .eq('id', id)
    .eq('user_email', userEmail)
    .single();

  if (error || !data) {
    console.error('Error fetching saved work by ID:', error);
    return null;
  }

  return rowToSavedWork<T>(data as SavedWorkRow);
}

/**
 * Server-side: Create new saved work
 */
export async function createSavedWork<T>(
  options: SavedWorkOptions,
  name: string,
  data: T
): Promise<SavedWorkItem<T> | null> {
  const supabase = createServiceClient();

  const { data: row, error } = await supabase
    .from('user_saved_work')
    .insert({
      user_email: options.userEmail,
      tool_id: options.toolId,
      name,
      data,
    })
    .select()
    .single();

  if (error || !row) {
    console.error('Error creating saved work:', error);
    return null;
  }

  return rowToSavedWork<T>(row as SavedWorkRow);
}

/**
 * Server-side: Update saved work
 */
export async function updateSavedWork<T>(
  id: string,
  userEmail: string,
  updates: { name?: string; data?: T }
): Promise<SavedWorkItem<T> | null> {
  const supabase = createServiceClient();

  const { data: row, error } = await supabase
    .from('user_saved_work')
    .update(updates)
    .eq('id', id)
    .eq('user_email', userEmail)
    .select()
    .single();

  if (error || !row) {
    console.error('Error updating saved work:', error);
    return null;
  }

  return rowToSavedWork<T>(row as SavedWorkRow);
}

/**
 * Server-side: Delete saved work
 */
export async function deleteSavedWork(
  id: string,
  userEmail: string
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('user_saved_work')
    .delete()
    .eq('id', id)
    .eq('user_email', userEmail);

  if (error) {
    console.error('Error deleting saved work:', error);
    return false;
  }

  return true;
}

/**
 * Server-side: Count saved work items for a user
 */
export async function countSavedWork(
  options: SavedWorkOptions
): Promise<number> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('user_saved_work')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', options.userEmail)
    .eq('tool_id', options.toolId);

  if (error) {
    console.error('Error counting saved work:', error);
    return 0;
  }

  return count || 0;
}
