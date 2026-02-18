/**
 * Customs Valuation Worksheet — TypeScript Interfaces
 *
 * Models a practitioner working paper for computing customs value under
 * valuation Method 1 (transaction value) per TCTA 2018 / retained UCC.
 * All monetary values in GBP with pence precision (2 decimal places).
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** Supported Incoterms 2020 codes */
export type IncotermsCode =
  | 'EXW'  // Ex Works
  | 'FCA'  // Free Carrier
  | 'FAS'  // Free Alongside Ship
  | 'FOB'  // Free on Board
  | 'CFR'  // Cost and Freight
  | 'CIF'  // Cost, Insurance & Freight
  | 'CIP'  // Carriage & Insurance Paid To
  | 'CPT'  // Carriage Paid To
  | 'DAP'  // Delivered at Place
  | 'DPU'  // Delivered at Place Unloaded
  | 'DDP'; // Delivered Duty Paid

/** Currency codes supported by the tool */
export type CurrencyCode =
  | 'GBP'
  | 'EUR'
  | 'USD'
  | 'JPY'
  | 'CNY'
  | 'INR'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'KRW'
  | 'TRY';

/** Customs valuation methods (TCTA 2018, ss 15–21) */
export type ValuationMethod = 1 | 2 | 3 | 4 | 5 | 6;

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Build-up line type for display */
export type BuildUpLineType = 'base' | 'add' | 'deduct' | 'subtotal' | 'total';

/** Incoterms freight/insurance requirement category */
export type IncotermsFreightRequirement = 'add' | 'included' | 'deduct-if-beyond-port';

// ─── Incoterms Reference ───────────────────────────────────────────────────────

/** Describes the freight/insurance profile of an Incoterm */
export interface IncotermsProfile {
  /** Incoterms 2020 code */
  code: IncotermsCode;
  /** Full name */
  name: string;
  /** Group (E, F, C, D) */
  group: 'E' | 'F' | 'C' | 'D';
  /** Whether freight to UK port must be added, is included, or needs deduction */
  freightRequirement: IncotermsFreightRequirement;
  /** Whether insurance to UK port must be added, is included, or needs deduction */
  insuranceRequirement: IncotermsFreightRequirement;
  /** Brief description for the UI dropdown */
  description: string;
  /** Educational note about customs value impact */
  educationalNote: string;
}

// ─── Currency Reference ────────────────────────────────────────────────────────

/** Currency with illustrative HMRC exchange rate */
export interface CurrencyInfo {
  /** ISO 4217 code */
  code: CurrencyCode;
  /** Full name */
  name: string;
  /** Currency symbol */
  symbol: string;
  /** Illustrative HMRC rate (foreign currency per £1 GBP) */
  illustrativeRate: number;
}

// ─── Input Interfaces ──────────────────────────────────────────────────────────

/** Additions to the customs value (TCTA 2018, s 16) */
export interface ValuationAdditions {
  /** Commissions paid by buyer to seller's agent */
  sellingCommissions: number;
  /** Royalties/licence fees as condition of sale */
  royalties: number;
  /** Free-of-charge materials, moulds, tools, engineering from buyer to seller */
  assists: number;
  /** Packing costs not in invoice price */
  packingCosts: number;
}

/** Deductions from the customs value (TCTA 2018, s 17) */
export interface ValuationDeductions {
  /** Transport costs after arrival at UK port */
  postImportTransport: number;
  /** Installation/assembly/technical assistance after importation */
  installationAssembly: number;
}

/** Complete set of inputs for the customs valuation calculation */
export interface ValuationInputs {
  /** Invoice price in original currency */
  invoicePrice: number;
  /** Invoice currency code */
  currency: CurrencyCode;
  /** HMRC exchange rate (foreign currency per £1 GBP). 1.0 if GBP. */
  exchangeRate: number;
  /** Incoterms 2020 delivery term */
  incoterms: IncotermsCode;
  /** UK port of importation */
  portOfImportation: string;
  /** Freight cost to UK port (GBP) */
  freightToPort: number;
  /** Insurance cost to UK port (GBP) */
  insuranceToPort: number;
  /** Additions to customs value */
  additions: ValuationAdditions;
  /** Deductions from customs value */
  deductions: ValuationDeductions;
  /** Are buyer and seller related? */
  relatedParty: boolean;
  /** If related, has transaction value been accepted as arm's length? */
  armsLengthConfirmed: boolean;
  /** Valuation method (1–6, default 1) */
  valuationMethod: ValuationMethod;
  /** 10-digit commodity code (optional, for cross-reference) */
  commodityCode: string;
  /** Applicable duty rate as percentage (e.g., 6.5 for 6.5%) */
  dutyRatePercent: number;
  /** Import VAT rate as percentage (20 for standard, 0 for zero-rated) */
  vatRatePercent: number;
  /** Goods description (for display) */
  goodsDescription: string;
}

// ─── Output Interfaces ─────────────────────────────────────────────────────────

/** A single line in the itemised build-up */
export interface BuildUpLine {
  /** Display label (e.g., "Invoice price (EUR 42,000 ÷ 1.1765)") */
  label: string;
  /** GBP amount */
  amount: number;
  /** Line type for styling */
  type: BuildUpLineType;
  /** Educational explanation for this line */
  educationalNote: string;
}

/** Breakdown of additions applied */
export interface AdditionsBreakdown {
  sellingCommissions: number;
  royalties: number;
  assists: number;
  packingCosts: number;
  total: number;
}

/** Breakdown of deductions applied */
export interface DeductionsBreakdown {
  postImportTransport: number;
  installationAssembly: number;
  total: number;
}

