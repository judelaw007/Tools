/**
 * Corporation Tax Computation with Marginal Relief — Utility Functions
 *
 * Pure functions for computing CT from taxable total profits through to
 * CT liability, handling income categorisation, augmented profits,
 * associated company threshold division, marginal relief formula, and
 * short-period apportionment.
 *
 * CT rates (from 1 April 2023):
 *   Main rate: 25%
 *   Small profits rate: 19%
 *   Standard fraction (marginal relief): 3/200
 *
 * Thresholds (undivided):
 *   Upper limit: £250,000
 *   Lower limit: £50,000
 */

import type {
  RateBand,
  AccountingPeriod,
  IncomeComponents,
  CTInputs,
  PeriodInfo,
  TTPComputation,
  ThresholdCalc,
  AugmentedProfitsCalc,
  RateBandResult,
  MarginalReliefCalc,
  CTLiabilityCalc,
  KeyDates,
  CT600Row,
  ValidationResult,
  CTOutput,
  HCScenario,
} from './types';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Corporation tax main rate (from 1 April 2023) */
export const CT_MAIN_RATE = 0.25;

/** Corporation tax small profits rate (from 1 April 2023) */
export const CT_SMALL_PROFITS_RATE = 0.19;

/** Standard fraction for marginal relief (SI 2023/199) */
export const STANDARD_FRACTION = 3 / 200; // 0.015

/** Upper limit (undivided) */
export const UPPER_LIMIT = 250_000;

/** Lower limit (undivided) */
export const LOWER_LIMIT = 50_000;

/** Quarterly instalment payment threshold (undivided) */
export const QIP_THRESHOLD = 1_500_000;

/** Maximum accounting period length in days */
export const MAX_AP_DAYS = 366;

/** Standard year length for apportionment */
export const DAYS_IN_YEAR = 365;

/** Marginal rate — the rate at which an extra £1 of profit is taxed in the marginal band */
export const MARGINAL_RATE = 0.265;

// ─── Period Calculation ─────────────────────────────────────────────────────────

/** Calculate the number of days in an accounting period (inclusive) */
export function calculatePeriodDays(periodStart: string, periodEnd: string): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
}

/** Calculate period info from accounting period dates */
export function calculatePeriodInfo(accountingPeriod: AccountingPeriod): PeriodInfo {
  const periodDays = calculatePeriodDays(accountingPeriod.periodStart, accountingPeriod.periodEnd);
  const isShortPeriod = periodDays < DAYS_IN_YEAR;
  const apportionmentFraction = periodDays / DAYS_IN_YEAR;

  return {
    periodDays,
    isShortPeriod,
    apportionmentFraction,
    periodDisplay: `${formatDate(accountingPeriod.periodStart)} to ${formatDate(accountingPeriod.periodEnd)}`,
  };
}

// ─── TTP Computation ────────────────────────────────────────────────────────────

/** Calculate taxable total profits step by step */
export function calculateTTP(inputs: CTInputs): TTPComputation {
  const { income, deductions } = inputs;

  // Total profits = sum of all income components
  const totalProfits =
    income.tradingProfits +
    income.loanRelationshipIncome +
    income.propertyIncome +
    income.chargeableGains;

  // QCD cannot exceed total profits (cannot create/augment a loss)
  const qcdCapped = Math.min(
    deductions.qualifyingCharitableDonations,
    Math.max(0, totalProfits)
  );
  const qcdWasCapped = qcdCapped < deductions.qualifyingCharitableDonations;

  // TTP = total profits - QCD (cannot be negative)
  const taxableTotalProfits = Math.max(0, totalProfits - qcdCapped);

  return {
    tradingProfits: income.tradingProfits,
    loanRelationshipIncome: income.loanRelationshipIncome,
    propertyIncome: income.propertyIncome,
    chargeableGains: income.chargeableGains,
    totalProfits,
    qcdDeducted: qcdCapped,
    qcdWasCapped,
    taxableTotalProfits,
  };
}

// ─── Threshold Calculation ──────────────────────────────────────────────────────

