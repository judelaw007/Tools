/**
 * CDS Import Declaration (C88) — TypeScript Interfaces
 *
 * Models a UK Customs Declaration Service import declaration
 * (Single Administrative Document / C88). All monetary values
 * in GBP with pence precision (2 decimal places).
 */

// ─── Literal Types ─────────────────────────────────────────────────────────────

/** CDS declaration type — always "IM" for imports */
export type DeclarationType = 'IM';

/** Additional declaration type */
export type AdditionalDeclarationType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Supported procedure codes (DE 1/10) — 4-digit requested + previous procedure */
export type ProcedureCode =
  | '4000'  // Free circulation — standard import (no previous procedure)
  | '6121'  // OP re-import with duty on repair cost
  | '6122'  // OP re-import — guarantee repair (no duty)
  | '6110'  // Returned Goods Relief (unaltered goods)
  | '5100'  // Inward Processing entry
  | '5300'; // Temporary Admission entry

/** Additional procedure codes (DE 1/11) */
export type AdditionalProcedureCode =
  | '000'   // No additional code applies
  | 'B02'   // OP re-import: repair under guarantee (free of charge)
  | 'B03'   // OP re-import: replacement under guarantee (standard exchange)
  | 'F01'   // RGR: customs duty relief only
  | 'F05'   // RGR: customs duty AND VAT relief
  | 'A04';  // IP: VAT-only suspension

/** Preference codes (DE 4/17) */
export type PreferenceCode =
  | '100'   // Third Country / MFN — no preference
  | '200'   // DCTS (Developing Countries Trading Scheme)
  | '300';  // FTA preferential rate (UK-EU TCA, UK-Japan CEPA, etc.)

/** Customs valuation methods (DE 4/16) — TCTA 2018, ss 15–21 */
export type ValuationMethod = 1 | 2 | 3 | 4 | 5 | 6;

/** Representation type codes (DE 3/21) */
export type RepresentationType =
  | ''   // Self-representation (importer declares directly)
  | '2'  // Direct representation (agent acts in name of importer)
  | '3'; // Indirect representation (agent acts in own name, on behalf of importer)

/** Method of payment codes (DE 4/8) */
export type PaymentMethod =
  | 'A'  // Cash (immediate)
  | 'E'  // Duty Deferment Account (importer's own DDA)
  | 'R'  // Duty Deferment Account (third-party DDA)
  | 'M'  // CDS cash account
  | '';  // Blank — used for PVA VAT line

/** Document reference codes (DE 2/3) */
export type DocumentCode =
  | 'N935'  // Commercial invoice
  | 'C506'  // Duty Deferment Account (DPO)
  | 'C600'  // Outward Processing authorisation
  | 'C601'  // Inward Processing authorisation
  | 'U110'  // Statement on origin — single shipment
  | 'U111'  // Statement on origin — multiple shipments
  | 'U112'  // Importer's knowledge
  | '9001'  // DCTS origin declaration
  | 'N865'; // Form A / DCTS origin certificate

/** ISO 3166-1 alpha-2 country codes (curated for H&C) */
export type CountryCode =
  | 'IT'  // Italy
  | 'ES'  // Spain
  | 'FR'  // France
  | 'JP'  // Japan
  | 'IN'  // India
  | 'CN'  // China
  | 'AU'  // Australia
  | 'US'  // United States
  | 'DE'  // Germany
  | 'NL'  // Netherlands
  | 'BE'  // Belgium
  | 'IE'  // Ireland
  | 'TR'  // Turkey
  | 'KR'  // South Korea
  | 'TW'  // Taiwan
  | 'GB'; // United Kingdom (for re-imports)

/** Incoterms 2020 codes */
export type IncotermsCode =
  | 'EXW' | 'FCA' | 'FAS' | 'FOB'
  | 'CFR' | 'CIF' | 'CIP' | 'CPT'
  | 'DAP' | 'DPU' | 'DDP';

