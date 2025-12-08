// GloBE Calculator Types

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface SBIERates {
  payroll: number;
  asset: number;
}

export type SBIERatesByYear = Record<number, SBIERates>;

// Step 1: ETR Calculation
export interface Step1Data {
  income: string;
  taxes: string;
}

export interface Step1Result {
  etr: number;
  topUpPct: number;
  status: 'COMPLIANT' | 'LOW_TAXED' | 'WARNING';
}

// Step 2: SBIE Calculation
export interface Step2Data {
  payroll: string;
  assets: string;
}

export interface Step2Result {
  rates: SBIERates;
  paySbie: number;
  astSbie: number;
  totalSbie: number;
}

// Step 3: Top-Up Tax Calculation
export interface Step3Data {
  qdmtt: string;
}

export interface Step3Result {
  excessProfit: number;
  grossTopUp: number;
  qdmttOffset: number;
  netTopUp: number;
  status: 'TOP_UP_DUE' | 'COMPLIANT' | 'NO_EXCESS' | 'QDMTT_OFFSET';
}

// Saved Calculation
export interface SavedCalculation {
  id: string;
  mneName: string;
  jurisdiction: string;
  fiscalYear: string;
  currency: string;
  s1Data: Step1Data;
  s1Result: Step1Result | null;
  s2Data: Step2Data;
  s2Result: Step2Result | null;
  s3Data: Step3Data;
  s3Result: Step3Result | null;
  unlockedSteps: number[];
  activeStep: number;
  updatedAt: Date;
}

// Component Props
export interface GloBECalculatorProps {
  userId?: string;
  onSave?: (data: Omit<SavedCalculation, 'id' | 'updatedAt'>) => Promise<string>;
  onLoad?: (id: string) => Promise<SavedCalculation | null>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedCalculation[];
}
