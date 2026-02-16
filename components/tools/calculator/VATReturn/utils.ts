// ============================================================================
// VAT Return (Boxes 1-9) — Pure Functions, Constants, and Test Data
// Tool ID: vat-return-boxes-1-9
// ============================================================================

import type {
  BoxNumber,
  BusinessType,
  BlockedCategory,
  ValidationCheck,
  ValidationStatus,
  PartialExemptionData,
  VATReturnSetup,
  VATReturnBoxes,
  ErrorCorrectionData,
  BadDebtReliefData,
} from './types';

// ---------------------------------------------------------------------------
// 1. Constants
// ---------------------------------------------------------------------------

/** UK VAT rates — VATA 1994 */
export const VAT_RATES = {
  STANDARD: 0.20,
  REDUCED: 0.05,
  ZERO: 0.00,
} as const;

/** VAT fraction for extracting VAT from a gross (VAT-inclusive) amount at 20% */
export const VAT_FRACTION = 1 / 6;

/** Error correction: errors at or below this can be adjusted on the next return (10.B §3.1) */
export const ERROR_CORRECTION_THRESHOLD = 10_000;

/** Error correction: upper limit for the percentage-of-turnover alternative (10.B §3.1) */
export const ERROR_CORRECTION_UPPER_LIMIT = 50_000;

/** BDR: minimum months since later of payment due / date of supply (6.C §1.1) */
export const BDR_WAITING_MONTHS = 6;

/** BDR: absolute time limit in months — 4 years 6 months (6.C §2) */
export const BDR_TIME_LIMIT_MONTHS = 54;

/** De minimis: monthly average threshold for exempt input tax (7.C §3.2) */
export const DE_MINIMIS_MONTHLY = 625;

/** De minimis: exempt input tax must be below this proportion of total input tax (7.C §3.2) */
export const DE_MINIMIS_PERCENTAGE = 0.50;

/** Filing deadline: 1 calendar month + 7 days after period end (electronic) (10.B §2.2) */
export const FILING_DEADLINE_DAYS = 37;

/** Blocked input tax categories with reasons (7.B) */
export const BLOCKED_CATEGORIES: Record<BlockedCategory, string> = {
  business_entertainment:
    'Business entertainment is wholly blocked from input tax recovery (s.24(3) VATA 1994, VAT Notice 700 §34.6). This includes hospitality for anyone other than employees.',
  motor_car_private_use:
    'Input tax on motor cars with any private use is blocked (Art 7 SI 1992/3222). Recovery is only permitted where there is no private use (e.g., driving school, taxi).',
  non_business_use:
    'Input tax attributable to non-business activities is not deductible (s.24(1) VATA 1994). Apportion between business and non-business use before applying partial exemption.',
};

// ---------------------------------------------------------------------------
// 2. Box Calculations
// ---------------------------------------------------------------------------

/** Box 3 = Box 1 + Box 2 (total VAT due) */
export function calculateBox3(box1: number, box2: number): number {
  return box1 + box2;
}

/** Box 5 = Box 3 - Box 4 (net VAT payable/repayable) */
export function calculateBox5(box3: number, box4: number): number {
  return box3 - box4;
}

/** Calculate VAT on a net amount at a given rate */
export function calculateVATOnAmount(netAmount: number, rate: number): number {
  return Math.round(netAmount * rate * 100) / 100;
}

/** Extract VAT from a gross (VAT-inclusive) amount using the VAT fraction (1/6 at 20%) */
export function extractVATFromGross(grossAmount: number): number {
  return Math.round(grossAmount * VAT_FRACTION * 100) / 100;
}

// ---------------------------------------------------------------------------
// 3. Partial Exemption (7.C)
// ---------------------------------------------------------------------------

/**
 * Round UP to the next whole percentage.
 * Per 7.C §2.1, the taxable turnover ratio is rounded up.
 * e.g. 90.91% -> 91%, 95.89% -> 96%, 50.00% -> 50%
 */
export function roundPEPercentage(percentage: number): number {
  return Math.ceil(percentage);
}

/**
 * Standard method apportionment (s.26 VATA 1994).
 * Returns the raw ratio, rounded ratio, and recoverable residual input tax.
 */
