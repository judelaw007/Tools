/**
 * s.455 Loans to Participators Calculator — Utility Functions
 *
 * Pure functions for computing s.455 CTA 2010 tax on loans to
 * participators, applying the s.464C bed-and-breakfast rule,
 * computing key compliance dates, and analysing write-off
 * consequences.
 *
 * s.455 rate: 33.75% (from 6 April 2022)
 * s.464C matching window: 30 calendar days
 * Official rate of interest (BIK): 2.25%
 */

import type {
  TaxBand,
  AccountingPeriod,
  DLAMovements,
  Repayment,
  Reborrowing,
  WriteOffDetails,
  S455Inputs,
  BalanceTracker,
  BedAndBreakfastMatch,
  BedAndBreakfastResult,
  S455Computation,
  KeyDates,
  WriteOffAnalysis,
  TimelineEvent,
  ValidationResult,
  S455Output,
  HCScenario,
} from './types';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** s.455 tax rate (from 6 April 2022) */
export const S455_RATE = 0.3375;

/** Previous s.455 rate (6 April 2016 to 5 April 2022) */
export const S455_RATE_2016 = 0.325;

/** Original s.455 rate (before 6 April 2016) */
export const S455_RATE_PRE_2016 = 0.25;

/** HMRC official rate of interest for beneficial loan BIK */
export const OFFICIAL_RATE = 0.0225;

/** s.464C matching window in calendar days */
export const BED_AND_BREAKFAST_DAYS = 30;

/** s.464C de minimis threshold (HMRC practice) */
export const BED_AND_BREAKFAST_DE_MINIMIS = 5_000;

/** Dividend allowance (2025/26) */
export const DIVIDEND_ALLOWANCE = 500;

/** Dividend tax rates by band */
export const DIVIDEND_RATES: Record<TaxBand, number> = {
  basic: 0.0875,
  higher: 0.3375,
  additional: 0.3935,
};

/** Income tax rates by band (for BIK comparison) */
export const INCOME_TAX_RATES: Record<TaxBand, number> = {
  basic: 0.20,
  higher: 0.40,
  additional: 0.45,
};

/** Employer Class 1A NIC rate (2025/26) */
export const EMPLOYER_NIC_RATE = 0.15;

/** Maximum accounting period length in days (18 months) */
export const MAX_AP_DAYS = 548;

// ─── Date Utilities ─────────────────────────────────────────────────────────────

