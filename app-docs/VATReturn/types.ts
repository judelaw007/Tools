// ============================================================================
// VAT Return (Boxes 1-9) — Type Definitions
// Tool ID: vat-return-boxes-1-9
// Slug: vat-return
// ============================================================================

// ---------------------------------------------------------------------------
// Literal Types
// ---------------------------------------------------------------------------

/** GB = Great Britain only; XI = Northern Ireland (dual GB+XI registration) */
export type BusinessType = 'GB' | 'XI';

export type VATRate = 'standard' | 'reduced' | 'zero';

/**
 * Every transaction on a VAT return maps to one of these types.
 * The type determines which boxes the transaction populates.
 */
export type TransactionType =
  | 'output_standard'
  | 'output_reduced'
  | 'output_zero'
  | 'output_exempt'
  | 'pva_output'
  | 'pva_input'
  | 'reverse_charge_output'
  | 'reverse_charge_input'
  | 'input_standard'
  | 'input_zero'
  | 'bdr_claim'
  | 'error_correction'
  | 'pe_adjustment'
  | 'export'
  | 'eu_acquisition'
  | 'eu_dispatch';

export type BoxNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ValidationStatus = 'pass' | 'fail' | 'warning' | 'info';

export type PEMethod = 'standard' | 'special';

export type BlockedCategory =
  | 'business_entertainment'
  | 'motor_car_private_use'
  | 'non_business_use';

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

/** VAT return period dates */
export interface VATReturnPeriod {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;
  monthsInPeriod: 1 | 3 | 12;
}

/** Step 1 — return configuration */
export interface VATReturnSetup {
  period: VATReturnPeriod;
  businessType: BusinessType;
  pvaElected: boolean;
  partiallyExempt: boolean;
  peMethod: PEMethod;
  hasErrorCorrection: boolean;
  returnType: 'quarterly' | 'monthly' | 'annual';
}

/** Individual line item entered by the student */
export interface TransactionEntry {
  id: string;
  description: string;
  netAmount: number;
  vatAmount: number;
  transactionType: TransactionType;
  vatRate: VATRate | null;
  boxAllocations: Partial<Record<BoxNumber, number>>;
}

/** Single box with its value and contributing transactions */
export interface VATReturnBoxEntry {
  boxNumber: BoxNumber;
  value: number;
  isAutoCalculated: boolean;
  transactions: TransactionEntry[];
}

/** All 9 boxes of the VAT return */
export interface VATReturnBoxes {
  box1: VATReturnBoxEntry;
  box2: VATReturnBoxEntry;
  box3: VATReturnBoxEntry;
  box4: VATReturnBoxEntry;
  box5: VATReturnBoxEntry;
  box6: VATReturnBoxEntry;
  box7: VATReturnBoxEntry;
  box8: VATReturnBoxEntry;
  box9: VATReturnBoxEntry;
}

/** Partial exemption calculation data (standard method — 7.C) */
export interface PartialExemptionData {
  taxableSupplies: number;
  exemptSupplies: number;
  totalSupplies: number;
  directTaxableInputTax: number;
  directExemptInputTax: number;
  residualInputTax: number;
  ratioRaw: number;        // e.g. 95.89
  ratioRounded: number;    // e.g. 96 (rounded UP to next whole %)
  recoverableResidual: number;
  nonRecoverableResidual: number;
  totalExemptInputTax: number;
  deMinimisTest1Pass: boolean; // <= GBP 625/month average
  deMinimisTest2Pass: boolean; // < 50% of total input tax
  isDeMinimis: boolean;        // both tests pass
  adjustmentAmount: number;    // amount to subtract from Box 4
}

/** Error correction data (10.B section 3) */
export interface ErrorCorrectionData {
  errorDescription: string;
  errorPeriod: string;     // period containing the error (e.g. "Q2 2025/26")
  netErrorAmount: number;  // positive = underpaid, negative = overclaimed
  currentBox6Turnover: number;
  withinThreshold: boolean;
  correctionBox: 1 | 4;   // Box 1 if output underpaid, Box 4 if input overclaimed
}

/** Bad debt relief claim data (6.C) */
export interface BadDebtReliefData {
  debtorName: string;
  invoiceDate: string;
  paymentDueDate: string;
  dateOfSupply: string;
  dateWrittenOff: string;
  grossAmountUnpaid: number;
  vatAmountClaimed: number;
  condition1_vatAccountedFor: boolean;
  condition2_writtenOff: boolean;
  condition3_sixMonthsMet: boolean;
  condition4_notAssigned: boolean;
  condition5_customaryPrice: boolean;
}

/** Single validation result */
export interface ValidationCheck {
  checkName: string;
  status: ValidationStatus;
  message: string;
  educationalNote: string;
  relatedBoxes: BoxNumber[];
}

/** Complete output after submitting the return */
export interface VATReturnResult {
  setup: VATReturnSetup;
  boxes: VATReturnBoxes;
  partialExemptionData: PartialExemptionData | null;
  errorCorrectionData: ErrorCorrectionData | null;
  badDebtReliefData: BadDebtReliefData | null;
  validationChecks: ValidationCheck[];
  netPosition: 'payable' | 'repayable' | 'nil';
  netAmount: number;
  filingDeadline: string;
  allChecksPass: boolean;
}

// ---------------------------------------------------------------------------
// Platform Integration Interfaces
// ---------------------------------------------------------------------------

/** Shape persisted to user_saved_work — id and updatedAt are required */
export interface SavedVATReturnData {
  id: string;
  name: string;
  sectionScenario: string;
  setup: VATReturnSetup;
  boxes: VATReturnBoxes;
  partialExemptionData: PartialExemptionData | null;
  errorCorrectionData: ErrorCorrectionData | null;
  badDebtReliefData: BadDebtReliefData | null;
  result: VATReturnResult | null;
  updatedAt: Date;
}

/** Component props — all callbacks optional, tool works without them */
export interface VATReturnProps {
  userId?: string;
  onSave?: (data: Omit<SavedVATReturnData, 'id' | 'updatedAt'>) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedVATReturnData[];
  onTrackCalculation?: (stepName: string, metadata?: Record<string, unknown>) => void;
  onTrackStepChange?: (fromStep: number | string, toStep: number | string) => void;
  onTrackError?: (errorMessage: string, context?: Record<string, unknown>) => void;
  onTrackCompletion?: (metadata?: Record<string, unknown>) => void;
}