export function calculatePEStandardMethod(
  taxableSupplies: number,
  totalSupplies: number,
  residualInputTax: number
): { ratioRaw: number; ratioRounded: number; recoverableResidual: number } {
  if (totalSupplies === 0) {
    return { ratioRaw: 0, ratioRounded: 0, recoverableResidual: 0 };
  }
  const ratioRaw = (taxableSupplies / totalSupplies) * 100;
  const ratioRounded = roundPEPercentage(ratioRaw);
  const recoverableResidual =
    Math.round(residualInputTax * (ratioRounded / 100) * 100) / 100;
  return { ratioRaw, ratioRounded, recoverableResidual };
}

/**
 * De minimis tests (7.C §3.2).
 * Both tests must pass for exempt input tax to be treated as de minimis.
 */
export function checkDeMinimis(
  exemptInputTax: number,
  totalInputTax: number,
  monthsInPeriod: number
): { test1Pass: boolean; test2Pass: boolean; isDeMinimis: boolean } {
  const monthlyAverage = monthsInPeriod > 0 ? exemptInputTax / monthsInPeriod : exemptInputTax;
  const test1Pass = monthlyAverage <= DE_MINIMIS_MONTHLY;
  const percentageOfTotal = totalInputTax > 0 ? exemptInputTax / totalInputTax : 0;
  const test2Pass = percentageOfTotal < DE_MINIMIS_PERCENTAGE;
  return { test1Pass, test2Pass, isDeMinimis: test1Pass && test2Pass };
}

/**
 * Complete partial exemption calculation.
 * Combines the standard method, de minimis tests, and produces the adjustment amount.
 */
export function calculatePartialExemption(
  taxableSupplies: number,
  exemptSupplies: number,
  directTaxableInputTax: number,
  directExemptInputTax: number,
  residualInputTax: number,
  monthsInPeriod: number
): PartialExemptionData {
  const totalSupplies = taxableSupplies + exemptSupplies;
  const { ratioRaw, ratioRounded, recoverableResidual } =
    calculatePEStandardMethod(taxableSupplies, totalSupplies, residualInputTax);
  const nonRecoverableResidual =
    Math.round((residualInputTax - recoverableResidual) * 100) / 100;
  const totalExemptInputTax =
    Math.round((directExemptInputTax + nonRecoverableResidual) * 100) / 100;
  const totalInputTax = directTaxableInputTax + directExemptInputTax + residualInputTax;
  const { test1Pass, test2Pass, isDeMinimis } = checkDeMinimis(
    totalExemptInputTax,
    totalInputTax,
    monthsInPeriod
  );
  // If de minimis, no restriction — recover everything. Otherwise, restrict by totalExemptInputTax.
  const adjustmentAmount = isDeMinimis ? 0 : totalExemptInputTax;

  return {
    taxableSupplies,
    exemptSupplies,
    totalSupplies,
    directTaxableInputTax,
    directExemptInputTax,
    residualInputTax,
    ratioRaw: Math.round(ratioRaw * 100) / 100,
    ratioRounded,
    recoverableResidual,
    nonRecoverableResidual,
    totalExemptInputTax,
    deMinimisTest1Pass: test1Pass,
    deMinimisTest2Pass: test2Pass,
    isDeMinimis,
    adjustmentAmount,
  };
}

// ---------------------------------------------------------------------------
// 4. Bad Debt Relief (6.C)
// ---------------------------------------------------------------------------

/**
 * Calculate complete months between two ISO date strings.
 * Returns positive if toDate is after fromDate.
 */
export function monthsBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Check if the 6-month BDR waiting period is met.
 * The period runs from the LATER of the payment due date and date of supply.
 */
export function isBDRWaitingPeriodMet(
  paymentDueDate: string,
  dateOfSupply: string,
  returnPeriodEnd: string
): boolean {
  const triggerDate =
    new Date(paymentDueDate) > new Date(dateOfSupply) ? paymentDueDate : dateOfSupply;
  return monthsBetween(triggerDate, returnPeriodEnd) >= BDR_WAITING_MONTHS;
}

/**
 * Check if the BDR claim is within the 4-year-6-month absolute time limit.
 * Runs from the LATER of payment due date and date of supply.
 */
export function isBDRWithinTimeLimit(
  paymentDueDate: string,
  dateOfSupply: string,
  returnPeriodEnd: string
): boolean {
  const triggerDate =
    new Date(paymentDueDate) > new Date(dateOfSupply) ? paymentDueDate : dateOfSupply;
  return monthsBetween(triggerDate, returnPeriodEnd) <= BDR_TIME_LIMIT_MONTHS;
}

