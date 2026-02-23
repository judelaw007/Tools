/**
 * Salary vs Dividend Profit Extraction Optimiser — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { ProfitExtraction, default } from './ProfitExtraction';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  TaxYear,
  ExtractionMethod,
  StrategyType,
  ValidationSeverity,
  IncomeType,

  // Tax rate structures
  TaxBand,
  NICThresholds,
  CTRates,
  TaxRates,

  // Input types
  CompanyInputs,
  ExtractionInputs,
  PersonalInputs,
  ProfitExtractionInputs,

  // Output types
  MethodTaxBreakdown,
  StrategyResult,
  ValidationResult,
  ProfitExtractionOutput,

  // Tracking callbacks
  InputChangeEvent,
  CalculateEvent,
  ValidationEvent,
  StrategySelectEvent,
  HintEvent,
  ResetEvent,
  ScenarioLoadEvent,
  ComparisonViewEvent,
  ProfitExtractionCallbacks,

  // Configuration
  ProfitExtractionConfig,

  // Component props
  ProfitExtractionProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Tax rate lookup
  getTaxRates,

  // Labels and tooltips
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Formatting
  roundToPounds,
  formatGBP,
  formatPercent,

  // Personal allowance
  calculatePersonalAllowance,

  // Income tax
  calculateIncomeTax,
  calculateDividendTax,

  // NIC
  calculateEmployeeNIC,
  calculateEmployerNIC,

  // Corporation tax
  calculateCorporationTax,
  marginalCTRate,

  // Strategy calculation
  calculateStrategy,
  calculateNICEfficiencyPoint,

  // Validation
  validateInputs,
  summariseValidation,

  // Recommendation
  generateRecommendation,

  // Full calculation
  calculateExtraction,

  // Defaults
  createEmptyInputs,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
} from './utils';
