/**
 * CCL100 Return — TypeScript Interfaces
 *
 * Models the HMRC CCL100 quarterly return for Climate Change Levy.
 * All monetary values in GBP with pence precision (2 decimal places).
 * Quantities in kWh (electricity, gas) or kg (LPG, solid fuels).
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** The four taxable commodities under CCL */
export type Commodity = 'electricity' | 'gas' | 'lpg' | 'solid-fuels';

/** Box numbers on the CCL100 return */
export type BoxNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Main rate boxes (1-4 are editable, 5 is auto-calculated) */
export type MainRateBoxNumber = 1 | 2 | 3 | 4 | 5;

/** CPS rate boxes (6-8 are editable, 9 is auto-calculated) */
export type CPSBoxNumber = 6 | 7 | 8 | 9;

/** CCL position after completing the return */
export type CCLPosition = 'payable' | 'repayable' | 'nil';

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Rate period identifier — rates change on 1 April each year */
export type RatePeriod =
  | '2024-25'
  | '2025-26'
  | '2026-27'
  | '2027-28';

/** Exemption type */
export type ExemptionType =
  | 'renewables-lec'      // Renewable electricity with Levy Exemption Certificates
  | 'chp-qualifying'      // Combined Heat and Power qualifying supplies
  | 'mineralogical'       // Mineralogical/metallurgical process exemption
  | 'none';

// ─── Rate Structures ────────────────────────────────────────────────────────────

/** Rate table entry for a single commodity in a single period */
export interface CommodityRate {
  /** Main CCL rate per unit */
  mainRate: number;
  /** Unit of measurement */
  unit: 'kWh' | 'kg';
  /** CCA discount percentage (0-1, e.g. 0.92 = 92%) */
  ccaDiscount: number;
  /** Effective CCA rate (mainRate × (1 - ccaDiscount)) */
  ccaRate: number;
  /** CPS rate (only for generators — 0 for non-generators) */
  cpsRate: number;
}

/** Complete rate table for a period */
export interface RateTable {
  /** Period identifier */
  period: RatePeriod;
  /** Human-readable period label */
  label: string;
  /** Effective from date */
  effectiveFrom: string;
  /** Effective to date */
  effectiveTo: string;
  /** Rates per commodity */
  rates: Record<Commodity, CommodityRate>;
}

// ─── Input Structures ───────────────────────────────────────────────────────────

/** Accounting period for the return */
export interface AccountingPeriod {
  /** Start date of the period (ISO 8601) */
  startDate: string;
  /** End date of the period (ISO 8601) */
  endDate: string;
  /** Human-readable label (e.g., "Q4 2026/27") */
  label: string;
}

/** Input data for a single commodity */
export interface CommodityInput {
  /** Quantity supplied at standard (full) rate — kWh or kg */
  standardQuantity: number;
  /** Quantity supplied at CCA reduced rate — kWh or kg */
  ccaQuantity: number;
  /** Exempt quantity: renewables with LECs (electricity only) */
  exemptRenewables: number;
  /** Exempt quantity: CHP qualifying (any commodity) */
  exemptCHP: number;
  /** Exempt quantity: mineralogical/metallurgical (solid fuels only) */
  exemptMineralogical: number;
  /** Credit from prior periods (£ amount, not quantity) */
  creditFromPrior: number;
}

/** CCA configuration */
export interface CCADetails {
  /** Whether a Climate Change Agreement is in force */
  hasCCA: boolean;
  /** CCA certificate reference number */
  ccaCertificateRef: string;
  /** Name of the CCA-certified facility */
  ccaFacilityName: string;
}

/** Complete inputs for the CCL100 return */
export interface CCL100Inputs {
  /** Accounting period */
  period: AccountingPeriod;
  /** CCA details */
  cca: CCADetails;
  /** Whether this entity generates electricity (activates CPS boxes 6-9) */
  isElectricityGenerator: boolean;
  /** Commodity inputs */
  electricity: CommodityInput;
  gas: CommodityInput;
  lpg: CommodityInput;
  solidFuels: CommodityInput;
}

// ─── Calculation Structures ─────────────────────────────────────────────────────

/** A single step in the calculation breakdown */
export interface CalculationStep {
  /** Step label (e.g., "Standard-rate electricity") */
  label: string;
  /** Formula description (e.g., "1,600,000 kWh × £0.00775/kWh") */
  formula: string;
  /** Calculated amount (£) */
  amount: number;
  /** Educational note explaining this step */
  educationalNote?: string;
}

