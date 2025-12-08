// Calculator Tool Components
// Each calculator is a self-contained component that can be rendered based on tool configuration

export { GloBECalculator } from './GloBECalculator';
export type { GloBECalculatorProps, SavedCalculation } from './GloBECalculator';

// Calculator registry - maps calculator IDs to their components
import { GloBECalculator } from './GloBECalculator';
import type { ComponentType } from 'react';

export const CALCULATOR_COMPONENTS: Record<string, ComponentType<any>> = {
  'gir-globe-calculator': GloBECalculator,
  'globe-calculator': GloBECalculator, // alias
};

export function getCalculatorComponent(calculatorId: string): ComponentType<any> | null {
  return CALCULATOR_COMPONENTS[calculatorId] || null;
}
