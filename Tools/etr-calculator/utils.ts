// T-ETR: ETR and Top-Up Tax Calculator — Utilities

import type {
  AdjustmentCategory,
  CoveredTaxCategory,
  IncomeAdjustment,
  CoveredTaxEntry,
  DeMinimisData,
  DeMinimisResult,
  JurisdictionEntry,
  GloBEIncomeResult,
  CoveredTaxResult,
  SBIEResult,
  TopUpTaxResult,
  JurisdictionResult,
  JurisdictionSummaryRow,
  ComputationResult,
  EtrStep,
  StepConfig,
  SelectOption,
  ValidationError,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** Minimum effective tax rate under Article 5.2.2 */
export const MINIMUM_ETR = 0.15;

/** De minimis revenue threshold: €10,000,000 (Article 5.5.1) */
export const DE_MINIMIS_REVENUE_THRESHOLD = 10_000_000;

/** De minimis income threshold: €1,000,000 (Article 5.5.1) */
export const DE_MINIMIS_INCOME_THRESHOLD = 1_000_000;

/** DTL cap rate: 15% (Article 4.4.4) */
export const DTL_CAP_RATE = 0.15;

/** MOCE ownership threshold: below 30% = MOCE (Article 5.6) */
export const MOCE_THRESHOLD_PERCENT = 30;

// ============================================================
// SBIE TRANSITIONAL RATE SCHEDULE (Article 9.2)
// ============================================================

/**
 * SBIE transitional carve-out rates by fiscal year.
 * Payroll and tangible asset rates decline from 2024 to 2033,
 * reaching the permanent 5%/5% rate from 2033 onwards.
 *
 * Source: course-context.md — "SBIE transitional rates: 9.8%/7.8% (2024)
 * declining to 5%/5% (2033)"; fact-register.md F-170/F-171.
 */
export interface SBIERate {
  fiscalYear: number;
  payrollRate: number; // As decimal (e.g. 0.098 = 9.8%)
  assetRate: number; // As decimal (e.g. 0.078 = 7.8%)
}

export const SBIE_TRANSITIONAL_RATES: SBIERate[] = [
  { fiscalYear: 2024, payrollRate: 0.098, assetRate: 0.078 },
  { fiscalYear: 2025, payrollRate: 0.096, assetRate: 0.076 },
  { fiscalYear: 2026, payrollRate: 0.094, assetRate: 0.074 },
  { fiscalYear: 2027, payrollRate: 0.092, assetRate: 0.072 },
  { fiscalYear: 2028, payrollRate: 0.09, assetRate: 0.07 },
  { fiscalYear: 2029, payrollRate: 0.082, assetRate: 0.066 },
  { fiscalYear: 2030, payrollRate: 0.074, assetRate: 0.062 },
  { fiscalYear: 2031, payrollRate: 0.066, assetRate: 0.058 },
  { fiscalYear: 2032, payrollRate: 0.058, assetRate: 0.054 },
  { fiscalYear: 2033, payrollRate: 0.05, assetRate: 0.05 },
];

/** Permanent SBIE rate from 2033 onwards */
export const PERMANENT_SBIE_RATE: SBIERate = {
  fiscalYear: 9999,
  payrollRate: 0.05,
  assetRate: 0.05,
};

/**
 * Look up the SBIE transitional rates for a given fiscal year.
 * Returns the permanent rate for years 2033+.
 */
export function getSBIERate(fiscalYear: number): SBIERate {
  if (fiscalYear < 2024) {
    // Pre-implementation — no SBIE transitional relief
    return { fiscalYear, payrollRate: 0.05, assetRate: 0.05 };
  }
  const found = SBIE_TRANSITIONAL_RATES.find(
    (r) => r.fiscalYear === fiscalYear
  );
  if (found) return found;
  // 2033+ → permanent rate
  return { ...PERMANENT_SBIE_RATE, fiscalYear };
}

// ============================================================
// STEP CONFIGURATION
// ============================================================

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'JURISDICTION_SETUP',
    label: 'Jurisdiction Setup',
    shortLabel: 'Setup',
    articleRef: 'Articles 5.1–5.2',
  },
  {
    key: 'GLOBE_INCOME',
    label: 'GloBE Income',
    shortLabel: 'Income',
    articleRef: 'Articles 3.1–3.2',
  },
  {
    key: 'COVERED_TAXES',
    label: 'Adjusted Covered Taxes',
    shortLabel: 'Taxes',
    articleRef: 'Articles 4.1–4.4',
  },
  {
    key: 'ETR_TOPUP',
    label: 'ETR & Top-Up Tax',
    shortLabel: 'ETR',
    articleRef: 'Articles 5.1–5.5',
  },
  {
    key: 'RESULTS',
    label: 'Results Summary',
    shortLabel: 'Results',
    articleRef: 'Articles 5.1–5.6',
  },
];

export const ETR_STEPS: EtrStep[] = STEP_CONFIGS.map((s) => s.key);

// ============================================================
// EDUCATIONAL NOTES
// ============================================================

