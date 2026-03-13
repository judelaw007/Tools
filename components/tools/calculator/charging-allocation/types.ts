// T-CMA: Charging Mechanism Allocation Workbench — Type Definitions

// ============================================================
// JURISDICTION IMPLEMENTATION STATUS
// ============================================================

/** Pillar Two implementation status for a jurisdiction */
export interface JurisdictionImplementation {
  hasIIR: boolean;
  hasUTPR: boolean;
  hasQDMTT: boolean;
  qdmmtEffective?: string; // e.g. "1 Jan 2024"
  iirEffective?: string;
  utprEffective?: string;
}

// ============================================================
// OWNERSHIP CHAIN ENTITIES
// ============================================================

/** Classification of an entity in the ownership chain */
export type ChainEntityType = 'UPE' | 'IPE' | 'OPERATING' | 'MOCE';

/** An entity in the simplified ownership chain for charging mechanism tracing */
export interface ChainEntity {
  id: string;
  entityName: string;
  jurisdiction: string;
  ownershipPercent: number; // Direct ownership by parent (0–100)
  parentEntityId: string | null;
  isUPE: boolean;
  isIPE: boolean;
  isMOCE: boolean; // Ownership < 30%
  entityType: ChainEntityType;
  notes: string;
}

// ============================================================
// JURISDICTIONAL DATA
// ============================================================

/**
 * Per-jurisdiction data for the allocation computation.
 * A single jurisdiction may have multiple entries if it contains
 * both standard CEs and a MOCE (separate computation under Art. 5.6).
 */
export interface JurisdictionData {
  id: string;
  jurisdiction: string;
  label: string; // Display label, e.g. "Ireland (Main Group)" vs "Ireland (Atlas — MOCE)"
  isLowTaxed: boolean; // Has top-up tax to allocate
  topUpTaxAmount: number; // Total top-up tax for this jurisdiction/entry
  qdmmtAmount: number; // QDMTT already collected domestically
  employeeCount: number; // For UTPR allocation formula
  tangibleAssetNBV: number; // For UTPR allocation formula
  hasIIR: boolean; // Overridable for what-if scenarios
  hasUTPR: boolean;
  hasQDMTT: boolean;
  entityIds: string[]; // Which chain entities are in this jurisdiction
  isMOCE: boolean; // True if this entry is for a MOCE
  moceOwnershipPercent: number; // Effective ownership % if MOCE (0 otherwise)
}

// ============================================================
// ALLOCATION RESULTS
// ============================================================

/** Round 1: QDMTT offset for a single low-taxed jurisdiction */
export interface QDMTTOffsetEntry {
  jurisdictionLabel: string;
  topUpTax: number;
  qdmmtCollected: number;
  remaining: number;
  articleRef: string;
}

/** Round 2: IIR allocation for a single low-taxed jurisdiction */
export interface IIRAllocationEntry {
  jurisdictionLabel: string;
  topUpTax: number;
  qdmmtOffset: number;
  remaining: number;
  collectingEntityName: string;
  collectingJurisdiction: string;
  effectiveOwnershipPercent: number; // Effective ownership through chain (0–100)
  allocableShare: number; // 1.0 for standard CEs, <1.0 for MOCE
  iirAmount: number;
  nonAllocable: number; // MOCE: portion for outside shareholders
  residualToUTPR: number; // Passes to UTPR if no IIR in chain
  articleRef: string;
}

/** Round 3: UTPR allocation for a single UTPR jurisdiction */
export interface UTPRAllocationEntry {
  jurisdiction: string;
  employeeCount: number;
  employeeShare: number; // employees / total employees (0–1)
  tangibleAssetNBV: number;
  assetShare: number; // assets / total assets (0–1)
  allocationPercent: number; // (50% × empShare) + (50% × assetShare)
  utprAmount: number;
}

/** Per-jurisdiction summary row */
export interface JurisdictionSummary {
  jurisdiction: string;
  label: string;
  topUpTax: number;
  qdmtt: number;
  iir: number;
  utpr: number;
  nonAllocable: number;
  primaryMechanism: 'QDMTT' | 'IIR' | 'UTPR' | 'MIXED' | 'NONE' | 'DE_MINIMIS';
}

/** Complete allocation result */
export interface AllocationResult {
  totalTopUpTax: number;
  totalQDMTT: number;
  totalIIR: number;
  totalUTPR: number;
  totalNonAllocable: number;
  residualForUTPR: number;
  qdmmtEntries: QDMTTOffsetEntry[];
  iirEntries: IIRAllocationEntry[];
  utprEntries: UTPRAllocationEntry[];
  jurisdictionSummaries: JurisdictionSummary[];
  iirCollectingEntity: string | null; // Entity name that collects IIR (typically UPE)
  iirCollectingJurisdiction: string | null;
}

// ============================================================
// WIZARD STEPS
// ============================================================

export type AllocationStep =
  | 'GROUP_STRUCTURE'
  | 'JURISDICTION_DATA'
  | 'ALLOCATION_WATERFALL'
  | 'RESULTS';

export interface StepConfig {
  key: AllocationStep;
  label: string;
  shortLabel: string;
  articleRef: string;
}

// ============================================================
// COMPONENT PROPS
// ============================================================

export interface SavedAllocation {
  id: string;
  name: string;
  groupName: string;
  entities: ChainEntity[];
  jurisdictions: JurisdictionData[];
  updatedAt: Date;
}

export interface ChargingAllocationProps {
  userId?: string;
  onSave?: (
    data: Omit<SavedAllocation, 'id' | 'updatedAt'>
  ) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedAllocation[];
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