/** Parse an ISO date string to a Date object */
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/** Calculate calendar days between two dates */
export function daysBetween(dateA: string, dateB: string): number {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Add months to a date */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Add days to a date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate 9 months and 1 day after a given date.
 * This is the standard HMRC deadline formula used for:
 * - CT payment deadline
 * - s.455 tax due date
 * - s.455 refund date
 */
export function nineMonthsAndOneDay(dateStr: string): string {
  const date = parseDate(dateStr);
  const result = addDays(addMonths(date, 9), 1);
  return formatISODate(result);
}

/** Calculate 12 months after a given date (CT filing deadline) */
export function twelveMonthsAfter(dateStr: string): string {
  const date = parseDate(dateStr);
  const result = addMonths(date, 12);
  return formatISODate(result);
}

/** Format a Date to ISO date string (YYYY-MM-DD) */
function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Calculate the AP end date for the next accounting period (assumes same length AP) */
function nextAPEnd(currentAPEnd: string): string {
  return twelveMonthsAfter(currentAPEnd);
}

// ─── DLA Balance Computation ────────────────────────────────────────────────────

/**
 * Compute the raw DLA closing balance before s.464C adjustment.
 *
 * Closing = Opening + Debits - Credits - Repayments (within AP)
 *
 * Positive = overdrawn (loan to participator, s.455 applies)
 * Negative or zero = in credit (no s.455 issue)
 */
export function computeRawClosingBalance(
  movements: DLAMovements,
  repayments: Repayment[],
  apEndDate: string
): number {
  // Only include repayments on or before the AP end date
  const repaymentsInAP = repayments.filter(
    (r) => r.date && r.date <= apEndDate
  );
  const totalRepayments = repaymentsInAP.reduce((sum, r) => sum + r.amount, 0);

  const closing =
    movements.openingBalance +
    movements.totalDebits -
    movements.totalCredits -
    totalRepayments;

  return closing;
}

// ─── s.464C Bed-and-Breakfast Rule ──────────────────────────────────────────────

/**
 * Apply the s.464C bed-and-breakfast anti-avoidance rule.
 *
 * For each repayment, check if any re-borrowing occurs within 30
 * calendar days after the repayment date. If so, the repayment is
 * disregarded for s.455 purposes to the extent of the re-borrowing.
 *
 * The matching amount = min(repayment amount, total re-borrowing within 30 days)
 */
export function checkBedAndBreakfast(
  repayments: Repayment[],
  reborrowings: Reborrowing[]
): BedAndBreakfastResult {
  const matches: BedAndBreakfastMatch[] = [];

  for (const repayment of repayments) {
    if (!repayment.date || repayment.amount <= 0) continue;

    const matchedReborrowings: Array<{ date: string; amount: number; description: string }> = [];
    let minDays = Infinity;

    for (const reborrowing of reborrowings) {
      if (!reborrowing.date || reborrowing.amount <= 0) continue;

      const gap = daysBetween(repayment.date, reborrowing.date);

      // s.464C: re-borrowing must be within 30 days AFTER the repayment
      if (gap >= 0 && gap <= BED_AND_BREAKFAST_DAYS) {
        matchedReborrowings.push({
          date: reborrowing.date,
          amount: reborrowing.amount,
          description: reborrowing.description,
        });
        if (gap < minDays) minDays = gap;
      }
    }

    if (matchedReborrowings.length > 0) {
      const totalReborrowed = matchedReborrowings.reduce((sum, r) => sum + r.amount, 0);
      const disregardedAmount = Math.min(repayment.amount, totalReborrowed);

      matches.push({
        repayment: {
          date: repayment.date,
          amount: repayment.amount,
          description: repayment.description,
        },
        reborrowings: matchedReborrowings,
        daysBetween: minDays,
        disregardedAmount,
      });
    }
  }

  const totalDisregarded = matches.reduce((sum, m) => sum + m.disregardedAmount, 0);
  const triggered = matches.length > 0;

  let explanation: string;
  if (triggered) {
    explanation =
      `s.464C CTA 2010 applies. ${matches.length} repayment${matches.length > 1 ? 's' : ''} ` +
      `matched with re-borrowing${matches.length > 1 ? 's' : ''} within 30 days. ` +
      `Total repayments disregarded: ${formatPounds(totalDisregarded)}. ` +
      `The DLA closing balance for s.455 purposes is increased by this amount.`;
  } else {
    explanation =
      'No bed-and-breakfast arrangements detected. All repayments are effective ' +
      'for s.455 purposes — no s.464C adjustment required.';
  }

  return { triggered, matches, totalDisregarded, explanation };
}

// ─── s.455 Tax Computation ──────────────────────────────────────────────────────

/** Compute the s.455 tax liability */
export function computeS455Tax(
  closingBalanceAdjusted: number,
  closingBalanceRaw: number,
  s455Rate: number
): S455Computation {
  const chargeableAmount = Math.max(0, closingBalanceAdjusted);
  const s455Tax = Math.round(chargeableAmount * s455Rate * 100) / 100;

  const rawChargeable = Math.max(0, closingBalanceRaw);
  const s455TaxWithoutS464C = Math.round(rawChargeable * s455Rate * 100) / 100;
  const s464CDifference = Math.round((s455Tax - s455TaxWithoutS464C) * 100) / 100;

  return {
    chargeableAmount,
    s455Rate,
    s455Tax,
    s455TaxWithoutS464C,
    s464CDifference,
  };
}

// ─── Key Dates ──────────────────────────────────────────────────────────────────

/** Compute key compliance dates */
export function computeKeyDates(apEndDate: string): KeyDates {
  const s455DueDate = nineMonthsAndOneDay(apEndDate);
  const ctFilingDeadline = twelveMonthsAfter(apEndDate);
  const ctPaymentDeadline = s455DueDate; // Same date
  const nextEnd = nextAPEnd(apEndDate);
  const earliestRefundDate = nineMonthsAndOneDay(nextEnd);

  return {
    apEndDate,
    s455DueDate,
    ctFilingDeadline,
    ctPaymentDeadline,
    earliestRefundDate,
  };
}

// ─── Write-Off Analysis ─────────────────────────────────────────────────────────

/** Analyse the consequences of writing off part of the DLA */
export function analyseWriteOff(
  writeOff: WriteOffDetails,
  s455Rate: number,
  officialRate: number
): WriteOffAnalysis {
  const { amount, participatorTaxBand, dividendAllowanceUsed } = writeOff;

  // Distribution treatment (s.415 ITTOIA 2005)
  const dividendRate = DIVIDEND_RATES[participatorTaxBand];
  const taxableWriteOff = dividendAllowanceUsed
    ? amount
    : Math.max(0, amount - DIVIDEND_ALLOWANCE);
  const distributionTax = Math.round(taxableWriteOff * dividendRate * 100) / 100;

  // s.455 relief to company
  const s455Relief = Math.round(amount * s455Rate * 100) / 100;

  // Net costs
  const netCostToParticipator = distributionTax;
  const netCostToCompany = amount - s455Relief;

  // Alternative: keep the loan outstanding
  const keepLoanBIK = Math.round(amount * officialRate * 100) / 100;
  const incomeTaxRate = INCOME_TAX_RATES[participatorTaxBand];
  const keepLoanBIKTax = Math.round(keepLoanBIK * incomeTaxRate * 100) / 100;
  const keepLoanEmployerNIC = Math.round(keepLoanBIK * EMPLOYER_NIC_RATE * 100) / 100;
  const keepLoanS455 = Math.round(amount * s455Rate * 100) / 100;

  // Recommendation
  const writeOffAnnualCost = distributionTax; // One-off permanent cost
  const keepAnnualCost = keepLoanBIKTax + keepLoanEmployerNIC; // Ongoing annual cost
  const yearsToBreakEven = keepAnnualCost > 0 ? writeOffAnnualCost / keepAnnualCost : Infinity;

  let recommendation: string;
  let explanation: string;

  if (yearsToBreakEven > 10) {
    recommendation = 'Keep the loan outstanding';
    explanation =
      `Writing off ${formatPounds(amount)} creates a permanent income tax cost of ${formatPounds(distributionTax)} ` +
      `for the participator (deemed distribution at ${formatPercent(dividendRate)}). ` +
      `Keeping the loan outstanding costs only ${formatPounds(keepAnnualCost)}/year in BIK-related taxes, ` +
      `and the s.455 charge of ${formatPounds(keepLoanS455)} is refundable when the loan is repaid. ` +
      `The write-off is only advisable if the participator cannot or will not repay the loan.`;
  } else {
    recommendation = 'Consider write-off carefully';
    explanation =
      `Writing off ${formatPounds(amount)} costs ${formatPounds(distributionTax)} in income tax ` +
      `(permanent). Keeping the loan costs ${formatPounds(keepAnnualCost)}/year ` +
      `(BIK tax + employer NIC). Break-even is approximately ${Math.round(yearsToBreakEven)} years. ` +
      `The s.455 charge of ${formatPounds(keepLoanS455)} is refundable when repaid. ` +
      `Consider the participator's ability and intention to repay.`;
  }

  return {
    writeOffAmount: amount,
    distributionTax,
    distributionRate: dividendRate,
    s455Relief,
    netCostToParticipator,
    netCostToCompany,
    keepLoanBIK,
    keepLoanBIKTax,
    keepLoanEmployerNIC,
    keepLoanS455,
    recommendation,
    explanation,
  };
}

// ─── Timeline Generation ────────────────────────────────────────────────────────

/** Generate timeline events for visualisation */
export function generateTimeline(
  inputs: S455Inputs,
  keyDates: KeyDates,
  bedAndBreakfast: BedAndBreakfastResult
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // AP start
  if (inputs.accountingPeriod.startDate) {
    events.push({
      date: inputs.accountingPeriod.startDate,
      label: 'Accounting period starts',
      type: 'period-start',
      amount: inputs.movements.openingBalance,
      note: `DLA opening balance: ${formatPounds(inputs.movements.openingBalance)} overdrawn`,
    });
  }

  // Repayments
  for (const r of inputs.repayments) {
    if (!r.date) continue;
    const isDisregarded = bedAndBreakfast.matches.some(
      (m) => m.repayment.date === r.date && m.repayment.amount === r.amount
    );
    events.push({
      date: r.date,
      label: r.description || 'DLA repayment',
      type: 'repayment',
      amount: r.amount,
      note: isDisregarded
        ? `Disregarded under s.464C — re-borrowing within ${BED_AND_BREAKFAST_DAYS} days`
        : 'Effective repayment — reduces DLA balance',
    });
  }

  // AP end
  if (inputs.accountingPeriod.endDate) {
    events.push({
      date: inputs.accountingPeriod.endDate,
      label: 'Accounting period ends',
      type: 'period-end',
      note: 's.455 charge based on DLA balance at this date',
    });
  }

  // Re-borrowings (may be after AP end)
  for (const rb of inputs.reborrowings) {
    if (!rb.date) continue;
    const isMatch = bedAndBreakfast.matches.some((m) =>
      m.reborrowings.some((r) => r.date === rb.date && r.amount === rb.amount)
    );
    events.push({
      date: rb.date,
      label: rb.description || 'DLA re-borrowing',
      type: 'reborrowing',
      amount: rb.amount,
      note: isMatch
        ? `Triggers s.464C — within ${BED_AND_BREAKFAST_DAYS} days of repayment`
        : 'New loan advance',
    });
  }

  // Key dates
  if (keyDates.s455DueDate) {
    events.push({
      date: keyDates.s455DueDate,
      label: 's.455 tax due / CT payment deadline',
      type: 'deadline',
      note: '9 months and 1 day after AP end. s.455 tax payable alongside CT.',
    });
  }

  if (keyDates.ctFilingDeadline) {
    events.push({
      date: keyDates.ctFilingDeadline,
      label: 'CT600 filing deadline',
      type: 'deadline',
      note: '12 months after AP end.',
    });
  }

  if (keyDates.earliestRefundDate) {
    events.push({
      date: keyDates.earliestRefundDate,
      label: 'Earliest s.455 refund date',
      type: 'refund',
      note: '9m+1d after end of next AP (if loan fully repaid in that AP).',
    });
  }

  // Sort by date
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return events;
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: S455Inputs): ValidationResult[] {
  const results: ValidationResult[] = [];

  // V1: AP dates valid
  if (!inputs.accountingPeriod.startDate || !inputs.accountingPeriod.endDate) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Both accounting period start and end dates must be provided.',
      passed: false,
    });
  } else {
    const start = parseDate(inputs.accountingPeriod.startDate);
    const end = parseDate(inputs.accountingPeriod.endDate);
    if (end <= start) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: 'Accounting period end date must be after start date.',
        passed: false,
      });
    }
    const apDays = daysBetween(inputs.accountingPeriod.startDate, inputs.accountingPeriod.endDate);
    if (apDays > MAX_AP_DAYS) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: `Accounting period is ${apDays} days. Maximum is 18 months (${MAX_AP_DAYS} days).`,
        passed: false,
      });
    }
  }

  // V2: Opening balance valid
  if (inputs.movements.openingBalance < 0) {
    results.push({
      ruleId: 'V2',
      severity: 'error',
      message: 'Opening balance must be zero or positive. Enter the overdrawn amount (loan to participator). If the DLA is in credit, enter 0.',
      passed: false,
    });
  }

  // V3: Credits and debits valid
  if (inputs.movements.totalCredits < 0) {
    results.push({
      ruleId: 'V3',
      severity: 'error',
      message: 'Total credits must be zero or positive.',
      passed: false,
    });
  }
  if (inputs.movements.totalDebits < 0) {
    results.push({
      ruleId: 'V3',
      severity: 'error',
      message: 'Total debits must be zero or positive.',
      passed: false,
    });
  }

  // V4: Repayment amounts valid
  for (const r of inputs.repayments) {
    if (r.amount <= 0 && r.date) {
      results.push({
        ruleId: 'V4',
        severity: 'error',
        message: `Repayment on ${formatDate(r.date)} must have a positive amount.`,
        passed: false,
      });
    }
    if (r.amount > 0 && !r.date) {
      results.push({
        ruleId: 'V4',
        severity: 'error',
        message: `Repayment of ${formatPounds(r.amount)} must have a date.`,
        passed: false,
      });
    }
  }

  // V5: Re-borrowing amounts valid
  for (const rb of inputs.reborrowings) {
    if (rb.amount <= 0 && rb.date) {
      results.push({
        ruleId: 'V5',
        severity: 'error',
        message: `Re-borrowing on ${formatDate(rb.date)} must have a positive amount.`,
        passed: false,
      });
    }
    if (rb.amount > 0 && !rb.date) {
      results.push({
        ruleId: 'V5',
        severity: 'error',
        message: `Re-borrowing of ${formatPounds(rb.amount)} must have a date.`,
        passed: false,
      });
    }
  }

  // V6: Closing balance check (computed after balance calculation — info only)
  // Deferred to the main computation

  // V7: Write-off amount check
  if (inputs.writeOff.enabled) {
    if (inputs.writeOff.amount <= 0) {
      results.push({
        ruleId: 'V7',
        severity: 'warning',
        message: 'Write-off analysis is enabled but amount is zero or negative.',
        passed: false,
      });
    }
  }

  // V8: s.464C de minimis
  const totalReborrowing = inputs.reborrowings.reduce((sum, rb) => sum + rb.amount, 0);
  if (totalReborrowing > 0 && totalReborrowing < BED_AND_BREAKFAST_DE_MINIMIS) {
    results.push({
      ruleId: 'V8',
      severity: 'info',
      message: `Total re-borrowing of ${formatPounds(totalReborrowing)} is below the s.464C de minimis threshold of ${formatPounds(BED_AND_BREAKFAST_DE_MINIMIS)}. HMRC may not apply the bed-and-breakfast rule for small amounts.`,
      passed: false,
    });
  }

  // V9: Repayment timing
  for (const r of inputs.repayments) {
    if (!r.date || !inputs.accountingPeriod.endDate) continue;
    const daysToAPEnd = daysBetween(r.date, inputs.accountingPeriod.endDate);
    if (daysToAPEnd >= 0 && daysToAPEnd <= BED_AND_BREAKFAST_DAYS) {
      const matchedRB = inputs.reborrowings.filter((rb) => {
        if (!rb.date) return false;
        const gap = daysBetween(r.date, rb.date);
        return gap >= 0 && gap <= BED_AND_BREAKFAST_DAYS;
      });
      if (matchedRB.length > 0) {
        results.push({
          ruleId: 'V9',
          severity: 'info',
          message: `Repayment on ${formatDate(r.date)} (${daysToAPEnd} days before AP end) has a re-borrowing within ${BED_AND_BREAKFAST_DAYS} days — s.464C may apply.`,
          passed: false,
        });
      }
    }
  }

  return results;
}

