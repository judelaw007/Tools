/**
 * useSavedWork Hook
 *
 * A reusable React hook for managing user saved work in MojiTax tools.
 * Provides CRUD operations with automatic loading states and error handling.
 *
 * Features:
 * - Fetches saved work from database on mount
 * - Falls back to localStorage if API fails (offline support)
 * - Provides save, update, and delete operations
 * - Handles loading and error states
 * - Type-safe with generics
 *
 * @example
 * ```tsx
 * interface MyCalculation {
 *   inputs: { ... };
 *   results: { ... };
 * }
 *
 * const { items, save, remove, isLoading, error } = useSavedWork<MyCalculation>({
 *   toolId: 'my-calculator',
 *   userEmail: 'user@example.com',
 * });
 *
 * // Save new calculation
 * const id = await save('Q4 2024 Analysis', calculationData);
 *
 * // Delete a saved item
 * await remove(id);
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Saved work item structure
 */
export interface SavedWorkItem<T = unknown> {
  id: string;
  name: string;
  data: T;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook options
 */
export interface UseSavedWorkOptions {
  /** The tool ID (e.g., 'gir-globe-calculator') */
  toolId: string;
  /** User's email address for associating saved work */
  userEmail?: string;
  /** Whether to use localStorage as fallback (default: true) */
  useLocalFallback?: boolean;
}

/**
 * Hook return type
 */
export interface UseSavedWorkReturn<T> {
  /** List of saved work items */
  items: SavedWorkItem<T>[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Save new work */
  save: (name: string, data: T) => Promise<string | null>;
  /** Update existing work */
  update: (id: string, updates: { name?: string; data?: T }) => Promise<boolean>;
  /** Delete saved work */
  remove: (id: string) => Promise<boolean>;
  /** Refresh the list */
  refresh: () => Promise<void>;
}

/**
 * API response types
 */
interface ApiResponse<T> {
  success: boolean;
  items?: SavedWorkItem<T>[];
  item?: SavedWorkItem<T>;
  error?: string;
}

/**
 * LocalStorage key generator
 */
function getLocalStorageKey(toolId: string): string {
  return `tool-${toolId}-saves`;
}

/**
 * Parse dates in saved work items
 */
function parseItemDates<T>(item: SavedWorkItem<T>): SavedWorkItem<T> {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

/**
 * useSavedWork Hook
 *
 * Manages user saved work with database persistence and localStorage fallback.
 */
export function useSavedWork<T = unknown>(
  options: UseSavedWorkOptions
): UseSavedWorkReturn<T> {
  const { toolId, userEmail, useLocalFallback = true } = options;

  const [items, setItems] = useState<SavedWorkItem<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load items from localStorage (fallback)
   */
  const loadFromLocalStorage = useCallback((): SavedWorkItem<T>[] => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(getLocalStorageKey(toolId));
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(parseItemDates);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    return [];
  }, [toolId]);

  /**
   * Save items to localStorage (fallback)
   */
  const saveToLocalStorage = useCallback(
    (newItems: SavedWorkItem<T>[]) => {
      if (typeof window === 'undefined') return;

      try {
        localStorage.setItem(
          getLocalStorageKey(toolId),
          JSON.stringify(newItems)
        );
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    },
    [toolId]
  );

  /**
   * Fetch saved work from API
   */
  const fetchItems = useCallback(async () => {
    if (!userEmail) {
      // No user email - use localStorage only
      if (useLocalFallback) {
        setItems(loadFromLocalStorage());
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/user/saved-work?toolId=${encodeURIComponent(toolId)}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();

      if (data.success && data.items) {
        const parsedItems = data.items.map(parseItemDates);
        setItems(parsedItems);

        // Sync to localStorage as backup
        if (useLocalFallback) {
          saveToLocalStorage(parsedItems);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch saved work');
      }
    } catch (e) {
      console.error('Error fetching saved work:', e);
      setError(e instanceof Error ? e.message : 'Failed to load saved work');

      // Fall back to localStorage
      if (useLocalFallback) {
        const localItems = loadFromLocalStorage();
        if (localItems.length > 0) {
          setItems(localItems);
          setError(null); // Clear error if we have local data
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [toolId, userEmail, useLocalFallback, loadFromLocalStorage, saveToLocalStorage]);

  /**
   * Save new work
   */
  const save = useCallback(
    async (name: string, data: T): Promise<string | null> => {
      // Generate local ID for fallback
      const localId = `local-${Date.now()}`;
      const now = new Date();
      const newItem: SavedWorkItem<T> = {
        id: localId,
        name,
        data,
        createdAt: now,
        updatedAt: now,
      };

      if (!userEmail) {
        // No user - save to localStorage only
        const updatedItems = [newItem, ...items];
        setItems(updatedItems);
        if (useLocalFallback) {
          saveToLocalStorage(updatedItems);
        }
        return localId;
      }

      try {
        const response = await fetch('/api/user/saved-work', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, name, data }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();

        if (result.success && result.item) {
          const savedItem = parseItemDates(result.item);
          const updatedItems = [savedItem, ...items];
          setItems(updatedItems);

          if (useLocalFallback) {
            saveToLocalStorage(updatedItems);
          }

          return savedItem.id;
        } else {
          throw new Error(result.error || 'Failed to save');
        }
      } catch (e) {
        console.error('Error saving work:', e);

        // Fall back to localStorage
        if (useLocalFallback) {
          const updatedItems = [newItem, ...items];
          setItems(updatedItems);
          saveToLocalStorage(updatedItems);
          return localId;
        }

        return null;
      }
    },
    [toolId, userEmail, items, useLocalFallback, saveToLocalStorage]
  );

  /**
   * Update existing work
   */
  const update = useCallback(
    async (id: string, updates: { name?: string; data?: T }): Promise<boolean> => {
      // Find existing item
      const existingIndex = items.findIndex((item) => item.id === id);
      if (existingIndex === -1) return false;

      const existingItem = items[existingIndex];
      const updatedItem: SavedWorkItem<T> = {
        ...existingItem,
        ...updates,
        updatedAt: new Date(),
      };

      // Optimistic update
      const updatedItems = [...items];
      updatedItems[existingIndex] = updatedItem;
      setItems(updatedItems);

      if (!userEmail || id.startsWith('local-')) {
        // Local-only item
        if (useLocalFallback) {
          saveToLocalStorage(updatedItems);
        }
        return true;
      }

      try {
        const response = await fetch(`/api/user/saved-work/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result: ApiResponse<T> = await response.json();

        if (result.success && result.item) {
          const serverItem = parseItemDates(result.item);
          updatedItems[existingIndex] = serverItem;
          setItems(updatedItems);

          if (useLocalFallback) {
            saveToLocalStorage(updatedItems);
          }

          return true;
        }

        throw new Error(result.error || 'Failed to update');
      } catch (e) {
        console.error('Error updating work:', e);
        // Keep optimistic update but sync localStorage
        if (useLocalFallback) {
          saveToLocalStorage(updatedItems);
        }
        return true; // Return true since we have local update
      }
    },
    [items, userEmail, useLocalFallback, saveToLocalStorage]
  );

  /**
   * Delete saved work
   */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistic delete
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);

      if (useLocalFallback) {
        saveToLocalStorage(updatedItems);
      }

      if (!userEmail || id.startsWith('local-')) {
        // Local-only item - already deleted from state
        return true;
      }

      try {
        const response = await fetch(`/api/user/saved-work/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok && response.status !== 404) {
          throw new Error(`API error: ${response.status}`);
        }

        return true;
      } catch (e) {
        console.error('Error deleting work:', e);
        // Keep local delete
        return true;
      }
    },
    [items, userEmail, useLocalFallback, saveToLocalStorage]
  );

  /**
   * Refresh the list
   */
  const refresh = useCallback(async () => {
    await fetchItems();
  }, [fetchItems]);

  // Load items on mount and when dependencies change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    isLoading,
    error,
    save,
    update,
    remove,
    refresh,
  };
}

export default useSavedWork;
