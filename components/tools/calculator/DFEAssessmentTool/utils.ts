// DFE Assessment Tool Utilities

import type {
  DFECandidate,
  PillarTwoStatus,
  RecommendationStatus,
  SelectOption,
} from './types';

// --- Constants & Reference Data ---

export const PILLAR_TWO_STATUS_OPTIONS: SelectOption[] = [
  { value: 'FULL', label: 'IIR Effective (Full)', score: 20 },
  { value: 'PARTIAL', label: 'Partial Implementation', score: 10 },
  { value: 'ANNOUNCED', label: 'Announced (Not Effective)', score: 5 },
  { value: 'NONE', label: 'Not Implemented', score: 0 },
];

export const SYSTEMS_CAPABILITY_OPTIONS: SelectOption[] = [
  { value: 'ERP_INTEGRATED', label: 'ERP Integrated (Full Auto)', score: 14 },
  { value: 'SAP', label: 'SAP (Partial Auto)', score: 11 },
  { value: 'LOCAL_SYSTEM', label: 'Local System (Manual)', score: 7 },
  { value: 'LIMITED', label: 'Limited (Manual)', score: 3 },
];

export const ADVISOR_SUPPORT_OPTIONS: SelectOption[] = [
  { value: 'BIG4', label: 'Big 4 Engaged', score: 10 },
  { value: 'MID_TIER', label: 'Mid-Tier Firm', score: 7 },
  { value: 'LOCAL_FIRM', label: 'Local Firm', score: 4 },
  { value: 'NONE', label: 'No External Support', score: 0 },
];

export const JURISDICTIONS = [
  'United Kingdom',
  'Ireland',
  'Netherlands',
  'Germany',
  'France',
  'Switzerland',
  'United States',
  'Australia',
  'Japan',
  'Singapore',
  'Canada',
  'Luxembourg',
  'Spain',
  'Italy',
  'Belgium',
];

export const INITIAL_MNE_INFO = {
  mneGroupName: '',
  upeJurisdiction: '',
  upeLocalFiling: false,
  totalJurisdictions: 0,
  fiscalYear: new Date().getFullYear(),
};

export const INITIAL_CANDIDATE: DFECandidate = {
  id: '',
  entityName: '',
  jurisdiction: '',
  isUPE: false,
  pillarTwoStatus: 'FULL',
  taxTeamSize: 1,
  systemsCapability: 'LOCAL_SYSTEM',
  advisorSupport: 'NONE',
  dataAvailability: 3,
  hasGIRExperience: false,
};

// --- Case Study Data ---

export const CASE_STUDY_MNE_INFO = {
  mneGroupName: 'GlobalTech Manufacturing Group',
  upeJurisdiction: 'United Kingdom',
  upeLocalFiling: true,
  totalJurisdictions: 20,
  fiscalYear: 2024,
};

export const CASE_STUDY_CANDIDATES: DFECandidate[] = [
  {
    id: 'c1',
    entityName: 'GlobalTech Manufacturing Ltd',
    jurisdiction: 'United Kingdom',
    isUPE: true,
    pillarTwoStatus: 'FULL',
    taxTeamSize: 8,
    systemsCapability: 'ERP_INTEGRATED',
    advisorSupport: 'BIG4',
    dataAvailability: 5,
    hasGIRExperience: false,
  },
  {
    id: 'c2',
    entityName: 'GlobalTech Europe BV',
    jurisdiction: 'Netherlands',
    isUPE: false,
    pillarTwoStatus: 'FULL',
    taxTeamSize: 3,
    systemsCapability: 'LOCAL_SYSTEM',
    advisorSupport: 'LOCAL_FIRM',
    dataAvailability: 3,
    hasGIRExperience: false,
  },
  {
    id: 'c3',
    entityName: 'GlobalTech GmbH',
    jurisdiction: 'Germany',
    isUPE: false,
    pillarTwoStatus: 'FULL',
    taxTeamSize: 4,
    systemsCapability: 'SAP',
    advisorSupport: 'MID_TIER',
    dataAvailability: 3,
    hasGIRExperience: false,
  },
  {
    id: 'c4',
    entityName: 'GT IP Holdings Ltd',
    jurisdiction: 'Ireland',
    isUPE: false,
    pillarTwoStatus: 'FULL',
    taxTeamSize: 1,
    systemsCapability: 'LIMITED',
    advisorSupport: 'NONE',
    dataAvailability: 2,
    hasGIRExperience: false,
  },
];

// --- Scoring Logic ---

export function calculateScore(candidate: DFECandidate): number {
  let score = 0;

  // 1. UPE Status (Max 25)
  if (candidate.isUPE) score += 25;

  // 2. Pillar Two Status (Max 20)
  const p2 = PILLAR_TWO_STATUS_OPTIONS.find(
    (o) => o.value === candidate.pillarTwoStatus
  );
  if (p2) score += p2.score;

  // 3. Tax Team Resources (Max 20)
  const size = candidate.taxTeamSize || 0;
  if (size >= 8) score += 18;
  else if (size >= 5) score += 14;
  else if (size >= 3) score += 10;
  else if (size >= 1) score += 5;

  // 4. Systems Capability (Max 15)
  const sys = SYSTEMS_CAPABILITY_OPTIONS.find(
    (o) => o.value === candidate.systemsCapability
  );
  if (sys) score += sys.score;

  // 5. Advisor Support (Max 10)
  const adv = ADVISOR_SUPPORT_OPTIONS.find(
    (o) => o.value === candidate.advisorSupport
  );
  if (adv) score += adv.score;

  // 6. Filing Experience (Max 10)
  if (candidate.hasGIRExperience) score += 10;
  else score += 5;

  return Math.min(100, score);
}

export interface RecommendationResult {
  status: RecommendationStatus;
  color: string;
  bg: string;
}

export function determineRecommendationStatus(
  score: number,
  p2Status: PillarTwoStatus,
  isTopScorer: boolean
): RecommendationResult {
  const isImplemented = ['FULL', 'PARTIAL'].includes(p2Status);

  if (isTopScorer && score >= 70 && isImplemented) {
    return {
      status: 'RECOMMENDED',
      color: 'text-green-600',
      bg: 'bg-green-100',
    };
  } else if (score >= 50) {
    return {
      status: 'ALTERNATIVE',
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    };
  } else {
    return {
      status: 'NOT RECOMMENDED',
      color: 'text-red-600',
      bg: 'bg-red-100',
    };
  }
}

export function getOptionLabel(
  options: SelectOption[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label || value;
}
