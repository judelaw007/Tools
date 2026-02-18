/**
 * CCL100 Return — Utility Functions
 *
 * Pure functions for calculating CCL liability, running validations,
 * generating breakdowns, and providing H&C test scenarios.
 *
 * All monetary values in GBP with pence precision (2 decimal places).
 * Quantities in kWh (electricity, gas) or kg (LPG, solid fuels).
 */

import type {
  Commodity,
  BoxNumber,
  CCLPosition,
  RatePeriod,
  ValidationRuleId,
  ValidationSeverity,
  ValidationResult,
  CommodityRate,
  RateTable,
  AccountingPeriod,
  CommodityInput,
  CCADetails,
  CCL100Inputs,
  CalculationStep,
  CommodityBreakdown,
  RateReference,
  CCL100Output,
  CCL100Config,
  HCScenario,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Days after period end for payment/filing deadline */
export const FILING_DEADLINE_DAYS = 30;

/** Annual liability threshold for annual filing (£) */
export const ANNUAL_FILING_THRESHOLD = 2_000;

/** The four commodities in box order */
export const COMMODITIES: Commodity[] = ['electricity', 'gas', 'lpg', 'solid-fuels'];

/** Commodity display names */
export const COMMODITY_NAMES: Record<Commodity, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  lpg: 'LPG',
  'solid-fuels': 'Solid Fuels',
};

/** Commodity units */
export const COMMODITY_UNITS: Record<Commodity, 'kWh' | 'kg'> = {
  electricity: 'kWh',
  gas: 'kWh',
  lpg: 'kg',
  'solid-fuels': 'kg',
};

/** Commodity to box number mapping (main rates) */
export const COMMODITY_BOX_MAP: Record<Commodity, 1 | 2 | 3 | 4> = {
  electricity: 1,
  gas: 2,
  lpg: 3,
  'solid-fuels': 4,
};

// ─── Rate Tables ──────────────────────────────────────────────────────────────

/**
 * CCA discount percentages per commodity.
 * These are stable and do not change annually (set by legislation).
 */
export const CCA_DISCOUNTS: Record<Commodity, number> = {
  electricity: 0.92,
  gas: 0.89,
  lpg: 0.77,
  'solid-fuels': 0.89,
};

/**
 * Carbon Price Support rates (fixed from 1 April 2016 to 31 March 2028).
 * Only apply to commodities used for electricity generation.
 * Electricity has no CPS rate (CPS applies to input fuels, not output electricity).
 */
export const CPS_RATES: Record<Commodity, number> = {
  electricity: 0,           // No CPS on electricity
  gas: 0.00331,             // £/kWh
  lpg: 0.05280,             // £/kg
  'solid-fuels': 0.04299,   // £/kg (converted from £1.54790/GJ using ~27.78 kg/GJ for coal)
};

/** Build a CommodityRate from main rate and commodity */
function buildCommodityRate(mainRate: number, commodity: Commodity): CommodityRate {
  const ccaDiscount = CCA_DISCOUNTS[commodity];
  return {
    mainRate,
    unit: COMMODITY_UNITS[commodity],
    ccaDiscount,
    ccaRate: roundToPence6(mainRate * (1 - ccaDiscount)),
    cpsRate: CPS_RATES[commodity],
  };
}

/**
 * Complete rate tables for all supported periods.
 * Source: GOV.UK — Climate Change Levy rates
 * https://www.gov.uk/guidance/climate-change-levy-rates
 */
export const RATE_TABLES: RateTable[] = [
  {
    period: '2024-25',
    label: '2024/25',
    effectiveFrom: '2024-04-01',
    effectiveTo: '2025-03-31',
    rates: {
      electricity: buildCommodityRate(0.00775, 'electricity'),
      gas: buildCommodityRate(0.00775, 'gas'),
      lpg: buildCommodityRate(0.02175, 'lpg'),
      'solid-fuels': buildCommodityRate(0.06064, 'solid-fuels'),
    },
  },
  {
    period: '2025-26',
    label: '2025/26',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    rates: {
      electricity: buildCommodityRate(0.00775, 'electricity'),
      gas: buildCommodityRate(0.00775, 'gas'),
      lpg: buildCommodityRate(0.02175, 'lpg'),
      'solid-fuels': buildCommodityRate(0.06064, 'solid-fuels'),
    },
  },
  {
    period: '2026-27',
    label: '2026/27',
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    rates: {
      electricity: buildCommodityRate(0.00801, 'electricity'),
      gas: buildCommodityRate(0.00801, 'gas'),
      lpg: buildCommodityRate(0.02175, 'lpg'),
      'solid-fuels': buildCommodityRate(0.06264, 'solid-fuels'),
    },
  },
  {
    period: '2027-28',
    label: '2027/28',
    effectiveFrom: '2027-04-01',
    effectiveTo: '2028-03-31',
    rates: {
      electricity: buildCommodityRate(0.00827, 'electricity'),
      gas: buildCommodityRate(0.00827, 'gas'),
      lpg: buildCommodityRate(0.02175, 'lpg'),
      'solid-fuels': buildCommodityRate(0.06468, 'solid-fuels'),
    },
  },
];

