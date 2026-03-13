// T-CMA: Charging Mechanism Allocation Workbench — Utilities

import type {
  JurisdictionImplementation,
  ChainEntity,
  ChainEntityType,
  JurisdictionData,
  QDMTTOffsetEntry,
  IIRAllocationEntry,
  UTPRAllocationEntry,
  JurisdictionSummary,
  AllocationResult,
  AllocationStep,
  StepConfig,
  SelectOption,
  ValidationError,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** MOCE ownership threshold (Article 5.6) — below 30% = MOCE */
export const MOCE_THRESHOLD_PERCENT = 30;

/** UTPR weighting: 50% employees, 50% tangible assets (Article 2.6.1) */
export const UTPR_EMPLOYEE_WEIGHT = 0.5;
export const UTPR_ASSET_WEIGHT = 0.5;

/** Minimum ETR — 15% (Article 5.2.2) */
export const MINIMUM_ETR = 0.15;

// ============================================================
// STEP CONFIGURATION
// ============================================================

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'GROUP_STRUCTURE',
    label: 'Group Structure',
    shortLabel: 'Structure',
    articleRef: 'Articles 2.1–2.3',
  },
  {
    key: 'JURISDICTION_DATA',
    label: 'Jurisdictional Data',
    shortLabel: 'Data',
    articleRef: 'Articles 2.4–2.6',
  },
  {
    key: 'ALLOCATION_WATERFALL',
    label: 'Allocation Waterfall',
    shortLabel: 'Allocation',
    articleRef: 'Articles 2.1–2.6',
  },
  {
    key: 'RESULTS',
    label: 'Results Summary',
    shortLabel: 'Results',
    articleRef: 'Articles 2.1–2.6',
  },
];

export const ALLOCATION_STEPS: AllocationStep[] = STEP_CONFIGS.map(
  (s) => s.key
);

// ============================================================
// JURISDICTION IMPLEMENTATION DATA
// ============================================================

/**
 * Pillar Two implementation status by jurisdiction.
 * Source: client-profile.md § 6 — Jurisdictional Tax Profile.
 */
export const JURISDICTION_IMPLEMENTATIONS: Record<
  string,
  JurisdictionImplementation
> = {
  'United Kingdom': {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  Germany: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  France: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  Netherlands: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  Ireland: {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: true,
    qdmmtEffective: '1 Jan 2024',
  },
  Singapore: {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: true,
    qdmmtEffective: '1 Jan 2025',
  },
  Luxembourg: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  'United States': {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: false,
  },
  'Cayman Islands': {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: false,
  },
  'Hong Kong': {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: false,
  },
  Australia: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  Japan: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Apr 2024',
    utprEffective: '1 Apr 2024',
    qdmmtEffective: '1 Apr 2024',
  },
  Belgium: {
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    iirEffective: '1 Jan 2024',
    utprEffective: '1 Jan 2024',
    qdmmtEffective: '1 Jan 2024',
  },
  Malaysia: {
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: false,
  },
};

/**
 * Look up implementation status for a jurisdiction.
 * Returns a default (all false) if not found.
 */
export function getJurisdictionImplementation(
  jurisdiction: string
): JurisdictionImplementation {
  return (
    JURISDICTION_IMPLEMENTATIONS[jurisdiction] ?? {
      hasIIR: false,
      hasUTPR: false,
      hasQDMTT: false,
    }
  );
}

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

export const JURISDICTIONS: SelectOption[] = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Belgium', label: 'Belgium' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Ireland', label: 'Ireland' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Hong Kong', label: 'Hong Kong' },
  { value: 'United States', label: 'United States' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Japan', label: 'Japan' },
  { value: 'Cayman Islands', label: 'Cayman Islands' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
];

export const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'UPE', label: 'Ultimate Parent Entity (Art. 1.4)' },
  { value: 'IPE', label: 'Intermediate Parent Entity (Art. 2.1.2)' },
  { value: 'OPERATING', label: 'Operating Subsidiary' },
  { value: 'MOCE', label: 'Minority-Owned CE (Art. 5.6)' },
];

// ============================================================
// EDUCATIONAL NOTES
// ============================================================

