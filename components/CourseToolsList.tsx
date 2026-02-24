'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { getToolTypeIcon, toolTypeColors } from '@/lib/tools/tool-ui';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import type { Tool } from '@/types';

interface CourseWithTools {
  courseId: string;
  courseName: string;
  tools: Tool[];
}

// Accent colors that rotate across course rows
const ROW_ACCENT_COLORS = [
  'border-l-blue-600',
  'border-l-orange-500',
  'border-l-emerald-600',
  'border-l-violet-600',
  'border-l-rose-500',
  'border-l-cyan-600',
  'border-l-amber-500',
  'border-l-indigo-500',
];

// How many tools to show in the collapsed "preview" line
const PREVIEW_TOOL_COUNT = 3;

export function CourseToolsList({ courses }: { courses: CourseWithTools[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center shadow-sm">
        <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-mojitax-navy mb-1">
          Courses Coming Soon
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Tools are being allocated to Professional Practice courses.
        </p>
        <Link
          href="https://www.mojitax.co.uk/courses-catalogue"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
        >
          Browse all courses
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
      {courses.map((course, idx) => {
        const isExpanded = expandedId === course.courseId;
        const previewTools = course.tools.slice(0, PREVIEW_TOOL_COUNT);
        const remainingCount = course.tools.length - PREVIEW_TOOL_COUNT;

        return (
          <div key={course.courseId}>
            {/* Course Row — always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : course.courseId)}
              className={`w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-slate-50/80 transition-colors border-l-[3px] ${ROW_ACCENT_COLORS[idx % ROW_ACCENT_COLORS.length]}`}
            >
              {/* Expand icon */}
              <span className="flex-shrink-0 text-slate-400">
                {isExpanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />
                }
              </span>

              {/* Course icon */}
              <BookOpen className="w-4 h-4 text-mojitax-navy flex-shrink-0" />

              {/* Course name */}
              <span className="text-sm font-semibold text-mojitax-navy truncate">
                {course.courseName}
              </span>

              {/* Tool count badge */}
              <Badge variant="info" size="sm" className="text-[11px] flex-shrink-0">
                {course.tools.length} {course.tools.length === 1 ? 'tool' : 'tools'}
              </Badge>

              {/* Collapsed preview: first N tool names */}
              {!isExpanded && (
                <span className="hidden md:inline text-xs text-slate-400 truncate ml-1">
                  {previewTools.map(t => t.name).join(', ')}
                  {remainingCount > 0 && ` +${remainingCount} more`}
                </span>
              )}

              {/* View course link (stop propagation so it doesn't toggle) */}
              <Link
                href={`https://www.mojitax.co.uk/course/${course.courseId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-0.5 transition-colors ml-auto flex-shrink-0"
              >
                View course
                <ChevronRight className="w-3 h-3" />
              </Link>
            </button>

            {/* Expanded tool grid */}
            {isExpanded && (
              <div className="px-5 pb-4 pt-1 bg-slate-50/50 border-l-[3px] border-l-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {course.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${toolTypeColors[tool.toolType] || 'bg-slate-100 text-slate-600'}`}>
                        {getToolTypeIcon(tool.toolType, 'w-3.5 h-3.5')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-mojitax-navy group-hover:text-mojitax-blue transition-colors truncate">
                          {tool.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tool.shortDescription}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-mojitax-blue flex-shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
