// T-GIR: GIR Practice Form — Type Definitions

// ============================================================
// WIZARD STEPS
// ============================================================

export type GIRStep =
  | 'GENERAL_INFO'
  | 'ENTITY_STRUCTURE'
  | 'SAFE_HARBOURS'
  | 'GLOBE_COMPUTATIONS'
  | 'FILING_SUMMARY';

export interface StepConfig {
  key: GIRStep;
  label: string;
  shortLabel: string;
  girSection: string;
  description: string;
}

// ============================================================
// SECTION 1: GENERAL INFORMATION
// ============================================================

export interface GeneralInformation {
  mneGroupName: string;
  upeLegalName: string;
  upeJurisdiction: string;
  upeTaxId: string;
  lei: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  reportingCurrency: string;
  isFirstFiling: boolean;
  consolidatedRevenue: number;
  yearsExceedingThreshold: number;
  dfeName: string;
  dfeJurisdiction: string;
  dfeTaxId: string;
  filingType: 'ORIGINAL' | 'AMENDED';
  amendmentReason: string;
}

// ============================================================
// SECTION 2: ENTITY STRUCTURE
// ============================================================

export type EntityClassification =
  | 'UPE'
  | 'IPE'
  | 'CE'
  | 'POPE'
  | 'MOCE'
  | 'JV'
  | 'IE'
  | 'PE'
  | 'EE';

export type ConsolidationMethod = 'FULL' | 'PROPORTIONAL' | 'EQUITY';

export interface EntityEntry {
  id: string;
  entityName: string;
  internalId: string;
  jurisdiction: string;
  taxId: string;
  directParentId: string;
  ownershipPercent: number;
  classification: EntityClassification;
  isExcluded: boolean;
  exclusionReason: string;
  consolidationMethod: ConsolidationMethod;
  isPE: boolean;
  isFlowThrough: boolean;
  acquisitionDate: string;
  notes: string;
}

// ============================================================
// SECTION 3A: SAFE HARBOUR ELECTIONS
// ============================================================

export type SafeHarbourElection =
  | 'NONE'
  | 'CBCR_TRANSITIONAL'
  | 'QDMTT_SAFE_HARBOUR';

export type SafeHarbourTestResult =
  | 'NOT_TESTED'
  | 'DE_MINIMIS'
  | 'SIMPLIFIED_ETR'
  | 'ROUTINE_PROFITS'
  | 'FAILED';

export interface SafeHarbourEntry {
  id: string;
  jurisdiction: string;
  electionType: SafeHarbourElection;
  cbcrRevenue: number;
  cbcrPBT: number;
  cbcrTaxAccrued: number;
  cbcrEmployees: number;
  cbcrTangibleAssets: number;
  isDeMinimisEligible: boolean;
  deMinimisRevenue3YrAvg: number;
  deMinimisIncome3YrAvg: number;
  isTransitionYear: boolean;
  notes: string;
}

export interface SafeHarbourResult {
  jurisdiction: string;
  deMinimisPass: boolean;
  simplifiedETR: number;
  simplifiedETRPass: boolean;
  routineProfitsSBIE: number;
  routineProfitsPass: boolean;
  overallResult: SafeHarbourTestResult;
  qualifies: boolean;
  reason: string;
}

// ============================================================
// SECTION 3B: GLOBE COMPUTATIONS
// ============================================================

export type ChargingMechanism =
  | 'QDMTT'
  | 'IIR'
  | 'UTPR'
  | 'SAFE_HARBOUR'
  | 'DE_MINIMIS'
  | 'ABOVE_MINIMUM'
  | 'NONE';

export interface JurisdictionComputation {
  id: string;
  jurisdiction: string;
  label: string;
  ceCount: number;

  // GloBE Income inputs (Article 3.2)
  fani: number;
  netTaxesExcluded: number;
  excludedDividends: number;
  excludedEquityGains: number;
  policyDisallowed: number;
  stockCompAdj: number;
  otherAdjustments: number;

  // Covered Taxes inputs (Article 4.1–4.4)
  currentTaxExpense: number;
  deferredTaxAdj: number;
  dtlCapAdj: number;
  utpAdj: number;
  nonCoveredTaxAdj: number;

  // SBIE inputs (Article 5.3)
  eligiblePayroll: number;
  tangibleAssetsNBV: number;

  // Top-Up Tax adjustments
  qdmmtAmount: number;

  // Flags
  safeHarbourApplied: boolean;
  deMinimisApplied: boolean;
  isMOCE: boolean;
  moceOwnershipPercent: number;

  // Charging mechanism
  chargingMechanism: ChargingMechanism;
}

// ============================================================
// COMPUTATION RESULTS (CALCULATED)
// ============================================================

export interface JurisdictionResult {
  jurisdiction: string;
  label: string;
  globeIncome: number;
  adjustedCoveredTaxes: number;
  etr: number;
  payrollSBIE: number;
  assetSBIE: number;
  totalSBIE: number;
  excessProfit: number;
  topUpTaxPercent: number;
  grossTopUpTax: number;
  qdmmtOffset: number;
  netTopUpTax: number;
  isBelowMinimum: boolean;
  chargingMechanism: ChargingMechanism;
  safeHarbourApplied: boolean;
  deMinimisApplied: boolean;
}

export interface FilingSummary {
  totalJurisdictions: number;
  totalCEs: number;
  excludedEntities: number;
  safeHarbourCount: number;
  deMinimisCount: number;
  aboveMinimumCount: number;
  requiresComputationCount: number;
  totalGrossTopUpTax: number;
  totalQDMTT: number;
  totalIIR: number;
  totalNetTopUpTax: number;
  filingDeadline: string;
  filingDeadlineDays: number;
  jurisdictionResults: JurisdictionResult[];
}

// ============================================================
// DATA POINT DEFINITION
// ============================================================

export interface DataPointDefinition {
  name: string;
  description: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'calculated';
  required: boolean;
  calculated: boolean;
  articleRef: string;
  erpSource: string;
  commonIssues: string;
}

// ============================================================
// COMPONENT PROPS
// ============================================================

export interface SavedGIRSession {
  id: string;
  name: string;
  generalInfo: GeneralInformation;
  entities: EntityEntry[];
  safeHarbours: SafeHarbourEntry[];
  computations: JurisdictionComputation[];
  updatedAt: Date;
}

export interface GirPracticeFormProps {
  userId?: string;
  onSave?: (
    data: Omit<SavedGIRSession, 'id' | 'updatedAt'>
  ) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedGIRSession[];
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
