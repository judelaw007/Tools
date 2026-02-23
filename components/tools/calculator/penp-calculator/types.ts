/**
 * Termination Payment Analyser (PENP Calculator) — TypeScript Interfaces
 *
 * Models a termination payment analyser that calculates PENP using
 * the statutory formula ((BP × D) / P − T), classifies each payment
 * component, applies the £30,000 exemption, and computes employer NIC.
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Pay period frequency */
export type PayPeriodType = 'monthly' | 'weekly' | 'fortnightly' | 'four-weekly' | 'annual' | 'custom';

/** Tax year identifier */
export type TaxYear = '2024-25' | '2025-26' | '2026-27';

/** Tax treatment for a termination payment component */
export type TaxTreatment = 'taxable-earnings' | 'exempt' | 'thirty-thousand-exemption';

/** Employer NIC class applicable to a component */
export type EmployerNICType = 'class-1' | 'class-1a' | 'none';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

// ─── Input Types ────────────────────────────────────────────────────────────────

/** Employee details */
export interface EmployeeDetails {
  /** Employee name (for display) */
  employeeName: string;
  /** Date of birth (ISO date string YYYY-MM-DD) */
  dateOfBirth: string;
  /** Employment start date (ISO date string YYYY-MM-DD) */
  employmentStartDate: string;
  /** Termination date / last day of employment (ISO date string YYYY-MM-DD) */
  terminationDate: string;
}

/** Pay details */
export interface PayDetails {
  /** Basic pay per pay period (BP in PENP formula) */
  basicPay: number;
  /** Pay period type */
  payPeriodType: PayPeriodType;
  /** Pay period days (P in PENP formula) — auto-calculated or custom */
  payPeriodDays: number;
}

/** Notice details */
export interface NoticeDetails {
  /** Contractual notice period in calendar days */
  contractualNoticeDays: number;
  /** Notice period actually served in calendar days */
  noticeServedDays: number;
  /** Whether the contract contains a PILON clause */
  hasContractualPILON: boolean;
  /** Contractual PILON amount (if applicable) */
  contractualPILONAmount: number;
}

/** Termination payment components */
export interface TerminationComponents {
  /** Prior taxable termination payments (T in PENP formula, excluding contractual PILON) */
  priorTaxableTerminationPayments: number;
  /** Statutory redundancy payment */
  statutoryRedundancyAmount: number;
  /** Restrictive covenant payment */
  restrictiveCovenantAmount: number;
  /** Ex gratia / goodwill / loyalty payment */
  exGratiaAmount: number;
}

/** Redundancy cross-check settings */
export interface RedundancySettings {
  /** Whether the termination is a genuine redundancy */
  isRedundancy: boolean;
  /** Capped weekly pay for statutory redundancy */
  cappedWeeklyPay: number;
}

/** Complete input set */
export interface PENPInputs {
  /** Employee details */
  employee: EmployeeDetails;
  /** Pay details */
  pay: PayDetails;
  /** Notice details */
  notice: NoticeDetails;
  /** Termination payment components */
  components: TerminationComponents;
  /** Redundancy settings */
  redundancy: RedundancySettings;
}

// ─── Output Types ───────────────────────────────────────────────────────────────

/** PENP calculation result */
export interface PENPCalculation {
  /** BP — basic pay per period */
  basicPay: number;
  /** D — calendar days in unserved notice period */
  unservedNoticeDays: number;
  /** P — calendar days in pay period */
  payPeriodDays: number;
  /** T — prior taxable payments (including contractual PILON) */
  priorTaxablePayments: number;
  /** The raw formula result before flooring at zero */
  rawResult: number;
  /** The PENP amount (floored at zero) */
  penpAmount: number;
  /** Display string of the formula with values substituted */
  formulaDisplay: string;
}

/** A classified payment component */
export interface ClassifiedComponent {
  /** Component identifier */
  id: string;
  /** Display name */
  componentName: string;
  /** Amount */
  amount: number;
  /** Tax treatment */
  taxTreatment: TaxTreatment;
  /** Human-readable tax treatment label */
  taxTreatmentLabel: string;
  /** Statutory reference */
  legislativeRef: string;
  /** Educational note explaining why this treatment applies */
  educationalNote: string;
  /** Employer NIC type applicable */
  employerNICType: EmployerNICType;
}

/** £30,000 exemption calculation */
export interface ExemptionCalculation {
  /** Total of all termination payment components */
  totalTerminationAward: number;
  /** Sum of PENP + contractual PILON + restrictive covenant */
  earningsElements: number;
  /** Statutory redundancy (separately exempt) */
  exemptElements: number;
  /** Ex gratia / amount tested against £30,000 */
  relevantTerminationAward: number;
  /** £30,000 */
  exemptionLimit: number;
  /** Amount within the £30,000 exemption */
  amountWithinExemption: number;
  /** Amount exceeding the £30,000 exemption */
  amountExceedingExemption: number;
  /** Remaining unused £30,000 exemption */
  remainingExemption: number;
}

