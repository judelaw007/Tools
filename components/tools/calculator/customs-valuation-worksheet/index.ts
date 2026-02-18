/**
 * Customs Valuation Worksheet — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CustomsValuationWorksheet, default } from './CustomsValuationWorksheet';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  IncotermsCode,
  CurrencyCode,
  ValuationMethod,
  ValidationSeverity,
  BuildUpLineType,
  IncotermsFreightRequirement,

  // Reference data types
  IncotermsProfile,
  CurrencyInfo,

  // Input types
  ValuationAdditions,
  ValuationDeductions,
  ValuationInputs,

  // Output types
  BuildUpLine,
  AdditionsBreakdown,
  DeductionsBreakdown,
  ValuationOutput,

  // Validation
  ValidationRuleId,
  ValidationResult,

  // Configuration
  ValuationConfig,

  // Tracking callbacks
  FieldEntryEvent,
  ValuationValidationEvent,
  CalculateEvent,
  ValuationHintEvent,
  ValuationResetEvent,
  BuildUpViewEvent,
  ScenarioLoadEvent,
  ValuationCallbacks,

  // Component props
  CustomsValuationWorksheetProps,

  // H&C scenarios
  HCValuationScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  STANDARD_VAT_RATE,
  ZERO_VAT_RATE,
  NOTIONAL_INSURANCE_RATE,
  RELATED_PARTY_THRESHOLD,

  // Reference data
  INCOTERMS_PROFILES,
  CURRENCIES,

  // Incoterms helpers
  getIncotermsProfile,
  requiresFreightAdjustment,
  requiresInsuranceAdjustment,
  freightInsuranceIncluded,

  // Currency helpers
  getCurrencyByCode,
  getCurrencySymbol,

  // Formatting
  roundToPence,
  formatGBP,
  formatCurrency,

  // Core calculations
  convertToGBP,
  calculateIncotermsAdjustment,
  calculateAdditions,
  calculateDeductions,
  calculateCustomsValue,
  calculateDuty,
  calculateVATValue,
  calculateImportVAT,
  isMethod1Applicable,

  // Build-up generator
  generateBuildUp,

  // Validation
  validateWorksheet,
  summariseValidation,

  // Full calculation
  calculateValuation,

  // Defaults
  createEmptyInputs,

  // Labels
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // H&C scenarios
  HC_VALUATION_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
} from './utils';
