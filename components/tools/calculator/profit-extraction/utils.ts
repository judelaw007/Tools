/**
 * Salary vs Dividend Profit Extraction Optimiser — Utility Functions
 *
 * Pure functions for computing income tax, NIC, corporation tax,
 * dividend tax, and comparing extraction strategies.
 *
 * All monetary values in GBP, rounded to whole pounds unless stated.
 */

import type {
  TaxYear,
  ExtractionMethod,
  StrategyType,
  TaxBand,
  TaxRates,
  ProfitExtractionInputs,
  MethodTaxBreakdown,
  StrategyResult,
  ValidationResult,
  ProfitExtractionOutput,
  HCScenario,
} from './types';

// ─── Tax Rate Tables ───────────────────────────────────────────────────────────

const TAX_RATES_2025_26: TaxRates = {
  year: '2025/26',
  personalAllowance: 12_570,
  paTaperThreshold: 100_000,
  basicRateBand: 37_700,
  incomeTaxBands: [
    { name: 'Personal allowance', from: 0, to: 12_570, rate: 0 },
    { name: 'Basic rate', from: 12_570, to: 50_270, rate: 0.20 },
    { name: 'Higher rate', from: 50_270, to: 125_140, rate: 0.40 },
    { name: 'Additional rate', from: 125_140, to: Infinity, rate: 0.45 },
  ],
  dividendBands: [
    { name: 'Dividend allowance', from: 0, to: 500, rate: 0 },
    { name: 'Dividend basic rate', from: 500, to: Infinity, rate: 0.0875 },
    { name: 'Dividend higher rate', from: 0, to: Infinity, rate: 0.3375 },
    { name: 'Dividend additional rate', from: 0, to: Infinity, rate: 0.3935 },
  ],
  dividendAllowance: 500,
  nic: {
    lel: 6_396,
    pt: 12_570,
    uel: 50_270,
    st: 5_000,
    employeeMainRate: 0.08,
    employeeUpperRate: 0.02,
    employerRate: 0.15,
    employmentAllowance: 5_000,
  },
  ct: {
    smallProfitsRate: 0.19,
    mainRate: 0.25,
    lowerLimit: 50_000,
    upperLimit: 250_000,
    mrNumerator: 3,
    mrDenominator: 200,
  },
  pensionAnnualAllowance: 60_000,
  pensionTaperThreshold: 260_000,
  pensionMinAllowance: 10_000,
};

const TAX_RATES_2026_27: TaxRates = {
  ...TAX_RATES_2025_26,
  year: '2026/27',
  // Rates frozen for 2026/27 — same as 2025/26
};

const TAX_RATES: Record<TaxYear, TaxRates> = {
  '2025/26': TAX_RATES_2025_26,
  '2026/27': TAX_RATES_2026_27,
};

/** Get tax rates for a given year */
export function getTaxRates(year: TaxYear): TaxRates {
  return TAX_RATES[year];
}

// ─── Field Labels & Tooltips ───────────────────────────────────────────────────

export const FIELD_LABELS: Record<string, string> = {
  companyProfit: 'Company profit before extraction (£)',
  associatedCompanies: 'Number of associated companies',
  employmentAllowance: 'Employment Allowance eligible',
  salaryAmount: 'Annual gross salary (£)',
  dividendAmount: 'Annual gross dividends (£)',
  pensionContribution: 'Employer pension contribution (£)',
  rentalPayment: 'Rent paid to director (£)',
  otherIncome: 'Other personal income (£)',
  otherDividends: 'Dividends from other companies (£)',
  taxYear: 'Tax year',
};

export const FIELD_TOOLTIPS: Record<string, string> = {
  companyProfit:
    'Total taxable profits before deducting director salary, employer NIC, pension, or rent. This is the pool of profit available to extract.',
  associatedCompanies:
    'Count of associated companies including this one. Associated companies share CT marginal relief thresholds. C&S has 2 (itself + Caldwell Investments).',
  employmentAllowance:
    'The £5,000 Employment Allowance offsets employer NIC. Available if the company has employees beyond a sole director. C&S (38 employees) qualifies.',
  salaryAmount:
    'Salary is CT-deductible but triggers employee NIC (8% between PT and UEL, 2% above) and employer NIC (15% above ST). Setting salary at £12,570 avoids income tax entirely. Setting it at £50,270 keeps it within the basic rate band.',
  dividendAmount:
    'Dividends are paid from post-CT distributable profits. No NIC. Taxed at dividend rates (8.75% basic, 33.75% higher, 39.35% additional). First £500 is covered by the dividend allowance.',
  pensionContribution:
    'Employer pension contributions are the most tax-efficient method — CT-deductible, no NIC, no BIK. But funds are locked until retirement age. Subject to £60,000 annual allowance.',
  rentalPayment:
    'Rent paid by the company to the director for use of personal property. Must be at arm\'s length. CT-deductible for company. Taxed as property income on director (no NIC).',
  otherIncome:
    'Income from sources outside this company — employment, property partnership, savings interest, etc. This income uses up tax bands before company income is added.',
  otherDividends:
    'Dividends from other companies. These stack on top of company dividends and use up the dividend allowance and basic rate band.',
  taxYear:
    'Select the tax year for correct rates. Rates are currently frozen at 2025/26 levels through 2028.',
};

// ─── Utility Helpers ───────────────────────────────────────────────────────────

/** Round to whole pounds */
export function roundToPounds(value: number): number {
  return Math.round(value);
}

/** Format a number as GBP currency */
export function formatGBP(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return value < 0 ? `(${formatted})` : formatted;
}

/** Format a decimal as a percentage */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Personal Allowance ────────────────────────────────────────────────────────

