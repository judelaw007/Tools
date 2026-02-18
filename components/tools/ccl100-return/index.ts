/**
 * CCL100 Return — Public Exports
 *
 * Entry point for the MojiTax Tools platform.
 */

// ─── Component ──────────────────────────────────────────────────────────────────
export { CCL100Return, default } from './CCL100Return';

// ─── Types ──────────────────────────────────────────────────────────────────────
export type {
  // Literal types
  Commodity,
  BoxNumber,
  MainRateBoxNumber,
  CPSBoxNumber,
  CCLPosition,
  RatePeriod,
  ExemptionType,
  ValidationSeverity,
  ValidationRuleId,

  // Rate structures
  CommodityRate,
  RateTable,

  // Input structures
  AccountingPeriod,
  CommodityInput,
  CCADetails,
  CCL100Inputs,

  // Calculation structures
  CalculationStep,
  CommodityBreakdown,

  // Validation
  ValidationResult,

  // Output
  RateReference,
  CCL100Output,

  // Tracking callbacks
  CommodityEntryEvent,
  CCLValidationEvent,
  CCLSubmitEvent,
  CCLHintEvent,
  CCLResetEvent,
  BreakdownViewEvent,
  ScenarioLoadEvent,
  CCL100Callbacks,

  // Configuration
  CCL100Config,

  // Component props
  CCL100ReturnProps,

  // H&C scenarios
  HCScenario,
} from './types';

// ─── Utilities ──────────────────────────────────────────────────────────────────
export {
  // Constants
  FILING_DEADLINE_DAYS,
  ANNUAL_FILING_THRESHOLD,
  COMMODITIES,
  COMMODITY_NAMES,
  COMMODITY_UNITS,
  COMMODITY_BOX_MAP,
  CCA_DISCOUNTS,
  CPS_RATES,

  // Rate tables
  RATE_TABLES,

  // Labels
  BOX_LABELS,
  BOX_TOOLTIPS,
  COMMODITY_EDUCATIONAL_NOTES,
  FIELD_LABELS,
  FIELD_TOOLTIPS,

  // Helpers
  roundToPence,
  formatGBP,
  formatQuantity,
  formatPercent,

  // Rate lookup
  getRatePeriodForDate,
  getRateTableForPeriod,
  getCommodityRate,

  // Defaults
  createEmptyCommodityInput,
  createEmptyCCADetails,
  createDefaultPeriod,
  createEmptyInputs,

  // Calculation
  calculateCommodityBreakdown,
  calculateReturn,

  // Validation
  validateReturn,
  summariseValidation,

  // Rate reference
  buildRateReference,

  // Position
  determinePosition,

  // Full output
  buildReturnOutput,

  // H&C scenarios
  HC_SCENARIOS,
  getScenarioById,
  getScenariosBySection,
} from './utils';
