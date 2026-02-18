/**
 * CDS Import Declaration (C88) — Utility Functions
 *
 * Pure functions for validating declarations, calculating duties/taxes,
 * generating document checklists, and providing H&C test scenarios.
 *
 * All monetary values in GBP with pence precision (2 decimal places).
 */

import type {
  ProcedureCode,
  AdditionalProcedureCode,
  PreferenceCode,
  ValuationMethod,
  RepresentationType,
  PaymentMethod,
  DocumentCode,
  CountryCode,
  IncotermsCode,
  VATRate,
  ValidationRuleId,
  ValidationSeverity,
  ValidationResult,
  RequiredDocument,
  Party,
  DocumentReference,
  DeclarationHeader,
  DeclarationItem,
  DeclarationInputs,
  DutyCalculation,
  CalculationStep,
  DeclarationOutput,
  DeclarationStatus,
  CDSImportDeclarationConfig,
  HCDeclarationScenario,
} from './types';

// ─── Constants ───────────────────────────────────────────────────────────────

/** UK VAT standard rate (20%) — VATA 1994, s 2(1) */
export const STANDARD_VAT_RATE = 20;

/** UK VAT zero rate (0%) — VATA 1994, s 30, Sch 8 */
export const ZERO_VAT_RATE = 0;

/** UK VAT reduced rate (5%) — VATA 1994, s 29A */
export const REDUCED_VAT_RATE = 5;

/** Minimum reasonable customs value (GBP) for reasonableness check */
export const MIN_REASONABLE_VALUE = 100;

/** Maximum reasonable customs value (GBP) for reasonableness check */
export const MAX_REASONABLE_VALUE = 10_000_000;

// ─── Reference Data: Procedure Codes ─────────────────────────────────────────

export interface ProcedureCodeInfo {
  code: ProcedureCode;
  name: string;
  description: string;
  educationalNote: string;
  requiredDocuments: DocumentCode[];
  compatibleAdditionalCodes: AdditionalProcedureCode[];
  isOPReimport: boolean;
}

export const PROCEDURE_CODES: ProcedureCodeInfo[] = [
  {
    code: '4000',
    name: 'Free Circulation (Standard Import)',
    description: 'Release to free circulation and home use — no previous procedure.',
    educationalNote: 'The most common procedure code. Used for every straightforward import where goods enter the UK for the first time. Duty and import VAT are due in full (unless zero-rated or preferential rate applies).',
    requiredDocuments: ['N935'],
    compatibleAdditionalCodes: ['000'],
    isOPReimport: false,
  },
  {
    code: '6121',
    name: 'OP Re-Import (Duty on Repair)',
    description: 'Re-importation following Outward Processing — duty charged on repair/processing cost only.',
    educationalNote: 'Used when goods were temporarily exported for repair or processing under OP authorisation. The key benefit: customs duty is calculated on the COST OF REPAIR, not the full value of the goods. This can dramatically reduce the duty bill. The OP authorisation (C600) must be referenced.',
    requiredDocuments: ['N935', 'C600'],
    compatibleAdditionalCodes: ['000'],
    isOPReimport: true,
  },
  {
    code: '6122',
    name: 'OP Re-Import (Guarantee Repair)',
    description: 'Re-importation following OP — repair was free under manufacturer guarantee.',
    educationalNote: 'When goods are repaired free of charge under a warranty or guarantee, no customs duty is payable at all. Use code 6122 with additional code B02. The OP authorisation (C600) and evidence of guarantee must be provided.',
    requiredDocuments: ['N935', 'C600'],
    compatibleAdditionalCodes: ['B02', 'B03'],
    isOPReimport: true,
  },
  {
    code: '6110',
    name: 'Returned Goods Relief (RGR)',
    description: 'Re-importation of unaltered goods previously in free circulation, within 3 years.',
    educationalNote: 'RGR applies to goods that were exported from the UK and are being returned without alteration. Key conditions: goods must be in the same state, re-imported within 3 years, and the original import duty (if any) must not have been refunded. If goods were repaired abroad, RGR does NOT apply — use OP instead.',
    requiredDocuments: ['N935'],
    compatibleAdditionalCodes: ['F01', 'F05'],
    isOPReimport: false,
  },
  {
    code: '5100',
    name: 'Inward Processing (IP)',
    description: 'Entry to Inward Processing — suspension of duty while goods are processed/manufactured in the UK.',
    educationalNote: 'IP suspends customs duty on imported materials that will be processed or manufactured in the UK and then re-exported. Duty is only payable if the goods are released to free circulation instead of being re-exported.',
    requiredDocuments: ['N935', 'C601'],
    compatibleAdditionalCodes: ['000', 'A04'],
    isOPReimport: false,
  },
  {
    code: '5300',
    name: 'Temporary Admission (TA)',
    description: 'Entry to Temporary Admission — goods imported temporarily with total or partial relief from duty.',
    educationalNote: 'TA allows goods to be imported temporarily (e.g., exhibition samples, professional equipment) without paying full duty. Goods must be re-exported within the TA period.',
    requiredDocuments: ['N935'],
    compatibleAdditionalCodes: ['000'],
    isOPReimport: false,
  },
];

// ─── Reference Data: Preference Codes ────────────────────────────────────────

export interface PreferenceCodeInfo {
  code: PreferenceCode;
  name: string;
  description: string;
  educationalNote: string;
  requiredDocuments: DocumentCode[];
  validCountries: CountryCode[];
}

export const PREFERENCE_CODES: PreferenceCodeInfo[] = [
  {
    code: '100',
    name: 'Third Country (MFN)',
    description: 'Most Favoured Nation rate — no preferential trade agreement.',
    educationalNote: 'The default rate. No trade agreement applies, so the full Third Country duty rate is charged. No origin proof is needed because no preference is being claimed.',
    requiredDocuments: [],
    validCountries: ['CN', 'TW', 'AU', 'US', 'KR'],
  },
  {
    code: '200',
    name: 'DCTS (Developing Countries Trading Scheme)',
    description: 'Preferential rate under the UK DCTS — replaced GSP from June 2023.',
    educationalNote: 'The DCTS provides reduced or zero duty rates for eligible developing countries. Requires proof of origin: either a DCTS origin declaration (9001) from the exporter, or a Form A certificate (N865). India qualifies under DCTS.',
    requiredDocuments: ['9001'],
    validCountries: ['IN'],
  },
  {
    code: '300',
    name: 'FTA Preferential Rate',
    description: 'Preferential rate under a bilateral trade agreement (UK-EU TCA, UK-Japan CEPA, etc.).',
    educationalNote: 'A preferential (usually 0%) rate under a Free Trade Agreement. Requires a Statement on Origin from the exporter (U110 for single shipment, U111 for blanket period) or Importer\'s Knowledge (U112). The same code (300) is used for all UK FTAs — the specific agreement is determined by the country of origin.',
    requiredDocuments: ['U110'],
    validCountries: ['IT', 'ES', 'FR', 'DE', 'NL', 'BE', 'IE', 'JP'],
  },
];

// ─── Reference Data: Document Codes ──────────────────────────────────────────

export interface DocumentCodeInfo {
  code: DocumentCode;
  name: string;
  description: string;
  educationalNote: string;
}

