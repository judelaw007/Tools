'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { GloBECalculator } from '@/components/tools/calculator/GloBECalculator';
import type { SavedCalculation } from '@/components/tools/calculator/GloBECalculator';
import type { Tool } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, Calculator } from 'lucide-react';

interface ToolPageClientProps {
  tool: Tool;
}

export function ToolPageClient({ tool }: ToolPageClientProps) {
  const { isAuthenticated, user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved items from localStorage
  useEffect(() => {
    if (isAuthenticated && tool?.id) {
      const saved = localStorage.getItem(`tool-${tool.id}-saves`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSavedItems(
            parsed.map((item: SavedCalculation) => ({
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

  // Handle save calculation
  const handleSave = async (
    data: Omit<SavedCalculation, 'id' | 'updatedAt'>
  ): Promise<string> => {
    const id = `calc-${Date.now()}`;
    const savedItem: SavedCalculation = {
      ...data,
      id,
      updatedAt: new Date(),
    };

    const existingItems = JSON.parse(
      localStorage.getItem(`tool-${tool.id}-saves`) || '[]'
    );
    const updatedItems = [
      savedItem,
      ...existingItems.filter((item: SavedCalculation) => item.id !== id),
    ];
    localStorage.setItem(`tool-${tool.id}-saves`, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);

    return id;
  };

  // Handle delete calculation
  const handleDelete = async (id: string): Promise<void> => {
    const existingItems = JSON.parse(
      localStorage.getItem(`tool-${tool.id}-saves`) || '[]'
    );
    const updatedItems = existingItems.filter(
      (item: SavedCalculation) => item.id !== id
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
          onSave={handleSave}
          onDelete={handleDelete}
          savedItems={savedItems}
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
