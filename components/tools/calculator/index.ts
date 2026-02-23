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

export { DFEAssessmentTool } from './DFEAssessmentTool';
export type { DFEAssessmentToolProps, SavedDFEAssessment } from './DFEAssessmentTool';

export { AuditFileChecklist } from './AuditFileChecklist';
export type { AuditFileChecklistProps, SavedAuditChecklist } from './AuditFileChecklist';

export { VATReturn } from './VATReturn';
export type { VATReturnProps, SavedVATReturnData } from './VATReturn';

export { CCL100Return } from './ccl100-return';
export type { CCL100ReturnProps } from './ccl100-return';

export { CDSImportDeclaration } from './cds-import-declaration';
export type { CDSImportDeclarationProps } from './cds-import-declaration';

export { CustomsValuationWorksheet } from './customs-valuation-worksheet';
export type { CustomsValuationWorksheetProps } from './customs-valuation-worksheet';

export { UKTradeTariffLookup } from './uk-trade-tariff-lookup';
export type { UKTradeTariffLookupProps } from './uk-trade-tariff-lookup';

export { BadrChecker } from './badr-checker';
export type { BadrCheckerProps } from './badr-checker';

export { CapitalAllowances } from './capital-allowances';
export type { CapitalAllowancesProps } from './capital-allowances';

export { CestStatus } from './cest-status';
export type { CestStatusProps } from './cest-status';

export { CtComputation } from './ct-computation';
export type { CtComputationProps } from './ct-computation';

export { PenpCalculator } from './penp-calculator';
export type { PenpCalculatorProps } from './penp-calculator';

export { ProfitExtraction } from './profit-extraction';
export type { ProfitExtractionProps } from './profit-extraction';

export { S455Calculator } from './s455-calculator';
export type { S455CalculatorProps } from './s455-calculator';

// Calculator registry - maps calculator IDs to their components
import { GloBECalculator } from './GloBECalculator';
import { SafeHarbourQualifier } from './SafeHarbourQualifier';
import { FilingDeadlineCalculator } from './FilingDeadlineCalculator';
import { GIRPracticeForm } from './GIRPracticeForm';
import { DFEAssessmentTool } from './DFEAssessmentTool';
import { AuditFileChecklist } from './AuditFileChecklist';
import { VATReturn } from './VATReturn';
import { CCL100Return } from './ccl100-return';
import { CDSImportDeclaration } from './cds-import-declaration';
import { CustomsValuationWorksheet } from './customs-valuation-worksheet';
import { UKTradeTariffLookup } from './uk-trade-tariff-lookup';
import { BadrChecker } from './badr-checker';
import { CapitalAllowances } from './capital-allowances';
import { CestStatus } from './cest-status';
import { CtComputation } from './ct-computation';
import { PenpCalculator } from './penp-calculator';
import { ProfitExtraction } from './profit-extraction';
import { S455Calculator } from './s455-calculator';
import type { ComponentType } from 'react';

export const CALCULATOR_COMPONENTS: Record<string, ComponentType<any>> = {
  'gir-globe-calculator': GloBECalculator,
  'globe-calculator': GloBECalculator, // alias
  'gir-safe-harbour-qualifier': SafeHarbourQualifier,
  'safe-harbour-qualifier': SafeHarbourQualifier, // alias
  'gir-filing-deadline-calculator': FilingDeadlineCalculator,
  'filing-deadline-calculator': FilingDeadlineCalculator, // alias
  'gir-practice-form': GIRPracticeForm,
  'gir-dfe-assessment': DFEAssessmentTool,
  'dfe-assessment-tool': DFEAssessmentTool, // alias
  'gir-audit-file-checklist': AuditFileChecklist,
  'audit-file-checklist': AuditFileChecklist, // alias
  'vat-return-boxes-1-9': VATReturn,
  'vat-return': VATReturn, // alias
  'ccl100-return': CCL100Return,
  'cds-import-declaration': CDSImportDeclaration,
  'customs-valuation-worksheet': CustomsValuationWorksheet,
  'uk-trade-tariff-lookup': UKTradeTariffLookup,
  'badr-checker': BadrChecker,
  'capital-allowances': CapitalAllowances,
  'cest-status': CestStatus,
  'ct-computation': CtComputation,
  'penp-calculator': PenpCalculator,
  'profit-extraction': ProfitExtraction,
  's455-calculator': S455Calculator,
};

export function getCalculatorComponent(calculatorId: string): ComponentType<any> | null {
  return CALCULATOR_COMPONENTS[calculatorId] || null;
}