// ─── Box Labels & Tooltips ──────────────────────────────────────────────────

export const BOX_LABELS: Record<BoxNumber, string> = {
  1: 'Electricity — CCL due at main rate',
  2: 'Gas — CCL due at main rate',
  3: 'LPG — CCL due at main rate',
  4: 'Solid fuels — CCL due at main rate',
  5: 'Net CCL due (Box 1 + Box 2 + Box 3 + Box 4)',
  6: 'CPS — Gas (generators only)',
  7: 'CPS — LPG (generators only)',
  8: 'CPS — Solid fuels (generators only)',
  9: 'Total CPS due (Box 6 + Box 7 + Box 8)',
};

export const BOX_TOOLTIPS: Record<BoxNumber, string> = {
  1: 'Total CCL on electricity supplies at the main rate, less CCA relief, exemptions, and credits. Electricity has the highest CCA discount (92%).',
  2: 'Total CCL on gas supplies at the main rate, less CCA relief, exemptions, and credits. Gas CCA discount is 89%.',
  3: 'Total CCL on LPG supplies at the main rate, less CCA relief, exemptions, and credits. LPG is measured in kg, not kWh. CCA discount is 77%.',
  4: 'Total CCL on solid fuel supplies (coal, coke, lignite) at the main rate, less CCA relief, exemptions, and credits. CCA discount is 89%.',
  5: 'Auto-calculated: sum of Boxes 1 to 4. Positive = payable, negative = repayable. Payment due within 30 days of period end.',
  6: 'CPS rate CCL on gas used for electricity generation. Only for electricity generators. £0.00331/kWh.',
  7: 'CPS rate CCL on LPG used for electricity generation. Only for electricity generators. £0.05280/kg.',
  8: 'CPS rate CCL on solid fuels used for electricity generation. Only for electricity generators.',
  9: 'Auto-calculated: sum of Boxes 6 to 8. Only for electricity generators.',
};

/** Educational notes per commodity */
export const COMMODITY_EDUCATIONAL_NOTES: Record<Commodity, string> = {
  electricity: 'Electricity has the highest CCA discount at 92%. Without a CCA, the full main rate applies. With a CCA, only 8% of the main rate is payable — the most valuable CCA commodity for energy-intensive businesses.',
  gas: 'Gas CCA discount is 89%. The CPS rate (£0.00331/kWh) additionally applies only when gas is used for electricity generation — not for manufacturing heat or industrial processes.',
  lpg: 'LPG is the only commodity measured in kg, not kWh. The CCA discount is 77% — the lowest of the four commodities. The LPG rate has been frozen since 2024.',
  'solid-fuels': 'Solid fuels cover coal, coke, lignite, and petroleum coke. The rate is per kg. CCA discount is 89%, the same as gas. The mineralogical/metallurgical process exemption applies only to solid fuels.',
};

/** Field labels for the UI */
export const FIELD_LABELS = {
  standardQuantity: 'Standard-rate quantity',
  ccaQuantity: 'CCA-rate quantity',
  exemptRenewables: 'Exempt: renewables (LECs)',
  exemptCHP: 'Exempt: CHP qualifying',
  exemptMineralogical: 'Exempt: mineralogical/metallurgical',
  creditFromPrior: 'Credit from prior periods (£)',
  periodStart: 'Period start',
  periodEnd: 'Period end',
  periodLabel: 'Period label',
  hasCCA: 'Climate Change Agreement in force',
  ccaCertificateRef: 'CCA certificate reference',
  ccaFacilityName: 'CCA facility name',
  isGenerator: 'Electricity generator (CPS applicable)',
};

/** Field tooltips for the UI */
export const FIELD_TOOLTIPS: Record<string, string> = {
  standardQuantity: 'Quantity supplied at the full main CCL rate. Enter in kWh for electricity/gas, or kg for LPG/solid fuels.',
  ccaQuantity: 'Quantity covered by your Climate Change Agreement. These attract the reduced CCA rate. Must not exceed total quantity.',
  exemptRenewables: 'Electricity from auto-generators or unlicensed suppliers with Levy Exemption Certificates (LECs). Grid electricity marketed as "green" by a licensed supplier is NOT exempt.',
  exemptCHP: 'Input fuels to a fully or partly exempt Combined Heat and Power station. CHP certification from HMRC required.',
  exemptMineralogical: 'Solid fuels used in qualifying mineralogical or metallurgical processes (FA 2000, Sch 6). Applies to solid fuels only.',
  creditFromPrior: 'Sterling amount of CCL credits from prior periods (e.g., overpayment). Enter as a positive number — it will be deducted from your liability.',
  hasCCA: 'A Climate Change Agreement is between a sector association and the Environment Agency. Individual facilities are certified under the agreement.',
  ccaCertificateRef: 'The reference number on the CCA certificate issued by the Environment Agency. Required for PP10/PP11 submissions.',
  ccaFacilityName: 'The name of the facility covered by the CCA certificate. Must match the certificate.',
  isGenerator: 'Only tick if this entity generates electricity using gas, LPG, or solid fuels. Activates CPS boxes 6-9.',
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places (pence precision) */
export function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Round to 6 decimal places (for intermediate rate calculations) */
function roundToPence6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** Format GBP amount for display */
export function formatGBP(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) return `-£${formatted}`;
  return `£${formatted}`;
}

