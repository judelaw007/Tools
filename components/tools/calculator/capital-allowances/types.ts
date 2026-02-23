/**
 * Capital Allowances Computation — TypeScript Interfaces
 *
 * Models a multi-pool capital allowances computation with AIA allocation,
 * full expensing, zero-emission car FYA, CO2-based car pool allocation,
 * balancing adjustments, and short-period apportionment.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Business entity type — affects full expensing and private use treatment */
export type EntityType = 'company' | 'sole-trader-partnership';

/** Asset category — determines pool allocation and relief eligibility */
export type AssetCategory =
  | 'general-plant'
  | 'car'
  | 'integral-feature'
  | 'thermal-insulation'
  | 'long-life';

/** Pool identifier */
export type PoolId = 'main' | 'special-rate';

/** Relief type applied to an addition */
export type ReliefType =
  | 'full-expensing'
  | 'fya-100'
  | 'fya-50'
  | 'aia'
  | 'wda';

/** Relief election by the user */
export type ReliefElection = 'auto' | 'full-expensing' | 'aia' | 'wda-only';

/** CO2 emission band for cars */
export type CO2Band = 'zero' | 'low' | 'high';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Accounting period */
export interface AccountingPeriod {
  /** First day of the accounting period (ISO date string YYYY-MM-DD) */
  start: string;
  /** Last day of the accounting period (ISO date string YYYY-MM-DD) */
  end: string;
}

/** Pool brought-forward balances */
export interface PoolsBroughtForward {
  /** Main pool balance b/f (18% WDA) */
  mainPool: number;
  /** Special rate pool balance b/f (6% WDA) */
  specialRatePool: number;
}

/** A single asset addition */
export interface AssetAddition {
  /** Unique identifier */
  id: string;
  /** Asset description */
  description: string;
  /** Capital cost (excluding recoverable VAT) */
  cost: number;
  /** Asset category */
  category: AssetCategory;
  /** Is the asset new and unused? (affects full expensing eligibility) */
  isNew: boolean;
  /** CO2 emissions in g/km (required for cars) */
  co2Emissions: number | null;
  /** Percentage of private (non-business) use (0-100) */
  privateUsePercent: number;
  /** Relief election */
  reliefElection: ReliefElection;
}

/** A single asset disposal */
export interface AssetDisposal {
  /** Unique identifier */
  id: string;
  /** Asset description */
  description: string;
  /** Disposal proceeds */
  proceeds: number;
  /** Pool from which the asset is disposed */
  pool: PoolId;
}

