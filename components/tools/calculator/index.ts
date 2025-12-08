// Calculator Tool Components
// Each calculator is a self-contained component that can be rendered based on tool configuration

export { GloBECalculator } from './GloBECalculator';
export type { GloBECalculatorProps, SavedCalculation } from './GloBECalculator';

export { SafeHarbourQualifier } from './SafeHarbourQualifier';
export type { SafeHarbourQualifierProps, SavedAssessment } from './SafeHarbourQualifier';

export { FilingDeadlineCalculator } from './FilingDeadlineCalculator';
export type { FilingDeadlineCalculatorProps, SavedDeadlineCalculation } from './FilingDeadlineCalculator';

export { GIRPracticeForm } from './GIRPracticeForm';
export type { GIRPracticeFormProps, SavedPracticeSession } from './GIRPracticeForm';

// Calculator registry - maps calculator IDs to their components
import { GloBECalculator } from './GloBECalculator';
import { SafeHarbourQualifier } from './SafeHarbourQualifier';
import { FilingDeadlineCalculator } from './FilingDeadlineCalculator';
import { GIRPracticeForm } from './GIRPracticeForm';
import type { ComponentType } from 'react';

export const CALCULATOR_COMPONENTS: Record<string, ComponentType<any>> = {
  'gir-globe-calculator': GloBECalculator,
  'globe-calculator': GloBECalculator, // alias
  'gir-safe-harbour-qualifier': SafeHarbourQualifier,
  'safe-harbour-qualifier': SafeHarbourQualifier, // alias
  'gir-filing-deadline-calculator': FilingDeadlineCalculator,
  'filing-deadline-calculator': FilingDeadlineCalculator, // alias
  'gir-practice-form': GIRPracticeForm,
};

export function getCalculatorComponent(calculatorId: string): ComponentType<any> | null {
  return CALCULATOR_COMPONENTS[calculatorId] || null;
}
