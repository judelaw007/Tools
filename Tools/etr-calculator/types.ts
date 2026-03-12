// T-ETR: ETR and Top-Up Tax Calculator — Type Definitions

// ============================================================
// ARTICLE 3.2 ADJUSTMENT CATEGORIES
// ============================================================

/**
 * Categories of Article 3.2 adjustments to Financial Accounting
 * Net Income (FANI) to arrive at GloBE Income.
 *
 * Each adjustment can be positive (increases GloBE Income) or
 * negative (decreases GloBE Income).
 */
export type AdjustmentCategory =
  | 'EXCLUDED_DIVIDENDS'
  | 'EXCLUDED_EQUITY_GAINS'
  | 'ASYMMETRIC_FX'
  | 'POLICY_DISALLOWED'
  | 'PRIOR_PERIOD'
  | 'PENSION_TIMING'
  | 'SBC'
  | 'SHIPPING_EXCLUSION'
  | 'INSURANCE'
  | 'OTHER';

/** A single Article 3.2 adjustment entry */
export interface IncomeAdjustment {
  id: string;
  category: AdjustmentCategory;
  description: string;
  amount: number; // Positive = increases GloBE Income, Negative = decreases
  articleRef: string; // e.g. "Art. 3.2.1(b)"
  isElective: boolean; // True for SBC election — can be toggled for scenario comparison
}

// ============================================================
// COVERED TAX COMPONENTS
// ============================================================

/** Categories of covered tax items */
export type CoveredTaxCategory =
  | 'CURRENT_TAX'
  | 'QUALIFIED_REFUNDABLE_CREDIT'
  | 'NON_QUALIFIED_CREDIT'
  | 'UTP_SETTLED'
  | 'UTP_OUTSTANDING'
  | 'CFC_ALLOCATION'
  | 'DTL_MOVEMENT'
  | 'DTA_MOVEMENT'
  | 'DTL_CAP_ADJUSTMENT'
  | 'OTHER_TAX';

/** A single covered tax component */
export interface CoveredTaxEntry {
  id: string;
  category: CoveredTaxCategory;
  description: string;
  amount: number; // Positive = increases covered taxes, Negative = decreases
  articleRef: string;
  isDTLCapApplicable: boolean; // True if this DTL needs 15% cap check
}

// ============================================================
// DE MINIMIS DATA
// ============================================================

/** Three-year data for the de minimis exclusion test (Article 5.5) */
export interface DeMinimisData {
  year1Revenue: number;
  year1Income: number;
  year2Revenue: number;
  year2Income: number;
  year3Revenue: number;
  year3Income: number;
}

/** De minimis test result */
export interface DeMinimisResult {
  avgRevenue: number;
  avgIncome: number;
  revenueTestPassed: boolean; // avg < €10,000,000
  incomeTestPassed: boolean; // avg < €1,000,000
  qualifies: boolean; // Both tests passed
}

// ============================================================
// JURISDICTION DATA
// ============================================================

/**
 * Complete per-jurisdiction data for the ETR computation.
 * Each jurisdiction entry represents either a standard jurisdictional
 * grouping or a MOCE (separate computation under Art. 5.6).
 */
export interface JurisdictionEntry {
  id: string;
  jurisdiction: string;
  label: string; // Display label, e.g. "Ireland (Main Group)"
  fiscalYear: number; // e.g. 2025 — determines SBIE transitional rates

  // --- Flags ---
  isMOCE: boolean;
  moceOwnershipPercent: number; // 0–100 if MOCE
  hasDeMinimisData: boolean;

  // --- Income (Step 2) ---
  accountingNetIncome: number; // Post-tax accounting net income
  coveredTaxAddBack: number; // Tax expense added back to arrive at FANI (Art. 3.1.2)
  incomeAdjustments: IncomeAdjustment[]; // Article 3.2 adjustments

  // --- Covered Taxes (Step 3) ---
  coveredTaxEntries: CoveredTaxEntry[];

  // --- Substance (for SBIE) ---
  eligiblePayroll: number;
  tangibleAssetNBV: number;

  // --- De Minimis (optional) ---
  deMinimisData: DeMinimisData | null;

  // --- Notes ---
  notes: string;
}

// ============================================================
// COMPUTATION RESULTS (per jurisdiction)
// ============================================================

/** GloBE Income computation breakdown */
export interface GloBEIncomeResult {
  accountingNetIncome: number;
  coveredTaxAddBack: number;
  fani: number; // = accountingNetIncome + coveredTaxAddBack
  totalAdjustments: number; // Sum of Art. 3.2 adjustments
  globeIncome: number; // = fani + totalAdjustments
  adjustmentBreakdown: {
    category: AdjustmentCategory;
    description: string;
    amount: number;
    articleRef: string;
  }[];
}

