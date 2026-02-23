/**
 * Salary vs Dividend Profit Extraction Optimiser — TypeScript Interfaces
 *
 * Models the comparison of profit extraction methods (salary, dividends,
 * pension, rent) for UK owner-managed business director-shareholders.
 * All monetary values in GBP, whole pounds (no pence).
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Supported tax years */
export type TaxYear = '2025/26' | '2026/27';

/** Extraction method types */
export type ExtractionMethod = 'salary' | 'dividend' | 'pension' | 'rent';

/** Pre-built strategy types */
export type StrategyType = 'salary-only' | 'dividend-only' | 'optimal-mix' | 'custom';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Income type for band stacking */
export type IncomeType = 'non-savings' | 'savings' | 'dividend';

// ─── Tax Rate Structures ───────────────────────────────────────────────────────

/** Income tax band definition */
export interface TaxBand {
  /** Band name for display */
  name: string;
  /** Lower bound (inclusive) */
  from: number;
  /** Upper bound (exclusive, Infinity for top band) */
  to: number;
  /** Tax rate as decimal (e.g. 0.20 for 20%) */
  rate: number;
}

/** NIC threshold definition */
export interface NICThresholds {
  /** Lower Earnings Limit — below this, no NIC record */
  lel: number;
  /** Primary Threshold — employee NIC starts above this */
  pt: number;
  /** Upper Earnings Limit — employee rate drops above this */
  uel: number;
  /** Secondary Threshold — employer NIC starts above this */
  st: number;
  /** Employee rate between PT and UEL */
  employeeMainRate: number;
  /** Employee rate above UEL */
  employeeUpperRate: number;
  /** Employer rate above ST */
  employerRate: number;
  /** Employment Allowance amount */
  employmentAllowance: number;
}

/** Corporation tax rate structure */
export interface CTRates {
  /** Small profits rate (e.g. 0.19) */
  smallProfitsRate: number;
  /** Main rate (e.g. 0.25) */
  mainRate: number;
  /** Lower profit limit (undivided) */
  lowerLimit: number;
  /** Upper profit limit (undivided) */
  upperLimit: number;
  /** Marginal relief fraction numerator (e.g. 3) */
  mrNumerator: number;
  /** Marginal relief fraction denominator (e.g. 200) */
  mrDenominator: number;
}

/** Complete tax rates for a given year */
export interface TaxRates {
  /** Tax year label */
  year: TaxYear;
  /** Personal allowance */
  personalAllowance: number;
  /** PA taper threshold (income above which PA starts reducing) */
  paTaperThreshold: number;
  /** Basic rate band (amount, not ceiling) */
  basicRateBand: number;
  /** Non-savings income tax bands */
  incomeTaxBands: TaxBand[];
  /** Dividend tax bands */
  dividendBands: TaxBand[];
  /** Dividend allowance */
  dividendAllowance: number;
  /** NIC thresholds and rates */
  nic: NICThresholds;
  /** Corporation tax rates */
  ct: CTRates;
  /** Pension annual allowance */
  pensionAnnualAllowance: number;
  /** Pension taper threshold (adjusted income above which AA reduces) */
  pensionTaperThreshold: number;
  /** Minimum pension annual allowance after tapering */
  pensionMinAllowance: number;
}

// ─── Input Interfaces ──────────────────────────────────────────────────────────

/** Company-level inputs */
export interface CompanyInputs {
  /** Company profit before extraction (TTP before salary deduction) */
  companyProfit: number;
  /** Number of associated companies (minimum 1 — the company itself) */
  associatedCompanies: number;
  /** Whether Employment Allowance is available */
  employmentAllowance: boolean;
}

/** Extraction strategy inputs */
export interface ExtractionInputs {
  /** Annual gross salary */
  salaryAmount: number;
  /** Annual gross dividends */
  dividendAmount: number;
  /** Annual employer pension contribution */
  pensionContribution: number;
  /** Annual rent paid to director (optional) */
  rentalPayment: number;
}

/** Personal tax context inputs */
export interface PersonalInputs {
  /** Other personal income outside the company */
  otherIncome: number;
  /** Dividends from other companies */
  otherDividends: number;
  /** Selected tax year */
  taxYear: TaxYear;
}

/** Complete input set */
export interface ProfitExtractionInputs {
  company: CompanyInputs;
  extraction: ExtractionInputs;
  personal: PersonalInputs;
}

// ─── Output Interfaces ─────────────────────────────────────────────────────────

