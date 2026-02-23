/**
 * BADR Eligibility Checker and Calculator — TypeScript Interfaces
 *
 * Models a two-part tool: (1) eligibility assessment against BADR
 * qualifying conditions and (2) CGT computation at the BADR rate
 * with lifetime limit tracking and rate comparison.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Disposal type — determines which qualifying conditions apply */
export type DisposalType = 'shares' | 'business-assets' | 'associated-disposal';

/** Tax year identifier */
export type TaxYear = '2024-25' | '2025-26' | '2026-27';

/** Overall eligibility status */
export type EligibilityStatus = 'qualifying' | 'not-qualifying' | 'partially-qualifying';

/** Individual condition status */
export type ConditionStatus = 'met' | 'not-met' | 'not-applicable';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Disposal details */
export interface DisposalDetails {
  /** Type of disposal */
  disposalType: DisposalType;
  /** Date of disposal (ISO date string YYYY-MM-DD) */
  disposalDate: string;
  /** Date of acquisition (ISO date string YYYY-MM-DD) */
  acquisitionDate: string;
}

/** Gain computation inputs */
export interface GainInputs {
  /** Disposal proceeds */
  disposalProceeds: number;
  /** Allowable base cost */
  baseCost: number;
  /** Other allowable costs (legal fees, valuations, etc.) */
  allowableCosts: number;
  /** Annual exempt amount already used against other gains this year */
  annualExemptAmountUsed: number;
}

/** Shareholding details (for shares disposal) */
export interface ShareholdingDetails {
  /** Percentage of ordinary share capital held */
  percentShareCapital: number;
  /** Percentage of voting rights held */
  percentVotingRights: number;
  /** Whether the individual is an employee or officer of the company */
  isEmployeeOrOfficer: boolean;
}

/** Company trading status */
export interface CompanyStatus {
  /** Percentage of company activities that are trading (0-100) */
  tradingIncomePercent: number;
  /** Absolute trading income (optional, for display) */
  tradingIncomeAmount: number;
  /** Absolute non-trading income (optional, for display) */
  nonTradingIncomeAmount: number;
}

/** Associated disposal details */
export interface AssociatedDisposalDetails {
  /** Total days the individual owned the asset */
  totalOwnershipDays: number;
  /** Days the asset was used for the company's trade */
  tradeUseDays: number;
  /** Whether rent was charged to the company */
  rentCharged: boolean;
  /** Rent charged as percentage of full market rent (0-100) */
  rentAsPercentOfMarket: number;
}

/** Taxpayer details for rate comparison */
export interface TaxpayerDetails {
  /** Taxable income above personal allowance (for CGT rate band allocation) */
  taxableIncomeAbovePA: number;
}

