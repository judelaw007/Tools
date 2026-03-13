// T-SHQ: Transitional CbCR Safe Harbour Assessment — Utilities

import type {
  SafeHarbourFiscalYear,
  TransitionRate,
  Currency,
  JurisdictionCbCRData,
  DeMinimisResult,
  SimplifiedETRResult,
  RoutineProfitsResult,
  JurisdictionAssessment,
  AssessmentResult,
  SafeHarbourStep,
  StepConfig,
  SelectOption,
  ValidationError,
} from './types';

// ============================================================
// CONSTANTS — Thresholds (Article 9.1)
// ============================================================

/** De minimis revenue threshold: €10,000,000 (Article 9.1.2) */
export const DE_MINIMIS_REVENUE_THRESHOLD = 10_000_000;

/** De minimis profit threshold: €1,000,000 (Article 9.1.2) */
export const DE_MINIMIS_PROFIT_THRESHOLD = 1_000_000;

/** Minimum ETR under GloBE Rules: 15% (Article 5.2.2) */
export const MINIMUM_ETR = 15;

// ============================================================
// TRANSITION RATE SCHEDULE
// ============================================================

/**
 * Transition rates per fiscal year.
 *
 * Simplified ETR transition rates:
 *   2024: 15%, 2025: 16%, 2026: 17%, 2027: 17%
 *
 * SBIE transitional carve-out rates (payroll / tangible assets):
 *   2024: 9.8% / 7.8%
 *   2025: 9.6% / 7.6%
 *   2026: 9.4% / 7.4%
 *   2027: 9.2% / 7.2%
 *
 * Source: GloBE Model Rules Article 9.1; 5th AG extension to FY 2027.
 */
export const TRANSITION_RATES: TransitionRate[] = [
  { year: 2024, etrRate: 15, sbiePayrollRate: 9.8, sbieAssetRate: 7.8 },
  { year: 2025, etrRate: 16, sbiePayrollRate: 9.6, sbieAssetRate: 7.6 },
  { year: 2026, etrRate: 17, sbiePayrollRate: 9.4, sbieAssetRate: 7.4 },
  { year: 2027, etrRate: 17, sbiePayrollRate: 9.2, sbieAssetRate: 7.2 },
];

/**
 * Look up the transition rates for a fiscal year.
 * Returns the 2024 rates as fallback if year not found.
 */
export function getTransitionRates(year: SafeHarbourFiscalYear): TransitionRate {
  return TRANSITION_RATES.find((r) => r.year === year) ?? TRANSITION_RATES[0];
}

// ============================================================
// STEP CONFIGURATION
// ============================================================

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'GROUP_INFO',
    label: 'Group Information',
    shortLabel: 'Group',
    articleRef: 'Article 9.1',
  },
  {
    key: 'CBCR_DATA',
    label: 'CbCR Data Entry',
    shortLabel: 'CbCR Data',
    articleRef: 'CbCR Table 2',
  },
  {
    key: 'ASSESSMENT',
    label: 'Assessment Results',
    shortLabel: 'Assessment',
    articleRef: 'Articles 9.1.2–9.1.4',
  },
  {
    key: 'SUMMARY',
    label: 'Summary Dashboard',
    shortLabel: 'Summary',
    articleRef: 'Article 9.1',
  },
];

export const SAFE_HARBOUR_STEPS: SafeHarbourStep[] = STEP_CONFIGS.map(
  (s) => s.key
);

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

export const FISCAL_YEARS: SafeHarbourFiscalYear[] = [2024, 2025, 2026, 2027];

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

// ============================================================
// EDUCATIONAL NOTES
// ============================================================