/** Calculate thresholds after associated company division and short-period apportionment */
export function calculateThresholds(
  associatedCompanyCount: number,
  periodInfo: PeriodInfo
): ThresholdCalc {
  const n = Math.max(1, Math.floor(associatedCompanyCount));

  // Divide by associated companies
  const upperLimitDivided = UPPER_LIMIT / n;
  const lowerLimitDivided = LOWER_LIMIT / n;

  // Apply short-period apportionment if needed
  let upperLimit = upperLimitDivided;
  let lowerLimit = lowerLimitDivided;
  const apportioned = periodInfo.isShortPeriod;

  if (apportioned) {
    upperLimit = Math.round(upperLimitDivided * periodInfo.apportionmentFraction);
    lowerLimit = Math.round(lowerLimitDivided * periodInfo.apportionmentFraction);
  }

  return {
    associatedCompanyCount: n,
    upperLimitDivided,
    lowerLimitDivided,
    upperLimit,
    lowerLimit,
    apportioned,
    apportionmentFraction: periodInfo.apportionmentFraction,
  };
}

// ─── Augmented Profits ──────────────────────────────────────────────────────────

/** Calculate augmented profits */
export function calculateAugmentedProfits(
  taxableTotalProfits: number,
  exemptDistributions: number
): AugmentedProfitsCalc {
  const augmentedProfits = taxableTotalProfits + exemptDistributions;

  return {
    taxableTotalProfits,
    exemptDistributions,
    augmentedProfits,
    hasFrankedIncome: exemptDistributions > 0,
  };
}

// ─── Rate Band Determination ────────────────────────────────────────────────────

/** Determine which rate band applies based on augmented profits and thresholds */
export function determineRateBand(
  augmentedProfits: number,
  thresholds: ThresholdCalc
): RateBandResult {
  if (augmentedProfits <= thresholds.lowerLimit) {
    return {
      rateBand: 'small-profits',
      explanation: `Augmented profits of ${formatPounds(augmentedProfits)} are at or below the lower limit of ${formatPounds(thresholds.lowerLimit)}. The small profits rate of 19% applies.`,
      applicableRate: CT_SMALL_PROFITS_RATE,
    };
  }

  if (augmentedProfits > thresholds.upperLimit) {
    return {
      rateBand: 'main-rate',
      explanation: `Augmented profits of ${formatPounds(augmentedProfits)} exceed the upper limit of ${formatPounds(thresholds.upperLimit)}. The main rate of 25% applies.`,
      applicableRate: CT_MAIN_RATE,
    };
  }

  return {
    rateBand: 'marginal',
    explanation: `Augmented profits of ${formatPounds(augmentedProfits)} are between the lower limit of ${formatPounds(thresholds.lowerLimit)} and the upper limit of ${formatPounds(thresholds.upperLimit)}. Marginal relief applies — the effective rate is between 19% and 25%.`,
    applicableRate: 0, // Calculated via marginal relief
  };
}

// ─── Marginal Relief Calculation ────────────────────────────────────────────────

/** Calculate marginal relief: F × (U − A) × N/A */
export function calculateMarginalRelief(
  taxableTotalProfits: number,
  augmentedProfits: number,
  upperLimit: number,
  rateBand: RateBand
): MarginalReliefCalc {
  if (rateBand !== 'marginal' || taxableTotalProfits <= 0) {
    return {
      applies: false,
      standardFraction: STANDARD_FRACTION,
      upperLimit,
      augmentedProfits,
      taxableTotalProfits,
      upperMinusAugmented: 0,
      naFraction: 0,
      marginalRelief: 0,
      formulaDisplay: '—',
    };
  }

  const upperMinusAugmented = upperLimit - augmentedProfits;
  const naFraction = augmentedProfits > 0 ? taxableTotalProfits / augmentedProfits : 1;
  const marginalRelief = roundToPence(STANDARD_FRACTION * upperMinusAugmented * naFraction);

  const formulaDisplay = `3/200 × (${formatPounds(upperLimit)} − ${formatPounds(augmentedProfits)}) × ${formatPounds(taxableTotalProfits)}/${formatPounds(augmentedProfits)}`;

  return {
    applies: true,
    standardFraction: STANDARD_FRACTION,
    upperLimit,
    augmentedProfits,
    taxableTotalProfits,
    upperMinusAugmented,
    naFraction,
    marginalRelief,
    formulaDisplay,
  };
}