/** Format quantity with unit */
export function formatQuantity(value: number, unit: 'kWh' | 'kg'): string {
  return `${value.toLocaleString('en-GB')} ${unit}`;
}

/** Format percentage for display */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/** Add days to a date string and return ISO date */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Format a date string for human display */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Rate Lookup ────────────────────────────────────────────────────────────

/** Determine which rate period applies based on a date */
export function getRatePeriodForDate(dateStr: string): RateTable | undefined {
  const d = new Date(dateStr);
  return RATE_TABLES.find((rt) => {
    const from = new Date(rt.effectiveFrom);
    const to = new Date(rt.effectiveTo);
    return d >= from && d <= to;
  });
}

/** Determine which rate table applies for an accounting period */
export function getRateTableForPeriod(period: AccountingPeriod): RateTable {
  // Use the period end date to determine rates (standard approach)
  const table = getRatePeriodForDate(period.endDate);
  if (table) return table;
  // Fallback to 2025/26 if period not found
  return RATE_TABLES.find((rt) => rt.period === '2025-26')!;
}

/** Get the rate for a specific commodity in a period */
export function getCommodityRate(
  commodity: Commodity,
  rateTable: RateTable
): CommodityRate {
  return rateTable.rates[commodity];
}

// ─── Empty State Creators ────────────────────────────────────────────────────

/** Create an empty commodity input */
export function createEmptyCommodityInput(): CommodityInput {
  return {
    standardQuantity: 0,
    ccaQuantity: 0,
    exemptRenewables: 0,
    exemptCHP: 0,
    exemptMineralogical: 0,
    creditFromPrior: 0,
  };
}

/** Create empty CCA details */
export function createEmptyCCADetails(): CCADetails {
  return {
    hasCCA: false,
    ccaCertificateRef: '',
    ccaFacilityName: '',
  };
}

/** Create a default accounting period */
export function createDefaultPeriod(): AccountingPeriod {
  return {
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    label: 'Q4 2025/26',
  };
}

/** Create empty CCL100 inputs */
export function createEmptyInputs(): CCL100Inputs {
  return {
    period: createDefaultPeriod(),
    cca: createEmptyCCADetails(),
    isElectricityGenerator: false,
    electricity: createEmptyCommodityInput(),
    gas: createEmptyCommodityInput(),
    lpg: createEmptyCommodityInput(),
    solidFuels: createEmptyCommodityInput(),
  };
}

// ─── Commodity Calculation ──────────────────────────────────────────────────

/** Get the CommodityInput for a commodity from CCL100Inputs */
function getCommodityInput(inputs: CCL100Inputs, commodity: Commodity): CommodityInput {
  switch (commodity) {
    case 'electricity': return inputs.electricity;
    case 'gas': return inputs.gas;
    case 'lpg': return inputs.lpg;
    case 'solid-fuels': return inputs.solidFuels;
  }
}

/** Calculate total exempt quantity for a commodity */
function totalExemptQuantity(input: CommodityInput, commodity: Commodity): number {
  let total = input.exemptCHP;
  if (commodity === 'electricity') total += input.exemptRenewables;
  if (commodity === 'solid-fuels') total += input.exemptMineralogical;
  return total;
}

