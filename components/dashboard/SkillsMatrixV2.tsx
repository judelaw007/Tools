'use client';

/**
 * Skills Matrix Portfolio Component
 *
 * Displays user skills as a portfolio - only showing achievements.
 * - Only shows categories where user has completed at least one course
 * - Each course shows its own description and score
 * - Only shows tools the user has actually used
 * - Includes print/PDF functionality with QR verification
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Printer,
  X,
  Check,
  Clock,
  User,
  Edit2,
  Loader2,
} from 'lucide-react';
import { PrintableSkillsMatrix } from './PrintableSkillsMatrix';
import { SkillSnapshot } from '@/lib/skill-verifications';

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
    learningHours: number | null;
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

/**
 * Calculate learning hours by year from portfolio entries
 */
function calculateLearningHoursByYear(portfolio: PortfolioEntry[]): Map<number, number> {
  const hoursByYear = new Map<number, number>();

  for (const entry of portfolio) {
    for (const course of entry.completedCourses) {
      if (course.learningHours && course.learningHours > 0) {
        const year = new Date(course.completedAt).getFullYear();
        const current = hoursByYear.get(year) || 0;
        hoursByYear.set(year, current + course.learningHours);
      }
    }
  }

  return hoursByYear;
}

interface SkillsMatrixV2Props {
  className?: string;
}