/** Import VAT rate options */
export type VATRate = 20 | 5 | 0;

/** Validation severity levels */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** Validation rule identifier */
export type ValidationRuleId =
  | 'V1'   // Procedure-preference compatibility
  | 'V2'   // Missing document reference for preference
  | 'V3'   // OP authorisation check
  | 'V4'   // DDA consistency
  | 'V5'   // PVA election check
  | 'V6'   // Customs value reasonableness
  | 'V7'   // OP customs value check
  | 'V8'   // Country-preference match
  | 'V9'   // Commodity code format
  | 'V10'  // EORI format check
  | 'V11'  // Valuation indicators (Method 1)
  | 'V12'  // Net mass positive
  | 'V13'; // Representation consistency

/** Declaration status after validation */
export type DeclarationStatus = 'accepted' | 'rejected';

// ─── Party Interfaces ──────────────────────────────────────────────────────────

/** EORI-identified party */
export interface Party {
  /** EORI number (GB/XI prefix + 12 digits) */
  eori: string;
  /** Registered name */
  name: string;
  /** Address line */
  address: string;
}

// ─── Document Reference ────────────────────────────────────────────────────────

/** A document reference entry in DE 2/3 */
export interface DocumentReference {
  /** Unique ID for this document entry */
  id: string;
  /** Document code (e.g., N935, U110) */
  code: DocumentCode;
  /** Reference number */
  reference: string;
  /** Document status code (AC = attached, AE = held by declarant) */
  statusCode: 'AC' | 'AE' | 'AF' | 'JP';
}

// ─── Declaration Inputs ────────────────────────────────────────────────────────

/** Header-level declaration data */
export interface DeclarationHeader {
  /** DE 1/1: Declaration type — always "IM" */
  declarationType: DeclarationType;
  /** DE 1/2: Additional declaration type */
  additionalDeclarationType: AdditionalDeclarationType;
  /** DE 3/17 + 3/18: Declarant */
  declarant: Party;
  /** DE 3/37: Importer */
  importer: Party;
  /** DE 3/20 + 3/21: Representative (if applicable) */
  representative: Party;
  /** DE 3/21: Representation type */
  representationType: RepresentationType;
  /** DE 3/40: Importer VAT registration number (populate to elect PVA) */
  importerVATNumber: string;
  /** DE 5/23: Location of goods (port/location code) */
  locationOfGoods: string;
  /** DE 2/6: Duty deferment account number */
  defermentAccountNumber: string;
}

/** Item-level declaration data (single goods item) */
export interface DeclarationItem {
  /** DE 1/6: Goods item number */
  itemNumber: number;
  /** DE 1/10: Procedure code (4-digit) */
  procedureCode: ProcedureCode;
  /** DE 1/11: Additional procedure code */
  additionalProcedureCode: AdditionalProcedureCode;
  /** DE 6/14 + 6/15: Commodity code (10-digit) */
  commodityCode: string;
  /** DE 6/8: Description of goods */
  goodsDescription: string;
  /** DE 6/1: Net mass in kg */
  netMassKg: number;
  /** DE 6/2: Supplementary units (quantity) */
  supplementaryUnits: number;
  /** DE 5/15: Country of origin (non-preferential) */
  countryOfOrigin: CountryCode;
  /** DE 5/14: Country of dispatch */
  countryOfDispatch: CountryCode;
  /** DE 5/16: Country of preferential origin (if claiming preference) */
  countryOfPreferentialOrigin: CountryCode | '';
  /** DE 4/11: Customs value in GBP */
  customsValueGBP: number;
  /** DE 4/16: Valuation method (1-6) */
  valuationMethod: ValuationMethod;
  /** DE 4/13: Valuation indicators (4-digit, Method 1 only) */
  valuationIndicators: string;
  /** DE 4/17: Preference code */
  preferenceCode: PreferenceCode;
  /** DE 4/1: Incoterms code */
  incotermsCode: IncotermsCode;
  /** DE 4/8: Method of payment — duty line */
  paymentMethodDuty: PaymentMethod;
  /** DE 4/8: Method of payment — VAT line (blank for PVA) */
  paymentMethodVAT: PaymentMethod;
  /** Applicable duty rate as percentage */
  dutyRatePercent: number;
  /** Import VAT rate */
  vatRate: VATRate;
  /** DE 2/3: Document references */
  documentReferences: DocumentReference[];
  /** For OP re-import: repair cost (GBP) — determines customs value */
  repairCost: number;
  /** For OP re-import: outward freight cost (GBP) — included in VAT value */
  outwardFreight: number;
}