/** Calculate effective personal allowance after taper */
export function calculatePersonalAllowance(
  totalIncome: number,
  rates: TaxRates
): number {
  if (totalIncome <= rates.paTaperThreshold) {
    return rates.personalAllowance;
  }
  const excess = totalIncome - rates.paTaperThreshold;
  const reduction = Math.floor(excess / 2);
  return Math.max(0, rates.personalAllowance - reduction);
}

// ─── Income Tax Calculations ───────────────────────────────────────────────────

/**
 * Calculate income tax on non-savings income given a specific PA.
 * Returns the tax amount and the band position after this income.
 */
export function calculateIncomeTax(
  nonSavingsIncome: number,
  effectivePA: number,
  rates: TaxRates
): { tax: number; bandPositionAfter: number } {
  if (nonSavingsIncome <= 0) return { tax: 0, bandPositionAfter: 0 };

  let tax = 0;
  let remaining = nonSavingsIncome;

  // PA — tax-free
  const paUsed = Math.min(remaining, effectivePA);
  remaining -= paUsed;

  // Basic rate band
  const basicBandAvailable = rates.basicRateBand;
  const basicTaxable = Math.min(remaining, basicBandAvailable);
  tax += basicTaxable * 0.20;
  remaining -= basicTaxable;

  // Higher rate band (up to additional rate threshold minus PA and basic)
  const higherBandCeiling = 125_140 - effectivePA - basicBandAvailable;
  const higherBandAvailable = Math.max(0, higherBandCeiling);
  const higherTaxable = Math.min(remaining, higherBandAvailable);
  tax += higherTaxable * 0.40;
  remaining -= higherTaxable;

  // Additional rate
  if (remaining > 0) {
    tax += remaining * 0.45;
  }

  const bandPositionAfter = nonSavingsIncome - effectivePA;

  return { tax: roundToPounds(tax), bandPositionAfter: Math.max(0, bandPositionAfter) };
}

/**
 * Calculate dividend tax given the band position from non-savings income.
 * Dividends sit on top of non-savings income and use remaining bands.
 */
export function calculateDividendTax(
  dividendAmount: number,
  bandPositionAfterNonSavings: number,
  rates: TaxRates
): number {
  if (dividendAmount <= 0) return 0;

  let tax = 0;
  let remaining = dividendAmount;

  // Dividend allowance
  const daUsed = Math.min(remaining, rates.dividendAllowance);
  remaining -= daUsed;

  if (remaining <= 0) return 0;

  // Determine how much basic rate band is left
  const basicBandTotal = rates.basicRateBand; // £37,700
  const basicBandUsed = Math.max(0, bandPositionAfterNonSavings);
  const basicBandRemaining = Math.max(0, basicBandTotal - basicBandUsed);

  // Dividend basic rate (8.75%)
  const divBasic = Math.min(remaining, basicBandRemaining);
  tax += divBasic * 0.0875;
  remaining -= divBasic;

  // Higher rate band remaining
  const higherBandCeiling = 125_140 - rates.personalAllowance; // absolute ceiling for higher rate
  const higherBandUsed = bandPositionAfterNonSavings + daUsed + divBasic;
  const higherBandRemaining = Math.max(0, higherBandCeiling - rates.basicRateBand - Math.max(0, bandPositionAfterNonSavings - rates.basicRateBand));

  // Simpler approach: track cumulative taxable income position
  const positionAfterBasicDiv = bandPositionAfterNonSavings + daUsed + divBasic;
  const additionalRateStart = 125_140 - rates.personalAllowance;
  const higherBandAvailableForDiv = Math.max(0, additionalRateStart - positionAfterBasicDiv);

  // Dividend higher rate (33.75%)
  const divHigher = Math.min(remaining, higherBandAvailableForDiv);
  tax += divHigher * 0.3375;
  remaining -= divHigher;

  // Dividend additional rate (39.35%)
  if (remaining > 0) {
    tax += remaining * 0.3935;
  }

  return roundToPounds(tax);
}

// ─── NIC Calculations ──────────────────────────────────────────────────────────

/** Calculate employee Class 1 NIC on salary (director annual earnings method) */
export function calculateEmployeeNIC(
  salary: number,
  rates: TaxRates
): number {
  if (salary <= rates.nic.pt) return 0;

  let nic = 0;

  // 8% between PT and UEL
  const mainBand = Math.min(salary, rates.nic.uel) - rates.nic.pt;
  nic += Math.max(0, mainBand) * rates.nic.employeeMainRate;

  // 2% above UEL
  if (salary > rates.nic.uel) {
    nic += (salary - rates.nic.uel) * rates.nic.employeeUpperRate;
  }

  return roundToPounds(nic);
}

/** Calculate employer Class 1 NIC on salary, net of Employment Allowance */
export function calculateEmployerNIC(
  salary: number,
  employmentAllowance: boolean,
  rates: TaxRates
): number {
  if (salary <= rates.nic.st) return 0;

  let nic = (salary - rates.nic.st) * rates.nic.employerRate;

  if (employmentAllowance) {
    nic = Math.max(0, nic - rates.nic.employmentAllowance);
  }

  return roundToPounds(nic);
}

// ─── Corporation Tax Calculations ──────────────────────────────────────────────

/**
 * Calculate corporation tax on taxable total profits.
 * Applies marginal relief when TTP falls between divided limits.
 */
