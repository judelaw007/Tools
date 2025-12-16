'use client';

/**
 * Skills Matrix Component
 *
 * Displays user skills organized by category with evidence indicators.
 * Automatically syncs skills from platform activity.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useSkills,
  UserSkill,
  SkillLevel,
  EvidenceType,
  SkillCategory,
  getSkillLevelLabel,
  getEvidenceTypeLabel,
  getCategoryLabel,
} from '@/hooks/useSkills';
import {
  Award,
  BookOpen,
  Wrench,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface SkillsMatrixProps {
  className?: string;
}

/**
 * Get badge variant for skill level
 */
function getSkillLevelVariant(level: SkillLevel): 'success' | 'info' | 'default' {
  switch (level) {
    case 'expert': return 'success';
    case 'proficient': return 'info';
    case 'familiar': return 'default';
    default: return 'default';
  }
}

/**
 * Get icon for evidence type
 */
function EvidenceIcon({ type, className }: { type: EvidenceType; className?: string }) {
  switch (type) {
    case 'course_completed':
      return <BookOpen className={className} />;
    case 'tool_used':
      return <Wrench className={className} />;
    case 'work_saved':
      return <Save className={className} />;
    default:
      return <Award className={className} />;
  }
}

/**
 * Individual skill card
 */
function SkillCard({
  skill,
  onToggleVisibility,
}: {
  skill: UserSkill;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        skill.isVisible
          ? 'bg-white border-slate-200 hover:border-mojitax-green/30'
          : 'bg-slate-50 border-slate-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <EvidenceIcon
            type={skill.evidenceType}
            className={`w-4 h-4 ${
              skill.evidenceType === 'course_completed'
                ? 'text-purple-600'
                : skill.evidenceType === 'tool_used'
                ? 'text-blue-600'
                : 'text-green-600'
            }`}
          />
          <span className="font-medium text-sm text-mojitax-navy">
            {skill.skillName}
          </span>
        </div>
        <button
          onClick={() => onToggleVisibility(skill.id, !skill.isVisible)}
          className="p-1 rounded hover:bg-slate-100 transition-colors"
          title={skill.isVisible ? 'Hide skill' : 'Show skill'}
        >
          {skill.isVisible ? (
            <Eye className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-300" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={getSkillLevelVariant(skill.skillLevel)} size="sm">
          {getSkillLevelLabel(skill.skillLevel)}
        </Badge>
        <span className="text-xs text-slate-500">
          {getEvidenceTypeLabel(skill.evidenceType)}
          {skill.evidenceCount > 1 && ` (${skill.evidenceCount}x)`}
        </span>
      </div>

      {skill.evidenceSourceName && (
        <p className="text-xs text-slate-400 mt-1.5 truncate">
          From: {skill.evidenceSourceName}
        </p>
      )}
    </div>
  );
}

/**
 * Category section with collapsible skills
 */
function CategorySection({
  category,
  skills,
  onToggleVisibility,
}: {
  category: SkillCategory;
  skills: UserSkill[];
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Count skills by level
  const expertCount = skills.filter((s) => s.skillLevel === 'expert').length;
  const proficientCount = skills.filter((s) => s.skillLevel === 'proficient').length;
  const familiarCount = skills.filter((s) => s.skillLevel === 'familiar').length;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-mojitax-green/20 flex items-center justify-center">
            <Award className="w-4 h-4 text-mojitax-green" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-mojitax-navy">
              {getCategoryLabel(category)}
            </h3>
            <p className="text-xs text-slate-500">
              {skills.length} skill{skills.length !== 1 ? 's' : ''}
              {expertCount > 0 && ` • ${expertCount} expert`}
              {proficientCount > 0 && ` • ${proficientCount} proficient`}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main Skills Matrix Component
 */
export function SkillsMatrix({ className = '' }: SkillsMatrixProps) {
  const {
    skills,
    summary,
    isLoading,
    isSyncing,
    error,
    sync,
    toggleVisibility,
  } = useSkills({ autoSync: true, includeSummary: true });

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.skillCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<SkillCategory, UserSkill[]>);

  // Sort categories by skill count
  const sortedCategories = Object.entries(skillsByCategory)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([category]) => category as SkillCategory);

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
          <Button variant="outline" onClick={sync}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
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
            Skills automatically tracked from your platform activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={sync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Skills'}
        </Button>
      </CardHeader>

      <CardContent>
        {skills.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-mojitax-navy mb-2">
              No Skills Yet
            </h3>
            <p className="text-slate-500 max-w-md mx-auto mb-4">
              Start using tools, completing courses, and saving your work to build
              your skills profile automatically.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Complete courses
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                Use tools
              </div>
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-green-500" />
                Save work
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-mojitax-navy">
                    {summary.totalSkills}
                  </p>
                  <p className="text-xs text-slate-500">Total Skills</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {summary.byLevel.expert}
                  </p>
                  <p className="text-xs text-green-600">Expert</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {summary.byLevel.proficient}
                  </p>
                  <p className="text-xs text-blue-600">Proficient</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-slate-700">
                    {summary.byLevel.familiar}
                  </p>
                  <p className="text-xs text-slate-500">Familiar</p>
                </div>
              </div>
            )}

            {/* Skills by Category */}
            <div className="space-y-4">
              {sortedCategories.map((category) => (
                <CategorySection
                  key={category}
                  category={category}
                  skills={skillsByCategory[category]}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">How skills are earned:</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                  Course completion = Proficient
                </div>
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-500" />
                  Tool usage: 1-4x = Familiar, 5-14x = Proficient, 15x+ = Expert
                </div>
                <div className="flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-green-500" />
                  Saved work: 1-4 = Familiar, 5+ = Proficient
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