/** Calculate the CCL breakdown for a single commodity */
export function calculateCommodityBreakdown(
  commodity: Commodity,
  input: CommodityInput,
  rate: CommodityRate,
  hasCCA: boolean
): CommodityBreakdown {
  const steps: CalculationStep[] = [];
  const unit = rate.unit;
  const unitLabel = unit === 'kWh' ? 'kWh' : 'kg';
  const rateLabel = `£${rate.mainRate.toFixed(5)}/${unitLabel}`;

  // Step 1: Standard-rate CCL
  const standardCCL = roundToPence(input.standardQuantity * rate.mainRate);
  if (input.standardQuantity > 0) {
    steps.push({
      label: `Standard-rate ${COMMODITY_NAMES[commodity]}`,
      formula: `${input.standardQuantity.toLocaleString('en-GB')} ${unitLabel} × ${rateLabel}`,
      amount: standardCCL,
      educationalNote: `Full main rate applies to supplies not covered by a CCA or exemption.`,
    });
  }

  // Step 2: CCA-rate CCL
  let ccaCCL = 0;
  const effectiveCCARate = hasCCA ? rate.ccaRate : rate.mainRate;
  if (input.ccaQuantity > 0) {
    ccaCCL = roundToPence(input.ccaQuantity * effectiveCCARate);
    const ccaRateLabel = `£${effectiveCCARate.toFixed(5)}/${unitLabel}`;
    steps.push({
      label: `CCA-rate ${COMMODITY_NAMES[commodity]}`,
      formula: hasCCA
        ? `${input.ccaQuantity.toLocaleString('en-GB')} ${unitLabel} × ${ccaRateLabel} (main rate × ${formatPercent(1 - rate.ccaDiscount)})`
        : `${input.ccaQuantity.toLocaleString('en-GB')} ${unitLabel} × ${rateLabel} (no CCA — full rate)`,
      amount: ccaCCL,
      educationalNote: hasCCA
        ? `CCA discount of ${formatPercent(rate.ccaDiscount)} reduces the rate from ${rateLabel} to ${ccaRateLabel}. Saving: ${formatGBP(roundToPence(input.ccaQuantity * (rate.mainRate - effectiveCCARate)))} this period.`
        : `No CCA certificate — full main rate applied even though quantity entered as CCA.`,
    });
  }

  // Step 3: Gross CCL
  const grossCCL = roundToPence(standardCCL + ccaCCL);
  if (input.standardQuantity > 0 || input.ccaQuantity > 0) {
    steps.push({
      label: `Gross CCL — ${COMMODITY_NAMES[commodity]}`,
      formula: `${formatGBP(standardCCL)} + ${formatGBP(ccaCCL)}`,
      amount: grossCCL,
    });
  }

  // Step 4: Exempt deductions
  const exemptQty = totalExemptQuantity(input, commodity);
  const exemptDeduction = roundToPence(exemptQty * rate.mainRate);
  if (exemptQty > 0) {
    const exemptParts: string[] = [];
    if (input.exemptRenewables > 0 && commodity === 'electricity') {
      exemptParts.push(`renewables/LECs: ${input.exemptRenewables.toLocaleString('en-GB')} ${unitLabel}`);
    }
    if (input.exemptCHP > 0) {
      exemptParts.push(`CHP: ${input.exemptCHP.toLocaleString('en-GB')} ${unitLabel}`);
    }
    if (input.exemptMineralogical > 0 && commodity === 'solid-fuels') {
      exemptParts.push(`mineralogical: ${input.exemptMineralogical.toLocaleString('en-GB')} ${unitLabel}`);
    }
    steps.push({
      label: `Less: exempt ${COMMODITY_NAMES[commodity]}`,
      formula: `${exemptQty.toLocaleString('en-GB')} ${unitLabel} × ${rateLabel} (${exemptParts.join(', ')})`,
      amount: -exemptDeduction,
      educationalNote: commodity === 'electricity'
        ? 'Renewable electricity is only exempt when supplied directly by auto-generators or unlicensed suppliers with LECs. Grid "green" tariffs are not exempt.'
        : commodity === 'solid-fuels'
          ? 'The mineralogical/metallurgical process exemption applies to qualifying industrial processes listed in FA 2000, Sch 6, Annex A.'
          : 'CHP exemption requires certification from HMRC. The facility must be a qualifying CHP station.',
    });
  }

  // Step 5: Credit deductions
  const creditDeduction = roundToPence(input.creditFromPrior);
  if (creditDeduction > 0) {
    steps.push({
      label: `Less: credits from prior periods`,
      formula: `Credit: ${formatGBP(creditDeduction)}`,
      amount: -creditDeduction,
      educationalNote: 'Credits arise from overpayments in previous periods. Submitted to HMRC via form CCL200x with supporting evidence.',
    });
  }

  // Step 6: Net CCL due
  const netCCLDue = roundToPence(grossCCL - exemptDeduction - creditDeduction);
  steps.push({
    label: `Net CCL due — ${COMMODITY_NAMES[commodity]} (Box ${COMMODITY_BOX_MAP[commodity]})`,
    formula: `${formatGBP(grossCCL)} − ${formatGBP(exemptDeduction)} − ${formatGBP(creditDeduction)}`,
    amount: netCCLDue,
    educationalNote: netCCLDue < 0
      ? 'Negative amount — credits exceed liability. This will be repayable by HMRC.'
      : netCCLDue === 0
        ? 'No CCL due for this commodity this period.'
        : `This amount goes into Box ${COMMODITY_BOX_MAP[commodity]} on the CCL100.`,
  });

  return {
    commodity,
    commodityName: COMMODITY_NAMES[commodity],
    boxNumber: COMMODITY_BOX_MAP[commodity],
    standardQuantity: input.standardQuantity,
    standardRate: rate.mainRate,
    standardCCL,
    ccaQuantity: input.ccaQuantity,
    ccaRate: effectiveCCARate,
    ccaCCL,
    exemptQuantity: exemptQty,
    exemptDeduction,
    creditDeduction,
    netCCLDue,
    calculationSteps: steps,
    unit,
  };
}

// ─── Full Return Calculation ────────────────────────────────────────────────