/** Complete declaration inputs */
export interface DeclarationInputs {
  /** Header-level data */
  header: DeclarationHeader;
  /** Item-level data (simplified to single item for educational focus) */
  item: DeclarationItem;
}

// ─── Calculation Output ────────────────────────────────────────────────────────

/** Duty and tax calculation result for one item */
export interface DutyCalculation {
  /** Customs value used for duty calculation (GBP) */
  customsValue: number;
  /** Duty rate applied (%) */
  dutyRatePercent: number;
  /** Customs duty amount (GBP) */
  dutyAmount: number;
  /** Value for VAT purposes (customs value + duty, or OP-adjusted) */
  vatValue: number;
  /** VAT rate applied (%) */
  vatRatePercent: number;
  /** Import VAT amount (GBP) */
  importVAT: number;
  /** Total taxes (duty + VAT) */
  totalTaxes: number;
  /** Whether PVA is elected (import VAT deferred to VAT return) */
  pvaElected: boolean;
  /** Amount payable at border (duty only if PVA elected) */
  payableAtBorder: number;
  /** Amount deferred to VAT return (import VAT if PVA elected) */
  deferredToVATReturn: number;
  /** Whether this is an OP re-import (duty on repair cost only) */
  isOPReimport: boolean;
  /** Calculation steps for educational display */
  calculationSteps: CalculationStep[];
}