export function calculateCorporationTax(
  ttp: number,
  associatedCompanies: number,
  rates: TaxRates
): number {
  if (ttp <= 0) return 0;

  const n = Math.max(1, associatedCompanies);
  const lowerLimit = rates.ct.lowerLimit / n;
  const upperLimit = rates.ct.upperLimit / n;

  if (ttp <= lowerLimit) {
    return roundToPounds(ttp * rates.ct.smallProfitsRate);
  }

  if (ttp >= upperLimit) {
    return roundToPounds(ttp * rates.ct.mainRate);
  }

  // Marginal relief: CT at main rate minus relief
  const ctAtMainRate = ttp * rates.ct.mainRate;
  const fraction = rates.ct.mrNumerator / rates.ct.mrDenominator;
  // For a company with no exempt distributions, augmented profits = TTP
  const marginalRelief = fraction * (upperLimit - ttp);
  const ct = ctAtMainRate - marginalRelief;

  return roundToPounds(ct);
}

/** Calculate the marginal CT rate at a given profit level */
export function marginalCTRate(
  ttp: number,
  associatedCompanies: number,
  rates: TaxRates
): number {
  if (ttp <= 0) return 0;

  const n = Math.max(1, associatedCompanies);
  const lowerLimit = rates.ct.lowerLimit / n;
  const upperLimit = rates.ct.upperLimit / n;

  if (ttp <= lowerLimit) return rates.ct.smallProfitsRate;
  if (ttp >= upperLimit) return rates.ct.mainRate;

  // In the marginal band, the effective marginal rate is:
  // main rate + fraction = 25% + 1.5% = 26.5%
  return rates.ct.mainRate + rates.ct.mrNumerator / rates.ct.mrDenominator;
}

// ─── Strategy Calculation ──────────────────────────────────────────────────────

/**
 * Calculate the complete tax position for a given extraction strategy.
 * This is the core calculation engine.
 */
export function calculateStrategy(
  inputs: ProfitExtractionInputs,
  strategyType: StrategyType,
  salaryOverride?: number,
  dividendOverride?: number,
  pensionOverride?: number,
  rentalOverride?: number
): StrategyResult {
  const rates = getTaxRates(inputs.personal.taxYear);
  const salary = salaryOverride ?? inputs.extraction.salaryAmount;
  const pension = pensionOverride ?? inputs.extraction.pensionContribution;
  const rental = rentalOverride ?? inputs.extraction.rentalPayment;

  // Step 1: Company-level — calculate employer NIC and CT
  const employerNIC = calculateEmployerNIC(salary, inputs.company.employmentAllowance, rates);

  // CT-deductible amounts
  const totalDeductions = salary + employerNIC + pension + rental;
  const remainingProfit = Math.max(0, inputs.company.companyProfit - totalDeductions);

  // CT on remaining profit
  const ctOnRemaining = calculateCorporationTax(
    remainingProfit,
    inputs.company.associatedCompanies,
    rates
  );

  // Distributable profit (what's available for dividends)
  const distributableProfit = Math.max(0, remainingProfit - ctOnRemaining);

  // Actual dividend — capped at distributable profit
  const requestedDividend = dividendOverride ?? inputs.extraction.dividendAmount;
  const actualDividend = Math.min(requestedDividend, distributableProfit);

  // Step 2: Director-level — calculate personal taxes

  // Total non-savings income: salary + rental + other income
  const nonSavingsIncome = salary + rental + inputs.personal.otherIncome;

  // Total dividends: company dividends + other dividends
  const totalDividends = actualDividend + inputs.personal.otherDividends;

  // Total income for PA taper purposes
  const totalIncome = nonSavingsIncome + totalDividends;

  // Effective PA
  const effectivePA = calculatePersonalAllowance(totalIncome, rates);

  // Income tax on non-savings income
  const { tax: nonSavingsTax, bandPositionAfter } = calculateIncomeTax(
    nonSavingsIncome,
    effectivePA,
    rates
  );

  // Income tax on dividends
  const dividendTax = calculateDividendTax(totalDividends, bandPositionAfter, rates);

  // Employee NIC
  const employeeNIC = calculateEmployeeNIC(salary, rates);

  // Step 3: Allocate taxes to extraction methods

  // Apportion non-savings tax between salary, rental, and other income
  const nonSavingsTotal = nonSavingsIncome;
  const salaryProportion = nonSavingsTotal > 0 ? salary / nonSavingsTotal : 0;
  const rentalProportion = nonSavingsTotal > 0 ? rental / nonSavingsTotal : 0;

  const salaryIncomeTax = roundToPounds(nonSavingsTax * salaryProportion);
  const rentalIncomeTax = roundToPounds(nonSavingsTax * rentalProportion);

  // Apportion dividend tax between company dividends and other dividends
  const dividendTotal = totalDividends;
  const companyDivProportion = dividendTotal > 0 ? actualDividend / dividendTotal : 0;
  const companyDivTax = roundToPounds(dividendTax * companyDivProportion);

  // CT impact: CT saved by salary/pension/rent deduction vs CT on remaining profit allocated to dividends
  const ctWithoutDeductions = calculateCorporationTax(
    inputs.company.companyProfit,
    inputs.company.associatedCompanies,
    rates
  );
  const ctSaved = ctWithoutDeductions - ctOnRemaining;

  // CT cost attributable to dividends = CT on the profit that generates the dividends
  const ctForDividends = actualDividend > 0 && distributableProfit > 0
    ? roundToPounds(ctOnRemaining * (actualDividend / distributableProfit))
    : 0;

  // Build method breakdowns
  const methods: MethodTaxBreakdown[] = [];

  // Salary breakdown
  if (salary > 0) {
    const salaryCTSaving = roundToPounds(ctSaved * ((salary + employerNIC) / Math.max(1, totalDeductions)));
    const salaryTotalCost = salaryIncomeTax + employeeNIC + employerNIC - salaryCTSaving;
    methods.push({
      method: 'salary',
      grossAmount: salary,
      corporationTaxImpact: -salaryCTSaving,
      employerNIC,
      employeeNIC,
      incomeTax: salaryIncomeTax,
      totalTaxCost: Math.max(0, salaryTotalCost),
      netReceipt: salary - salaryIncomeTax - employeeNIC,
      effectiveRate: salary > 0 ? Math.max(0, salaryTotalCost) / salary : 0,
    });
  }

  // Dividend breakdown
  if (actualDividend > 0) {
    const divTotalCost = ctForDividends + companyDivTax;
    methods.push({
      method: 'dividend',
      grossAmount: actualDividend,
      corporationTaxImpact: ctForDividends,
      employerNIC: 0,
      employeeNIC: 0,
      incomeTax: companyDivTax,
      totalTaxCost: divTotalCost,
      netReceipt: actualDividend - companyDivTax,
      effectiveRate: actualDividend > 0 ? divTotalCost / actualDividend : 0,
    });
  }

  // Pension breakdown
  if (pension > 0) {
    const pensionCTSaving = roundToPounds(ctSaved * (pension / Math.max(1, totalDeductions)));
    methods.push({
      method: 'pension',
      grossAmount: pension,
      corporationTaxImpact: -pensionCTSaving,
      employerNIC: 0,
      employeeNIC: 0,
      incomeTax: 0,
      totalTaxCost: -pensionCTSaving,
      netReceipt: pension, // Goes into pension pot — full amount
      effectiveRate: pension > 0 ? -pensionCTSaving / pension : 0,
    });
  }

  // Rental breakdown
  if (rental > 0) {
    const rentalCTSaving = roundToPounds(ctSaved * (rental / Math.max(1, totalDeductions)));
    const rentalTotalCost = rentalIncomeTax - rentalCTSaving;
    methods.push({
      method: 'rent',
      grossAmount: rental,
      corporationTaxImpact: -rentalCTSaving,
      employerNIC: 0,
      employeeNIC: 0,
      incomeTax: rentalIncomeTax,
      totalTaxCost: Math.max(0, rentalTotalCost),
      netReceipt: rental - rentalIncomeTax,
      effectiveRate: rental > 0 ? Math.max(0, rentalTotalCost) / rental : 0,
    });
  }

  // Totals
  const totalExtracted = salary + actualDividend + pension + rental;
  const totalTaxCost = nonSavingsTax + dividendTax + employeeNIC + employerNIC + ctOnRemaining - (ctWithoutDeductions - ctOnRemaining > 0 ? 0 : 0);

  // Simpler total: what the director actually pays in total taxes on extracted amounts
  const personalTaxes = nonSavingsTax + dividendTax + employeeNIC;
  const companyTaxes = employerNIC + ctForDividends;
  const netCTSaving = ctSaved;
  const effectiveTotalCost = personalTaxes + companyTaxes;

  const totalNet = methods.reduce((sum, m) => sum + m.netReceipt, 0);

  // NIC efficiency point
  const nicPoint = calculateNICEfficiencyPoint(inputs, rates);

  // Strategy label
  const labelMap: Record<StrategyType, string> = {
    'salary-only': 'Salary Only',
    'dividend-only': 'Minimum Salary + Dividends',
    'optimal-mix': 'Optimal Mix',
    custom: 'Your Strategy',
  };

  return {
    strategyType,
    label: labelMap[strategyType],
    methods,
    totalExtracted,
    totalTaxCost: effectiveTotalCost,
    totalNetReceipt: totalNet,
    overallEffectiveRate: totalExtracted > 0 ? effectiveTotalCost / totalExtracted : 0,
    companyProfitRemaining: remainingProfit - actualDividend,
    companyTaxOnRemaining: ctOnRemaining,
    nicEfficiencyPoint: nicPoint,
  };
}