/** Calculate all box values from inputs */
export function calculateReturn(inputs: CCL100Inputs): {
  boxes: CCL100Output['boxes'];
  breakdowns: CommodityBreakdown[];
  rateTable: RateTable;
} {
  const rateTable = getRateTableForPeriod(inputs.period);

  const breakdowns = COMMODITIES.map((commodity) => {
    const input = getCommodityInput(inputs, commodity);
    const rate = getCommodityRate(commodity, rateTable);
    return calculateCommodityBreakdown(commodity, input, rate, inputs.cca.hasCCA);
  });

  const box1 = breakdowns[0].netCCLDue; // electricity
  const box2 = breakdowns[1].netCCLDue; // gas
  const box3 = breakdowns[2].netCCLDue; // lpg
  const box4 = breakdowns[3].netCCLDue; // solid fuels
  const box5 = roundToPence(box1 + box2 + box3 + box4);

  // CPS boxes (only for generators — always 0 for H&C)
  const box6 = 0;
  const box7 = 0;
  const box8 = 0;
  const box9 = 0;

  return {
    boxes: { box1, box2, box3, box4, box5, box6, box7, box8, box9 },
    breakdowns,
    rateTable,
  };
}

// ─── Validation Engine ──────────────────────────────────────────────────────

/** V1: Box 5 calculation check */
function validateBox5Calculation(boxes: CCL100Output['boxes']): ValidationResult {
  const expected = roundToPence(boxes.box1 + boxes.box2 + boxes.box3 + boxes.box4);
  const matches = Math.abs(boxes.box5 - expected) < 0.01;

  return {
    ruleId: 'V1',
    severity: matches ? 'info' : 'error',
    message: matches
      ? `Box 5 correctly calculated: ${formatGBP(expected)} (Box 1: ${formatGBP(boxes.box1)} + Box 2: ${formatGBP(boxes.box2)} + Box 3: ${formatGBP(boxes.box3)} + Box 4: ${formatGBP(boxes.box4)}).`
      : `Box 5 calculation error. Expected ${formatGBP(expected)} but got ${formatGBP(boxes.box5)}.`,
    affectedBoxes: [1, 2, 3, 4, 5],
    passed: matches,
  };
}

/** V2: CCA without certificate */
function validateCCACertificate(inputs: CCL100Inputs): ValidationResult {
  const hasCCAQuantity = COMMODITIES.some((c) => {
    const input = getCommodityInput(inputs, c);
    return input.ccaQuantity > 0;
  });

  if (!hasCCAQuantity) {
    return {
      ruleId: 'V2',
      severity: 'info',
      message: 'No CCA quantities entered. CCA certificate check not applicable.',
      affectedBoxes: [1, 2, 3, 4],
      passed: true,
    };
  }

  if (hasCCAQuantity && !inputs.cca.hasCCA) {
    return {
      ruleId: 'V2',
      severity: 'error',
      message: 'CCA quantities entered but no Climate Change Agreement is in force. CCA reduced rates require a valid CCA certificate. Enable the CCA toggle and enter the certificate reference, or move these quantities to the standard-rate field.',
      affectedBoxes: [1, 2, 3, 4],
      passed: false,
    };
  }

  if (hasCCAQuantity && inputs.cca.hasCCA && !inputs.cca.ccaCertificateRef.trim()) {
    return {
      ruleId: 'V2',
      severity: 'error',
      message: 'CCA is in force but no certificate reference entered. HMRC requires the CCA certificate reference on the PP10 form. Enter the reference number from the Environment Agency certificate.',
      affectedBoxes: [1, 2, 3, 4],
      passed: false,
    };
  }

  return {
    ruleId: 'V2',
    severity: 'info',
    message: `CCA certificate ${inputs.cca.ccaCertificateRef} in force for ${inputs.cca.ccaFacilityName || 'the certified facility'}. CCA reduced rates correctly applied.`,
    affectedBoxes: [1, 2, 3, 4],
    passed: true,
  };
}

/** V3: CCA exceeds total */
function validateCCAQuantities(inputs: CCL100Inputs): ValidationResult {
  const issues: string[] = [];

  for (const commodity of COMMODITIES) {
    const input = getCommodityInput(inputs, commodity);
    const totalQty = input.standardQuantity + input.ccaQuantity;
    if (input.ccaQuantity > totalQty && totalQty > 0) {
      // This can't happen since ccaQuantity is separate, but guard against
      // the case where someone enters CCA > standard + CCA
    }
    // The real check: if CCA is entered without the toggle
    if (input.ccaQuantity > 0 && !inputs.cca.hasCCA) {
      issues.push(`${COMMODITY_NAMES[commodity]}: ${input.ccaQuantity.toLocaleString('en-GB')} ${COMMODITY_UNITS[commodity]} entered as CCA but no CCA is in force`);
    }
  }

  if (issues.length > 0) {
    return {
      ruleId: 'V3',
      severity: 'error',
      message: `CCA quantity issues: ${issues.join('; ')}.`,
      affectedBoxes: [1, 2, 3, 4],
      passed: false,
    };
  }

  return {
    ruleId: 'V3',
    severity: 'info',
    message: 'CCA quantities are within valid ranges.',
    affectedBoxes: [1, 2, 3, 4],
    passed: true,
  };
}