/**
 * Calculate the BDR VAT amount from a gross unpaid amount.
 * Uses the VAT fraction (1/6 at standard rate).
 */
export function calculateBDRAmount(grossAmountUnpaid: number): number {
  return extractVATFromGross(grossAmountUnpaid);
}

// ---------------------------------------------------------------------------
// 5. Error Correction (10.B §3)
// ---------------------------------------------------------------------------

/**
 * Determine whether an error can be corrected on the next VAT return
 * or must be notified to HMRC separately.
 */
export function checkErrorCorrectionThreshold(
  netErrorAmount: number,
  box6Turnover: number
): { withinThreshold: boolean; method: string; educationalNote: string } {
  const absError = Math.abs(netErrorAmount);

  if (absError <= ERROR_CORRECTION_THRESHOLD) {
    return {
      withinThreshold: true,
      method: 'Adjust on next VAT return',
      educationalNote:
        `Net error of ${formatCurrency(absError)} is within the ${formatCurrency(ERROR_CORRECTION_THRESHOLD)} threshold. ` +
        'Correct by adjusting Box 1 or Box 4 on the next return (10.B §3.1).',
    };
  }

  if (absError <= ERROR_CORRECTION_UPPER_LIMIT) {
    const onePercentOfBox6 = box6Turnover * 0.01;
    if (absError <= onePercentOfBox6) {
      return {
        withinThreshold: true,
        method: 'May adjust on next VAT return',
        educationalNote:
          `Net error of ${formatCurrency(absError)} is between ${formatCurrency(ERROR_CORRECTION_THRESHOLD)} and ` +
          `${formatCurrency(ERROR_CORRECTION_UPPER_LIMIT)} but within 1% of Box 6 turnover ` +
          `(${formatCurrency(onePercentOfBox6)}). You may correct on the next return (10.B §3.1).`,
      };
    }
  }

  return {
    withinThreshold: false,
    method: 'Notify HMRC separately',
    educationalNote:
      `Net error of ${formatCurrency(absError)} exceeds the threshold for return adjustment. ` +
      'You must notify HMRC via the online error correction service (10.B §3.1). ' +
      'Form VAT652 was withdrawn September 2025.',
  };
}

// ---------------------------------------------------------------------------
// 6. Validation Checks
// ---------------------------------------------------------------------------

/**
 * Check 1: PVA output (Box 1) must mirror PVA input (Box 4) unless partly exempt.
 * If partly exempt, Box 4 PVA may be restricted.
 */
export function validatePVAMirror(
  box1PVA: number,
  box4PVA: number,
  isPartiallyExempt: boolean
): ValidationCheck {
  if (isPartiallyExempt) {
    return {
      checkName: 'PVA Mirror Check',
      status: box4PVA <= box1PVA ? 'pass' : 'fail',
      message:
        box4PVA <= box1PVA
          ? 'PVA input does not exceed PVA output (partly exempt business — restriction expected).'
          : `PVA input (${formatCurrency(box4PVA)}) exceeds PVA output (${formatCurrency(box1PVA)}). Review PE restriction.`,
      educationalNote:
        'For partly exempt businesses, the PVA input tax in Box 4 may be less than the PVA output in Box 1 ' +
        'because some import VAT is attributable to exempt supplies and is not recoverable (see 7.C).',
      relatedBoxes: [1, 4],
    };
  }

  const match = Math.abs(box1PVA - box4PVA) < 0.01;
  return {
    checkName: 'PVA Mirror Check',
    status: match ? 'pass' : 'fail',
    message: match
      ? 'PVA output and input entries match — postponed import VAT is correctly mirrored.'
      : `PVA mismatch: Box 1 PVA = ${formatCurrency(box1PVA)}, Box 4 PVA = ${formatCurrency(box4PVA)}. ` +
        'For fully taxable businesses, these must be equal.',
    educationalNote:
      'Postponed VAT Accounting requires matching entries: output tax in Box 1 and recoverable input tax in Box 4. ' +
      'Download the Monthly Postponed Import VAT Statement from HMRC to reconcile (see 2.J).',
    relatedBoxes: [1, 4],
  };
}

/**
 * Check 2: Reverse charge output (Box 1) must mirror input (Box 4) unless partly exempt.
 */
