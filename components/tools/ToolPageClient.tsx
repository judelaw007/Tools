'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
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
import { Loader2, Calculator } from 'lucide-react';

interface ToolPageClientProps {
  tool: Tool;
}

// Generic saved item type for localStorage persistence
type SavedItem = SavedCalculation | SavedAssessment | SavedDeadlineCalculation | SavedPracticeSession | SavedDFEAssessment | SavedAuditChecklist;

export function ToolPageClient({ tool }: ToolPageClientProps) {
  const { isAuthenticated, user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved items from localStorage
  useEffect(() => {
    if (isAuthenticated && tool?.id) {
      const saved = localStorage.getItem(`tool-${tool.id}-saves`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSavedItems(
            parsed.map((item: SavedItem) => ({
              ...item,
              updatedAt: new Date(item.updatedAt),
            }))
          );
        } catch (e) {
          console.error('Error loading saved items:', e);
        }
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, tool?.id]);

  // Handle save - works for both calculators and assessments
  const handleSave = async (
    data: Omit<SavedItem, 'id' | 'updatedAt'>
  ): Promise<string> => {
    const id = `calc-${Date.now()}`;
    const savedItem: SavedItem = {
      ...data,
      id,
      updatedAt: new Date(),
    } as SavedItem;

    const existingItems = JSON.parse(
      localStorage.getItem(`tool-${tool.id}-saves`) || '[]'
    );
    const updatedItems = [
      savedItem,
      ...existingItems.filter((item: SavedItem) => item.id !== id),
    ];
    localStorage.setItem(`tool-${tool.id}-saves`, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);

    return id;
  };

  // Handle delete
  const handleDelete = async (id: string): Promise<void> => {
    const existingItems = JSON.parse(
      localStorage.getItem(`tool-${tool.id}-saves`) || '[]'
    );
    const updatedItems = existingItems.filter(
      (item: SavedItem) => item.id !== id
    );
    localStorage.setItem(`tool-${tool.id}-saves`, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-mojitax-green" />
      </div>
    );
  }

  // If not authenticated, return null (the parent will show the preview)
  if (!isAuthenticated) {
    return null;
  }

  // Render the appropriate tool component based on tool type/id
  if (tool.toolType === 'calculator') {
    // GloBE Calculator
    if (tool.id === 'gir-globe-calculator' || tool.slug === 'globe-calculator') {
      return (
        <GloBECalculator
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedCalculation, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedCalculation[]}
        />
      );
    }

    // Safe Harbour Qualifier
    if (tool.id === 'gir-safe-harbour-qualifier' || tool.slug === 'safe-harbour-qualifier') {
      return (
        <SafeHarbourQualifier
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedAssessment, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedAssessment[]}
        />
      );
    }

    // Filing Deadline Calculator
    if (tool.id === 'gir-filing-deadline-calculator' || tool.slug === 'filing-deadline-calculator') {
      return (
        <FilingDeadlineCalculator
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedDeadlineCalculation, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedDeadlineCalculation[]}
        />
      );
    }

    // GIR Practice Form
    if (tool.id === 'gir-practice-form' || tool.slug === 'gir-practice-form') {
      return (
        <GIRPracticeForm
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedPracticeSession, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedPracticeSession[]}
        />
      );
    }

    // DFE Assessment Tool
    if (tool.id === 'gir-dfe-assessment' || tool.slug === 'dfe-assessment-tool') {
      return (
        <DFEAssessmentTool
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedDFEAssessment, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedDFEAssessment[]}
        />
      );
    }

    // Audit File Checklist
    if (tool.id === 'gir-audit-file-checklist' || tool.slug === 'audit-file-checklist') {
      return (
        <AuditFileChecklist
          userId={user?.email}
          onSave={handleSave as (data: Omit<SavedAuditChecklist, 'id' | 'updatedAt'>) => Promise<string>}
          onDelete={handleDelete}
          savedItems={savedItems as SavedAuditChecklist[]}
        />
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
