/**
 * Capital Allowances Computation — Utility Functions
 *
 * Pure functions for computing multi-pool capital allowances including
 * AIA allocation, full expensing, zero-emission car FYA, CO2-based
 * car pool allocation, balancing adjustments, and short-period
 * apportionment.
 *
 * All rates and thresholds are for 2025/26 (accounting periods ending
 * on or after 1 April 2025).
 */

import type {
  EntityType,
  AssetCategory,
  PoolId,
  ReliefType,
  ReliefElection,
  CO2Band,
  AccountingPeriod,
  PoolsBroughtForward,
  AssetAddition,
  AssetDisposal,
  CAInputs,
  AdditionClassification,
  PoolResult,
  ReliefTotals,
  PeriodInfo,
  AllowancesSummary,
  ExamLayoutRow,
  ValidationResult,
  CAOutput,
  HCScenario,
} from './types';

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Main pool writing-down allowance rate */
export const MAIN_POOL_WDA_RATE = 0.18;

/** Special rate pool writing-down allowance rate */
export const SPECIAL_RATE_WDA_RATE = 0.06;

/** Annual Investment Allowance annual limit */
export const AIA_ANNUAL_LIMIT = 1_000_000;

/** Full expensing rate (100%) */
export const FULL_EXPENSING_RATE = 1.0;

/** Special rate FYA rate (50%) */
export const SPECIAL_RATE_FYA_RATE = 0.50;

/** Zero-emission car FYA rate (100%) */
export const ZERO_EMISSION_FYA_RATE = 1.0;

/** Small pool threshold — claim full balance if pool ≤ this */
export const SMALL_POOL_THRESHOLD = 1_000;

/** CO2 threshold: 0 g/km = zero-emission */
export const CO2_ZERO = 0;

/** CO2 threshold: 1-50 g/km = low emissions (main pool) */
export const CO2_LOW_MAX = 50;

/** Standard year length for apportionment */
export const STANDARD_YEAR_DAYS = 365;

/** Maximum accounting period length in months */
export const MAX_PERIOD_MONTHS = 18;

// ─── Period Calculations ────────────────────────────────────────────────────────

