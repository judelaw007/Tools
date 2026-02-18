/**
 * Customs Valuation Worksheet — Utility Functions
 *
 * Pure functions for calculating customs value under Method 1,
 * Incoterms adjustments, currency conversion, validation,
 * build-up generation, and H&C test scenarios.
 *
 * All monetary values in GBP with pence precision (2 decimal places).
 */

import type {
  IncotermsCode,
  IncotermsProfile,
  CurrencyCode,
  CurrencyInfo,
  ValuationMethod,
  ValidationRuleId,
  ValidationSeverity,
  ValidationResult,
  ValuationInputs,
  ValuationOutput,
  BuildUpLine,
  AdditionsBreakdown,
  DeductionsBreakdown,
  ValuationConfig,
  HCValuationScenario,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** UK VAT standard rate (20%) — VATA 1994, s 2(1) */
export const STANDARD_VAT_RATE = 20;

/** UK VAT zero rate (0%) — VATA 1994, s 30, Sch 8 */
export const ZERO_VAT_RATE = 0;

/** HMRC notional insurance imputation rate (1% of CIF value) */
export const NOTIONAL_INSURANCE_RATE = 0.01;

/** Related party control threshold — 5% of voting power (TCTA 2018, s 19) */
export const RELATED_PARTY_THRESHOLD = 0.05;

// ─── Incoterms Reference Data ─────────────────────────────────────────────────

/** Complete Incoterms 2020 profiles with freight/insurance requirements */
export const INCOTERMS_PROFILES: IncotermsProfile[] = [
  {
    code: 'EXW',
    name: 'Ex Works',
    group: 'E',
    freightRequirement: 'add',
    insuranceRequirement: 'add',
    description: 'Seller delivers goods at their premises. Buyer bears all costs from that point.',
    educationalNote: 'EXW requires the most adjustments. You must add ALL transport and insurance costs from the seller\'s premises to the UK port of importation.',
  },
  {
    code: 'FCA',
    name: 'Free Carrier',
    group: 'F',
    freightRequirement: 'add',
    insuranceRequirement: 'add',
    description: 'Seller delivers to a named carrier. Buyer pays onward freight and insurance.',
    educationalNote: 'FCA delivers to the first carrier. Add freight from that carrier to the UK port, plus insurance for the entire journey.',
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    group: 'F',
    freightRequirement: 'add',
    insuranceRequirement: 'add',
    description: 'Seller delivers goods alongside the vessel. Buyer pays loading, freight, and insurance.',
    educationalNote: 'FAS delivers to the quayside. Add freight from the port of loading to the UK port, plus insurance.',
  },
  {
    code: 'FOB',
    name: 'Free on Board',
    group: 'F',
    freightRequirement: 'add',
    insuranceRequirement: 'add',
    description: 'Seller delivers goods loaded on the vessel. Buyer pays onward freight and insurance.',
    educationalNote: 'FOB is common in international trade. The seller loads goods on the vessel — the buyer must add freight from the port of loading to the UK port, plus insurance. This is the term used for H&C\'s olive oil from Italy.',
  },
  {
    code: 'CFR',
    name: 'Cost and Freight',
    group: 'C',
    freightRequirement: 'included',
    insuranceRequirement: 'add',
    description: 'Seller pays freight to the named port. Buyer arranges and pays insurance.',
    educationalNote: 'CFR includes freight but NOT insurance. You only need to add insurance to the customs value.',
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance & Freight',
    group: 'C',
    freightRequirement: 'included',
    insuranceRequirement: 'included',
    description: 'Seller pays freight and insurance to the named port. Price includes both.',
    educationalNote: 'CIF includes both freight and insurance to the port of importation. No transport adjustments needed. However, you must still add any additions (assists, royalties, etc.). This is the term used for H&C\'s ceramic cups from Japan.',
  },
  {
    code: 'CIP',
    name: 'Carriage & Insurance Paid To',
    group: 'C',
    freightRequirement: 'included',
    insuranceRequirement: 'included',
    description: 'Seller pays freight and insurance to a named place. May extend beyond the port.',
    educationalNote: 'CIP includes freight and insurance. If the named place is beyond the UK port, you may need to deduct post-port transport costs.',
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    group: 'C',
    freightRequirement: 'included',
    insuranceRequirement: 'add',
    description: 'Seller pays freight to a named place. Buyer arranges insurance.',
    educationalNote: 'CPT includes freight but not insurance. Add insurance to reach the UK port.',
  },
  {
    code: 'DAP',
    name: 'Delivered at Place',
    group: 'D',
    freightRequirement: 'included',
    insuranceRequirement: 'included',
    description: 'Seller delivers goods at a named place, ready for unloading. Includes freight and insurance.',
    educationalNote: 'DAP includes all transport to the named place. If the named place is beyond the UK port, deduct post-port transport costs from the customs value.',
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    group: 'D',
    freightRequirement: 'included',
    insuranceRequirement: 'included',
    description: 'Seller delivers goods unloaded at a named place. Includes freight, insurance, and unloading.',
    educationalNote: 'DPU includes transport and unloading. Deduct any post-port transport and unloading costs if the named place is beyond the UK port.',
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    group: 'D',
    freightRequirement: 'included',
    insuranceRequirement: 'included',
    description: 'Seller delivers goods duty-paid at a named place. Price includes duty, freight, and insurance.',
    educationalNote: 'DDP includes everything — freight, insurance, and import duty. You must deduct the duty element from the invoice price to avoid double-counting when calculating duty on the customs value. Also deduct post-port transport if the delivery place is inland.',
  },
];

/** Get the Incoterms profile for a given code */
export function getIncotermsProfile(code: IncotermsCode): IncotermsProfile {
  const profile = INCOTERMS_PROFILES.find((p) => p.code === code);
  if (!profile) throw new Error(`Unknown Incoterms code: ${code}`);
  return profile;
}

/** Check if freight must be added for this Incoterm */
export function requiresFreightAdjustment(code: IncotermsCode): boolean {
  return getIncotermsProfile(code).freightRequirement === 'add';
}

/** Check if insurance must be added for this Incoterm */
export function requiresInsuranceAdjustment(code: IncotermsCode): boolean {
  return getIncotermsProfile(code).insuranceRequirement === 'add';
}

/** Check if freight/insurance is already included for this Incoterm */
export function freightInsuranceIncluded(code: IncotermsCode): boolean {
  const profile = getIncotermsProfile(code);
  return profile.freightRequirement === 'included' && profile.insuranceRequirement === 'included';
}

// ─── Currency Reference Data ──────────────────────────────────────────────────

/** Supported currencies with illustrative HMRC rates */
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', illustrativeRate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', illustrativeRate: 1.1765 },
  { code: 'USD', name: 'US Dollar', symbol: '$', illustrativeRate: 1.2700 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', illustrativeRate: 191.42 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', illustrativeRate: 9.15 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', illustrativeRate: 106.00 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', illustrativeRate: 1.95 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', illustrativeRate: 1.75 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', illustrativeRate: 1.12 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', illustrativeRate: 1680.00 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', illustrativeRate: 40.50 },
];

