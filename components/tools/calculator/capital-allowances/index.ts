/**
 * Capital Allowances Computation — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CapitalAllowances, default } from './CapitalAllowances';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  EntityType,
  AssetCategory,
  PoolId,
  ReliefType,
  ReliefElection,
  CO2Band,
  ValidationSeverity,

  // Input types
  AccountingPeriod,
  PoolsBroughtForward,
  AssetAddition,
  AssetDisposal,
  CAInputs,

  // Output types
  AdditionClassification,
  PoolResult,
  ReliefTotals,
  PeriodInfo,
  AllowancesSummary,
  ExamLayoutRow,
  ValidationResult,
  CAOutput,

  // Tracking callbacks
  AdditionAddEvent,
  AdditionRemoveEvent,
  DisposalAddEvent,
  DisposalRemoveEvent,
  ReliefElectionEvent,
  ComputeEvent,
  CAValidationEvent,
  CAResetEvent,
  CAScenarioLoadEvent,
  CACallbacks,

  // Configuration
  CAConfig,

  // Component props
  CapitalAllowancesProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  MAIN_POOL_WDA_RATE,
  SPECIAL_RATE_WDA_RATE,
  AIA_ANNUAL_LIMIT,
  FULL_EXPENSING_RATE,
  SPECIAL_RATE_FYA_RATE,
  ZERO_EMISSION_FYA_RATE,
  SMALL_POOL_THRESHOLD,
  CO2_ZERO,
  CO2_LOW_MAX,
  STANDARD_YEAR_DAYS,

  // Period calculations
  calculatePeriodDays,
  getPeriodInfo,
  calculateAIAAvailable,

  // Asset classification
  getCO2Band,
  getTargetPool,
  isFullExpensingEligible,
  isZeroEmissionCarEligible,
  isSpecialRateFYAEligible,
  isAIAEligible,
  determineReliefType,
  classifyAdditions,

  // Pool computation
  computePool,

  // Exam layout
  generateExamLayout,

  // Validation
  validateInputs,
  summariseValidation,

  // Full computation
  computeAllowances,

  // Defaults
  createEmptyInputs,
  generateId,
  createEmptyAddition,
  createEmptyDisposal,

  // Formatting
  formatCurrency,
  formatPounds,
  formatPercent,
  getCategoryName,
  getReliefName,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  scenarioToInputs,
} from './utils';
