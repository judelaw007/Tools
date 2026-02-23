/**
 * Corporation Tax Computation with Marginal Relief — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CtComputation, default } from './CtComputation';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  RateBand,
  ValidationSeverity,

  // Input types
  AccountingPeriod,
  IncomeComponents,
  Deductions,
  AugmentedProfitsAdjustment,
  AssociatedCompanies,
  CTInputs,

  // Output types
  PeriodInfo,
  TTPComputation,
  ThresholdCalc,
  AugmentedProfitsCalc,
  RateBandResult,
  MarginalReliefCalc,
  CTLiabilityCalc,
  KeyDates,
  CT600Row,
  ValidationResult,
  CTOutput,

  // Tracking callbacks
  InputChangeEvent,
  CTComputeEvent,
  CTValidationEvent,
  CTResetEvent,
  CTScenarioLoadEvent,
  RateBandViewEvent,
  MarginalReliefViewEvent,
  CT600ViewEvent,
  CTCallbacks,

  // Configuration
  CTConfig,

  // Component props
  CtComputationProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  CT_MAIN_RATE,
  CT_SMALL_PROFITS_RATE,
  STANDARD_FRACTION,
  UPPER_LIMIT,
  LOWER_LIMIT,
  QIP_THRESHOLD,
  MAX_AP_DAYS,
  DAYS_IN_YEAR,
  MARGINAL_RATE,

  // Period calculation
  calculatePeriodDays,
  calculatePeriodInfo,

  // TTP computation
  calculateTTP,

  // Thresholds
  calculateThresholds,

  // Augmented profits
  calculateAugmentedProfits,

  // Rate band
  determineRateBand,

  // Marginal relief
  calculateMarginalRelief,

  // CT liability
  calculateCTLiability,

  // Key dates
  calculateKeyDates,

  // CT600 layout
  generateCT600Layout,

  // Validation
  validateInputs,
  summariseValidation,

  // Full computation
  computeCT,

  // Defaults
  createEmptyInputs,

  // Formatting
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentDecimal,
  formatDate,
  getRateBandDisplayName,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  scenarioToInputs,
} from './utils';