export const STEP_EDUCATIONAL_NOTES: Record<SafeHarbourStep, string> = {
  GROUP_INFO:
    'The Transitional CbCR Safe Harbour allows MNE Groups to use existing Country-by-Country Report (CbCR) data to screen jurisdictions, avoiding the need for a full GloBE computation. The safe harbour is available for fiscal years beginning on or before 31 December 2027. If any one of three tests is satisfied for a jurisdiction, no top-up tax is due — the jurisdiction is treated as having a zero top-up tax amount for that year.',
  CBCR_DATA:
    'Enter the CbCR data for each jurisdiction where the MNE Group has Constituent Entities. The data comes from the group\'s Country-by-Country Report (OECD BEPS Action 13), which most in-scope MNE Groups already file. Revenue and Profit Before Tax are from CbCR Table 2. Employee Compensation includes all employment costs (salaries, social insurance, pension contributions, benefits). The advantage of using CbCR data is that it avoids the complex GloBE adjustments under Articles 3.2–4.6.',
  ASSESSMENT:
    'Each jurisdiction is tested against three independent safe harbour tests. A jurisdiction needs to pass only one test to qualify. Test 1 (De Minimis) catches small operations where compliance costs would be disproportionate. Test 2 (Simplified ETR) catches jurisdictions where the effective tax rate is clearly above the minimum. Test 3 (Routine Profits) catches jurisdictions where all profit is attributable to substance (payroll and tangible assets) rather than excess returns from intangible assets.',
  SUMMARY:
    'The summary shows which jurisdictions qualify for the safe harbour and which require full GloBE computation using the ETR Calculator (T-ETR). In practice, the safe harbour significantly reduces compliance effort — most jurisdictions in a typical MNE Group will qualify, leaving only a small number that need the detailed computation. Jurisdictions that fail all three tests must go through the full GloBE Income → Adjusted Covered Taxes → ETR → SBIE → Top-Up Tax computation chain.',
};

export const TEST_GUIDANCE: Record<string, string> = {
  DE_MINIMIS:
    'The De Minimis Test (Article 9.1.2) exempts jurisdictions with minimal operations. Both conditions must be met: CbCR revenue below €10 million AND the absolute value of CbCR profit (or loss) below €1 million. This test is designed for small treasury entities, representative offices, or dormant companies where the compliance burden of a full GloBE computation would be disproportionate to any potential top-up tax.',
  SIMPLIFIED_ETR:
    'The Simplified ETR Test (Article 9.1.3) compares the ratio of income tax accrued to profit before tax against a transition rate that increases annually (15% in 2024, 16% in 2025, 17% in 2026–2027). If the simplified ETR meets or exceeds the transition rate, the jurisdiction qualifies. Loss-making jurisdictions automatically pass because there is no positive profit to tax. Note: the simplified ETR uses CbCR figures, not GloBE-adjusted amounts.',
  ROUTINE_PROFITS:
    'The Routine Profits Test (Article 9.1.4) asks whether all profit is attributable to real economic substance. It compares CbCR profit before tax against the Substance-Based Income Exclusion (SBIE): a carve-out based on eligible payroll costs and tangible asset net book value. If profit is at or below the SBIE, the jurisdiction qualifies — all returns are "routine" returns on substance. The SBIE rates decline annually as the transitional period progresses.',
};

// ============================================================
// INITIAL STATE
// ============================================================

export const INITIAL_JURISDICTION: Omit<JurisdictionCbCRData, 'id'> = {
  jurisdiction: '',
  revenue: 0,
  profitBeforeTax: 0,
  incomeTaxAccrued: 0,
  employeeCount: 0,
  employeeCompensation: 0,
  tangibleAssetsNBV: 0,
};

// ============================================================
// PURE FUNCTIONS — ID Generation
// ============================================================