export function validateRCMirror(
  box1RC: number,
  box4RC: number,
  isPartiallyExempt: boolean
): ValidationCheck {
  if (isPartiallyExempt) {
    return {
      checkName: 'Reverse Charge Mirror Check',
      status: box4RC <= box1RC ? 'pass' : 'fail',
      message:
        box4RC <= box1RC
          ? 'Reverse charge input does not exceed output (partly exempt — restriction expected).'
          : `RC input (${formatCurrency(box4RC)}) exceeds RC output (${formatCurrency(box1RC)}). Review PE restriction.`,
      educationalNote:
        'For partly exempt businesses, the reverse charge input in Box 4 may be restricted ' +
        'if the imported service relates to exempt activities (see 5.F and 7.C).',
      relatedBoxes: [1, 4],
    };
  }

  const match = Math.abs(box1RC - box4RC) < 0.01;
  return {
    checkName: 'Reverse Charge Mirror Check',
    status: match ? 'pass' : 'fail',
    message: match
      ? 'Reverse charge output and input entries match correctly.'
      : `RC mismatch: Box 1 RC = ${formatCurrency(box1RC)}, Box 4 RC = ${formatCurrency(box4RC)}. ` +
        'For fully taxable businesses, these must be equal.',
    educationalNote:
      'The reverse charge requires both an output tax entry (Box 1) and an input tax entry (Box 4). ' +
      'A common error is to omit one side of the entry (see 5.F and 10.B §6.1).',
    relatedBoxes: [1, 4],
  };
}

/**
 * Check 3: Validate Bad Debt Relief conditions.
 */
export function validateBDR(
  claimAmount: number,
  originalVAT: number,
  paymentDueDate: string,
  dateOfSupply: string,
  dateWrittenOff: string,
  returnPeriodEnd: string
): ValidationCheck {
  const issues: string[] = [];
  let status: ValidationStatus = 'pass';

  if (claimAmount > originalVAT) {
    issues.push(
      `Claim (${formatCurrency(claimAmount)}) exceeds original VAT (${formatCurrency(originalVAT)})`
    );
    status = 'fail';
  }

  if (!isBDRWaitingPeriodMet(paymentDueDate, dateOfSupply, returnPeriodEnd)) {
    issues.push('6-month waiting period not yet met');
    status = 'fail';
  }

  if (!isBDRWithinTimeLimit(paymentDueDate, dateOfSupply, returnPeriodEnd)) {
    issues.push('Claim is outside the 4-year-6-month time limit');
    status = 'fail';
  }

  if (new Date(dateWrittenOff) > new Date(returnPeriodEnd)) {
    issues.push('Debt must be written off before the end of the return period');
    status = 'fail';
  }

  return {
    checkName: 'Bad Debt Relief Conditions',
    status,
    message:
      status === 'pass'
        ? 'BDR conditions verified — claim may proceed.'
        : `BDR issues: ${issues.join('; ')}.`,
    educationalNote:
      'BDR requires all 5 conditions from s.36 VATA 1994 (see 6.C §1): ' +
      '(1) VAT accounted for, (2) debt written off, (3) 6-month wait from later of payment due date or date of supply, ' +
      '(4) debt not assigned, (5) customary selling price. Claim enters Box 4 only — do NOT adjust Box 7.',
    relatedBoxes: [4],
  };
}

/**
 * Check 4: GB businesses must leave Boxes 8 and 9 at zero.
 * Only XI (NI) businesses use these for intra-Community trade.
 */
export function validateNIBoxes(
  businessType: BusinessType,
  box8: number,
  box9: number
): ValidationCheck {
  if (businessType === 'XI') {
    return {
      checkName: 'NI Boxes (8 & 9) Check',
      status: 'pass',
      message: 'XI-registered business — Boxes 8 and 9 are available for intra-Community trade.',
      educationalNote:
        'Box 8 records the value of goods dispatched from NI to EU member states. ' +
        'Box 9 records the value of goods acquired in NI from EU (see 4.C, 4.D).',
      relatedBoxes: [8, 9],
    };
  }

  const hasValues = box8 !== 0 || box9 !== 0;
  return {
    checkName: 'NI Boxes (8 & 9) Check',
    status: hasValues ? 'fail' : 'pass',
    message: hasValues
      ? `GB business has values in Box 8 (${formatCurrency(box8)}) and/or Box 9 (${formatCurrency(box9)}). ` +
        'These must be zero for GB-only registrations.'
      : 'Boxes 8 and 9 correctly left at zero for GB business.',
    educationalNote:
      'Boxes 8 and 9 relate only to Northern Ireland businesses making intra-Community supplies and acquisitions. ' +
      'GB-only businesses must leave these boxes at zero (10.B §1).',
    relatedBoxes: [8, 9],
  };
}

