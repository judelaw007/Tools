'use client';

/**
 * Skills Matrix V2 Component
 *
 * Displays user skills based on admin-defined categories.
 * Shows Knowledge (from course completion) and Application (from tool usage).
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  BookOpen,
  Wrench,
  RefreshCw,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface SkillMatrixEntry {
  category: {
    id: string;
    name: string;
    slug: string;
    knowledgeDescription: string | null;
    displayOrder: number;
    isActive: boolean;
  };
  knowledge: {
    completed: boolean;
    completedAt: string | null;
    courseId: string | null;
  };
  application: {
    tools: Array<{
      toolId: string;
      toolName: string | null;
      description: string | null;
      projectCount: number;
      lastProjectAt: string | null;
    }>;
  };
}

interface SkillsMatrixV2Props {
  className?: string;
}

export function SkillsMatrixV2({ className = '' }: SkillsMatrixV2Props) {
  const [matrix, setMatrix] = useState<SkillMatrixEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchMatrix = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/skill-matrix');

      if (!response.ok) {
        if (response.status === 401) {
          setMatrix([]);
          return;
        }
        throw new Error('Failed to fetch skill matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix || []);

      // Expand all categories by default
      const allIds = new Set<string>((data.matrix || []).map((e: SkillMatrixEntry) => e.category.id));
      setExpandedCategories(allIds);
    } catch (err) {
      console.error('Error fetching skill matrix:', err);
      setMatrix([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncMatrix = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await fetch('/api/user/skill-matrix', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync skill matrix');
      }

      const data = await response.json();
      setMatrix(data.matrix || []);
    } catch (err) {
      console.error('Error syncing skill matrix:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncMatrix(); // Sync on mount to update from course completions
  }, [syncMatrix]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Check if category has any progress
  const hasProgress = (entry: SkillMatrixEntry) => {
    return entry.knowledge.completed || entry.application.tools.some(t => t.projectCount > 0);
  };

  // Get tools with projects
  const getToolsWithProjects = (entry: SkillMatrixEntry) => {
    return entry.application.tools.filter(t => t.projectCount > 0);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading your skills...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchMatrix}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (matrix.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-mojitax-green" />
            Skills Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-mojitax-navy mb-2">
              Skills Coming Soon
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Skill categories haven&apos;t been configured yet. Once set up by your administrator,
              your skills will appear here as you complete courses and use tools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-mojitax-green" />
            Skills Matrix
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Track your professional skills as you learn
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={syncMatrix}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {matrix.map((entry) => {
          const isExpanded = expandedCategories.has(entry.category.id);
          const toolsWithProjects = getToolsWithProjects(entry);
          const hasAnyProgress = hasProgress(entry);

          return (
            <div
              key={entry.category.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                hasAnyProgress ? 'border-mojitax-green/30 bg-mojitax-green/5' : 'border-slate-200'
              }`}
            >
              {/* Category Header */}
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                onClick={() => toggleCategory(entry.category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    hasAnyProgress ? 'bg-mojitax-green/20' : 'bg-slate-100'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${
                      hasAnyProgress ? 'text-mojitax-green' : 'text-slate-400'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-mojitax-navy">
                      {entry.category.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        {entry.knowledge.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-300" />
                        )}
                        Knowledge
                      </span>
                      <span className="flex items-center gap-1">
                        {toolsWithProjects.length > 0 ? (
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-300" />
                        )}
                        Application ({toolsWithProjects.length}/{entry.application.tools.length})
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Knowledge Section */}
                  <div className={`p-4 rounded-lg ${
                    entry.knowledge.completed ? 'bg-purple-50' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className={`w-4 h-4 ${
                        entry.knowledge.completed ? 'text-purple-600' : 'text-slate-400'
                      }`} />
                      <h4 className={`text-sm font-semibold ${
                        entry.knowledge.completed ? 'text-purple-800' : 'text-slate-600'
                      }`}>
                        Knowledge
                      </h4>
                      {entry.knowledge.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                    {entry.knowledge.completed ? (
                      <p className="text-sm text-purple-700">
                        {entry.category.knowledgeDescription || 'Course completed successfully.'}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">
                        Complete a linked course to earn this knowledge credential.
                      </p>
                    )}
                  </div>

                  {/* Application Section */}
                  {entry.application.tools.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-slate-700">
                          Application
                        </h4>
                      </div>
                      {entry.application.tools.map((tool) => (
                        <div
                          key={tool.toolId}
                          className={`p-3 rounded-lg ${
                            tool.projectCount > 0 ? 'bg-blue-50' : 'bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${
                              tool.projectCount > 0 ? 'text-blue-800' : 'text-slate-600'
                            }`}>
                              {tool.toolName || tool.toolId}
                            </span>
                            {tool.projectCount > 0 ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {tool.projectCount} project{tool.projectCount !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Not started</span>
                            )}
                          </div>
                          {tool.projectCount > 0 && tool.description && (
                            <p className="text-xs text-blue-700 mt-1">
                              {tool.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">How to earn skills:</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              Knowledge = Complete linked course
            </div>
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />
              Application = Save projects with tools
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
