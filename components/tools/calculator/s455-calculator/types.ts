/**
 * s.455 Loans to Participators Calculator — TypeScript Interfaces
 *
 * Models the s.455 CTA 2010 tax charge on loans to participators,
 * the s.464C bed-and-breakfast anti-avoidance rule, DLA balance
 * tracking, key compliance dates, and write-off consequence analysis.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Participator's marginal income tax band (for write-off analysis) */
export type TaxBand = 'basic' | 'higher' | 'additional';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Timeline event types */
export type TimelineEventType =
  | 'period-start'
  | 'period-end'
  | 'repayment'
  | 'reborrowing'
  | 'deadline'
  | 'refund';

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Accounting period dates */
export interface AccountingPeriod {
  /** First day of the accounting period (ISO date string YYYY-MM-DD) */
  startDate: string;
  /** Last day of the accounting period (ISO date string YYYY-MM-DD) */
  endDate: string;
}

/** Aggregated DLA movements for the period */
export interface DLAMovements {
  /** Opening overdrawn balance (positive = participator owes company) */
  openingBalance: number;
  /** Total credits reducing the overdrawn balance (salary, dividends, other — excluding dated repayments) */
  totalCredits: number;
  /** Total debits increasing the overdrawn balance (drawings, personal expenses — excluding post-AP re-borrowings) */
  totalDebits: number;
}

/** A specific dated repayment to the DLA */
export interface Repayment {
  /** Unique identifier */
  id: string;
  /** Date the repayment was made (ISO date string) */
  date: string;
  /** Repayment amount (positive) */
  amount: number;
  /** Description of the repayment */
  description: string;
}

/** A specific dated re-borrowing from the DLA */
export interface Reborrowing {
  /** Unique identifier */
  id: string;
  /** Date the re-borrowing was made (ISO date string) — may be after AP end */
  date: string;
  /** Re-borrowing amount (positive) */
  amount: number;
  /** Description of the re-borrowing */
  description: string;
}

/** Write-off analysis configuration */
export interface WriteOffDetails {
  /** Whether write-off analysis is enabled */
  enabled: boolean;
  /** Amount the company is considering writing off */
  amount: number;
  /** Participator's marginal tax band */
  participatorTaxBand: TaxBand;
  /** Whether the participator is a shareholder-director (determines distribution vs BIK treatment) */
  isShareholderDirector: boolean;
  /** Whether the participator's dividend allowance has already been used */
  dividendAllowanceUsed: boolean;
}

