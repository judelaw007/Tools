// Safe Harbour Qualifier Types

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// Transition rates for Simplified ETR test (2024-2026)
export interface TransitionRate {
  year: number;
  rate: number;
}

// De Minimis Test Data
export interface DeMinimisData {
  totalRevenue: string;
  profitBeforeTax: string;
}

export interface DeMinimisResult {
  revenueThreshold: number;
  profitThreshold: number;
  meetsRevenue: boolean;
  meetsProfit: boolean;
  qualifies: boolean;
}

// Simplified ETR Test Data
export interface SimplifiedETRData {
  simplifiedCoveredTaxes: string;
  profitBeforeTax: string;
}

export interface SimplifiedETRResult {
  calculatedETR: number;
  transitionRate: number;
  qualifies: boolean;
  status: 'ABOVE_THRESHOLD' | 'BELOW_THRESHOLD' | 'LOSS_MAKING';
}

// Routine Profits Test Data
export interface RoutineProfitsData {
  profitBeforeTax: string;
  eligiblePayroll: string;
  tangibleAssets: string;
}

export interface RoutineProfitsResult {
  sbiePayroll: number;
  sbieAssets: number;
  totalSBIE: number;
  profitExceedsSBIE: boolean;
  qualifies: boolean;
}

// Overall Safe Harbour Result
export interface SafeHarbourResult {
  deMinimis: DeMinimisResult | null;
  simplifiedETR: SimplifiedETRResult | null;
  routineProfits: RoutineProfitsResult | null;
  overallQualifies: boolean;
  qualifyingTest: 'de_minimis' | 'simplified_etr' | 'routine_profits' | null;
}

// Saved Assessment
export interface SavedAssessment {
  id: string;
  mneName: string;
  jurisdiction: string;
  fiscalYear: string;
  currency: string;
  deMinimisData: DeMinimisData;
  simplifiedETRData: SimplifiedETRData;
  routineProfitsData: RoutineProfitsData;
  result: SafeHarbourResult | null;
  updatedAt: Date;
}

// Component Props
export interface SafeHarbourQualifierProps {
  userId?: string;
  onSave?: (data: Omit<SavedAssessment, 'id' | 'updatedAt'>) => Promise<string>;
  onLoad?: (id: string) => Promise<SavedAssessment | null>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedAssessment[];
}