/**
 * Calculate the NIC efficiency point — the salary level where the marginal
 * NIC cost exceeds the marginal CT saving.
 */
export function calculateNICEfficiencyPoint(
  inputs: ProfitExtractionInputs,
  rates: TaxRates
): number {
  // The NIC efficiency point depends on whether marginal NIC cost exceeds
  // marginal CT benefit. At the UEL, employee NIC drops from 8% to 2%.
  //
  // Below UEL: marginal cost of £1 salary = 20% IT + 8% employee NIC + 15% employer NIC
  //   BUT employer NIC is CT-deductible, and salary is CT-deductible.
  //   CT saving = marginal CT rate × (1 + employer NIC rate) per £1 of salary
  //
  // Above UEL: 40% IT + 2% employee NIC + 15% employer NIC, CT saving at marginal rate
  //
  // The crossover point is typically at or near the UEL (£50,270).

  const mCTRate = marginalCTRate(
    inputs.company.companyProfit - rates.nic.uel,
    inputs.company.associatedCompanies,
    rates
  );

  // Below UEL marginal total NIC = 8% + 15% = 23%
  // CT saving on salary + employer NIC = mCTRate × (1 + 15%) of each £1 salary
  // Net marginal cost below UEL = 20% + 8% + 15% - mCTRate × 1.15
  // Net marginal cost above UEL = 40% + 2% + 15% - mCTRate × 1.15

  // For typical 26.5% marginal CT rate:
  //   Below UEL: 20 + 8 + 15 - 26.5×1.15 = 43 - 30.475 = 12.525% net
  //   Above UEL: 40 + 2 + 15 - 26.5×1.15 = 57 - 30.475 = 26.525% net
  // So salary is always more expensive above UEL.

  // The NIC efficiency point is the UEL — above this, the jump to 40% IT
  // combined with 2% employee NIC + 15% employer NIC makes salary much more expensive.
  return rates.nic.uel; // £50,270 for 2025/26
}