/** A single step in the duty/VAT calculation (for educational display) */
export interface CalculationStep {
  /** Step label */
  label: string;
  /** Formula or description */
  formula: string;
  /** Result value */
  amount: number;
  /** Educational note explaining this step */
  educationalNote: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

/** Result of a single validation check */
export interface ValidationResult {
  /** Rule identifier (V1–V13) */
  ruleId: ValidationRuleId;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable explanation */
  message: string;
  /** Which data elements are affected */
  affectedElements: string[];
  /** Whether the rule passed */
  passed: boolean;
}

/** Required document entry for the checklist */
export interface RequiredDocument {
  /** Document code */
  code: DocumentCode;
  /** Document name */
  name: string;
  /** Why it is required */
  reason: string;
  /** Whether it is present in the declaration */
  present: boolean;
}

// ─── Declaration Output ────────────────────────────────────────────────────────

/** Complete declaration output after submission */
export interface DeclarationOutput {
  /** Declaration status (accepted/rejected) */
  status: DeclarationStatus;
  /** Duty and tax calculation */
  dutyCalculation: DutyCalculation;
  /** All validation results */
  validationResults: ValidationResult[];
  /** Document checklist */
  documentChecklist: RequiredDocument[];
  /** Validation summary counts */
  validationSummary: {
    errors: number;
    warnings: number;
    info: number;
    passed: number;
    total: number;
  };
  /** Declaration summary text */
  summaryText: string;
}

// ─── Configuration ─────────────────────────────────────────────────────────────

/** Configuration for the CDS Import Declaration tool */
export interface CDSImportDeclarationConfig {
  /** Whether to show educational tooltips inline */
  showTooltips: boolean;
  /** Whether to show calculation steps after submission */
  showCalculationSteps: boolean;
  /** Scenario label for tracking */
  scenarioLabel?: string;
  /** Whether to restrict to specific procedure codes */
  allowedProcedureCodes?: ProcedureCode[];
}

// ─── Tracking Callbacks ────────────────────────────────────────────────────────

/** Payload for the onFieldEntry callback */
export interface FieldEntryEvent {
  /** CDS data element identifier (e.g., "DE 1/10", "DE 4/11") */
  dataElement: string;
  /** Value entered */
  value: string | number | boolean;
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onValidation callback */
export interface DeclarationValidationEvent {
  /** All validation results */
  validationResults: ValidationResult[];
  /** Pass count */
  passCount: number;
  /** Fail count */
  failCount: number;
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onSubmit callback */
export interface DeclarationSubmitEvent {
  /** Full declaration output */
  declarationSummary: DeclarationOutput;
  /** Whether the declaration was accepted */
  isAccepted: boolean;
  /** Attempt number */
  attemptNumber: number;
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onHint callback */
export interface DeclarationHintEvent {
  /** Data element the hint is for */
  dataElement: string;
  /** Hint type */
  hintType: 'tooltip' | 'explanation' | 'example';
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onReset callback */
export interface DeclarationResetEvent {
  /** Previous attempt output */
  previousAttempt: DeclarationOutput | null;
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onDocumentCheck callback */
export interface DocumentCheckEvent {
  /** Required documents list */
  requiredDocs: RequiredDocument[];
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onDutyCalculation callback */
export interface DutyCalculationEvent {
  /** Duty amount */
  dutyAmount: number;
  /** VAT amount */
  vatAmount: number;
  /** Total taxes */
  totalTaxes: number;
  /** Timestamp */
  timestamp: number;
}

/** Payload for the onScenarioLoad callback */
export interface ScenarioLoadEvent {
  /** Scenario ID */
  scenarioId: string;
  /** Section number */
  section: number;
  /** Timestamp */
  timestamp: number;
}

/** All tracking callbacks the component accepts */
export interface CDSImportDeclarationCallbacks {
  onFieldEntry?: (event: FieldEntryEvent) => void;
  onValidation?: (event: DeclarationValidationEvent) => void;
  onSubmit?: (event: DeclarationSubmitEvent) => void;
  onHint?: (event: DeclarationHintEvent) => void;
  onReset?: (event: DeclarationResetEvent) => void;
  onDocumentCheck?: (event: DocumentCheckEvent) => void;
  onDutyCalculation?: (event: DutyCalculationEvent) => void;
  onScenarioLoad?: (event: ScenarioLoadEvent) => void;
}

// ─── Component Props ───────────────────────────────────────────────────────────

/** Props for the CDSImportDeclaration React component */
export interface CDSImportDeclarationProps {
  /** Configuration for this declaration instance */
  config: CDSImportDeclarationConfig;
  /** Expected correct answers for graded mode (optional) */
  expectedAnswers?: Partial<DeclarationOutput>;
  /** Tracking callbacks for the MojiTax platform */
  callbacks?: CDSImportDeclarationCallbacks;
  /** Whether to show educational tooltips inline */
  showTooltips?: boolean;
  /** CSS class name for the root element */
  className?: string;
}

// ─── H&C Scenario Types ───────────────────────────────────────────────────────

/** Pre-configured test scenario for H&C storyline */
export interface HCDeclarationScenario {
  /** Scenario identifier (e.g., "s2-olive-oil-import") */
  id: string;
  /** Display name */
  name: string;
  /** Section this scenario belongs to */
  section: number;
  /** Brief description */
  description: string;
  /** Pre-filled configuration */
  config: CDSImportDeclarationConfig;
  /** Pre-filled declaration inputs */
  preFilledInputs: DeclarationInputs;
  /** Expected correct output */
  expectedOutput: DutyCalculation;
  /** Hints available for this scenario */
  hints: Record<string, string[]>;
}