export const STEP_EDUCATIONAL_NOTES: Record<EtrStep, string> = {
  JURISDICTION_SETUP:
    'The ETR computation is performed on a jurisdictional basis — all Constituent Entities in the same jurisdiction are aggregated (jurisdictional blending under Article 5.1). Add each jurisdiction where the MNE Group has operations. Flag any Minority-Owned CEs (MOCEs, <30% ownership) for separate computation under Article 5.6. For jurisdictions that may qualify for the de minimis exclusion (Article 5.5), provide 3-year revenue and income history.',
  GLOBE_INCOME:
    'GloBE Income starts with the Financial Accounting Net Income (FANI) per Article 3.1.2 — the net income/loss determined for the CE in the consolidated financial statements, excluding covered tax expense. Then apply Article 3.2 mandatory adjustments: exclude qualifying dividends and equity gains (Art. 3.2.1(b)), remove asymmetric foreign currency gains/losses (Art. 3.2.1(a)), add back policy-disallowed expenses like fines >€50K (Art. 3.2.1(c)), adjust prior-period corrections (Art. 3.2.1(h)), and align pension costs to cash basis (Art. 3.2.1(i)). The SBC election (Art. 3.2.3) is optional — use the scenario comparison to see its impact.',
  COVERED_TAXES:
    'Adjusted Covered Taxes represent the tax charge attributable to GloBE Income. Start with current tax expense in the P&L, then apply adjustments: subtract qualified refundable tax credits (Art. 4.1.2(a)), exclude outstanding uncertain tax positions until settled (Art. 4.6.3), and add net deferred tax movements (Art. 4.4.1). Critical: any deferred tax liability recorded at a rate exceeding 15% must be capped at 15% (Art. 4.4.4) — the excess is excluded. This prevents entities from artificially inflating their covered taxes using high-rate DTLs.',
  ETR_TOPUP:
    'The ETR is Adjusted Covered Taxes divided by GloBE Income. If the ETR is below 15%, the Top-Up Tax Percentage = 15% − ETR. The Substance-Based Income Exclusion (SBIE) under Article 5.3 carves out a return on substance: the carve-out equals (payroll rate × eligible payroll) + (asset rate × tangible asset NBV). The rates are transitional, declining from 9.6%/7.6% in FY 2025 to 5%/5% from FY 2033. Top-Up Tax = Top-Up Tax Percentage × (GloBE Income − SBIE). Jurisdictions qualifying for de minimis (Art. 5.5) are excluded entirely.',
  RESULTS:
    'The results show the jurisdictional ETR comparison, SBIE computation, and top-up tax liability for each jurisdiction. Low-taxed jurisdictions (ETR < 15%) generate top-up tax. The top-up tax is collected through the charging mechanism (QDMTT → IIR → UTPR) — use the Charging Mechanism Allocation Workbench (T-CMA) to trace how the top-up tax is allocated. De minimis jurisdictions and above-minimum jurisdictions have zero top-up tax liability.',
};

export const ADJUSTMENT_CATEGORY_INFO: Record<
  AdjustmentCategory,
  { label: string; articleRef: string; guidance: string }
> = {
  EXCLUDED_DIVIDENDS: {
    label: 'Excluded Dividends',
    articleRef: 'Art. 3.2.1(b)',
    guidance:
      'Qualifying dividends and equity gains from Constituent Entities within the same MNE Group. These are excluded from GloBE Income to avoid double-counting. Enter as a negative amount (reduces GloBE Income).',
  },
  EXCLUDED_EQUITY_GAINS: {
    label: 'Excluded Equity Gains/Losses',
    articleRef: 'Art. 3.2.1(b)',
    guidance:
      'Gains or losses on the sale of ownership interests in other Constituent Entities. Excluded to prevent capital gains from distorting the ETR. Enter gains as negative (reduces) and losses as positive (increases).',
  },
  ASYMMETRIC_FX: {
    label: 'Asymmetric Foreign Currency Gains/Losses',
    articleRef: 'Art. 3.2.1(a)',
    guidance:
      'Unrealised FX gains/losses on long-term intra-group assets/liabilities where the FX gain/loss is included in one entity but not its counterpart. Enter gains as negative (excluded from income) and losses as positive (added back).',
  },
  POLICY_DISALLOWED: {
    label: 'Policy-Disallowed Expenses',
    articleRef: 'Art. 3.2.1(c)',
    guidance:
      'Fines and penalties exceeding €50,000, and bribes/illegal payments. These expenses reduce FANI but are added back to GloBE Income because GloBE does not allow a deduction for non-compliant expenditure. Enter as a positive amount (increases GloBE Income).',
  },
  PRIOR_PERIOD: {
    label: 'Prior-Period Errors and Changes',
    articleRef: 'Art. 3.2.1(h)',
    guidance:
      'Corrections of errors relating to prior fiscal years, and changes in accounting principles. These are removed from the current year GloBE Income and allocated to the year to which they relate. Enter as positive (if the correction reduced current-year income) or negative (if it increased it).',
  },
  PENSION_TIMING: {
    label: 'Pension Fund Accrual Adjustments',
    articleRef: 'Art. 3.2.1(i)',
    guidance:
      'Where the pension expense under IAS 19 / FRS 102 differs from actual cash contributions paid. GloBE uses the lower of the accrual and the cash contribution. If the accounting accrual exceeds cash paid, add back the difference. Enter as a positive amount.',
  },
  SBC: {
    label: 'Stock-Based Compensation',
    articleRef: 'Art. 3.2.3',
    guidance:
      'ELECTIVE: A CE may elect to substitute the tax deduction for SBC in place of the IFRS 2 accounting expense. If elected, the adjustment equals the accounting expense less the tax deduction. Toggle the SBC election in scenario comparison to see its impact on ETR.',
  },
  SHIPPING_EXCLUSION: {
    label: 'International Shipping Income Exclusion',
    articleRef: 'Art. 3.3',
    guidance:
      'Qualifying income from international shipping activities operated by entities that meet the conditions under Article 3.3. Enter as a negative amount (excluded from GloBE Income).',
  },
  INSURANCE: {
    label: 'Insurance Fund Adjustments',
    articleRef: 'Art. 3.2.1(d)',
    guidance:
      'Adjustments for insurance companies relating to policyholder returns and segregated fund income. Enter the net adjustment amount.',
  },
  OTHER: {
    label: 'Other Article 3.2 Adjustments',
    articleRef: 'Art. 3.2',
    guidance:
      'Any other adjustments required under Article 3.2 not covered by the specific categories above. Include a description of the adjustment and the applicable Article reference.',
  },
};

export const COVERED_TAX_CATEGORY_INFO: Record<
  CoveredTaxCategory,
  { label: string; articleRef: string; guidance: string }