/** Complete input set */
export interface CAInputs {
  /** Accounting period dates */
  period: AccountingPeriod;
  /** Business entity type */
  entityType: EntityType;
  /** Pool brought-forward balances */
  poolsBF: PoolsBroughtForward;
  /** Asset additions */
  additions: AssetAddition[];
  /** Asset disposals */
  disposals: AssetDisposal[];
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** Classification result for a single addition */
export interface AdditionClassification {
  /** Addition ID */
  additionId: string;
  /** Asset description */
  description: string;
  /** Original cost */
  cost: number;
  /** Asset category */
  category: AssetCategory;
  /** CO2 band (cars only) */
  co2Band: CO2Band | null;
  /** Target pool (null if fully relieved by FYA/FE) */
  targetPool: PoolId | null;
  /** Relief type applied */
  reliefType: ReliefType;
  /** Amount relieved immediately (FYA/FE/AIA) */
  reliefAmount: number;
  /** Amount entering the pool for future WDA */
  amountToPool: number;
  /** Private use percentage */
  privateUsePercent: number;
  /** Educational note explaining the classification */
  educationalNote: string;
}

/** Pool computation result */
export interface PoolResult {
  /** Pool identifier */
  poolId: PoolId;
  /** Pool display name */
  poolName: string;
  /** WDA rate (0.18 or 0.06) */
  wdaRate: number;
  /** Brought-forward balance */
  poolBF: number;
  /** Additions entering the pool */
  additionsToPool: number;
  /** Disposal proceeds deducted */
  disposalsFromPool: number;
  /** Balance after additions and disposals */
  balanceAfterDisposals: number;
  /** Balancing charge (if pool went negative) */
  balancingCharge: number;
  /** Whether the small pool allowance was applied (balance <= £1,000) */
  smallPoolClaimed: boolean;
  /** Balance before WDA (after balancing charge adjustment) */
  balanceForWDA: number;
  /** WDA amount claimed */
  wdaAmount: number;
  /** WDA before short-period apportionment (for display) */
  wdaBeforeApportionment: number;
  /** Carried-forward balance */
  poolCF: number;
}

/** Relief totals */
export interface ReliefTotals {
  /** Full expensing (100% FYA on new main-rate P&M) */
  fullExpensing: number;
  /** Zero-emission car FYA */
  zeroEmissionFYA: number;
  /** 50% FYA on special rate assets */
  specialRateFYA: number;
  /** Total FYAs (all types) */
  totalFYAs: number;
  /** Total AIA claimed */
  totalAIA: number;
  /** AIA available for the period */
  aiaAvailable: number;
  /** AIA remaining (unused) */
  aiaRemaining: number;
}

/** Period information */
export interface PeriodInfo {
  /** Number of days in the period */
  periodDays: number;
  /** Whether the period is less than 365 days */
  isShortPeriod: boolean;
  /** Apportionment fraction (periodDays / 365) */
  apportionmentFraction: number;
}

/** Total allowances summary */
export interface AllowancesSummary {
  /** Total FYAs (full expensing + zero-emission + special rate) */
  totalFYAs: number;
  /** Total AIA */
  totalAIA: number;
  /** Total WDA (all pools) */
  totalWDA: number;
  /** Total balancing charges */
  totalBalancingCharges: number;
  /** Grand total allowances */
  totalAllowances: number;
}

/** A row in the exam-format computation table */
export interface ExamLayoutRow {
  /** Row label */
  label: string;
  /** FYA/FE column value */
  fya: number | null;
  /** AIA column value */
  aia: number | null;
  /** Main pool column value */
  mainPool: number | null;
  /** Special rate pool column value */
  specialRate: number | null;
  /** Allowances column value */
  allowances: number | null;
  /** Row type for styling */
  rowType: 'addition' | 'subtotal' | 'disposal' | 'balance' | 'wda' | 'carryforward' | 'total' | 'header' | 'blank';
  /** Whether to show as negative (parentheses) */
  isDeduction: boolean;
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
export interface CAOutput {
  /** Period information */
  periodInfo: PeriodInfo;
  /** Per-addition classification */
  additionClassifications: AdditionClassification[];
  /** Relief totals */
  reliefTotals: ReliefTotals;
  /** Pool computation results */
  poolResults: PoolResult[];
  /** Total allowances summary */
  allowancesSummary: AllowancesSummary;
  /** Exam-format layout rows */
  examLayout: ExamLayoutRow[];
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

/** Payload for onAdditionAdd */
export interface AdditionAddEvent {
  addition: AssetAddition;
  timestamp: number;
}

/** Payload for onAdditionRemove */
export interface AdditionRemoveEvent {
  additionId: string;
  timestamp: number;
}

/** Payload for onDisposalAdd */
export interface DisposalAddEvent {
  disposal: AssetDisposal;
  timestamp: number;
}

/** Payload for onDisposalRemove */
export interface DisposalRemoveEvent {
  disposalId: string;
  timestamp: number;
}

/** Payload for onReliefElection */
export interface ReliefElectionEvent {
  additionId: string;
  reliefType: ReliefElection;
  previousRelief: ReliefElection;
  timestamp: number;
}

/** Payload for onCompute */
export interface ComputeEvent {
  totalAllowances: number;
  poolResults: Array<{ poolId: PoolId; wda: number; cf: number }>;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface CAValidationEvent {
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/** Payload for onReset */
export interface CAResetEvent {
  previousResult: CAOutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface CAScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** All tracking callbacks */
export interface CACallbacks {
  onAdditionAdd?: (event: AdditionAddEvent) => void;
  onAdditionRemove?: (event: AdditionRemoveEvent) => void;
  onDisposalAdd?: (event: DisposalAddEvent) => void;
  onDisposalRemove?: (event: DisposalRemoveEvent) => void;
  onReliefElection?: (event: ReliefElectionEvent) => void;
  onCompute?: (event: ComputeEvent) => void;
  onValidation?: (event: CAValidationEvent) => void;
  onReset?: (event: CAResetEvent) => void;
  onScenarioLoad?: (event: CAScenarioLoadEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface CAConfig {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show the exam-format layout */
  showExamLayout: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the CapitalAllowances React component */
export interface CapitalAllowancesProps {
  /** Configuration */
  config: CAConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: CACallbacks;
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
  preFilledInputs: CAInputs;
  /** Expected total allowances */
  expectedTotalAllowances: number;
  /** Hints per addition (keyed by addition ID) */
  hints: Record<string, string[]>;
}
