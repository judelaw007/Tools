'use client';

/**
 * Skills Matrix Portfolio Component
 *
 * Displays user skills as a portfolio - only showing achievements.
 * - Only shows categories where user has completed at least one course
 * - Each course shows its own description and score
 * - Only shows tools the user has actually used
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
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface PortfolioEntry {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  completedCourses: Array<{
    courseId: string;
    courseName: string;
    knowledgeDescription: string | null;
    progressScore: number;
    completedAt: string;
  }>;
  totalCoursesInCategory: number;
  toolsUsed: Array<{
    toolId: string;
    toolName: string;
    applicationDescription: string | null;
    projectCount: number;
    lastUsedAt: string;
  }>;
}

interface SkillsMatrixV2Props {
  className?: string;
}

export function SkillsMatrixV2({ className = '' }: SkillsMatrixV2Props) {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user/skill-matrix');

      if (!response.ok) {
        if (response.status === 401) {
          setPortfolio([]);
          return;
        }
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data.portfolio || []);

      // Expand all categories by default
      const allIds = new Set<string>((data.portfolio || []).map((e: PortfolioEntry) => e.category.id));
      setExpandedCategories(allIds);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setPortfolio([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncPortfolio = useCallback(async () => {
    try {
      setIsSyncing(true);

      const response = await fetch('/api/user/skill-matrix', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync portfolio');
      }

      const data = await response.json();
      setPortfolio(data.portfolio || []);

      // Expand all categories
      const allIds = new Set<string>((data.portfolio || []).map((e: PortfolioEntry) => e.category.id));
      setExpandedCategories(allIds);
    } catch (err) {
      console.error('Error syncing portfolio:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncPortfolio(); // Sync on mount to update from course completions
  }, [syncPortfolio]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading your skills portfolio...</p>
        </CardContent>
      </Card>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-mojitax-green" />
            Skills Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-mojitax-navy mb-2">
              Start Building Your Portfolio
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-4">
              Complete courses and use tools to build your professional skills portfolio.
              Your achievements will appear here automatically.
            </p>
            <Button
              variant="outline"
              onClick={syncPortfolio}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Progress'}
            </Button>
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
            <Award className="w-5 h-5 text-mojitax-green" />
            Skills Portfolio
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Your professional achievements and competencies
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={syncPortfolio}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {portfolio.map((entry) => {
          const isExpanded = expandedCategories.has(entry.category.id);
          const remainingCourses = entry.totalCoursesInCategory - entry.completedCourses.length;

          return (
            <div
              key={entry.category.id}
              className="border border-mojitax-green/30 bg-gradient-to-r from-mojitax-green/5 to-transparent rounded-xl overflow-hidden"
            >
              {/* Category Header */}
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-mojitax-green/5 transition-colors"
                onClick={() => toggleCategory(entry.category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-mojitax-green/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-mojitax-green" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-mojitax-navy">
                      {entry.category.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-500" />
                        {entry.completedCourses.length} course{entry.completedCourses.length !== 1 ? 's' : ''} completed
                      </span>
                      {entry.toolsUsed.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-blue-500" />
                          {entry.toolsUsed.length} tool{entry.toolsUsed.length !== 1 ? 's' : ''} used
                        </span>
                      )}
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
                  {/* Knowledge Section - Completed Courses */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <h4 className="text-sm font-semibold text-slate-700">Knowledge</h4>
                    </div>
                    {entry.completedCourses.map((course) => (
                      <div
                        key={course.courseId}
                        className="p-4 rounded-lg bg-purple-50 border border-purple-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="font-medium text-purple-900">
                              {course.courseName}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            Score: {course.progressScore}%
                          </span>
                        </div>
                        {course.knowledgeDescription && (
                          <p className="text-sm text-purple-800 ml-6 mb-2">
                            {course.knowledgeDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-purple-500 ml-6">
                          <Calendar className="w-3 h-3" />
                          Completed {formatDate(course.completedAt)}
                        </div>
                      </div>
                    ))}
                    {remainingCourses > 0 && (
                      <p className="text-xs text-slate-500 italic px-1">
                        Complete {remainingCourses} more course{remainingCourses !== 1 ? 's' : ''} to expand this skill
                      </p>
                    )}
                  </div>

                  {/* Application Section - Tools Used */}
                  {entry.toolsUsed.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-slate-700">Application</h4>
                      </div>
                      {entry.toolsUsed.map((tool) => (
                        <div
                          key={tool.toolId}
                          className="p-4 rounded-lg bg-blue-50 border border-blue-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-blue-900">
                              {tool.toolName}
                            </span>
                            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              {tool.projectCount} project{tool.projectCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {tool.applicationDescription && (
                            <p className="text-sm text-blue-800 mb-2">
                              {tool.applicationDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <Calendar className="w-3 h-3" />
                            Last used {formatDate(tool.lastUsedAt)}
                          </div>
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
          <p className="text-xs text-slate-400 mb-2">How to build your portfolio:</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              Complete courses for Knowledge credentials
            </div>
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />
              Save projects to demonstrate Application
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