export const STEP_EDUCATIONAL_NOTES: Record<AllocationStep, string> = {
  GROUP_STRUCTURE:
    'The charging mechanism allocates top-up tax through the ownership chain. The IIR (Income Inclusion Rule) starts at the UPE and works downward — the UPE jurisdiction applies its IIR first, picking up the top-up tax proportional to its ownership in the low-taxed CE. If the UPE jurisdiction has not implemented the IIR, it cascades to Intermediate Parent Entities (IPEs) down the chain. Enter the key entities forming the ownership path from UPE to the low-taxed CEs.',
  JURISDICTION_DATA:
    'For each jurisdiction with entities in your group structure, enter the top-up tax amount (from the ETR Calculator), QDMTT already collected, and substance data (employees and tangible assets). The UTPR allocation formula under Article 2.6.1 uses a 50/50 weighting of employee headcount and tangible asset net book value. Only jurisdictions that have implemented the UTPR participate in the allocation.',
  ALLOCATION_WATERFALL:
    'The three-round ordering is mandatory under the GloBE Rules: (1) QDMTT applies first — domestic collection takes priority; (2) IIR applies to any remaining top-up tax — allocated through the ownership chain to the UPE or first IPE with IIR; (3) UTPR is the backstop — allocates any residual (after QDMTT and IIR) across UTPR jurisdictions using the substance formula. In practice, widespread QDMTT adoption means IIR and UTPR are often zero.',
  RESULTS:
    'The results show the net charging mechanism liability for each jurisdiction and the primary collection mechanism. The IIR collecting entity is typically the UPE (because its jurisdiction usually has IIR). For MOCEs, only the MNE Group\'s allocable share (based on ownership percentage) is subject to IIR/UTPR — the remainder belongs to outside shareholders and is not collected by any GloBE mechanism.',
};

export const MECHANISM_GUIDANCE: Record<string, string> = {
  QDMTT:
    'The Qualified Domestic Minimum Top-Up Tax (QDMTT) is a domestic tax enacted by the jurisdiction where the low-taxed CE is located. It applies first under Article 5.2.3 — before IIR or UTPR. The domestic jurisdiction collects the top-up tax itself, offsetting any IIR or UTPR liability. This is the preferred mechanism because it keeps the revenue in the source jurisdiction.',
  IIR:
    'The Income Inclusion Rule (IIR) under Article 2.1 requires the UPE to include the top-up tax in its own jurisdiction. The IIR allocation follows the ownership chain top-down: the UPE checks first, then IPEs cascade downward. The IIR amount equals the remaining top-up tax (after QDMTT) multiplied by the effective ownership percentage through the chain.',
  UTPR:
    'The Undertaxed Profits Rule (UTPR) under Article 2.4 is the backstop mechanism. It only applies to top-up tax that is NOT collected by QDMTT or IIR — typically because the UPE/IPE jurisdictions have not implemented IIR. The allocation uses a substance-based formula: 50% weighted by employee headcount + 50% by tangible asset net book value across all UTPR-implementing jurisdictions.',
  NON_ALLOCABLE:
    'For Minority-Owned Constituent Entities (MOCEs) under Article 5.6, only the MNE Group\'s proportional ownership share (allocable share) is subject to IIR or UTPR. The remaining portion attributable to outside shareholders is not collected by any GloBE mechanism. For example, if the UPE owns 28% of a MOCE, only 28% of the top-up tax is allocable.',
};

// ============================================================
// INITIAL STATE
// ============================================================

export const INITIAL_ENTITY: Omit<ChainEntity, 'id'> = {
  entityName: '',
  jurisdiction: '',
  ownershipPercent: 100,
  parentEntityId: null,
  isUPE: false,
  isIPE: false,
  isMOCE: false,
  entityType: 'OPERATING',
  notes: '',
};

export const INITIAL_JURISDICTION_DATA: Omit<JurisdictionData, 'id'> = {
  jurisdiction: '',
  label: '',
  isLowTaxed: false,
  topUpTaxAmount: 0,
  qdmmtAmount: 0,
  employeeCount: 0,
  tangibleAssetNBV: 0,
  hasIIR: false,
  hasUTPR: false,
  hasQDMTT: false,
  entityIds: [],
  isMOCE: false,
  moceOwnershipPercent: 0,
};

