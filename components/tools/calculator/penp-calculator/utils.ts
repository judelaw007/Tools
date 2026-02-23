/**
 * Termination Payment Analyser (PENP Calculator) — Utility Functions
 *
 * Pure functions for calculating Post-Employment Notice Pay,
 * classifying termination payment components, applying the £30,000
 * exemption, computing employer NIC, and cross-checking statutory
 * redundancy entitlements.
 *
 * PENP formula: ((BP × D) / P) − T
 *   BP = basic pay per pay period
 *   D  = unserved notice days
 *   P  = pay period days (monthly = 30.42)
 *   T  = prior taxable termination payments
 *
 * Employer NIC rates:
 *   2024/25: 13.8%
 *   2025/26+: 15%
 */

import type {
  PayPeriodType,
  TaxYear,
  TaxTreatment,
  EmployerNICType,
  EmployeeDetails,
  PayDetails,
  NoticeDetails,
  TerminationComponents,
  RedundancySettings,
  PENPInputs,
  PENPCalculation,
  ClassifiedComponent,
  ExemptionCalculation,
  EmployerNICComputation,
  RedundancyYearEntry,
  RedundancyCrossCheck,
  TerminationSummary,
  ValidationResult,
  PENPOutput,
  HCScenario,
} from './types';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Pay period days by type */
export const PAY_PERIOD_DAYS: Record<Exclude<PayPeriodType, 'custom'>, number> = {
  monthly: 30.42,
  weekly: 7,
  fortnightly: 14,
  'four-weekly': 28,
  annual: 365,
};

/** £30,000 exemption threshold */
export const THIRTY_THOUSAND_EXEMPTION = 30_000;

/** Employer NIC rates by tax year */
export const EMPLOYER_NIC_RATES: Record<TaxYear, number> = {
  '2024-25': 0.138,
  '2025-26': 0.15,
  '2026-27': 0.15,
};

/** Default capped weekly pay for statutory redundancy (2025/26) */
export const DEFAULT_CAPPED_WEEKLY_PAY = 643;

/** Maximum years of service for statutory redundancy */
export const MAX_REDUNDANCY_YEARS = 20;

/** Statutory redundancy age thresholds and multipliers */
export const REDUNDANCY_MULTIPLIERS = {
  OVER_41: 1.5,
  AGE_22_TO_40: 1.0,
  UNDER_22: 0.5,
};

// ─── Tax Year Determination ─────────────────────────────────────────────────────

/** Determine the tax year from a date */
export function getTaxYear(dateStr: string): TaxYear {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let taxYearStart: number;
  if (month > 4 || (month === 4 && day >= 6)) {
    taxYearStart = year;
  } else {
    taxYearStart = year - 1;
  }

  if (taxYearStart === 2024) return '2024-25';
  if (taxYearStart === 2025) return '2025-26';
  return '2026-27';
}

/** Get employer NIC rate for a tax year */
export function getEmployerNICRate(taxYear: TaxYear): number {
  return EMPLOYER_NIC_RATES[taxYear];
}

/** Get display name for tax year */
export function getTaxYearDisplayName(taxYear: TaxYear): string {
  switch (taxYear) {
    case '2024-25': return '2024/25';
    case '2025-26': return '2025/26';
    case '2026-27': return '2026/27';
    default: return taxYear;
  }
}

// ─── Date & Age Utilities ──────────────────────────────────────────────────────