export const DOCUMENT_CODES: DocumentCodeInfo[] = [
  {
    code: 'N935',
    name: 'Commercial Invoice',
    description: 'The seller\'s invoice for the goods.',
    educationalNote: 'Every import declaration requires a commercial invoice. This is the primary evidence of the transaction value (DE 4/11). The invoice must show: seller, buyer, goods description, quantity, price, currency, and Incoterms.',
  },
  {
    code: 'C506',
    name: 'Duty Deferment Account',
    description: 'Reference to a Duty Deferment Account (DDA) for deferred duty payment.',
    educationalNote: 'A DDA allows the importer to defer customs duty payments rather than paying at the border. The DDA number is entered in DE 2/6. Required when payment method (DE 4/8) is E.',
  },
  {
    code: 'C600',
    name: 'Outward Processing Authorisation',
    description: 'HMRC authorisation for the Outward Processing procedure.',
    educationalNote: 'Required for OP re-imports (DE 1/10 = 6121 or 6122). The OP authorisation must have been in place before the goods were exported for repair/processing. It can be a full authorisation or "Authorisation by Customs Declaration" (AbyD).',
  },
  {
    code: 'C601',
    name: 'Inward Processing Authorisation',
    description: 'HMRC authorisation for the Inward Processing procedure.',
    educationalNote: 'Required for IP entries (DE 1/10 = 5100). Must be a full IP authorisation from HMRC.',
  },
  {
    code: 'U110',
    name: 'Statement on Origin (Single Shipment)',
    description: 'Exporter\'s statement on origin for a single consignment — used for UK-EU TCA and UK-Japan CEPA.',
    educationalNote: 'The most common origin proof under UK FTAs. The exporter includes a prescribed statement on the commercial invoice or a separate document, declaring that the goods meet the rules of origin. Valid for the single shipment named.',
  },
  {
    code: 'U111',
    name: 'Statement on Origin (Multiple Shipments)',
    description: 'Blanket exporter\'s statement covering multiple shipments of identical goods over a period.',
    educationalNote: 'A blanket Statement on Origin covering multiple shipments of the same goods over up to 12 months. Saves the exporter from issuing a separate statement for each shipment.',
  },
  {
    code: 'U112',
    name: 'Importer\'s Knowledge',
    description: 'Importer claims preference based on their own knowledge that goods meet rules of origin.',
    educationalNote: 'The importer can claim preference without a Statement on Origin from the exporter, if the importer has sufficient information to demonstrate originating status. This shifts the evidential burden to the importer. Document status code JP is used.',
  },
  {
    code: '9001',
    name: 'DCTS Origin Declaration',
    description: 'Origin declaration from the exporter under the Developing Countries Trading Scheme.',
    educationalNote: 'For DCTS preference claims (preference code 200), the exporter provides an origin declaration confirming the goods meet DCTS rules of origin. This replaced the GSP Form A system for many countries.',
  },
  {
    code: 'N865',
    name: 'Form A / DCTS Origin Certificate',
    description: 'Certificate of origin for DCTS goods — issued by the exporting country\'s authority.',
    educationalNote: 'An alternative to the 9001 origin declaration. Some DCTS countries still issue Form A certificates through their export authorities. Either 9001 or N865 is acceptable.',
  },
];

// ─── Reference Data: Countries ───────────────────────────────────────────────

export interface CountryInfo {
  code: CountryCode;
  name: string;
  tradeScheme: string;
  preferenceCode: PreferenceCode;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'IT', name: 'Italy', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'ES', name: 'Spain', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'FR', name: 'France', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'DE', name: 'Germany', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'NL', name: 'Netherlands', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'BE', name: 'Belgium', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'IE', name: 'Ireland', tradeScheme: 'UK-EU TCA', preferenceCode: '300' },
  { code: 'JP', name: 'Japan', tradeScheme: 'UK-Japan CEPA', preferenceCode: '300' },
  { code: 'IN', name: 'India', tradeScheme: 'DCTS', preferenceCode: '200' },
  { code: 'CN', name: 'China', tradeScheme: 'None (MFN)', preferenceCode: '100' },
  { code: 'AU', name: 'Australia', tradeScheme: 'UK-Australia FTA', preferenceCode: '300' },
  { code: 'US', name: 'United States', tradeScheme: 'None (MFN)', preferenceCode: '100' },
  { code: 'KR', name: 'South Korea', tradeScheme: 'None (MFN)', preferenceCode: '100' },
  { code: 'TW', name: 'Taiwan', tradeScheme: 'None (MFN)', preferenceCode: '100' },
  { code: 'TR', name: 'Turkey', tradeScheme: 'UK-Turkey FTA', preferenceCode: '300' },
  { code: 'GB', name: 'United Kingdom', tradeScheme: 'Domestic (re-import)', preferenceCode: '100' },
];

// ─── Reference Data: Incoterms ───────────────────────────────────────────────

export interface IncotermsInfo {
  code: IncotermsCode;
  name: string;
  group: string;
}

export const INCOTERMS: IncotermsInfo[] = [
  { code: 'EXW', name: 'Ex Works', group: 'E' },
  { code: 'FCA', name: 'Free Carrier', group: 'F' },
  { code: 'FAS', name: 'Free Alongside Ship', group: 'F' },
  { code: 'FOB', name: 'Free on Board', group: 'F' },
  { code: 'CFR', name: 'Cost and Freight', group: 'C' },
  { code: 'CIF', name: 'Cost, Insurance & Freight', group: 'C' },
  { code: 'CIP', name: 'Carriage & Insurance Paid To', group: 'C' },
  { code: 'CPT', name: 'Carriage Paid To', group: 'C' },
  { code: 'DAP', name: 'Delivered at Place', group: 'D' },
  { code: 'DPU', name: 'Delivered at Place Unloaded', group: 'D' },
  { code: 'DDP', name: 'Delivered Duty Paid', group: 'D' },
];

// ─── Reference Data: UK Ports ────────────────────────────────────────────────

export interface PortInfo {
  code: string;
  name: string;
}

export const UK_PORTS: PortInfo[] = [
  { code: 'GBFXT', name: 'Felixstowe' },
  { code: 'GBSOU', name: 'Southampton' },
  { code: 'GBTIL', name: 'Tilbury' },
  { code: 'GBLGP', name: 'London Gateway' },
  { code: 'GBDVR', name: 'Dover' },
  { code: 'GBIMM', name: 'Immingham' },
  { code: 'GBLIV', name: 'Liverpool' },
  { code: 'GBBRS', name: 'Bristol' },
  { code: 'GBBEL', name: 'Belfast' },
];

// ─── Labels & Tooltips ──────────────────────────────────────────────────────

export const FIELD_LABELS: Record<string, string> = {
  // Header
  declarantEori: 'Declarant EORI (DE 3/17)',
  declarantName: 'Declarant Name (DE 3/18)',
  importerEori: 'Importer EORI (DE 3/37)',
  importerName: 'Importer Name',
  representativeEori: 'Representative EORI (DE 3/20)',
  representativeName: 'Representative Name',
  representationType: 'Representation Type (DE 3/21)',
  importerVATNumber: 'Importer VAT Number (DE 3/40)',
  locationOfGoods: 'Location of Goods (DE 5/23)',
  defermentAccount: 'Duty Deferment Account (DE 2/6)',
  // Item
  procedureCode: 'Procedure Code (DE 1/10)',
  additionalProcedureCode: 'Additional Procedure Code (DE 1/11)',
  commodityCode: 'Commodity Code (DE 6/14+6/15)',
  goodsDescription: 'Goods Description (DE 6/8)',
  netMass: 'Net Mass kg (DE 6/1)',
  supplementaryUnits: 'Supplementary Units (DE 6/2)',
  countryOfOrigin: 'Country of Origin (DE 5/15)',
  countryOfDispatch: 'Country of Dispatch (DE 5/14)',
  customsValue: 'Customs Value GBP (DE 4/11)',
  valuationMethod: 'Valuation Method (DE 4/16)',
  valuationIndicators: 'Valuation Indicators (DE 4/13)',
  preferenceCode: 'Preference Code (DE 4/17)',
  incotermsCode: 'Incoterms (DE 4/1)',
  paymentMethodDuty: 'Payment Method — Duty (DE 4/8)',
  paymentMethodVAT: 'Payment Method — VAT (DE 4/8)',
  dutyRate: 'Duty Rate (%)',
  vatRate: 'Import VAT Rate',
  documentReferences: 'Document References (DE 2/3)',
  repairCost: 'Repair/Processing Cost (GBP)',
  outwardFreight: 'Outward Freight Cost (GBP)',
};

