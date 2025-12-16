'use client';

/**
 * useSkills Hook
 *
 * Client-side hook for fetching and managing user skills.
 * Provides automatic skill syncing and visibility controls.
 */

import { useState, useEffect, useCallback } from 'react';

// Types matching the server-side definitions
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
  acquiredAt: string;
  updatedAt: string;
}

export interface SkillSummary {
  totalSkills: number;
  byCategory: Record<string, number>;
  byLevel: Record<SkillLevel, number>;
  byEvidence: Record<EvidenceType, number>;
}

interface UseSkillsOptions {
  autoSync?: boolean; // Automatically sync on mount
  includeSummary?: boolean; // Include summary in response
}

interface UseSkillsReturn {
  skills: UserSkill[];
  summary: SkillSummary | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  toggleVisibility: (skillId: string, isVisible: boolean) => Promise<void>;
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

/**
 * Get color classes for skill level
 */
export function getSkillLevelColor(level: SkillLevel): string {
  switch (level) {
    case 'expert': return 'bg-green-100 text-green-800 border-green-200';
    case 'proficient': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'familiar': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-600';
  }
}

/**
 * Get icon color for evidence type
 */
export function getEvidenceTypeColor(type: EvidenceType): string {
  switch (type) {
    case 'course_completed': return 'text-purple-600';
    case 'tool_used': return 'text-blue-600';
    case 'work_saved': return 'text-green-600';
    default: return 'text-slate-600';
  }
}

export function useSkills(options: UseSkillsOptions = {}): UseSkillsReturn {
  const { autoSync = false, includeSummary = true } = options;

  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [summary, setSummary] = useState<SkillSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch skills from API
   */
  const fetchSkills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (includeSummary) {
        params.set('includeSummary', 'true');
      }

      const response = await fetch(`/api/user/skills?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          setSkills([]);
          setSummary(null);
          return;
        }
        throw new Error('Failed to fetch skills');
      }

      const data = await response.json();
      setSkills(data.skills || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch skills');
    } finally {
      setIsLoading(false);
    }
  }, [includeSummary]);

  /**
   * Sync skills from activity data
   */
  const syncSkills = useCallback(async () => {
    try {
      setIsSyncing(true);
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/skills', {
        method: 'POST',
      });

      if (!response.ok) {
        // If table doesn't exist yet, show empty state instead of error
        if (response.status === 500) {
          setSkills([]);
          setSummary(null);
          return;
        }
        throw new Error('Failed to sync skills');
      }

      const data = await response.json();
      setSkills(data.skills || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error syncing skills:', err);
      // Show empty state on error rather than blocking UI
      setSkills([]);
      setSummary(null);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  /**
   * Toggle skill visibility
   */
  const toggleVisibility = useCallback(async (skillId: string, isVisible: boolean) => {
    try {
      setError(null);

      const response = await fetch(`/api/user/skills/${skillId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVisible }),
      });

      if (!response.ok) {
        throw new Error('Failed to update skill visibility');
      }

      // Update local state
      setSkills((prev) =>
        prev.map((skill) =>
          skill.id === skillId ? { ...skill, isVisible } : skill
        )
      );
    } catch (err) {
      console.error('Error updating skill visibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to update visibility');
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (autoSync) {
      syncSkills();
    } else {
      fetchSkills();
    }
  }, [autoSync, fetchSkills, syncSkills]);

  return {
    skills,
    summary,
    isLoading,
    isSyncing,
    error,
    refresh: fetchSkills,
    sync: syncSkills,
    toggleVisibility,
  };
}