// ─── CT Liability ───────────────────────────────────────────────────────────────

/** Calculate the final CT liability */
export function calculateCTLiability(
  taxableTotalProfits: number,
  rateBand: RateBand,
  marginalRelief: number
): CTLiabilityCalc {
  const ctAtMainRate = roundToPence(taxableTotalProfits * CT_MAIN_RATE);
  const ctAtSmallProfitsRate = roundToPence(taxableTotalProfits * CT_SMALL_PROFITS_RATE);

  let ctLiability: number;

  switch (rateBand) {
    case 'small-profits':
      ctLiability = ctAtSmallProfitsRate;
      break;
    case 'main-rate':
      ctLiability = ctAtMainRate;
      break;
    case 'marginal':
      ctLiability = roundToPence(ctAtMainRate - marginalRelief);
      break;
    default:
      ctLiability = ctAtMainRate;
  }

  const effectiveRate = taxableTotalProfits > 0 ? ctLiability / taxableTotalProfits : 0;

  return {
    ctAtMainRate,
    ctAtSmallProfitsRate,
    marginalRelief,
    ctLiability,
    effectiveRate,
  };
}

// ─── Key Dates ──────────────────────────────────────────────────────────────────

/** Calculate key compliance dates from AP end date */
export function calculateKeyDates(
  periodEnd: string,
  associatedCompanyCount: number
): KeyDates {
  const endDate = new Date(periodEnd);

  // Payment due: 9 months and 1 day after AP end
  const paymentDate = new Date(endDate);
  paymentDate.setMonth(paymentDate.getMonth() + 9);
  paymentDate.setDate(paymentDate.getDate() + 1);

  // Filing deadline: 12 months after AP end
  const filingDate = new Date(endDate);
  filingDate.setFullYear(filingDate.getFullYear() + 1);

  // QIP threshold
  const qipThreshold = QIP_THRESHOLD / Math.max(1, associatedCompanyCount);

  return {
    paymentDueDate: formatDateISO(paymentDate),
    filingDeadline: formatDateISO(filingDate),
    qipsMayApply: false, // Set during full computation based on augmented profits
    qipThreshold,
  };
}

// ─── CT600 Layout ───────────────────────────────────────────────────────────────

