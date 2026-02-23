/**
 * Corporation Tax Computation with Marginal Relief — TypeScript Interfaces
 *
 * Models a CT computation from taxable total profits through to CT liability,
 * handling income categorisation, augmented profits, associated company
 * threshold division, marginal relief, and short-period apportionment.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Rate band determination */
export type RateBand = 'small-profits' | 'marginal' | 'main-rate';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Accounting period dates */
export interface AccountingPeriod {
  /** First day of the accounting period (ISO date string YYYY-MM-DD) */
  periodStart: string;
  /** Last day of the accounting period (ISO date string YYYY-MM-DD) */
  periodEnd: string;
}

/** Income components feeding into total profits */
export interface IncomeComponents {
  /** Trading profits after capital allowances */
  tradingProfits: number;
  /** Loan relationship income (can be negative if deficit) */
  loanRelationshipIncome: number;
  /** Net property income */
  propertyIncome: number;
  /** Chargeable gains (after capital losses) */
  chargeableGains: number;
}

/** Deductions from total profits */
export interface Deductions {
  /** Qualifying charitable donations (Gift Aid) */
  qualifyingCharitableDonations: number;
}

/** Augmented profits adjustment */
export interface AugmentedProfitsAdjustment {
  /** Exempt ABGH distributions received */
  exemptDistributions: number;
}

/** Associated company details */
export interface AssociatedCompanies {
  /** Total number of associated companies including the company itself */
  associatedCompanyCount: number;
}

