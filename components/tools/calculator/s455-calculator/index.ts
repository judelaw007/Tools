/**
 * s.455 Loans to Participators Calculator — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { S455Calculator, default } from './S455Calculator';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  TaxBand,
  ValidationSeverity,
  TimelineEventType,

  // Input types
  AccountingPeriod,
  DLAMovements,
  Repayment,
  Reborrowing,
  WriteOffDetails,
  S455Inputs,

  // Output types
  BalanceTracker,
  BedAndBreakfastMatch,
  BedAndBreakfastResult,
  S455Computation,
  KeyDates,
  WriteOffAnalysis,
  TimelineEvent,
  ValidationResult,
  S455Output,

  // Tracking callbacks
  APChangeEvent,
  S455ComputeEvent,
  S455ValidationEvent,
  BedAndBreakfastViewEvent,
  WriteOffToggleEvent,
  S455ResetEvent,
  S455ScenarioLoadEvent,
  TimelineViewEvent,
  S455Callbacks,

  // Configuration
  S455Config,

  // Component props
  S455CalculatorProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  S455_RATE,
  S455_RATE_2016,
  S455_RATE_PRE_2016,
  OFFICIAL_RATE,
  BED_AND_BREAKFAST_DAYS,
  BED_AND_BREAKFAST_DE_MINIMIS,
  DIVIDEND_ALLOWANCE,
  DIVIDEND_RATES,
  INCOME_TAX_RATES,
  EMPLOYER_NIC_RATE,
  MAX_AP_DAYS,

  // Date utilities
  daysBetween,
  nineMonthsAndOneDay,
  twelveMonthsAfter,

  // DLA balance computation
  computeRawClosingBalance,

  // s.464C bed-and-breakfast
  checkBedAndBreakfast,

  // s.455 tax computation
  computeS455Tax,

  // Key dates
  computeKeyDates,

  // Write-off analysis
  analyseWriteOff,

  // Timeline
  generateTimeline,

  // Validation
  validateInputs,
  summariseValidation,

  // Full computation
  computeS455,

  // Defaults
  createEmptyInputs,
  generateId,

  // Formatting
  formatCurrency,
  formatPounds,
  formatPoundsPence,
  formatPercent,
  formatPercentWhole,
  formatDate,
  formatDateShort,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  scenarioToInputs,
} from './utils';
