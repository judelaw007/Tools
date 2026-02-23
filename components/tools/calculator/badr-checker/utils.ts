/**
 * BADR Eligibility Checker and Calculator — Utility Functions
 *
 * Pure functions for assessing BADR qualifying conditions and computing
 * CGT liability at the BADR rate with lifetime limit tracking.
 *
 * BADR rates:
 *   2024/25: 10%
 *   2025/26: 14%
 *   2026/27+: 18%
 *
 * Standard CGT rates (from 30 October 2024):
 *   Basic rate: 18%
 *   Higher rate: 24%
 */

import type {
  DisposalType,
  TaxYear,
  EligibilityStatus,
  ConditionStatus,
  DisposalDetails,
  GainInputs,
  ShareholdingDetails,
  CompanyStatus,
  AssociatedDisposalDetails,
  TaxpayerDetails,
  BADRInputs,
  ConditionResult,
  EligibilityResult,
  CGTComputation,
  LifetimeAllowance,
  AssociatedDisposalCalc,
  RateComparison,
  ValidationResult,
  BADROutput,
  HCScenario,
} from './types';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** BADR rates by tax year */
export const BADR_RATES: Record<TaxYear, number> = {
  '2024-25': 0.10,
  '2025-26': 0.14,
  '2026-27': 0.18,
};

/** Standard CGT basic rate (from 30 October 2024) */
export const CGT_BASIC_RATE = 0.18;

/** Standard CGT higher rate (from 30 October 2024) */
export const CGT_HIGHER_RATE = 0.24;

/** Annual exempt amount (2024/25 onwards) */
export const ANNUAL_EXEMPT_AMOUNT = 3_000;

/** Lifetime BADR limit */
export const LIFETIME_LIMIT = 1_000_000;

/** Minimum holding period in years */
export const MIN_HOLDING_YEARS = 2;

/** Minimum shareholding percentage for personal company test */
export const MIN_SHAREHOLDING_PERCENT = 5;

/** Minimum voting rights percentage */
export const MIN_VOTING_PERCENT = 5;

/** Minimum trading activity percentage for trading company test */
export const MIN_TRADING_PERCENT = 80;

/** Basic rate band for 2025/26 */
export const BASIC_RATE_BAND = 37_700;

/** Days per year (for holding period calculation) */
export const DAYS_PER_YEAR = 365.25;

// ─── Tax Year Determination ─────────────────────────────────────────────────────