/** Calculate age at a given date */
export function calculateAge(dateOfBirth: string, atDate: string): number {
  const dob = new Date(dateOfBirth);
  const at = new Date(atDate);

  let age = at.getFullYear() - dob.getFullYear();
  const monthDiff = at.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/** Calculate complete years of service between two dates */
export function calculateCompleteYears(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

// ─── Pay Period Resolution ─────────────────────────────────────────────────────

/** Get pay period days from type */
export function getPayPeriodDays(type: PayPeriodType, customDays: number): number {
  if (type === 'custom') return customDays;
  return PAY_PERIOD_DAYS[type];
}

/** Get display name for pay period type */
export function getPayPeriodTypeName(type: PayPeriodType): string {
  switch (type) {
    case 'monthly': return 'Monthly (30.42 days)';
    case 'weekly': return 'Weekly (7 days)';
    case 'fortnightly': return 'Fortnightly (14 days)';
    case 'four-weekly': return 'Four-weekly (28 days)';
    case 'annual': return 'Annual (365 days)';
    case 'custom': return 'Custom';
    default: return type;
  }
}

// ─── PENP Calculation ──────────────────────────────────────────────────────────

/** Calculate the unserved notice period (D) */
export function calculateUnservedNoticeDays(
  contractualNoticeDays: number,
  noticeServedDays: number
): number {
  return Math.max(0, contractualNoticeDays - noticeServedDays);
}

/** Calculate PENP using the statutory formula */
export function calculatePENP(
  basicPay: number,
  unservedNoticeDays: number,
  payPeriodDays: number,
  priorTaxablePayments: number,
  contractualPILONAmount: number
): PENPCalculation {
  const totalT = priorTaxablePayments + contractualPILONAmount;
  const rawResult = payPeriodDays > 0
    ? ((basicPay * unservedNoticeDays) / payPeriodDays) - totalT
    : 0;
  const penpAmount = Math.max(0, rawResult);

  const formulaDisplay =
    `((£${formatCurrency(basicPay)} × ${unservedNoticeDays}) / ${payPeriodDays}) − £${formatCurrency(totalT)}` +
    ` = £${formatCurrency(Math.round(rawResult * 100) / 100)}` +
    (rawResult < 0 ? ` → £0 (floored)` : '');

  return {
    basicPay,
    unservedNoticeDays,
    payPeriodDays,
    priorTaxablePayments: totalT,
    rawResult: Math.round(rawResult * 100) / 100,
    penpAmount: Math.round(penpAmount * 100) / 100,
    formulaDisplay,
  };
}

// ─── Component Classification ───────────────────────────────────────────────────

/** Classify all termination payment components */
export function classifyComponents(
  penpAmount: number,
  contractualPILONAmount: number,
  statutoryRedundancyAmount: number,
  restrictiveCovenantAmount: number,
  exGratiaAmount: number
): ClassifiedComponent[] {
  const components: ClassifiedComponent[] = [];

  if (contractualPILONAmount > 0) {
    components.push({
      id: 'contractual-pilon',
      componentName: 'Contractual PILON',
      amount: contractualPILONAmount,
      taxTreatment: 'taxable-earnings',
      taxTreatmentLabel: 'Taxable as earnings',
      legislativeRef: 'ITEPA 2003 s.62',
      educationalNote:
        'Where the employment contract contains a PILON clause, the payment is contractual — it is taxable as employment earnings in the same way as salary. It is NOT part of the termination payment subject to the £30,000 exemption.',
      employerNICType: 'class-1',
    });
  }

  if (penpAmount > 0) {
    components.push({
      id: 'penp',
      componentName: 'Post-Employment Notice Pay (PENP)',
      amount: Math.round(penpAmount * 100) / 100,
      taxTreatment: 'taxable-earnings',
      taxTreatmentLabel: 'Taxable as earnings',
      legislativeRef: 'ITEPA 2003 s.402D',
      educationalNote:
        'The PENP formula automatically treats a portion of the termination payment as employment earnings where notice is not fully served. This prevents employers from structuring PILONs to exploit the £30,000 exemption. The PENP amount is subject to income tax through PAYE and both employee and employer NIC.',
      employerNICType: 'class-1',
    });
  }

  if (statutoryRedundancyAmount > 0) {
    components.push({
      id: 'statutory-redundancy',
      componentName: 'Statutory Redundancy Pay',
      amount: statutoryRedundancyAmount,
      taxTreatment: 'exempt',
      taxTreatmentLabel: 'Exempt (s.309 ITEPA 2003)',
      legislativeRef: 'ITEPA 2003 s.309',
      educationalNote:
        'Statutory redundancy payments are completely exempt from income tax and NIC. They do NOT count against the £30,000 exemption — they are separately exempt. This is a common exam error: students often deduct statutory redundancy from the £30,000, which is incorrect.',
      employerNICType: 'none',
    });
  }

  if (restrictiveCovenantAmount > 0) {
    components.push({
      id: 'restrictive-covenant',
      componentName: 'Restrictive Covenant Payment',
      amount: restrictiveCovenantAmount,
      taxTreatment: 'taxable-earnings',
      taxTreatmentLabel: 'Taxable as earnings (since 6 April 2020)',
      legislativeRef: 'ITEPA 2003 s.225A (Finance Act 2020)',
      educationalNote:
        'Since 6 April 2020, ALL payments for restrictive covenants (non-compete clauses, non-solicitation agreements) are taxable as employment earnings. Before that date, they could fall within the £30,000 exemption. This is a key recent change — exam questions frequently test whether candidates know this.',
      employerNICType: 'class-1',
    });
  }

  if (exGratiaAmount > 0) {
    components.push({
      id: 'ex-gratia',
      componentName: 'Ex Gratia / Goodwill Payment',
      amount: exGratiaAmount,
      taxTreatment: 'thirty-thousand-exemption',
      taxTreatmentLabel: 'Subject to £30,000 exemption',
      legislativeRef: 'ITEPA 2003 s.403',
      educationalNote:
        'The ex gratia element is the "relevant termination award" tested against the £30,000 exemption. The first £30,000 is exempt from income tax (but NOT from employer Class 1A NIC on any excess). Any amount exceeding £30,000 is taxable and also attracts employer Class 1A NIC. No employee NIC applies even on the excess.',
      employerNICType: 'class-1a',
    });
  }

  return components;
}

// ─── £30,000 Exemption ──────────────────────────────────────────────────────────

/** Calculate the £30,000 exemption application */
export function calculateExemption(
  penpAmount: number,
  contractualPILONAmount: number,
  statutoryRedundancyAmount: number,
  restrictiveCovenantAmount: number,
  exGratiaAmount: number
): ExemptionCalculation {
  const earningsElements = Math.round((penpAmount + contractualPILONAmount + restrictiveCovenantAmount) * 100) / 100;
  const exemptElements = statutoryRedundancyAmount;
  const relevantTerminationAward = exGratiaAmount;
  const totalTerminationAward = Math.round((earningsElements + exemptElements + relevantTerminationAward) * 100) / 100;

  const amountWithinExemption = Math.min(relevantTerminationAward, THIRTY_THOUSAND_EXEMPTION);
  const amountExceedingExemption = Math.max(0, relevantTerminationAward - THIRTY_THOUSAND_EXEMPTION);
  const remainingExemption = THIRTY_THOUSAND_EXEMPTION - amountWithinExemption;

  return {
    totalTerminationAward,
    earningsElements,
    exemptElements,
    relevantTerminationAward,
    exemptionLimit: THIRTY_THOUSAND_EXEMPTION,
    amountWithinExemption,
    amountExceedingExemption,
    remainingExemption,
  };
}

// ─── Employer NIC ───────────────────────────────────────────────────────────────

/** Compute employer NIC */
export function computeEmployerNIC(
  penpAmount: number,
  contractualPILONAmount: number,
  restrictiveCovenantAmount: number,
  amountExceedingExemption: number,
  taxYear: TaxYear
): EmployerNICComputation {
  const rate = getEmployerNICRate(taxYear);

  const class1Base = Math.round((penpAmount + contractualPILONAmount + restrictiveCovenantAmount) * 100) / 100;
  const class1Amount = Math.round(class1Base * rate * 100) / 100;

  const class1ABase = amountExceedingExemption;
  const class1AAmount = Math.round(class1ABase * rate * 100) / 100;

  return {
    class1NICBase: class1Base,
    class1NICRate: rate,
    class1NICAmount: class1Amount,
    class1ANICBase: class1ABase,
    class1ANICRate: rate,
    class1ANICAmount: class1AAmount,
    totalEmployerNIC: Math.round((class1Amount + class1AAmount) * 100) / 100,
    taxYear,
  };
}

// ─── Statutory Redundancy Cross-Check ───────────────────────────────────────────

/** Calculate statutory redundancy entitlement */
export function calculateStatutoryRedundancy(
  dateOfBirth: string,
  employmentStartDate: string,
  terminationDate: string,
  cappedWeeklyPay: number
): RedundancyCrossCheck {
  const ageAtTermination = calculateAge(dateOfBirth, terminationDate);
  const rawYears = calculateCompleteYears(employmentStartDate, terminationDate);
  const completeYearsOfService = Math.min(rawYears, MAX_REDUNDANCY_YEARS);

  const start = new Date(employmentStartDate);
  const breakdown: RedundancyYearEntry[] = [];
  let totalWeeks = 0;

  // Work through each complete year of service, starting from year 1
  for (let i = 0; i < completeYearsOfService; i++) {
    // Anniversary date for this service year
    const anniversaryYear = start.getFullYear() + i;
    const anniversaryDate = new Date(anniversaryYear, start.getMonth(), start.getDate());

    // Age at the start of this service year
    const ageAtStart = calculateAge(dateOfBirth, anniversaryDate.toISOString().split('T')[0]);

    let multiplier: number;
    if (ageAtStart >= 41) {
      multiplier = REDUNDANCY_MULTIPLIERS.OVER_41;
    } else if (ageAtStart >= 22) {
      multiplier = REDUNDANCY_MULTIPLIERS.AGE_22_TO_40;
    } else {
      multiplier = REDUNDANCY_MULTIPLIERS.UNDER_22;
    }

    totalWeeks += multiplier;
    breakdown.push({ year: i + 1, ageAtStart, multiplier });
  }

  const calculatedAmount = Math.round(totalWeeks * cappedWeeklyPay * 100) / 100;

  return {
    ageAtTermination,
    completeYearsOfService,
    breakdown,
    totalWeeks,
    cappedWeeklyPay,
    calculatedAmount,
    enteredAmount: 0, // Will be set by caller
    difference: 0, // Will be set by caller
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: PENPInputs): ValidationResult[] {
  const results: ValidationResult[] = [];

  // V1: Dates valid
  if (!inputs.employee.terminationDate) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Termination date is required.',
      passed: false,
    });
  }
  if (!inputs.employee.employmentStartDate) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Employment start date is required.',
      passed: false,
    });
  }
  if (inputs.employee.employmentStartDate && inputs.employee.terminationDate) {
    const start = new Date(inputs.employee.employmentStartDate);
    const end = new Date(inputs.employee.terminationDate);
    if (end <= start) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: 'Termination date must be after employment start date.',
        passed: false,
      });
    }
  }
  if (inputs.employee.dateOfBirth && inputs.employee.employmentStartDate) {
    const dob = new Date(inputs.employee.dateOfBirth);
    const start = new Date(inputs.employee.employmentStartDate);
    if (start <= dob) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: 'Employment start date must be after date of birth.',
        passed: false,
      });
    }
  }

  // V2: Basic pay positive
  if (inputs.pay.basicPay <= 0) {
    results.push({
      ruleId: 'V2',
      severity: 'error',
      message: 'Basic pay must be greater than zero.',
      passed: false,
    });
  }

  // V3: Notice period valid
  if (inputs.notice.contractualNoticeDays <= 0) {
    results.push({
      ruleId: 'V3',
      severity: 'error',
      message: 'Contractual notice period must be greater than zero days.',
      passed: false,
    });
  }
  if (inputs.notice.noticeServedDays > inputs.notice.contractualNoticeDays) {
    results.push({
      ruleId: 'V3',
      severity: 'error',
      message: 'Notice served cannot exceed contractual notice period.',
      passed: false,
    });
  }

  // V4: Pay period valid
  const P = getPayPeriodDays(inputs.pay.payPeriodType, inputs.pay.payPeriodDays);
  if (P <= 0) {
    results.push({
      ruleId: 'V4',
      severity: 'error',
      message: 'Pay period days must be greater than zero.',
      passed: false,
    });
  }

  // V5: PILON consistency
  if (inputs.notice.hasContractualPILON && inputs.notice.contractualPILONAmount <= 0) {
    results.push({
      ruleId: 'V5',
      severity: 'warning',
      message: 'Contractual PILON is indicated but the amount is zero. If a PILON clause exists, enter the PILON amount paid.',
      passed: false,
    });
  }

  // V6: Statutory redundancy cross-check
  if (
    inputs.redundancy.isRedundancy &&
    inputs.employee.dateOfBirth &&
    inputs.employee.employmentStartDate &&
    inputs.employee.terminationDate &&
    inputs.components.statutoryRedundancyAmount > 0
  ) {
    const crossCheck = calculateStatutoryRedundancy(
      inputs.employee.dateOfBirth,
      inputs.employee.employmentStartDate,
      inputs.employee.terminationDate,
      inputs.redundancy.cappedWeeklyPay
    );
    const diff = Math.abs(crossCheck.calculatedAmount - inputs.components.statutoryRedundancyAmount);
    if (diff > 100) {
      results.push({
        ruleId: 'V6',
        severity: 'info',
        message: `Statutory redundancy entered (${formatPounds(inputs.components.statutoryRedundancyAmount)}) differs from the calculated entitlement (${formatPounds(crossCheck.calculatedAmount)}) by ${formatPounds(diff)}. The employer may be paying enhanced redundancy terms above the statutory minimum.`,
        passed: false,
      });
    }
  }

  // V7: PENP is zero
  const D = calculateUnservedNoticeDays(inputs.notice.contractualNoticeDays, inputs.notice.noticeServedDays);
  if (D === 0) {
    results.push({
      ruleId: 'V7',
      severity: 'info',
      message: 'All contractual notice has been served. PENP is zero — no earnings reclassification applies. This is the most tax-efficient outcome for both employer and employee.',
      passed: true,
    });
  }

  // V8: Restrictive covenant since April 2020
  if (inputs.components.restrictiveCovenantAmount > 0) {
    const termDate = new Date(inputs.employee.terminationDate);
    const april2020 = new Date('2020-04-06');
    if (termDate >= april2020) {
      results.push({
        ruleId: 'V8',
        severity: 'info',
        message: `Restrictive covenant payment of ${formatPounds(inputs.components.restrictiveCovenantAmount)} is taxable as employment earnings (since 6 April 2020). Before that date, restrictive covenant payments fell within the £30,000 exemption.`,
        passed: true,
      });
    } else {
      results.push({
        ruleId: 'V8',
        severity: 'info',
        message: `Termination date is before 6 April 2020. The restrictive covenant payment of ${formatPounds(inputs.components.restrictiveCovenantAmount)} may be within the £30,000 exemption under the pre-2020 rules.`,
        passed: true,
      });
    }
  }

  // V9: £30,000 threshold
  if (inputs.components.exGratiaAmount > THIRTY_THOUSAND_EXEMPTION) {
    const excess = inputs.components.exGratiaAmount - THIRTY_THOUSAND_EXEMPTION;
    results.push({
      ruleId: 'V9',
      severity: 'warning',
      message: `The ex gratia payment (${formatPounds(inputs.components.exGratiaAmount)}) exceeds the £30,000 exemption. The excess of ${formatPounds(excess)} is taxable and attracts employer Class 1A NIC.`,
      passed: false,
    });
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

/** Run the full termination payment analysis */
export function analysePENP(inputs: PENPInputs): PENPOutput {
  // Validate
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Determine tax year
  const taxYear = inputs.employee.terminationDate
    ? getTaxYear(inputs.employee.terminationDate)
    : '2025-26';

  // Calculate unserved notice
  const D = calculateUnservedNoticeDays(
    inputs.notice.contractualNoticeDays,
    inputs.notice.noticeServedDays
  );

  // Get pay period days
  const P = getPayPeriodDays(inputs.pay.payPeriodType, inputs.pay.payPeriodDays);

  // Calculate PENP
  const penpCalculation = calculatePENP(
    inputs.pay.basicPay,
    D,
    P,
    inputs.components.priorTaxableTerminationPayments,
    inputs.notice.hasContractualPILON ? inputs.notice.contractualPILONAmount : 0
  );

  // Classify components
  const classifiedComponents = classifyComponents(
    penpCalculation.penpAmount,
    inputs.notice.hasContractualPILON ? inputs.notice.contractualPILONAmount : 0,
    inputs.components.statutoryRedundancyAmount,
    inputs.components.restrictiveCovenantAmount,
    inputs.components.exGratiaAmount
  );

  // Calculate £30,000 exemption
  const exemptionCalculation = calculateExemption(
    penpCalculation.penpAmount,
    inputs.notice.hasContractualPILON ? inputs.notice.contractualPILONAmount : 0,
    inputs.components.statutoryRedundancyAmount,
    inputs.components.restrictiveCovenantAmount,
    inputs.components.exGratiaAmount
  );

  // Compute employer NIC
  const employerNIC = computeEmployerNIC(
    penpCalculation.penpAmount,
    inputs.notice.hasContractualPILON ? inputs.notice.contractualPILONAmount : 0,
    inputs.components.restrictiveCovenantAmount,
    exemptionCalculation.amountExceedingExemption,
    taxYear
  );

  // Statutory redundancy cross-check
  let redundancyCrossCheck: RedundancyCrossCheck | null = null;
  if (
    inputs.redundancy.isRedundancy &&
    inputs.employee.dateOfBirth &&
    inputs.employee.employmentStartDate &&
    inputs.employee.terminationDate
  ) {
    redundancyCrossCheck = calculateStatutoryRedundancy(
      inputs.employee.dateOfBirth,
      inputs.employee.employmentStartDate,
      inputs.employee.terminationDate,
      inputs.redundancy.cappedWeeklyPay
    );
    redundancyCrossCheck.enteredAmount = inputs.components.statutoryRedundancyAmount;
    redundancyCrossCheck.difference = Math.round(
      (redundancyCrossCheck.calculatedAmount - inputs.components.statutoryRedundancyAmount) * 100
    ) / 100;
  }

  // Summary
  const grossTerminationPackage = Math.round(
    (penpCalculation.penpAmount +
      (inputs.notice.hasContractualPILON ? inputs.notice.contractualPILONAmount : 0) +
      inputs.components.statutoryRedundancyAmount +
      inputs.components.restrictiveCovenantAmount +
      inputs.components.exGratiaAmount) * 100
  ) / 100;

  const summary: TerminationSummary = {
    grossTerminationPackage,
    totalTaxableAsEarnings: exemptionCalculation.earningsElements,
    totalExempt: exemptionCalculation.exemptElements,
    totalWithinThirtyThousand: exemptionCalculation.amountWithinExemption,
    totalTaxableAboveThirtyThousand: exemptionCalculation.amountExceedingExemption,
    totalEmployerNIC: employerNIC.totalEmployerNIC,
    totalCostToEmployer: Math.round((grossTerminationPackage + employerNIC.totalEmployerNIC) * 100) / 100,
  };

  return {
    penpCalculation,
    classifiedComponents,
    exemptionCalculation,
    employerNIC,
    redundancyCrossCheck,
    summary,
    validationResults,
    validationSummary,
  };
}

// ─── Empty Inputs ───────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): PENPInputs {
  return {
    employee: {
      employeeName: '',
      dateOfBirth: '',
      employmentStartDate: '',
      terminationDate: '',
    },
    pay: {
      basicPay: 0,
      payPeriodType: 'monthly',
      payPeriodDays: 30.42,
    },
    notice: {
      contractualNoticeDays: 0,
      noticeServedDays: 0,
      hasContractualPILON: false,
      contractualPILONAmount: 0,
    },
    components: {
      priorTaxableTerminationPayments: 0,
      statutoryRedundancyAmount: 0,
      restrictiveCovenantAmount: 0,
      exGratiaAmount: 0,
    },
    redundancy: {
      isRedundancy: true,
      cappedWeeklyPay: DEFAULT_CAPPED_WEEKLY_PAY,
    },
  };
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
  const formatted = abs.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (amount < 0) return `(£${formatted})`;
  return `£${formatted}`;
}