/** Tax breakdown for a single extraction method */
export interface MethodTaxBreakdown {
  /** Extraction method */
  method: ExtractionMethod;
  /** Gross extraction amount */
  grossAmount: number;
  /** CT impact: positive = CT payable on profit used, negative = CT saved by deduction */
  corporationTaxImpact: number;
  /** Employer Class 1 NIC (salary only) */
  employerNIC: number;
  /** Employee Class 1 NIC (salary only) */
  employeeNIC: number;
  /** Income tax on the amount (at appropriate rate) */
  incomeTax: number;
  /** Total tax cost (all taxes and NIC combined) */
  totalTaxCost: number;
  /** Net amount received by the director */
  netReceipt: number;
  /** Effective tax rate (totalTaxCost / grossAmount) */
  effectiveRate: number;
}

/** Combined strategy result */
export interface StrategyResult {
  /** Strategy type */
  strategyType: StrategyType;
  /** Strategy label for display */
  label: string;
  /** Per-method breakdowns */
  methods: MethodTaxBreakdown[];
  /** Total gross extraction */
  totalExtracted: number;
  /** Total tax cost across all methods */
  totalTaxCost: number;
  /** Total net receipt across all methods */
  totalNetReceipt: number;
  /** Overall effective tax rate */
  overallEffectiveRate: number;
  /** Company profit remaining after extraction */
  companyProfitRemaining: number;
  /** CT on remaining profit */
  companyTaxOnRemaining: number;
  /** NIC efficiency point (salary level where marginal NIC exceeds marginal CT saving) */
  nicEfficiencyPoint: number;
}

/** Validation result */
export interface ValidationResult {
  /** Rule identifier */
  ruleId: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable explanation */
  message: string;
  /** Which fields are affected */
  affectedFields: string[];
  /** Whether the rule passed */
  passed: boolean;
}

/** Complete calculation output */
export interface ProfitExtractionOutput {
  /** User's custom strategy result */
  customStrategy: StrategyResult;
  /** Pre-built comparison strategies */
  comparisonStrategies: StrategyResult[];
  /** The optimal strategy (highest net receipt) */
  optimalStrategy: StrategyResult;
  /** Validation results */
  validationResults: ValidationResult[];
  /** Validation summary */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
    passed: number;
    total: number;
  };
  /** Plain-English recommendation */
  recommendation: string;
  /** Personal allowance after taper (if applicable) */
  effectivePersonalAllowance: number;
  /** Marginal rate analysis at current extraction level */
  marginalRates: {
    /** Marginal cost of £1 more salary */
    salaryMarginalRate: number;
    /** Marginal cost of £1 more dividend */
    dividendMarginalRate: number;
  };
}

// ─── Tracking Callbacks ────────────────────────────────────────────────────────

/** Payload for onInputChange */
export interface InputChangeEvent {
  field: string;
  value: number | boolean | string;
  timestamp: number;
}

/** Payload for onCalculate */
export interface CalculateEvent {
  strategyType: StrategyType;
  totalTaxCost: number;
  netReceipt: number;
  effectiveRate: number;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface ValidationEvent {
  validationResults: ValidationResult[];
  passCount: number;
  failCount: number;
  timestamp: number;
}

/** Payload for onStrategySelect */
export interface StrategySelectEvent {
  strategyType: StrategyType;
  timestamp: number;
}

/** Payload for onHint */
export interface HintEvent {
  field: string;
  hintType: 'tooltip' | 'explanation' | 'example';
  timestamp: number;
}

/** Payload for onReset */
export interface ResetEvent {
  previousAttempt: ProfitExtractionOutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface ScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onComparisonView */
export interface ComparisonViewEvent {
  timestamp: number;
}

/** All tracking callbacks */
export interface ProfitExtractionCallbacks {
  onInputChange?: (event: InputChangeEvent) => void;
  onCalculate?: (event: CalculateEvent) => void;
  onValidation?: (event: ValidationEvent) => void;
  onStrategySelect?: (event: StrategySelectEvent) => void;
  onHint?: (event: HintEvent) => void;
  onReset?: (event: ResetEvent) => void;
  onScenarioLoad?: (event: ScenarioLoadEvent) => void;
  onComparisonView?: (event: ComparisonViewEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface ProfitExtractionConfig {
  /** Whether to show educational tooltips inline */
  showTooltips: boolean;
  /** Whether to show comparison strategies after calculation */
  showComparison: boolean;
  /** Whether to show the recommendation panel */
  showRecommendation: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the ProfitExtraction React component */
export interface ProfitExtractionProps {
  /** Configuration */
  config: ProfitExtractionConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: ProfitExtractionCallbacks;
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
  preFilledInputs: ProfitExtractionInputs;
  /** Expected optimal strategy outputs (for graded mode) */
  expectedOptimal: {
    salaryAmount: number;
    dividendAmount: number;
    pensionContribution: number;
    totalNetReceipt: number;
    overallEffectiveRate: number;
  };
  /** Hints per input field */
  hints: Record<string, string[]>;
}