/** Complete input set */
export interface CTInputs {
  /** Accounting period dates */
  accountingPeriod: AccountingPeriod;
  /** Income components */
  income: IncomeComponents;
  /** Deductions from total profits */
  deductions: Deductions;
  /** Augmented profits adjustment */
  augmentedProfitsAdj: AugmentedProfitsAdjustment;
  /** Associated company details */
  associatedCompanies: AssociatedCompanies;
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** Accounting period information */
export interface PeriodInfo {
  /** Number of days in the accounting period */
  periodDays: number;
  /** Whether this is a short period (< 365 days) */
  isShortPeriod: boolean;
  /** Apportionment fraction (periodDays / 365) — used for short periods */
  apportionmentFraction: number;
  /** Formatted period string (e.g. "1 April 2025 to 31 March 2026") */
  periodDisplay: string;
}

/** TTP step-by-step computation */
export interface TTPComputation {
  /** Trading profits (after CA) */
  tradingProfits: number;
  /** Loan relationship income */
  loanRelationshipIncome: number;
  /** Property income */
  propertyIncome: number;
  /** Chargeable gains */
  chargeableGains: number;
  /** Total profits (sum of all income) */
  totalProfits: number;
  /** QCD actually deducted (may be capped at total profits) */
  qcdDeducted: number;
  /** Whether QCD was capped */
  qcdWasCapped: boolean;
  /** Taxable total profits */
  taxableTotalProfits: number;
}

/** Threshold calculation detail */
export interface ThresholdCalc {
  /** Number of associated companies (including the company) */
  associatedCompanyCount: number;
  /** Upper limit before apportionment (£250,000 ÷ N) */
  upperLimitDivided: number;
  /** Lower limit before apportionment (£50,000 ÷ N) */
  lowerLimitDivided: number;
  /** Upper limit after short-period apportionment */
  upperLimit: number;
  /** Lower limit after short-period apportionment */
  lowerLimit: number;
  /** Whether short-period apportionment was applied */
  apportioned: boolean;
  /** Apportionment fraction used */
  apportionmentFraction: number;
}

/** Augmented profits calculation */
export interface AugmentedProfitsCalc {
  /** TTP */
  taxableTotalProfits: number;
  /** Exempt ABGH distributions */
  exemptDistributions: number;
  /** Augmented profits = TTP + exempt distributions */
  augmentedProfits: number;
  /** Whether augmented profits differ from TTP */
  hasFrankedIncome: boolean;
}

/** Rate band determination */
export interface RateBandResult {
  /** Determined rate band */
  rateBand: RateBand;
  /** Explanation of why this band applies */
  explanation: string;
  /** The effective CT rate for this band (19%, 25%, or between) */
  applicableRate: number;
}

/** Marginal relief calculation detail */
export interface MarginalReliefCalc {
  /** Whether marginal relief applies */
  applies: boolean;
  /** Standard fraction (3/200) */
  standardFraction: number;
  /** Upper limit used in formula */
  upperLimit: number;
  /** Augmented profits used in formula */
  augmentedProfits: number;
  /** TTP used in formula (N in N/A fraction) */
  taxableTotalProfits: number;
  /** (U − A) component */
  upperMinusAugmented: number;
  /** N/A fraction (TTP / augmented profits) */
  naFraction: number;
  /** Marginal relief amount */
  marginalRelief: number;
  /** Formatted formula string */
  formulaDisplay: string;
}

/** CT liability computation */
export interface CTLiabilityCalc {
  /** CT at main rate (25%) — always computed for comparison */
  ctAtMainRate: number;
  /** CT at small profits rate (19%) — always computed for comparison */
  ctAtSmallProfitsRate: number;
  /** Marginal relief (zero if not applicable) */
  marginalRelief: number;
  /** Final CT liability */
  ctLiability: number;
  /** Effective rate (ctLiability / TTP) */
  effectiveRate: number;
}

/** Key compliance dates */
export interface KeyDates {
  /** CT payment due date (9 months + 1 day after AP end) */
  paymentDueDate: string;
  /** CT600 filing deadline (12 months after AP end) */
  filingDeadline: string;
  /** Whether quarterly instalment payments may apply */
  qipsMayApply: boolean;
  /** QIP threshold (£1.5m / associated companies) */
  qipThreshold: number;
}

/** CT600-format layout row */
export interface CT600Row {
  /** Row label */
  label: string;
  /** Amount (may be absent for header/spacer rows) */
  amount?: number;
  /** Row type for formatting */
  type: 'income' | 'total' | 'deduction' | 'subtotal' | 'result' | 'header' | 'spacer' | 'note';
  /** Whether the row is indented */
  indent?: boolean;
  /** Whether to show a bold line */
  bold?: boolean;
}

/** Validation result */
export interface ValidationResult {
  /** Rule identifier (V1-V9) */
  ruleId: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable message */
  message: string;
  /** Whether the rule passed */
  passed: boolean;
}

/** Complete computation output */
export interface CTOutput {
  /** Period information */
  periodInfo: PeriodInfo;
  /** TTP computation */
  ttpComputation: TTPComputation;
  /** Threshold calculation */
  thresholdCalc: ThresholdCalc;
  /** Augmented profits calculation */
  augmentedProfitsCalc: AugmentedProfitsCalc;
  /** Rate band determination */
  rateBandResult: RateBandResult;
  /** Marginal relief detail */
  marginalReliefCalc: MarginalReliefCalc;
  /** CT liability */
  ctLiabilityCalc: CTLiabilityCalc;
  /** Key dates */
  keyDates: KeyDates;
  /** CT600-format layout rows */
  ct600Layout: CT600Row[];
  /** Validation results */
  validationResults: ValidationResult[];
  /** Validation summary */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// ─── Tracking Callbacks ────────────────────────────────────────────────────────

/** Payload for onInputChange */
export interface InputChangeEvent {
  field: string;
  value: number | string;
  timestamp: number;
}

/** Payload for onCompute */
export interface CTComputeEvent {
  ttp: number;
  augmentedProfits: number;
  ctLiability: number;
  effectiveRate: number;
  rateBand: RateBand;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface CTValidationEvent {
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/** Payload for onReset */
export interface CTResetEvent {
  previousResult: CTOutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface CTScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onRateBandView */
export interface RateBandViewEvent {
  rateBand: RateBand;
  upperLimit: number;
  lowerLimit: number;
  augmentedProfits: number;
  timestamp: number;
}

/** Payload for onMarginalReliefView */
export interface MarginalReliefViewEvent {
  formula: string;
  relief: number;
  ctBefore: number;
  ctAfter: number;
  timestamp: number;
}

/** Payload for onCT600View */
export interface CT600ViewEvent {
  ttp: number;
  ctLiability: number;
  timestamp: number;
}

/** All tracking callbacks */
export interface CTCallbacks {
  onInputChange?: (event: InputChangeEvent) => void;
  onCompute?: (event: CTComputeEvent) => void;
  onValidation?: (event: CTValidationEvent) => void;
  onReset?: (event: CTResetEvent) => void;
  onScenarioLoad?: (event: CTScenarioLoadEvent) => void;
  onRateBandView?: (event: RateBandViewEvent) => void;
  onMarginalReliefView?: (event: MarginalReliefViewEvent) => void;
  onCT600View?: (event: CT600ViewEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface CTConfig {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show CT600 layout by default */
  showCT600Layout: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the CtComputation React component */
export interface CtComputationProps {
  /** Configuration */
  config: CTConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: CTCallbacks;
  /** Override tooltip visibility */
  showTooltips?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ───────────────────────────────────────────────────────

/** Pre-configured test scenario for H&C storyline */
export interface HCScenario {
  /** Scenario identifier */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description */
  description: string;
  /** Pre-filled inputs */
  preFilledInputs: CTInputs;
  /** Expected CT liability (for verification) */
  expectedCTLiability: number;
  /** Expected rate band */
  expectedRateBand: RateBand;
  /** Expected effective rate */
  expectedEffectiveRate: number;
  /** Teaching hints keyed by topic */
  hints: Record<string, string[]>;
}