/** Format a percentage (from decimal, e.g., 0.15 → "15%") */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Format a percentage with 1 decimal place */
export function formatPercentDecimal(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Format a date for display */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  {
    id: 's7-dave-reynolds-redundancy',
    name: 'S7 — Dave Reynolds Redundancy Package',
    section: 7,
    description:
      'Analyse the termination package for Dave Reynolds, Senior CNC Programmer at C&S Engineering Ltd, ' +
      'who is being made redundant after 15 years\' service (age 52). His package includes statutory redundancy, ' +
      'a £25,000 ex gratia payment, and a £5,000 restrictive covenant. He served 1 month of his 3-month notice period. ' +
      'Calculate PENP, classify each component, apply the £30,000 exemption, and determine employer NIC.',
    preFilledInputs: {
      employee: {
        employeeName: 'Dave Reynolds',
        dateOfBirth: '1973-10-08',
        employmentStartDate: '2011-03-14',
        terminationDate: '2026-06-30',
      },
      pay: {
        basicPay: 3_500,
        payPeriodType: 'monthly',
        payPeriodDays: 30.42,
      },
      notice: {
        contractualNoticeDays: 91,
        noticeServedDays: 30,
        hasContractualPILON: false,
        contractualPILONAmount: 0,
      },
      components: {
        priorTaxableTerminationPayments: 0,
        statutoryRedundancyAmount: 13_181.50,
        restrictiveCovenantAmount: 5_000,
        exGratiaAmount: 25_000,
      },
      redundancy: {
        isRedundancy: true,
        cappedWeeklyPay: 643,
      },
    },
    expectedPENP: 7_016.44,
    expectedEmployerNIC: 1_802.47,
    hints: {
      penp: [
        'Dave served only 1 month of his 3-month contractual notice.',
        'Unserved notice (D) = 91 − 30 = 61 days.',
        'PENP = ((£3,500 × 61) / 30.42) − £0 = £7,016.44.',
        'The PENP is taxable as employment earnings — it is NOT within the £30,000 exemption.',
        'If Dave had served all 3 months, PENP would be zero — the most tax-efficient outcome.',
      ],
      'statutory-redundancy': [
        'Dave is aged 52 with 15 complete years of service.',
        '11 years at age 41+ (1.5 weeks each) = 16.5 weeks.',
        '4 years at age 37-40 (1 week each) = 4 weeks.',
        'Total: 20.5 weeks × £643 capped weekly pay = £13,181.50.',
        'Statutory redundancy is COMPLETELY EXEMPT — it does NOT reduce the £30,000.',
      ],
      'restrictive-covenant': [
        'The £5,000 restrictive covenant is for a 12-month non-compete clause.',
        'Since 6 April 2020, ALL restrictive covenant payments are taxable as earnings.',
        'Before April 2020, this would have been within the £30,000 exemption.',
        'This change is a common exam trap — candidates often classify it incorrectly.',
      ],
      'ex-gratia': [
        'The £25,000 ex gratia payment is the only element tested against the £30,000 exemption.',
        '£25,000 < £30,000, so it is fully sheltered — no income tax or Class 1A NIC.',
        'Remaining £30,000 exemption: £5,000 unused.',
        'Had the ex gratia been £45,000, the excess £15,000 would be taxable AND attract Class 1A NIC.',
      ],
      'employer-nic': [
        'Two types of employer NIC arise on termination payments:',
        'Class 1 NIC (15%) on earnings elements: PENP (£7,016.44) + restrictive covenant (£5,000) = £12,016.44 × 15% = £1,802.47.',
        'Class 1A NIC (15%) on the termination payment exceeding £30,000: here, £0 (ex gratia is within £30,000).',
        'No employee NIC applies to termination payments — even on amounts exceeding £30,000.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Convert a scenario's pre-filled inputs to PENPInputs */
export function scenarioToInputs(scenario: HCScenario): PENPInputs {
  return JSON.parse(JSON.stringify(scenario.preFilledInputs));
}
