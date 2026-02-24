import {
  Calculator,
  Search,
  CheckCircle,
  FileText,
  TrendingUp,
  BookOpen,
  ExternalLink,
  Table,
  ClipboardList,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ToolType } from '@/types';

/**
 * Shared tool type icon and color mappings.
 * Single source of truth — imported by ToolCard, public tool pages, and dashboard.
 */

export const toolTypeColors: Record<ToolType, string> = {
  calculator: 'bg-blue-100 text-blue-600',
  search: 'bg-purple-100 text-purple-600',
  validator: 'bg-green-100 text-green-600',
  generator: 'bg-orange-100 text-orange-600',
  tracker: 'bg-pink-100 text-pink-600',
  reference: 'bg-cyan-100 text-cyan-600',
  'external-link': 'bg-slate-100 text-slate-600',
  spreadsheet: 'bg-emerald-100 text-emerald-600',
  form: 'bg-indigo-100 text-indigo-600',
};

export const toolTypeIconMap: Record<ToolType, LucideIcon> = {
  calculator: Calculator,
  search: Search,
  validator: CheckCircle,
  generator: FileText,
  tracker: TrendingUp,
  reference: BookOpen,
  'external-link': ExternalLink,
  spreadsheet: Table,
  form: ClipboardList,
};

/** Return a rendered icon element for the given tool type. */
export function getToolTypeIcon(type: string, className = 'w-5 h-5') {
  const Icon = toolTypeIconMap[type as ToolType] || FileText;
  return <Icon className={className} />;
}
