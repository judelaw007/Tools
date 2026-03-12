/**
 * Transitional CbCR Safe Harbour Assessment (T-SHQ)
 *
 * Multi-jurisdiction safe harbour qualifier using CbCR Table 2 data.
 * Tests each jurisdiction against three transitional safe harbour tests
 * (de minimis, simplified ETR, routine profits) per OECD AG Chapter 2.
 *
 * @module safe-harbour-qualifier
 */

// ── Component ────────────────────────────────────────────────────────
export { default as SafeHarbourQualifier } from './SafeHarbourQualifier';

// ── Types ────────────────────────────────────────────────────────────
export type {
  SafeHarbourFiscalYear,
  TransitionRate,
  Currency,
  JurisdictionCbCRData,
  DeMinimisResult,
  SimplifiedETRResult,
  RoutineProfitsResult,
  JurisdictionAssessment,
  AssessmentResult,
  SafeHarbourStep,
  StepConfig,
  SavedAssessment,
  SafeHarbourQualifierProps,
  SelectOption,
  ValidationError,
} from './types';

// ── Utilities ────────────────────────────────────────────────────────
export {
  // Constants
  DE_MINIMIS_REVENUE_THRESHOLD,
  DE_MINIMIS_PROFIT_THRESHOLD,
  MINIMUM_RATE,
  TRANSITION_RATES,
  STEP_CONFIGS,
  JURISDICTION_OPTIONS,
  CURRENCY_OPTIONS,
  FISCAL_YEAR_OPTIONS,
  EDUCATIONAL_NOTES,
  TEST_GUIDANCE,

  // Core computation
  getTransitionRate,
  calculateDeMinimis,
  calculateSimplifiedETR,
  calculateRoutineProfits,
  assessJurisdiction,
  runFullAssessment,

  // Validation
  validateGroupInfo,
  validateJurisdictions,

  // Formatting helpers
  formatEUR,
  formatCurrency,
  formatPercent,
  parseNumeric,

  // State helpers
  createInitialJurisdiction,
  generateAssessmentId,

  // H&C test data
  CASE_STUDY_GROUP_NAME,
  CASE_STUDY_FISCAL_YEAR,
  CASE_STUDY_JURISDICTIONS,
} from './utils';