/**
 * Check 5: Reminder if zero-rated exports are present in Box 6.
 * Not a failure — just an educational prompt about export evidence.
 */
export function validateExportEvidence(box6ZeroRatedExports: number): ValidationCheck {
  if (box6ZeroRatedExports <= 0) {
    return {
      checkName: 'Export Evidence Reminder',
      status: 'pass',
      message: 'No zero-rated exports recorded.',
      educationalNote: '',
      relatedBoxes: [6],
    };
  }

  return {
    checkName: 'Export Evidence Reminder',
    status: 'warning',
    message:
      `Zero-rated exports of ${formatCurrency(box6ZeroRatedExports)} included in Box 6. ` +
      'Ensure export evidence is obtained within the required time limits.',
    educationalNote:
      'Zero-rated exports require proof of export within 3 months of supply (or goods removal). ' +
      'Without valid evidence, HMRC may assess the supply at the standard rate (see 3.F and 6.E). ' +
      'Key documents: bill of lading, airway bill, CMR note, or digital export declaration from CDS.',
    relatedBoxes: [6],
  };
}

/**
 * Check 6: Verify Box 3 = Box 1 + Box 2.
 */
export function validateBox3Calculation(
  box1: number,
  box2: number,
  box3: number
): ValidationCheck {
  const expected = calculateBox3(box1, box2);
  const match = Math.abs(expected - box3) < 0.01;
  return {
    checkName: 'Box 3 Auto-Calculation',
    status: match ? 'pass' : 'fail',
    message: match
      ? `Box 3 correctly calculated: ${formatCurrency(box1)} + ${formatCurrency(box2)} = ${formatCurrency(box3)}.`
      : `Box 3 should be ${formatCurrency(expected)} (Box 1 + Box 2), but is ${formatCurrency(box3)}.`,
    educationalNote: 'Box 3 is always Box 1 + Box 2 — total VAT due on outputs and acquisitions.',
    relatedBoxes: [1, 2, 3],
  };
}

/**
 * Check 7: Verify Box 5 = Box 3 - Box 4.
 */
export function validateBox5Calculation(
  box3: number,
  box4: number,
  box5: number
): ValidationCheck {
  const expected = calculateBox5(box3, box4);
  const match = Math.abs(expected - box5) < 0.01;
  return {
    checkName: 'Box 5 Auto-Calculation',
    status: match ? 'pass' : 'fail',
    message: match
      ? `Box 5 correctly calculated: ${formatCurrency(box3)} - ${formatCurrency(box4)} = ${formatCurrency(box5)}.`
      : `Box 5 should be ${formatCurrency(expected)} (Box 3 - Box 4), but is ${formatCurrency(box5)}.`,
    educationalNote:
      'Box 5 = Box 3 - Box 4. Positive means VAT is payable to HMRC; negative means a repayment is due.',
    relatedBoxes: [3, 4, 5],
  };
}

/**
 * Check 8: If exempt supplies exist, partial exemption must be applied.
 */
export function validatePEApplied(
  hasExemptSupplies: boolean,
  peDataProvided: boolean
): ValidationCheck {
  if (!hasExemptSupplies) {
    return {
      checkName: 'Partial Exemption Applied',
      status: 'pass',
      message: 'No exempt supplies — partial exemption does not apply.',
      educationalNote: '',
      relatedBoxes: [4, 6],
    };
  }

  return {
    checkName: 'Partial Exemption Applied',
    status: peDataProvided ? 'pass' : 'fail',
    message: peDataProvided
      ? 'Partial exemption calculation provided for business with exempt supplies.'
      : 'Exempt supplies detected but no partial exemption calculation provided. ' +
        'Input tax must be restricted (see 7.C).',
    educationalNote:
      'Any business making both taxable and exempt supplies must apply partial exemption (s.26 VATA 1994). ' +
      'The standard method uses a taxable turnover ratio, rounded up to the next whole %. ' +
      'Check de minimis first — if both tests pass, recover all input tax (see 7.C §3).',
    relatedBoxes: [4, 6],
  };
}

/**
 * Check 9: Identify blocked input tax categories.
 */
export function isBlockedInputTax(
  category: BlockedCategory
): { blocked: boolean; reason: string } {
  const reason = BLOCKED_CATEGORIES[category];
  return { blocked: true, reason };
}

/**
 * Check 10: Error correction threshold validation.
 */
