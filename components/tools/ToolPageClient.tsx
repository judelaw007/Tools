'use client';

import { GloBECalculator } from '@/components/tools/calculator/GloBECalculator';
import { SafeHarbourQualifier } from '@/components/tools/calculator/SafeHarbourQualifier';
import { FilingDeadlineCalculator } from '@/components/tools/calculator/FilingDeadlineCalculator';
import { GIRPracticeForm } from '@/components/tools/calculator/GIRPracticeForm';
import { DFEAssessmentTool } from '@/components/tools/calculator/DFEAssessmentTool';
import { AuditFileChecklist } from '@/components/tools/calculator/AuditFileChecklist';
import type { SavedCalculation } from '@/components/tools/calculator/GloBECalculator';
import type { SavedAssessment } from '@/components/tools/calculator/SafeHarbourQualifier';
import type { SavedDeadlineCalculation } from '@/components/tools/calculator/FilingDeadlineCalculator';
import type { SavedPracticeSession } from '@/components/tools/calculator/GIRPracticeForm';
import type { SavedDFEAssessment } from '@/components/tools/calculator/DFEAssessmentTool';
import type { SavedAuditChecklist } from '@/components/tools/calculator/AuditFileChecklist';
import type { Tool } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, Calculator, AlertCircle } from 'lucide-react';
import { useSavedWork, SavedWorkItem } from '@/hooks/useSavedWork';

interface ToolPageClientProps {
  tool: Tool;
  userEmail?: string; // Passed from server - trust parent's auth decision
}

// Generic saved item type - union of all tool-specific types
type SavedItemData = SavedCalculation | SavedAssessment | SavedDeadlineCalculation | SavedPracticeSession | SavedDFEAssessment | SavedAuditChecklist;

/**
 * Client component for rendering tool content.
 *
 * IMPORTANT: This component trusts that the parent (ToolPage) has already
 * verified authentication and tool access. Do NOT add auth checks here
 * as it causes hydration mismatches between server and client rendering.
 *
 * Uses the useSavedWork hook for persistent, database-backed storage of
 * user's saved calculations, assessments, and other work. Falls back to
 * localStorage if the API is unavailable.
 */
export function ToolPageClient({ tool, userEmail }: ToolPageClientProps) {
  // Use the centralized saved work hook - persists to database with localStorage fallback
  const {
    items: savedWorkItems,
    isLoading,
    error,
    save,
    remove,
  } = useSavedWork<SavedItemData>({
    toolId: tool.id,
    userEmail,
  });

  /**
   * Convert SavedWorkItem to the format expected by tool components
   * Maps from the database schema to the tool-specific format
   */
  const savedItems = savedWorkItems.map((item) => ({
    ...item.data,
    id: item.id,
    updatedAt: item.updatedAt,
  })) as SavedItemData[];

  /**
   * Handle save - wraps the hook's save function to match tool component expectations
   */
  const handleSave = async (
    data: Omit<SavedItemData, 'id' | 'updatedAt'>
  ): Promise<string> => {
    // Generate a name based on the data (tools can customize this)
    const name = generateSaveName(data, tool.name);
    const id = await save(name, data as SavedItemData);
    return id || `local-${Date.now()}`;
  };

  /**
   * Handle delete - wraps the hook's remove function
   */
  const handleDelete = async (id: string): Promise<void> => {
    await remove(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-mojitax-green" />
      </div>
    );
  }

  // Show error banner if there's an issue (but still render the tool)
  const errorBanner = error ? (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          Unable to sync saved work
        </p>
        <p className="text-xs text-amber-600">
          Your work will be saved locally. {error}
        </p>
      </div>
    </div>
  ) : null;

  // NOTE: No auth check here! Parent (ToolPage) already verified access.
  // Adding auth checks here causes hydration mismatches.

  // Render the appropriate tool component based on tool type/id
  if (tool.toolType === 'calculator') {
    // GloBE Calculator
    if (tool.id === 'gir-globe-calculator' || tool.slug === 'globe-calculator') {
      return (
        <>
          {errorBanner}
          <GloBECalculator
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedCalculation, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedCalculation[]}
          />
        </>
      );
    }

    // Safe Harbour Qualifier
    if (tool.id === 'gir-safe-harbour-qualifier' || tool.slug === 'safe-harbour-qualifier') {
      return (
        <>
          {errorBanner}
          <SafeHarbourQualifier
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedAssessment, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedAssessment[]}
          />
        </>
      );
    }

    // Filing Deadline Calculator
    if (tool.id === 'gir-filing-deadline-calculator' || tool.slug === 'filing-deadline-calculator') {
      return (
        <>
          {errorBanner}
          <FilingDeadlineCalculator
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedDeadlineCalculation, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedDeadlineCalculation[]}
          />
        </>
      );
    }

    // GIR Practice Form
    if (tool.id === 'gir-practice-form' || tool.slug === 'gir-practice-form') {
      return (
        <>
          {errorBanner}
          <GIRPracticeForm
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedPracticeSession, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedPracticeSession[]}
          />
        </>
      );
    }

    // DFE Assessment Tool
    if (tool.id === 'gir-dfe-assessment' || tool.slug === 'dfe-assessment-tool') {
      return (
        <>
          {errorBanner}
          <DFEAssessmentTool
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedDFEAssessment, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedDFEAssessment[]}
          />
        </>
      );
    }

    // Audit File Checklist
    if (tool.id === 'gir-audit-file-checklist' || tool.slug === 'audit-file-checklist') {
      return (
        <>
          {errorBanner}
          <AuditFileChecklist
            userId={userEmail}
            onSave={handleSave as (data: Omit<SavedAuditChecklist, 'id' | 'updatedAt'>) => Promise<string>}
            onDelete={handleDelete}
            savedItems={savedItems as SavedAuditChecklist[]}
          />
        </>
      );
    }

    // Default calculator placeholder
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Calculator className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-mojitax-navy mb-2">
            {tool.name}
          </h3>
          <p className="text-slate-500 mb-4">
            This calculator tool is being developed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Default: return null to show the preview
  return null;
}

/**
 * Generate a default name for saved work based on the data
 */
function generateSaveName(data: Omit<SavedItemData, 'id' | 'updatedAt'>, toolName: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Try to extract a meaningful name from the data
  if ('name' in data && typeof data.name === 'string' && data.name) {
    return data.name;
  }

  if ('jurisdiction' in data && typeof data.jurisdiction === 'string') {
    return `${data.jurisdiction} - ${dateStr}`;
  }

  if ('entityName' in data && typeof data.entityName === 'string') {
    return `${data.entityName} - ${dateStr}`;
  }

  // Default: Tool name + date
  return `${toolName} - ${dateStr}`;
}