/** Employer NIC computation */
export interface EmployerNICComputation {
  /** Base for Class 1 NIC (earnings elements) */
  class1NICBase: number;
  /** Class 1 employer NIC rate */
  class1NICRate: number;
  /** Class 1 NIC amount */
  class1NICAmount: number;
  /** Base for Class 1A NIC (excess over £30,000) */
  class1ANICBase: number;
  /** Class 1A NIC rate */
  class1ANICRate: number;
  /** Class 1A NIC amount */
  class1ANICAmount: number;
  /** Total employer NIC */
  totalEmployerNIC: number;
  /** Tax year */
  taxYear: TaxYear;
}

/** Statutory redundancy year breakdown entry */
export interface RedundancyYearEntry {
  /** Year number (1 = earliest, counting backwards) */
  year: number;
  /** Age at start of this service year */
  ageAtStart: number;
  /** Multiplier (0.5, 1, or 1.5 weeks) */
  multiplier: number;
}

/** Statutory redundancy cross-check result */
export interface RedundancyCrossCheck {
  /** Employee's age at termination */
  ageAtTermination: number;
  /** Complete years of continuous employment (max 20) */
  completeYearsOfService: number;
  /** Breakdown by year */
  breakdown: RedundancyYearEntry[];
  /** Total weeks' pay entitlement */
  totalWeeks: number;
  /** Capped weekly pay applied */
  cappedWeeklyPay: number;
  /** Calculated statutory redundancy amount */
  calculatedAmount: number;
  /** Amount entered by the user */
  enteredAmount: number;
  /** Difference (calculated minus entered) */
  difference: number;
}

/** Summary totals */
export interface TerminationSummary {
  /** Total of all components */
  grossTerminationPackage: number;
  /** PENP + PILON + restrictive covenant */
  totalTaxableAsEarnings: number;
  /** Statutory redundancy */
  totalExempt: number;
  /** Amount sheltered by £30,000 exemption */
  totalWithinThirtyThousand: number;
  /** Amount exceeding £30,000 (taxable + Class 1A NIC) */
  totalTaxableAboveThirtyThousand: number;
  /** Class 1 + Class 1A NIC */
  totalEmployerNIC: number;
  /** Gross package + total employer NIC */
  totalCostToEmployer: number;
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
export interface PENPOutput {
  /** PENP calculation */
  penpCalculation: PENPCalculation;
  /** Classified components */
  classifiedComponents: ClassifiedComponent[];
  /** £30,000 exemption calculation */
  exemptionCalculation: ExemptionCalculation;
  /** Employer NIC computation */
  employerNIC: EmployerNICComputation;
  /** Statutory redundancy cross-check (if applicable) */
  redundancyCrossCheck: RedundancyCrossCheck | null;
  /** Summary totals */
  summary: TerminationSummary;
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
  value: string | number | boolean;
  timestamp: number;
}

/** Payload for onCompute */
export interface PENPComputeEvent {
  penpAmount: number;
  totalPackage: number;
  employerNIC: number;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for onValidation */
export interface PENPValidationEvent {
  errors: string[];
  warnings: string[];
  timestamp: number;
}

/** Payload for onComponentView */
export interface ComponentViewEvent {
  componentName: string;
  timestamp: number;
}

/** Payload for onReset */
export interface PENPResetEvent {
  previousResult: PENPOutput | null;
  timestamp: number;
}

/** Payload for onScenarioLoad */
export interface PENPScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** Payload for onExemptionView */
export interface ExemptionViewEvent {
  withinExemption: number;
  exceeding: number;
  timestamp: number;
}

/** Payload for onRedundancyCheck */
export interface RedundancyCheckEvent {
  calculated: number;
  entered: number;
  difference: number;
  timestamp: number;
}

/** All tracking callbacks */
export interface PENPCallbacks {
  onInputChange?: (event: InputChangeEvent) => void;
  onCompute?: (event: PENPComputeEvent) => void;
  onValidation?: (event: PENPValidationEvent) => void;
  onComponentView?: (event: ComponentViewEvent) => void;
  onReset?: (event: PENPResetEvent) => void;
  onScenarioLoad?: (event: PENPScenarioLoadEvent) => void;
  onExemptionView?: (event: ExemptionViewEvent) => void;
  onRedundancyCheck?: (event: RedundancyCheckEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Configuration for the component */
export interface PENPConfig {
  /** Whether to show educational notes inline */
  showTooltips: boolean;
  /** Whether to show the redundancy cross-check by default */
  showRedundancyCrossCheck: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
}

/** Props for the PenpCalculator React component */
export interface PenpCalculatorProps {
  /** Configuration */
  config: PENPConfig;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: PENPCallbacks;
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
  preFilledInputs: PENPInputs;
  /** Expected PENP amount (for verification) */
  expectedPENP: number;
  /** Expected total employer NIC */
  expectedEmployerNIC: number;
  /** Learning hints keyed by component ID */
  hints: Record<string, string[]>;
}
