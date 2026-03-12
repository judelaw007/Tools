// T-SDT: Scope Determination Decision Tree — Type Definitions

// --- Revenue Threshold (Article 1.1.1) ---

export interface RevenueYear {
  fiscalYear: number;
  revenueLocal: number; // Revenue in group's reporting currency
  exchangeRate: number; // Reporting currency → EUR rate
  revenueEUR: number; // Calculated: revenueLocal × exchangeRate
  meetsThreshold: boolean; // Calculated: revenueEUR ≥ 750,000,000
}

// --- Group Information ---

export type AccountingStandard = 'IFRS' | 'US_GAAP' | 'LOCAL_GAAP' | 'OTHER';

export interface GroupInfo {
  groupName: string;
  upeJurisdiction: string;
  reportingCurrency: string;
  accountingStandard: AccountingStandard;
  fiscalYearEnd: string; // e.g. "31 December"
  testingFiscalYear: number; // FY being assessed for scope
}

// --- Entity Classification (Articles 1.2–1.5) ---

/** CE sub-types under Articles 1.2–1.4 */
export type CEType =
  | 'UPE' // Ultimate Parent Entity (Art. 1.4)
  | 'IPE' // Intermediate Parent Entity (Art. 2.1.2)
  | 'PE' // Permanent Establishment (Art. 1.3.1)
  | 'TTE' // Tax Transparent Entity (Art. 3.5)
  | 'MOCE' // Minority-Owned CE (Art. 5.6) — ownership < 30%
  | 'OPERATING'; // Standard operating subsidiary

/** Excluded Entity reasons under Article 1.5.1 */
export type ExcludedReason =
  | 'GOVERNMENT_ENTITY' // Art. 1.5.1(a)
  | 'INTERNATIONAL_ORG' // Art. 1.5.1(b)
  | 'NPO' // Art. 1.5.1(c)
  | 'PENSION_FUND' // Art. 1.5.1(d)
  | 'INVESTMENT_FUND_UPE' // Art. 1.5.1(e)
  | 'REIV_UPE'; // Art. 1.5.1(f)

/** Reasons an entity is outside GloBE scope entirely */
export type OutOfScopeReason =
  | 'EQUITY_METHOD' // Not consolidated — equity method investment
  | 'NOT_CONSOLIDATED'; // Not part of consolidated group

/** Classification status for each entity */
export type ClassificationStatus =
  | 'CE'
  | 'EXCLUDED'
  | 'OUT_OF_SCOPE'
  | 'UNCLASSIFIED';

export interface EntityClassification {
  status: ClassificationStatus;
  ceType?: CEType;
  excludedReason?: ExcludedReason;
  outOfScopeReason?: OutOfScopeReason;
  articleReference?: string;
  rationale?: string;
}

// --- Entity ---

export interface Entity {
  id: string;
  entityName: string;
  jurisdiction: string;
  ownershipPercent: number; // 0–100
  parentEntityId: string | null; // ID of direct parent entity
  isUPE: boolean;
  isDFE: boolean;
  isPE: boolean; // Is this a Permanent Establishment?
  peOfEntityId: string | null; // If PE, which entity is it a PE of?
  classification: EntityClassification;
  notes: string;
}

// --- Scope Determination Result ---

export interface ScopeResult {
  inScope: boolean;
  yearsExceeding: number;
  totalYearsTested: number;
  revenueYears: RevenueYear[];
  constituentEntities: Entity[];
  excludedEntities: Entity[];
  outOfScopeEntities: Entity[];
  upeEntity: Entity | null;
  dfeEntity: Entity | null;
  totalCEs: number;
  jurisdictionCount: number;
  jurisdictions: string[];
}

// --- Decision Tree Steps ---

export type DecisionStep =
  | 'GROUP_INFO'
  | 'REVENUE_TEST'
  | 'ENTITY_REGISTER'
  | 'ENTITY_CLASSIFICATION'
  | 'RESULTS';

// --- Component Props ---

export interface SavedScopeAssessment {
  id: string;
  name: string;
  groupInfo: GroupInfo;
  revenueYears: RevenueYear[];
  entities: Entity[];
  updatedAt: Date;
}

export interface ScopeDecisionTreeProps {
  userId?: string;
  onSave?: (
    data: Omit<SavedScopeAssessment, 'id' | 'updatedAt'>
  ) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedScopeAssessment[];
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

// --- UI Helper Types ---

export interface SelectOption {
  value: string;
  label: string;
}

export interface StepConfig {
  key: DecisionStep;
  label: string;
  shortLabel: string;
  articleRef: string;
}