/** Adjusted Covered Taxes computation breakdown */
export interface CoveredTaxResult {
  currentTaxTotal: number; // Sum of current tax entries
  currentAdjustments: number; // Credits, UTPs, etc.
  deferredTaxTotal: number; // Net DTL/DTA movements
  dtlCapAdjustment: number; // Amount exceeding 15% cap
  adjustedCoveredTaxes: number; // Final adjusted total
  entryBreakdown: {
    category: CoveredTaxCategory;
    description: string;
    amount: number;
    articleRef: string;
  }[];
}

/** SBIE computation breakdown */
export interface SBIEResult {
  payrollRate: number; // Transitional rate for the fiscal year (0–1)
  assetRate: number; // Transitional rate for the fiscal year (0–1)
  payrollCarveOut: number; // = payrollRate × eligiblePayroll
  assetCarveOut: number; // = assetRate × tangibleAssetNBV
  totalSBIE: number; // = payrollCarveOut + assetCarveOut
}

/** Top-up tax computation breakdown */
export interface TopUpTaxResult {
  etr: number; // = adjustedCoveredTaxes / globeIncome (0–1)
  etrDisplay: number; // ETR as percentage (0–100)
  topUpTaxPercentage: number; // = max(0, 15% − ETR)
  sbie: SBIEResult;
  excessProfit: number; // = max(0, globeIncome − sbie)
  topUpTaxAmount: number; // = topUpTaxPercentage × excessProfit
  isLowTaxed: boolean; // ETR < 15%
  isDeMinimisExcluded: boolean;
  deMinimisResult: DeMinimisResult | null;
}

/** Complete computation result for a single jurisdiction */
export interface JurisdictionResult {
  jurisdictionId: string;
  jurisdiction: string;
  label: string;
  isMOCE: boolean;
  moceOwnershipPercent: number;
  income: GloBEIncomeResult;
  tax: CoveredTaxResult;
  topUpTax: TopUpTaxResult;
}

// ============================================================
// MULTI-JURISDICTION SUMMARY
// ============================================================

/** Summary row for the multi-jurisdiction comparison view */
export interface JurisdictionSummaryRow {
  jurisdiction: string;
  label: string;
  globeIncome: number;
  adjustedCoveredTaxes: number;
  etr: number; // As percentage (0–100)
  sbie: number;
  excessProfit: number;
  topUpTaxPercent: number; // As percentage
  topUpTaxAmount: number;
  status: 'ABOVE_MINIMUM' | 'BELOW_MINIMUM' | 'DE_MINIMIS' | 'MOCE';
  isMOCE: boolean;
}

/** Complete computation results across all jurisdictions */
export interface ComputationResult {
  jurisdictionResults: JurisdictionResult[];
  summaryRows: JurisdictionSummaryRow[];
  totalGloBEIncome: number;
  totalCoveredTaxes: number;
  totalTopUpTax: number;
  totalSBIE: number;
  lowTaxedCount: number;
  aboveMinimumCount: number;
  deMinimisCount: number;
  moceCount: number;
}

// ============================================================
// SCENARIO COMPARISON
// ============================================================

/** A scenario represents one set of computation results */
export interface Scenario {
  id: string;
  name: string;
  description: string;
  result: ComputationResult;
}

// ============================================================
// WIZARD STEPS
// ============================================================

export type EtrStep =
  | 'JURISDICTION_SETUP'
  | 'GLOBE_INCOME'
  | 'COVERED_TAXES'
  | 'ETR_TOPUP'
  | 'RESULTS';

export interface StepConfig {
  key: EtrStep;
  label: string;
  shortLabel: string;
  articleRef: string;
}

// ============================================================
// COMPONENT PROPS
// ============================================================

export interface SavedComputation {
  id: string;
  name: string;
  fiscalYear: number;
  jurisdictions: JurisdictionEntry[];
  updatedAt: Date;
}

export interface EtrCalculatorProps {
  userId?: string;
  onSave?: (
    data: Omit<SavedComputation, 'id' | 'updatedAt'>
  ) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedComputation[];
  onTrackCalculation?: (
    stepName: string,
    metadata?: Record<string, unknown>
  ) => void;
  onTrackStepChange?: (
    fromStep: number | string,
    toStep: number | string
  ) => void;
  onTrackError?: (
    errorMessage: string,
    context?: Record<string, unknown>
  ) => void;
  onTrackCompletion?: (metadata?: Record<string, unknown>) => void;
}

// ============================================================
// UI HELPER TYPES
// ============================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
