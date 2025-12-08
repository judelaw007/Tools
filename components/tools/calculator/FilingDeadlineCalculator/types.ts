// Filing Deadline Calculator Types

export interface Jurisdiction {
  code: string;
  name: string;
  authority: string;
  portal: string;
  notes: string[];
}

export interface FormData {
  fiscal_year_end: string;
  filing_jurisdiction: string;
  upe_location: string;
  is_first_filing: 'yes' | 'no';
}

export interface Milestone {
  name: string;
  monthsPrior: number;
  desc: string;
  isDeadline?: boolean;
  date: string;
  daysAway: number;
  status: 'PENDING' | 'OVERDUE' | 'TODAY' | 'URGENT';
}

export interface CalculationResult {
  fyEnd: string;
  standardDeadline: string;
  applicableDeadline: string;
  isFirst: boolean;
  daysRemaining: number;
  jurisdiction: Jurisdiction;
  milestones: Milestone[];
}

export interface SavedDeadlineCalculation {
  id: string;
  mneName: string;
  formData: FormData;
  result: CalculationResult | null;
  updatedAt: Date;
}

export interface FilingDeadlineCalculatorProps {
  userId?: string;
  onSave?: (data: Omit<SavedDeadlineCalculation, 'id' | 'updatedAt'>) => Promise<string>;
  onLoad?: (id: string) => Promise<SavedDeadlineCalculation | null>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedDeadlineCalculation[];
}