export const FIELD_TOOLTIPS: Record<string, string> = {
  declarantEori: 'The EORI of the person submitting the declaration. Format: GB + 12 digits. If using an agent, this is the agent\'s EORI.',
  importerEori: 'The EORI of the owner of the goods. This is H&C\'s EORI (GB-registered). Format: GB + 12 digits.',
  representationType: 'How the customs agent acts: 2 = Direct (agent acts in the name of the importer, liability rests with the importer). 3 = Indirect (agent acts in their own name, joint and several liability). Leave blank if the importer declares directly.',
  importerVATNumber: 'Enter the importer\'s UK VAT registration number to elect Postponed VAT Accounting (PVA). When populated, import VAT is NOT paid at the border — instead it is accounted for on the next VAT return (Box 1 output + Box 4 recovery). This is the primary trigger for PVA.',
  locationOfGoods: 'The port or location where goods are physically presented to customs. Use the UN/LOCODE format (e.g., GBFXT for Felixstowe).',
  defermentAccount: 'A Duty Deferment Account (DDA) number for deferred payment of customs duty. Only needed if payment method (DE 4/8) is E.',
  procedureCode: 'The 4-digit procedure code combining the requested procedure (first 2 digits) and previous procedure (last 2 digits). E.g., 4000 = release to free circulation, no previous procedure. 6121 = OP re-import.',
  additionalProcedureCode: 'A 3-digit code providing additional detail. "000" means no additional code applies. "B02" = OP guarantee repair. "F01" = RGR duty relief.',
  commodityCode: 'The 10-digit UK Trade Tariff commodity code from the Trade Tariff Lookup tool. This determines the duty rate, import controls, and VAT rate.',
  customsValue: 'The customs value in GBP from the Customs Valuation Worksheet. For standard imports (4000), this is the full transaction value. For OP re-imports (6121), this is the repair cost + inward freight + insurance.',
  valuationMethod: 'How the customs value was determined. Method 1 (Transaction Value) is used for over 90% of imports. Methods 2-6 are used when the transaction value cannot be established or accepted.',
  valuationIndicators: 'A 4-digit code (Method 1 only). Each digit is 0 or 1. Digit 1: price restrictions; Digit 2: conditions/considerations; Digit 3: proceeds of resale to seller; Digit 4: buyer/seller related. "0000" = no conditions apply.',
  preferenceCode: 'Determines the applicable duty rate: 100 = Third Country (MFN, no preference); 200 = DCTS (developing countries); 300 = FTA preferential rate (UK-EU TCA, UK-Japan CEPA, etc.).',
  incotermsCode: 'The Incoterms 2020 delivery term from the sales contract. This affects the customs value calculation (which was done in the Valuation Worksheet).',
  paymentMethodDuty: 'How customs duty will be paid. A = cash, E = Duty Deferment Account, M = CDS cash account.',
  paymentMethodVAT: 'How import VAT will be paid. Leave BLANK for PVA (Postponed VAT Accounting). If PVA is not elected, use the same code as the duty payment method.',
  dutyRate: 'The applicable duty rate percentage from the Trade Tariff Lookup. 0% if preferential rate applies and conditions are met.',
  vatRate: 'Import VAT rate: 20% (standard), 5% (reduced), or 0% (zero-rated food, children\'s clothing, etc.). Check the Trade Tariff for the VATZ code.',
  repairCost: 'For OP re-imports (6121): the cost of the repair or processing carried out abroad. This becomes the basis for the customs value — NOT the full value of the goods.',
  outwardFreight: 'For OP re-imports: the cost of shipping goods out to the repair location. Included in the VAT value calculation (but NOT in the duty value).',
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places (pence precision) */
export function roundToPence(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Format a number as GBP currency */
export function formatGBP(value: number): string {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Generate a unique ID */
export function generateId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Validate EORI format (GB/XI + 12 digits) */
export function isValidEORI(eori: string): boolean {
  return /^(GB|XI)\d{12}$/.test(eori);
}

/** Validate commodity code format (exactly 10 digits) */
export function isValidCommodityCode(code: string): boolean {
  return /^\d{10}$/.test(code);
}

/** Validate valuation indicators (4 digits, each 0 or 1) */
export function isValidValuationIndicators(indicators: string): boolean {
  return /^[01]{4}$/.test(indicators);
}

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/** Get procedure code info by code */
export function getProcedureCodeInfo(code: ProcedureCode): ProcedureCodeInfo | undefined {
  return PROCEDURE_CODES.find((p) => p.code === code);
}

/** Get preference code info by code */
export function getPreferenceCodeInfo(code: PreferenceCode): PreferenceCodeInfo | undefined {
  return PREFERENCE_CODES.find((p) => p.code === code);
}

/** Get document code info by code */
export function getDocumentCodeInfo(code: DocumentCode): DocumentCodeInfo | undefined {
  return DOCUMENT_CODES.find((d) => d.code === code);
}

/** Get country info by code */
export function getCountryInfo(code: CountryCode): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Check if a preference code is valid for a given country */
export function isPreferenceValidForCountry(
  preferenceCode: PreferenceCode,
  countryCode: CountryCode
): boolean {
  if (preferenceCode === '100') return true; // MFN always valid
  const country = getCountryInfo(countryCode);
  if (!country) return false;
  return country.preferenceCode === preferenceCode;
}

/** Get the expected preference code for a country */
export function getExpectedPreferenceForCountry(countryCode: CountryCode): PreferenceCode {
  const country = getCountryInfo(countryCode);
  return country?.preferenceCode ?? '100';
}

// ─── Default / Empty State ───────────────────────────────────────────────────

/** Create an empty document reference */
export function createEmptyDocumentReference(): DocumentReference {
  return {
    id: generateId(),
    code: 'N935',
    reference: '',
    statusCode: 'AE',
  };
}

/** Create empty declaration header */
export function createEmptyHeader(): DeclarationHeader {
  return {
    declarationType: 'IM',
    additionalDeclarationType: 'A',
    declarant: { eori: '', name: '', address: '' },
    importer: { eori: '', name: '', address: '' },
    representative: { eori: '', name: '', address: '' },
    representationType: '',
    importerVATNumber: '',
    locationOfGoods: '',
    defermentAccountNumber: '',
  };
}

/** Create empty declaration item */
export function createEmptyItem(): DeclarationItem {
  return {
    itemNumber: 1,
    procedureCode: '4000',
    additionalProcedureCode: '000',
    commodityCode: '',
    goodsDescription: '',
    netMassKg: 0,
    supplementaryUnits: 0,
    countryOfOrigin: 'IT',
    countryOfDispatch: 'IT',
    countryOfPreferentialOrigin: '',
    customsValueGBP: 0,
    valuationMethod: 1,
    valuationIndicators: '0000',
    preferenceCode: '100',
    incotermsCode: 'CIF',
    paymentMethodDuty: 'E',
    paymentMethodVAT: '',
    dutyRatePercent: 0,
    vatRate: 20,
    documentReferences: [createEmptyDocumentReference()],
    repairCost: 0,
    outwardFreight: 0,
  };
}

/** Create empty declaration inputs */
export function createEmptyInputs(): DeclarationInputs {
  return {
    header: createEmptyHeader(),
    item: createEmptyItem(),
  };
}

// ─── Duty & Tax Calculation ──────────────────────────────────────────────────

/** Calculate duty and taxes for a declaration item */
export function calculateDutyAndTaxes(
  header: DeclarationHeader,
  item: DeclarationItem
): DutyCalculation {
  const procInfo = getProcedureCodeInfo(item.procedureCode);
  const isOP = procInfo?.isOPReimport ?? false;
  const isGuaranteeRepair = item.procedureCode === '6122';
  const pvaElected = header.importerVATNumber.length > 0;
  const steps: CalculationStep[] = [];

  // Step 1: Determine customs value
  let customsValue: number;
  if (isGuaranteeRepair) {
    customsValue = 0;
    steps.push({
      label: 'Customs Value',
      formula: '£0 (guarantee repair — no duty payable)',
      amount: 0,
      educationalNote: 'Under OP with guarantee repair (6122 + B02), no customs duty is payable because the repair was carried out free of charge under the manufacturer\'s guarantee.',
    });
  } else if (isOP && item.procedureCode === '6121') {
    // OP re-import: customs value = repair cost + inward freight + inward insurance
    // For simplicity, customs value is entered directly (already calculated in Valuation Worksheet)
    customsValue = item.customsValueGBP;
    steps.push({
      label: 'Customs Value (OP Repair)',
      formula: `Repair cost + inward freight + insurance = ${formatGBP(customsValue)}`,
      amount: customsValue,
      educationalNote: 'Under Outward Processing (6121), the customs value for duty purposes is the cost of the repair/processing operation, plus inward freight and insurance. The FULL value of the original goods is NOT used. This is the key benefit of OP relief.',
    });
  } else {
    customsValue = item.customsValueGBP;
    steps.push({
      label: 'Customs Value',
      formula: `From Valuation Worksheet: ${formatGBP(customsValue)}`,
      amount: customsValue,
      educationalNote: 'The customs value is the transaction value of the goods, as determined using the Customs Valuation Worksheet (Method 1). It includes freight and insurance to the UK port, plus any additions (assists, royalties, commissions).',
    });
  }

  // Step 2: Calculate customs duty
  let dutyAmount: number;
  if (isGuaranteeRepair) {
    dutyAmount = 0;
    steps.push({
      label: 'Customs Duty',
      formula: '£0 (guarantee repair exempt)',
      amount: 0,
      educationalNote: 'No customs duty on guarantee repairs under OP.',
    });
  } else {
    dutyAmount = roundToPence(customsValue * (item.dutyRatePercent / 100));
    steps.push({
      label: 'Customs Duty',
      formula: `${formatGBP(customsValue)} × ${item.dutyRatePercent}% = ${formatGBP(dutyAmount)}`,
      amount: dutyAmount,
      educationalNote: item.dutyRatePercent === 0
        ? 'Duty rate is 0% — either a zero-rate applies for this commodity or a preferential rate under a trade agreement has eliminated the duty.'
        : `Customs duty is calculated as customs value × duty rate. The ${item.dutyRatePercent}% rate comes from the Trade Tariff, considering any preferential trade agreements.`,
    });
  }

  // Step 3: Calculate VAT value
  let vatValue: number;
  if (isOP && item.procedureCode === '6121') {
    // OP: VAT value = repair cost + outward freight + inward freight + duty
    // (Insurance is excluded from VAT value)
    vatValue = roundToPence(item.repairCost + item.outwardFreight + (customsValue - item.repairCost) + dutyAmount);
    // Simplified: repair + outward freight + inward freight/insurance portion + duty
    // In practice: repair cost + all freight + duty (no insurance)
    vatValue = roundToPence(customsValue + item.outwardFreight + dutyAmount);
    steps.push({
      label: 'VAT Value (OP)',
      formula: `Customs value (${formatGBP(customsValue)}) + outward freight (${formatGBP(item.outwardFreight)}) + duty (${formatGBP(dutyAmount)}) = ${formatGBP(vatValue)}`,
      amount: vatValue,
      educationalNote: 'For OP re-imports, the value for VAT purposes includes the repair cost, both outward and inward freight, and any customs duty — but NOT insurance. This is different from the duty value which excludes outward freight.',
    });
  } else {
    vatValue = roundToPence(customsValue + dutyAmount);
    steps.push({
      label: 'VAT Value',
      formula: `Customs value (${formatGBP(customsValue)}) + duty (${formatGBP(dutyAmount)}) = ${formatGBP(vatValue)}`,
      amount: vatValue,
      educationalNote: 'Import VAT is calculated on the customs value PLUS any customs duty payable. This means you pay VAT on the duty — a common surprise for students.',
    });
  }

  // Step 4: Calculate import VAT
  const importVAT = roundToPence(vatValue * (item.vatRate / 100));
  steps.push({
    label: 'Import VAT',
    formula: `${formatGBP(vatValue)} × ${item.vatRate}% = ${formatGBP(importVAT)}`,
    amount: importVAT,
    educationalNote: item.vatRate === 0
      ? 'Import VAT is 0% because the goods are zero-rated (e.g., most food items bear code VATZ in the Trade Tariff).'
      : pvaElected
        ? `Import VAT of ${formatGBP(importVAT)} is deferred under PVA. It will be accounted for on the VAT return: Box 1 (output tax) and Box 4 (input tax recovery). No VAT is paid at the border.`
        : `Import VAT at the standard rate of ${item.vatRate}% is payable at the border (or via duty deferment account).`,
  });

  // Step 5: Total taxes
  const totalTaxes = roundToPence(dutyAmount + importVAT);
  const payableAtBorder = pvaElected ? dutyAmount : totalTaxes;
  const deferredToVATReturn = pvaElected ? importVAT : 0;

  steps.push({
    label: 'Total Taxes',
    formula: `Duty (${formatGBP(dutyAmount)}) + VAT (${formatGBP(importVAT)}) = ${formatGBP(totalTaxes)}`,
    amount: totalTaxes,
    educationalNote: pvaElected
      ? `Total taxes are ${formatGBP(totalTaxes)}, but only ${formatGBP(payableAtBorder)} (duty) is payable at the border. The remaining ${formatGBP(deferredToVATReturn)} (import VAT) is deferred to the VAT return under PVA.`
      : `Total taxes of ${formatGBP(totalTaxes)} are payable at the border or via duty deferment.`,
  });

  return {
    customsValue,
    dutyRatePercent: item.dutyRatePercent,
    dutyAmount,
    vatValue,
    vatRatePercent: item.vatRate,
    importVAT,
    totalTaxes,
    pvaElected,
    payableAtBorder,
    deferredToVATReturn,
    isOPReimport: isOP,
    calculationSteps: steps,
  };
}

// ─── Document Checklist Generator ────────────────────────────────────────────

/** Generate the required documents checklist based on declaration inputs */
export function generateDocumentChecklist(
  header: DeclarationHeader,
  item: DeclarationItem
): RequiredDocument[] {
  const checklist: RequiredDocument[] = [];
  const presentCodes = new Set(item.documentReferences.map((d) => d.code));

  // N935: Always required
  checklist.push({
    code: 'N935',
    name: 'Commercial Invoice',
    reason: 'Required for every import declaration as evidence of transaction value.',
    present: presentCodes.has('N935'),
  });

  // C506: Required if payment method is E (DDA)
  if (item.paymentMethodDuty === 'E' || item.paymentMethodDuty === 'R') {
    checklist.push({
      code: 'C506',
      name: 'Duty Deferment Account',
      reason: 'Required when using a Duty Deferment Account for payment (DE 4/8 = E or R).',
      present: presentCodes.has('C506'),
    });
  }

  // C600: Required for OP procedures
  if (item.procedureCode === '6121' || item.procedureCode === '6122') {
    checklist.push({
      code: 'C600',
      name: 'Outward Processing Authorisation',
      reason: 'Required for OP re-import declarations (DE 1/10 = 6121 or 6122). Must have been valid at time of export.',
      present: presentCodes.has('C600'),
    });
  }

  // C601: Required for IP
  if (item.procedureCode === '5100') {
    checklist.push({
      code: 'C601',
      name: 'Inward Processing Authorisation',
      reason: 'Required for IP entries (DE 1/10 = 5100).',
      present: presentCodes.has('C601'),
    });
  }

  // Origin proofs based on preference code
  if (item.preferenceCode === '300') {
    const hasOriginProof =
      presentCodes.has('U110') || presentCodes.has('U111') || presentCodes.has('U112');
    checklist.push({
      code: 'U110',
      name: 'Statement on Origin / Importer\'s Knowledge',
      reason: 'Required for FTA preference claims (preference 300). U110 (single shipment), U111 (multiple), or U112 (importer\'s knowledge).',
      present: hasOriginProof,
    });
  }

  if (item.preferenceCode === '200') {
    const hasDCTSProof = presentCodes.has('9001') || presentCodes.has('N865');
    checklist.push({
      code: '9001',
      name: 'DCTS Origin Evidence',
      reason: 'Required for DCTS preference claims (preference 200). 9001 (origin declaration) or N865 (Form A).',
      present: hasDCTSProof,
    });
  }

  return checklist;
}

// ─── Validation Engine ───────────────────────────────────────────────────────

/** V1: Procedure-preference compatibility */
function validateProcedurePreference(item: DeclarationItem): ValidationResult {
  // OP re-imports can still claim preference on the repair cost element
  // All procedure codes are compatible with all preference codes in this simplified model
  return {
    ruleId: 'V1',
    severity: 'info',
    message: item.procedureCode === '6121' && item.preferenceCode !== '100'
      ? `Preference code ${item.preferenceCode} claimed on OP re-import. Preference applies to the repair cost element — confirm the repaired goods still meet rules of origin.`
      : `Procedure code ${item.procedureCode} is compatible with preference code ${item.preferenceCode}.`,
    affectedElements: ['DE 1/10', 'DE 4/17'],
    passed: true,
  };
}

/** V2: Missing document reference for preference */
function validatePreferenceDocuments(item: DeclarationItem): ValidationResult {
  if (item.preferenceCode === '100') {
    return {
      ruleId: 'V2',
      severity: 'info',
      message: 'No preference claimed (MFN rate). No origin proof required.',
      affectedElements: ['DE 4/17', 'DE 2/3'],
      passed: true,
    };
  }

  const docCodes = new Set(item.documentReferences.map((d) => d.code));

  if (item.preferenceCode === '300') {
    const hasOriginProof = docCodes.has('U110') || docCodes.has('U111') || docCodes.has('U112');
    return {
      ruleId: 'V2',
      severity: hasOriginProof ? 'info' : 'error',
      message: hasOriginProof
        ? 'Origin proof present for FTA preference claim.'
        : 'FTA preference claimed (300) but no origin proof found in DE 2/3. You must provide U110 (statement on origin), U111 (blanket statement), or U112 (importer\'s knowledge).',
      affectedElements: ['DE 4/17', 'DE 2/3'],
      passed: hasOriginProof,
    };
  }

  if (item.preferenceCode === '200') {
    const hasDCTSProof = docCodes.has('9001') || docCodes.has('N865');
    return {
      ruleId: 'V2',
      severity: hasDCTSProof ? 'info' : 'error',
      message: hasDCTSProof
        ? 'DCTS origin evidence present.'
        : 'DCTS preference claimed (200) but no origin evidence found in DE 2/3. You must provide 9001 (origin declaration) or N865 (Form A).',
      affectedElements: ['DE 4/17', 'DE 2/3'],
      passed: hasDCTSProof,
    };
  }

  return {
    ruleId: 'V2',
    severity: 'info',
    message: 'Preference document check not applicable.',
    affectedElements: ['DE 4/17', 'DE 2/3'],
    passed: true,
  };
}

/** V3: OP authorisation check */
function validateOPAuthorisation(item: DeclarationItem): ValidationResult {
  const isOP = item.procedureCode === '6121' || item.procedureCode === '6122';
  if (!isOP) {
    return {
      ruleId: 'V3',
      severity: 'info',
      message: 'Not an OP re-import. OP authorisation check not applicable.',
      affectedElements: ['DE 1/10', 'DE 2/3'],
      passed: true,
    };
  }

  const hasC600 = item.documentReferences.some((d) => d.code === 'C600');
  return {
    ruleId: 'V3',
    severity: hasC600 ? 'info' : 'error',
    message: hasC600
      ? 'OP authorisation (C600) present in DE 2/3.'
      : `OP re-import (${item.procedureCode}) requires an Outward Processing authorisation (C600) in DE 2/3. The authorisation must have been valid at the time of export.`,
    affectedElements: ['DE 1/10', 'DE 2/3'],
    passed: hasC600,
  };
}

/** V4: DDA consistency */
function validateDDAConsistency(
  header: DeclarationHeader,
  item: DeclarationItem
): ValidationResult {
  const usesDDA = item.paymentMethodDuty === 'E' || item.paymentMethodDuty === 'R';
  if (!usesDDA) {
    return {
      ruleId: 'V4',
      severity: 'info',
      message: 'Not using duty deferment. DDA check not applicable.',
      affectedElements: ['DE 4/8', 'DE 2/6'],
      passed: true,
    };
  }

  const hasDDA = header.defermentAccountNumber.length > 0;
  return {
    ruleId: 'V4',
    severity: hasDDA ? 'info' : 'warning',
    message: hasDDA
      ? `Duty deferment account ${header.defermentAccountNumber} declared.`
      : 'Payment method E/R (duty deferment) selected but no DDA number entered in DE 2/6. Ensure a valid Duty Deferment Account is referenced.',
    affectedElements: ['DE 4/8', 'DE 2/6'],
    passed: hasDDA,
  };
}

/** V5: PVA election check */
function validatePVAElection(header: DeclarationHeader, item: DeclarationItem): ValidationResult {
  const pvaElected = header.importerVATNumber.length > 0;
  const vatBlank = item.paymentMethodVAT === '';

  if (!pvaElected) {
    return {
      ruleId: 'V5',
      severity: 'info',
      message: 'PVA not elected. Importer VAT number (DE 3/40) is empty. Import VAT will be payable at the border.',
      affectedElements: ['DE 3/40', 'DE 4/8'],
      passed: true,
    };
  }

  return {
    ruleId: 'V5',
    severity: 'info',
    message: vatBlank
      ? `PVA elected via DE 3/40. Import VAT will be accounted for on the VAT return: Box 1 (output tax) and Box 4 (input tax recovery). Payment method for VAT line correctly left blank.`
      : `PVA elected via DE 3/40 but VAT payment method is not blank. When using PVA, the VAT tax line in DE 4/8 should be left blank — no payment is required at the border for the VAT element.`,
    affectedElements: ['DE 3/40', 'DE 4/8'],
    passed: vatBlank,
  };
}

/** V6: Customs value reasonableness */
function validateCustomsValueReasonableness(item: DeclarationItem): ValidationResult {
  if (item.procedureCode === '6122') {
    return {
      ruleId: 'V6',
      severity: 'info',
      message: 'Guarantee repair — customs value check not applicable.',
      affectedElements: ['DE 4/11'],
      passed: true,
    };
  }

  const value = item.customsValueGBP;
  if (value <= 0) {
    return {
      ruleId: 'V6',
      severity: 'error',
      message: 'Customs value must be greater than zero.',
      affectedElements: ['DE 4/11'],
      passed: false,
    };
  }

  if (value < MIN_REASONABLE_VALUE) {
    return {
      ruleId: 'V6',
      severity: 'warning',
      message: `Customs value of ${formatGBP(value)} is unusually low. Verify this is the correct customs value from the Valuation Worksheet.`,
      affectedElements: ['DE 4/11'],
      passed: true,
    };
  }

  if (value > MAX_REASONABLE_VALUE) {
    return {
      ruleId: 'V6',
      severity: 'warning',
      message: `Customs value of ${formatGBP(value)} is unusually high. Verify this is correct.`,
      affectedElements: ['DE 4/11'],
      passed: true,
    };
  }

  return {
    ruleId: 'V6',
    severity: 'info',
    message: `Customs value ${formatGBP(value)} within reasonable range.`,
    affectedElements: ['DE 4/11'],
    passed: true,
  };
}

/** V7: OP customs value check */
function validateOPCustomsValue(item: DeclarationItem): ValidationResult {
  if (item.procedureCode !== '6121') {
    return {
      ruleId: 'V7',
      severity: 'info',
      message: 'Not an OP re-import (6121). OP customs value check not applicable.',
      affectedElements: ['DE 1/10', 'DE 4/11'],
      passed: true,
    };
  }

  if (item.repairCost <= 0) {
    return {
      ruleId: 'V7',
      severity: 'warning',
      message: 'OP re-import declared but repair cost is zero or not entered. For procedure 6121, the customs value should represent the repair/processing cost. If the repair was free under guarantee, use procedure 6122 + B02 instead.',
      affectedElements: ['DE 1/10', 'DE 4/11'],
      passed: false,
    };
  }

  return {
    ruleId: 'V7',
    severity: 'info',
    message: `OP re-import: customs value of ${formatGBP(item.customsValueGBP)} is based on repair cost of ${formatGBP(item.repairCost)}. Confirm this represents the repair/processing cost only — NOT the full value of the goods.`,
    affectedElements: ['DE 1/10', 'DE 4/11'],
    passed: true,
  };
}

/** V8: Country-preference match */
function validateCountryPreference(item: DeclarationItem): ValidationResult {
  if (item.preferenceCode === '100') {
    return {
      ruleId: 'V8',
      severity: 'info',
      message: 'MFN rate (100) — no preference claimed. Country-preference match not applicable.',
      affectedElements: ['DE 5/15', 'DE 4/17'],
      passed: true,
    };
  }

  const valid = isPreferenceValidForCountry(item.preferenceCode, item.countryOfOrigin);
  const country = getCountryInfo(item.countryOfOrigin);
  const prefInfo = getPreferenceCodeInfo(item.preferenceCode);

  return {
    ruleId: 'V8',
    severity: valid ? 'info' : 'warning',
    message: valid
      ? `Preference ${item.preferenceCode} (${prefInfo?.name}) is valid for ${country?.name} (${country?.tradeScheme}).`
      : `Preference ${item.preferenceCode} (${prefInfo?.name}) may not be valid for ${country?.name ?? item.countryOfOrigin}. Expected preference code: ${country?.preferenceCode ?? 'unknown'}. Check the applicable trade agreement.`,
    affectedElements: ['DE 5/15', 'DE 4/17'],
    passed: valid,
  };
}

/** V9: Commodity code format */
function validateCommodityCode(item: DeclarationItem): ValidationResult {
  if (!item.commodityCode) {
    return {
      ruleId: 'V9',
      severity: 'error',
      message: 'Commodity code is required. Enter the 10-digit code from the Trade Tariff Lookup.',
      affectedElements: ['DE 6/14'],
      passed: false,
    };
  }

  const valid = isValidCommodityCode(item.commodityCode);
  return {
    ruleId: 'V9',
    severity: valid ? 'info' : 'error',
    message: valid
      ? `Commodity code ${item.commodityCode} has valid format (10 digits).`
      : `Commodity code "${item.commodityCode}" is not valid. Must be exactly 10 digits. Use the Trade Tariff Lookup to find the correct code.`,
    affectedElements: ['DE 6/14'],
    passed: valid,
  };
}

/** V10: EORI format check */
function validateEORIFormat(header: DeclarationHeader): ValidationResult {
  const issues: string[] = [];

  if (header.importer.eori && !isValidEORI(header.importer.eori)) {
    issues.push(`Importer EORI "${header.importer.eori}" — expected format: GB/XI + 12 digits.`);
  }
  if (header.declarant.eori && !isValidEORI(header.declarant.eori)) {
    issues.push(`Declarant EORI "${header.declarant.eori}" — expected format: GB/XI + 12 digits.`);
  }
  if (header.representative.eori && !isValidEORI(header.representative.eori)) {
    issues.push(`Representative EORI "${header.representative.eori}" — expected format: GB/XI + 12 digits.`);
  }

  if (!header.importer.eori) {
    issues.push('Importer EORI is required.');
  }
  if (!header.declarant.eori) {
    issues.push('Declarant EORI is required.');
  }

  return {
    ruleId: 'V10',
    severity: issues.length > 0 ? 'warning' : 'info',
    message: issues.length > 0
      ? `EORI format issues: ${issues.join(' ')}`
      : 'All EORI numbers have valid format.',
    affectedElements: ['DE 3/17', 'DE 3/37', 'DE 3/20'],
    passed: issues.length === 0,
  };
}

/** V11: Valuation indicators (Method 1) */
function validateValuationIndicators(item: DeclarationItem): ValidationResult {
  if (item.valuationMethod !== 1) {
    return {
      ruleId: 'V11',
      severity: 'info',
      message: `Valuation Method ${item.valuationMethod} selected. Valuation indicators (DE 4/13) are only required for Method 1.`,
      affectedElements: ['DE 4/16', 'DE 4/13'],
      passed: true,
    };
  }

  if (!item.valuationIndicators) {
    return {
      ruleId: 'V11',
      severity: 'warning',
      message: 'Method 1 selected but valuation indicators (DE 4/13) not completed. Enter a 4-digit code where each digit is 0 or 1. E.g., "0000" for unrelated parties with no conditions.',
      affectedElements: ['DE 4/13'],
      passed: false,
    };
  }

  if (!isValidValuationIndicators(item.valuationIndicators)) {
    return {
      ruleId: 'V11',
      severity: 'error',
      message: `Valuation indicators "${item.valuationIndicators}" invalid. Must be 4 digits, each 0 or 1. Digit 1: price restrictions, Digit 2: conditions, Digit 3: proceeds to seller, Digit 4: related parties.`,
      affectedElements: ['DE 4/13'],
      passed: false,
    };
  }

  const relatedParty = item.valuationIndicators[3] === '1';
  return {
    ruleId: 'V11',
    severity: 'info',
    message: relatedParty
      ? 'Valuation indicators show related party transaction (digit 4 = 1). Method 1 can still apply if the price was not influenced by the relationship — arm\'s length evidence may be required.'
      : 'Valuation indicators valid. No related party or price conditions affecting the customs value.',
    affectedElements: ['DE 4/13'],
    passed: true,
  };
}

/** V12: Net mass positive */
function validateNetMass(item: DeclarationItem): ValidationResult {
  return {
    ruleId: 'V12',
    severity: item.netMassKg > 0 ? 'info' : 'error',
    message: item.netMassKg > 0
      ? `Net mass: ${item.netMassKg.toLocaleString('en-GB')} kg.`
      : 'Net mass (DE 6/1) must be greater than zero.',
    affectedElements: ['DE 6/1'],
    passed: item.netMassKg > 0,
  };
}

/** V13: Representation consistency */
function validateRepresentation(header: DeclarationHeader): ValidationResult {
  if (!header.representationType) {
    return {
      ruleId: 'V13',
      severity: 'info',
      message: 'Self-representation. Importer is making the declaration directly.',
      affectedElements: ['DE 3/21', 'DE 3/20'],
      passed: true,
    };
  }

  if (!header.representative.eori) {
    return {
      ruleId: 'V13',
      severity: 'warning',
      message: `Representation type ${header.representationType === '2' ? '2 (direct)' : '3 (indirect)'} selected but representative EORI (DE 3/20) is empty. If an agent is acting, their EORI must be provided.`,
      affectedElements: ['DE 3/21', 'DE 3/20'],
      passed: false,
    };
  }

  const typeLabel = header.representationType === '2'
    ? 'Direct representation — agent acts in the name of the importer. Liability rests with the importer.'
    : 'Indirect representation — agent acts in their own name. Joint and several liability between agent and importer.';

  return {
    ruleId: 'V13',
    severity: 'info',
    message: `${typeLabel} Representative EORI: ${header.representative.eori}.`,
    affectedElements: ['DE 3/21', 'DE 3/20'],
    passed: true,
  };
}

/** Run all 13 validation rules */
export function validateDeclaration(
  header: DeclarationHeader,
  item: DeclarationItem
): ValidationResult[] {
  return [
    validateProcedurePreference(item),          // V1
    validatePreferenceDocuments(item),           // V2
    validateOPAuthorisation(item),               // V3
    validateDDAConsistency(header, item),        // V4
    validatePVAElection(header, item),           // V5
    validateCustomsValueReasonableness(item),    // V6
    validateOPCustomsValue(item),               // V7
    validateCountryPreference(item),             // V8
    validateCommodityCode(item),                // V9
    validateEORIFormat(header),                  // V10
    validateValuationIndicators(item),           // V11
    validateNetMass(item),                       // V12
    validateRepresentation(header),              // V13
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

// ─── Complete Declaration Output ─────────────────────────────────────────────

/** Build the full declaration output from inputs */
export function buildDeclarationOutput(inputs: DeclarationInputs): DeclarationOutput {
  const { header, item } = inputs;
  const dutyCalculation = calculateDutyAndTaxes(header, item);
  const validationResults = validateDeclaration(header, item);
  const documentChecklist = generateDocumentChecklist(header, item);
  const validationSummary = summariseValidation(validationResults);

  const hasErrors = validationResults.some((r) => r.severity === 'error' && !r.passed);
  const status: DeclarationStatus = hasErrors ? 'rejected' : 'accepted';

  const procInfo = getProcedureCodeInfo(item.procedureCode);
  const prefInfo = getPreferenceCodeInfo(item.preferenceCode);
  const country = getCountryInfo(item.countryOfOrigin);

  const summaryText = [
    `Declaration ${status.toUpperCase()}.`,
    `${item.goodsDescription || 'Goods'} — commodity code ${item.commodityCode}.`,
    `Origin: ${country?.name ?? item.countryOfOrigin}.`,
    `Procedure: ${item.procedureCode} (${procInfo?.name ?? 'Unknown'}).`,
    `Preference: ${item.preferenceCode} (${prefInfo?.name ?? 'Unknown'}).`,
    `Customs value: ${formatGBP(dutyCalculation.customsValue)}.`,
    `Duty: ${formatGBP(dutyCalculation.dutyAmount)} (${item.dutyRatePercent}%).`,
    `Import VAT: ${formatGBP(dutyCalculation.importVAT)} (${item.vatRate}%).`,
    `Total taxes: ${formatGBP(dutyCalculation.totalTaxes)}.`,
    dutyCalculation.pvaElected
      ? `PVA elected: ${formatGBP(dutyCalculation.deferredToVATReturn)} deferred to VAT return.`
      : 'PVA not elected.',
  ].join(' ');

  return {
    status,
    dutyCalculation,
    validationResults,
    documentChecklist,
    validationSummary,
    summaryText,
  };
}

// ─── H&C Test Scenarios ──────────────────────────────────────────────────────

/**
 * Pre-configured test scenarios from the H&C storyline.
 * These provide pre-filled inputs and expected outputs for graded mode.
 */
export const HC_DECLARATION_SCENARIOS: HCDeclarationScenario[] = [
  // ── Scenario 1: Section 2 — Italian Olive Oil (Standard Import) ─────────
  {
    id: 's2-olive-oil-import',
    name: 'S2 — Italian Olive Oil Import',
    section: 2,
    description:
      '8,000 bottles of extra virgin olive oil from Puglia, Italy. FOB Bari, EUR 42,000. UK-EU TCA preference. Zero-rated food (VATZ). PVA elected.',
    config: {
      showTooltips: true,
      showCalculationSteps: true,
      scenarioLabel: 'S2 — Italian Olive Oil Import',
    },
    preFilledInputs: {
      header: {
        declarationType: 'IM',
        additionalDeclarationType: 'A',
        declarant: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        importer: {
          eori: 'GB847291036000',
          name: 'Harrington & Cole Ltd',
          address: 'Harbourside, Bristol BS1 5BD',
        },
        representative: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        representationType: '2',
        importerVATNumber: '847291036',
        locationOfGoods: 'GBFXT',
        defermentAccountNumber: '8472910',
      },
      item: {
        itemNumber: 1,
        procedureCode: '4000',
        additionalProcedureCode: '000',
        commodityCode: '1509200090',
        goodsDescription: 'Extra virgin olive oil, 8,000 bottles (750ml), organic, Puglia region',
        netMassKg: 6000,
        supplementaryUnits: 8000,
        countryOfOrigin: 'IT',
        countryOfDispatch: 'IT',
        countryOfPreferentialOrigin: 'IT',
        customsValueGBP: 35700,
        valuationMethod: 1,
        valuationIndicators: '0000',
        preferenceCode: '300',
        incotermsCode: 'FOB',
        paymentMethodDuty: 'E',
        paymentMethodVAT: '',
        dutyRatePercent: 0,
        vatRate: 0,
        documentReferences: [
          { id: 's2-oil-inv', code: 'N935', reference: 'INV-2026-0142', statusCode: 'AE' },
          { id: 's2-oil-origin', code: 'U110', reference: 'SOO-IT-2026-0089', statusCode: 'AE' },
        ],
        repairCost: 0,
        outwardFreight: 0,
      },
    },
    expectedOutput: {
      customsValue: 35700,
      dutyRatePercent: 0,
      dutyAmount: 0,
      vatValue: 35700,
      vatRatePercent: 0,
      importVAT: 0,
      totalTaxes: 0,
      pvaElected: true,
      payableAtBorder: 0,
      deferredToVATReturn: 0,
      isOPReimport: false,
      calculationSteps: [],
    },
    hints: {
      'DE 1/10': [
        'Standard import — release to free circulation. Code 4000.',
        'No previous procedure applies — these are new goods entering the UK.',
      ],
      'DE 4/17': [
        'Italy is an EU Member State. The UK-EU TCA provides 0% preferential duty for qualifying goods.',
        'Preference code 300 requires a Statement on Origin (U110) from the Italian exporter.',
      ],
      'DE 4/11': [
        'The customs value comes from the Customs Valuation Worksheet.',
        'FOB Bari means freight and insurance to Felixstowe were added in the Valuation Worksheet.',
      ],
      'DE 3/40': [
        'Enter H&C\'s VAT number to elect PVA.',
        'With PVA, import VAT is accounted for on the next VAT return instead of being paid at the border.',
      ],
      'DE 6/14': [
        'Commodity code 1509200090 — Extra virgin olive oil.',
        'This was determined using the Trade Tariff Lookup tool.',
      ],
      'VAT rate': [
        'Olive oil sold as food is zero-rated (VATZ) under VATA 1994, Sch 8.',
        'Import VAT is therefore £0.',
      ],
    },
  },

  // ── Scenario 2: Section 2 — Japanese Ceramic Cups (Standard Import) ─────
  {
    id: 's2-ceramic-cups-import',
    name: 'S2 — Japanese Ceramic Cups Import',
    section: 2,
    description:
      '3,000 ceramic sake cups from Takara Design Co., Kyoto. CIF Felixstowe, JPY 5,400,000. UK-Japan CEPA preference. Standard-rated (20%). Customs value includes £2,000 assists (moulds). PVA elected.',
    config: {
      showTooltips: true,
      showCalculationSteps: true,
      scenarioLabel: 'S2 — Japanese Ceramic Cups Import',
    },
    preFilledInputs: {
      header: {
        declarationType: 'IM',
        additionalDeclarationType: 'A',
        declarant: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        importer: {
          eori: 'GB847291036000',
          name: 'Harrington & Cole Ltd',
          address: 'Harbourside, Bristol BS1 5BD',
        },
        representative: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        representationType: '2',
        importerVATNumber: '847291036',
        locationOfGoods: 'GBFXT',
        defermentAccountNumber: '8472910',
      },
      item: {
        itemNumber: 1,
        procedureCode: '4000',
        additionalProcedureCode: '000',
        commodityCode: '6912001000',
        goodsDescription: 'Ceramic sake cups, hand-painted, artisan, 3,000 units — Takara Design Co.',
        netMassKg: 900,
        supplementaryUnits: 3000,
        countryOfOrigin: 'JP',
        countryOfDispatch: 'JP',
        countryOfPreferentialOrigin: 'JP',
        customsValueGBP: 25500,
        valuationMethod: 1,
        valuationIndicators: '0000',
        preferenceCode: '300',
        incotermsCode: 'CIF',
        paymentMethodDuty: 'E',
        paymentMethodVAT: '',
        dutyRatePercent: 0,
        vatRate: 20,
        documentReferences: [
          { id: 's2-cups-inv', code: 'N935', reference: 'TK-INV-2026-0031', statusCode: 'AE' },
          { id: 's2-cups-origin', code: 'U110', reference: 'SOO-JP-2026-0014', statusCode: 'AE' },
        ],
        repairCost: 0,
        outwardFreight: 0,
      },
    },
    expectedOutput: {
      customsValue: 25500,
      dutyRatePercent: 0,
      dutyAmount: 0,
      vatValue: 25500,
      vatRatePercent: 20,
      importVAT: 5100,
      totalTaxes: 5100,
      pvaElected: true,
      payableAtBorder: 0,
      deferredToVATReturn: 5100,
      isOPReimport: false,
      calculationSteps: [],
    },
    hints: {
      'DE 1/10': [
        'Standard import. Procedure code 4000.',
      ],
      'DE 4/17': [
        'Japan — UK-Japan CEPA provides preferential rates. Preference code 300.',
        'Requires Statement on Origin (U110) from Takara.',
      ],
      'DE 4/11': [
        'Customs value of £25,500 includes the £2,000 assists (moulds) added in the Valuation Worksheet.',
        'CIF Felixstowe — freight and insurance are already in the invoice price.',
      ],
      'DE 4/13': [
        'Valuation indicators: 0000. H&C and Takara are unrelated. No price restrictions or conditions.',
      ],
      'VAT rate': [
        'Ceramic cups are standard-rated at 20%. Import VAT = £25,500 × 20% = £5,100.',
        'Under PVA, this £5,100 goes to the VAT return: Box 1 and Box 4.',
      ],
    },
  },

  // ── Scenario 3: Section 3 — Repaired Cups OP Re-Import ─────────────────
  {
    id: 's3-cups-op-reimport',
    name: 'S3 — Repaired Cups OP Re-Import',
    section: 3,
    description:
      '500 defective ceramic cups returned to Takara, Kyoto for repair. Repair cost JPY 900,000 (~£5,000). Return freight £800, insurance £50. OP relief — duty on repair cost only.',
    config: {
      showTooltips: true,
      showCalculationSteps: true,
      scenarioLabel: 'S3 — Repaired Cups OP Re-Import',
      allowedProcedureCodes: ['6121', '6122'],
    },
    preFilledInputs: {
      header: {
        declarationType: 'IM',
        additionalDeclarationType: 'A',
        declarant: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        importer: {
          eori: 'GB847291036000',
          name: 'Harrington & Cole Ltd',
          address: 'Harbourside, Bristol BS1 5BD',
        },
        representative: {
          eori: 'GB205672839000',
          name: 'Mitchell & Partners LLP',
          address: 'Temple Quay, Bristol BS1 6DZ',
        },
        representationType: '2',
        importerVATNumber: '847291036',
        locationOfGoods: 'GBFXT',
        defermentAccountNumber: '8472910',
      },
      item: {
        itemNumber: 1,
        procedureCode: '6121',
        additionalProcedureCode: '000',
        commodityCode: '6912001000',
        goodsDescription: 'Ceramic sake cups (500 units) — returned after repair by Takara Design Co., Kyoto',
        netMassKg: 150,
        supplementaryUnits: 500,
        countryOfOrigin: 'JP',
        countryOfDispatch: 'JP',
        countryOfPreferentialOrigin: 'JP',
        customsValueGBP: 5850,
        valuationMethod: 1,
        valuationIndicators: '0000',
        preferenceCode: '300',
        incotermsCode: 'CIF',
        paymentMethodDuty: 'E',
        paymentMethodVAT: '',
        dutyRatePercent: 0,
        vatRate: 20,
        documentReferences: [
          { id: 's3-repair-inv', code: 'N935', reference: 'TK-RPR-2026-0003', statusCode: 'AE' },
          { id: 's3-op-auth', code: 'C600', reference: 'OPO/GB/2026/001234', statusCode: 'AE' },
          { id: 's3-origin', code: 'U110', reference: 'SOO-JP-2026-0019', statusCode: 'AE' },
        ],
        repairCost: 5000,
        outwardFreight: 600,
      },
    },
    expectedOutput: {
      customsValue: 5850,
      dutyRatePercent: 0,
      dutyAmount: 0,
      vatValue: 6450,
      vatRatePercent: 20,
      importVAT: 1290,
      totalTaxes: 1290,
      pvaElected: true,
      payableAtBorder: 0,
      deferredToVATReturn: 1290,
      isOPReimport: true,
      calculationSteps: [],
    },
    hints: {
      'DE 1/10': [
        'OP re-import. The cups were temporarily exported for repair. Code 6121.',
        'If the repair were free under guarantee, you would use 6122 + B02 instead.',
      ],
      'DE 4/11': [
        'Under OP (6121), the customs value is the REPAIR COST + inward freight + insurance.',
        'Do NOT use the original value of the 500 cups. That would dramatically overstate the customs value.',
        'Repair cost £5,000 + freight £800 + insurance £50 = £5,850.',
      ],
      'DE 2/3': [
        'OP re-imports require: N935 (repair invoice), C600 (OP authorisation), and origin proof if claiming preference.',
        'The C600 must have been valid when the cups were originally exported to Japan for repair.',
      ],
      'VAT value': [
        'For OP VAT: repair cost + outward freight + inward freight + duty.',
        'Insurance is excluded from the VAT value.',
        '£5,000 (repair) + £600 (outward freight) + £800 (inward freight) + £0 (duty) = £6,400.',
        'But note: customs value includes insurance (£50), so adjust accordingly.',
      ],
    },
  },
];

/** Look up an H&C scenario by ID */
export function getScenarioById(id: string): HCDeclarationScenario | undefined {
  return HC_DECLARATION_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C scenarios by section number */
export function getScenariosBySection(section: number): HCDeclarationScenario[] {
  return HC_DECLARATION_SCENARIOS.filter((s) => s.section === section);
}