/** Complete breakdown for a single commodity */
export interface CommodityBreakdown {
  /** Which commodity */
  commodity: Commodity;
  /** Human-readable commodity name */
  commodityName: string;
  /** Box number on the CCL100 */
  boxNumber: MainRateBoxNumber;
  /** Quantity supplied at standard rate */
  standardQuantity: number;
  /** Standard rate applied (£ per unit) */
  standardRate: number;
  /** CCL at standard rate (£) */
  standardCCL: number;
  /** Quantity supplied at CCA reduced rate */
  ccaQuantity: number;
  /** CCA reduced rate applied (£ per unit) */
  ccaRate: number;
  /** CCL at CCA rate (£) */
  ccaCCL: number;
  /** Total exempt quantity */
  exemptQuantity: number;
  /** Exempt deduction (£) */
  exemptDeduction: number;
  /** Credit from prior periods (£) */
  creditDeduction: number;
  /** Net CCL due for this commodity (£) */
  netCCLDue: number;
  /** Step-by-step calculation */
  calculationSteps: CalculationStep[];
  /** Unit of measurement */
  unit: 'kWh' | 'kg';
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Validation rule identifier */
export type ValidationRuleId =
  | 'V1'   // Box 5 calculation check
  | 'V2'   // CCA without certificate
  | 'V3'   // CCA exceeds total
  | 'V4'   // Exemptions exceed supply
  | 'V5'   // Negative box warning
  | 'V6'   // LPG unit check
  | 'V7'   // Zero return check
  | 'V8'   // Rate period check
  | 'V9'   // CCA rate application
  | 'V10'; // Payment deadline

/** Result of a single validation check */
export interface ValidationResult {
  /** Rule identifier (V1–V10) */
  ruleId: ValidationRuleId;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable explanation */
  message: string;
  /** Which boxes are affected */
  affectedBoxes: BoxNumber[];
  /** Whether the rule passed */
  passed: boolean;
}

// ─── Output Structure ───────────────────────────────────────────────────────────

/** Rate reference panel for display */
export interface RateReference {
  /** Period these rates apply to */
  period: RatePeriod;
  /** Label */
  periodLabel: string;
  /** Rates per commodity */
  rates: Record<Commodity, {
    mainRate: number;
    unit: string;
    ccaDiscount: string;
    ccaRate: number;
  }>;
}

/** Complete output after the return is submitted */
export interface CCL100Output {
  /** Final box values (£) */
  boxes: {
    box1: number;  // Electricity
    box2: number;  // Gas
    box3: number;  // LPG
    box4: number;  // Solid fuels
    box5: number;  // Net CCL due (1+2+3+4)
    box6: number;  // CPS gas
    box7: number;  // CPS LPG
    box8: number;  // CPS solid fuels
    box9: number;  // Total CPS (6+7+8)
  };
  /** Net CCL position */
  position: CCLPosition;
  /** Breakdown per commodity */
  commodityBreakdowns: CommodityBreakdown[];
  /** Validation results */
  validationResults: ValidationResult[];
  /** Validation summary counts */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
    passed: number;
    total: number;
  };
  /** Payment deadline (ISO 8601 date) */
  paymentDeadline: string;
  /** Payment deadline human-readable */
  paymentDeadlineLabel: string;
  /** Rate reference for display */
  rateReference: RateReference;
}

// ─── Tracking Callbacks ─────────────────────────────────────────────────────────

/** Payload for the onCommodityEntry callback */
export interface CommodityEntryEvent {
  commodity: Commodity;
  field: string;
  value: number;
  timestamp: number;
}

/** Payload for the onValidation callback */
export interface CCLValidationEvent {
  validationResults: ValidationResult[];
  passCount: number;
  failCount: number;
  timestamp: number;
}

/** Payload for the onSubmit callback */
export interface CCLSubmitEvent {
  boxes: CCL100Output['boxes'];
  position: CCLPosition;
  isCorrect: boolean;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for the onHint callback */
export interface CCLHintEvent {
  commodity: Commodity;
  hintType: 'tooltip' | 'explanation' | 'example';
  timestamp: number;
}

/** Payload for the onReset callback */
export interface CCLResetEvent {
  previousAttempt: CCL100Output | null;
  timestamp: number;
}

/** Payload for the onBreakdownView callback */
export interface BreakdownViewEvent {
  commodity: Commodity;
  timestamp: number;
}

/** Payload for the onScenarioLoad callback */
export interface ScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** All tracking callbacks the component accepts */
export interface CCL100Callbacks {
  onCommodityEntry?: (event: CommodityEntryEvent) => void;
  onValidation?: (event: CCLValidationEvent) => void;
  onSubmit?: (event: CCLSubmitEvent) => void;
  onHint?: (event: CCLHintEvent) => void;
  onReset?: (event: CCLResetEvent) => void;
  onBreakdownView?: (event: BreakdownViewEvent) => void;
  onScenarioLoad?: (event: ScenarioLoadEvent) => void;
}

// ─── Configuration ──────────────────────────────────────────────────────────────

/** Configuration for the CCL100 form */
export interface CCL100Config {
  /** Whether to show educational tooltips inline */
  showTooltips: boolean;
  /** Whether to show calculation breakdowns after submission */
  showBreakdowns: boolean;
  /** Whether to show CPS boxes (6-9) — only relevant for generators */
  showCPSBoxes: boolean;
  /** Scenario label for tracking (e.g., "S9 — Swansea CCL") */
  scenarioLabel?: string;
}

// ─── Component Props ────────────────────────────────────────────────────────────

/** Props for the CCL100Return React component */
export interface CCL100ReturnProps {
  /** Configuration for this return instance */
  config: CCL100Config;
  /** Expected correct answers for validation (optional — for graded mode) */
  expectedAnswers?: CCL100Output['boxes'];
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: CCL100Callbacks;
  /** Whether to show educational tooltips inline */
  showTooltips?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ─────────────────────────────────────────────────────────

/** Pre-configured test scenario for H&C storyline */
export interface HCScenario {
  /** Scenario identifier (e.g., "s9-swansea-ccl") */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description for the scenario selector */
  description: string;
  /** Pre-filled configuration */
  config: CCL100Config;
  /** Pre-filled inputs */
  preFilledInputs: CCL100Inputs;
  /** Expected correct box values */
  expectedAnswers: CCL100Output['boxes'];
  /** Hints available for this scenario */
  hints: Record<Commodity, string[]>;
}
