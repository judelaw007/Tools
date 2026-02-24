'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORY_METADATA } from '@/lib/tools/registry';
import { getToolTypeIcon, toolTypeColors } from '@/lib/tools/tool-ui';
import { Search, ArrowRight, Wrench } from 'lucide-react';
import type { Tool, ToolCategory } from '@/types';

interface PublicToolsFilterProps {
  tools: Tool[];
}

function groupToolsByCategory(tools: Tool[]): { id: ToolCategory; name: string; tools: Tool[] }[] {
  const grouped: Record<string, Tool[]> = {};
  tools.forEach(tool => {
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  });
  return Object.entries(grouped)
    .filter(([, tools]) => tools.length > 0)
    .map(([category, tools]) => ({
      id: category as ToolCategory,
      name: CATEGORY_METADATA[category]?.name || category,
      tools,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function PublicToolsFilter({ tools }: PublicToolsFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const allCategories = useMemo(() => {
    const cats = new Set<ToolCategory>();
    tools.forEach(t => cats.add(t.category));
    return Array.from(cats)
      .map(c => ({ id: c, name: CATEGORY_METADATA[c]?.name || c }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = !searchQuery ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || tool.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, categoryFilter]);

  const categories = groupToolsByCategory(filteredTools);

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mojitax-green/50 focus:border-mojitax-green bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              !categoryFilter ? 'bg-mojitax-navy text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {allCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                categoryFilter === cat.id ? 'bg-mojitax-navy text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filteredTools.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No tools found"
          description="Try adjusting your search or filter"
        />
      ) : (
        categories.map((category) => (
          <div key={category.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-semibold text-mojitax-navy">
                {category.name}
              </h3>
              <Badge variant="default" size="sm">
                {category.tools.length} {category.tools.length === 1 ? 'tool' : 'tools'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.slug}`} className="group">
                  <Card hover>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${toolTypeColors[tool.toolType] || 'bg-slate-100 text-slate-600'}`}>
                          {getToolTypeIcon(tool.toolType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors mb-1">
                            {tool.name}
                          </h4>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {tool.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 capitalize">
                          {tool.toolType.replace('-', ' ')}
                        </span>
                        <span className="text-sm font-medium text-mojitax-green-dark flex items-center gap-1 group-hover:gap-2 transition-all">
                          Preview
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