export function generateJurisdictionId(): string {
  return `SH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

// ============================================================
// PURE FUNCTIONS — Test Calculations
// ============================================================

/**
 * Test 1: De Minimis (Article 9.1.2)
 *
 * Qualifies if BOTH:
 *   - Revenue < €10,000,000
 *   - |Profit Before Tax| < €1,000,000
 */
export function calculateDeMinimis(
  jurisdiction: JurisdictionCbCRData
): DeMinimisResult {
  const revenueBelow = jurisdiction.revenue < DE_MINIMIS_REVENUE_THRESHOLD;
  const profitAbs = Math.abs(jurisdiction.profitBeforeTax);
  const profitBelow = profitAbs < DE_MINIMIS_PROFIT_THRESHOLD;

  return {
    revenueBelow,
    profitBelow,
    qualifies: revenueBelow && profitBelow,
    revenue: jurisdiction.revenue,
    profitAbs,
    revenueThreshold: DE_MINIMIS_REVENUE_THRESHOLD,
    profitThreshold: DE_MINIMIS_PROFIT_THRESHOLD,
    articleRef: 'Article 9.1.2 — Transitional CbCR Safe Harbour De Minimis Test',
  };
}

/**
 * Test 2: Simplified ETR (Article 9.1.3)
 *
 * Qualifies if:
 *   - Income Tax Accrued / Profit Before Tax ≥ transition rate, OR
 *   - Profit Before Tax ≤ 0 (loss-making → automatic qualification)
 */
export function calculateSimplifiedETR(
  jurisdiction: JurisdictionCbCRData,
  fiscalYear: SafeHarbourFiscalYear
): SimplifiedETRResult {
  const rates = getTransitionRates(fiscalYear);
  const transitionRate = rates.etrRate;

  // Loss-making jurisdictions automatically qualify
  if (jurisdiction.profitBeforeTax <= 0) {
    return {
      calculatedETR: 0,
      transitionRate,
      isLossMaking: true,
      qualifies: true,
      status: 'LOSS_MAKING',
      articleRef:
        'Article 9.1.3 — Loss-making jurisdiction: automatic qualification',
    };
  }

  const calculatedETR = roundTo2(
    (jurisdiction.incomeTaxAccrued / jurisdiction.profitBeforeTax) * 100
  );
  const qualifies = calculatedETR >= transitionRate;

  return {
    calculatedETR,
    transitionRate,
    isLossMaking: false,
    qualifies,
    status: qualifies ? 'ABOVE_THRESHOLD' : 'BELOW_THRESHOLD',
    articleRef: qualifies
      ? `Article 9.1.3 — Simplified ETR ${calculatedETR.toFixed(2)}% ≥ ${transitionRate}% transition rate`
      : `Article 9.1.3 — Simplified ETR ${calculatedETR.toFixed(2)}% < ${transitionRate}% transition rate`,
  };
}

/**
 * Test 3: Routine Profits (Article 9.1.4)
 *
 * Qualifies if:
 *   - Profit Before Tax ≤ SBIE, OR
 *   - Profit Before Tax ≤ 0 (loss-making → automatic qualification)
 *
 * SBIE = (payroll rate × employee compensation) + (asset rate × tangible assets NBV)
 */
export function calculateRoutineProfits(
  jurisdiction: JurisdictionCbCRData,
  fiscalYear: SafeHarbourFiscalYear
): RoutineProfitsResult {
  const rates = getTransitionRates(fiscalYear);
  const payrollRate = rates.sbiePayrollRate;
  const assetRate = rates.sbieAssetRate;

  const sbiePayroll = roundTo2(
    jurisdiction.employeeCompensation * (payrollRate / 100)
  );
  const sbieAssets = roundTo2(
    jurisdiction.tangibleAssetsNBV * (assetRate / 100)
  );
  const totalSBIE = roundTo2(sbiePayroll + sbieAssets);

  const isLossMaking = jurisdiction.profitBeforeTax <= 0;
  const profitExceedsSBIE =
    !isLossMaking && jurisdiction.profitBeforeTax > totalSBIE;
  const qualifies = isLossMaking || !profitExceedsSBIE;

  return {
    sbiePayroll,
    sbieAssets,
    totalSBIE,
    profitBeforeTax: jurisdiction.profitBeforeTax,
    isLossMaking,
    profitExceedsSBIE,
    qualifies,
    payrollRate,
    assetRate,
    articleRef: qualifies
      ? isLossMaking
        ? 'Article 9.1.4 — Loss-making jurisdiction: automatic qualification'
        : `Article 9.1.4 — PBT ≤ SBIE (${formatEUR(jurisdiction.profitBeforeTax)} ≤ ${formatEUR(totalSBIE)})`
      : `Article 9.1.4 — PBT > SBIE (${formatEUR(jurisdiction.profitBeforeTax)} > ${formatEUR(totalSBIE)})`,
  };
}

// ============================================================
// PURE FUNCTIONS — Full Assessment
// ============================================================

/**
 * Assess a single jurisdiction against all three safe harbour tests.
 * Returns the first qualifying test (priority: de minimis → simplified ETR → routine profits).
 */
export function assessJurisdiction(
  jurisdiction: JurisdictionCbCRData,
  fiscalYear: SafeHarbourFiscalYear
): JurisdictionAssessment {
  const deMinimis = calculateDeMinimis(jurisdiction);
  const simplifiedETR = calculateSimplifiedETR(jurisdiction, fiscalYear);
  const routineProfits = calculateRoutineProfits(jurisdiction, fiscalYear);

  let qualifyingTest: JurisdictionAssessment['qualifyingTest'] = null;
  if (deMinimis.qualifies) {
    qualifyingTest = 'DE_MINIMIS';
  } else if (simplifiedETR.qualifies) {
    qualifyingTest = 'SIMPLIFIED_ETR';
  } else if (routineProfits.qualifies) {
    qualifyingTest = 'ROUTINE_PROFITS';
  }

  const cbcrETR =
    jurisdiction.profitBeforeTax > 0
      ? roundTo2(
          (jurisdiction.incomeTaxAccrued / jurisdiction.profitBeforeTax) * 100
        )
      : null;

  return {
    jurisdictionId: jurisdiction.id,
    jurisdiction: jurisdiction.jurisdiction,
    deMinimis,
    simplifiedETR,
    routineProfits,
    overallQualifies: qualifyingTest !== null,
    qualifyingTest,
    cbcrETR,
  };
}

/**
 * Run the full safe harbour assessment across all jurisdictions.
 */
export function runFullAssessment(
  groupName: string,
  fiscalYear: SafeHarbourFiscalYear,
  currency: string,
  jurisdictions: JurisdictionCbCRData[]
): AssessmentResult {
  const jurisdictionAssessments = jurisdictions.map((j) =>
    assessJurisdiction(j, fiscalYear)
  );

  const qualifying = jurisdictionAssessments.filter((a) => a.overallQualifies);
  const nonQualifying = jurisdictionAssessments.filter(
    (a) => !a.overallQualifies
  );

  return {
    groupName,
    fiscalYear,
    currency,
    jurisdictionAssessments,
    qualifyingCount: qualifying.length,
    totalCount: jurisdictionAssessments.length,
    qualifyingJurisdictions: qualifying.map((a) => a.jurisdiction),
    nonQualifyingJurisdictions: nonQualifying.map((a) => a.jurisdiction),
  };
}

// ============================================================
// VALIDATION
// ============================================================

export function validateGroupInfo(groupName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!groupName.trim()) {
    errors.push({
      field: 'groupName',
      message: 'Please enter the MNE Group name',
    });
  }

  return errors;
}

export function validateJurisdictions(
  jurisdictions: JurisdictionCbCRData[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (jurisdictions.length === 0) {
    errors.push({
      field: 'jurisdictions',
      message: 'At least one jurisdiction must be added',
    });
    return errors;
  }

  // Check for duplicates
  const names = jurisdictions.map((j) => j.jurisdiction.toLowerCase());
  const duplicates = names.filter(
    (name, index) => names.indexOf(name) !== index
  );
  if (duplicates.length > 0) {
    errors.push({
      field: 'duplicates',
      message: `Duplicate jurisdiction: ${duplicates[0]}. Combine entities into a single jurisdictional entry.`,
    });
  }

  jurisdictions.forEach((j) => {
    if (!j.jurisdiction.trim()) {
      errors.push({
        field: `jurisdiction_name_${j.id}`,
        message: 'Jurisdiction name is required',
      });
    }
    if (j.revenue < 0) {
      errors.push({
        field: `revenue_${j.id}`,
        message: `${j.jurisdiction || 'Jurisdiction'}: Revenue cannot be negative`,
      });
    }
    if (j.employeeCount < 0) {
      errors.push({
        field: `employees_${j.id}`,
        message: `${j.jurisdiction || 'Jurisdiction'}: Employee count cannot be negative`,
      });
    }
    if (j.employeeCompensation < 0) {
      errors.push({
        field: `compensation_${j.id}`,
        message: `${j.jurisdiction || 'Jurisdiction'}: Employee compensation cannot be negative`,
      });
    }
    if (j.tangibleAssetsNBV < 0) {
      errors.push({
        field: `assets_${j.id}`,
        message: `${j.jurisdiction || 'Jurisdiction'}: Tangible assets cannot be negative`,
      });
    }
  });

  return errors;
}

// ============================================================
// UTILITY HELPERS
// ============================================================

/** Round to 2 decimal places. */
export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Format a number as currency with thousands separators (EUR). */
export function formatEUR(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-GB');
  return `€${formatted}`;
}

/** Format a number with a currency symbol. */
export function formatCurrency(
  amount: number,
  currencyCode: string
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = Math.round(amount).toLocaleString('en-GB');
  return `${symbol}${formatted}`;
}

/** Get currency symbol from code. */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCIES.find((c) => c.code === currencyCode)?.symbol ?? currencyCode;
}

/** Format a percentage value (already on 0–100 scale). */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/** Parse a numeric input string, handling commas and empty strings. */
export function parseNumeric(value: string): number {
  const parsed = parseFloat(value.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/** Get the qualifying test display label. */
export function getQualifyingTestLabel(
  test: JurisdictionAssessment['qualifyingTest']
): string {
  switch (test) {
    case 'DE_MINIMIS':
      return 'De Minimis';
    case 'SIMPLIFIED_ETR':
      return 'Simplified ETR';
    case 'ROUTINE_PROFITS':
      return 'Routine Profits';
    default:
      return 'None';
  }
}

// ============================================================
// H&C TEST SCENARIO — Stratos Group (FY 2025)
// ============================================================

export const CASE_STUDY_GROUP_NAME = 'Stratos Holdings plc';
export const CASE_STUDY_FISCAL_YEAR: SafeHarbourFiscalYear = 2025;

/**
 * Pre-loaded CbCR data for the Stratos Group safe harbour assessment.
 *
 * Sources:
 * - UK, Germany, Singapore: fact-register.md §J (F-270 to F-272)
 * - Ireland: GloBE data from F-153/F-163; CbCR adjusted for IP amortisation
 * - Luxembourg: Revenue/PBT from F-179/F-180 (de minimis data)
 * - USA: Combined TechStart entities from F-252
 * - Cayman: TechStart Ventures Fund from F-256/F-214
 *
 * Expected result: 4 of 7 jurisdictions qualify (F-517)
 *   - UK: Simplified ETR (24.58% ≥ 16%)
 *   - Germany: Simplified ETR (23.28% ≥ 16%)
 *   - Luxembourg: De Minimis (Revenue €9.2M < €10M, PBT €630K < €1M)
 *   - USA: Simplified ETR (21.11% ≥ 16%)
 *   - Ireland: FAILS all tests (ETR 11.88% < 16%; PBT €16.5M >> SBIE ~€2.5M)
 *   - Singapore: FAILS all tests
 *   - Cayman: FAILS all tests
 */
export const CASE_STUDY_JURISDICTIONS: JurisdictionCbCRData[] = [
  {
    id: 'shq-uk',
    jurisdiction: 'United Kingdom',
    revenue: 125_000_000,
    profitBeforeTax: 12_000_000,
    incomeTaxAccrued: 2_950_000,
    employeeCount: 450,
    employeeCompensation: 32_000_000,
    tangibleAssetsNBV: 18_000_000,
  },
  {
    id: 'shq-de',
    jurisdiction: 'Germany',
    revenue: 285_000_000,
    profitBeforeTax: 58_000_000,
    incomeTaxAccrued: 13_500_000,
    employeeCount: 1_200,
    employeeCompensation: 132_000_000,
    tangibleAssetsNBV: 42_000_000,
  },
  {
    id: 'shq-ie',
    jurisdiction: 'Ireland',
    revenue: 92_000_000,
    profitBeforeTax: 16_500_000,
    incomeTaxAccrued: 1_960_000,
    employeeCount: 180,
    employeeCompensation: 16_200_000,
    tangibleAssetsNBV: 12_000_000,
  },
  {
    id: 'shq-lu',
    jurisdiction: 'Luxembourg',
    revenue: 9_200_000,
    profitBeforeTax: 630_000,
    incomeTaxAccrued: 157_000,
    employeeCount: 10,
    employeeCompensation: 520_000,
    tangibleAssetsNBV: 180_000,
  },
  {
    id: 'shq-us',
    jurisdiction: 'United States',
    revenue: 78_000_000,
    profitBeforeTax: 14_800_000,
    incomeTaxAccrued: 3_120_000,
    employeeCount: 334,
    employeeCompensation: 28_500_000,
    tangibleAssetsNBV: 4_900_000,
  },
  {
    id: 'shq-sg',
    jurisdiction: 'Singapore',
    revenue: 45_000_000,
    profitBeforeTax: 4_200_000,
    incomeTaxAccrued: 400_000,
    employeeCount: 85,
    employeeCompensation: 5_950_000,
    tangibleAssetsNBV: 3_500_000,
  },
  {
    id: 'shq-ky',
    jurisdiction: 'Cayman Islands',
    revenue: 15_000_000,
    profitBeforeTax: 2_016_000,
    incomeTaxAccrued: 20_200,
    employeeCount: 5,
    employeeCompensation: 1_200_000,
    tangibleAssetsNBV: 50_000,
  },
];