export function SkillsMatrixV2({ className = '' }: SkillsMatrixV2Props) {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Print-related state
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [printData, setPrintData] = useState<{
    userName: string;
    snapshot: SkillSnapshot;
    verificationUrl: string;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Portfolio name state
  const [portfolioName, setPortfolioName] = useState<string | null>(null);
  const [defaultName, setDefaultName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Fetch user profile (portfolio name)
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setPortfolioName(data.profile.portfolioName);
        setDefaultName(data.defaultName || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  // Save portfolio name
  const savePortfolioName = async () => {
    setIsSavingName(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioName: editNameValue.trim() || null }),
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioName(data.profile.portfolioName);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error('Error saving portfolio name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  // Get the display name (portfolio name or default)
  const getDisplayName = () => portfolioName || defaultName;

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
      setPortfolio([]);
    } finally {
      setIsSyncing(false);
      setIsLoading(false); // Also clear initial loading state
    }
  }, []);

  useEffect(() => {
    // Load cached data from database on mount (fast)
    // User can manually sync to fetch fresh data from LearnWorlds
    fetchPortfolio();
    fetchProfile();
  }, [fetchPortfolio, fetchProfile]);

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

  const toggleSelectForPrint = (categoryId: string) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const selectAllForPrint = () => {
    setSelectedForPrint(new Set(portfolio.map((e) => e.category.id)));
  };

  const clearPrintSelection = () => {
    setSelectedForPrint(new Set());
  };

  const handlePrint = async () => {
    try {
      setIsPreparing(true);

      // Create verification record
      const response = await fetch('/api/user/skill-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSkillIds: Array.from(selectedForPrint),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create verification');
      }

      const data = await response.json();

      setPrintData({
        userName: data.userName,
        snapshot: data.snapshot,
        verificationUrl: data.verificationUrl,
      });

      setIsPrintMode(true);

      // Wait for component to render, then trigger print
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      console.error('Error preparing print:', err);
      alert('Failed to prepare print. Please try again.');
    } finally {
      setIsPreparing(false);
    }
  };

  const closePrintMode = () => {
    setIsPrintMode(false);
    setPrintData(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Print mode - show only the printable version
  if (isPrintMode && printData) {
    return (
      <div>
        {/* Close button - hidden when printing */}
        <div className="no-print fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={closePrintMode}
            className="bg-white shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Close Print View
          </Button>
        </div>

        <PrintableSkillsMatrix
          ref={printRef}
          userName={printData.userName}
          snapshot={printData.snapshot}
          verificationUrl={printData.verificationUrl}
          generatedAt={new Date().toISOString()}
        />
      </div>
    );
  }

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

  // Empty state - can still print an empty portfolio
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
              Click &quot;Sync Progress&quot; to load your latest course completions from LearnWorlds.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={syncPortfolio}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Progress'}
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={isPreparing}
              >
                <Printer className="w-4 h-4" />
                {isPreparing ? 'Preparing...' : 'Print Empty Portfolio'}
              </Button>
            </div>
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncPortfolio}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handlePrint}
            disabled={isPreparing || (selectedForPrint.size === 0 && portfolio.length > 0)}
          >
            <Printer className="w-4 h-4" />
            {isPreparing ? 'Preparing...' : 'Print / PDF'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Portfolio Name Editor */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium mb-0.5">Name on Portfolio</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter your full name"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') savePortfolioName();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      autoFocus
                    />
                    <Button
                      variant="success"
                      size="sm"
                      onClick={savePortfolioName}
                      disabled={isSavingName}
                    >
                      {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingName(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-900">{getDisplayName()}</span>
                    {!portfolioName && (
                      <span className="text-xs text-blue-500">(from account)</span>
                    )}
                    <button
                      onClick={() => {
                        setEditNameValue(portfolioName || defaultName);
                        setIsEditingName(true);
                      }}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Edit name"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 ml-13">
            This is the name that will appear on your printed Skills Portfolio
          </p>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Check className="w-4 h-4" />
            <span>
              {selectedForPrint.size === 0
                ? 'Select skills to include in print'
                : `${selectedForPrint.size} skill${selectedForPrint.size !== 1 ? 's' : ''} selected`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllForPrint}
              className="text-sm text-mojitax-green hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={clearPrintSelection}
              className="text-sm text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Learning Hours Summary */}
        {(() => {
          const hoursByYear = calculateLearningHoursByYear(portfolio);
          const currentYear = new Date().getFullYear();
          const currentYearHours = hoursByYear.get(currentYear) || 0;
          const totalHours = Array.from(hoursByYear.values()).reduce((sum, h) => sum + h, 0);

          if (totalHours === 0) return null;

          const sortedYears = Array.from(hoursByYear.keys()).sort((a, b) => b - a);

          return (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Learning Hours</h3>
                    <p className="text-xs text-amber-700">
                      {currentYearHours > 0
                        ? `${currentYearHours} hrs in ${currentYear}`
                        : `No hours recorded for ${currentYear}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-900">{currentYearHours}</div>
                  <div className="text-xs text-amber-600">hours this year</div>
                </div>
              </div>

              {/* Year breakdown if multiple years */}
              {sortedYears.length > 1 && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="flex flex-wrap gap-3 text-sm">
                    {sortedYears.map((year) => (
                      <div
                        key={year}
                        className={`px-3 py-1 rounded-full ${
                          year === currentYear
                            ? 'bg-amber-200 text-amber-900 font-medium'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {year}: {hoursByYear.get(year)} hrs
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {portfolio.map((entry) => {
          const isExpanded = expandedCategories.has(entry.category.id);
          const isSelected = selectedForPrint.has(entry.category.id);
          const remainingCourses = entry.totalCoursesInCategory - entry.completedCourses.length;

          return (
            <div
              key={entry.category.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isSelected
                  ? 'border-mojitax-green bg-gradient-to-r from-mojitax-green/10 to-transparent'
                  : 'border-mojitax-green/30 bg-gradient-to-r from-mojitax-green/5 to-transparent'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center">
                {/* Checkbox */}
                <button
                  className="p-4 flex items-center justify-center hover:bg-mojitax-green/10 transition-colors"
                  onClick={() => toggleSelectForPrint(entry.category.id)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-mojitax-green border-mojitax-green'
                        : 'border-slate-300 hover:border-mojitax-green'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>

                {/* Expand/Collapse */}
                <button
                  className="flex-1 p-4 pl-0 flex items-center justify-between hover:bg-mojitax-green/5 transition-colors"
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
              </div>

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
                          <div className="flex items-center gap-2">
                            {course.learningHours && course.learningHours > 0 && (
                              <span className="text-sm font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.learningHours} hrs
                              </span>
                            )}
                            <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              {course.progressScore > 0 ? `Score: ${course.progressScore}%` : 'Completed'}
                            </span>
                          </div>
                        </div>
                        {course.knowledgeDescription && (
                          <p className="text-sm text-purple-800 ml-6 mb-2">
                            {course.knowledgeDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-purple-500 ml-6">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Completed {formatDate(course.completedAt)}
                          </span>
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