// ─── Pre-Built Strategies ──────────────────────────────────────────────────────

/** Generate salary-only strategy */
function salaryOnlyStrategy(inputs: ProfitExtractionInputs): StrategyResult {
  const rates = getTaxRates(inputs.personal.taxYear);
  // Extract as much as possible as salary (up to company profit)
  const maxSalary = inputs.company.companyProfit;
  return calculateStrategy(inputs, 'salary-only', maxSalary, 0, 0, 0);
}

/** Generate dividend-only strategy (minimum salary at PA, rest as dividends) */
function dividendOnlyStrategy(inputs: ProfitExtractionInputs): StrategyResult {
  const rates = getTaxRates(inputs.personal.taxYear);
  const minSalary = rates.personalAllowance; // £12,570
  const remainingAfterSalary = inputs.company.companyProfit - minSalary;

  // Employer NIC on minimum salary
  const empNIC = calculateEmployerNIC(minSalary, inputs.company.employmentAllowance, rates);
  const profitAfterDeductions = Math.max(0, remainingAfterSalary - empNIC);
  const ct = calculateCorporationTax(profitAfterDeductions, inputs.company.associatedCompanies, rates);
  const distributable = Math.max(0, profitAfterDeductions - ct);

  return calculateStrategy(inputs, 'dividend-only', minSalary, distributable, 0, 0);
}

/** Generate optimal mix strategy */
function optimalMixStrategy(inputs: ProfitExtractionInputs): StrategyResult {
  const rates = getTaxRates(inputs.personal.taxYear);

  // Optimal salary = UEL (NIC efficiency point)
  const optimalSalary = Math.min(rates.nic.uel, inputs.company.companyProfit);

  // Pension = annual allowance or remaining profit, whichever is less
  const empNIC = calculateEmployerNIC(optimalSalary, inputs.company.employmentAllowance, rates);
  const afterSalary = Math.max(0, inputs.company.companyProfit - optimalSalary - empNIC);
  const optimalPension = Math.min(rates.pensionAnnualAllowance, afterSalary);

  // Dividends = distributable profit after salary, employer NIC, pension
  const afterPension = Math.max(0, afterSalary - optimalPension);
  const ct = calculateCorporationTax(afterPension, inputs.company.associatedCompanies, rates);
  const distributable = Math.max(0, afterPension - ct);

  return calculateStrategy(inputs, 'optimal-mix', optimalSalary, distributable, optimalPension, 0);
}

