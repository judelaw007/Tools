// T-SHQ: Transitional CbCR Safe Harbour Assessment — Type Definitions

// ============================================================
// FISCAL YEAR AND RATES
// ============================================================

/** Fiscal years covered by the transitional safe harbour */
export type SafeHarbourFiscalYear = 2024 | 2025 | 2026 | 2027;

/** Transition rate for the Simplified ETR test */
export interface TransitionRate {
  year: SafeHarbourFiscalYear;
  etrRate: number; // Percentage (e.g. 16 = 16%)
  sbiePayrollRate: number; // Percentage (e.g. 9.6 = 9.6%)
  sbieAssetRate: number; // Percentage (e.g. 7.6 = 7.6%)
}

/** Currency option */
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// ============================================================
// JURISDICTION CbCR DATA
// ============================================================

/**
 * CbCR data for a single jurisdiction.
 * Field names match OECD CbCR Table 2 columns.
 */
export interface JurisdictionCbCRData {
  id: string;
  jurisdiction: string;
  revenue: number; // CbCR Table 2, Col. 3 — Total revenue
  profitBeforeTax: number; // CbCR Table 2, Col. 4 — Profit (Loss) Before Tax (can be negative)
  incomeTaxAccrued: number; // CbCR Table 2, Col. 5 — Income Tax Accrued, Current Year
  employeeCount: number; // CbCR Table 2, Col. 9 — Number of Employees
  employeeCompensation: number; // Total employee costs (salaries, social, pension, benefits)
  tangibleAssetsNBV: number; // CbCR Table 2, Col. 10 — Tangible Assets (Net Book Value)
}

// ============================================================
// TEST RESULTS
// ============================================================

/** Test 1: De Minimis (Article 9.1.2) */
export interface DeMinimisResult {
  revenueBelow: boolean; // Revenue < €10M
  profitBelow: boolean; // |Profit| < €1M
  qualifies: boolean; // Both conditions met
  revenue: number;
  profitAbs: number;
  revenueThreshold: number;
  profitThreshold: number;
  articleRef: string;
}

/** Test 2: Simplified ETR (Article 9.1.3) */
export interface SimplifiedETRResult {
  calculatedETR: number; // Percentage (e.g. 24.58)
  transitionRate: number; // Applicable rate for the fiscal year
  isLossMaking: boolean; // PBT ≤ 0 → automatic qualification
  qualifies: boolean; // ETR ≥ transition rate OR loss-making
  status: 'ABOVE_THRESHOLD' | 'BELOW_THRESHOLD' | 'LOSS_MAKING';
  articleRef: string;
}

/** Test 3: Routine Profits (Article 9.1.4) */
export interface RoutineProfitsResult {
  sbiePayroll: number; // Payroll rate × employee compensation
  sbieAssets: number; // Asset rate × tangible assets NBV
  totalSBIE: number; // Sum of payroll + asset components
  profitBeforeTax: number;
  isLossMaking: boolean; // PBT ≤ 0 → automatic qualification
  profitExceedsSBIE: boolean; // PBT > SBIE
  qualifies: boolean; // PBT ≤ SBIE OR loss-making
  payrollRate: number; // Rate used (for display)
  assetRate: number; // Rate used (for display)
  articleRef: string;
}

/** Overall safe harbour result for a single jurisdiction */
export interface JurisdictionAssessment {
  jurisdictionId: string;
  jurisdiction: string;
  deMinimis: DeMinimisResult;
  simplifiedETR: SimplifiedETRResult;
  routineProfits: RoutineProfitsResult;
  overallQualifies: boolean;
  qualifyingTest: 'DE_MINIMIS' | 'SIMPLIFIED_ETR' | 'ROUTINE_PROFITS' | null;
  cbcrETR: number | null; // Calculated CbCR ETR (null if loss-making)
}

/** Complete assessment result across all jurisdictions */
export interface AssessmentResult {
  groupName: string;
  fiscalYear: SafeHarbourFiscalYear;
  currency: string;
  jurisdictionAssessments: JurisdictionAssessment[];
  qualifyingCount: number;
  totalCount: number;
  qualifyingJurisdictions: string[];
  nonQualifyingJurisdictions: string[];
}

// ============================================================
// WIZARD STEPS
// ============================================================

export type SafeHarbourStep =
  | 'GROUP_INFO'
  | 'CBCR_DATA'
  | 'ASSESSMENT'
  | 'SUMMARY';

export interface StepConfig {
  key: SafeHarbourStep;
  label: string;
  shortLabel: string;
  articleRef: string;
}

// ============================================================
// COMPONENT PROPS
// ============================================================

export interface SavedAssessment {
  id: string;
  groupName: string;
  fiscalYear: SafeHarbourFiscalYear;
  currency: string;
  jurisdictions: JurisdictionCbCRData[];
  result: AssessmentResult | null;
  updatedAt: Date;
}

export interface SafeHarbourQualifierProps {
  userId?: string;
  onSave?: (
    data: Omit<SavedAssessment, 'id' | 'updatedAt'>
  ) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedAssessment[];
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