/** Get currency info by code */
export function getCurrencyByCode(code: CurrencyCode): CurrencyInfo | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

/** Get the symbol for a currency */
export function getCurrencySymbol(code: CurrencyCode): string {
  return getCurrencyByCode(code)?.symbol ?? code;
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places (pence precision) */
export function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Format a GBP amount with £ sign and commas */
export function formatGBP(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format a foreign currency amount */
export function formatCurrency(amount: number, code: CurrencyCode): string {
  const symbol = getCurrencySymbol(code);
  return `${symbol}${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Core Calculations ───────────────────────────────────────────────────────

/**
 * Convert invoice price from foreign currency to GBP.
 * HMRC rates are expressed as foreign currency per £1 GBP — so divide.
 */
export function convertToGBP(amount: number, exchangeRate: number): number {
  if (exchangeRate <= 0) return 0;
  return roundToPence(amount / exchangeRate);
}

/**
 * Calculate Incoterms adjustment.
 * Returns the freight and insurance amounts to add to the invoice price.
 * For CIF/CIP/DAP/DPU/DDP terms, freight and insurance are already included — return zero.
 */
export function calculateIncotermsAdjustment(
  incoterms: IncotermsCode,
  freightToPort: number,
  insuranceToPort: number
): { freight: number; insurance: number; total: number } {
  const profile = getIncotermsProfile(incoterms);

  const freight = profile.freightRequirement === 'add' ? roundToPence(freightToPort) : 0;

  let insurance: number;
  if (profile.insuranceRequirement === 'add') {
    insurance = roundToPence(insuranceToPort);
  } else {
    insurance = 0;
  }

  return {
    freight,
    insurance,
    total: roundToPence(freight + insurance),
  };
}

/** Calculate total additions */
export function calculateAdditions(
  sellingCommissions: number,
  royalties: number,
  assists: number,
  packingCosts: number
): AdditionsBreakdown {
  return {
    sellingCommissions: roundToPence(sellingCommissions),
    royalties: roundToPence(royalties),
    assists: roundToPence(assists),
    packingCosts: roundToPence(packingCosts),
    total: roundToPence(sellingCommissions + royalties + assists + packingCosts),
  };
}

/** Calculate total deductions */
export function calculateDeductions(
  postImportTransport: number,
  installationAssembly: number
): DeductionsBreakdown {
  return {
    postImportTransport: roundToPence(postImportTransport),
    installationAssembly: roundToPence(installationAssembly),
    total: roundToPence(postImportTransport + installationAssembly),
  };
}

/** Calculate customs value from all components */
export function calculateCustomsValue(
  invoicePriceGBP: number,
  incotermsAdjustmentTotal: number,
  additionsTotal: number,
  deductionsTotal: number
): number {
  return roundToPence(invoicePriceGBP + incotermsAdjustmentTotal + additionsTotal - deductionsTotal);
}

/** Calculate duty amount */
export function calculateDuty(customsValue: number, dutyRatePercent: number): number {
  return roundToPence(customsValue * (dutyRatePercent / 100));
}

/** Calculate VAT value (customs value + duty) */
export function calculateVATValue(customsValue: number, dutyAmount: number): number {
  return roundToPence(customsValue + dutyAmount);
}

/** Calculate import VAT */
export function calculateImportVAT(vatValue: number, vatRatePercent: number): number {
  return roundToPence(vatValue * (vatRatePercent / 100));
}

/** Check if Method 1 is applicable */
export function isMethod1Applicable(relatedParty: boolean, armsLengthConfirmed: boolean): boolean {
  if (!relatedParty) return true;
  return armsLengthConfirmed;
}

// ─── Build-Up Generator ─────────────────────────────────────────────────────

/** Generate the itemised build-up lines for display */
export function generateBuildUp(
  inputs: ValuationInputs,
  invoicePriceGBP: number,
  incotermsAdj: { freight: number; insurance: number; total: number },
  additions: AdditionsBreakdown,
  deductions: DeductionsBreakdown,
  customsValue: number,
  dutyAmount: number,
  vatValue: number,
  importVAT: number,
  totalDutyAndVAT: number
): BuildUpLine[] {
  const lines: BuildUpLine[] = [];
  const isGBP = inputs.currency === 'GBP';

  // Invoice price
  const priceLabel = isGBP
    ? `Invoice price`
    : `Invoice price (${getCurrencySymbol(inputs.currency)}${inputs.invoicePrice.toLocaleString('en-GB')} ÷ ${inputs.exchangeRate})`;
  lines.push({
    label: priceLabel,
    amount: invoicePriceGBP,
    type: 'base',
    educationalNote: 'The starting point for Method 1. This is the price actually paid or payable — not the market value or theoretical value.',
  });

  // Incoterms adjustments
  if (incotermsAdj.freight > 0) {
    lines.push({
      label: `Freight to ${inputs.portOfImportation} (${inputs.incoterms} adjustment)`,
      amount: incotermsAdj.freight,
      type: 'add',
      educationalNote: `Under ${inputs.incoterms}, freight to the UK port is NOT included in the invoice price. It must be added to reach the customs value.`,
    });
  }
  if (incotermsAdj.insurance > 0) {
    lines.push({
      label: `Insurance to ${inputs.portOfImportation} (${inputs.incoterms} adjustment)`,
      amount: incotermsAdj.insurance,
      type: 'add',
      educationalNote: `Under ${inputs.incoterms}, insurance during transit is NOT included in the invoice price. It must be added.`,
    });
  }
  if (incotermsAdj.total === 0 && freightInsuranceIncluded(inputs.incoterms)) {
    lines.push({
      label: `Incoterms adjustment (${inputs.incoterms} — freight & insurance already included)`,
      amount: 0,
      type: 'add',
      educationalNote: `Under ${inputs.incoterms}, the invoice price already includes freight and insurance to the port of importation. No adjustment is needed. Be careful not to add freight or insurance separately — this is a common double-counting error.`,
    });
  }

  // Additions
  if (additions.sellingCommissions > 0) {
    lines.push({
      label: 'Add: Selling commissions',
      amount: additions.sellingCommissions,
      type: 'add',
      educationalNote: 'Commissions paid by the buyer to the seller\'s agent are added to the customs value. Buying commissions (to the buyer\'s own agent) are NOT added — this distinction is frequently tested.',
    });
  }
  if (additions.royalties > 0) {
    lines.push({
      label: 'Add: Royalties / licence fees',
      amount: additions.royalties,
      type: 'add',
      educationalNote: 'Royalties are added only if: (1) they relate to the imported goods, AND (2) payment is a condition of the sale.',
    });
  }
  if (additions.assists > 0) {
    lines.push({
      label: 'Add: Assists (moulds, tools, materials provided by buyer)',
      amount: additions.assists,
      type: 'add',
      educationalNote: 'Free-of-charge materials, moulds, or tools provided by the buyer to the seller must be added to the customs value. The value is the cost to the buyer. If the assist benefits multiple shipments, apportion the value.',
    });
  }
  if (additions.packingCosts > 0) {
    lines.push({
      label: 'Add: Packing costs',
      amount: additions.packingCosts,
      type: 'add',
      educationalNote: 'Packing costs are added only if they are not already included in the invoice price.',
    });
  }

  // Deductions
  if (deductions.postImportTransport > 0) {
    lines.push({
      label: 'Deduct: Post-import transport',
      amount: -deductions.postImportTransport,
      type: 'deduct',
      educationalNote: 'Transport costs after the goods arrive at the UK port are deductible — but only if separately identified in the contract or invoice.',
    });
  }
  if (deductions.installationAssembly > 0) {
    lines.push({
      label: 'Deduct: Installation / assembly',
      amount: -deductions.installationAssembly,
      type: 'deduct',
      educationalNote: 'Post-import installation, assembly, or technical assistance is deductible if separately identified and incurred after importation.',
    });
  }

  // Customs value subtotal
  lines.push({
    label: 'Customs Value (declared on CDS — Data Element 4/14)',
    amount: customsValue,
    type: 'subtotal',
    educationalNote: 'This is the customs value — the base on which duty is calculated. This figure is declared on the CDS import declaration.',
  });

  // Duty
  lines.push({
    label: `Customs duty (${inputs.dutyRatePercent}%)`,
    amount: dutyAmount,
    type: 'add',
    educationalNote: `Duty is calculated as the customs value × the applicable duty rate. The rate comes from the UK Trade Tariff for commodity code ${inputs.commodityCode || 'N/A'} and the country of origin.`,
  });

  // VAT value
  lines.push({
    label: 'Value for VAT (customs value + duty)',
    amount: vatValue,
    type: 'subtotal',
    educationalNote: 'Import VAT is charged on the customs value PLUS the duty amount. This is different from domestic VAT, which is charged on the net sale price only.',
  });

  // Import VAT
  lines.push({
    label: `Import VAT (${inputs.vatRatePercent}%)`,
    amount: importVAT,
    type: 'add',
    educationalNote: inputs.vatRatePercent === 0
      ? 'This commodity is zero-rated for VAT purposes (e.g., food under VATA Sch 8 Group 1). No import VAT is payable.'
      : 'Import VAT at the standard rate. If using Postponed VAT Accounting (PVA), this amount is self-assessed in Box 1 and recovered in Box 4 of the VAT return.',
  });

  // Total
  lines.push({
    label: 'Total duty and VAT payable on importation',
    amount: totalDutyAndVAT,
    type: 'total',
    educationalNote: 'The total amount payable to HMRC on importation. This can be paid immediately, via a duty deferment account, or using PVA for the VAT element.',
  });

  return lines;
}

// ─── Validation Engine ───────────────────────────────────────────────────────

/** V1: FOB freight check — Incoterms requiring freight should have it entered */
function validateFOBFreight(inputs: ValuationInputs): ValidationResult {
  const needsFreight = requiresFreightAdjustment(inputs.incoterms);

  if (!needsFreight) {
    return {
      ruleId: 'V1',
      severity: 'info',
      message: `${inputs.incoterms} includes freight to the port. No separate freight adjustment required.`,
      affectedFields: ['freightToPort', 'incoterms'],
      passed: true,
    };
  }

  if (inputs.freightToPort <= 0) {
    return {
      ruleId: 'V1',
      severity: 'warning',
      message: `${inputs.incoterms} does NOT include freight to the UK port. You should add the freight cost to ensure the customs value includes transport to ${inputs.portOfImportation || 'the UK port'}.`,
      affectedFields: ['freightToPort', 'incoterms'],
      passed: false,
    };
  }

  return {
    ruleId: 'V1',
    severity: 'info',
    message: `Freight of ${formatGBP(inputs.freightToPort)} correctly added for ${inputs.incoterms} terms.`,
    affectedFields: ['freightToPort', 'incoterms'],
    passed: true,
  };
}

/** V2: CIF double-count check — CIF terms should not have separate freight/insurance */
function validateCIFDoubleCount(inputs: ValuationInputs): ValidationResult {
  const included = freightInsuranceIncluded(inputs.incoterms);

  if (!included) {
    return {
      ruleId: 'V2',
      severity: 'info',
      message: `${inputs.incoterms} does not include all transport costs. CIF double-count check not applicable.`,
      affectedFields: ['freightToPort', 'insuranceToPort', 'incoterms'],
      passed: true,
    };
  }

  const hasFreight = inputs.freightToPort > 0;
  const hasInsurance = inputs.insuranceToPort > 0;

  if (hasFreight || hasInsurance) {
    const parts: string[] = [];
    if (hasFreight) parts.push(`freight (${formatGBP(inputs.freightToPort)})`);
    if (hasInsurance) parts.push(`insurance (${formatGBP(inputs.insuranceToPort)})`);
    return {
      ruleId: 'V2',
      severity: 'warning',
      message: `${inputs.incoterms} already includes freight and insurance in the invoice price. You have also entered separate ${parts.join(' and ')}. Check this is not double-counting — these amounts will NOT be added to the customs value under ${inputs.incoterms} terms.`,
      affectedFields: ['freightToPort', 'insuranceToPort', 'incoterms'],
      passed: false,
    };
  }

  return {
    ruleId: 'V2',
    severity: 'info',
    message: `${inputs.incoterms} correctly used with no separate freight or insurance — these are already in the invoice price.`,
    affectedFields: ['freightToPort', 'insuranceToPort', 'incoterms'],
    passed: true,
  };
}

/** V3: Related party Method 1 check */
function validateRelatedParty(inputs: ValuationInputs): ValidationResult {
  if (!inputs.relatedParty) {
    return {
      ruleId: 'V3',
      severity: 'info',
      message: 'Buyer and seller are not related. Method 1 can be used without restriction.',
      affectedFields: ['relatedParty'],
      passed: true,
    };
  }

  if (inputs.armsLengthConfirmed) {
    return {
      ruleId: 'V3',
      severity: 'info',
      message: 'Related party transaction — arm\'s length value confirmed. Method 1 can still be used, but HMRC may request evidence.',
      affectedFields: ['relatedParty', 'armsLengthConfirmed'],
      passed: true,
    };
  }

  return {
    ruleId: 'V3',
    severity: 'warning',
    message: 'Related party transaction and arm\'s length NOT confirmed. Method 1 may not be applicable. Consider using Methods 2–6 or providing evidence that the relationship did not influence the price.',
    affectedFields: ['relatedParty', 'armsLengthConfirmed'],
    passed: false,
  };
}

/** V4: Currency conversion check */
function validateCurrencyConversion(inputs: ValuationInputs): ValidationResult {
  if (inputs.currency === 'GBP') {
    return {
      ruleId: 'V4',
      severity: 'info',
      message: 'Invoice in GBP. No currency conversion required.',
      affectedFields: ['currency', 'exchangeRate'],
      passed: true,
    };
  }

  if (inputs.exchangeRate <= 0) {
    return {
      ruleId: 'V4',
      severity: 'error',
      message: 'Exchange rate must be greater than zero for non-GBP invoices.',
      affectedFields: ['exchangeRate'],
      passed: false,
    };
  }

  return {
    ruleId: 'V4',
    severity: 'info',
    message: `Currency conversion: ${getCurrencySymbol(inputs.currency)}${inputs.invoicePrice.toLocaleString('en-GB')} ÷ ${inputs.exchangeRate} = ${formatGBP(convertToGBP(inputs.invoicePrice, inputs.exchangeRate))}. Ensure you are using the HMRC-published monthly rate, not a bank or spot rate.`,
    affectedFields: ['currency', 'exchangeRate'],
    passed: true,
  };
}

/** V5: Assists apportionment check */
function validateAssistsApportionment(inputs: ValuationInputs): ValidationResult {
  if (inputs.additions.assists <= 0) {
    return {
      ruleId: 'V5',
      severity: 'info',
      message: 'No assists declared. Apportionment check not applicable.',
      affectedFields: ['assists'],
      passed: true,
    };
  }

  return {
    ruleId: 'V5',
    severity: 'info',
    message: `Assists of ${formatGBP(inputs.additions.assists)} declared. If these assists benefit multiple shipments (e.g., moulds used for repeat orders), the value must be apportioned across all shipments that benefit. The full value should only be included if this is a one-off shipment.`,
    affectedFields: ['assists'],
    passed: true,
  };
}

/** V6: Method 1 conditions met — related + no arm's length = error */
function validateMethod1Conditions(inputs: ValuationInputs): ValidationResult {
  if (inputs.valuationMethod !== 1) {
    return {
      ruleId: 'V6',
      severity: 'info',
      message: `Valuation Method ${inputs.valuationMethod} selected. Method 1 condition check not applicable. Note: this tool calculates Method 1 only — Methods 2–6 require different data.`,
      affectedFields: ['valuationMethod'],
      passed: true,
    };
  }

  if (inputs.relatedParty && !inputs.armsLengthConfirmed) {
    return {
      ruleId: 'V6',
      severity: 'error',
      message: 'Method 1 cannot be used: buyer and seller are related, and arm\'s length value has not been confirmed. Use Methods 2–6 or obtain evidence that the relationship did not influence the price (TCTA 2018, s 19).',
      affectedFields: ['relatedParty', 'armsLengthConfirmed', 'valuationMethod'],
      passed: false,
    };
  }

  return {
    ruleId: 'V6',
    severity: 'info',
    message: 'Method 1 conditions satisfied. Transaction value can be used as the customs value.',
    affectedFields: ['valuationMethod'],
    passed: true,
  };
}

/** V7: Negative customs value check */
function validatePositiveCustomsValue(customsValue: number): ValidationResult {
  if (customsValue <= 0) {
    return {
      ruleId: 'V7',
      severity: 'error',
      message: `Customs value is ${formatGBP(customsValue)} — this cannot be correct. Customs value must be positive. Check that deductions do not exceed the adjusted invoice price.`,
      affectedFields: ['customsValue'],
      passed: false,
    };
  }

  return {
    ruleId: 'V7',
    severity: 'info',
    message: `Customs value: ${formatGBP(customsValue)}.`,
    affectedFields: ['customsValue'],
    passed: true,
  };
}

/** V8: Zero invoice price check */
function validateInvoicePrice(inputs: ValuationInputs): ValidationResult {
  if (inputs.invoicePrice <= 0) {
    return {
      ruleId: 'V8',
      severity: 'error',
      message: 'Invoice price is zero or negative. Under Method 1, the customs value is based on the price actually paid or payable — a zero price is only valid for genuine free-of-charge supplies (very rare).',
      affectedFields: ['invoicePrice'],
      passed: false,
    };
  }

  return {
    ruleId: 'V8',
    severity: 'info',
    message: `Invoice price: ${formatCurrency(inputs.invoicePrice, inputs.currency)}.`,
    affectedFields: ['invoicePrice'],
    passed: true,
  };
}

/** V9: DDP duty deduction reminder */
function validateDDPDutyDeduction(inputs: ValuationInputs): ValidationResult {
  if (inputs.incoterms !== 'DDP') {
    return {
      ruleId: 'V9',
      severity: 'info',
      message: 'Not DDP terms. Duty deduction check not applicable.',
      affectedFields: ['incoterms'],
      passed: true,
    };
  }

  return {
    ruleId: 'V9',
    severity: 'info',
    message: 'DDP terms: the invoice price includes import duty. Ensure you deduct the duty element from the invoice price before calculating duty — otherwise you will be charging duty on duty (double-counting).',
    affectedFields: ['incoterms', 'invoicePrice'],
    passed: true,
  };
}

/** V10: Insurance estimation — if freight Incoterm but no insurance */
function validateInsuranceEstimation(inputs: ValuationInputs): ValidationResult {
  const needsInsurance = requiresInsuranceAdjustment(inputs.incoterms);

  if (!needsInsurance) {
    return {
      ruleId: 'V10',
      severity: 'info',
      message: `${inputs.incoterms} includes insurance. No separate insurance required.`,
      affectedFields: ['insuranceToPort'],
      passed: true,
    };
  }

  if (inputs.insuranceToPort <= 0 && inputs.freightToPort > 0) {
    return {
      ruleId: 'V10',
      severity: 'info',
      message: `You have entered freight but no insurance. Note that HMRC may impute a notional insurance charge (typically 1% of CIF value) if no actual insurance was taken out. Consider whether insurance should be included.`,
      affectedFields: ['insuranceToPort'],
      passed: true,
    };
  }

  return {
    ruleId: 'V10',
    severity: 'info',
    message: `Insurance of ${formatGBP(inputs.insuranceToPort)} entered.`,
    affectedFields: ['insuranceToPort'],
    passed: true,
  };
}

/** Run all 10 validation rules and return results */
export function validateWorksheet(
  inputs: ValuationInputs,
  customsValue: number
): ValidationResult[] {
  return [
    validateFOBFreight(inputs),
    validateCIFDoubleCount(inputs),
    validateRelatedParty(inputs),
    validateCurrencyConversion(inputs),
    validateAssistsApportionment(inputs),
    validateMethod1Conditions(inputs),
    validatePositiveCustomsValue(customsValue),
    validateInvoicePrice(inputs),
    validateDDPDutyDeduction(inputs),
    validateInsuranceEstimation(inputs),
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

// ─── Complete Calculation ────────────────────────────────────────────────────

/** Perform the full customs valuation calculation from inputs */
export function calculateValuation(inputs: ValuationInputs): ValuationOutput {
  // Step 1: Currency conversion
  const invoicePriceGBP = inputs.currency === 'GBP'
    ? roundToPence(inputs.invoicePrice)
    : convertToGBP(inputs.invoicePrice, inputs.exchangeRate);

  // Step 2: Incoterms adjustment
  const incotermsAdj = calculateIncotermsAdjustment(
    inputs.incoterms,
    inputs.freightToPort,
    inputs.insuranceToPort
  );

  // Step 3: Additions
  const additions = calculateAdditions(
    inputs.additions.sellingCommissions,
    inputs.additions.royalties,
    inputs.additions.assists,
    inputs.additions.packingCosts
  );

  // Step 4: Deductions
  const deductions = calculateDeductions(
    inputs.deductions.postImportTransport,
    inputs.deductions.installationAssembly
  );

  // Step 5: Customs value
  const customsValue = calculateCustomsValue(
    invoicePriceGBP,
    incotermsAdj.total,
    additions.total,
    deductions.total
  );

  // Step 6: Duty
  const dutyAmount = calculateDuty(customsValue, inputs.dutyRatePercent);

  // Step 7: VAT
  const vatValue = calculateVATValue(customsValue, dutyAmount);
  const importVAT = calculateImportVAT(vatValue, inputs.vatRatePercent);

  // Total
  const totalDutyAndVAT = roundToPence(dutyAmount + importVAT);

  // Method 1 check
  const method1Applicable = isMethod1Applicable(inputs.relatedParty, inputs.armsLengthConfirmed);

  // Validation
  const validationResults = validateWorksheet(inputs, customsValue);
  const validationSummary = summariseValidation(validationResults);

  // Build-up
  const buildUpLines = generateBuildUp(
    inputs,
    invoicePriceGBP,
    incotermsAdj,
    additions,
    deductions,
    customsValue,
    dutyAmount,
    vatValue,
    importVAT,
    totalDutyAndVAT
  );

  return {
    invoicePriceOriginal: inputs.invoicePrice,
    invoiceCurrency: inputs.currency,
    exchangeRate: inputs.exchangeRate,
    invoicePriceGBP,
    incotermsCode: inputs.incoterms,
    freightAdjustment: incotermsAdj.freight,
    insuranceAdjustment: incotermsAdj.insurance,
    incotermsAdjustmentTotal: incotermsAdj.total,
    additions,
    deductions,
    customsValue,
    dutyRatePercent: inputs.dutyRatePercent,
    dutyAmount,
    vatValue,
    vatRatePercent: inputs.vatRatePercent,
    importVAT,
    totalDutyAndVAT,
    method1Applicable,
    relatedParty: inputs.relatedParty,
    valuationMethod: inputs.valuationMethod,
    validationResults,
    buildUpLines,
    validationSummary,
  };
}

// ─── Default / Empty Inputs ──────────────────────────────────────────────────

/** Create empty default inputs */
export function createEmptyInputs(): ValuationInputs {
  return {
    invoicePrice: 0,
    currency: 'GBP',
    exchangeRate: 1.0,
    incoterms: 'FOB',
    portOfImportation: '',
    freightToPort: 0,
    insuranceToPort: 0,
    additions: {
      sellingCommissions: 0,
      royalties: 0,
      assists: 0,
      packingCosts: 0,
    },
    deductions: {
      postImportTransport: 0,
      installationAssembly: 0,
    },
    relatedParty: false,
    armsLengthConfirmed: false,
    valuationMethod: 1,
    commodityCode: '',
    dutyRatePercent: 0,
    vatRatePercent: 20,
    goodsDescription: '',
  };
}

// ─── Field Labels & Tooltips ─────────────────────────────────────────────────

/** Display labels for input fields */
export const FIELD_LABELS: Record<string, string> = {
  invoicePrice: 'Invoice price',
  currency: 'Invoice currency',
  exchangeRate: 'HMRC exchange rate',
  incoterms: 'Incoterms 2020',
  portOfImportation: 'UK port of importation',
  freightToPort: 'Freight to UK port',
  insuranceToPort: 'Insurance to UK port',
  sellingCommissions: 'Selling commissions',
  royalties: 'Royalties / licence fees',
  assists: 'Assists (moulds, tools, materials)',
  packingCosts: 'Packing costs',
  postImportTransport: 'Post-import transport',
  installationAssembly: 'Installation / assembly',
  relatedParty: 'Related party?',
  armsLengthConfirmed: 'Arm\'s length confirmed?',
  valuationMethod: 'Valuation method',
  commodityCode: 'Commodity code',
  dutyRatePercent: 'Duty rate (%)',
  vatRatePercent: 'Import VAT rate (%)',
  goodsDescription: 'Goods description',
};

/** Tooltips for input fields */
export const FIELD_TOOLTIPS: Record<string, string> = {
  invoicePrice: 'The price actually paid or payable for the goods. This is the starting point for Method 1 customs valuation.',
  currency: 'Select the currency of the commercial invoice. If not GBP, enter the HMRC exchange rate to convert.',
  exchangeRate: 'HMRC publishes monthly exchange rates for customs valuation. The rate is foreign currency per £1 GBP — so divide the foreign amount by this rate. Always use the HMRC rate, not a bank or spot rate.',
  incoterms: 'The delivery term agreed between buyer and seller. This determines which transport and insurance costs are included in the invoice price and which must be added.',
  portOfImportation: 'The UK port where the goods arrive (e.g., Felixstowe, Dover, Southampton). Freight must cover transport to this point.',
  freightToPort: 'Cost of transporting the goods to the UK port of importation. Required for EXW, FCA, FAS, FOB terms. Not needed for CIF, CIP, DAP, DDP.',
  insuranceToPort: 'Cost of insuring the goods during transit to the UK port. Required for EXW, FCA, FAS, FOB, CFR, CPT terms.',
  sellingCommissions: 'Commissions paid by the buyer to the seller\'s agent. NOT buying commissions (paid to the buyer\'s own agent — those are excluded). This distinction is commonly tested.',
  royalties: 'Licence fees or royalties payable as a condition of sale. Only added if the payment relates to the imported goods AND is a condition of the sale.',
  assists: 'Value of materials, moulds, tools, dies, or engineering provided free of charge (or at reduced cost) by the buyer to the seller. Value at cost to the buyer. Apportion if used for multiple shipments.',
  packingCosts: 'Cost of containers, wrapping, and packing labour. Only add if not already included in the invoice price.',
  postImportTransport: 'Transport costs after the goods arrive at the UK port. Only deductible if separately identified in the contract/invoice.',
  installationAssembly: 'Installation, assembly, or technical assistance costs after importation. Only deductible if separately identified.',
  relatedParty: 'Are the buyer and seller related? (e.g., parent/subsidiary, >5% ownership, directors/officers, family). Related party transactions require additional scrutiny under Method 1.',
  armsLengthConfirmed: 'For related party transactions: has the transaction value been accepted as being at arm\'s length? If not, Method 1 may not be applicable.',
  valuationMethod: 'Valuation Method 1 (transaction value) is used in ~90% of cases. Methods 2–6 are fallbacks when Method 1 cannot be used.',
  commodityCode: '10-digit commodity code from the UK Trade Tariff. Used for cross-reference only — the code determines the applicable duty rate.',
  dutyRatePercent: 'The applicable customs duty rate as a percentage. This comes from the UK Trade Tariff for the commodity code and country of origin.',
  vatRatePercent: 'Import VAT rate: 20% standard or 0% for zero-rated goods (e.g., food, children\'s clothing). Check the VATZ code in the Trade Tariff.',
  goodsDescription: 'A brief description of the goods being valued (for the worksheet header).',
};

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

/** Build the expected output for a scenario by running the calculation */
function buildScenarioOutput(inputs: ValuationInputs): ValuationOutput {
  return calculateValuation(inputs);
}

// Olive oil inputs
const oliveOilInputs: ValuationInputs = {
  invoicePrice: 42_000,
  currency: 'EUR',
  exchangeRate: 1.1765,
  incoterms: 'FOB',
  portOfImportation: 'Felixstowe',
  freightToPort: 2_000,
  insuranceToPort: 200,
  additions: {
    sellingCommissions: 0,
    royalties: 0,
    assists: 0,
    packingCosts: 0,
  },
  deductions: {
    postImportTransport: 0,
    installationAssembly: 0,
  },
  relatedParty: false,
  armsLengthConfirmed: false,
  valuationMethod: 1,
  commodityCode: '1509200090',
  dutyRatePercent: 0, // Italy, UK-EU TCA
  vatRatePercent: 0,  // Zero-rated food (VATA Sch 8 Group 1)
  goodsDescription: 'Extra virgin olive oil, 8,000 bottles, from Puglia, Italy',
};

// Ceramic cups inputs
const ceramicCupsInputs: ValuationInputs = {
  invoicePrice: 5_400_000,
  currency: 'JPY',
  exchangeRate: 191.42,
  incoterms: 'CIF',
  portOfImportation: 'Felixstowe',
  freightToPort: 0, // CIF — included
  insuranceToPort: 0, // CIF — included
  additions: {
    sellingCommissions: 0,
    royalties: 0,
    assists: 2_000, // Free moulds provided by H&C
    packingCosts: 0,
  },
  deductions: {
    postImportTransport: 0,
    installationAssembly: 0,
  },
  relatedParty: false,
  armsLengthConfirmed: false,
  valuationMethod: 1,
  commodityCode: '6911100090',
  dutyRatePercent: 0, // Japan, UK-Japan CEPA preferential
  vatRatePercent: 20, // Standard-rated homeware
  goodsDescription: 'Ceramic sake cups, 3,000 units, from Takara Design Co., Kyoto, Japan',
};

/**
 * Pre-configured test scenarios from the H&C storyline.
 */
export const HC_VALUATION_SCENARIOS: HCValuationScenario[] = [
  // ── Scenario 1: Olive Oil (FOB, EUR, Italy) ──────────────────────────────
  {
    id: 's2-olive-oil-fob',
    name: 'S2 — Olive Oil (FOB Bari, EUR)',
    section: 2,
    description:
      'H&C imports 8,000 bottles of extra virgin olive oil from Puglia, Italy. Shipped FOB Bari, invoice EUR 42,000. Freight £2,000, insurance £200. Italy — 0% duty under UK-EU TCA. Zero-rated food.',
    config: {
      showTooltips: true,
      showBuildUp: true,
      scenarioLabel: 'S2 — Olive Oil FOB',
      preSelectedIncoterms: 'FOB',
      preSelectedCurrency: 'EUR',
    },
    preFilledInputs: oliveOilInputs,
    expectedOutput: buildScenarioOutput(oliveOilInputs),
    hints: {
      invoicePrice: [
        'The invoice states EUR 42,000.',
      ],
      exchangeRate: [
        'Use the HMRC monthly rate, not a bank rate.',
        'The HMRC rate is foreign currency per £1 — so divide EUR 42,000 by the rate.',
      ],
      incoterms: [
        'FOB = Free on Board. The seller loaded the oil on the vessel in Bari.',
        'You must add freight from Bari to Felixstowe and transit insurance.',
      ],
      freightToPort: [
        'The freight from Bari to Felixstowe is £2,000.',
        'Under FOB, the buyer pays freight from the port of loading.',
      ],
      insuranceToPort: [
        'Transit insurance is £200.',
        'Under FOB, the buyer arranges and pays insurance.',
      ],
      assists: [
        'No assists for the olive oil shipment.',
      ],
      dutyRatePercent: [
        'Italy is an EU Member State. Under the UK-EU TCA, the preferential rate for olive oil is 0%.',
        'Proof of origin (EUR.1 or statement on origin) is required to claim 0%.',
      ],
      vatRatePercent: [
        'Olive oil is food — zero-rated for VAT purposes under VATA Sch 8 Group 1.',
        'Declare additional code VATZ on the CDS entry to claim zero-rating.',
      ],
    },
  },

  // ── Scenario 2: Ceramic Cups (CIF, JPY, Japan + Assists) ─────────────────
  {
    id: 's2-ceramic-cups-cif',
    name: 'S2 — Ceramic Cups (CIF Felixstowe, JPY + Assists)',
    section: 2,
    description:
      'H&C imports 3,000 ceramic sake cups from Takara Design Co., Kyoto. CIF Felixstowe, invoice JPY 5,400,000. H&C provided free moulds (assists) worth £2,000. Japan — 0% under UK-Japan CEPA. Standard-rated.',
    config: {
      showTooltips: true,
      showBuildUp: true,
      scenarioLabel: 'S2 — Ceramic Cups CIF',
      preSelectedIncoterms: 'CIF',
      preSelectedCurrency: 'JPY',
    },
    preFilledInputs: ceramicCupsInputs,
    expectedOutput: buildScenarioOutput(ceramicCupsInputs),
    hints: {
      invoicePrice: [
        'The invoice states JPY 5,400,000.',
      ],
      exchangeRate: [
        'Use the HMRC rate for Japanese Yen.',
        'HMRC rates are foreign currency per £1 — divide JPY by the rate.',
      ],
      incoterms: [
        'CIF = Cost, Insurance & Freight. The seller pays freight and insurance to Felixstowe.',
        'Do NOT add separate freight or insurance — it is already in the invoice price. This is a common double-counting trap.',
      ],
      freightToPort: [
        'CIF includes freight. Enter £0.',
        'Adding freight separately under CIF terms would double-count.',
      ],
      insuranceToPort: [
        'CIF includes insurance. Enter £0.',
      ],
      assists: [
        'H&C provided free moulds worth £2,000 to Takara.',
        'These moulds are an "assist" — materials provided by the buyer to the seller free of charge.',
        'The full £2,000 should be added if these moulds are used only for this shipment. If used for multiple orders, apportion.',
      ],
      dutyRatePercent: [
        'Japan — preferential rate under UK-Japan CEPA.',
        'For ceramic tableware (heading 6911), the CEPA rate is 0%.',
        'Proof of origin is required to claim the preferential rate.',
      ],
      vatRatePercent: [
        'Ceramic cups are homeware — standard-rated at 20%.',
        'Import VAT is charged on the customs value PLUS duty.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCValuationScenario | undefined {
  return HC_VALUATION_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C scenarios by section number */
export function getScenariosBySection(section: number): HCValuationScenario[] {
  return HC_VALUATION_SCENARIOS.filter((s) => s.section === section);
}