// ============================================================
// PURE FUNCTIONS — ID Generation
// ============================================================

export function generateEntityId(): string {
  return `CE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export function generateJurisdictionId(): string {
  return `JD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

// ============================================================
// PURE FUNCTIONS — Entity Helpers
// ============================================================

/**
 * Determine entity type from flags.
 */
export function resolveEntityType(entity: {
  isUPE: boolean;
  isIPE: boolean;
  isMOCE: boolean;
}): ChainEntityType {
  if (entity.isUPE) return 'UPE';
  if (entity.isIPE) return 'IPE';
  if (entity.isMOCE) return 'MOCE';
  return 'OPERATING';
}

/**
 * Check if an entity qualifies as MOCE (ownership < 30%).
 */
export function isMOCE(ownershipPercent: number): boolean {
  return ownershipPercent > 0 && ownershipPercent < MOCE_THRESHOLD_PERCENT;
}

/**
 * Compute effective ownership from a specific entity down to a target CE
 * by walking up from the target through the parent chain.
 *
 * Returns a value between 0 and 1.
 */
export function computeEffectiveOwnership(
  entities: ChainEntity[],
  fromEntityId: string,
  toEntityId: string
): number {
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  let current = entityMap.get(toEntityId);
  if (!current) return 0;

  // If from === to, it's the entity itself
  if (current.id === fromEntityId) return 1;

  let ownership = current.ownershipPercent / 100;

  while (current.parentEntityId && current.parentEntityId !== fromEntityId) {
    const parent = entityMap.get(current.parentEntityId);
    if (!parent) return 0;
    ownership *= parent.ownershipPercent / 100;
    current = parent;
  }

  // If we exited because parentEntityId === fromEntityId, we're done
  if (current.parentEntityId === fromEntityId) {
    return ownership;
  }

  // If we exited because parentEntityId is null and we didn't reach fromEntityId
  return 0;
}

/**
 * Find the IIR collecting entity for a given low-taxed jurisdiction.
 *
 * Traces from UPE downward (top-down approach per Article 2.1).
 * Returns the first entity in the chain (starting from UPE) whose
 * jurisdiction has IIR implemented.
 *
 * The jurisdictionLookup function resolves whether a jurisdiction has IIR.
 */
export function findIIRCollector(
  entities: ChainEntity[],
  targetEntityId: string,
  jurisdictionHasIIR: (jurisdiction: string) => boolean
): ChainEntity | null {
  // Build path from target CE up to UPE
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const pathFromCEToUPE: ChainEntity[] = [];

  let current = entityMap.get(targetEntityId);
  while (current) {
    pathFromCEToUPE.push(current);
    if (current.parentEntityId) {
      current = entityMap.get(current.parentEntityId);
    } else {
      break;
    }
  }

  // Reverse to get path from UPE down to CE
  const pathFromUPEToCE = [...pathFromCEToUPE].reverse();

  // Walk from UPE downward — first entity with IIR jurisdiction collects
  for (const entity of pathFromUPEToCE) {
    // Skip the low-taxed CE itself (it doesn't collect its own IIR)
    if (entity.id === targetEntityId) continue;
    if (jurisdictionHasIIR(entity.jurisdiction)) {
      return entity;
    }
  }

  return null;
}

/**
 * Build a list of child entity IDs for a given parent (recursive).
 */
export function getDescendantIds(
  entities: ChainEntity[],
  parentId: string
): string[] {
  const children = entities.filter((e) => e.parentEntityId === parentId);
  const result: string[] = [];
  for (const child of children) {
    result.push(child.id);
    result.push(...getDescendantIds(entities, child.id));
  }
  return result;
}

// ============================================================
// PURE FUNCTIONS — Allocation Computation
// ============================================================

/**
 * Compute the full three-round allocation.
 *
 * Round 1: QDMTT offsets
 * Round 2: IIR allocation
 * Round 3: UTPR allocation
 */
export function computeAllocation(
  entities: ChainEntity[],
  jurisdictions: JurisdictionData[]
): AllocationResult {
  const lowTaxed = jurisdictions.filter(
    (j) => j.isLowTaxed && j.topUpTaxAmount > 0
  );
  const utprJurisdictions = jurisdictions.filter(
    (j) => j.hasUTPR && !j.isLowTaxed
  );

  // --- Round 1: QDMTT ---
  const qdmmtEntries: QDMTTOffsetEntry[] = [];
  const afterQDMTT: { jur: JurisdictionData; remaining: number }[] = [];

  for (const jur of lowTaxed) {
    const qdmmtCollected =
      jur.hasQDMTT
        ? Math.min(jur.qdmmtAmount, jur.topUpTaxAmount)
        : 0;
    const remaining = jur.topUpTaxAmount - qdmmtCollected;

    qdmmtEntries.push({
      jurisdictionLabel: jur.label,
      topUpTax: jur.topUpTaxAmount,
      qdmmtCollected,
      remaining,
      articleRef:
        qdmmtCollected > 0
          ? 'Article 5.2.3 — QDMTT priority'
          : 'No QDMTT in this jurisdiction',
    });

    afterQDMTT.push({ jur, remaining });
  }

  // --- Round 2: IIR ---
  const iirEntries: IIRAllocationEntry[] = [];
  let totalIIR = 0;
  let totalNonAllocable = 0;
  let residualForUTPR = 0;
  let iirCollectingEntity: string | null = null;
  let iirCollectingJurisdiction: string | null = null;

  for (const { jur, remaining } of afterQDMTT) {
    if (remaining <= 0) {
      iirEntries.push({
        jurisdictionLabel: jur.label,
        topUpTax: jur.topUpTaxAmount,
        qdmmtOffset: jur.topUpTaxAmount - remaining,
        remaining: 0,
        collectingEntityName: 'N/A — fully offset by QDMTT',
        collectingJurisdiction: jur.jurisdiction,
        effectiveOwnershipPercent: 0,
        allocableShare: jur.isMOCE ? jur.moceOwnershipPercent / 100 : 1,
        iirAmount: 0,
        nonAllocable: 0,
        residualToUTPR: 0,
        articleRef: 'Article 5.2.3 — QDMTT fully offsets',
      });
      continue;
    }

    // Determine allocable share
    const allocableShare = jur.isMOCE
      ? jur.moceOwnershipPercent / 100
      : 1;
    const allocableAmount = roundTo2(remaining * allocableShare);
    const nonAllocable = roundTo2(remaining - allocableAmount);
    totalNonAllocable += nonAllocable;

    // Find collecting entity — use first entity in this jurisdiction to trace
    const jurisdictionEntityId = jur.entityIds[0];
    if (!jurisdictionEntityId) {
      // No entity mapped — everything to UTPR
      residualForUTPR += allocableAmount;
      iirEntries.push({
        jurisdictionLabel: jur.label,
        topUpTax: jur.topUpTaxAmount,
        qdmmtOffset: jur.topUpTaxAmount - remaining,
        remaining,
        collectingEntityName: 'None — no entity in chain',
        collectingJurisdiction: '',
        effectiveOwnershipPercent: 0,
        allocableShare,
        iirAmount: 0,
        nonAllocable,
        residualToUTPR: allocableAmount,
        articleRef: 'Article 2.4 — UTPR backstop',
      });
      continue;
    }

    // Build IIR lookup from jurisdiction data
    const jurisdictionHasIIR = (juris: string): boolean => {
      // Check if any jurisdiction data entry for this jurisdiction has IIR
      return jurisdictions.some(
        (j) => j.jurisdiction === juris && j.hasIIR
      );
    };

    const collector = findIIRCollector(
      entities,
      jurisdictionEntityId,
      jurisdictionHasIIR
    );

    if (collector) {
      const effectiveOwnership = computeEffectiveOwnership(
        entities,
        collector.id,
        jurisdictionEntityId
      );
      const iirAmount = allocableAmount;
      totalIIR += iirAmount;

      if (!iirCollectingEntity) {
        iirCollectingEntity = collector.entityName;
        iirCollectingJurisdiction = collector.jurisdiction;
      }

      iirEntries.push({
        jurisdictionLabel: jur.label,
        topUpTax: jur.topUpTaxAmount,
        qdmmtOffset: jur.topUpTaxAmount - remaining,
        remaining,
        collectingEntityName: collector.entityName,
        collectingJurisdiction: collector.jurisdiction,
        effectiveOwnershipPercent: roundTo2(effectiveOwnership * 100),
        allocableShare,
        iirAmount,
        nonAllocable,
        residualToUTPR: 0,
        articleRef: `Article 2.1.1 — IIR via ${collector.jurisdiction}`,
      });
    } else {
      // No IIR collector → UTPR
      residualForUTPR += allocableAmount;

      iirEntries.push({
        jurisdictionLabel: jur.label,
        topUpTax: jur.topUpTaxAmount,
        qdmmtOffset: jur.topUpTaxAmount - remaining,
        remaining,
        collectingEntityName: 'None — no IIR in ownership chain',
        collectingJurisdiction: '',
        effectiveOwnershipPercent: 0,
        allocableShare,
        iirAmount: 0,
        nonAllocable,
        residualToUTPR: allocableAmount,
        articleRef: 'Article 2.4 — UTPR backstop applies',
      });
    }
  }

  // --- Round 3: UTPR ---
  const utprEntries: UTPRAllocationEntry[] = [];
  let totalUTPR = 0;

  if (residualForUTPR > 0 && utprJurisdictions.length > 0) {
    const totalEmployees = utprJurisdictions.reduce(
      (sum, j) => sum + j.employeeCount,
      0
    );
    const totalAssets = utprJurisdictions.reduce(
      (sum, j) => sum + j.tangibleAssetNBV,
      0
    );

    for (const jur of utprJurisdictions) {
      const empShare =
        totalEmployees > 0 ? jur.employeeCount / totalEmployees : 0;
      const assetShare =
        totalAssets > 0 ? jur.tangibleAssetNBV / totalAssets : 0;
      const allocationPercent =
        UTPR_EMPLOYEE_WEIGHT * empShare + UTPR_ASSET_WEIGHT * assetShare;
      const utprAmount = roundTo2(residualForUTPR * allocationPercent);
      totalUTPR += utprAmount;

      utprEntries.push({
        jurisdiction: jur.jurisdiction,
        employeeCount: jur.employeeCount,
        employeeShare: empShare,
        tangibleAssetNBV: jur.tangibleAssetNBV,
        assetShare,
        allocationPercent,
        utprAmount,
      });
    }
  }

  // Handle UTPR rounding difference
  if (utprEntries.length > 0 && totalUTPR !== residualForUTPR) {
    const diff = roundTo2(residualForUTPR - totalUTPR);
    utprEntries[0].utprAmount = roundTo2(utprEntries[0].utprAmount + diff);
    totalUTPR = residualForUTPR;
  }

  // --- Jurisdiction Summaries ---
  const totalTopUpTax = lowTaxed.reduce(
    (sum, j) => sum + j.topUpTaxAmount,
    0
  );
  const totalQDMTT = qdmmtEntries.reduce(
    (sum, e) => sum + e.qdmmtCollected,
    0
  );

  const summaries: JurisdictionSummary[] = [];

  // Summaries for low-taxed jurisdictions (collection side)
  for (const entry of iirEntries) {
    const qdmmtEntry = qdmmtEntries.find(
      (q) => q.jurisdictionLabel === entry.jurisdictionLabel
    );
    const utprForJur = 0; // UTPR is collected BY other jurisdictions, not from low-taxed

    let primaryMechanism: JurisdictionSummary['primaryMechanism'] = 'NONE';
    const qdmmt = qdmmtEntry?.qdmmtCollected ?? 0;
    if (qdmmt > 0 && entry.iirAmount === 0) primaryMechanism = 'QDMTT';
    else if (entry.iirAmount > 0 && qdmmt === 0) primaryMechanism = 'IIR';
    else if (qdmmt > 0 && entry.iirAmount > 0) primaryMechanism = 'MIXED';
    else if (entry.topUpTax === 0) primaryMechanism = 'DE_MINIMIS';

    summaries.push({
      jurisdiction: entry.collectingJurisdiction || entry.jurisdictionLabel,
      label: entry.jurisdictionLabel,
      topUpTax: entry.topUpTax,
      qdmtt: qdmmt,
      iir: entry.iirAmount,
      utpr: utprForJur,
      nonAllocable: entry.nonAllocable,
      primaryMechanism,
    });
  }

  return {
    totalTopUpTax,
    totalQDMTT,
    totalIIR,
    totalUTPR,
    totalNonAllocable,
    residualForUTPR,
    qdmmtEntries,
    iirEntries,
    utprEntries,
    jurisdictionSummaries: summaries,
    iirCollectingEntity,
    iirCollectingJurisdiction,
  };
}

// ============================================================
// PURE FUNCTIONS — Jurisdiction Auto-Population
// ============================================================

/**
 * Generate jurisdiction data entries from the entity list.
 * Groups entities by jurisdiction, with separate entries for MOCEs.
 */
export function generateJurisdictionData(
  entities: ChainEntity[]
): JurisdictionData[] {
  const result: JurisdictionData[] = [];
  const grouped = new Map<string, ChainEntity[]>();

  // Group entities by jurisdiction, separating MOCEs
  for (const entity of entities) {
    if (!entity.jurisdiction) continue;

    if (entity.isMOCE) {
      // MOCE gets its own entry
      const key = `${entity.jurisdiction}__MOCE__${entity.id}`;
      grouped.set(key, [entity]);
    } else {
      const key = entity.jurisdiction;
      const existing = grouped.get(key) ?? [];
      existing.push(entity);
      grouped.set(key, existing);
    }
  }

  for (const [key, groupEntities] of Array.from(grouped)) {
    const jurisdiction = groupEntities[0].jurisdiction;
    const impl = getJurisdictionImplementation(jurisdiction);
    const isMoce = key.includes('__MOCE__');
    const moceEntity = isMoce ? groupEntities[0] : null;

    result.push({
      id: generateJurisdictionId(),
      jurisdiction,
      label: isMoce
        ? `${jurisdiction} (${moceEntity!.entityName} — MOCE ${moceEntity!.ownershipPercent}%)`
        : jurisdiction,
      isLowTaxed: false,
      topUpTaxAmount: 0,
      qdmmtAmount: 0,
      employeeCount: 0,
      tangibleAssetNBV: 0,
      hasIIR: impl.hasIIR,
      hasUTPR: impl.hasUTPR,
      hasQDMTT: impl.hasQDMTT,
      entityIds: groupEntities.map((e) => e.id),
      isMOCE: isMoce,
      moceOwnershipPercent: moceEntity?.ownershipPercent ?? 0,
    });
  }

  return result;
}

// ============================================================
// UTILITY HELPERS
// ============================================================

/**
 * Round to 2 decimal places.
 */
export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format a number as currency with thousands separators (EUR).
 */
export function formatEUR(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-GB');
  return `€${formatted}`;
}

/**
 * Format a percentage (0–1) as display percentage.
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number as display percentage (already 0–100 scale).
 */
export function formatPercentDirect(
  value: number,
  decimals: number = 2
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generate a unique ID.
 */
export function generateId(prefix: string = 'ID'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

/**
 * Get the label for a select option value.
 */
export function getOptionLabel(
  options: SelectOption[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// ============================================================
// VALIDATION
// ============================================================

export function validateGroupStructure(
  entities: ChainEntity[],
  groupName: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!groupName.trim()) {
    errors.push({
      field: 'groupName',
      message: 'Please enter the MNE Group name',
    });
  }

  if (entities.length === 0) {
    errors.push({
      field: 'entities',
      message: 'At least one entity must be added',
    });
    return errors;
  }

  const upeCount = entities.filter((e) => e.isUPE).length;
  if (upeCount === 0) {
    errors.push({
      field: 'upe',
      message: 'One entity must be designated as the UPE',
    });
  }
  if (upeCount > 1) {
    errors.push({
      field: 'upe',
      message: 'Only one entity can be the UPE',
    });
  }

  entities.forEach((e) => {
    if (!e.entityName.trim()) {
      errors.push({
        field: `entity_name_${e.id}`,
        message: 'Entity name is required',
      });
    }
    if (!e.jurisdiction) {
      errors.push({
        field: `entity_jurisdiction_${e.id}`,
        message: `${e.entityName || 'Entity'}: Jurisdiction is required`,
      });
    }
    if (e.ownershipPercent < 0 || e.ownershipPercent > 100) {
      errors.push({
        field: `entity_ownership_${e.id}`,
        message: `${e.entityName || 'Entity'}: Ownership must be 0–100%`,
      });
    }
    if (!e.isUPE && !e.parentEntityId) {
      errors.push({
        field: `entity_parent_${e.id}`,
        message: `${e.entityName || 'Entity'}: Non-UPE entities must have a parent`,
      });
    }
  });

  return errors;
}

export function validateJurisdictionData(
  jurisdictions: JurisdictionData[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  const hasLowTaxed = jurisdictions.some((j) => j.isLowTaxed);
  if (!hasLowTaxed) {
    errors.push({
      field: 'lowTaxed',
      message:
        'At least one jurisdiction must be marked as low-taxed (has top-up tax to allocate)',
    });
  }

  jurisdictions.forEach((j) => {
    if (j.isLowTaxed && j.topUpTaxAmount <= 0) {
      errors.push({
        field: `topUpTax_${j.id}`,
        message: `${j.label}: Low-taxed jurisdictions must have top-up tax > 0`,
      });
    }
    if (j.qdmmtAmount > j.topUpTaxAmount) {
      errors.push({
        field: `qdmmt_${j.id}`,
        message: `${j.label}: QDMTT cannot exceed total top-up tax`,
      });
    }
    if (j.employeeCount < 0) {
      errors.push({
        field: `employees_${j.id}`,
        message: `${j.label}: Employee count cannot be negative`,
      });
    }
    if (j.tangibleAssetNBV < 0) {
      errors.push({
        field: `assets_${j.id}`,
        message: `${j.label}: Tangible asset NBV cannot be negative`,
      });
    }
  });

  return errors;
}

// ============================================================
// H&C TEST SCENARIO — Stratos Group (Base Case)
// ============================================================

export const CASE_STUDY_GROUP_NAME = 'Stratos Holdings plc';

export const CASE_STUDY_ENTITIES: ChainEntity[] = [
  {
    id: 'cma-001',
    entityName: 'Stratos Holdings plc',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: null,
    isUPE: true,
    isIPE: false,
    isMOCE: false,
    entityType: 'UPE',
    notes: 'UK-listed UPE. Jurisdiction has IIR — collects top-up tax first.',
  },
  {
    id: 'cma-002',
    entityName: 'SG Holdings Ltd',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: 'cma-001',
    isUPE: false,
    isIPE: true,
    isMOCE: false,
    entityType: 'IPE',
    notes: 'Intermediate holding for European and Asian sub-groups.',
  },
  {
    id: 'cma-003',
    entityName: 'SG Netherlands BV',
    jurisdiction: 'Netherlands',
    ownershipPercent: 100,
    parentEntityId: 'cma-002',
    isUPE: false,
    isIPE: true,
    isMOCE: false,
    entityType: 'IPE',
    notes: 'Intermediate holding for Ireland and Singapore sub-groups.',
  },
  {
    id: 'cma-004',
    entityName: 'SG Ireland Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 100,
    parentEntityId: 'cma-003',
    isUPE: false,
    isIPE: true,
    isMOCE: false,
    entityType: 'IPE',
    notes:
      'European HQ. Ireland has QDMTT but no IIR — domestic collection only.',
  },
  {
    id: 'cma-005',
    entityName: 'SG Ireland IP Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 100,
    parentEntityId: 'cma-004',
    isUPE: false,
    isIPE: false,
    isMOCE: false,
    entityType: 'OPERATING',
    notes: 'IP holding entity — contributes to Ireland ETR.',
  },
  {
    id: 'cma-006',
    entityName: 'SG Singapore Pte Ltd',
    jurisdiction: 'Singapore',
    ownershipPercent: 100,
    parentEntityId: 'cma-003',
    isUPE: false,
    isIPE: true,
    isMOCE: false,
    entityType: 'IPE',
    notes:
      'Regional HQ. Singapore has QDMTT from 2025 but no IIR — domestic collection only.',
  },
  {
    id: 'cma-007',
    entityName: 'SG Singapore Tech Pte Ltd',
    jurisdiction: 'Singapore',
    ownershipPercent: 100,
    parentEntityId: 'cma-006',
    isUPE: false,
    isIPE: false,
    isMOCE: false,
    entityType: 'OPERATING',
    notes: 'R&D centre — contributes to Singapore ETR.',
  },
  {
    id: 'cma-008',
    entityName: 'SG Hong Kong Ltd',
    jurisdiction: 'Hong Kong',
    ownershipPercent: 100,
    parentEntityId: 'cma-006',
    isUPE: false,
    isIPE: false,
    isMOCE: false,
    entityType: 'OPERATING',
    notes: 'Hong Kong operations.',
  },
  {
    id: 'cma-009',
    entityName: 'SG Luxembourg S.à r.l.',
    jurisdiction: 'Luxembourg',
    ownershipPercent: 100,
    parentEntityId: 'cma-001',
    isUPE: false,
    isIPE: false,
    isMOCE: false,
    entityType: 'OPERATING',
    notes: 'Treasury services — qualifies for de minimis exclusion.',
  },
  {
    id: 'cma-010',
    entityName: 'Atlas Ireland Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 28,
    parentEntityId: 'cma-001',
    isUPE: false,
    isIPE: false,
    isMOCE: true,
    entityType: 'MOCE',
    notes:
      '28% ownership — MOCE under Art. 5.6. Only allocable share (28%) subject to IIR/UTPR.',
  },
];

/**
 * Pre-loaded jurisdiction data for the Stratos Group base case (FY 2025).
 * Sources: fact-register.md §G (ETR data), §I (combined data), client-profile.md §6.
 */
export const CASE_STUDY_JURISDICTIONS: JurisdictionData[] = [
  // --- Low-taxed jurisdictions ---
  {
    id: 'jd-sg',
    jurisdiction: 'Singapore',
    label: 'Singapore',
    isLowTaxed: true,
    topUpTaxAmount: 198_268,
    qdmmtAmount: 198_268,
    employeeCount: 85,
    tangibleAssetNBV: 850_000,
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: true,
    entityIds: ['cma-006', 'cma-007'],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-ie',
    jurisdiction: 'Ireland',
    label: 'Ireland (Main Group)',
    isLowTaxed: true,
    topUpTaxAmount: 425_011,
    qdmmtAmount: 425_011,
    employeeCount: 180,
    tangibleAssetNBV: 12_000_000,
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: true,
    entityIds: ['cma-004', 'cma-005'],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-ie-moce',
    jurisdiction: 'Ireland',
    label: 'Ireland (Atlas Ireland — MOCE 28%)',
    isLowTaxed: true,
    topUpTaxAmount: 66_720,
    qdmmtAmount: 66_720,
    employeeCount: 35,
    tangibleAssetNBV: 800_000,
    hasIIR: false,
    hasUTPR: false,
    hasQDMTT: true,
    entityIds: ['cma-010'],
    isMOCE: true,
    moceOwnershipPercent: 28,
  },
  {
    id: 'jd-lu',
    jurisdiction: 'Luxembourg',
    label: 'Luxembourg',
    isLowTaxed: false, // De minimis exclusion — no top-up tax
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 10,
    tangibleAssetNBV: 180_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: ['cma-009'],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  // --- Non-low-taxed jurisdictions (UTPR substance data) ---
  {
    id: 'jd-uk',
    jurisdiction: 'United Kingdom',
    label: 'United Kingdom',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 350,
    tangibleAssetNBV: 2_800_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: ['cma-001', 'cma-002'],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-de',
    jurisdiction: 'Germany',
    label: 'Germany',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 420,
    tangibleAssetNBV: 18_000_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: [],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-nl',
    jurisdiction: 'Netherlands',
    label: 'Netherlands',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 18,
    tangibleAssetNBV: 600_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: ['cma-003'],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-fr',
    jurisdiction: 'France',
    label: 'France',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 115,
    tangibleAssetNBV: 5_200_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: [],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-au',
    jurisdiction: 'Australia',
    label: 'Australia',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 55,
    tangibleAssetNBV: 2_200_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: [],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
  {
    id: 'jd-jp',
    jurisdiction: 'Japan',
    label: 'Japan',
    isLowTaxed: false,
    topUpTaxAmount: 0,
    qdmmtAmount: 0,
    employeeCount: 45,
    tangibleAssetNBV: 1_800_000,
    hasIIR: true,
    hasUTPR: true,
    hasQDMTT: true,
    entityIds: [],
    isMOCE: false,
    moceOwnershipPercent: 0,
  },
];
