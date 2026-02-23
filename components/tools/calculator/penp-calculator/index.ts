/**
 * Termination Payment Analyser (PENP Calculator) — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { PenpCalculator, default } from './PenpCalculator';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  PayPeriodType,
  TaxYear,
  TaxTreatment,
  EmployerNICType,
  ValidationSeverity,

  // Input types
  EmployeeDetails,
  PayDetails,
  NoticeDetails,
  TerminationComponents,
  RedundancySettings,
  PENPInputs,

  // Output types
  PENPCalculation,
  ClassifiedComponent,
  ExemptionCalculation,
  EmployerNICComputation,
  RedundancyYearEntry,
  RedundancyCrossCheck,
  TerminationSummary,
  ValidationResult,
  PENPOutput,

  // Tracking callbacks
  InputChangeEvent,
  PENPComputeEvent,
  PENPValidationEvent,
  ComponentViewEvent,
  PENPResetEvent,
  PENPScenarioLoadEvent,
  ExemptionViewEvent,
  RedundancyCheckEvent,
  PENPCallbacks,

  // Configuration
  PENPConfig,

  // Component props
  PenpCalculatorProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  PAY_PERIOD_DAYS,
  THIRTY_THOUSAND_EXEMPTION,
  EMPLOYER_NIC_RATES,
  DEFAULT_CAPPED_WEEKLY_PAY,
  MAX_REDUNDANCY_YEARS,
  REDUNDANCY_MULTIPLIERS,

  // Tax year determination
  getTaxYear,
  getEmployerNICRate,
  getTaxYearDisplayName,

  // Date & age utilities
  calculateAge,
  calculateCompleteYears,

  // Pay period
  getPayPeriodDays,
  getPayPeriodTypeName,

  // PENP calculation
  calculateUnservedNoticeDays,
  calculatePENP,

  // Component classification
  classifyComponents,

  // £30,000 exemption
  calculateExemption,

  // Employer NIC
  computeEmployerNIC,

  // Statutory redundancy
  calculateStatutoryRedundancy,

  // Validation
  validateInputs,
  summariseValidation,

  // Full analysis
  analysePENP,

  // Defaults
  createEmptyInputs,

  // Formatting
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentDecimal,
  formatDate,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  scenarioToInputs,
} from './utils';