/** Determine the tax year from a disposal date */
export function getTaxYear(disposalDate: string): TaxYear {
  const date = new Date(disposalDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Tax year runs 6 April to 5 April
  // If on or after 6 April, it's in the year starting that April
  // If before 6 April, it's in the year starting the previous April
  let taxYearStart: number;
  if (month > 4 || (month === 4 && day >= 6)) {
    taxYearStart = year;
  } else {
    taxYearStart = year - 1;
  }

  if (taxYearStart === 2024) return '2024-25';
  if (taxYearStart === 2025) return '2025-26';
  return '2026-27'; // 2026/27 and beyond
}

/** Get BADR rate for a tax year */
export function getBADRRate(taxYear: TaxYear): number {
  return BADR_RATES[taxYear];
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

// ─── Holding Period Calculation ──────────────────────────────────────────────────

/** Calculate holding period between two dates */
export function calculateHoldingPeriod(
  acquisitionDate: string,
  disposalDate: string
): { years: number; months: number; days: number; totalDays: number } {
  const acq = new Date(acquisitionDate);
  const disp = new Date(disposalDate);

  const totalDays = Math.floor(
    (disp.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate years and months for display
  let years = disp.getFullYear() - acq.getFullYear();
  let months = disp.getMonth() - acq.getMonth();
  let days = disp.getDate() - acq.getDate();

  if (days < 0) {
    months -= 1;
    // Get days in previous month
    const prevMonth = new Date(disp.getFullYear(), disp.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days, totalDays };
}

/** Check if holding period meets the 2-year minimum */
export function meetsHoldingPeriod(
  acquisitionDate: string,
  disposalDate: string
): boolean {
  const { totalDays } = calculateHoldingPeriod(acquisitionDate, disposalDate);
  return totalDays >= MIN_HOLDING_YEARS * DAYS_PER_YEAR;
}

/** Format holding period for display */
export function formatHoldingPeriod(period: { years: number; months: number; days: number }): string {
  const parts: string[] = [];
  if (period.years > 0) parts.push(`${period.years} year${period.years !== 1 ? 's' : ''}`);
  if (period.months > 0) parts.push(`${period.months} month${period.months !== 1 ? 's' : ''}`);
  if (parts.length === 0) parts.push(`${period.days} days`);
  return parts.join(' ');
}

// ─── Eligibility Assessment ─────────────────────────────────────────────────────

/** Check all BADR conditions for a shares disposal */
export function checkSharesConditions(
  disposal: DisposalDetails,
  shareholding: ShareholdingDetails,
  companyStatus: CompanyStatus
): ConditionResult[] {
  const holdingPeriod = calculateHoldingPeriod(disposal.acquisitionDate, disposal.disposalDate);
  const holdingMet = meetsHoldingPeriod(disposal.acquisitionDate, disposal.disposalDate);

  const conditions: ConditionResult[] = [
    // Condition 1: 2-year holding period
    {
      conditionId: 'two-year-holding',
      conditionName: '2-Year Holding Period',
      status: holdingMet ? 'met' : 'not-met',
      detail: holdingMet
        ? `Shares held for ${formatHoldingPeriod(holdingPeriod)} (acquired ${formatDate(disposal.acquisitionDate)}). Exceeds the 2-year minimum.`
        : `Shares held for only ${formatHoldingPeriod(holdingPeriod)} (acquired ${formatDate(disposal.acquisitionDate)}). The 2-year minimum is not met.`,
      legislativeRef: 'TCGA 1992 s.169I(7)',
      educationalNote:
        'The qualifying conditions must be met throughout a continuous 2-year period ending with the date of disposal. The 2-year period cannot be aggregated from separate periods — it must be continuous. For shares acquired on s.162 incorporation, the holding period starts from the date of incorporation, not the date the business was originally started.',
    },

    // Condition 2: 5% ordinary share capital
    {
      conditionId: 'five-percent-shares',
      conditionName: '5% Ordinary Share Capital',
      status: shareholding.percentShareCapital >= MIN_SHAREHOLDING_PERCENT ? 'met' : 'not-met',
      detail: shareholding.percentShareCapital >= MIN_SHAREHOLDING_PERCENT
        ? `Holds ${shareholding.percentShareCapital}% of ordinary share capital (minimum 5%).`
        : `Holds only ${shareholding.percentShareCapital}% of ordinary share capital. Minimum 5% required.`,
      legislativeRef: 'TCGA 1992 s.169S(3)(a)',
      educationalNote:
        'Only ordinary share capital counts. Preference shares, deferred shares, and other non-ordinary classes are excluded from the calculation. The 5% must be held throughout the 2-year qualifying period — if the shareholding drops below 5% at any point (e.g., due to a share issue), BADR is lost.',
    },

    // Condition 3: 5% voting rights
    {
      conditionId: 'five-percent-voting',
      conditionName: '5% Voting Rights',
      status: shareholding.percentVotingRights >= MIN_VOTING_PERCENT ? 'met' : 'not-met',
      detail: shareholding.percentVotingRights >= MIN_VOTING_PERCENT
        ? `Holds ${shareholding.percentVotingRights}% of voting rights (minimum 5%).`
        : `Holds only ${shareholding.percentVotingRights}% of voting rights. Minimum 5% required.`,
      legislativeRef: 'TCGA 1992 s.169S(3)(b)',
      educationalNote:
        'Voting rights are usually proportional to ordinary share capital, but can differ if shares carry different voting rights (e.g., A shares with 10 votes each, B shares with 1 vote). The 5% voting rights test is separate from the 5% share capital test — both must be met.',
    },

    // Condition 4: Employee or officer
    {
      conditionId: 'employee-officer',
      conditionName: 'Employee or Officer',
      status: shareholding.isEmployeeOrOfficer ? 'met' : 'not-met',
      detail: shareholding.isEmployeeOrOfficer
        ? 'The individual is an employee or officer (director) of the company.'
        : 'The individual is NOT an employee or officer of the company. BADR requires the individual to be an employee or officer throughout the qualifying period.',
      legislativeRef: 'TCGA 1992 s.169I(6)(b)',
      educationalNote:
        'The individual must be an employee or officer (which includes directors) of the company, or of a company in the same group, throughout the 2-year qualifying period. A non-executive director qualifies. A passive shareholder who is neither employed nor a director does not qualify.',
    },

    // Condition 5: Personal company (compound)
    {
      conditionId: 'personal-company',
      conditionName: 'Personal Company',
      status:
        shareholding.percentShareCapital >= MIN_SHAREHOLDING_PERCENT &&
        shareholding.percentVotingRights >= MIN_VOTING_PERCENT &&
        shareholding.isEmployeeOrOfficer
          ? 'met'
          : 'not-met',
      detail:
        shareholding.percentShareCapital >= MIN_SHAREHOLDING_PERCENT &&
        shareholding.percentVotingRights >= MIN_VOTING_PERCENT &&
        shareholding.isEmployeeOrOfficer
          ? 'The company is the individual\'s personal company (holds >= 5% shares, >= 5% votes, and is an employee/officer).'
          : 'The company is NOT the individual\'s personal company. All three sub-conditions must be met: >= 5% ordinary shares, >= 5% voting rights, AND employee/officer status.',
      legislativeRef: 'TCGA 1992 s.169S(3)',
      educationalNote:
        'The "personal company" test is a compound condition. It requires the individual to simultaneously hold at least 5% of ordinary share capital, exercise at least 5% of voting rights, AND be an employee or officer. This is a higher bar than simply owning shares — it ensures the individual has genuine involvement in the company.',
    },

    // Condition 6: Trading company (80% test)
    {
      conditionId: 'trading-company',
      conditionName: 'Trading Company (80% Test)',
      status: companyStatus.tradingIncomePercent >= MIN_TRADING_PERCENT ? 'met' : 'not-met',
      detail: companyStatus.tradingIncomePercent >= MIN_TRADING_PERCENT
        ? `Trading activities are ${companyStatus.tradingIncomePercent.toFixed(1)}% of total activities (minimum 80%).${companyStatus.tradingIncomeAmount > 0 ? ` Trading income: ${formatPounds(companyStatus.tradingIncomeAmount)}, non-trading income: ${formatPounds(companyStatus.nonTradingIncomeAmount)}.` : ''}`
        : `Trading activities are only ${companyStatus.tradingIncomePercent.toFixed(1)}% of total (minimum 80% required). The company may be treated as an investment company.`,
      legislativeRef: 'TCGA 1992 s.169S(4), CTA 2010 s.165',
      educationalNote:
        'A "trading company" is one whose activities do not include to a substantial extent activities other than trading activities. HMRC interprets "substantial" as 20% or more, so at least 80% of the company\'s activities must be trading. The test considers multiple factors: turnover, asset usage, expenses, and management time — not just income. Rental income, investment income, and interest income are non-trading. If a company has significant investment activities (e.g., a large property portfolio alongside a trade), it may fail this test.',
    },
  ];

  return conditions;
}

/** Check conditions for a business assets disposal */
export function checkBusinessAssetsConditions(
  disposal: DisposalDetails
): ConditionResult[] {
  const holdingPeriod = calculateHoldingPeriod(disposal.acquisitionDate, disposal.disposalDate);
  const holdingMet = meetsHoldingPeriod(disposal.acquisitionDate, disposal.disposalDate);

  return [
    {
      conditionId: 'two-year-trading',
      conditionName: '2-Year Trading Period',
      status: holdingMet ? 'met' : 'not-met',
      detail: holdingMet
        ? `Business operated for ${formatHoldingPeriod(holdingPeriod)}. Exceeds the 2-year minimum.`
        : `Business operated for only ${formatHoldingPeriod(holdingPeriod)}. The 2-year minimum is not met.`,
      legislativeRef: 'TCGA 1992 s.169I(7)',
      educationalNote:
        'For disposals of business assets (sole trader or partnership interest), the business must have been carried on for at least 2 years before the date of disposal or cessation. The 2-year period must be continuous.',
    },
    {
      conditionId: 'material-disposal',
      conditionName: 'Material Disposal of Business Assets',
      status: 'met', // Assumed met if user selects this disposal type
      detail: 'Disposal of the whole or part of a business, or of assets used in the business at the time of cessation.',
      legislativeRef: 'TCGA 1992 s.169I(2)',
      educationalNote:
        'BADR applies to a "material disposal of business assets" — this means disposal of the whole or part of a business (not just individual assets while the business continues). If the business has ceased, assets must be disposed of within 3 years of cessation.',
    },
  ];
}

/** Check conditions for an associated disposal */
export function checkAssociatedDisposalConditions(
  disposal: DisposalDetails,
  shareholding: ShareholdingDetails,
  companyStatus: CompanyStatus
): ConditionResult[] {
  // Associated disposal conditions include shares conditions plus additional requirements
  const sharesConditions = checkSharesConditions(disposal, shareholding, companyStatus);

  // Add associated disposal specific condition
  sharesConditions.push({
    conditionId: 'associated-material-disposal',
    conditionName: 'Associated with Material Disposal',
    status: 'met', // Assumed met if user selects this type
    detail: 'The disposal is associated with a material disposal of business assets (e.g., a share disposal).',
    legislativeRef: 'TCGA 1992 s.169K',
    educationalNote:
      'An associated disposal arises when the individual disposes of a personally-owned asset that was used in the company\'s trade. The disposal must be associated with a material disposal (e.g., a share sale). The gain on the associated asset is time-apportioned for the period of trade use and may be restricted if rent was charged.',
  });

  return sharesConditions;
}

/** Determine overall eligibility from individual conditions */
export function determineEligibility(conditions: ConditionResult[]): EligibilityStatus {
  const applicableConditions = conditions.filter((c) => c.status !== 'not-applicable');
  const allMet = applicableConditions.every((c) => c.status === 'met');
  const noneMet = applicableConditions.every((c) => c.status === 'not-met');

  if (allMet) return 'qualifying';
  if (noneMet) return 'not-qualifying';
  return 'not-qualifying'; // Partial failure = not qualifying
}

/** Generate eligibility reason text */
function generateEligibilityReason(
  eligibility: EligibilityStatus,
  conditions: ConditionResult[]
): string {
  if (eligibility === 'qualifying') {
    return 'All BADR qualifying conditions are met. The disposal qualifies for Business Asset Disposal Relief at the reduced CGT rate.';
  }

  const failedConditions = conditions
    .filter((c) => c.status === 'not-met')
    .map((c) => c.conditionName);

  return `BADR does NOT apply. Failed condition${failedConditions.length > 1 ? 's' : ''}: ${failedConditions.join(', ')}. The gain will be taxed at standard CGT rates.`;
}

/** Run the full eligibility assessment */
export function assessEligibility(inputs: BADRInputs): EligibilityResult {
  let conditions: ConditionResult[];

  switch (inputs.disposal.disposalType) {
    case 'shares':
      conditions = checkSharesConditions(inputs.disposal, inputs.shareholding, inputs.companyStatus);
      break;
    case 'business-assets':
      conditions = checkBusinessAssetsConditions(inputs.disposal);
      break;
    case 'associated-disposal':
      conditions = checkAssociatedDisposalConditions(inputs.disposal, inputs.shareholding, inputs.companyStatus);
      break;
    default:
      conditions = [];
  }

  const overallEligibility = determineEligibility(conditions);
  const holdingPeriod = calculateHoldingPeriod(inputs.disposal.acquisitionDate, inputs.disposal.disposalDate);

  return {
    overallEligibility,
    eligibilityReason: generateEligibilityReason(overallEligibility, conditions),
    conditions,
    holdingPeriod,
  };
}

// ─── Associated Disposal Calculation ────────────────────────────────────────────

/** Calculate the BADR qualifying portion of an associated disposal */
export function calculateAssociatedDisposal(
  taxableGain: number,
  details: AssociatedDisposalDetails
): AssociatedDisposalCalc {
  const timeApportionmentFraction =
    details.totalOwnershipDays > 0
      ? details.tradeUseDays / details.totalOwnershipDays
      : 0;

  const timeApportionedGain = Math.round(taxableGain * timeApportionmentFraction);

  let rentRestrictionFraction = 1;
  if (details.rentCharged) {
    rentRestrictionFraction = Math.max(0, 1 - details.rentAsPercentOfMarket / 100);
  }

  const badrQualifyingGain = Math.round(timeApportionedGain * rentRestrictionFraction);
  const nonQualifyingGain = taxableGain - badrQualifyingGain;

  return {
    totalGain: taxableGain,
    timeApportionmentFraction,
    timeApportionedGain,
    rentRestrictionFraction,
    badrQualifyingGain,
    nonQualifyingGain,
  };
}

// ─── CGT Computation ────────────────────────────────────────────────────────────

/** Compute CGT with BADR */
export function computeCGT(
  inputs: BADRInputs,
  eligibility: EligibilityResult,
  associatedCalc: AssociatedDisposalCalc | null
): CGTComputation {
  const taxYear = getTaxYear(inputs.disposal.disposalDate);
  const badrRate = getBADRRate(taxYear);

  // Step 1: Compute gain
  const gain = inputs.gain.disposalProceeds - inputs.gain.baseCost - inputs.gain.allowableCosts;

  // Step 2: Apply AEA
  const aeaAvailable = Math.max(0, ANNUAL_EXEMPT_AMOUNT - inputs.gain.annualExemptAmountUsed);
  const annualExemptAmount = Math.min(Math.max(gain, 0), aeaAvailable);
  const taxableGain = Math.max(0, gain - annualExemptAmount);

  // Step 3: Determine BADR qualifying gain
  const lifetimeRemaining = Math.max(0, LIFETIME_LIMIT - inputs.lifetimePreviouslyUsed);

  let badrQualifyingGain = 0;
  let nonBadrGain = taxableGain;

  if (eligibility.overallEligibility === 'qualifying' && taxableGain > 0) {
    if (associatedCalc) {
      // For associated disposals, only the qualifying portion gets BADR
      badrQualifyingGain = Math.min(associatedCalc.badrQualifyingGain, lifetimeRemaining);
      nonBadrGain = taxableGain - badrQualifyingGain;
    } else {
      badrQualifyingGain = Math.min(taxableGain, lifetimeRemaining);
      nonBadrGain = taxableGain - badrQualifyingGain;
    }
  }

  // Step 4: Compute CGT
  const cgtAtBadrRate = Math.round(badrQualifyingGain * badrRate * 100) / 100;

  // Standard rate on non-BADR gain
  const basicRateBandRemaining = Math.max(0, BASIC_RATE_BAND - inputs.taxpayer.taxableIncomeAbovePA);
  const gainInBasicBand = Math.min(nonBadrGain, basicRateBandRemaining);
  const gainInHigherBand = nonBadrGain - gainInBasicBand;

  const standardBasicRateCGT = Math.round(gainInBasicBand * CGT_BASIC_RATE * 100) / 100;
  const standardHigherRateCGT = Math.round(gainInHigherBand * CGT_HIGHER_RATE * 100) / 100;
  const totalCGT = cgtAtBadrRate + standardBasicRateCGT + standardHigherRateCGT;

  const effectiveRate = taxableGain > 0 ? totalCGT / taxableGain : 0;

  return {
    proceeds: inputs.gain.disposalProceeds,
    baseCost: inputs.gain.baseCost,
    allowableCosts: inputs.gain.allowableCosts,
    gain,
    annualExemptAmount,
    aeaAvailable,
    taxableGain,
    badrQualifyingGain,
    nonBadrGain,
    badrRate,
    taxYear,
    cgtAtBadrRate,
    standardBasicRateCGT,
    standardHigherRateCGT,
    totalCGT,
    effectiveRate,
  };
}

// ─── Lifetime Allowance ─────────────────────────────────────────────────────────

/** Calculate lifetime allowance usage */
export function calculateLifetimeAllowance(
  previouslyUsed: number,
  badrQualifyingGain: number
): LifetimeAllowance {
  const usedOnThisDisposal = badrQualifyingGain;
  const totalUsed = previouslyUsed + usedOnThisDisposal;
  const remainingAfterDisposal = Math.max(0, LIFETIME_LIMIT - totalUsed);
  const limitExceeded = totalUsed > LIFETIME_LIMIT;

  return {
    lifetimeLimit: LIFETIME_LIMIT,
    previouslyUsed,
    usedOnThisDisposal,
    remainingAfterDisposal,
    limitExceeded,
  };
}

// ─── Rate Comparison ────────────────────────────────────────────────────────────

/** Compare CGT with and without BADR */
export function calculateRateComparison(
  cgtComputation: CGTComputation,
  taxableIncomeAbovePA: number
): RateComparison {
  const { taxableGain, totalCGT } = cgtComputation;

  // CGT without BADR (all at standard rates)
  const basicRateBandRemaining = Math.max(0, BASIC_RATE_BAND - taxableIncomeAbovePA);
  const allGainInBasicBand = Math.min(taxableGain, basicRateBandRemaining);
  const allGainInHigherBand = taxableGain - allGainInBasicBand;

  const standardBasicRateAmount = allGainInBasicBand;
  const standardHigherRateAmount = allGainInHigherBand;

  const cgtWithoutBadr =
    Math.round(allGainInBasicBand * CGT_BASIC_RATE * 100) / 100 +
    Math.round(allGainInHigherBand * CGT_HIGHER_RATE * 100) / 100;

  const taxSaving = cgtWithoutBadr - totalCGT;

  return {
    cgtWithBadr: totalCGT,
    cgtWithoutBadr,
    taxSaving,
    standardBasicRateAmount,
    standardHigherRateAmount,
    effectiveRateWithBadr: taxableGain > 0 ? totalCGT / taxableGain : 0,
    effectiveRateWithoutBadr: taxableGain > 0 ? cgtWithoutBadr / taxableGain : 0,
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: BADRInputs): ValidationResult[] {
  const results: ValidationResult[] = [];

  // V1: Dates valid
  if (!inputs.disposal.disposalDate) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Disposal date is required.',
      passed: false,
    });
  }
  if (!inputs.disposal.acquisitionDate) {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Acquisition date is required.',
      passed: false,
    });
  }
  if (inputs.disposal.disposalDate && inputs.disposal.acquisitionDate) {
    const acq = new Date(inputs.disposal.acquisitionDate);
    const disp = new Date(inputs.disposal.disposalDate);
    if (disp <= acq) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: 'Disposal date must be after acquisition date.',
        passed: false,
      });
    }
  }

  // V2: Proceeds positive
  if (inputs.gain.disposalProceeds <= 0) {
    results.push({
      ruleId: 'V2',
      severity: 'error',
      message: 'Disposal proceeds must be greater than zero.',
      passed: false,
    });
  }

  // V3: Shareholding required for shares
  if (inputs.disposal.disposalType === 'shares' || inputs.disposal.disposalType === 'associated-disposal') {
    if (inputs.shareholding.percentShareCapital <= 0 || inputs.shareholding.percentVotingRights <= 0) {
      results.push({
        ruleId: 'V3',
        severity: 'error',
        message: 'Share capital percentage and voting rights percentage must be provided for a shares or associated disposal.',
        passed: false,
      });
    }
  }

  // V4: Company status required
  if (inputs.disposal.disposalType === 'shares' || inputs.disposal.disposalType === 'associated-disposal') {
    if (inputs.companyStatus.tradingIncomePercent <= 0) {
      results.push({
        ruleId: 'V4',
        severity: 'error',
        message: 'Trading income percentage must be provided for a shares or associated disposal.',
        passed: false,
      });
    }
  }

  // V5: Lifetime limit check
  if (inputs.lifetimePreviouslyUsed >= LIFETIME_LIMIT) {
    results.push({
      ruleId: 'V5',
      severity: 'warning',
      message: `Lifetime BADR limit of ${formatPounds(LIFETIME_LIMIT)} has been fully used. No further BADR is available. The gain will be taxed at standard rates.`,
      passed: false,
    });
  }

  // V6: 2-year holding check (info only)
  if (inputs.disposal.disposalDate && inputs.disposal.acquisitionDate) {
    const holdingMet = meetsHoldingPeriod(inputs.disposal.acquisitionDate, inputs.disposal.disposalDate);
    if (!holdingMet) {
      const hp = calculateHoldingPeriod(inputs.disposal.acquisitionDate, inputs.disposal.disposalDate);
      results.push({
        ruleId: 'V6',
        severity: 'info',
        message: `Holding period is ${formatHoldingPeriod(hp)} — less than the 2-year minimum required for BADR. Consider delaying the disposal if possible.`,
        passed: false,
      });
    }
  }

  // V7: 5% test check (info only)
  if (inputs.disposal.disposalType === 'shares') {
    if (inputs.shareholding.percentShareCapital > 0 && inputs.shareholding.percentShareCapital < MIN_SHAREHOLDING_PERCENT) {
      results.push({
        ruleId: 'V7',
        severity: 'info',
        message: `Shareholding of ${inputs.shareholding.percentShareCapital}% is below the 5% minimum. BADR will not apply.`,
        passed: false,
      });
    }
  }

  // V8: Associated disposal inputs
  if (inputs.disposal.disposalType === 'associated-disposal') {
    if (inputs.associatedDisposal.totalOwnershipDays <= 0) {
      results.push({
        ruleId: 'V8',
        severity: 'error',
        message: 'Total ownership days must be provided for an associated disposal.',
        passed: false,
      });
    }
    if (inputs.associatedDisposal.tradeUseDays <= 0) {
      results.push({
        ruleId: 'V8',
        severity: 'error',
        message: 'Trade use days must be provided for an associated disposal.',
        passed: false,
      });
    }
    if (inputs.associatedDisposal.tradeUseDays > inputs.associatedDisposal.totalOwnershipDays) {
      results.push({
        ruleId: 'V8',
        severity: 'error',
        message: 'Trade use days cannot exceed total ownership days.',
        passed: false,
      });
    }
  }

  // V9: Gain is positive
  const gain = inputs.gain.disposalProceeds - inputs.gain.baseCost - inputs.gain.allowableCosts;
  if (gain <= 0) {
    results.push({
      ruleId: 'V9',
      severity: 'warning',
      message: `No chargeable gain arises (gain = ${formatPounds(gain)}). BADR is not relevant as there is no CGT liability.`,
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

// ─── Full Assessment ────────────────────────────────────────────────────────────

/** Run the full BADR assessment and CGT computation */
export function assessBADR(inputs: BADRInputs): BADROutput {
  // Validate
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Eligibility assessment
  const eligibility = assessEligibility(inputs);

  // Associated disposal calculation (if applicable)
  let associatedDisposalCalc: AssociatedDisposalCalc | null = null;
  if (inputs.disposal.disposalType === 'associated-disposal') {
    const gain = inputs.gain.disposalProceeds - inputs.gain.baseCost - inputs.gain.allowableCosts;
    const aeaAvailable = Math.max(0, ANNUAL_EXEMPT_AMOUNT - inputs.gain.annualExemptAmountUsed);
    const taxableGain = Math.max(0, gain - Math.min(gain, aeaAvailable));
    associatedDisposalCalc = calculateAssociatedDisposal(taxableGain, inputs.associatedDisposal);
  }

  // CGT computation
  const cgtComputation = computeCGT(inputs, eligibility, associatedDisposalCalc);

  // Lifetime allowance
  const lifetimeAllowance = calculateLifetimeAllowance(
    inputs.lifetimePreviouslyUsed,
    cgtComputation.badrQualifyingGain
  );

  // Rate comparison
  const rateComparison = calculateRateComparison(
    cgtComputation,
    inputs.taxpayer.taxableIncomeAbovePA
  );

  return {
    eligibility,
    cgtComputation,
    lifetimeAllowance,
    associatedDisposalCalc,
    rateComparison,
    validationResults,
    validationSummary,
  };
}

// ─── Empty Inputs ───────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): BADRInputs {
  return {
    disposal: {
      disposalType: 'shares',
      disposalDate: '',
      acquisitionDate: '',
    },
    gain: {
      disposalProceeds: 0,
      baseCost: 0,
      allowableCosts: 0,
      annualExemptAmountUsed: 0,
    },
    shareholding: {
      percentShareCapital: 0,
      percentVotingRights: 0,
      isEmployeeOrOfficer: true,
    },
    companyStatus: {
      tradingIncomePercent: 0,
      tradingIncomeAmount: 0,
      nonTradingIncomeAmount: 0,
    },
    associatedDisposal: {
      totalOwnershipDays: 0,
      tradeUseDays: 0,
      rentCharged: false,
      rentAsPercentOfMarket: 0,
    },
    lifetimePreviouslyUsed: 0,
    taxpayer: {
      taxableIncomeAbovePA: BASIC_RATE_BAND, // Default: higher rate taxpayer
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

/** Format a percentage */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Format a percentage with 1 decimal */
export function formatPercentDecimal(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Format a date for display */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Get display name for disposal type */
export function getDisposalTypeName(type: DisposalType): string {
  switch (type) {
    case 'shares': return 'Shares in Personal Company';
    case 'business-assets': return 'Business Assets';
    case 'associated-disposal': return 'Associated Disposal';
    default: return type;
  }
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  {
    id: 's9-marcus-badr-eligibility',
    name: 'S9 — Marcus BADR Eligibility (600 Shares, Pre-Exit)',
    section: 9,
    description:
      'Assess Marcus Caldwell\'s BADR eligibility on his 600 shares (60% holding) in C&S Engineering Ltd. Marcus has held the shares since the s.162 incorporation on 18 March 2019 and is Managing Director. The company\'s trading income is ~£2.4m with only £14,400 of non-trading income. Illustrative disposal at £750/share to quantify the potential tax saving from BADR.',
    preFilledInputs: {
      disposal: {
        disposalType: 'shares',
        disposalDate: '2026-10-31',
        acquisitionDate: '2019-03-18',
      },
      gain: {
        disposalProceeds: 450_000,
        baseCost: 246_000,
        allowableCosts: 2_000,
        annualExemptAmountUsed: 0,
      },
      shareholding: {
        percentShareCapital: 60,
        percentVotingRights: 60,
        isEmployeeOrOfficer: true,
      },
      companyStatus: {
        tradingIncomePercent: 99.4,
        tradingIncomeAmount: 2_400_000,
        nonTradingIncomeAmount: 14_400,
      },
      associatedDisposal: {
        totalOwnershipDays: 0,
        tradeUseDays: 0,
        rentCharged: false,
        rentAsPercentOfMarket: 0,
      },
      lifetimePreviouslyUsed: 0,
      taxpayer: {
        taxableIncomeAbovePA: 86_000,
      },
    },
    expectedCGT: 35_820,
    expectedEligibility: 'qualifying',
    hints: {
      'two-year-holding': [
        'Marcus has held his shares since 18 March 2019 (the date of incorporation under s.162 TCGA 1992).',
        'The holding period is 7 years 7 months — well above the 2-year minimum.',
        'Note: the holding period starts from incorporation, NOT from when Marcus started the sole trader business in 2008.',
      ],
      'five-percent-shares': [
        'Marcus holds 600 of 1,000 ordinary £1 shares = 60%.',
        '60% is well above the 5% minimum.',
        'There are no other share classes (no preference shares) — the ordinary shares are the only class.',
      ],
      'five-percent-voting': [
        'With 600 of 1,000 ordinary shares, Marcus has 60% of voting rights.',
        'All shares carry equal voting rights (standard articles).',
      ],
      'employee-officer': [
        'Marcus is Managing Director — he is an officer (director) of the company.',
        'He has been MD continuously since incorporation in March 2019.',
      ],
      'personal-company': [
        'The personal company test is a compound of the three preceding conditions.',
        'Marcus meets all three: >= 5% shares (60%), >= 5% votes (60%), and is an officer (MD).',
      ],
      'trading-company': [
        'C&S Engineering\'s non-trading income is £14,400 (rent £12,000 + bank interest £2,400).',
        'Total income is approximately £2,414,400.',
        'Trading activities represent 99.4% — well above the 80% threshold.',
        'The small rental from Unit 7B and bank interest do not come close to making this a non-trading company.',
      ],
    },
  },
  {
    id: 's11-marcus-exit-share-sale',
    name: 'S11 — Marcus Exit Route: Share Sale (400 Shares Post-S10)',
    section: 11,
    description:
      'Compute CGT with BADR for Marcus\'s remaining 400 shares (40% holding) in the exit route comparison. After selling 200 shares to Sophie in S10, Marcus retains 400 shares with a base cost of £164,000 (400 × £410/share from s.162 incorporation). The computation feeds into the Route 1 (share sale) and Route 2 (purchase of own shares) analysis.',
    preFilledInputs: {
      disposal: {
        disposalType: 'shares',
        disposalDate: '2027-03-31',
        acquisitionDate: '2019-03-18',
      },
      gain: {
        disposalProceeds: 300_000,
        baseCost: 164_000,
        allowableCosts: 3_000,
        annualExemptAmountUsed: 0,
      },
      shareholding: {
        percentShareCapital: 40,
        percentVotingRights: 40,
        isEmployeeOrOfficer: true,
      },
      companyStatus: {
        tradingIncomePercent: 99.4,
        tradingIncomeAmount: 2_400_000,
        nonTradingIncomeAmount: 14_400,
      },
      associatedDisposal: {
        totalOwnershipDays: 0,
        tradeUseDays: 0,
        rentCharged: false,
        rentAsPercentOfMarket: 0,
      },
      lifetimePreviouslyUsed: 0,
      taxpayer: {
        taxableIncomeAbovePA: 86_000,
      },
    },
    expectedCGT: 23_400,
    expectedEligibility: 'qualifying',
    hints: {
      'two-year-holding': [
        'Marcus has held his shares since 18 March 2019.',
        'Disposal on 31 March 2027 gives a holding period of 8 years.',
      ],
      'five-percent-shares': [
        'Post-S10, Marcus holds 400 of 1,000 shares = 40%.',
        '40% is still well above the 5% minimum.',
        'KEY EXAM POINT: If Marcus\'s holding had dropped below 5% (e.g., through share issues to EMI recipients), BADR would be lost.',
      ],
      'trading-company': [
        'Same trading company analysis as S9 — still ~99.4% trading.',
        'In the exit comparison, the student should also consider Route 4 (EOT) which provides 100% CGT exemption vs BADR\'s reduced rate.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Convert a scenario's pre-filled inputs to BADRInputs */
export function scenarioToInputs(scenario: HCScenario): BADRInputs {
  return JSON.parse(JSON.stringify(scenario.preFilledInputs));
}
