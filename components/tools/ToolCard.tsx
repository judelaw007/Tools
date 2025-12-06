'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
  Lock,
  ArrowRight,
} from 'lucide-react';
import type { Tool, ToolType, ToolStatus } from '@/types';

interface ToolCardProps {
  tool: Tool;
  hasAccess?: boolean;
  showStatus?: boolean;
  variant?: 'default' | 'compact' | 'admin';
  onClick?: () => void;
}

const toolTypeIcons: Record<ToolType, React.ReactNode> = {
  calculator: <Calculator className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  validator: <CheckCircle className="w-5 h-5" />,
  generator: <FileText className="w-5 h-5" />,
  tracker: <TrendingUp className="w-5 h-5" />,
  reference: <BookOpen className="w-5 h-5" />,
  'external-link': <ExternalLink className="w-5 h-5" />,
  spreadsheet: <Table className="w-5 h-5" />,
  form: <ClipboardList className="w-5 h-5" />,
};

const toolTypeColors: Record<ToolType, string> = {
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

const statusVariants: Record<ToolStatus, 'draft' | 'active' | 'inactive' | 'archived'> = {
  draft: 'draft',
  active: 'active',
  inactive: 'inactive',
  archived: 'archived',
};

export function ToolCard({ 
  tool, 
  hasAccess = true, 
  showStatus = false,
  variant = 'default',
  onClick 
}: ToolCardProps) {
  const Icon = toolTypeIcons[tool.toolType];
  const iconColor = toolTypeColors[tool.toolType];
  
  if (variant === 'compact') {
    return (
      <Link
        href={hasAccess ? `/tools/${tool.slug}` : '#'}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-mojitax-green/30 hover:shadow-sm transition-all',
          !hasAccess && 'opacity-60 cursor-not-allowed'
        )}
        onClick={!hasAccess ? (e) => e.preventDefault() : undefined}
      >
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColor)}>
          {Icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-mojitax-navy truncate">{tool.name}</h4>
          <p className="text-xs text-slate-500 capitalize">{tool.toolType.replace('-', ' ')}</p>
        </div>
        {!hasAccess && <Lock className="w-4 h-4 text-slate-400" />}
      </Link>
    );
  }
  
  if (variant === 'admin') {
    return (
      <Card hover className="group">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', iconColor)}>
              {Icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors">
                  {tool.name}
                </h3>
                {showStatus && (
                  <Badge variant={statusVariants[tool.status]} dot size="sm">
                    {tool.status === 'active' ? 'Live' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                {tool.shortDescription || 'No description provided'}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="capitalize">{tool.toolType.replace('-', ' ')}</span>
                <span>•</span>
                <span className="capitalize">{tool.category?.replace('_', ' ') || 'Uncategorized'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card hover className="group overflow-hidden">
      <CardContent className="p-0">
        {/* Top section with icon */}
        <div className={cn(
          'p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100',
          !hasAccess && 'opacity-50'
        )}>
          <div className="flex items-start justify-between mb-4">
            <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center', iconColor)}>
              {Icon}
            </div>
            {!hasAccess && (
              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                <Lock className="w-3 h-3" />
                Locked
              </div>
            )}
            {showStatus && hasAccess && (
              <Badge variant={statusVariants[tool.status]} dot size="sm">
                {tool.status === 'active' ? 'Live' : tool.status.charAt(0).toUpperCase() + tool.status.slice(1)}
              </Badge>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-mojitax-navy group-hover:text-mojitax-green-dark transition-colors mb-2">
            {tool.name}
          </h3>
          
          <p className="text-sm text-slate-500 line-clamp-2">
            {tool.shortDescription || 'Practice with this demo tool to understand key tax concepts.'}
          </p>
        </div>
        
        {/* Bottom section with action */}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 capitalize">
            {tool.toolType.replace('-', ' ')} • {tool.category?.replace('_', ' ') || 'General'}
          </span>
          
          {hasAccess ? (
            <Link
              href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-mojitax-green-dark hover:text-mojitax-green transition-colors"
            >
              Open Tool
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onClick}>
              Get Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