/** Generate CT600-format computation layout */
export function generateCT600Layout(
  ttpComp: TTPComputation,
  augProfits: AugmentedProfitsCalc,
  thresholds: ThresholdCalc,
  rateBandResult: RateBandResult,
  mrCalc: MarginalReliefCalc,
  ctCalc: CTLiabilityCalc,
  keyDates: KeyDates,
  periodInfo: PeriodInfo
): CT600Row[] {
  const rows: CT600Row[] = [];

  // Header
  rows.push({ label: 'Corporation Tax Computation', type: 'header', bold: true });
  rows.push({ label: `Accounting period: ${periodInfo.periodDisplay}`, type: 'note' });
  rows.push({ label: '', type: 'spacer' });

  // Income components
  rows.push({ label: 'Trading profits (after capital allowances)', amount: ttpComp.tradingProfits, type: 'income' });

  if (ttpComp.loanRelationshipIncome !== 0) {
    const lrLabel = ttpComp.loanRelationshipIncome >= 0
      ? 'Loan relationship income'
      : 'Loan relationship deficit';
    rows.push({ label: lrLabel, amount: ttpComp.loanRelationshipIncome, type: ttpComp.loanRelationshipIncome < 0 ? 'deduction' : 'income' });
  }

  if (ttpComp.propertyIncome > 0) {
    rows.push({ label: 'Property income', amount: ttpComp.propertyIncome, type: 'income' });
  }

  if (ttpComp.chargeableGains > 0) {
    rows.push({ label: 'Chargeable gains', amount: ttpComp.chargeableGains, type: 'income' });
  }

  // Total profits
  rows.push({ label: 'Total profits', amount: ttpComp.totalProfits, type: 'subtotal', bold: true });

  // QCD
  if (ttpComp.qcdDeducted > 0) {
    rows.push({ label: 'Less: Qualifying charitable donations', amount: -ttpComp.qcdDeducted, type: 'deduction' });
  }

  // TTP
  rows.push({ label: 'Taxable total profits (TTP)', amount: ttpComp.taxableTotalProfits, type: 'result', bold: true });
  rows.push({ label: '', type: 'spacer' });

  // Rate band info
  rows.push({ label: `Associated companies: ${thresholds.associatedCompanyCount}`, type: 'note' });
  rows.push({
    label: `Upper limit: £250,000 ÷ ${thresholds.associatedCompanyCount} = ${formatPounds(thresholds.upperLimitDivided)}${thresholds.apportioned ? ` × ${thresholds.apportionmentFraction.toFixed(4)} = ${formatPounds(thresholds.upperLimit)}` : ''}`,
    type: 'note',
  });
  rows.push({
    label: `Lower limit: £50,000 ÷ ${thresholds.associatedCompanyCount} = ${formatPounds(thresholds.lowerLimitDivided)}${thresholds.apportioned ? ` × ${thresholds.apportionmentFraction.toFixed(4)} = ${formatPounds(thresholds.lowerLimit)}` : ''}`,
    type: 'note',
  });

  if (augProfits.hasFrankedIncome) {
    rows.push({ label: `Augmented profits: ${formatPounds(augProfits.taxableTotalProfits)} + ${formatPounds(augProfits.exemptDistributions)} = ${formatPounds(augProfits.augmentedProfits)}`, type: 'note' });
  } else {
    rows.push({ label: `Augmented profits: ${formatPounds(augProfits.augmentedProfits)} (no exempt distributions)`, type: 'note' });
  }

  rows.push({ label: `Rate band: ${getRateBandDisplayName(rateBandResult.rateBand)}`, type: 'note' });
  rows.push({ label: '', type: 'spacer' });

  // CT calculation
  if (rateBandResult.rateBand === 'small-profits') {
    rows.push({ label: `Corporation tax at 19%: ${formatPounds(ttpComp.taxableTotalProfits)} × 19%`, amount: ctCalc.ctLiability, type: 'result', bold: true });
  } else if (rateBandResult.rateBand === 'main-rate') {
    rows.push({ label: `Corporation tax at 25%: ${formatPounds(ttpComp.taxableTotalProfits)} × 25%`, amount: ctCalc.ctLiability, type: 'result', bold: true });
  } else {
    // Marginal
    rows.push({ label: `Corporation tax at 25%`, amount: ctCalc.ctAtMainRate, type: 'income' });
    rows.push({
      label: `Less: Marginal relief`,
      amount: -mrCalc.marginalRelief,
      type: 'deduction',
    });
    rows.push({
      label: `  ${mrCalc.formulaDisplay}`,
      type: 'note',
      indent: true,
    });
    rows.push({ label: 'Corporation tax liability', amount: ctCalc.ctLiability, type: 'result', bold: true });
  }

  rows.push({ label: '', type: 'spacer' });
  rows.push({ label: `Effective rate: ${formatPercentDecimal(ctCalc.effectiveRate)}`, type: 'note' });
  rows.push({ label: `Payment due: ${formatDate(keyDates.paymentDueDate)}`, type: 'note' });
  rows.push({ label: `Filing deadline: ${formatDate(keyDates.filingDeadline)}`, type: 'note' });

  return rows;
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: CTInputs, periodInfo: PeriodInfo): ValidationResult[] {
  const results: ValidationResult[] = [];

  // V1: AP dates valid
  if (!inputs.accountingPeriod.periodStart) {
    results.push({ ruleId: 'V1', severity: 'error', message: 'Accounting period start date is required.', passed: false });
  }
  if (!inputs.accountingPeriod.periodEnd) {
    results.push({ ruleId: 'V1', severity: 'error', message: 'Accounting period end date is required.', passed: false });
  }
  if (inputs.accountingPeriod.periodStart && inputs.accountingPeriod.periodEnd) {
    const start = new Date(inputs.accountingPeriod.periodStart);
    const end = new Date(inputs.accountingPeriod.periodEnd);
    if (end <= start) {
      results.push({ ruleId: 'V1', severity: 'error', message: 'Accounting period end date must be after start date.', passed: false });
    }
  }

  // V2: AP length
  if (periodInfo.periodDays > MAX_AP_DAYS) {
    results.push({
      ruleId: 'V2',
      severity: 'error',
      message: `Accounting period is ${periodInfo.periodDays} days — exceeds the maximum of ${MAX_AP_DAYS} days (12 months). Periods over 12 months must be split into two separate computations.`,
      passed: false,
    });
  }

  // V3: Associated companies
  if (inputs.associatedCompanies.associatedCompanyCount < 1) {
    results.push({
      ruleId: 'V3',
      severity: 'error',
      message: 'Number of associated companies must be at least 1 (the company itself counts).',
      passed: false,
    });
  }

  // V4: Income sources
  const totalIncome =
    inputs.income.tradingProfits +
    inputs.income.loanRelationshipIncome +
    inputs.income.propertyIncome +
    inputs.income.chargeableGains;
  if (totalIncome <= 0) {
    results.push({
      ruleId: 'V4',
      severity: 'warning',
      message: `Total profits are ${formatPounds(totalIncome)}. No corporation tax liability arises when total profits are zero or negative.`,
      passed: false,
    });
  }

  // V5: QCD cap
  if (inputs.deductions.qualifyingCharitableDonations > Math.max(0, totalIncome)) {
    results.push({
      ruleId: 'V5',
      severity: 'warning',
      message: `Qualifying charitable donations (${formatPounds(inputs.deductions.qualifyingCharitableDonations)}) exceed total profits (${formatPounds(totalIncome)}). The deduction has been capped at total profits. Excess QCD cannot be carried forward.`,
      passed: false,
    });
  }

  // V6: Negative TTP
  const ttp = Math.max(0, totalIncome - Math.min(inputs.deductions.qualifyingCharitableDonations, Math.max(0, totalIncome)));
  if (ttp <= 0) {
    results.push({
      ruleId: 'V6',
      severity: 'info',
      message: 'Taxable total profits are zero. No corporation tax liability arises. Consider whether trading losses are available for relief (carry-back, group relief, or carry-forward).',
      passed: false,
    });
  }

  // V7: Short period
  if (periodInfo.isShortPeriod) {
    const fraction = periodInfo.apportionmentFraction;
    results.push({
      ruleId: 'V7',
      severity: 'info',
      message: `Short accounting period: ${periodInfo.periodDays} days. CT thresholds are apportioned by ${fraction.toFixed(4)} (${periodInfo.periodDays}/${DAYS_IN_YEAR}).`,
      passed: false,
    });
  }

  // V8: Loan relationship deficit
  if (inputs.income.loanRelationshipIncome < 0) {
    results.push({
      ruleId: 'V8',
      severity: 'info',
      message: `Loan relationship deficit of ${formatPounds(Math.abs(inputs.income.loanRelationshipIncome))}. This reduces total profits. The deficit could alternatively be carried forward under CTA 2009 s.457 or surrendered as group relief.`,
      passed: false,
    });
  }

  // V9: Near-boundary
  if (ttp > 0) {
    const n = Math.max(1, inputs.associatedCompanies.associatedCompanyCount);
    let upperLimit = UPPER_LIMIT / n;
    let lowerLimit = LOWER_LIMIT / n;
    if (periodInfo.isShortPeriod) {
      upperLimit = upperLimit * periodInfo.apportionmentFraction;
      lowerLimit = lowerLimit * periodInfo.apportionmentFraction;
    }
    const augmented = ttp + inputs.augmentedProfitsAdj.exemptDistributions;

    const nearThreshold = 5_000;
    if (Math.abs(augmented - upperLimit) <= nearThreshold && augmented <= upperLimit) {
      results.push({
        ruleId: 'V9',
        severity: 'info',
        message: `Augmented profits (${formatPounds(augmented)}) are within £5,000 of the upper limit (${formatPounds(upperLimit)}). A small increase in profits could push the company into the main rate (25%). Consider timing of income recognition or additional charitable donations.`,
        passed: false,
      });
    }
    if (Math.abs(augmented - lowerLimit) <= nearThreshold && augmented > lowerLimit) {
      results.push({
        ruleId: 'V9',
        severity: 'info',
        message: `Augmented profits (${formatPounds(augmented)}) are within £5,000 of the lower limit (${formatPounds(lowerLimit)}). A small reduction in profits could bring the company into the small profits rate (19%). Consider timing of deductions or increasing charitable donations.`,
        passed: false,
      });
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

/** Run the full CT computation */
export function computeCT(inputs: CTInputs): CTOutput {
  // Period info
  const periodInfo = calculatePeriodInfo(inputs.accountingPeriod);

  // Validation
  const validationResults = validateInputs(inputs, periodInfo);
  const validationSummary = summariseValidation(validationResults);

  // TTP
  const ttpComputation = calculateTTP(inputs);

  // Thresholds
  const thresholdCalc = calculateThresholds(
    inputs.associatedCompanies.associatedCompanyCount,
    periodInfo
  );

  // Augmented profits
  const augmentedProfitsCalc = calculateAugmentedProfits(
    ttpComputation.taxableTotalProfits,
    inputs.augmentedProfitsAdj.exemptDistributions
  );

  // Rate band
  const rateBandResult = determineRateBand(
    augmentedProfitsCalc.augmentedProfits,
    thresholdCalc
  );

  // Marginal relief
  const marginalReliefCalc = calculateMarginalRelief(
    ttpComputation.taxableTotalProfits,
    augmentedProfitsCalc.augmentedProfits,
    thresholdCalc.upperLimit,
    rateBandResult.rateBand
  );

  // CT liability
  const ctLiabilityCalc = calculateCTLiability(
    ttpComputation.taxableTotalProfits,
    rateBandResult.rateBand,
    marginalReliefCalc.marginalRelief
  );

  // Update rate band with effective rate
  if (rateBandResult.rateBand === 'marginal') {
    rateBandResult.applicableRate = ctLiabilityCalc.effectiveRate;
  }

  // Key dates
  const keyDates = calculateKeyDates(
    inputs.accountingPeriod.periodEnd,
    inputs.associatedCompanies.associatedCompanyCount
  );
  // Check QIP applicability
  keyDates.qipsMayApply = augmentedProfitsCalc.augmentedProfits > keyDates.qipThreshold;

  // CT600 layout
  const ct600Layout = generateCT600Layout(
    ttpComputation,
    augmentedProfitsCalc,
    thresholdCalc,
    rateBandResult,
    marginalReliefCalc,
    ctLiabilityCalc,
    keyDates,
    periodInfo
  );

  return {
    periodInfo,
    ttpComputation,
    thresholdCalc,
    augmentedProfitsCalc,
    rateBandResult,
    marginalReliefCalc,
    ctLiabilityCalc,
    keyDates,
    ct600Layout,
    validationResults,
    validationSummary,
  };
}

// ─── Empty Inputs ───────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): CTInputs {
  return {
    accountingPeriod: {
      periodStart: '',
      periodEnd: '',
    },
    income: {
      tradingProfits: 0,
      loanRelationshipIncome: 0,
      propertyIncome: 0,
      chargeableGains: 0,
    },
    deductions: {
      qualifyingCharitableDonations: 0,
    },
    augmentedProfitsAdj: {
      exemptDistributions: 0,
    },
    associatedCompanies: {
      associatedCompanyCount: 1,
    },
  };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────────

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
  const formatted = abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (amount < 0) return `(£${formatted})`;
  return `£${formatted}`;
}

/** Format a percentage with no decimals */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Format a percentage with up to 3 decimal places (trimming trailing zeros) */
export function formatPercentDecimal(rate: number): string {
  const pct = rate * 100;
  // Use up to 3 decimals, trim trailing zeros
  return `${parseFloat(pct.toFixed(3))}%`;
}

/** Format a date string for display (e.g. "1 April 2025") */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Format a date to ISO YYYY-MM-DD */
function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Round to nearest penny */
function roundToPence(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Get display name for rate band */
export function getRateBandDisplayName(rateBand: RateBand): string {
  switch (rateBand) {
    case 'small-profits': return 'Small Profits Rate (19%)';
    case 'main-rate': return 'Main Rate (25%)';
    case 'marginal': return 'Marginal Rate (between 19% and 25%)';
    default: return rateBand;
  }
}

// ─── H&C Test Scenarios ─────────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  {
    id: 's5-cs-engineering-ct',
    name: 'S5 — C&S Engineering CT Computation (y/e 31 March 2026)',
    section: 5,
    description:
      'Complete CT computation for Caldwell & Shaw Engineering Ltd for the year ended 31 March 2026. Incorporates trading profit from S2 (after S3 capital allowances), loan relationship income (£2,400 bank interest), property income (£12,000 Unit 7B rent from Kelham IT Solutions), and Gift Aid donations (£1,500). Caldwell Investments Ltd is an associated company — Marcus controls both companies, dividing the CT thresholds by 2.',
    preFilledInputs: {
      accountingPeriod: {
        periodStart: '2025-04-01',
        periodEnd: '2026-03-31',
      },
      income: {
        tradingProfits: 87_100,
        loanRelationshipIncome: 2_400,
        propertyIncome: 12_000,
        chargeableGains: 0,
      },
      deductions: {
        qualifyingCharitableDonations: 1_500,
      },
      augmentedProfitsAdj: {
        exemptDistributions: 0,
      },
      associatedCompanies: {
        associatedCompanyCount: 2,
      },
    },
    expectedCTLiability: 24_625,
    expectedRateBand: 'marginal',
    expectedEffectiveRate: 0.24625,
    hints: {
      'associated-companies': [
        'Caldwell Investments Ltd (Co. 09284173) is associated with C&S Engineering under CTA 2010 s.25A.',
        'Marcus Caldwell controls both: 60% of C&S Engineering + 100% of Caldwell Investments = common control by an individual.',
        'This divides both thresholds by 2: upper limit becomes £125,000, lower limit becomes £25,000.',
        'Without the associated company, marginal relief would be £2,250 instead of £375 — the association costs £1,875 in additional CT.',
        'The Caldwell & Caldwell Property Partnership is NOT a company and therefore is NOT counted as an associated company.',
      ],
      'marginal-relief': [
        'The marginal relief formula is: 3/200 × (U − A) × N/A',
        'F = 3/200 = 0.015 (the standard fraction from SI 2023/199).',
        'U = upper limit = £125,000 (after division by 2 associated companies).',
        'A = augmented profits = £100,000 (= TTP because no exempt distributions).',
        'N = TTP = £100,000.',
        'N/A = £100,000/£100,000 = 1 (because augmented profits equal TTP).',
        'MR = 0.015 × (£125,000 − £100,000) × 1 = 0.015 × £25,000 = £375.',
        'The N/A fraction would be less than 1 if C&S received exempt dividends from other companies.',
      ],
      'ttp-computation': [
        'Trading profits (after CA from S3): £87,100.',
        'Loan relationship income: £2,400 (NatWest business account interest received).',
        'Property income: £12,000 (Unit 7B rent from Kelham IT Solutions Ltd — 3-year lease from 1 September 2024).',
        'Chargeable gains: £nil (no disposals in this period).',
        'Total profits: £101,500.',
        'Less: QCD £1,500 (Gift Aid to registered charities).',
        'TTP: £100,000.',
      ],
      'augmented-profits': [
        'Augmented profits = TTP + exempt ABGH distributions.',
        'C&S Engineering receives no dividends from other companies, so exempt distributions = £nil.',
        'Therefore augmented profits = TTP = £100,000.',
        'If C&S received dividends from (say) Caldwell Investments, those would be exempt from CT but would increase augmented profits.',
        'This could push C&S into the main rate band even though TTP remains the same.',
      ],
      'key-dates': [
        'AP ends 31 March 2026.',
        'CT payment due: 9 months and 1 day after AP end = 1 January 2027.',
        'CT600 filing deadline: 12 months after AP end = 31 March 2027.',
        'Quarterly instalment payments do NOT apply because augmented profits (£100,000) are below £750,000 (£1.5m ÷ 2 associated companies).',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Convert a scenario's pre-filled inputs to CTInputs */
export function scenarioToInputs(scenario: HCScenario): CTInputs {
  return JSON.parse(JSON.stringify(scenario.preFilledInputs));
}