/** Summarise validation results */
export function summariseValidation(results: ValidationResult[]) {
  return {
    errors: results.filter((r) => r.severity === 'error' && !r.passed).length,
    warnings: results.filter((r) => r.severity === 'warning' && !r.passed).length,
    info: results.filter((r) => r.severity === 'info').length,
  };
}

// ─── Full Computation ───────────────────────────────────────────────────────────

/** Run the full s.455 computation */
export function computeS455(inputs: S455Inputs): S455Output {
  // Validate
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Step 1: Compute raw closing balance
  const closingBalanceRaw = computeRawClosingBalance(
    inputs.movements,
    inputs.repayments,
    inputs.accountingPeriod.endDate
  );

  // Total repayments within AP
  const totalRepayments = inputs.repayments
    .filter((r) => r.date && r.date <= inputs.accountingPeriod.endDate)
    .reduce((sum, r) => sum + r.amount, 0);

  // Step 2: s.464C bed-and-breakfast check
  const bedAndBreakfast = checkBedAndBreakfast(inputs.repayments, inputs.reborrowings);

  // Step 3: Adjusted closing balance
  const closingBalanceAdjusted = closingBalanceRaw + bedAndBreakfast.totalDisregarded;

  // Balance tracker
  const balanceTracker: BalanceTracker = {
    openingBalance: inputs.movements.openingBalance,
    totalCredits: inputs.movements.totalCredits,
    totalDebits: inputs.movements.totalDebits,
    totalRepayments,
    closingBalanceRaw: Math.max(0, closingBalanceRaw),
    totalDisregarded: bedAndBreakfast.totalDisregarded,
    closingBalanceAdjusted: Math.max(0, closingBalanceAdjusted),
  };

  // Add V6 validation (closing balance check) now that we have the computed value
  if (closingBalanceAdjusted <= 0) {
    validationResults.push({
      ruleId: 'V6',
      severity: 'info',
      message: 'The adjusted DLA closing balance is zero or in credit. No s.455 charge arises — the participator does not owe money to the company at the AP end.',
      passed: false,
    });
  }

  // Add V7 check for write-off exceeding balance
  if (inputs.writeOff.enabled && inputs.writeOff.amount > Math.max(0, closingBalanceAdjusted)) {
    validationResults.push({
      ruleId: 'V7',
      severity: 'warning',
      message: `Write-off amount of ${formatPounds(inputs.writeOff.amount)} exceeds the adjusted closing balance of ${formatPounds(Math.max(0, closingBalanceAdjusted))}. The write-off cannot exceed the outstanding loan.`,
      passed: false,
    });
  }

  // Recompute summary after adding deferred validations
  const finalSummary = summariseValidation(validationResults);

  // Step 4: s.455 tax computation
  const s455Computation = computeS455Tax(
    Math.max(0, closingBalanceAdjusted),
    Math.max(0, closingBalanceRaw),
    inputs.s455Rate
  );

  // Step 5: Key dates
  const keyDates = computeKeyDates(inputs.accountingPeriod.endDate);

  // Step 6: Write-off analysis
  let writeOffAnalysis: WriteOffAnalysis | null = null;
  if (inputs.writeOff.enabled && inputs.writeOff.amount > 0) {
    writeOffAnalysis = analyseWriteOff(inputs.writeOff, inputs.s455Rate, inputs.officialRate);
  }

  // Timeline
  const timeline = generateTimeline(inputs, keyDates, bedAndBreakfast);

  return {
    balanceTracker,
    bedAndBreakfast,
    s455Computation,
    keyDates,
    writeOffAnalysis,
    timeline,
    validationResults,
    validationSummary: finalSummary,
  };
}

