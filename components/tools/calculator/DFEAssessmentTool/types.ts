// DFE Assessment Tool Types

export interface MNEInfo {
  mneGroupName: string;
  upeJurisdiction: string;
  upeLocalFiling: boolean;
  totalJurisdictions: number;
  fiscalYear: number;
}

export interface DFECandidate {
  id: string;
  entityName: string;
  jurisdiction: string;
  isUPE: boolean;
  pillarTwoStatus: PillarTwoStatus;
  taxTeamSize: number;
  systemsCapability: SystemsCapability;
  advisorSupport: AdvisorSupport;
  dataAvailability: number;
  hasGIRExperience: boolean;
}

export type PillarTwoStatus = 'FULL' | 'PARTIAL' | 'ANNOUNCED' | 'NONE';
export type SystemsCapability = 'ERP_INTEGRATED' | 'SAP' | 'LOCAL_SYSTEM' | 'LIMITED';
export type AdvisorSupport = 'BIG4' | 'MID_TIER' | 'LOCAL_FIRM' | 'NONE';

export type RecommendationStatus = 'RECOMMENDED' | 'ALTERNATIVE' | 'NOT RECOMMENDED';

export interface ScoredCandidate extends DFECandidate {
  score: number;
  status: RecommendationStatus;
  color: string;
  bg: string;
}

export interface SavedDFEAssessment {
  id: string;
  name: string;
  mneInfo: MNEInfo;
  candidates: DFECandidate[];
  updatedAt: Date;
}

export interface DFEAssessmentToolProps {
  userId?: string;
  onSave?: (data: Omit<SavedDFEAssessment, 'id' | 'updatedAt'>) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedDFEAssessment[];
}

export interface SelectOption {
  value: string;
  label: string;
  score: number;
}