/** V4: Exemptions exceed supply */
function validateExemptions(inputs: CCL100Inputs): ValidationResult {
  const issues: string[] = [];

  for (const commodity of COMMODITIES) {
    const input = getCommodityInput(inputs, commodity);
    const totalSupply = input.standardQuantity + input.ccaQuantity;
    const totalExempt = totalExemptQuantity(input, commodity);

    if (totalExempt > totalSupply && totalExempt > 0) {
      issues.push(`${COMMODITY_NAMES[commodity]}: exempt quantity (${totalExempt.toLocaleString('en-GB')}) exceeds total supply (${totalSupply.toLocaleString('en-GB')})`);
    }
  }

  if (issues.length > 0) {
    return {
      ruleId: 'V4',
      severity: 'error',
      message: `Exemption issues: ${issues.join('; ')}. Exempt quantities cannot exceed total supply.`,
      affectedBoxes: [1, 2, 3, 4],
      passed: false,
    };
  }

  return {
    ruleId: 'V4',
    severity: 'info',
    message: 'Exemption quantities are within valid ranges.',
    affectedBoxes: [1, 2, 3, 4],
    passed: true,
  };
}

/** V5: Negative box warning */
function validateNegativeBoxes(boxes: CCL100Output['boxes']): ValidationResult {
  const negativeBoxes: string[] = [];
  if (boxes.box1 < 0) negativeBoxes.push('Box 1 (Electricity)');
  if (boxes.box2 < 0) negativeBoxes.push('Box 2 (Gas)');
  if (boxes.box3 < 0) negativeBoxes.push('Box 3 (LPG)');
  if (boxes.box4 < 0) negativeBoxes.push('Box 4 (Solid fuels)');

  if (negativeBoxes.length === 0) {
    return {
      ruleId: 'V5',
      severity: 'info',
      message: 'All commodity boxes are non-negative.',
      affectedBoxes: [1, 2, 3, 4],
      passed: true,
    };
  }

  return {
    ruleId: 'V5',
    severity: 'warning',
    message: `Negative amounts in: ${negativeBoxes.join(', ')}. This implies credits from prior periods exceed the current liability. Confirm this is correct — HMRC will repay the difference.`,
    affectedBoxes: [1, 2, 3, 4],
    passed: true, // Warning only — negative values are valid
  };
}

/** V6: LPG unit check */
function validateLPGUnits(inputs: CCL100Inputs): ValidationResult {
  const lpgInput = inputs.lpg;
  const hasLPG = lpgInput.standardQuantity > 0 || lpgInput.ccaQuantity > 0;

  if (!hasLPG) {
    return {
      ruleId: 'V6',
      severity: 'info',
      message: 'No LPG entries. Unit check not applicable.',
      affectedBoxes: [3],
      passed: true,
    };
  }

  return {
    ruleId: 'V6',
    severity: 'info',
    message: `LPG quantities entered in kg (correct unit). LPG rate is £0.02175/kg. Ensure quantities are not accidentally entered in kWh — LPG is the only commodity measured by weight, not energy content.`,
    affectedBoxes: [3],
    passed: true,
  };
}

/** V7: Zero return check */
function validateZeroReturn(boxes: CCL100Output['boxes']): ValidationResult {
  const isZero = boxes.box1 === 0 && boxes.box2 === 0 && boxes.box3 === 0 && boxes.box4 === 0;

  if (!isZero) {
    return {
      ruleId: 'V7',
      severity: 'info',
      message: 'Non-nil return.',
      affectedBoxes: [5],
      passed: true,
    };
  }

  return {
    ruleId: 'V7',
    severity: 'info',
    message: 'Nil return — all boxes are zero. Nil returns must still be filed by the deadline. Failure to file triggers the penalty points regime.',
    affectedBoxes: [1, 2, 3, 4, 5],
    passed: true,
  };
}

/** V8: Rate period check */
function validateRatePeriod(inputs: CCL100Inputs, rateTable: RateTable): ValidationResult {
  return {
    ruleId: 'V8',
    severity: 'info',
    message: `Rate period: ${rateTable.label} (${formatDate(rateTable.effectiveFrom)} to ${formatDate(rateTable.effectiveTo)}). Rates change on 1 April each year — confirm the period end date falls within this rate period.`,
    affectedBoxes: [1, 2, 3, 4],
    passed: true,
  };
}

/** V9: CCA rate application */
function validateCCARateApplication(inputs: CCL100Inputs, rateTable: RateTable): ValidationResult {
  if (!inputs.cca.hasCCA) {
    return {
      ruleId: 'V9',
      severity: 'info',
      message: 'No CCA in force. Full main rates applied to all supplies.',
      affectedBoxes: [1, 2, 3, 4],
      passed: true,
    };
  }

  const ccaDetails = COMMODITIES
    .filter((c) => getCommodityInput(inputs, c).ccaQuantity > 0)
    .map((c) => {
      const rate = getCommodityRate(c, rateTable);
      return `${COMMODITY_NAMES[c]}: ${formatPercent(rate.ccaDiscount)} discount → ${formatGBP(rate.ccaRate)}/${COMMODITY_UNITS[c]}`;
    });

  return {
    ruleId: 'V9',
    severity: 'info',
    message: ccaDetails.length > 0
      ? `CCA reduced rates applied: ${ccaDetails.join('; ')}.`
      : 'CCA is in force but no CCA quantities entered. Consider whether supplies should be split between standard and CCA rates.',
    affectedBoxes: [1, 2, 3, 4],
    passed: true,
  };
}