// ─── Validation Engine ─────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: ProfitExtractionInputs): ValidationResult[] {
  const results: ValidationResult[] = [];
  const rates = getTaxRates(inputs.personal.taxYear);
  const { extraction, company, personal } = inputs;
  const totalExtraction = extraction.salaryAmount + extraction.dividendAmount
    + extraction.pensionContribution + extraction.rentalPayment;

  // V1: Extraction cap
  if (totalExtraction > company.companyProfit) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: `Total extraction (${formatGBP(totalExtraction)}) exceeds company profit (${formatGBP(company.companyProfit)}). The company cannot pay more than it earns.`,
      affectedFields: ['salaryAmount', 'dividendAmount', 'pensionContribution', 'rentalPayment'],
      passed: false,
    });
  } else {
    results.push({
      ruleId: 'V1',
      severity: 'info',
      message: `Total extraction (${formatGBP(totalExtraction)}) is within company profit (${formatGBP(company.companyProfit)}).`,
      affectedFields: [],
      passed: true,
    });
  }

  // V2: Dividend distributable check
  const empNIC = calculateEmployerNIC(extraction.salaryAmount, company.employmentAllowance, rates);
  const deductions = extraction.salaryAmount + empNIC + extraction.pensionContribution + extraction.rentalPayment;
  const remainingForDiv = Math.max(0, company.companyProfit - deductions);
  const ctOnRemaining = calculateCorporationTax(remainingForDiv, company.associatedCompanies, rates);
  const distributable = Math.max(0, remainingForDiv - ctOnRemaining);

  if (extraction.dividendAmount > distributable) {
    results.push({
      ruleId: 'V2',
      severity: 'warning',
      message: `Requested dividends (${formatGBP(extraction.dividendAmount)}) exceed distributable reserves (${formatGBP(distributable)}). Dividends will be capped at ${formatGBP(distributable)}.`,
      affectedFields: ['dividendAmount'],
      passed: false,
    });
  } else if (extraction.dividendAmount > 0) {
    results.push({
      ruleId: 'V2',
      severity: 'info',
      message: `Dividends (${formatGBP(extraction.dividendAmount)}) are within distributable reserves (${formatGBP(distributable)}).`,
      affectedFields: [],
      passed: true,
    });
  }

  // V3: Pension annual allowance
  if (extraction.pensionContribution > rates.pensionAnnualAllowance) {
    results.push({
      ruleId: 'V3',
      severity: 'warning',
      message: `Pension contribution (${formatGBP(extraction.pensionContribution)}) exceeds the annual allowance (${formatGBP(rates.pensionAnnualAllowance)}). Annual allowance charge will apply on the excess unless carried-forward allowance is available.`,
      affectedFields: ['pensionContribution'],
      passed: false,
    });
  }

  // V4: Pension earnings cap
  if (extraction.pensionContribution > extraction.salaryAmount && extraction.pensionContribution > 0) {
    results.push({
      ruleId: 'V4',
      severity: 'info',
      message: `Pension contribution (${formatGBP(extraction.pensionContribution)}) exceeds salary (${formatGBP(extraction.salaryAmount)}). For employer contributions, this is permitted — the earnings cap only applies to personal contributions for tax relief purposes.`,
      affectedFields: ['pensionContribution'],
      passed: true,
    });
  }

  // V5: Rental arm's length
  if (extraction.rentalPayment > 0) {
    results.push({
      ruleId: 'V5',
      severity: 'info',
      message: `Rental payment of ${formatGBP(extraction.rentalPayment)} entered. The rent must be at arm\'s length — HMRC can challenge payments that exceed the open market rental value.`,
      affectedFields: ['rentalPayment'],
      passed: true,
    });
  }

  // V6: Employment allowance check
  if (company.employmentAllowance) {
    results.push({
      ruleId: 'V6',
      severity: 'info',
      message: 'Employment Allowance claimed (£5,000). Confirm the company is not a single-director company with no other employees — EA is not available in that case.',
      affectedFields: ['employmentAllowance'],
      passed: true,
    });
  }

  // V7: Salary below NIC threshold
  if (extraction.salaryAmount > rates.nic.lel && extraction.salaryAmount <= rates.nic.pt) {
    results.push({
      ruleId: 'V7',
      severity: 'info',
      message: `Salary of ${formatGBP(extraction.salaryAmount)} is between LEL (${formatGBP(rates.nic.lel)}) and PT (${formatGBP(rates.nic.pt)}). No NIC is payable but a qualifying year for state pension is secured. This is a deliberate strategy.`,
      affectedFields: ['salaryAmount'],
      passed: true,
    });
  }

  // V8: PA taper warning
  const totalIncome = extraction.salaryAmount + extraction.dividendAmount
    + extraction.rentalPayment + personal.otherIncome + personal.otherDividends;
  if (totalIncome > rates.paTaperThreshold) {
    const effectivePA = calculatePersonalAllowance(totalIncome, rates);
    results.push({
      ruleId: 'V8',
      severity: 'warning',
      message: `Total income (${formatGBP(totalIncome)}) exceeds £100,000. Personal allowance tapered to ${formatGBP(effectivePA)}. Effective marginal rate between £100,000 and £125,140 is 60%.`,
      affectedFields: ['salaryAmount', 'dividendAmount'],
      passed: false,
    });
  }

  // V9: Negative remaining profit
  if (deductions > company.companyProfit) {
    results.push({
      ruleId: 'V9',
      severity: 'error',
      message: `CT-deductible extractions (salary ${formatGBP(extraction.salaryAmount)} + employer NIC ${formatGBP(empNIC)} + pension ${formatGBP(extraction.pensionContribution)} + rent ${formatGBP(extraction.rentalPayment)} = ${formatGBP(deductions)}) exceed company profit. The company will make a loss.`,
      affectedFields: ['salaryAmount', 'pensionContribution', 'rentalPayment'],
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
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

// ─── Recommendation Generator ──────────────────────────────────────────────────

/** Generate a plain-English recommendation based on strategy comparison */
export function generateRecommendation(
  customStrategy: StrategyResult,
  optimalStrategy: StrategyResult,
  inputs: ProfitExtractionInputs
): string {
  const rates = getTaxRates(inputs.personal.taxYear);
  const parts: string[] = [];

  // Compare custom to optimal
  const savings = optimalStrategy.totalNetReceipt - customStrategy.totalNetReceipt;

  if (savings > 100) {
    parts.push(
      `The optimal strategy saves ${formatGBP(savings)} compared to your current extraction mix.`
    );
  } else if (savings > -100) {
    parts.push('Your current extraction strategy is near-optimal.');
  } else {
    parts.push(
      `Your current strategy actually yields ${formatGBP(-savings)} more than the computed optimal — this may be due to specific personal circumstances.`
    );
  }

  // Salary commentary
  const salaryMethod = customStrategy.methods.find((m) => m.method === 'salary');
  if (salaryMethod) {
    if (salaryMethod.grossAmount <= rates.personalAllowance) {
      parts.push(
        `Salary at ${formatGBP(salaryMethod.grossAmount)} (personal allowance level) — no income tax on salary. Consider whether NIC qualifying year is secured.`
      );
    } else if (salaryMethod.grossAmount <= rates.nic.uel) {
      parts.push(
        `Salary at ${formatGBP(salaryMethod.grossAmount)} — within the basic rate band and below the UEL. Employee NIC at 8%. This is the NIC-efficient zone.`
      );
    } else {
      parts.push(
        `Salary at ${formatGBP(salaryMethod.grossAmount)} — above the UEL (${formatGBP(rates.nic.uel)}). The portion above UEL is taxed at 40% IT + 2% NIC + 15% employer NIC = 57%, offset by ~30% CT saving. Consider capping salary at the UEL and taking the excess as dividends.`
      );
    }
  }

  // Pension commentary
  const pensionMethod = customStrategy.methods.find((m) => m.method === 'pension');
  if (pensionMethod && pensionMethod.grossAmount > 0) {
    parts.push(
      `Employer pension contribution of ${formatGBP(pensionMethod.grossAmount)} — CT-deductible, no NIC, no BIK. Most tax-efficient extraction method (but funds locked until retirement).`
    );
  } else if (inputs.company.companyProfit > rates.nic.uel) {
    parts.push(
      'Consider employer pension contributions — they are CT-deductible with no NIC or BIK, making them the most tax-efficient extraction method.'
    );
  }

  return parts.join(' ');
}

// ─── Full Calculation Entry Point ──────────────────────────────────────────────

/** Calculate everything: custom strategy, comparisons, optimal, validation, recommendation */
export function calculateExtraction(inputs: ProfitExtractionInputs): ProfitExtractionOutput {
  const rates = getTaxRates(inputs.personal.taxYear);

  // Custom strategy (user's inputs)
  const customStrategy = calculateStrategy(inputs, 'custom');

  // Comparison strategies
  const salaryOnly = salaryOnlyStrategy(inputs);
  const dividendOnly = dividendOnlyStrategy(inputs);
  const optimalMix = optimalMixStrategy(inputs);

  const comparisonStrategies = [salaryOnly, dividendOnly, optimalMix];

  // Find the actual optimal (highest net receipt)
  const allStrategies = [customStrategy, ...comparisonStrategies];
  const optimalStrategy = allStrategies.reduce((best, current) =>
    current.totalNetReceipt > best.totalNetReceipt ? current : best
  );

  // Validation
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Recommendation
  const recommendation = generateRecommendation(customStrategy, optimalStrategy, inputs);

  // Effective PA
  const totalIncome = inputs.extraction.salaryAmount + inputs.extraction.dividendAmount
    + inputs.extraction.rentalPayment + inputs.personal.otherIncome + inputs.personal.otherDividends;
  const effectivePA = calculatePersonalAllowance(totalIncome, rates);

  // Marginal rates
  const salaryMarginal = calculateSalaryMarginalRate(inputs, rates);
  const dividendMarginal = calculateDividendMarginalRate(inputs, rates);

  return {
    customStrategy,
    comparisonStrategies,
    optimalStrategy,
    validationResults,
    validationSummary,
    recommendation,
    effectivePersonalAllowance: effectivePA,
    marginalRates: {
      salaryMarginalRate: salaryMarginal,
      dividendMarginalRate: dividendMarginal,
    },
  };
}

/** Calculate marginal rate of £1 more salary at current level */
function calculateSalaryMarginalRate(inputs: ProfitExtractionInputs, rates: TaxRates): number {
  const salary = inputs.extraction.salaryAmount;

  // Income tax marginal rate
  const totalNonSavings = salary + inputs.extraction.rentalPayment + inputs.personal.otherIncome;
  const totalIncome = totalNonSavings + inputs.extraction.dividendAmount + inputs.personal.otherDividends;
  const effectivePA = calculatePersonalAllowance(totalIncome, rates);

  let itRate = 0;
  const taxableNonSavings = totalNonSavings - effectivePA;
  if (taxableNonSavings <= 0) itRate = 0;
  else if (taxableNonSavings <= rates.basicRateBand) itRate = 0.20;
  else if (totalIncome <= 125_140) itRate = 0.40;
  else itRate = 0.45;

  // PA taper zone — effective 60%
  if (totalIncome > rates.paTaperThreshold && totalIncome <= 125_140) {
    itRate = 0.60;
  }

  // Employee NIC marginal rate
  const nicRate = salary <= rates.nic.pt ? 0
    : salary <= rates.nic.uel ? rates.nic.employeeMainRate
    : rates.nic.employeeUpperRate;

  // Employer NIC marginal rate
  const empNicRate = salary <= rates.nic.st ? 0 : rates.nic.employerRate;

  // CT saving on marginal salary + employer NIC
  const mCT = marginalCTRate(
    Math.max(0, inputs.company.companyProfit - salary),
    inputs.company.associatedCompanies,
    rates
  );
  const ctSaving = mCT * (1 + empNicRate);

  return itRate + nicRate + empNicRate - ctSaving;
}

/** Calculate marginal rate of £1 more dividend at current level */
function calculateDividendMarginalRate(inputs: ProfitExtractionInputs, rates: TaxRates): number {
  const totalNonSavings = inputs.extraction.salaryAmount + inputs.extraction.rentalPayment + inputs.personal.otherIncome;
  const totalIncome = totalNonSavings + inputs.extraction.dividendAmount + inputs.personal.otherDividends;
  const effectivePA = calculatePersonalAllowance(totalIncome, rates);
  const bandPosition = Math.max(0, totalNonSavings - effectivePA);

  const totalDividends = inputs.extraction.dividendAmount + inputs.personal.otherDividends;

  // Where does the next £1 of dividend fall?
  const divPosition = bandPosition + Math.max(0, totalDividends - rates.dividendAllowance);

  let divRate = 0;
  if (totalDividends <= rates.dividendAllowance) divRate = 0;
  else if (divPosition <= rates.basicRateBand) divRate = 0.0875;
  else if (divPosition <= 125_140 - effectivePA) divRate = 0.3375;
  else divRate = 0.3935;

  // CT cost: dividends come from post-CT profits
  const mCT = marginalCTRate(
    Math.max(0, inputs.company.companyProfit - inputs.extraction.salaryAmount),
    inputs.company.associatedCompanies,
    rates
  );

  // Total marginal cost = CT on profit needed + dividend tax on what's left
  // £1 of pre-CT profit yields £(1 - mCT) as dividend
  // Dividend tax on that = (1 - mCT) × divRate
  // Total = mCT + (1 - mCT) × divRate
  return mCT + (1 - mCT) * divRate;
}

// ─── Default Inputs ────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): ProfitExtractionInputs {
  return {
    company: {
      companyProfit: 0,
      associatedCompanies: 1,
      employmentAllowance: false,
    },
    extraction: {
      salaryAmount: 0,
      dividendAmount: 0,
      pensionContribution: 0,
      rentalPayment: 0,
    },
    personal: {
      otherIncome: 0,
      otherDividends: 0,
      taxYear: '2025/26',
    },
  };
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  // ── Scenario 1: S4 — Marcus's Current Position ─────────────────────────────
  {
    id: 's4-marcus-current',
    name: 'S4 — Marcus Current Position',
    section: 4,
    description:
      'Marcus asks "How much personal tax will I owe?" Compare his current salary/dividend levels against alternatives. Preliminary analysis before full S8 optimisation.',
    preFilledInputs: {
      company: {
        companyProfit: 100_000,
        associatedCompanies: 2,
        employmentAllowance: true,
      },
      extraction: {
        salaryAmount: 50_270,
        dividendAmount: 30_000,
        pensionContribution: 0,
        rentalPayment: 0,
      },
      personal: {
        otherIncome: 10_400,   // Property partnership £8,900 + bank interest £1,500
        otherDividends: 8_000, // Caldwell Investments
        taxYear: '2025/26',
      },
    },
    expectedOptimal: {
      salaryAmount: 50_270,
      dividendAmount: 30_000,
      pensionContribution: 0,
      totalNetReceipt: 65_000,  // Approximate — depends on exact calculations
      overallEffectiveRate: 0.19,
    },
    hints: {
      companyProfit: [
        'C&S\'s TTP is approximately £95,000–£105,000 before salary deduction.',
        'Use £100,000 as a round estimate for this preliminary analysis.',
      ],
      associatedCompanies: [
        'C&S has one associated company: Caldwell Investments Ltd (Marcus controls both).',
        'This divides CT thresholds by 2: lower limit £25,000, upper limit £125,000.',
      ],
      salaryAmount: [
        'Marcus\'s current salary is £50,270 — exactly at the basic rate band ceiling.',
        'All salary is taxed at 20% or less. Employee NIC at 8% up to this level.',
      ],
      dividendAmount: [
        'C&S typically pays Marcus ~£30,000 in dividends annually.',
        'After his other income and dividends from Caldwell Investments, these fall in the higher rate band.',
      ],
      otherIncome: [
        'Marcus has property partnership income of £8,900 (50% share) and bank interest of £1,500.',
        'This other income uses up basic rate band before company dividends are stacked.',
      ],
    },
  },

  // ── Scenario 2: S8 — Full Optimisation (Marcus) ────────────────────────────
  {
    id: 's8-marcus-optimisation',
    name: 'S8 — Marcus Full Optimisation',
    section: 8,
    description:
      'Board meeting profit extraction review. Full optimisation of salary/dividend/pension split for Marcus. He is considering £20,000 pension contribution before exit.',
    preFilledInputs: {
      company: {
        companyProfit: 100_000,
        associatedCompanies: 2,
        employmentAllowance: true,
      },
      extraction: {
        salaryAmount: 50_270,
        dividendAmount: 10_000,
        pensionContribution: 20_000,
        rentalPayment: 0,
      },
      personal: {
        otherIncome: 10_400,
        otherDividends: 8_000,
        taxYear: '2025/26',
      },
    },
    expectedOptimal: {
      salaryAmount: 50_270,
      dividendAmount: 10_000,
      pensionContribution: 20_000,
      totalNetReceipt: 68_000,
      overallEffectiveRate: 0.15,
    },
    hints: {
      pensionContribution: [
        'Employer pension contributions are CT-deductible, no NIC, no BIK.',
        'Marcus has £60,000 annual allowance. At age 58, maximising pension before exit is tax-efficient.',
        '£20,000 is well within the £60,000 annual allowance.',
      ],
      dividendAmount: [
        'After £20,000 pension, less profit is available for dividends.',
        'Salary £50,270 + employer NIC + pension £20,000 significantly reduce TTP.',
        'Remaining distributable profit determines maximum dividend.',
      ],
      salaryAmount: [
        'Keep salary at £50,270 — this is Marcus\'s NIC efficiency point.',
        'CT saving on salary offsets the NIC cost below the UEL.',
      ],
    },
  },

  // ── Scenario 3: S8 — Full Optimisation (Sophie) ────────────────────────────
  {
    id: 's8-sophie-optimisation',
    name: 'S8 — Sophie Full Optimisation',
    section: 8,
    description:
      'Same board meeting. Sophie\'s position differs — younger, single, no other income. Different optimal strategy. Employment Allowance already used against Marcus\'s NIC.',
    preFilledInputs: {
      company: {
        companyProfit: 100_000,
        associatedCompanies: 2,
        employmentAllowance: false, // EA already claimed against Marcus's NIC
      },
      extraction: {
        salaryAmount: 50_270,
        dividendAmount: 20_000,
        pensionContribution: 10_000,
        rentalPayment: 0,
      },
      personal: {
        otherIncome: 0,
        otherDividends: 0,
        taxYear: '2025/26',
      },
    },
    expectedOptimal: {
      salaryAmount: 50_270,
      dividendAmount: 20_000,
      pensionContribution: 10_000,
      totalNetReceipt: 68_000,
      overallEffectiveRate: 0.15,
    },
    hints: {
      employmentAllowance: [
        'EA is claimed once per company, not per director.',
        'If already claimed against Marcus\'s employer NIC, Sophie\'s employer NIC is not reduced.',
      ],
      otherIncome: [
        'Sophie has no other income — all her basic rate band is available.',
        'This means her dividends stay in the basic rate band (8.75%) for longer than Marcus\'s.',
      ],
      dividendAmount: [
        'With no other income, Sophie\'s first £37,700 of income above PA is basic rate.',
        'After salary uses the basic rate band, dividends start at 8.75% (basic rate dividend).',
        'She can receive more dividends at the lower rate than Marcus can.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C scenarios by section number */
export function getScenariosBySection(section: number): HCScenario[] {
  return HC_SCENARIOS.filter((s) => s.section === section);
}
