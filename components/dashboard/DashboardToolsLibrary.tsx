'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ToolCard } from '@/components/tools/ToolCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import {
  Search,
  Wrench,
  GraduationCap,
  ExternalLink,
  Filter,
} from 'lucide-react';
import type { ToolWithAccess } from '@/app/(auth)/dashboard/tools/page';
import type { ToolCategory } from '@/types';

interface DashboardToolsLibraryProps {
  tools: ToolWithAccess[];
  initialSearch?: string;
}

export function DashboardToolsLibrary({ tools, initialSearch = '' }: DashboardToolsLibraryProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accessFilter, setAccessFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [dynamicCategoryNames, setDynamicCategoryNames] = useState<Record<string, { name: string; shortName: string }>>({});

  // Fetch dynamic category names
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const map: Record<string, { name: string; shortName: string }> = {};
        for (const c of data.categories || []) {
          map[c.slug] = { name: c.name, shortName: c.shortName };
        }
        setDynamicCategoryNames(map);
      })
      .catch(() => {/* use fallback */});
  }, []);

  const getCategoryName = (slug: string) =>
    dynamicCategoryNames[slug]?.name || CATEGORY_METADATA[slug]?.name || slug.replace(/_/g, ' ');
  const getCategoryShortName = (slug: string) =>
    dynamicCategoryNames[slug]?.shortName || CATEGORY_METADATA[slug]?.shortName || slug.replace(/_/g, ' ');

  // Get unique categories from the tools
  const categories = useMemo(() => {
    const cats = new Set<ToolCategory>();
    tools.forEach(t => cats.add(t.tool.category));
    return Array.from(cats).sort((a, b) => {
      const nameA = getCategoryName(a);
      const nameB = getCategoryName(b);
      return nameA.localeCompare(nameB);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools, dynamicCategoryNames]);

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter(({ tool, hasAccess }) => {
      const matchesSearch =
        !searchQuery ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || tool.category === categoryFilter;
      const matchesAccess =
        accessFilter === 'all' ||
        (accessFilter === 'unlocked' && hasAccess) ||
        (accessFilter === 'locked' && !hasAccess);
      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [tools, searchQuery, categoryFilter, accessFilter]);

  // Group by category for display
  const groupedTools = useMemo(() => {
    const groups: { category: ToolCategory; name: string; tools: ToolWithAccess[] }[] = [];
    const categoryMap = new Map<ToolCategory, ToolWithAccess[]>();

    filteredTools.forEach(item => {
      const existing = categoryMap.get(item.tool.category);
      if (existing) {
        existing.push(item);
      } else {
        categoryMap.set(item.tool.category, [item]);
      }
    });

    categoryMap.forEach((categoryTools, category) => {
      groups.push({
        category,
        name: getCategoryName(category),
        tools: categoryTools,
      });
    });

    // Sort: categories with accessible tools first, then alphabetically
    groups.sort((a, b) => {
      const aHasAccess = a.tools.some(t => t.hasAccess);
      const bHasAccess = b.tools.some(t => t.hasAccess);
      if (aHasAccess !== bHasAccess) return aHasAccess ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return groups;
  }, [filteredTools]);

  const unlockedCount = tools.filter(t => t.hasAccess).length;
  const lockedCount = tools.filter(t => !t.hasAccess).length;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-mojitax-navy mb-2">
          Tools Library
        </h1>
        <p className="text-slate-600">
          Browse all available demo tools across your courses. Tools you have access to are ready to use.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-4 mb-6">
        <Badge variant="active" size="sm" className="text-sm py-1 px-3">
          {unlockedCount} unlocked
        </Badge>
        {lockedCount > 0 && (
          <Badge variant="default" size="sm" className="text-sm py-1 px-3">
            {lockedCount} locked
          </Badge>
        )}
        <span className="text-sm text-slate-500">
          {tools.length} total tools
        </span>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  !categoryFilter ? 'bg-mojitax-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    categoryFilter === cat ? 'bg-mojitax-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getCategoryShortName(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Access Filter */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setAccessFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                accessFilter === 'all' ? 'bg-mojitax-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({tools.length})
            </button>
            <button
              onClick={() => setAccessFilter('unlocked')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                accessFilter === 'unlocked' ? 'bg-mojitax-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            {lockedCount > 0 && (
              <button
                onClick={() => setAccessFilter('locked')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  accessFilter === 'locked' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Locked ({lockedCount})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tools by Category */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={searchQuery || categoryFilter ? Search : Wrench}
          title={searchQuery || categoryFilter ? 'No tools found' : 'No tools available yet'}
          description={
            searchQuery || categoryFilter
              ? 'Try adjusting your search or filters'
              : 'Demo tools will appear here once they are allocated to courses.'
          }
        />
      ) : (
        groupedTools.map((group) => (
          <div key={group.category} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-mojitax-navy">
                {group.name}
              </h2>
              <Badge variant="default" size="sm">
                {group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tools.map(({ tool, hasAccess, courseNames }) => (
                <div key={tool.id} className="relative">
                  <ToolCard tool={tool} hasAccess={hasAccess} />
                  {/* Course attribution */}
                  {!hasAccess && courseNames.length > 0 && (
                    <div className="mt-2 px-2">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Available in: {courseNames.slice(0, 2).join(', ')}
                        {courseNames.length > 2 && ` +${courseNames.length - 2} more`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Enrollment CTA for users with locked tools */}
      {lockedCount > 0 && (
        <Card className="mt-8 bg-gradient-to-br from-mojitax-navy to-mojitax-navy-light text-white">
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 text-white/80" />
            <h3 className="text-lg font-semibold mb-2">
              Unlock More Tools
            </h3>
            <p className="text-sm text-white/70 mb-4 max-w-md mx-auto">
              Enroll in additional MojiTax courses to unlock {lockedCount} more demo {lockedCount === 1 ? 'tool' : 'tools'}.
            </p>
            <a
              href="https://www.mojitax.co.uk/courses-catalogue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Browse Courses
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
