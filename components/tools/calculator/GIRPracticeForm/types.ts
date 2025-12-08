// GIR Practice Form Types

export interface DataPoint {
  name: string;
  type: string;
  required: string;
  desc: string;
  erp: string;
  issues: string;
  calculated?: boolean;
}

export type DataPoints = Record<string, DataPoint>;

// Section 1: General Information
export interface Section1Data {
  mneGroupName: string;
  upeLegalName: string;
  upeJurisdiction: string;
  upeTaxId: string;
  lei: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  reportingCurrency: string;
  firstFiling: boolean;
  consolidatedRevenue: number;
  dfeName: string;
  dfeJurisdiction: string;
  dfeTaxId: string;
  filingType: 'ORIGINAL' | 'AMENDED';
  amendmentReason: string;
}

// Section 2: Entity Structure
export interface EntityData {
  id: string;
  name: string;
  internalId: string;
  jurisdiction: string;
  taxId: string;
  directParent: string;
  ownershipPct: number;
  ownershipType: string;
  controllingInterest: boolean;
  entityType: 'UPE' | 'CE' | 'PE' | 'JV' | 'MOCE';
  isExcluded: boolean;
  exclusionReason: string;
  popeStatus: boolean;
  investmentEntity: boolean;
}

// Section 3: Jurisdiction Calculation
export interface JurisdictionCalcData {
  jurisdiction: string;
  // 3.2 GloBE Income
  fani: number;
  netTaxes: number;
  excludedDividends: number;
  excludedEquity: number;
  disallowedExpenses: number;
  stockCompAdj: number;
  otherAdj: number;
  // 3.3 Covered Taxes
  currentTax: number;
  deferredTax: number;
  utpAdj: number;
  nonCoveredAdj: number;
  // 3.4 SBIE
  payrollCosts: number;
  tangibleAssets: number;
  // 3.5 Top-up
  qdmtt: number;
}

export interface JurisdictionCalcResult {
  globeIncome: number;
  adjustedCoveredTaxes: number;
  totalSBIE: number;
  etr: number;
  topUpTaxPct: number;
  excessProfit: number;
  grossTopUp: number;
  netTopUp: number;
}

// Case Study
export interface CaseStudy {
  name: string;
  section1: Section1Data;
  section2: EntityData[];
  section3: JurisdictionCalcData[];
}

// Saved Session
export interface SavedPracticeSession {
  id: string;
  name: string;
  section1: Section1Data;
  section2: EntityData[];
  section3: JurisdictionCalcData[];
  updatedAt: Date;
}

// Component Props
export interface GIRPracticeFormProps {
  userId?: string;
  onSave?: (data: Omit<SavedPracticeSession, 'id' | 'updatedAt'>) => Promise<string>;
  onLoad?: (id: string) => Promise<SavedPracticeSession | null>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedPracticeSession[];
}