/** Complete input set */
export interface BADRInputs {
  /** Disposal details */
  disposal: DisposalDetails;
  /** Gain computation inputs */
  gain: GainInputs;
  /** Shareholding details (shares disposal only) */
  shareholding: ShareholdingDetails;
  /** Company trading status (shares and associated disposals) */
  companyStatus: CompanyStatus;
  /** Associated disposal details (associated disposal only) */
  associatedDisposal: AssociatedDisposalDetails;
  /** Lifetime BADR previously used */
  lifetimePreviouslyUsed: number;
  /** Taxpayer details for rate comparison */
  taxpayer: TaxpayerDetails;
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** Result for an individual qualifying condition */
export interface ConditionResult {
  /** Unique condition identifier */
  conditionId: string;
  /** Display name */
  conditionName: string;
  /** Whether the condition is met */
  status: ConditionStatus;
  /** Detailed explanation with values */
  detail: string;
  /** Statutory reference */
  legislativeRef: string;
  /** Educational note explaining why this condition matters */
  educationalNote: string;
}

/** Overall eligibility result */
export interface EligibilityResult {
  /** Overall status */
  overallEligibility: EligibilityStatus;
  /** Summary reason */
  eligibilityReason: string;
  /** Individual condition results */
  conditions: ConditionResult[];
  /** Holding period in years and months */
  holdingPeriod: { years: number; months: number; days: number };
}

/** CGT computation result */
export interface CGTComputation {
  /** Disposal proceeds */
  proceeds: number;
  /** Base cost */
  baseCost: number;
  /** Allowable costs */
  allowableCosts: number;
  /** Chargeable gain (proceeds - base cost - costs) */
  gain: number;
  /** Annual exempt amount applied */
  annualExemptAmount: number;
  /** AEA available for this disposal */
  aeaAvailable: number;
  /** Taxable gain after AEA */
  taxableGain: number;
  /** Amount qualifying for BADR */
  badrQualifyingGain: number;
  /** Amount not qualifying for BADR */
  nonBadrGain: number;
  /** BADR rate applied */
  badrRate: number;
  /** Tax year of disposal */
  taxYear: TaxYear;
  /** CGT on BADR qualifying gain */
  cgtAtBadrRate: number;
  /** CGT at standard rate on non-BADR gain (basic rate portion) */
  standardBasicRateCGT: number;
  /** CGT at standard rate on non-BADR gain (higher rate portion) */
  standardHigherRateCGT: number;
  /** Total CGT liability */
  totalCGT: number;
  /** Effective rate (totalCGT / taxableGain) */
  effectiveRate: number;
}

/** Lifetime allowance tracking */
export interface LifetimeAllowance {
  /** Total lifetime limit */
  lifetimeLimit: number;
  /** Amount previously used */
  previouslyUsed: number;
  /** Amount used on this disposal */
  usedOnThisDisposal: number;
  /** Amount remaining after this disposal */
  remainingAfterDisposal: number;
  /** Whether the lifetime limit is exceeded */
  limitExceeded: boolean;
}

/** Associated disposal calculation */
export interface AssociatedDisposalCalc {
  /** Total gain on the associated asset */
  totalGain: number;
  /** Time apportionment fraction */
  timeApportionmentFraction: number;
  /** Gain after time apportionment */
  timeApportionedGain: number;
  /** Rent restriction fraction (1 = no restriction, 0 = fully restricted) */
  rentRestrictionFraction: number;
  /** BADR qualifying gain after all adjustments */
  badrQualifyingGain: number;
  /** Non-qualifying gain */
  nonQualifyingGain: number;
}

/** Rate comparison result */
export interface RateComparison {
  /** CGT with BADR applied */
  cgtWithBadr: number;
  /** CGT at standard rates (no BADR) */
  cgtWithoutBadr: number;
  /** Tax saving from BADR */
  taxSaving: number;
  /** Amount taxed at 18% standard rate (without BADR) */
  standardBasicRateAmount: number;
  /** Amount taxed at 24% standard rate (without BADR) */
  standardHigherRateAmount: number;
  /** Effective rate with BADR */
  effectiveRateWithBadr: number;
  /** Effective rate without BADR */
  effectiveRateWithoutBadr: number;
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
export interface BADROutput {
  /** Eligibility assessment */
  eligibility: EligibilityResult;
  /** CGT computation */
  cgtComputation: CGTComputation;
  /** Lifetime allowance tracking */
  lifetimeAllowance: LifetimeAllowance;
  /** Associated disposal calculation (if applicable) */
  associatedDisposalCalc: AssociatedDisposalCalc | null;
  /** Rate comparison */
  rateComparison: RateComparison;
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

/** Payload for onDisposalTypeChange */
export interface DisposalTypeChangeEvent {
  disposalType: DisposalType;
  timestamp: number;
}

/** Payload for onEligibilityCheck */
export interface EligibilityCheckEvent {
  conditions: Array<{ conditionId: string; status: ConditionStatus }>;
  overallResult: EligibilityStatus;
  timestamp: number;
}

/** Payload for onCompute */
export interface BADRComputeEvent {
  totalCGT: number;
  badrGain: number;
  taxSaving: number;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface BADRValidationEvent {
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/** Payload for onConditionToggle */
export interface ConditionToggleEvent {
  conditionId: string;
  timestamp: number;
}

/** Payload for onReset */
export interface BADRResetEvent {
  previousResult: BADROutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface BADRScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onComparisonView */
export interface ComparisonViewEvent {
  withBadr: number;
  withoutBadr: number;
  saving: number;
  timestamp: number;
}

/** All tracking callbacks */
export interface BADRCallbacks {
  onDisposalTypeChange?: (event: DisposalTypeChangeEvent) => void;
  onEligibilityCheck?: (event: EligibilityCheckEvent) => void;
  onCompute?: (event: BADRComputeEvent) => void;
  onValidation?: (event: BADRValidationEvent) => void;
  onConditionToggle?: (event: ConditionToggleEvent) => void;
  onReset?: (event: BADRResetEvent) => void;
  onScenarioLoad?: (event: BADRScenarioLoadEvent) => void;
  onComparisonView?: (event: ComparisonViewEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface BADRConfig {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show the rate comparison table by default */
  showComparison: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the BadrChecker React component */
export interface BadrCheckerProps {
  /** Configuration */
  config: BADRConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: BADRCallbacks;
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
  preFilledInputs: BADRInputs;
  /** Expected CGT (for verification) */
  expectedCGT: number;
  /** Expected eligibility */
  expectedEligibility: EligibilityStatus;
  /** Hints per condition (keyed by condition ID) */
  hints: Record<string, string[]>;
}