/** Complete input set */
export interface S455Inputs {
  /** Accounting period dates */
  accountingPeriod: AccountingPeriod;
  /** DLA movements (aggregated credits/debits plus opening balance) */
  movements: DLAMovements;
  /** Dated repayments (for s.464C matching) */
  repayments: Repayment[];
  /** Dated re-borrowings (for s.464C matching — may be after AP end) */
  reborrowings: Reborrowing[];
  /** Write-off analysis configuration */
  writeOff: WriteOffDetails;
  /** s.455 tax rate (default 0.3375) */
  s455Rate: number;
  /** HMRC official rate of interest for beneficial loan BIK (default 0.0225) */
  officialRate: number;
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** DLA balance tracker showing movements and closing balance */
export interface BalanceTracker {
  /** Opening overdrawn balance */
  openingBalance: number;
  /** Total credits in the period (excluding dated repayments) */
  totalCredits: number;
  /** Total debits in the period (excluding post-AP re-borrowings) */
  totalDebits: number;
  /** Sum of all dated repayments within the AP */
  totalRepayments: number;
  /** Closing balance before s.464C adjustment */
  closingBalanceRaw: number;
  /** Total repayments disregarded under s.464C */
  totalDisregarded: number;
  /** Closing balance after s.464C adjustment (the s.455 charge base) */
  closingBalanceAdjusted: number;
}

/** A single s.464C bed-and-breakfast match */
export interface BedAndBreakfastMatch {
  /** The repayment that was matched */
  repayment: { date: string; amount: number; description: string };
  /** The re-borrowing(s) that matched */
  reborrowings: Array<{ date: string; amount: number; description: string }>;
  /** Calendar days between repayment and first re-borrowing */
  daysBetween: number;
  /** Amount of the repayment disregarded for s.455 purposes */
  disregardedAmount: number;
}

/** Result of the s.464C bed-and-breakfast analysis */
export interface BedAndBreakfastResult {
  /** Whether s.464C applies (any matches found) */
  triggered: boolean;
  /** Array of matched repayment/re-borrowing pairs */
  matches: BedAndBreakfastMatch[];
  /** Total amount of repayments disregarded */
  totalDisregarded: number;
  /** Human-readable explanation */
  explanation: string;
}

/** s.455 tax computation result */
export interface S455Computation {
  /** The adjusted closing balance on which s.455 applies */
  chargeableAmount: number;
  /** The rate applied */
  s455Rate: number;
  /** Tax liability (chargeableAmount × rate) */
  s455Tax: number;
  /** What the tax would have been without s.464C */
  s455TaxWithoutS464C: number;
  /** Additional tax due to s.464C */
  s464CDifference: number;
}

/** Key compliance dates */
export interface KeyDates {
  /** Accounting period end date */
  apEndDate: string;
  /** Date s.455 tax is due (9m + 1d after AP end) */
  s455DueDate: string;
  /** CT600 filing deadline (12 months after AP end) */
  ctFilingDeadline: string;
  /** CT payment deadline (same as s.455 due date) */
  ctPaymentDeadline: string;
  /** Earliest s.455 refund date (assumes repayment in next AP) */
  earliestRefundDate: string;
}

/** Write-off consequence analysis */
export interface WriteOffAnalysis {
  /** Amount being written off */
  writeOffAmount: number;
  /** Income tax on the deemed distribution (dividend rates) */
  distributionTax: number;
  /** The dividend tax rate applied */
  distributionRate: number;
  /** s.455 tax refundable on the written-off portion */
  s455Relief: number;
  /** Net income tax cost to the participator */
  netCostToParticipator: number;
  /** Net cost to the company (asset lost minus s.455 refund) */
  netCostToCompany: number;
  /** Annual BIK if the loan is kept outstanding */
  keepLoanBIK: number;
  /** Annual income tax on the BIK */
  keepLoanBIKTax: number;
  /** Annual employer Class 1A NIC on the BIK */
  keepLoanEmployerNIC: number;
  /** s.455 on the write-off portion if kept outstanding (refundable) */
  keepLoanS455: number;
  /** Recommendation text */
  recommendation: string;
  /** Detailed explanation */
  explanation: string;
}

/** Timeline event for visualisation */
export interface TimelineEvent {
  /** Event date (ISO string) */
  date: string;
  /** Short description */
  label: string;
  /** Event type (for colour-coding) */
  type: TimelineEventType;
  /** Associated amount (if applicable) */
  amount?: number;
  /** Additional context */
  note?: string;
}

/** Validation result */
export interface ValidationResult {
  /** Rule identifier */
  ruleId: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable message */
  message: string;
  /** Whether the rule passed */
  passed: boolean;
}

/** Complete computation output */
export interface S455Output {
  /** DLA balance tracker */
  balanceTracker: BalanceTracker;
  /** s.464C bed-and-breakfast result */
  bedAndBreakfast: BedAndBreakfastResult;
  /** s.455 tax computation */
  s455Computation: S455Computation;
  /** Key compliance dates */
  keyDates: KeyDates;
  /** Write-off analysis (null if not enabled) */
  writeOffAnalysis: WriteOffAnalysis | null;
  /** Timeline events */
  timeline: TimelineEvent[];
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

/** Payload for onAPChange */
export interface APChangeEvent {
  startDate: string;
  endDate: string;
  timestamp: number;
}

/** Payload for onCompute */
export interface S455ComputeEvent {
  s455Tax: number;
  adjustedBalance: number;
  bedAndBreakfastTriggered: boolean;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface S455ValidationEvent {
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/** Payload for onBedAndBreakfastView */
export interface BedAndBreakfastViewEvent {
  matches: Array<{ repaymentDate: string; reborrowingDate: string; amount: number }>;
  totalDisregarded: number;
  timestamp: number;
}

/** Payload for onWriteOffToggle */
export interface WriteOffToggleEvent {
  enabled: boolean;
  amount: number;
  timestamp: number;
}

/** Payload for onReset */
export interface S455ResetEvent {
  previousResult: S455Output | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface S455ScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onTimelineView */
export interface TimelineViewEvent {
  eventCount: number;
  timestamp: number;
}

/** All tracking callbacks */
export interface S455Callbacks {
  onAPChange?: (event: APChangeEvent) => void;
  onCompute?: (event: S455ComputeEvent) => void;
  onValidation?: (event: S455ValidationEvent) => void;
  onBedAndBreakfastView?: (event: BedAndBreakfastViewEvent) => void;
  onWriteOffToggle?: (event: WriteOffToggleEvent) => void;
  onReset?: (event: S455ResetEvent) => void;
  onScenarioLoad?: (event: S455ScenarioLoadEvent) => void;
  onTimelineView?: (event: TimelineViewEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface S455Config {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show the timeline by default */
  showTimeline: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the S455Calculator React component */
export interface S455CalculatorProps {
  /** Configuration */
  config: S455Config;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: S455Callbacks;
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
  preFilledInputs: S455Inputs;
  /** Expected s.455 tax (for verification) */
  expectedS455Tax: number;
  /** Expected adjusted closing balance */
  expectedAdjustedBalance: number;
  /** Whether s.464C is expected to trigger */
  expectedBedAndBreakfast: boolean;
  /** Hints for key learning points */
  hints: string[];
}
