/**
 * BADR Eligibility Checker and Calculator — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { BadrChecker, default } from './BadrChecker';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  DisposalType,
  TaxYear,
  EligibilityStatus,
  ConditionStatus,
  ValidationSeverity,

  // Input types
  DisposalDetails,
  GainInputs,
  ShareholdingDetails,
  CompanyStatus,
  AssociatedDisposalDetails,
  TaxpayerDetails,
  BADRInputs,

  // Output types
  ConditionResult,
  EligibilityResult,
  CGTComputation,
  LifetimeAllowance,
  AssociatedDisposalCalc,
  RateComparison,
  ValidationResult,
  BADROutput,

  // Tracking callbacks
  DisposalTypeChangeEvent,
  EligibilityCheckEvent,
  BADRComputeEvent,
  BADRValidationEvent,
  ConditionToggleEvent,
  BADRResetEvent,
  BADRScenarioLoadEvent,
  ComparisonViewEvent,
  BADRCallbacks,

  // Configuration
  BADRConfig,

  // Component props
  BadrCheckerProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  BADR_RATES,
  CGT_BASIC_RATE,
  CGT_HIGHER_RATE,
  ANNUAL_EXEMPT_AMOUNT,
  LIFETIME_LIMIT,
  MIN_HOLDING_YEARS,
  MIN_SHAREHOLDING_PERCENT,
  MIN_VOTING_PERCENT,
  MIN_TRADING_PERCENT,
  BASIC_RATE_BAND,
  DAYS_PER_YEAR,

  // Tax year determination
  getTaxYear,
  getBADRRate,
  getTaxYearDisplayName,

  // Holding period
  calculateHoldingPeriod,
  meetsHoldingPeriod,
  formatHoldingPeriod,

  // Eligibility assessment
  checkSharesConditions,
  checkBusinessAssetsConditions,
  checkAssociatedDisposalConditions,
  determineEligibility,
  assessEligibility,

  // Associated disposal
  calculateAssociatedDisposal,

  // CGT computation
  computeCGT,

  // Lifetime allowance
  calculateLifetimeAllowance,

  // Rate comparison
  calculateRateComparison,

  // Validation
  validateInputs,
  summariseValidation,

  // Full assessment
  assessBADR,

  // Defaults
  createEmptyInputs,

  // Formatting
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentDecimal,
  formatDate,
  getDisposalTypeName,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  scenarioToInputs,
} from './utils';