> = {
  CURRENT_TAX: {
    label: 'Current Tax Expense',
    articleRef: 'Art. 4.1.1',
    guidance:
      'The current tax expense recorded in the P&L for the fiscal year. Includes corporate income tax, solidarity surcharges, and trade taxes classified as "covered taxes" under Article 4.2. Enter as a positive amount.',
  },
  QUALIFIED_REFUNDABLE_CREDIT: {
    label: 'Qualified Refundable Tax Credit',
    articleRef: 'Art. 4.1.2(a)',
    guidance:
      'Tax credits that are refundable within 4 years regardless of tax liability. These reduce current tax expense for GloBE purposes because they are treated as government grants rather than tax credits. Enter as a negative amount (reduces covered taxes).',
  },
  NON_QUALIFIED_CREDIT: {
    label: 'Non-Qualified Tax Credit',
    articleRef: 'Art. 4.1.2(b)',
    guidance:
      'Tax credits that are not refundable within 4 years, or that reduce tax liability rather than being paid as a refund. These remain within covered taxes (no adjustment). Enter as already included in current tax — typically no separate entry needed.',
  },
  UTP_SETTLED: {
    label: 'Uncertain Tax Position — Settled',
    articleRef: 'Art. 4.6.3',
    guidance:
      'Amounts relating to uncertain tax positions that were settled (paid) during the fiscal year. Settled UTPs are included in covered taxes as current-year payments. Enter as a positive amount.',
  },
  UTP_OUTSTANDING: {
    label: 'Uncertain Tax Position — Outstanding',
    articleRef: 'Art. 4.6.3',
    guidance:
      'Provisions for uncertain tax positions that remain outstanding (not yet settled). These are excluded from covered taxes until the year they are settled. Enter as a negative amount (reduces covered taxes).',
  },
  CFC_ALLOCATION: {
    label: 'CFC Tax Allocation',
    articleRef: 'Art. 4.3.2(c)',
    guidance:
      'Corporate income tax charged to a parent entity under CFC rules that is attributable to the CFC income of a low-taxed CE. This tax is allocated from the parent to the CE for GloBE purposes. Enter as a positive amount (increases covered taxes of the low-taxed jurisdiction).',
  },
  DTL_MOVEMENT: {
    label: 'Deferred Tax Liability Movement',
    articleRef: 'Art. 4.4.1',
    guidance:
      'Net movement in deferred tax liabilities during the fiscal year. Increases in DTLs increase covered taxes (positive entry). Critical: any DTL recorded at a rate exceeding 15% must be capped at 15% under Article 4.4.4 — use the DTL Cap Adjustment category for the excess.',
  },
  DTA_MOVEMENT: {
    label: 'Deferred Tax Asset Movement',
    articleRef: 'Art. 4.4.1',
    guidance:
      'Net movement in deferred tax assets during the fiscal year. Increases in DTAs reduce covered taxes (negative entry) — they represent future tax benefits rather than current tax charges.',
  },
  DTL_CAP_ADJUSTMENT: {
    label: 'DTL Cap Adjustment (15% Cap)',
    articleRef: 'Art. 4.4.4',
    guidance:
      'Where a deferred tax liability has been recorded at a rate exceeding 15%, only the portion at 15% is included in covered taxes. Enter the excess amount (the difference between the full-rate DTL and the 15%-capped amount) as a negative value. This prevents entities from inflating covered taxes by using high statutory rates for DTL calculations.',
  },
  OTHER_TAX: {
    label: 'Other Tax Adjustments',
    articleRef: 'Art. 4.1–4.6',
    guidance:
      'Any other adjustments to covered taxes not covered by the specific categories above. Include a description and applicable Article reference.',
  },
};

// ============================================================
// JURISDICTION OPTIONS
// ============================================================

export const JURISDICTIONS: SelectOption[] = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Hong Kong', label: 'Hong Kong' },
  { value: 'United States', label: 'United States' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Cayman Islands', label: 'Cayman Islands' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
];

export const FISCAL_YEAR_OPTIONS: SelectOption[] = [
  { value: '2024', label: 'FY 2024' },
  { value: '2025', label: 'FY 2025' },
  { value: '2026', label: 'FY 2026' },
  { value: '2027', label: 'FY 2027' },
  { value: '2028', label: 'FY 2028' },
  { value: '2029', label: 'FY 2029' },
  { value: '2030', label: 'FY 2030' },
  { value: '2031', label: 'FY 2031' },
  { value: '2032', label: 'FY 2032' },
  { value: '2033', label: 'FY 2033+' },
];

export const ADJUSTMENT_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'EXCLUDED_DIVIDENDS', label: 'Excluded Dividends (Art. 3.2.1(b))' },
  {
    value: 'EXCLUDED_EQUITY_GAINS',
    label: 'Excluded Equity Gains/Losses (Art. 3.2.1(b))',
  },
  { value: 'ASYMMETRIC_FX', label: 'Asymmetric FX Gains/Losses (Art. 3.2.1(a))' },
  {
    value: 'POLICY_DISALLOWED',
    label: 'Policy-Disallowed Expenses (Art. 3.2.1(c))',
  },
  { value: 'PRIOR_PERIOD', label: 'Prior-Period Errors/Changes (Art. 3.2.1(h))' },
  { value: 'PENSION_TIMING', label: 'Pension Accrual Adjustments (Art. 3.2.1(i))' },
  { value: 'SBC', label: 'Stock-Based Compensation (Art. 3.2.3) — Elective' },
  { value: 'SHIPPING_EXCLUSION', label: 'Shipping Exclusion (Art. 3.3)' },
  { value: 'INSURANCE', label: 'Insurance Adjustments (Art. 3.2.1(d))' },
  { value: 'OTHER', label: 'Other Art. 3.2 Adjustments' },
];