/** Calculate the number of days in an accounting period */
export function calculatePeriodDays(period: AccountingPeriod): number {
  const start = new Date(period.start);
  const end = new Date(period.end);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** Get period information including short-period flag */
export function getPeriodInfo(period: AccountingPeriod): PeriodInfo {
  const periodDays = calculatePeriodDays(period);
  const isShortPeriod = periodDays < STANDARD_YEAR_DAYS;
  const apportionmentFraction = Math.min(periodDays / STANDARD_YEAR_DAYS, 1);

  return { periodDays, isShortPeriod, apportionmentFraction };
}

/** Calculate AIA available for the period (apportioned for short periods) */
export function calculateAIAAvailable(periodInfo: PeriodInfo): number {
  if (periodInfo.isShortPeriod) {
    return Math.floor(AIA_ANNUAL_LIMIT * periodInfo.apportionmentFraction);
  }
  return AIA_ANNUAL_LIMIT;
}

// ─── Asset Classification ──────────────────────────────────────────────────────

/** Determine CO2 band for a car */
export function getCO2Band(co2: number): CO2Band {
  if (co2 <= CO2_ZERO) return 'zero';
  if (co2 <= CO2_LOW_MAX) return 'low';
  return 'high';
}

/** Determine which pool an asset should be allocated to */
export function getTargetPool(
  category: AssetCategory,
  co2Band: CO2Band | null
): PoolId | null {
  switch (category) {
    case 'general-plant':
      return 'main';
    case 'car':
      if (co2Band === 'zero') return null; // 100% FYA, no pool
      if (co2Band === 'low') return 'main';
      return 'special-rate';
    case 'integral-feature':
    case 'thermal-insulation':
    case 'long-life':
      return 'special-rate';
    default:
      return 'main';
  }
}

/** Check if an asset is eligible for full expensing */
export function isFullExpensingEligible(
  addition: AssetAddition,
  entityType: EntityType
): boolean {
  if (entityType !== 'company') return false;
  if (!addition.isNew) return false;
  if (addition.category === 'car') return false;
  if (addition.category === 'integral-feature') return false;
  if (addition.category === 'thermal-insulation') return false;
  if (addition.category === 'long-life') return false;
  // Only general-plant qualifies
  return addition.category === 'general-plant';
}

/** Check if an asset is eligible for zero-emission car FYA */
export function isZeroEmissionCarEligible(addition: AssetAddition): boolean {
  return (
    addition.category === 'car' &&
    addition.co2Emissions !== null &&
    addition.co2Emissions <= CO2_ZERO
  );
}

/** Check if an asset is eligible for 50% special rate FYA */
export function isSpecialRateFYAEligible(
  addition: AssetAddition,
  entityType: EntityType
): boolean {
  if (entityType !== 'company') return false;
  if (!addition.isNew) return false;
  return (
    addition.category === 'integral-feature' ||
    addition.category === 'thermal-insulation' ||
    addition.category === 'long-life'
  );
}

/** Check if an asset is eligible for AIA */
export function isAIAEligible(addition: AssetAddition): boolean {
  // Cars are NOT eligible for AIA
  return addition.category !== 'car';
}

/** Determine the best relief type for an addition */
export function determineReliefType(
  addition: AssetAddition,
  entityType: EntityType,
  aiaRemaining: number
): ReliefType {
  const election = addition.reliefElection;

  // Zero-emission car always gets FYA 100%
  if (isZeroEmissionCarEligible(addition)) {
    return 'fya-100';
  }

  // Non-zero-emission cars always get WDA (no AIA, no full expensing)
  if (addition.category === 'car') {
    return 'wda';
  }

  // User-elected relief
  if (election === 'full-expensing') {
    if (isFullExpensingEligible(addition, entityType)) {
      return 'full-expensing';
    }
    // Fall through to AIA or WDA if not eligible
  }

  if (election === 'wda-only') {
    return 'wda';
  }

  if (election === 'aia') {
    if (isAIAEligible(addition) && aiaRemaining > 0) {
      return 'aia';
    }
    return 'wda';
  }

  // Auto selection
  if (isFullExpensingEligible(addition, entityType)) {
    return 'full-expensing';
  }

  if (isAIAEligible(addition) && aiaRemaining > 0) {
    return 'aia';
  }

  return 'wda';
}

/** Generate an educational note for an addition's classification */
function generateEducationalNote(
  addition: AssetAddition,
  reliefType: ReliefType,
  entityType: EntityType,
  targetPool: PoolId | null
): string {
  if (addition.category === 'car') {
    const co2 = addition.co2Emissions ?? 0;
    if (co2 <= CO2_ZERO) {
      return `Zero-emission car (CO2 = ${co2} g/km). Qualifies for 100% first year allowance under s.39 CAA 2001. The full cost is relieved in year 1 — no pool allocation needed. Cars never qualify for AIA or full expensing, but zero-emission cars get their own 100% FYA.`;
    }
    if (co2 <= CO2_LOW_MAX) {
      return `Low-emission car (CO2 = ${co2} g/km, 1-50 g/km band). Allocated to the main pool at 18% WDA. Cars do not qualify for AIA or full expensing. ${entityType === 'company' ? 'As a company asset, private use does not restrict the capital allowance — the employee pays benefit-in-kind tax instead (reported on P11D).' : `Private use of ${addition.privateUsePercent}% restricts the allowable WDA to the business-use proportion (${100 - addition.privateUsePercent}%).`}`;
    }
    return `High-emission car (CO2 = ${co2} g/km, above 50 g/km). Allocated to the special rate pool at 6% WDA. This is the slowest rate of relief — high-emission cars receive significantly less annual relief than low-emission vehicles.`;
  }

  if (reliefType === 'full-expensing') {
    return `New, unused main-rate plant and machinery purchased by a company. Qualifies for full expensing (100% first year allowance) under s.38A CAA 2001. The full cost is relieved immediately — no pool allocation needed. Full expensing achieves the same result as AIA but without using the AIA limit. Strategic point: use full expensing for main-rate assets and save AIA for special-rate assets.`;
  }

  if (reliefType === 'aia') {
    return `Qualifies for Annual Investment Allowance — 100% relief in the year of purchase (up to the AIA limit of £1,000,000). AIA is available for most plant and machinery except cars. ${addition.category === 'integral-feature' ? 'This is an integral feature (special rate pool at 6% WDA). Directing AIA here gives 100% relief instead of the slow 6% rate — this is the optimal AIA allocation strategy when full expensing covers main-rate assets.' : ''}`;
  }

  if (reliefType === 'fya-50') {
    return `New special-rate asset qualifying for 50% first year allowance. Half the cost (${formatCurrency(addition.cost * 0.5)}) is relieved immediately; the other half enters the special rate pool at 6% WDA. Consider using AIA instead for 100% relief (if AIA limit allows).`;
  }

  if (addition.category === 'integral-feature') {
    return `Integral feature (s.104A CAA 2001) — allocated to the special rate pool at 6% WDA. Integral features include: electrical systems, cold water systems, heating/ventilation/cooling systems, lifts, escalators, and external solar shading.`;
  }

  return `Allocated to the ${targetPool === 'main' ? 'main pool (18% WDA)' : 'special rate pool (6% WDA)'}. Writing-down allowance is calculated on the pool balance after all additions and disposals.`;
}

// ─── Classify Additions ─────────────────────────────────────────────────────────

/** Classify all additions and determine relief types */
export function classifyAdditions(
  additions: AssetAddition[],
  entityType: EntityType,
  aiaAvailable: number
): AdditionClassification[] {
  let aiaRemaining = aiaAvailable;
  const classifications: AdditionClassification[] = [];

  // Process in order: FYA/FE eligible first, then AIA, then WDA
  // This ensures AIA is only used where needed
  const sorted = [...additions].sort((a, b) => {
    // Zero-emission cars first (always FYA)
    if (isZeroEmissionCarEligible(a) && !isZeroEmissionCarEligible(b)) return -1;
    if (!isZeroEmissionCarEligible(a) && isZeroEmissionCarEligible(b)) return 1;
    // Full expensing eligible next
    if (isFullExpensingEligible(a, entityType) && !isFullExpensingEligible(b, entityType)) return -1;
    if (!isFullExpensingEligible(a, entityType) && isFullExpensingEligible(b, entityType)) return 1;
    // Non-car AIA-eligible next
    if (isAIAEligible(a) && !isAIAEligible(b)) return -1;
    if (!isAIAEligible(a) && isAIAEligible(b)) return 1;
    return 0;
  });

  for (const addition of sorted) {
    const co2Band: CO2Band | null =
      addition.category === 'car' && addition.co2Emissions !== null
        ? getCO2Band(addition.co2Emissions)
        : null;

    const reliefType = determineReliefType(addition, entityType, aiaRemaining);
    let reliefAmount = 0;
    let amountToPool = addition.cost;
    let targetPool = getTargetPool(addition.category, co2Band);

    switch (reliefType) {
      case 'full-expensing':
        reliefAmount = addition.cost;
        amountToPool = 0;
        targetPool = null; // Fully relieved, nothing to pool
        break;
      case 'fya-100':
        reliefAmount = addition.cost;
        amountToPool = 0;
        targetPool = null;
        break;
      case 'fya-50':
        reliefAmount = Math.round(addition.cost * SPECIAL_RATE_FYA_RATE);
        amountToPool = addition.cost - reliefAmount;
        break;
      case 'aia': {
        const aiaOnThisAsset = Math.min(addition.cost, aiaRemaining);
        reliefAmount = aiaOnThisAsset;
        amountToPool = addition.cost - aiaOnThisAsset;
        aiaRemaining -= aiaOnThisAsset;
        if (amountToPool === 0) targetPool = null;
        break;
      }
      case 'wda':
        reliefAmount = 0;
        amountToPool = addition.cost;
        break;
    }

    const educationalNote = generateEducationalNote(
      addition,
      reliefType,
      entityType,
      targetPool
    );

    classifications.push({
      additionId: addition.id,
      description: addition.description,
      cost: addition.cost,
      category: addition.category,
      co2Band,
      targetPool,
      reliefType,
      reliefAmount,
      amountToPool,
      privateUsePercent: addition.privateUsePercent,
      educationalNote,
    });
  }

  // Re-sort to match original input order for display
  const idOrder = additions.map((a) => a.id);
  classifications.sort((a, b) => idOrder.indexOf(a.additionId) - idOrder.indexOf(b.additionId));

  return classifications;
}

// ─── Pool Computations ──────────────────────────────────────────────────────────

/** Compute a single pool */
export function computePool(
  poolId: PoolId,
  poolBF: number,
  additionsToPool: number,
  disposalsFromPool: number,
  periodInfo: PeriodInfo
): PoolResult {
  const poolName = poolId === 'main' ? 'Main Pool' : 'Special Rate Pool';
  const wdaRate = poolId === 'main' ? MAIN_POOL_WDA_RATE : SPECIAL_RATE_WDA_RATE;

  // Step 1: Balance after additions and disposals
  let balanceAfterDisposals = poolBF + additionsToPool - disposalsFromPool;

  // Step 2: Balancing charge check
  let balancingCharge = 0;
  if (balanceAfterDisposals < 0) {
    balancingCharge = Math.abs(balanceAfterDisposals);
    balanceAfterDisposals = 0;
  }

  // Step 3: Small pool check and WDA
  let smallPoolClaimed = false;
  let wdaBeforeApportionment = 0;
  let wdaAmount = 0;
  let poolCF = balanceAfterDisposals;
  const balanceForWDA = balanceAfterDisposals;

  if (balanceAfterDisposals > 0) {
    if (balanceAfterDisposals <= SMALL_POOL_THRESHOLD) {
      // Small pool allowance: claim full balance
      smallPoolClaimed = true;
      wdaAmount = balanceAfterDisposals;
      wdaBeforeApportionment = wdaAmount;
      poolCF = 0;
    } else {
      // Standard WDA
      wdaBeforeApportionment = Math.round(balanceAfterDisposals * wdaRate);

      // Short-period apportionment applies to WDA
      if (periodInfo.isShortPeriod) {
        wdaAmount = Math.round(wdaBeforeApportionment * periodInfo.apportionmentFraction);
      } else {
        wdaAmount = wdaBeforeApportionment;
      }

      poolCF = balanceAfterDisposals - wdaAmount;
    }
  }

  return {
    poolId,
    poolName,
    wdaRate,
    poolBF,
    additionsToPool,
    disposalsFromPool,
    balanceAfterDisposals,
    balancingCharge,
    smallPoolClaimed,
    balanceForWDA,
    wdaAmount,
    wdaBeforeApportionment,
    poolCF,
  };
}

// ─── Exam Layout Generation ──────────────────────────────────────────────────

/** Generate exam-format computation layout rows */
export function generateExamLayout(
  classifications: AdditionClassification[],
  disposals: AssetDisposal[],
  poolResults: PoolResult[],
  reliefTotals: ReliefTotals,
  allowancesSummary: AllowancesSummary
): ExamLayoutRow[] {
  const rows: ExamLayoutRow[] = [];
  const mainPool = poolResults.find((p) => p.poolId === 'main');
  const specialRate = poolResults.find((p) => p.poolId === 'special-rate');

  // FYA/Full expensing additions
  const fyaAdditions = classifications.filter(
    (c) => c.reliefType === 'full-expensing' || c.reliefType === 'fya-100'
  );
  if (fyaAdditions.length > 0) {
    rows.push({
      label: 'First Year Allowances / Full Expensing',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'header', isDeduction: false,
    });
    for (const c of fyaAdditions) {
      const label = c.reliefType === 'full-expensing'
        ? `${c.description} (FE 100%)`
        : `${c.description} (FYA 100%)`;
      rows.push({
        label,
        fya: c.cost, aia: null, mainPool: null, specialRate: null, allowances: c.reliefAmount,
        rowType: 'addition', isDeduction: false,
      });
    }
  }

  // AIA additions
  const aiaAdditions = classifications.filter((c) => c.reliefType === 'aia' && c.reliefAmount > 0);
  if (aiaAdditions.length > 0) {
    for (const c of aiaAdditions) {
      rows.push({
        label: `${c.description} (AIA)`,
        fya: null, aia: c.reliefAmount, mainPool: null, specialRate: null, allowances: c.reliefAmount,
        rowType: 'addition', isDeduction: false,
      });
    }
  }

  // FYA/AIA totals
  if (fyaAdditions.length > 0 || aiaAdditions.length > 0) {
    rows.push({
      label: '',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'blank', isDeduction: false,
    });
  }

  // Pool computations
  // Main pool
  if (mainPool && (mainPool.poolBF > 0 || mainPool.additionsToPool > 0 || mainPool.disposalsFromPool > 0)) {
    rows.push({
      label: 'Main Pool (18%)',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'header', isDeduction: false,
    });

    if (mainPool.poolBF > 0) {
      rows.push({
        label: 'Brought forward',
        fya: null, aia: null, mainPool: mainPool.poolBF, specialRate: null, allowances: null,
        rowType: 'balance', isDeduction: false,
      });
    }

    // Additions to main pool
    const mainAdditions = classifications.filter(
      (c) => c.targetPool === 'main' && c.amountToPool > 0
    );
    for (const c of mainAdditions) {
      rows.push({
        label: `Add: ${c.description}`,
        fya: null, aia: null, mainPool: c.amountToPool, specialRate: null, allowances: null,
        rowType: 'addition', isDeduction: false,
      });
    }

    // Subtotal before disposals
    if (mainAdditions.length > 0 || mainPool.poolBF > 0) {
      rows.push({
        label: '',
        fya: null, aia: null, mainPool: mainPool.poolBF + mainPool.additionsToPool, specialRate: null, allowances: null,
        rowType: 'subtotal', isDeduction: false,
      });
    }

    // Disposals from main pool
    const mainDisposals = disposals.filter((d) => d.pool === 'main');
    for (const d of mainDisposals) {
      rows.push({
        label: `Less: Disposal — ${d.description}`,
        fya: null, aia: null, mainPool: d.proceeds, specialRate: null, allowances: null,
        rowType: 'disposal', isDeduction: true,
      });
    }

    if (mainDisposals.length > 0) {
      rows.push({
        label: '',
        fya: null, aia: null, mainPool: mainPool.balanceForWDA, specialRate: null, allowances: null,
        rowType: 'subtotal', isDeduction: false,
      });
    }

    // Balancing charge
    if (mainPool.balancingCharge > 0) {
      rows.push({
        label: 'Balancing charge',
        fya: null, aia: null, mainPool: null, specialRate: null, allowances: mainPool.balancingCharge,
        rowType: 'wda', isDeduction: true,
      });
    }

    // WDA
    if (mainPool.wdaAmount > 0) {
      rows.push({
        label: `WDA @ ${(mainPool.wdaRate * 100)}%`,
        fya: null, aia: null, mainPool: mainPool.wdaAmount, specialRate: null, allowances: mainPool.wdaAmount,
        rowType: 'wda', isDeduction: true,
      });
    }

    // Carry forward
    rows.push({
      label: 'Carried forward',
      fya: null, aia: null, mainPool: mainPool.poolCF, specialRate: null, allowances: null,
      rowType: 'carryforward', isDeduction: false,
    });

    rows.push({
      label: '',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'blank', isDeduction: false,
    });
  }

  // Special rate pool
  if (specialRate && (specialRate.poolBF > 0 || specialRate.additionsToPool > 0 || specialRate.disposalsFromPool > 0)) {
    rows.push({
      label: 'Special Rate Pool (6%)',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'header', isDeduction: false,
    });

    if (specialRate.poolBF > 0) {
      rows.push({
        label: 'Brought forward',
        fya: null, aia: null, mainPool: null, specialRate: specialRate.poolBF, allowances: null,
        rowType: 'balance', isDeduction: false,
      });
    }

    // Additions to special rate pool
    const srAdditions = classifications.filter(
      (c) => c.targetPool === 'special-rate' && c.amountToPool > 0
    );
    for (const c of srAdditions) {
      rows.push({
        label: `Add: ${c.description}`,
        fya: null, aia: null, mainPool: null, specialRate: c.amountToPool, allowances: null,
        rowType: 'addition', isDeduction: false,
      });
    }

    // Subtotal
    if (srAdditions.length > 0 || specialRate.poolBF > 0) {
      rows.push({
        label: '',
        fya: null, aia: null, mainPool: null, specialRate: specialRate.poolBF + specialRate.additionsToPool, allowances: null,
        rowType: 'subtotal', isDeduction: false,
      });
    }

    // Disposals from special rate pool
    const srDisposals = disposals.filter((d) => d.pool === 'special-rate');
    for (const d of srDisposals) {
      rows.push({
        label: `Less: Disposal — ${d.description}`,
        fya: null, aia: null, mainPool: null, specialRate: d.proceeds, allowances: null,
        rowType: 'disposal', isDeduction: true,
      });
    }

    if (srDisposals.length > 0) {
      rows.push({
        label: '',
        fya: null, aia: null, mainPool: null, specialRate: specialRate.balanceForWDA, allowances: null,
        rowType: 'subtotal', isDeduction: false,
      });
    }

    // Balancing charge
    if (specialRate.balancingCharge > 0) {
      rows.push({
        label: 'Balancing charge',
        fya: null, aia: null, mainPool: null, specialRate: null, allowances: specialRate.balancingCharge,
        rowType: 'wda', isDeduction: true,
      });
    }

    // WDA
    if (specialRate.wdaAmount > 0) {
      rows.push({
        label: `WDA @ ${(specialRate.wdaRate * 100)}%`,
        fya: null, aia: null, mainPool: null, specialRate: specialRate.wdaAmount, allowances: specialRate.wdaAmount,
        rowType: 'wda', isDeduction: true,
      });
    }

    // Carry forward
    rows.push({
      label: 'Carried forward',
      fya: null, aia: null, mainPool: null, specialRate: specialRate.poolCF, allowances: null,
      rowType: 'carryforward', isDeduction: false,
    });

    rows.push({
      label: '',
      fya: null, aia: null, mainPool: null, specialRate: null, allowances: null,
      rowType: 'blank', isDeduction: false,
    });
  }

  // Total allowances
  rows.push({
    label: 'Total capital allowances',
    fya: null, aia: null, mainPool: null, specialRate: null, allowances: allowancesSummary.totalAllowances,
    rowType: 'total', isDeduction: false,
  });

  return rows;
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/** Run all validation rules */
export function validateInputs(inputs: CAInputs): ValidationResult[] {
  const results: ValidationResult[] = [];

  // V1: Period dates valid
  if (inputs.period.start && inputs.period.end) {
    const start = new Date(inputs.period.start);
    const end = new Date(inputs.period.end);
    if (end <= start) {
      results.push({
        ruleId: 'V1',
        severity: 'error',
        message: 'Accounting period end date must be after the start date.',
        passed: false,
      });
    } else {
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      if (months > MAX_PERIOD_MONTHS) {
        results.push({
          ruleId: 'V1',
          severity: 'error',
          message: `Accounting period cannot exceed ${MAX_PERIOD_MONTHS} months.`,
          passed: false,
        });
      }
    }
  } else {
    results.push({
      ruleId: 'V1',
      severity: 'error',
      message: 'Accounting period start and end dates are required.',
      passed: false,
    });
  }

  // V2: At least one input
  const hasData =
    inputs.additions.length > 0 ||
    inputs.disposals.length > 0 ||
    inputs.poolsBF.mainPool > 0 ||
    inputs.poolsBF.specialRatePool > 0;
  if (!hasData) {
    results.push({
      ruleId: 'V2',
      severity: 'error',
      message: 'At least one addition, disposal, or pool brought-forward value is required.',
      passed: false,
    });
  }

  // V3: CO2 required for cars
  for (const addition of inputs.additions) {
    if (addition.category === 'car' && (addition.co2Emissions === null || addition.co2Emissions === undefined)) {
      results.push({
        ruleId: 'V3',
        severity: 'error',
        message: `CO2 emissions must be provided for car: "${addition.description}".`,
        passed: false,
      });
    }
  }

  // V5: AIA not on cars
  for (const addition of inputs.additions) {
    if (addition.category === 'car' && addition.reliefElection === 'aia') {
      results.push({
        ruleId: 'V5',
        severity: 'warning',
        message: `AIA cannot be claimed on cars. "${addition.description}" will receive WDA instead.`,
        passed: false,
      });
    }
  }

  // V6: Full expensing company only
  if (inputs.entityType === 'sole-trader-partnership') {
    for (const addition of inputs.additions) {
      if (addition.reliefElection === 'full-expensing') {
        results.push({
          ruleId: 'V6',
          severity: 'warning',
          message: `Full expensing is only available for companies. "${addition.description}" will receive AIA or WDA instead.`,
          passed: false,
        });
      }
    }
  }

  // V7: Full expensing new only
  for (const addition of inputs.additions) {
    if (addition.reliefElection === 'full-expensing' && !addition.isNew) {
      results.push({
        ruleId: 'V7',
        severity: 'warning',
        message: `Full expensing is only available for new, unused assets. "${addition.description}" is second-hand — AIA or WDA will apply instead.`,
        passed: false,
      });
    }
  }

  // V8: Full expensing not cars
  for (const addition of inputs.additions) {
    if (addition.reliefElection === 'full-expensing' && addition.category === 'car') {
      results.push({
        ruleId: 'V8',
        severity: 'warning',
        message: `Full expensing is not available for cars. "${addition.description}" will receive FYA (if zero-emission) or WDA.`,
        passed: false,
      });
    }
  }

  // V9: Private use company info
  if (inputs.entityType === 'company') {
    const hasPrivateUse = inputs.additions.some((a) => a.privateUsePercent > 0);
    if (hasPrivateUse) {
      results.push({
        ruleId: 'V9',
        severity: 'info',
        message: 'For companies, private use does not restrict capital allowances. The employee pays benefit-in-kind tax (reported on P11D). The full capital allowance is claimed by the company.',
        passed: true,
      });
    }
  }

  return results;
}

/** Summarise validation results */
export function summariseValidation(results: ValidationResult[]) {
  return {
    errors: results.filter((r) => r.severity === 'error' && !r.passed).length,
    warnings: results.filter((r) => r.severity === 'warning' && !r.passed).length,
    info: results.filter((r) => r.severity === 'info').length,
  };
}

// ─── Full Computation ───────────────────────────────────────────────────────────

/** Run the full capital allowances computation */
export function computeAllowances(inputs: CAInputs): CAOutput {
  // Validate
  const validationResults = validateInputs(inputs);
  const validationSummary = summariseValidation(validationResults);

  // Period info
  const periodInfo = getPeriodInfo(inputs.period);
  const aiaAvailable = calculateAIAAvailable(periodInfo);

  // Classify additions
  const additionClassifications = classifyAdditions(
    inputs.additions,
    inputs.entityType,
    aiaAvailable
  );

  // V4: AIA not exceeding limit (must check after classification)
  const totalAIAClaimed = additionClassifications
    .filter((c) => c.reliefType === 'aia')
    .reduce((sum, c) => sum + c.reliefAmount, 0);
  if (totalAIAClaimed > aiaAvailable) {
    validationResults.push({
      ruleId: 'V4',
      severity: 'error',
      message: `Total AIA claimed (${formatCurrency(totalAIAClaimed)}) exceeds the available limit (${formatCurrency(aiaAvailable)}).`,
      passed: false,
    });
  }

  // Relief totals
  const fullExpensing = additionClassifications
    .filter((c) => c.reliefType === 'full-expensing')
    .reduce((sum, c) => sum + c.reliefAmount, 0);
  const zeroEmissionFYA = additionClassifications
    .filter((c) => c.reliefType === 'fya-100')
    .reduce((sum, c) => sum + c.reliefAmount, 0);
  const specialRateFYA = additionClassifications
    .filter((c) => c.reliefType === 'fya-50')
    .reduce((sum, c) => sum + c.reliefAmount, 0);

  const reliefTotals: ReliefTotals = {
    fullExpensing,
    zeroEmissionFYA,
    specialRateFYA,
    totalFYAs: fullExpensing + zeroEmissionFYA + specialRateFYA,
    totalAIA: totalAIAClaimed,
    aiaAvailable,
    aiaRemaining: aiaAvailable - totalAIAClaimed,
  };

  // Pool additions
  const mainPoolAdditions = additionClassifications
    .filter((c) => c.targetPool === 'main')
    .reduce((sum, c) => sum + c.amountToPool, 0);
  const specialRateAdditions = additionClassifications
    .filter((c) => c.targetPool === 'special-rate')
    .reduce((sum, c) => sum + c.amountToPool, 0);

  // Pool disposals
  const mainPoolDisposals = inputs.disposals
    .filter((d) => d.pool === 'main')
    .reduce((sum, d) => sum + d.proceeds, 0);
  const specialRateDisposals = inputs.disposals
    .filter((d) => d.pool === 'special-rate')
    .reduce((sum, d) => sum + d.proceeds, 0);

  // Compute pools
  const mainPoolResult = computePool(
    'main',
    inputs.poolsBF.mainPool,
    mainPoolAdditions,
    mainPoolDisposals,
    periodInfo
  );
  const specialRateResult = computePool(
    'special-rate',
    inputs.poolsBF.specialRatePool,
    specialRateAdditions,
    specialRateDisposals,
    periodInfo
  );

  const poolResults = [mainPoolResult, specialRateResult];

  // Total allowances
  const totalWDA = mainPoolResult.wdaAmount + specialRateResult.wdaAmount;
  const totalBalancingCharges = mainPoolResult.balancingCharge + specialRateResult.balancingCharge;

  const allowancesSummary: AllowancesSummary = {
    totalFYAs: reliefTotals.totalFYAs,
    totalAIA: reliefTotals.totalAIA,
    totalWDA,
    totalBalancingCharges,
    totalAllowances: reliefTotals.totalFYAs + reliefTotals.totalAIA + totalWDA - totalBalancingCharges,
  };

  // Exam layout
  const examLayout = generateExamLayout(
    additionClassifications,
    inputs.disposals,
    poolResults,
    reliefTotals,
    allowancesSummary
  );

  return {
    periodInfo,
    additionClassifications,
    reliefTotals,
    poolResults,
    allowancesSummary,
    examLayout,
    validationResults,
    validationSummary,
  };
}

// ─── Empty Inputs ───────────────────────────────────────────────────────────────

/** Create empty/default inputs */
export function createEmptyInputs(): CAInputs {
  return {
    period: { start: '', end: '' },
    entityType: 'company',
    poolsBF: { mainPool: 0, specialRatePool: 0 },
    additions: [],
    disposals: [],
  };
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Create an empty addition */
export function createEmptyAddition(): AssetAddition {
  return {
    id: generateId(),
    description: '',
    cost: 0,
    category: 'general-plant',
    isNew: true,
    co2Emissions: null,
    privateUsePercent: 0,
    reliefElection: 'auto',
  };
}

/** Create an empty disposal */
export function createEmptyDisposal(): AssetDisposal {
  return {
    id: generateId(),
    description: '',
    proceeds: 0,
    pool: 'main',
  };
}

// ─── Formatting Helpers ──────────────────────────────────────────────────────

/** Format a number as GBP currency (no decimals) */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toLocaleString('en-GB');
  if (amount < 0) return `(${formatted})`;
  return formatted;
}

/** Format a number as GBP with £ sign */
export function formatPounds(amount: number): string {
  return `£${formatCurrency(amount)}`;
}

/** Format a percentage */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/** Get display name for asset category */
export function getCategoryName(category: AssetCategory): string {
  switch (category) {
    case 'general-plant': return 'General Plant & Machinery';
    case 'car': return 'Car';
    case 'integral-feature': return 'Integral Feature';
    case 'thermal-insulation': return 'Thermal Insulation';
    case 'long-life': return 'Long-Life Asset';
    default: return category;
  }
}

/** Get display name for relief type */
export function getReliefName(relief: ReliefType): string {
  switch (relief) {
    case 'full-expensing': return 'Full Expensing (100%)';
    case 'fya-100': return 'FYA 100%';
    case 'fya-50': return 'FYA 50%';
    case 'aia': return 'AIA';
    case 'wda': return 'WDA';
    default: return relief;
  }
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

export const HC_SCENARIOS: HCScenario[] = [
  {
    id: 's3-cs-engineering-full-ca',
    name: 'S3 — C&S Engineering Full CA Computation',
    section: 3,
    description:
      'Complete multi-pool capital allowances computation for Caldwell & Shaw Engineering Ltd, y/e 31 March 2026. Includes a new CNC machine (£285,000), wire EDM machine (£95,000), Ford Transit van (£32,000), BMW 530e xDrive company car (CO2 21 g/km, £52,000), Tesla Model 3 company car (CO2 0 g/km, £45,000), electrical refurbishment integral features (£24,000), and disposal of an old CNC lathe (£18,000). Main pool b/f £142,000, special rate pool b/f £38,000.',
    preFilledInputs: {
      period: { start: '2025-04-01', end: '2026-03-31' },
      entityType: 'company',
      poolsBF: { mainPool: 142_000, specialRatePool: 38_000 },
      additions: [
        {
          id: 'cnc-machine',
          description: 'Mazak Integrex i-300S CNC machine',
          cost: 285_000,
          category: 'general-plant',
          isNew: true,
          co2Emissions: null,
          privateUsePercent: 0,
          reliefElection: 'auto',
        },
        {
          id: 'wire-edm',
          description: 'Mitsubishi MV2400S Wire EDM machine',
          cost: 95_000,
          category: 'general-plant',
          isNew: true,
          co2Emissions: null,
          privateUsePercent: 0,
          reliefElection: 'auto',
        },
        {
          id: 'transit-van',
          description: 'Ford Transit Custom 300 L2 delivery van',
          cost: 32_000,
          category: 'general-plant',
          isNew: true,
          co2Emissions: null,
          privateUsePercent: 0,
          reliefElection: 'auto',
        },
        {
          id: 'bmw-530e',
          description: 'BMW 530e xDrive (Marcus — company car)',
          cost: 52_000,
          category: 'car',
          isNew: true,
          co2Emissions: 21,
          privateUsePercent: 20,
          reliefElection: 'auto',
        },
        {
          id: 'tesla-model3',
          description: 'Tesla Model 3 Long Range (Sophie — company car)',
          cost: 45_000,
          category: 'car',
          isNew: true,
          co2Emissions: 0,
          privateUsePercent: 10,
          reliefElection: 'auto',
        },
        {
          id: 'electrical-refurb',
          description: 'Mezzanine office electrical refurbishment',
          cost: 24_000,
          category: 'integral-feature',
          isNew: true,
          co2Emissions: null,
          privateUsePercent: 0,
          reliefElection: 'auto',
        },
      ],
      disposals: [
        {
          id: 'old-cnc',
          description: 'Mazak Quick Turn 200 (old CNC lathe)',
          proceeds: 18_000,
          pool: 'main',
        },
      ],
    },
    expectedTotalAllowances: 514_960,
    hints: {
      'cnc-machine': [
        'New, unused main-rate plant and machinery purchased by a company.',
        'Qualifies for full expensing (100% FYA) — the entire £285,000 is relieved immediately.',
        'Full expensing does not use the AIA limit — save AIA for assets that need it.',
      ],
      'wire-edm': [
        'Same treatment as the CNC machine — new main-rate P&M, full expensing at 100%.',
      ],
      'transit-van': [
        'A delivery van is NOT a car — it is general plant and machinery.',
        'New and unused — qualifies for full expensing (100%).',
        'Could alternatively claim AIA, but full expensing preserves the AIA limit.',
      ],
      'bmw-530e': [
        'The BMW is a CAR — cars never qualify for AIA or full expensing.',
        'CO2 emissions of 21 g/km fall in the 1-50 g/km band → main pool, 18% WDA.',
        'As a company car, the 20% private use does NOT restrict the capital allowance.',
        'Marcus pays benefit-in-kind tax on the private use (reported on P11D in S7).',
      ],
      'tesla-model3': [
        'Zero-emission car (CO2 = 0 g/km) — qualifies for 100% FYA under s.39 CAA 2001.',
        'The full £45,000 is relieved immediately. No pool allocation needed.',
        'The 10% private use does not affect the CA (company — BIK route).',
      ],
      'electrical-refurb': [
        'Electrical systems are an INTEGRAL FEATURE (s.104A CAA 2001).',
        'Integral features go to the special rate pool at 6% WDA — the slowest relief rate.',
        'KEY STRATEGY: Direct the AIA to this asset to get 100% relief instead of 6%.',
        'Since main-rate assets are covered by full expensing, AIA is best used here.',
      ],
      'old-cnc': [
        'Disposal proceeds of £18,000 are deducted from the main pool.',
        'The main pool remains positive after the deduction — no balancing adjustment.',
        'Balancing adjustments only arise on the main/special rate pool if the pool goes negative.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Convert a scenario's pre-filled inputs to CAInputs */
export function scenarioToInputs(scenario: HCScenario): CAInputs {
  return JSON.parse(JSON.stringify(scenario.preFilledInputs));
}