/** V10: Payment deadline */
function validatePaymentDeadline(inputs: CCL100Inputs): ValidationResult {
  const deadline = addDays(inputs.period.endDate, FILING_DEADLINE_DAYS);
  const deadlineFormatted = formatDate(deadline);

  return {
    ruleId: 'V10',
    severity: 'info',
    message: `Payment and filing deadline: ${deadlineFormatted} (30 days after period end ${formatDate(inputs.period.endDate)}). Late filing triggers penalty points and may result in HMRC requiring monthly filing.`,
    affectedBoxes: [5],
    passed: true,
  };
}

/** Run all 10 validation rules */
export function validateReturn(
  inputs: CCL100Inputs,
  boxes: CCL100Output['boxes'],
  rateTable: RateTable
): ValidationResult[] {
  return [
    validateBox5Calculation(boxes),
    validateCCACertificate(inputs),
    validateCCAQuantities(inputs),
    validateExemptions(inputs),
    validateNegativeBoxes(boxes),
    validateLPGUnits(inputs),
    validateZeroReturn(boxes),
    validateRatePeriod(inputs, rateTable),
    validateCCARateApplication(inputs, rateTable),
    validatePaymentDeadline(inputs),
  ];
}

/** Summarise validation results */
export function summariseValidation(results: ValidationResult[]) {
  return {
    errors: results.filter((r) => r.severity === 'error' && !r.passed).length,
    warnings: results.filter((r) => r.severity === 'warning' && !r.passed).length,
    info: results.filter((r) => r.severity === 'info').length,
    passed: results.filter((r) => r.passed).length,
    total: results.length,
  };
}

// ─── Rate Reference Builder ─────────────────────────────────────────────────

/** Build the rate reference panel data */
export function buildRateReference(rateTable: RateTable): RateReference {
  const rates: RateReference['rates'] = {} as RateReference['rates'];

  for (const commodity of COMMODITIES) {
    const r = rateTable.rates[commodity];
    rates[commodity] = {
      mainRate: r.mainRate,
      unit: `£/${r.unit}`,
      ccaDiscount: formatPercent(r.ccaDiscount),
      ccaRate: r.ccaRate,
    };
  }

  return {
    period: rateTable.period,
    periodLabel: rateTable.label,
    rates,
  };
}

// ─── Full Output Builder ────────────────────────────────────────────────────

/** Determine CCL position from Box 5 */
export function determinePosition(box5: number): CCLPosition {
  if (box5 > 0) return 'payable';
  if (box5 < 0) return 'repayable';
  return 'nil';
}