// ─── Empty Inputs ───────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): S455Inputs {
  return {
    accountingPeriod: {
      startDate: '',
      endDate: '',
    },
    movements: {
      openingBalance: 0,
      totalCredits: 0,
      totalDebits: 0,
    },
    repayments: [],
    reborrowings: [],
    writeOff: {
      enabled: false,
      amount: 0,
      participatorTaxBand: 'higher',
      isShareholderDirector: true,
      dividendAllowanceUsed: true,
    },
    s455Rate: S455_RATE,
    officialRate: OFFICIAL_RATE,
  };
}

/** Generate a unique ID for repayments/re-borrowings */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ─── Formatting Helpers ──────────────────────────────────────────────────────

/** Format a number as GBP currency (no decimals) */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toLocaleString('en-GB');
  if (amount < 0) return `(${formatted})`;
  return formatted;
}

/** Format a number as GBP with £ sign */
export function formatPounds(amount: number): string {
  return `£${formatCurrency(amount)}`;
}

/** Format a number with 2 decimal places and £ sign */
export function formatPoundsPence(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `(£${formatted})`;
  return `£${formatted}`;
}

/** Format a percentage (from decimal, e.g., 0.3375 → "33.75%") */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/** Format a percentage with no decimals */
export function formatPercentWhole(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Format a date for display (e.g., "15 March 2026") */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format a date short (e.g., "15 Mar 2026") */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  {
    id: 's6-marcus-dla-bed-and-breakfast',
    name: 'S6 — Marcus DLA: Bed-and-Breakfast & Write-Off Analysis',
    section: 6,
    description:
      'HMRC enquiry into Marcus Caldwell\'s overdrawn DLA at C&S Engineering Ltd. ' +
      'Opening balance £45,000 overdrawn. Credits: salary £50,270 + dividends £30,000 = £80,270. ' +
      'Debits: drawings £120,270. Repayment of £50,000 on 15 March 2026, re-borrowing of £50,000 ' +
      'on 10 April 2026 (26 days later — triggers s.464C). Board considering writing off £20,000. ' +
      'Expected s.455 tax: £28,687.50 on adjusted balance of £85,000.',
    preFilledInputs: {
      accountingPeriod: {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
      },
      movements: {
        openingBalance: 45_000,
        totalCredits: 80_270,
        totalDebits: 120_270,
      },
      repayments: [
        {
          id: 'r1',
          date: '2026-03-15',
          amount: 50_000,
          description: 'Bank transfer from Marcus to company',
        },
      ],
      reborrowings: [
        {
          id: 'rb1',
          date: '2026-04-10',
          amount: 50_000,
          description: 'Cash withdrawal by Marcus',
        },
      ],
      writeOff: {
        enabled: true,
        amount: 20_000,
        participatorTaxBand: 'higher',
        isShareholderDirector: true,
        dividendAllowanceUsed: true,
      },
      s455Rate: S455_RATE,
      officialRate: OFFICIAL_RATE,
    },
    expectedS455Tax: 28_687.50,
    expectedAdjustedBalance: 85_000,
    expectedBedAndBreakfast: true,
    hints: [
      'The raw DLA closing balance is £35,000 (£45k + £120,270 − £80,270 − £50,000).',
      'Marcus\'s £50,000 repayment on 15 March 2026 is within 30 days of the £50,000 re-borrowing on 10 April 2026 (26 days).',
      's.464C disregards the £50,000 repayment, increasing the s.455 charge base from £35,000 to £85,000.',
      'The s.455 charge increases from £11,812.50 (without s.464C) to £28,687.50 (with s.464C) — an additional £16,875.',
      'The re-borrowing on 10 April is AFTER the AP end (31 March) — but s.464C still applies because the 30-day window spans AP boundaries.',
      'Write-off of £20,000: deemed distribution taxed at 33.75% (higher rate) = £6,750. The company gets s.455 relief of £6,750 but loses the £20,000 asset.',
      'Keeping the loan: s.455 of £6,750 on the £20k portion is refundable when repaid. Annual BIK cost is only £450 (£20k × 2.25%).',
      's.455 is payable by the company on 1 January 2027 (9 months + 1 day after 31 March 2026 AP end).',
    ],
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Convert a scenario's pre-filled inputs to S455Inputs */
export function scenarioToInputs(scenario: HCScenario): S455Inputs {
  return JSON.parse(JSON.stringify(scenario.preFilledInputs));
}