export const COVERED_TAX_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'CURRENT_TAX', label: 'Current Tax Expense (Art. 4.1.1)' },
  {
    value: 'QUALIFIED_REFUNDABLE_CREDIT',
    label: 'Qualified Refundable Credit (Art. 4.1.2(a))',
  },
  {
    value: 'NON_QUALIFIED_CREDIT',
    label: 'Non-Qualified Credit (Art. 4.1.2(b))',
  },
  { value: 'UTP_SETTLED', label: 'UTP — Settled (Art. 4.6.3)' },
  { value: 'UTP_OUTSTANDING', label: 'UTP — Outstanding (Art. 4.6.3)' },
  { value: 'CFC_ALLOCATION', label: 'CFC Tax Allocation (Art. 4.3.2(c))' },
  { value: 'DTL_MOVEMENT', label: 'DTL Movement (Art. 4.4.1)' },
  { value: 'DTA_MOVEMENT', label: 'DTA Movement (Art. 4.4.1)' },
  { value: 'DTL_CAP_ADJUSTMENT', label: 'DTL Cap Adjustment — 15% (Art. 4.4.4)' },
  { value: 'OTHER_TAX', label: 'Other Tax Adjustments' },
];

// ============================================================
// INITIAL STATE FACTORIES
// ============================================================