/** Build the complete CCL100 output */
export function buildReturnOutput(inputs: CCL100Inputs): CCL100Output {
  const { boxes, breakdowns, rateTable } = calculateReturn(inputs);
  const position = determinePosition(boxes.box5);
  const validationResults = validateReturn(inputs, boxes, rateTable);
  const validationSummary = summariseValidation(validationResults);
  const paymentDeadline = addDays(inputs.period.endDate, FILING_DEADLINE_DAYS);
  const rateReference = buildRateReference(rateTable);

  return {
    boxes,
    position,
    commodityBreakdowns: breakdowns,
    validationResults,
    validationSummary,
    paymentDeadline,
    paymentDeadlineLabel: formatDate(paymentDeadline),
    rateReference,
  };
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

/**
 * Pre-configured test scenarios from the H&C storyline.
 * These provide expected answers for graded mode and
 * pre-fill inputs for guided mode.
 *
 * Fact register values:
 * - Electricity: 1,600,000 kWh (per quarter, all CCA-covered)
 * - Gas: 1,200,000 kWh (per quarter, all CCA-covered)
 * - CCA: Climate Change Agreement for Swansea plant
 * - No LPG, no solid fuels at Swansea
 *
 * Rate period: 2025/26 (£0.00775/kWh for electricity and gas)
 * CCA discounts: electricity 92%, gas 89%
 *
 * Electricity CCA rate: £0.00775 × (1 − 0.92) = £0.00062/kWh
 * Gas CCA rate: £0.00775 × (1 − 0.89) = £0.0008525/kWh
 *
 * Electricity CCL: 1,600,000 × £0.00062 = £992.00
 * Gas CCL: 1,200,000 × £0.0008525 = £1,023.00
 * Net CCL: £2,015.00
 */
export const HC_SCENARIOS: HCScenario[] = [
  // ── Scenario 1: Section 9 — CCL for Swansea Plant ──────────────────────────
  {
    id: 's9-swansea-ccl',
    name: 'S9 — CCL for Swansea Plant',
    section: 9,
    description:
      'H&C\'s Swansea manufacturing plant consumes 1.6m kWh electricity and 1.2m kWh gas per quarter. The plant has a Climate Change Agreement. Calculate the quarterly CCL return.',
    config: {
      showTooltips: true,
      showBreakdowns: true,
      showCPSBoxes: false,
      scenarioLabel: 'S9 — Swansea CCL',
    },
    preFilledInputs: {
      period: {
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        label: 'Q4 2025/26',
      },
      cca: {
        hasCCA: true,
        ccaCertificateRef: 'CCA/SW/2024/0847',
        ccaFacilityName: 'Swansea Manufacturing Plant',
      },
      isElectricityGenerator: false,
      electricity: {
        standardQuantity: 0,
        ccaQuantity: 1_600_000,
        exemptRenewables: 0,
        exemptCHP: 0,
        exemptMineralogical: 0,
        creditFromPrior: 0,
      },
      gas: {
        standardQuantity: 0,
        ccaQuantity: 1_200_000,
        exemptRenewables: 0,
        exemptCHP: 0,
        exemptMineralogical: 0,
        creditFromPrior: 0,
      },
      lpg: createEmptyCommodityInput(),
      solidFuels: createEmptyCommodityInput(),
    },
    expectedAnswers: {
      box1: 992.00,    // 1,600,000 × £0.00062 = £992.00
      box2: 1_023.00,  // 1,200,000 × £0.0008525 = £1,023.00
      box3: 0,
      box4: 0,
      box5: 2_015.00,
      box6: 0,
      box7: 0,
      box8: 0,
      box9: 0,
    },
    hints: {
      electricity: [
        'All 1.6m kWh is covered by the CCA — enter the full amount in the CCA quantity field.',
        'CCA discount for electricity is 92%. Effective rate: £0.00775 × 8% = £0.00062/kWh.',
        'No standard-rate electricity — the entire supply is CCA-covered.',
        'No renewable exemption — H&C uses grid electricity, not auto-generated renewables.',
      ],
      gas: [
        'All 1.2m kWh is covered by the CCA — enter the full amount in the CCA quantity field.',
        'CCA discount for gas is 89%. Effective rate: £0.00775 × 11% = £0.0008525/kWh.',
        'No CPS rate applies — H&C uses gas for manufacturing, not electricity generation.',
      ],
      lpg: [
        'H&C\'s Swansea plant does not use LPG. Leave this section empty.',
      ],
      'solid-fuels': [
        'H&C\'s Swansea plant does not use solid fuels. Leave this section empty.',
      ],
    },
  },

  // ── Scenario 2: Section 10 — Q4 CCL Return (Capstone) ─────────────────────
  {
    id: 's10-capstone-ccl',
    name: 'S10 — Q4 CCL Return (Capstone)',
    section: 10,
    description:
      'Year-end Q4 CCL return for the Swansea plant. Same quarterly consumption as Section 9. Part of the full capstone compliance pack alongside the Q4 VAT return.',
    config: {
      showTooltips: true,
      showBreakdowns: true,
      showCPSBoxes: false,
      scenarioLabel: 'S10 — Q4 CCL Capstone',
    },
    preFilledInputs: {
      period: {
        startDate: '2027-01-01',
        endDate: '2027-03-31',
        label: 'Q4 2026/27',
      },
      cca: {
        hasCCA: true,
        ccaCertificateRef: 'CCA/SW/2024/0847',
        ccaFacilityName: 'Swansea Manufacturing Plant',
      },
      isElectricityGenerator: false,
      electricity: {
        standardQuantity: 0,
        ccaQuantity: 1_600_000,
        exemptRenewables: 0,
        exemptCHP: 0,
        exemptMineralogical: 0,
        creditFromPrior: 0,
      },
      gas: {
        standardQuantity: 0,
        ccaQuantity: 1_200_000,
        exemptRenewables: 0,
        exemptCHP: 0,
        exemptMineralogical: 0,
        creditFromPrior: 0,
      },
      lpg: createEmptyCommodityInput(),
      solidFuels: createEmptyCommodityInput(),
    },
    expectedAnswers: {
      box1: 1_025.28,  // 1,600,000 × (£0.00801 × 0.08) = 1,600,000 × £0.0006408 = £1,025.28
      box2: 1_057.32,  // 1,200,000 × (£0.00801 × 0.11) = 1,200,000 × £0.0008811 = £1,057.32 (rounded)
      box3: 0,
      box4: 0,
      box5: 2_082.60,  // £1,025.28 + £1,057.32
      box6: 0,
      box7: 0,
      box8: 0,
      box9: 0,
    },
    hints: {
      electricity: [
        'Q4 2026/27 uses 2026/27 rates (£0.00801/kWh for electricity). Rates changed on 1 April 2026.',
        'CCA discount remains at 92%. New effective rate: £0.00801 × 8% = £0.0006408/kWh.',
        'All 1.6m kWh remains CCA-covered.',
      ],
      gas: [
        'Q4 2026/27 uses 2026/27 rates (£0.00801/kWh for gas). Same rate as electricity.',
        'CCA discount remains at 89%. New effective rate: £0.00801 × 11% = £0.0008811/kWh.',
        'All 1.2m kWh remains CCA-covered.',
      ],
      lpg: [
        'No LPG. Leave empty.',
      ],
      'solid-fuels': [
        'No solid fuels. Leave empty.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCScenario | undefined {
  return HC_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C scenarios by section number */
export function getScenariosBySection(section: number): HCScenario[] {
  return HC_SCENARIOS.filter((s) => s.section === section);
}