export function validateErrorCorrection(
  errorAmount: number,
  box6Turnover: number
): ValidationCheck {
  const { withinThreshold, method, educationalNote } = checkErrorCorrectionThreshold(
    errorAmount,
    box6Turnover
  );

  return {
    checkName: 'Error Correction Threshold',
    status: withinThreshold ? 'pass' : 'warning',
    message: `Error of ${formatCurrency(Math.abs(errorAmount))}: ${method}.`,
    educationalNote,
    relatedBoxes: [1, 4, 6],
  };
}

// ---------------------------------------------------------------------------
// 7. Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run all applicable validation checks on a completed VAT return.
 * Returns an array of ValidationCheck results.
 */
export function runAllValidations(
  setup: VATReturnSetup,
  boxes: VATReturnBoxes,
  peData: PartialExemptionData | null,
  errorData: ErrorCorrectionData | null,
  bdrData: BadDebtReliefData | null
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Sum PVA and RC amounts from transactions
  const pvaOutput = boxes.box1.transactions
    .filter((t) => t.transactionType === 'pva_output')
    .reduce((sum, t) => sum + t.vatAmount, 0);
  const pvaInput = boxes.box4.transactions
    .filter((t) => t.transactionType === 'pva_input')
    .reduce((sum, t) => sum + t.vatAmount, 0);
  const rcOutput = boxes.box1.transactions
    .filter((t) => t.transactionType === 'reverse_charge_output')
    .reduce((sum, t) => sum + t.vatAmount, 0);
  const rcInput = boxes.box4.transactions
    .filter((t) => t.transactionType === 'reverse_charge_input')
    .reduce((sum, t) => sum + t.vatAmount, 0);

  // Check 1: PVA mirror
  if (pvaOutput > 0 || pvaInput > 0) {
    checks.push(validatePVAMirror(pvaOutput, pvaInput, setup.partiallyExempt));
  }

  // Check 2: RC mirror
  if (rcOutput > 0 || rcInput > 0) {
    checks.push(validateRCMirror(rcOutput, rcInput, setup.partiallyExempt));
  }

  // Check 3: BDR conditions
  if (bdrData) {
    checks.push(
      validateBDR(
        bdrData.vatAmountClaimed,
        extractVATFromGross(bdrData.grossAmountUnpaid + bdrData.vatAmountClaimed * 5),
        bdrData.paymentDueDate,
        bdrData.dateOfSupply,
        bdrData.dateWrittenOff,
        setup.period.endDate
      )
    );
  }

  // Check 4: NI boxes
  checks.push(validateNIBoxes(setup.businessType, boxes.box8.value, boxes.box9.value));

  // Check 5: Export evidence
  const zeroRatedExports = boxes.box6.transactions
    .filter((t) => t.transactionType === 'export')
    .reduce((sum, t) => sum + t.netAmount, 0);
  checks.push(validateExportEvidence(zeroRatedExports));

  // Check 6: Box 3 auto-calc
  checks.push(validateBox3Calculation(boxes.box1.value, boxes.box2.value, boxes.box3.value));

  // Check 7: Box 5 auto-calc
  checks.push(validateBox5Calculation(boxes.box3.value, boxes.box4.value, boxes.box5.value));

  // Check 8: PE applied
  const hasExemptSupplies = boxes.box6.transactions.some(
    (t) => t.transactionType === 'output_exempt'
  );
  checks.push(validatePEApplied(hasExemptSupplies, peData !== null));

  // Check 10: Error correction
  if (errorData) {
    checks.push(validateErrorCorrection(errorData.netErrorAmount, errorData.currentBox6Turnover));
  }

  return checks;
}

// ---------------------------------------------------------------------------
// 8. Formatting / Helpers
// ---------------------------------------------------------------------------

/** Format a number as GBP currency: "£1,234.56" */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate the electronic filing deadline.
 * 1 calendar month + 7 days after the period end date.
 */
export function calculateFilingDeadline(periodEndDate: string): Date {
  const d = new Date(periodEndDate);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + 7);
  return d;
}

/** Determine net position from Box 5 value */
export function getNetPosition(box5Value: number): 'payable' | 'repayable' | 'nil' {
  if (box5Value > 0.005) return 'payable';
  if (box5Value < -0.005) return 'repayable';
  return 'nil';
}

/** Generate a unique transaction ID */
export function generateTransactionId(): string {
  return crypto.randomUUID();
}