export function generateId(prefix: string = 'ID'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export function createEmptyAdjustment(): IncomeAdjustment {
  return {
    id: generateId('ADJ'),
    category: 'OTHER',
    description: '',
    amount: 0,
    articleRef: 'Art. 3.2',
    isElective: false,
  };
}

export function createEmptyTaxEntry(): CoveredTaxEntry {
  return {
    id: generateId('TAX'),
    category: 'CURRENT_TAX',
    description: '',
    amount: 0,
    articleRef: 'Art. 4.1.1',
    isDTLCapApplicable: false,
  };
}

export function createEmptyJurisdiction(
  fiscalYear: number = 2025
): JurisdictionEntry {
  return {
    id: generateId('JUR'),
    jurisdiction: '',
    label: '',
    fiscalYear,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: false,
    accountingNetIncome: 0,
    coveredTaxAddBack: 0,
    incomeAdjustments: [],
    coveredTaxEntries: [],
    eligiblePayroll: 0,
    tangibleAssetNBV: 0,
    deMinimisData: null,
    notes: '',
  };
}

// ============================================================
// PURE FUNCTIONS — GloBE Income Computation
// ============================================================

/**
 * Compute GloBE Income for a single jurisdiction.
 *
 * GloBE Income = FANI + Σ(Article 3.2 adjustments)
 * where FANI = Accounting Net Income + Covered Tax Add-Back (Art. 3.1.2)
 */
export function computeGloBEIncome(
  jurisdiction: JurisdictionEntry
): GloBEIncomeResult {
  const fani =
    jurisdiction.accountingNetIncome + jurisdiction.coveredTaxAddBack;

  const adjustmentBreakdown = jurisdiction.incomeAdjustments.map((adj) => ({
    category: adj.category,
    description: adj.description,
    amount: adj.amount,
    articleRef: adj.articleRef,
  }));

  const totalAdjustments = jurisdiction.incomeAdjustments.reduce(
    (sum, adj) => sum + adj.amount,
    0
  );

  const globeIncome = fani + totalAdjustments;

  return {
    accountingNetIncome: jurisdiction.accountingNetIncome,
    coveredTaxAddBack: jurisdiction.coveredTaxAddBack,
    fani,
    totalAdjustments,
    globeIncome,
    adjustmentBreakdown,
  };
}

// ============================================================
// PURE FUNCTIONS — Covered Tax Computation
// ============================================================

/**
 * Compute Adjusted Covered Taxes for a single jurisdiction.
 *
 * Groups entries into current tax, current adjustments, and deferred
 * tax components. Applies 15% DTL cap where flagged.
 */
export function computeCoveredTaxes(
  jurisdiction: JurisdictionEntry
): CoveredTaxResult {
  const entries = jurisdiction.coveredTaxEntries;

  const currentTaxCategories: CoveredTaxCategory[] = [
    'CURRENT_TAX',
    'UTP_SETTLED',
  ];
  const adjustmentCategories: CoveredTaxCategory[] = [
    'QUALIFIED_REFUNDABLE_CREDIT',
    'NON_QUALIFIED_CREDIT',
    'UTP_OUTSTANDING',
    'CFC_ALLOCATION',
    'OTHER_TAX',
  ];
  const deferredCategories: CoveredTaxCategory[] = [
    'DTL_MOVEMENT',
    'DTA_MOVEMENT',
    'DTL_CAP_ADJUSTMENT',
  ];

  const currentTaxTotal = entries
    .filter((e) => currentTaxCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const currentAdjustments = entries
    .filter((e) => adjustmentCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const deferredTaxTotal = entries
    .filter((e) => deferredCategories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const dtlCapAdjustment = entries
    .filter((e) => e.category === 'DTL_CAP_ADJUSTMENT')
    .reduce((sum, e) => sum + e.amount, 0);

  const adjustedCoveredTaxes = roundTo2(
    currentTaxTotal + currentAdjustments + deferredTaxTotal
  );

  const entryBreakdown = entries.map((e) => ({
    category: e.category,
    description: e.description,
    amount: e.amount,
    articleRef: e.articleRef,
  }));

  return {
    currentTaxTotal,
    currentAdjustments,
    deferredTaxTotal,
    dtlCapAdjustment,
    adjustedCoveredTaxes,
    entryBreakdown,
  };
}

// ============================================================
// PURE FUNCTIONS — De Minimis Test
// ============================================================

/**
 * Evaluate the de minimis exclusion test under Article 5.5.
 *
 * The jurisdiction is excluded from top-up tax if the average
 * of current year and two preceding years satisfies BOTH:
 * - Average revenue < €10,000,000
 * - Average income < €1,000,000
 */
export function evaluateDeMinimis(
  data: DeMinimisData | null
): DeMinimisResult | null {
  if (!data) return null;

  const avgRevenue = roundTo2(
    (data.year1Revenue + data.year2Revenue + data.year3Revenue) / 3
  );
  const avgIncome = roundTo2(
    (data.year1Income + data.year2Income + data.year3Income) / 3
  );

  const revenueTestPassed = avgRevenue < DE_MINIMIS_REVENUE_THRESHOLD;
  const incomeTestPassed = avgIncome < DE_MINIMIS_INCOME_THRESHOLD;

  return {
    avgRevenue,
    avgIncome,
    revenueTestPassed,
    incomeTestPassed,
    qualifies: revenueTestPassed && incomeTestPassed,
  };
}

// ============================================================
// PURE FUNCTIONS — SBIE Computation
// ============================================================

/**
 * Compute the Substance-Based Income Exclusion (SBIE)
 * for a single jurisdiction using the transitional rates
 * appropriate to the fiscal year.
 *
 * SBIE = (payroll rate × eligible payroll) + (asset rate × tangible asset NBV)
 */
export function computeSBIE(
  eligiblePayroll: number,
  tangibleAssetNBV: number,
  fiscalYear: number
): SBIEResult {
  const rates = getSBIERate(fiscalYear);

  const payrollCarveOut = roundTo2(rates.payrollRate * eligiblePayroll);
  const assetCarveOut = roundTo2(rates.assetRate * tangibleAssetNBV);
  const totalSBIE = roundTo2(payrollCarveOut + assetCarveOut);

  return {
    payrollRate: rates.payrollRate,
    assetRate: rates.assetRate,
    payrollCarveOut,
    assetCarveOut,
    totalSBIE,
  };
}

// ============================================================
// PURE FUNCTIONS — Top-Up Tax Computation
// ============================================================

/**
 * Compute the top-up tax for a single jurisdiction.
 *
 * ETR = Adjusted Covered Taxes / GloBE Income
 * Top-Up Tax % = max(0, 15% − ETR)
 * Excess Profit = max(0, GloBE Income − SBIE)
 * Top-Up Tax = Top-Up Tax % × Excess Profit
 */
export function computeTopUpTax(
  jurisdiction: JurisdictionEntry,
  incomeResult: GloBEIncomeResult,
  taxResult: CoveredTaxResult
): TopUpTaxResult {
  const globeIncome = incomeResult.globeIncome;
  const adjustedCoveredTaxes = taxResult.adjustedCoveredTaxes;

  // De minimis check
  const deMinimisResult = evaluateDeMinimis(jurisdiction.deMinimisData);
  const isDeMinimisExcluded = deMinimisResult?.qualifies ?? false;

  // ETR
  const etr =
    globeIncome > 0
      ? adjustedCoveredTaxes / globeIncome
      : adjustedCoveredTaxes >= 0
        ? 1
        : 0;
  const etrDisplay = roundTo2(etr * 100);

  // Top-Up Tax %
  const topUpTaxPercentage = Math.max(0, MINIMUM_ETR - etr);

  // SBIE
  const sbie = computeSBIE(
    jurisdiction.eligiblePayroll,
    jurisdiction.tangibleAssetNBV,
    jurisdiction.fiscalYear
  );

  // Excess Profit
  const excessProfit = Math.max(0, roundTo2(globeIncome - sbie.totalSBIE));

  // Top-Up Tax
  const isLowTaxed = etr < MINIMUM_ETR;
  const topUpTaxAmount =
    isDeMinimisExcluded || !isLowTaxed
      ? 0
      : roundTo2(topUpTaxPercentage * excessProfit);

  return {
    etr,
    etrDisplay,
    topUpTaxPercentage,
    sbie,
    excessProfit,
    topUpTaxAmount,
    isLowTaxed,
    isDeMinimisExcluded,
    deMinimisResult,
  };
}

// ============================================================
// PURE FUNCTIONS — Full Jurisdiction Computation
// ============================================================

/**
 * Compute the complete ETR and top-up tax result for a single jurisdiction.
 */
export function computeJurisdictionResult(
  jurisdiction: JurisdictionEntry
): JurisdictionResult {
  const income = computeGloBEIncome(jurisdiction);
  const tax = computeCoveredTaxes(jurisdiction);
  const topUpTax = computeTopUpTax(jurisdiction, income, tax);

  return {
    jurisdictionId: jurisdiction.id,
    jurisdiction: jurisdiction.jurisdiction,
    label: jurisdiction.label,
    isMOCE: jurisdiction.isMOCE,
    moceOwnershipPercent: jurisdiction.moceOwnershipPercent,
    income,
    tax,
    topUpTax,
  };
}

/**
 * Compute results for all jurisdictions and produce summary.
 */
export function computeAllJurisdictions(
  jurisdictions: JurisdictionEntry[]
): ComputationResult {
  const jurisdictionResults = jurisdictions.map(computeJurisdictionResult);

  const summaryRows: JurisdictionSummaryRow[] = jurisdictionResults.map(
    (r) => {
      let status: JurisdictionSummaryRow['status'] = 'ABOVE_MINIMUM';
      if (r.isMOCE) status = 'MOCE';
      else if (r.topUpTax.isDeMinimisExcluded) status = 'DE_MINIMIS';
      else if (r.topUpTax.isLowTaxed) status = 'BELOW_MINIMUM';

      return {
        jurisdiction: r.jurisdiction,
        label: r.label,
        globeIncome: r.income.globeIncome,
        adjustedCoveredTaxes: r.tax.adjustedCoveredTaxes,
        etr: r.topUpTax.etrDisplay,
        sbie: r.topUpTax.sbie.totalSBIE,
        excessProfit: r.topUpTax.excessProfit,
        topUpTaxPercent: roundTo2(r.topUpTax.topUpTaxPercentage * 100),
        topUpTaxAmount: r.topUpTax.topUpTaxAmount,
        status,
        isMOCE: r.isMOCE,
      };
    }
  );

  return {
    jurisdictionResults,
    summaryRows,
    totalGloBEIncome: roundTo2(
      summaryRows.reduce((s, r) => s + r.globeIncome, 0)
    ),
    totalCoveredTaxes: roundTo2(
      summaryRows.reduce((s, r) => s + r.adjustedCoveredTaxes, 0)
    ),
    totalTopUpTax: roundTo2(
      summaryRows.reduce((s, r) => s + r.topUpTaxAmount, 0)
    ),
    totalSBIE: roundTo2(summaryRows.reduce((s, r) => s + r.sbie, 0)),
    lowTaxedCount: summaryRows.filter(
      (r) => r.status === 'BELOW_MINIMUM' || r.status === 'MOCE'
    ).length,
    aboveMinimumCount: summaryRows.filter(
      (r) => r.status === 'ABOVE_MINIMUM'
    ).length,
    deMinimisCount: summaryRows.filter((r) => r.status === 'DE_MINIMIS')
      .length,
    moceCount: summaryRows.filter((r) => r.status === 'MOCE').length,
  };
}

// ============================================================
// VALIDATION
// ============================================================

export function validateJurisdictionSetup(
  jurisdictions: JurisdictionEntry[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (jurisdictions.length === 0) {
    errors.push({
      field: 'jurisdictions',
      message: 'At least one jurisdiction must be added',
    });
    return errors;
  }

  jurisdictions.forEach((j) => {
    if (!j.jurisdiction) {
      errors.push({
        field: `jur_${j.id}`,
        message: `${j.label || 'Jurisdiction'}: Please select a jurisdiction`,
      });
    }
    if (!j.label.trim()) {
      errors.push({
        field: `label_${j.id}`,
        message: `${j.jurisdiction || 'Jurisdiction'}: Display label is required`,
      });
    }
    if (j.isMOCE && (j.moceOwnershipPercent <= 0 || j.moceOwnershipPercent >= 100)) {
      errors.push({
        field: `moce_${j.id}`,
        message: `${j.label}: MOCE ownership must be between 0% and 100%`,
      });
    }
    if (j.eligiblePayroll < 0) {
      errors.push({
        field: `payroll_${j.id}`,
        message: `${j.label}: Eligible payroll cannot be negative`,
      });
    }
    if (j.tangibleAssetNBV < 0) {
      errors.push({
        field: `assets_${j.id}`,
        message: `${j.label}: Tangible asset NBV cannot be negative`,
      });
    }
  });

  return errors;
}

export function validateGloBEIncome(
  jurisdictions: JurisdictionEntry[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  jurisdictions.forEach((j) => {
    const globeIncome =
      j.accountingNetIncome +
      j.coveredTaxAddBack +
      j.incomeAdjustments.reduce((s, a) => s + a.amount, 0);

    if (globeIncome <= 0 && !j.hasDeMinimisData) {
      errors.push({
        field: `income_${j.id}`,
        message: `${j.label}: GloBE Income is ${formatEUR(globeIncome)} — a loss or zero income jurisdiction has no top-up tax liability (this may be intentional)`,
      });
    }
  });

  return errors;
}

export function validateCoveredTaxes(
  jurisdictions: JurisdictionEntry[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  jurisdictions.forEach((j) => {
    if (j.coveredTaxEntries.length === 0) {
      errors.push({
        field: `tax_${j.id}`,
        message: `${j.label}: No covered tax entries — add at least current tax expense`,
      });
    }
  });

  return errors;
}

// ============================================================
// FORMATTING HELPERS
// ============================================================

export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEUR(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-GB');
  return `€${formatted}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentDirect(
  value: number,
  decimals: number = 2
): string {
  return `${value.toFixed(decimals)}%`;
}

export function getOptionLabel(
  options: SelectOption[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Return a colour class name for ETR status display.
 */
export function getETRStatusColour(etr: number): string {
  if (etr >= 15) return 'text-green-700';
  if (etr >= 10) return 'text-amber-600';
  return 'text-red-600';
}

/**
 * Return a human-readable status label.
 */
export function getStatusLabel(
  status: JurisdictionSummaryRow['status']
): string {
  switch (status) {
    case 'ABOVE_MINIMUM':
      return 'Above 15% — No Top-Up Tax';
    case 'BELOW_MINIMUM':
      return 'Below 15% — Top-Up Tax Applies';
    case 'DE_MINIMIS':
      return 'De Minimis Exclusion (Art. 5.5)';
    case 'MOCE':
      return 'MOCE — Separate Computation (Art. 5.6)';
    default:
      return status;
  }
}

// ============================================================
// H&C TEST SCENARIO — Stratos Group (S5: Full Computation)
// ============================================================

/**
 * Pre-loaded test data for the Stratos Group FY 2025 ETR computation.
 *
 * Sources:
 * - fact-register.md § G (ETR & Top-Up Tax data)
 * - fact-register.md § F (Covered Taxes data)
 * - fact-register.md § E (Germany financial data)
 * - client-profile.md § 6 (Jurisdictional Tax Profile)
 *
 * Expected results:
 * - UK: ETR 25.00% → above minimum
 * - Germany: ETR 23.00% → above minimum
 * - Singapore: ETR 9.81% → top-up tax €198,268
 * - Ireland (Main): ETR 11.80% → top-up tax €425,011
 * - Luxembourg: de minimis exclusion → €0
 * - Atlas Ireland (MOCE 28%): ETR 12.00% → top-up tax €66,720
 * - TOTAL: €689,999
 */
export const CASE_STUDY_JURISDICTIONS: JurisdictionEntry[] = [
  // --- United Kingdom ---
  {
    id: 'cs-uk',
    jurisdiction: 'United Kingdom',
    label: 'United Kingdom',
    fiscalYear: 2025,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: false,
    accountingNetIncome: 6_375_000,
    coveredTaxAddBack: 2_125_000,
    incomeAdjustments: [],
    coveredTaxEntries: [
      {
        id: 'cs-uk-tax1',
        category: 'CURRENT_TAX',
        description: 'UK Corporation Tax at 25%',
        amount: 2_125_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 4_200_000,
    tangibleAssetNBV: 2_800_000,
    deMinimisData: null,
    notes:
      'Stratos Holdings plc (UPE) + SG Holdings Ltd. ETR 25.00% — above minimum.',
  },
  // --- Germany ---
  {
    id: 'cs-de',
    jurisdiction: 'Germany',
    label: 'Germany',
    fiscalYear: 2025,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: false,
    accountingNetIncome: 44_907_000,
    coveredTaxAddBack: 12_393_000,
    incomeAdjustments: [
      {
        id: 'cs-de-adj1',
        category: 'EXCLUDED_DIVIDENDS',
        description:
          'Intra-group dividend from SG Germany Sales GmbH (F-105)',
        amount: -3_100_000,
        articleRef: 'Art. 3.2.1(b)',
        isElective: false,
      },
      {
        id: 'cs-de-adj2',
        category: 'ASYMMETRIC_FX',
        description:
          'Unrealised FX gain on USD intercompany loan (F-108)',
        amount: -900_000,
        articleRef: 'Art. 3.2.1(a)',
        isElective: false,
      },
      {
        id: 'cs-de-adj3',
        category: 'POLICY_DISALLOWED',
        description: 'Environmental fine — €300K >€50K threshold (F-109)',
        amount: 300_000,
        articleRef: 'Art. 3.2.1(c)',
        isElective: false,
      },
      {
        id: 'cs-de-adj4',
        category: 'PRIOR_PERIOD',
        description:
          'Prior-year revenue correction removed from current year (F-110)',
        amount: 500_000,
        articleRef: 'Art. 3.2.1(h)',
        isElective: false,
      },
      {
        id: 'cs-de-adj5',
        category: 'PENSION_TIMING',
        description:
          'IAS 19 expense €1.8M vs cash contributions €1.5M (F-111, F-112)',
        amount: 300_000,
        articleRef: 'Art. 3.2.1(i)',
        isElective: false,
      },
      {
        id: 'cs-de-adj6',
        category: 'OTHER',
        description:
          'Other Article 3.2 adjustments (intercompany, consolidation)',
        amount: -520_000,
        articleRef: 'Art. 3.2',
        isElective: false,
      },
      {
        id: 'cs-de-adj7',
        category: 'SBC',
        description:
          'SBC election NOT made (F-114) — no adjustment. Toggle to compare.',
        amount: 0,
        articleRef: 'Art. 3.2.3',
        isElective: true,
      },
    ],
    coveredTaxEntries: [
      {
        id: 'cs-de-tax1',
        category: 'CURRENT_TAX',
        description: 'Körperschaftsteuer (CIT) — F-130',
        amount: 8_200_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax2',
        category: 'CURRENT_TAX',
        description: 'Solidarity surcharge (5.5% of CIT) — F-131',
        amount: 451_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax3',
        category: 'CURRENT_TAX',
        description: 'Gewerbesteuer (trade tax) — F-132',
        amount: 3_100_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax4',
        category: 'QUALIFIED_REFUNDABLE_CREDIT',
        description:
          'Forschungszulage (R&D credit) — refundable within 4 years — F-133',
        amount: -180_000,
        articleRef: 'Art. 4.1.2(a)',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax5',
        category: 'UTP_SETTLED',
        description: 'Transfer pricing UTP — settled in FY 2025 — F-138',
        amount: 150_000,
        articleRef: 'Art. 4.6.3',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax6',
        category: 'UTP_OUTSTANDING',
        description:
          'Transfer pricing UTP — outstanding provision — F-137',
        amount: -280_000,
        articleRef: 'Art. 4.6.3',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax7',
        category: 'DTL_MOVEMENT',
        description: 'DTL on intangibles +€900K (F-134)',
        amount: 900_000,
        articleRef: 'Art. 4.4.1',
        isDTLCapApplicable: true,
      },
      {
        id: 'cs-de-tax8',
        category: 'DTL_MOVEMENT',
        description: 'DTL on PP&E +€400K (F-135)',
        amount: 400_000,
        articleRef: 'Art. 4.4.1',
        isDTLCapApplicable: true,
      },
      {
        id: 'cs-de-tax9',
        category: 'DTA_MOVEMENT',
        description: 'DTA on provisions −€250K (F-136)',
        amount: -250_000,
        articleRef: 'Art. 4.4.1',
        isDTLCapApplicable: false,
      },
      {
        id: 'cs-de-tax10',
        category: 'DTL_CAP_ADJUSTMENT',
        description: '15% DTL cap — no excess (German rate ~30% but DTL amount already at effective rate)',
        amount: -98_000,
        articleRef: 'Art. 4.4.4',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 12_500_000,
    tangibleAssetNBV: 18_000_000,
    deMinimisData: null,
    notes:
      'SG Germany GmbH + SG Germany Sales GmbH. ETR 23.00% — above minimum. Detailed adjustment data from S3/S4 case studies.',
  },
  // --- Singapore ---
  {
    id: 'cs-sg',
    jurisdiction: 'Singapore',
    label: 'Singapore',
    fiscalYear: 2025,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: false,
    accountingNetIncome: 3_607_794,
    coveredTaxAddBack: 392_206,
    incomeAdjustments: [],
    coveredTaxEntries: [
      {
        id: 'cs-sg-tax1',
        category: 'CURRENT_TAX',
        description:
          'Singapore income tax (17% statutory, reduced by incentives)',
        amount: 392_206,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 1_200_000,
    tangibleAssetNBV: 850_000,
    deMinimisData: null,
    notes:
      'SG Singapore Pte Ltd + SG Singapore Tech Pte Ltd. ETR 9.81% — below minimum. Tax incentives create low ETR.',
  },
  // --- Ireland (Main Group) ---
  {
    id: 'cs-ie',
    jurisdiction: 'Ireland',
    label: 'Ireland (Main Group)',
    fiscalYear: 2025,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: false,
    accountingNetIncome: 13_230_000,
    coveredTaxAddBack: 1_770_000,
    incomeAdjustments: [],
    coveredTaxEntries: [
      {
        id: 'cs-ie-tax1',
        category: 'CURRENT_TAX',
        description:
          'Irish corporation tax (12.5% standard / 15% for in-scope MNEs)',
        amount: 1_770_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 8_400_000,
    tangibleAssetNBV: 12_000_000,
    deMinimisData: null,
    notes:
      'SG Ireland Ltd + SG Ireland IP Ltd. ETR 11.80% — below minimum. QDMTT applies from 1 Jan 2024.',
  },
  // --- Luxembourg ---
  {
    id: 'cs-lu',
    jurisdiction: 'Luxembourg',
    label: 'Luxembourg',
    fiscalYear: 2025,
    isMOCE: false,
    moceOwnershipPercent: 0,
    hasDeMinimisData: true,
    accountingNetIncome: 575_000,
    coveredTaxAddBack: 55_000,
    incomeAdjustments: [],
    coveredTaxEntries: [
      {
        id: 'cs-lu-tax1',
        category: 'CURRENT_TAX',
        description: 'Luxembourg CIT + municipal business tax',
        amount: 55_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 320_000,
    tangibleAssetNBV: 180_000,
    deMinimisData: {
      year1Revenue: 7_900_000, // FY 2023 (F-175)
      year1Income: 580_000, // FY 2023 (F-176)
      year2Revenue: 8_400_000, // FY 2024 (F-177)
      year2Income: 650_000, // FY 2024 (F-178)
      year3Revenue: 9_200_000, // FY 2025 (F-179)
      year3Income: 630_000, // FY 2025 (F-180)
    },
    notes:
      'SG Luxembourg S.à r.l. Treasury services. De minimis: 3-yr avg revenue €8.5M < €10M, avg income €620K < €1M. Excluded under Art. 5.5.',
  },
  // --- Atlas Ireland (MOCE 28%) ---
  {
    id: 'cs-ie-moce',
    jurisdiction: 'Ireland',
    label: 'Ireland (Atlas Ireland — MOCE 28%)',
    fiscalYear: 2025,
    isMOCE: true,
    moceOwnershipPercent: 28,
    hasDeMinimisData: false,
    accountingNetIncome: 2_112_000,
    coveredTaxAddBack: 288_000,
    incomeAdjustments: [],
    coveredTaxEntries: [
      {
        id: 'cs-moce-tax1',
        category: 'CURRENT_TAX',
        description: 'Irish corporation tax at 12%',
        amount: 288_000,
        articleRef: 'Art. 4.1.1',
        isDTLCapApplicable: false,
      },
    ],
    eligiblePayroll: 1_200_000,
    tangibleAssetNBV: 800_000,
    deMinimisData: null,
    notes:
      'Atlas Ireland Ltd — 28% ownership (MOCE under Art. 5.6). ETR 12.00% — below minimum. Only allocable share (28%) subject to IIR/UTPR.',
  },
];

/**
 * Pre-loaded Germany-only scenario for S3 (GloBE Income module).
 * Students can load this to practice the income computation with
 * detailed Article 3.2 adjustments.
 */
export const CASE_STUDY_GERMANY_ONLY: JurisdictionEntry[] = [
  CASE_STUDY_JURISDICTIONS[1], // Germany entry with full adjustment detail
];

/**
 * Verify the H&C test scenario produces expected results.
 * This function is used for development validation only.
 */
export function verifyCaseStudyResults(): {
  passed: boolean;
  details: string[];
} {
  const result = computeAllJurisdictions(CASE_STUDY_JURISDICTIONS);
  const details: string[] = [];
  let passed = true;

  // Check expected ETRs and top-up tax amounts
  const expectations = [
    { label: 'United Kingdom', etr: 25.0, topUp: 0 },
    { label: 'Germany', etr: 23.0, topUp: 0 },
    { label: 'Singapore', etr: 9.81, topUp: 198_268 },
    { label: 'Ireland (Main Group)', etr: 11.8, topUp: 425_011 },
    { label: 'Luxembourg', etr: 8.73, topUp: 0 }, // de minimis
    { label: 'Ireland (Atlas Ireland — MOCE 28%)', etr: 12.0, topUp: 66_720 },
  ];

  for (const exp of expectations) {
    const row = result.summaryRows.find((r) => r.label === exp.label);
    if (!row) {
      details.push(`FAIL: ${exp.label} — not found in results`);
      passed = false;
      continue;
    }
    if (Math.abs(row.etr - exp.etr) > 0.02) {
      details.push(
        `FAIL: ${exp.label} — ETR expected ${exp.etr}%, got ${row.etr}%`
      );
      passed = false;
    }
    if (Math.abs(row.topUpTaxAmount - exp.topUp) > 2) {
      details.push(
        `FAIL: ${exp.label} — Top-Up Tax expected €${exp.topUp}, got €${row.topUpTaxAmount}`
      );
      passed = false;
    }
    details.push(
      `OK: ${exp.label} — ETR ${row.etr}%, Top-Up €${Math.round(row.topUpTaxAmount)}`
    );
  }

  // Check total
  const expectedTotal = 689_999;
  if (Math.abs(result.totalTopUpTax - expectedTotal) > 5) {
    details.push(
      `FAIL: Total — expected €${expectedTotal}, got €${Math.round(result.totalTopUpTax)}`
    );
    passed = false;
  } else {
    details.push(
      `OK: Total Top-Up Tax — €${Math.round(result.totalTopUpTax)}`
    );
  }

  return { passed, details };
}