/** Complete calculation output */
export interface ValuationOutput {
  /** Original invoice price */
  invoicePriceOriginal: number;
  /** Currency used */
  invoiceCurrency: CurrencyCode;
  /** Exchange rate applied */
  exchangeRate: number;
  /** Invoice price converted to GBP */
  invoicePriceGBP: number;

  /** Incoterms code used */
  incotermsCode: IncotermsCode;
  /** Freight adjustment applied (GBP) */
  freightAdjustment: number;
  /** Insurance adjustment applied (GBP) */
  insuranceAdjustment: number;
  /** Total Incoterms adjustment */
  incotermsAdjustmentTotal: number;

  /** Additions breakdown */
  additions: AdditionsBreakdown;

  /** Deductions breakdown */
  deductions: DeductionsBreakdown;

  /** Final customs value (GBP) — TCTA 2018, s 15 */
  customsValue: number;

  /** Duty rate applied (percentage) */
  dutyRatePercent: number;
  /** Duty amount (GBP) */
  dutyAmount: number;

  /** Value for VAT purposes (customs value + duty) */
  vatValue: number;
  /** VAT rate applied (percentage) */
  vatRatePercent: number;
  /** Import VAT amount (GBP) */
  importVAT: number;

  /** Total duty and VAT payable */
  totalDutyAndVAT: number;

  /** Whether Method 1 is applicable */
  method1Applicable: boolean;
  /** Whether buyer and seller are related */
  relatedParty: boolean;
  /** Valuation method used */
  valuationMethod: ValuationMethod;

  /** All validation results */
  validationResults: ValidationResult[];

  /** Itemised build-up for display */
  buildUpLines: BuildUpLine[];

  /** Validation summary counts */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
    passed: number;
    total: number;
  };
}

// ─── Validation ────────────────────────────────────────────────────────────────

/** Validation rule identifier */
export type ValidationRuleId =
  | 'V1'   // FOB freight check
  | 'V2'   // CIF double-count check
  | 'V3'   // Related party Method 1 check
  | 'V4'   // Currency conversion check
  | 'V5'   // Assists apportionment check
  | 'V6'   // Method 1 conditions met
  | 'V7'   // Negative customs value
  | 'V8'   // Zero invoice price
  | 'V9'   // DDP duty deduction
  | 'V10'; // Insurance estimation

/** Result of a single validation check */
export interface ValidationResult {
  /** Rule identifier (V1–V10) */
  ruleId: ValidationRuleId;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable explanation */
  message: string;
  /** Which fields are affected */
  affectedFields: string[];
  /** Whether the rule passed */
  passed: boolean;
}

// ─── Component Configuration ───────────────────────────────────────────────────

/** Configuration for the customs valuation worksheet */
export interface ValuationConfig {
  /** Whether to show educational tooltips inline */
  showTooltips: boolean;
  /** Whether to show the itemised build-up */
  showBuildUp: boolean;
  /** Scenario label for tracking (e.g., "S2 — Olive Oil FOB") */
  scenarioLabel?: string;
  /** Pre-selected Incoterms code */
  preSelectedIncoterms?: IncotermsCode;
  /** Pre-selected currency */
  preSelectedCurrency?: CurrencyCode;
}

// ─── Tracking Callbacks ────────────────────────────────────────────────────────

/** Payload for the onFieldEntry callback */
export interface FieldEntryEvent {
  field: string;
  value: string | number | boolean;
  timestamp: number;
}

/** Payload for the onValidation callback */
export interface ValuationValidationEvent {
  validationResults: ValidationResult[];
  passCount: number;
  failCount: number;
  timestamp: number;
}

/** Payload for the onCalculate callback */
export interface CalculateEvent {
  customsValue: number;
  dutyAmount: number;
  importVAT: number;
  attemptNumber: number;
  timestamp: number;
}

/** Payload for the onHint callback */
export interface ValuationHintEvent {
  field: string;
  hintType: 'tooltip' | 'explanation' | 'example';
  timestamp: number;
}

/** Payload for the onReset callback */
export interface ValuationResetEvent {
  previousAttempt: ValuationOutput | null;
  timestamp: number;
}

/** Payload for the onBuildUpView callback */
export interface BuildUpViewEvent {
  timestamp: number;
}

/** Payload for the onScenarioLoad callback */
export interface ScenarioLoadEvent {
  scenarioId: string;
  section: number;
  timestamp: number;
}

/** All tracking callbacks the component accepts */
export interface ValuationCallbacks {
  onFieldEntry?: (event: FieldEntryEvent) => void;
  onValidation?: (event: ValuationValidationEvent) => void;
  onCalculate?: (event: CalculateEvent) => void;
  onHint?: (event: ValuationHintEvent) => void;
  onReset?: (event: ValuationResetEvent) => void;
  onBuildUpView?: (event: BuildUpViewEvent) => void;
  onScenarioLoad?: (event: ScenarioLoadEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Props for the CustomsValuationWorksheet React component */
export interface CustomsValuationWorksheetProps {
  /** Configuration for this worksheet instance */
  config: ValuationConfig;
  /** Expected correct answers for validation (optional — for graded mode) */
  expectedAnswers?: Partial<ValuationOutput>;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: ValuationCallbacks;
  /** Whether to show educational tooltips inline */
  showTooltips?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ───────────────────────────────────────────────────────

/** Pre-configured test scenario for H&C storyline */
export interface HCValuationScenario {
  /** Scenario identifier (e.g., "s2-olive-oil-fob") */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description */
  description: string;
  /** Pre-filled configuration */
  config: ValuationConfig;
  /** Pre-filled inputs */
  preFilledInputs: ValuationInputs;
  /** Expected correct output values */
  expectedOutput: ValuationOutput;
  /** Hints available for this scenario */
  hints: Record<string, string[]>;
}
