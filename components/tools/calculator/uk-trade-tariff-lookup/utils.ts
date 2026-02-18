/**
 * UK Trade Tariff Lookup — Utility Functions
 *
 * Pure functions for searching commodity codes, looking up duty rates,
 * running validations, and providing H&C test scenarios.
 *
 * Contains a curated dataset of ~30 commodity codes relevant to H&C's
 * product lines (olive oil, ceramics, preserves, tea, wine).
 */

import type {
  SearchMode,
  DutyRateType,
  ImportVATRate,
  AlertSeverity,
  TradeRemedyType,
  PreferenceScheme,
  HierarchyLevel,
  ImportControlType,
  HierarchyBreadcrumb,
  TariffSection,
  Country,
  DutyRate,
  TradeRemedy,
  ExporterRate,
  ImportControl,
  CommodityRecord,
  TariffLookupResult,
  TariffAlert,
  SearchResult,
  CountryComparison,
  HCTariffScenario,
  TariffLookupConfig,
} from './types';

// ─── Constants ─────────────────────────────────────────────────────────────────

/** UK VAT standard rate — VATA 1994, s 2(1) */
export const STANDARD_VAT_RATE = 20;

/** UK VAT zero rate — VATA 1994, s 30, Sch 8 */
export const ZERO_VAT_RATE = 0;

/** CDS additional code for zero-rated food imports */
export const VATZ_CODE = 'VATZ';

/** MFN preference code — no FTA */
export const MFN_PREFERENCE_CODE = 100;

/** DCTS preference code */
export const DCTS_PREFERENCE_CODE = 200;

/** FTA preference code */
export const FTA_PREFERENCE_CODE = 300;

// ─── Tariff Sections ───────────────────────────────────────────────────────────

export const TARIFF_SECTIONS: TariffSection[] = [
  { number: 'I', title: 'Live animals; animal products', chapterRange: '01–05', chapters: ['01', '02', '03', '04', '05'] },
  { number: 'II', title: 'Vegetable products', chapterRange: '06–14', chapters: ['06', '07', '08', '09', '10', '11', '12', '13', '14'] },
  { number: 'III', title: 'Animal, vegetable or microbial fats and oils', chapterRange: '15', chapters: ['15'] },
  { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco', chapterRange: '16–24', chapters: ['16', '17', '18', '19', '20', '21', '22', '23', '24'] },
  { number: 'V', title: 'Mineral products', chapterRange: '25–27', chapters: ['25', '26', '27'] },
  { number: 'VI', title: 'Products of the chemical or allied industries', chapterRange: '28–38', chapters: ['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38'] },
  { number: 'VII', title: 'Plastics and articles thereof; rubber and articles thereof', chapterRange: '39–40', chapters: ['39', '40'] },
  { number: 'VIII', title: 'Raw hides and skins, leather, furskins', chapterRange: '41–43', chapters: ['41', '42', '43'] },
  { number: 'IX', title: 'Wood and articles of wood; cork; straw; basketware', chapterRange: '44–46', chapters: ['44', '45', '46'] },
  { number: 'X', title: 'Pulp of wood; paper and paperboard', chapterRange: '47–49', chapters: ['47', '48', '49'] },
  { number: 'XI', title: 'Textiles and textile articles', chapterRange: '50–63', chapters: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'] },
  { number: 'XII', title: 'Footwear, headgear, umbrellas', chapterRange: '64–67', chapters: ['64', '65', '66', '67'] },
  { number: 'XIII', title: 'Articles of stone, cement, ceramics; glass and glassware', chapterRange: '68–70', chapters: ['68', '69', '70'] },
  { number: 'XIV', title: 'Pearls, precious stones, precious metals; imitation jewellery', chapterRange: '71', chapters: ['71'] },
  { number: 'XV', title: 'Base metals and articles of base metal', chapterRange: '72–83', chapters: ['72', '73', '74', '75', '76', '78', '79', '80', '81', '82', '83'] },
  { number: 'XVI', title: 'Machinery and mechanical appliances; electrical equipment', chapterRange: '84–85', chapters: ['84', '85'] },
  { number: 'XVII', title: 'Vehicles, aircraft, vessels', chapterRange: '86–89', chapters: ['86', '87', '88', '89'] },
  { number: 'XVIII', title: 'Optical, photographic, measuring, medical instruments; clocks; musical instruments', chapterRange: '90–92', chapters: ['90', '91', '92'] },
  { number: 'XIX', title: 'Arms and ammunition', chapterRange: '93', chapters: ['93'] },
  { number: 'XX', title: 'Miscellaneous manufactured articles', chapterRange: '94–96', chapters: ['94', '95', '96'] },
  { number: 'XXI', title: 'Works of art, collectors\' pieces and antiques', chapterRange: '97–99', chapters: ['97', '98', '99'] },
];

// ─── Countries ─────────────────────────────────────────────────────────────────

export const COUNTRIES: Country[] = [
  { code: 'IT', name: 'Italy', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'ES', name: 'Spain', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'FR', name: 'France', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'DE', name: 'Germany', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'NL', name: 'Netherlands', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'IE', name: 'Ireland', preferenceScheme: 'uk-eu-tca', preferenceCode: 300, schemeName: 'UK-EU TCA', proofOfOrigin: 'Origin declaration on commercial document by EU exporter' },
  { code: 'JP', name: 'Japan', preferenceScheme: 'uk-japan-cepa', preferenceCode: 300, schemeName: 'UK-Japan CEPA', proofOfOrigin: 'Statement of origin on commercial documentation' },
  { code: 'IN', name: 'India', preferenceScheme: 'dcts-standard', preferenceCode: 200, schemeName: 'DCTS Standard Preferences', proofOfOrigin: 'GSP Form A or origin declaration' },
  { code: 'CN', name: 'China', preferenceScheme: 'mfn', preferenceCode: 100, schemeName: 'No FTA (Third Country / MFN)', proofOfOrigin: 'Not applicable — MFN rate applies' },
  { code: 'TR', name: 'Turkey', preferenceScheme: 'uk-turkey', preferenceCode: 300, schemeName: 'UK-Turkey FTA', proofOfOrigin: 'EUR.1 movement certificate or origin declaration' },
  { code: 'AU', name: 'Australia', preferenceScheme: 'uk-australia', preferenceCode: 300, schemeName: 'UK-Australia FTA', proofOfOrigin: 'Origin declaration' },
  { code: 'NZ', name: 'New Zealand', preferenceScheme: 'uk-new-zealand', preferenceCode: 300, schemeName: 'UK-New Zealand FTA', proofOfOrigin: 'Origin declaration' },
  { code: 'US', name: 'United States', preferenceScheme: 'mfn', preferenceCode: 100, schemeName: 'No FTA (Third Country / MFN)', proofOfOrigin: 'Not applicable — MFN rate applies' },
  { code: 'KR', name: 'South Korea', preferenceScheme: 'uk-south-korea', preferenceCode: 300, schemeName: 'UK-South Korea FTA', proofOfOrigin: 'Origin declaration' },
  { code: 'CA', name: 'Canada', preferenceScheme: 'uk-canada', preferenceCode: 300, schemeName: 'UK-Canada Continuity Agreement', proofOfOrigin: 'Origin declaration' },
  { code: 'CH', name: 'Switzerland', preferenceScheme: 'uk-switzerland', preferenceCode: 300, schemeName: 'UK-Switzerland Trade Agreement', proofOfOrigin: 'EUR.1 movement certificate or origin declaration' },
  { code: 'NO', name: 'Norway', preferenceScheme: 'uk-norway', preferenceCode: 300, schemeName: 'UK-Norway/Iceland/Liechtenstein FTA', proofOfOrigin: 'Origin declaration' },
  { code: 'NG', name: 'Nigeria', preferenceScheme: 'mfn', preferenceCode: 100, schemeName: 'No FTA (Third Country / MFN)', proofOfOrigin: 'Not applicable — MFN rate applies' },
  { code: 'VN', name: 'Vietnam', preferenceScheme: 'uk-vietnam', preferenceCode: 300, schemeName: 'UK-Vietnam FTA', proofOfOrigin: 'EUR.1 movement certificate or origin declaration' },
  { code: 'BR', name: 'Brazil', preferenceScheme: 'mfn', preferenceCode: 100, schemeName: 'No FTA (Third Country / MFN)', proofOfOrigin: 'Not applicable — MFN rate applies' },
];

// ─── Trade Remedies ────────────────────────────────────────────────────────────

/** Anti-dumping duty on Chinese ceramic tableware — Trade Remedies Notice 2025/21 */
const CHINESE_CERAMICS_AD: TradeRemedy = {
  type: 'anti-dumping',
  legalBasis: 'Trade Remedies Notice 2025/21',
  affectedOrigins: ['CN'],
  rate: 36.1,
  displayRate: '36.10%',
  expiryDate: '2029-07-16',
  applicability: 'All Chinese exporters not specifically listed in Annexes 2 or 3. Residual rate applies to unknown/new exporters.',
  exporterRates: [
    { category: 'Named companies (5 entities)', rate: 13.1, displayRate: '13.10% to 18.30%' },
    { category: 'Annex 2 exporters (8 companies)', rate: 17.6, displayRate: '17.60%' },
    { category: 'Annex 3 exporters (392 companies)', rate: 17.9, displayRate: '17.90%' },
    { category: 'All other exporters (residual)', rate: 36.1, displayRate: '36.10%' },
  ],
};

/** Commodity codes affected by the Chinese ceramics anti-dumping duty */
const CHINESE_CERAMICS_AD_CODES = [
  '6911100090', '6912002191', '6912002111', '6912002310', '6912002510', '6912002910',
];

// ─── Import Controls Reference ──────────────────────────────────────────────────

const ORGANIC_CERT: ImportControl = {
  type: 'organic-certification',
  name: 'Organic certification',
  documentCode: 'C644',
  condition: 'Required if goods are marketed as organic. Declare Y929 (non-organic) if not applicable.',
  mandatory: false,
};

const WASTE_DECLARATION: ImportControl = {
  type: 'waste-declaration',
  name: 'Waste declaration',
  documentCode: 'C672',
  condition: 'Declaration of non-waste status required for certain processed goods. Declare Y923 if not applicable.',
  mandatory: false,
};

// ─── Helper: Create Duty Rate ──────────────────────────────────────────────────

function adValoremRate(percent: number, scheme: PreferenceScheme | null = null, prefCode: number | null = null, proof: string | null = null): DutyRate {
  return {
    rateType: percent === 0 ? 'nil' : 'ad-valorem',
    adValoremPercent: percent,
    specificAmount: null,
    specificUnit: null,
    displayRate: percent === 0 ? '0.00% (duty-free)' : `${percent.toFixed(2)}%`,
    preferenceScheme: scheme,
    preferenceCode: prefCode,
    proofOfOrigin: proof,
  };
}

function specificRate(amount: number, unit: string): DutyRate {
  return {
    rateType: 'specific',
    adValoremPercent: null,
    specificAmount: amount,
    specificUnit: unit,
    displayRate: `£${amount.toFixed(2)} ${unit}`,
    preferenceScheme: null,
    preferenceCode: MFN_PREFERENCE_CODE,
    proofOfOrigin: null,
  };
}

function compoundRate(percent: number, amount: number, unit: string): DutyRate {
  return {
    rateType: 'compound',
    adValoremPercent: percent,
    specificAmount: amount,
    specificUnit: unit,
    displayRate: `${percent.toFixed(2)}% + £${amount.toFixed(2)} ${unit}`,
    preferenceScheme: null,
    preferenceCode: MFN_PREFERENCE_CODE,
    proofOfOrigin: null,
  };
}

function prefRate(percent: number, scheme: PreferenceScheme, prefCode: number, proof: string): DutyRate {
  return adValoremRate(percent, scheme, prefCode, proof);
}

// ─── Curated Commodity Dataset ──────────────────────────────────────────────────

/**
 * Curated dataset of commodity codes relevant to H&C's product lines.
 * Each record contains the full duty picture, import controls, and
 * educational annotations.
 */
export const COMMODITY_RECORDS: CommodityRecord[] = [
  // ── Chapter 09: Tea ──────────────────────────────────────────────────────
  {
    code: '0902100000',
    description: 'Green tea (not fermented) in immediate packings of a content not exceeding 3 kg',
    shortDescription: 'Green tea, ≤3 kg packs',
    hierarchy: {
      section: { number: 'II', title: 'Vegetable products' },
      chapter: { code: '09', title: 'Coffee, tea, maté and spices' },
      heading: { code: '0902', title: 'Tea, whether or not flavoured' },
      subheading: { code: '090210', title: 'Green tea (not fermented) in immediate packings ≤3 kg' },
      commodityCode: { code: '0902100000', title: 'Green tea, small packs' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(2),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin on commercial documentation'),
      IN: prefRate(0, 'dcts-standard', 200, 'GSP Form A or origin declaration'),
      CN: adValoremRate(2, 'mfn', 100, null),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
      NZ: prefRate(0, 'uk-new-zealand', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1, Item 4 — tea, maté, herbal teas',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Green tea in small packs carries a 2% MFN rate — one of the few tea products with a non-zero rate. Most FTAs and the DCTS eliminate this completely.',
    classificationNote: 'Green tea is unfermented. If partially or fully fermented (black/oolong), use heading 0902.30 or 0902.40. Pack size determines the 4-digit subheading.',
    searchKeywords: ['green tea', 'tea', 'matcha', 'sencha', 'unfermented tea'],
  },
  {
    code: '0902200000',
    description: 'Other green tea (not fermented)',
    shortDescription: 'Green tea, bulk (>3 kg)',
    hierarchy: {
      section: { number: 'II', title: 'Vegetable products' },
      chapter: { code: '09', title: 'Coffee, tea, maté and spices' },
      heading: { code: '0902', title: 'Tea, whether or not flavoured' },
      subheading: { code: '090220', title: 'Other green tea (not fermented)' },
      commodityCode: { code: '0902200000', title: 'Green tea, bulk' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(0),
    preferentialRates: {
      IN: prefRate(0, 'dcts-standard', 200, 'GSP Form A or origin declaration'),
      CN: adValoremRate(0, 'mfn', 100, null),
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1, Item 4',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Bulk green tea is already MFN duty-free. The DCTS and FTAs provide no additional duty benefit here, though origin still matters for statistical and regulatory purposes.',
    classificationNote: 'Bulk means packings exceeding 3 kg. This covers wholesale/industrial supply of green tea.',
    searchKeywords: ['green tea', 'tea', 'bulk tea', 'wholesale tea'],
  },
  {
    code: '0902300000',
    description: 'Black fermented tea and partly fermented tea, in immediate packings of a content not exceeding 3 kg',
    shortDescription: 'Black tea, ≤3 kg packs',
    hierarchy: {
      section: { number: 'II', title: 'Vegetable products' },
      chapter: { code: '09', title: 'Coffee, tea, maté and spices' },
      heading: { code: '0902', title: 'Tea, whether or not flavoured' },
      subheading: { code: '090230', title: 'Black fermented and partly fermented tea, ≤3 kg' },
      commodityCode: { code: '0902300000', title: 'Black tea, small packs' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(0),
    preferentialRates: {
      IN: prefRate(0, 'dcts-standard', 200, 'GSP Form A or origin declaration'),
      CN: adValoremRate(0, 'mfn', 100, null),
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1, Item 4',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Black tea (including Darjeeling, Assam, Ceylon) is MFN duty-free regardless of origin. This is H&C\'s specialty tea import from India.',
    classificationNote: 'Black tea is fully fermented. Oolong (partly fermented) also falls here. Pack size ≤3 kg = retail packs.',
    searchKeywords: ['black tea', 'tea', 'darjeeling', 'assam', 'ceylon', 'oolong', 'speciality tea', 'specialty tea'],
  },
  {
    code: '0902400000',
    description: 'Other black fermented tea and other partly fermented tea',
    shortDescription: 'Black tea, bulk (>3 kg)',
    hierarchy: {
      section: { number: 'II', title: 'Vegetable products' },
      chapter: { code: '09', title: 'Coffee, tea, maté and spices' },
      heading: { code: '0902', title: 'Tea, whether or not flavoured' },
      subheading: { code: '090240', title: 'Other black fermented and partly fermented tea' },
      commodityCode: { code: '0902400000', title: 'Black tea, bulk' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(0),
    preferentialRates: {
      IN: prefRate(0, 'dcts-standard', 200, 'GSP Form A or origin declaration'),
      CN: adValoremRate(0, 'mfn', 100, null),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1, Item 4',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Bulk black tea — used for blending or repackaging. MFN duty-free.',
    classificationNote: 'Bulk = packings exceeding 3 kg.',
    searchKeywords: ['black tea', 'tea', 'bulk tea', 'industrial tea'],
  },

  // ── Chapter 15: Olive Oil ────────────────────────────────────────────────
  {
    code: '1509200010',
    description: 'Extra virgin olive oil, in containers holding 5 litres or less',
    shortDescription: 'Extra virgin olive oil, retail (≤5L)',
    hierarchy: {
      section: { number: 'III', title: 'Animal, vegetable or microbial fats and oils' },
      chapter: { code: '15', title: 'Animal, vegetable or microbial fats and oils and their cleavage products' },
      heading: { code: '1509', title: 'Olive oil and its fractions, whether or not refined, but not chemically modified' },
      subheading: { code: '150920', title: 'Extra virgin olive oil' },
      commodityCode: { code: '1509200010', title: 'In containers ≤5 litres' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(104, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      TR: prefRate(0, 'uk-turkey', 300, 'EUR.1 movement certificate'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1 — vegetable oils for food use',
    importControls: [ORGANIC_CERT, WASTE_DECLARATION],
    supplementaryUnits: null,
    educationalNote: 'Olive oil carries a specific duty (per 100 kg), not an ad valorem percentage. This is unusual — most goods have ad valorem rates. The UK-EU TCA eliminates the duty entirely for EU-origin olive oil.',
    classificationNote: 'Extra virgin olive oil has an acidity ≤0.8%. Container size determines the 10-digit code: ≤5L = retail packs.',
    searchKeywords: ['olive oil', 'extra virgin', 'EVOO', 'cooking oil', 'vegetable oil'],
  },
  {
    code: '1509200090',
    description: 'Extra virgin olive oil, other (bulk, containers exceeding 5 litres)',
    shortDescription: 'Extra virgin olive oil, bulk (>5L)',
    hierarchy: {
      section: { number: 'III', title: 'Animal, vegetable or microbial fats and oils' },
      chapter: { code: '15', title: 'Animal, vegetable or microbial fats and oils and their cleavage products' },
      heading: { code: '1509', title: 'Olive oil and its fractions' },
      subheading: { code: '150920', title: 'Extra virgin olive oil' },
      commodityCode: { code: '1509200090', title: 'Other (bulk, >5 litres)' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(104, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document by EU exporter'),
      TR: prefRate(0, 'uk-turkey', 300, 'EUR.1 movement certificate'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1 — vegetable oils for food use',
    importControls: [ORGANIC_CERT, WASTE_DECLARATION],
    supplementaryUnits: null,
    educationalNote: 'This is H&C\'s olive oil import from Puglia (FOB Bari, EUR 42,000). Bulk containers >5L. The specific duty of £104/100 kg would apply without the TCA preference — a significant cost on 8,000 bottles.',
    classificationNote: 'Same as 1509200010 but for containers >5L. The 10th digit distinguishes container size. H&C imports in bulk for repackaging.',
    searchKeywords: ['olive oil', 'extra virgin', 'EVOO', 'bulk olive oil', 'puglia'],
  },
  {
    code: '1509300000',
    description: 'Virgin olive oil',
    shortDescription: 'Virgin olive oil (not extra virgin)',
    hierarchy: {
      section: { number: 'III', title: 'Animal, vegetable or microbial fats and oils' },
      chapter: { code: '15', title: 'Animal, vegetable or microbial fats and oils' },
      heading: { code: '1509', title: 'Olive oil and its fractions' },
      subheading: { code: '150930', title: 'Virgin olive oil' },
      commodityCode: { code: '1509300000', title: 'Virgin olive oil' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(104, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Virgin olive oil has acidity between 0.8% and 2%. Higher acidity = lower grade. Same duty treatment as extra virgin.',
    classificationNote: 'Key distinction from extra virgin: acidity level. Students should understand olive oil grading.',
    searchKeywords: ['virgin olive oil', 'olive oil'],
  },
  {
    code: '1509400000',
    description: 'Other olive oil (refined, blended)',
    shortDescription: 'Refined/blended olive oil',
    hierarchy: {
      section: { number: 'III', title: 'Animal, vegetable or microbial fats and oils' },
      chapter: { code: '15', title: 'Animal, vegetable or microbial fats and oils' },
      heading: { code: '1509', title: 'Olive oil and its fractions' },
      subheading: { code: '150940', title: 'Other olive oil' },
      commodityCode: { code: '1509400000', title: 'Other olive oil' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(104, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: null,
    educationalNote: 'Refined olive oil has been chemically processed. Same heading (1509) and same duty, but lower quality and price.',
    classificationNote: 'Includes blends of refined and virgin olive oil. Olive-pomace oil is classified separately under 1510.',
    searchKeywords: ['olive oil', 'refined olive oil', 'blended olive oil', 'light olive oil'],
  },

  // ── Chapter 20: Preserves & Jams ─────────────────────────────────────────
  {
    code: '2007993325',
    description: 'Strawberry jam and preserves, sugar content <70% by weight, other',
    shortDescription: 'Strawberry jam/preserves',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '20', title: 'Preparations of vegetables, fruit, nuts or other parts of plants' },
      heading: { code: '2007', title: 'Jams, fruit jellies, marmalades, fruit or nut purée and pastes' },
      subheading: { code: '200799', title: 'Other (not homogenised, not citrus)' },
      commodityCode: { code: '2007993325', title: 'Strawberry jam, <70% sugar' },
    },
    declarable: true,
    thirdCountryDuty: compoundRate(20, 19, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
      NZ: prefRate(0, 'uk-new-zealand', 300, 'Origin declaration'),
      CA: prefRate(0, 'uk-canada', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1 — food for human consumption',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: 'kg/raw sugar',
    educationalNote: 'Preserves have a compound duty: 20% ad valorem PLUS £19/100 kg specific. The specific element relates to sugar content. This is H&C\'s artisan preserves line (manufactured at Swansea). For export, classification is still needed for statistical purposes even though no duty applies.',
    classificationNote: 'Chapter 20 covers fruit preparations. Sugar content and fruit type determine the 10-digit code. H&C exports these — no import duty applies, but the code is needed for export declarations.',
    searchKeywords: ['jam', 'preserves', 'strawberry', 'fruit preserve', 'conserve', 'marmalade'],
  },
  {
    code: '2007993525',
    description: 'Raspberry jam and preserves, sugar content <70% by weight, other',
    shortDescription: 'Raspberry jam/preserves',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '20', title: 'Preparations of vegetables, fruit, nuts or other parts of plants' },
      heading: { code: '2007', title: 'Jams, fruit jellies, marmalades, fruit or nut purée and pastes' },
      subheading: { code: '200799', title: 'Other (not homogenised, not citrus)' },
      commodityCode: { code: '2007993525', title: 'Raspberry jam, <70% sugar' },
    },
    declarable: true,
    thirdCountryDuty: compoundRate(20, 19, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1 — food for human consumption',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: 'kg/raw sugar',
    educationalNote: 'Same duty structure as strawberry jam. Different fruit = different 10-digit code. Students should note that the fruit type affects classification even when the duty rate is identical.',
    classificationNote: 'Fruit type is a classification criterion in Chapter 20. Raspberry and strawberry have separate commodity codes despite identical duty treatment.',
    searchKeywords: ['jam', 'preserves', 'raspberry', 'fruit preserve'],
  },
  {
    code: '2007991935',
    description: 'Other fruit jams and preserves, sugar content <70% by weight',
    shortDescription: 'Other fruit jams/preserves',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '20', title: 'Preparations of vegetables, fruit, nuts or other parts of plants' },
      heading: { code: '2007', title: 'Jams, fruit jellies, marmalades, fruit or nut purée and pastes' },
      subheading: { code: '200799', title: 'Other (not homogenised, not citrus)' },
      commodityCode: { code: '2007991935', title: 'Other fruit jams, <70% sugar' },
    },
    declarable: true,
    thirdCountryDuty: compoundRate(20, 19, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: 'kg/raw sugar',
    educationalNote: 'Catch-all code for fruit jams not specifically listed. Same compound duty structure.',
    classificationNote: 'Residual code for fruits not individually classified (e.g., mixed fruit preserves).',
    searchKeywords: ['jam', 'preserves', 'fruit preserve', 'mixed fruit', 'conserve'],
  },
  {
    code: '2007101000',
    description: 'Homogenised preparations of fruit, with sugar content >13% by weight',
    shortDescription: 'Homogenised fruit preparations (high sugar)',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '20', title: 'Preparations of vegetables, fruit, nuts or other parts of plants' },
      heading: { code: '2007', title: 'Jams, fruit jellies, marmalades, fruit or nut purée and pastes' },
      subheading: { code: '200710', title: 'Homogenised preparations' },
      commodityCode: { code: '2007101000', title: 'Homogenised, >13% sugar' },
    },
    declarable: true,
    thirdCountryDuty: compoundRate(24, 23, 'per 100 kg'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'zero-rated',
    vatPercent: 0,
    vatReference: 'VATA 1994, Sch 8, Group 1',
    importControls: [ORGANIC_CERT],
    supplementaryUnits: 'kg/raw sugar',
    educationalNote: 'Homogenised preparations (baby food type products) attract a higher compound duty than standard jams. The sugar content threshold changes the rate.',
    classificationNote: 'Homogenised = finely ground/puréed for infant or dietetic use. Different from standard jam.',
    searchKeywords: ['fruit puree', 'baby food', 'homogenised', 'fruit preparation'],
  },

  // ── Chapter 22: Wine ─────────────────────────────────────────────────────
  {
    code: '2204210600',
    description: 'Wine of fresh grapes, in containers holding 2 litres or less, quality wine (PDO/PGI)',
    shortDescription: 'Quality wine, bottles (≤2L)',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '22', title: 'Beverages, spirits and vinegar' },
      heading: { code: '2204', title: 'Wine of fresh grapes, including fortified wines; grape must' },
      subheading: { code: '220421', title: 'In containers holding 2 litres or less' },
      commodityCode: { code: '2204210600', title: 'Quality wine (PDO/PGI), ≤2L' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(12.8, 'per hectolitre'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
      NZ: prefRate(0, 'uk-new-zealand', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated — alcoholic beverages are not zero-rated food (VATA 1994, Sch 8, Group 1 exclusion)',
    importControls: [],
    supplementaryUnits: 'LTR (litres)',
    educationalNote: 'Wine is standard-rated for VAT at 20% — it is excluded from the food zero-rating as an alcoholic beverage. The customs duty is specific (per hectolitre). Wine from EU is duty-free under the TCA.',
    classificationNote: 'PDO/PGI = Protected Designation of Origin / Protected Geographical Indication. Quality wines have specific classification. Alcohol content further subdivides.',
    searchKeywords: ['wine', 'red wine', 'white wine', 'rosé', 'grape wine', 'Italian wine', 'French wine'],
  },
  {
    code: '2204218000',
    description: 'Other wine of fresh grapes, in containers holding 2 litres or less',
    shortDescription: 'Other wine, bottles (≤2L)',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '22', title: 'Beverages, spirits and vinegar' },
      heading: { code: '2204', title: 'Wine of fresh grapes' },
      subheading: { code: '220421', title: 'In containers holding 2 litres or less' },
      commodityCode: { code: '2204218000', title: 'Other wine, ≤2L' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(12.8, 'per hectolitre'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      ES: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      AU: prefRate(0, 'uk-australia', 300, 'Origin declaration'),
    },
    tradeRemedies: [],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated — alcoholic beverage',
    importControls: [],
    supplementaryUnits: 'LTR (litres)',
    educationalNote: 'Non-PDO wine — table wine or wine without geographical indication. Same duty structure but distinct code.',
    classificationNote: 'Catch-all for bottled wine not meeting PDO/PGI criteria.',
    searchKeywords: ['wine', 'table wine', 'non-PDO wine'],
  },
  {
    code: '2204229800',
    description: 'Other wine of fresh grapes, in containers holding more than 2 litres but not more than 10 litres',
    shortDescription: 'Wine, 2L–10L containers',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '22', title: 'Beverages, spirits and vinegar' },
      heading: { code: '2204', title: 'Wine of fresh grapes' },
      subheading: { code: '220422', title: 'In containers holding >2L but ≤10L' },
      commodityCode: { code: '2204229800', title: 'Other wine, 2L–10L' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(12.8, 'per hectolitre'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated — alcoholic beverage',
    importControls: [],
    supplementaryUnits: 'LTR (litres)',
    educationalNote: 'Larger format wine (bag-in-box, etc.). Same duty and VAT treatment as bottled wine.',
    classificationNote: 'Container size determines the 6-digit subheading for wine.',
    searchKeywords: ['wine', 'bag in box wine', 'bulk wine'],
  },
  {
    code: '2204299800',
    description: 'Other wine of fresh grapes, in containers holding more than 10 litres',
    shortDescription: 'Wine, bulk (>10L)',
    hierarchy: {
      section: { number: 'IV', title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco' },
      chapter: { code: '22', title: 'Beverages, spirits and vinegar' },
      heading: { code: '2204', title: 'Wine of fresh grapes' },
      subheading: { code: '220429', title: 'In containers holding >10L' },
      commodityCode: { code: '2204299800', title: 'Other wine, >10L (bulk)' },
    },
    declarable: true,
    thirdCountryDuty: specificRate(6.4, 'per hectolitre'),
    preferentialRates: {
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      FR: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
    },
    tradeRemedies: [],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated — alcoholic beverage',
    importControls: [],
    supplementaryUnits: 'LTR (litres)',
    educationalNote: 'Bulk wine (>10L) attracts a lower specific duty than bottled — £6.40 vs £12.80 per hectolitre. This reflects the lower value-added of bulk imports.',
    classificationNote: 'Wine for bottling in the UK — shipped in tanks or large containers.',
    searchKeywords: ['wine', 'bulk wine', 'tanker wine'],
  },

  // ── Chapter 69: Ceramics ─────────────────────────────────────────────────
  {
    code: '6911100090',
    description: 'Tableware and kitchenware of porcelain or china, other',
    shortDescription: 'Porcelain/china tableware (cups, plates, etc.)',
    hierarchy: {
      section: { number: 'XIII', title: 'Articles of stone, cement, ceramics; glass and glassware' },
      chapter: { code: '69', title: 'Ceramic products' },
      heading: { code: '6911', title: 'Tableware, kitchenware, other household articles and toilet articles, of porcelain or china' },
      subheading: { code: '691110', title: 'Tableware and kitchenware' },
      commodityCode: { code: '6911100090', title: 'Other porcelain/china tableware' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(12),
    preferentialRates: {
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin on commercial documentation'),
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      DE: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      KR: prefRate(0, 'uk-south-korea', 300, 'Origin declaration'),
      VN: prefRate(0, 'uk-vietnam', 300, 'EUR.1 movement certificate or origin declaration'),
      CN: adValoremRate(12, 'mfn', 100, null),
      IN: prefRate(8.4, 'dcts-standard', 200, 'GSP Form A or origin declaration'),
    },
    tradeRemedies: [CHINESE_CERAMICS_AD],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated — not a food product',
    importControls: [],
    supplementaryUnits: null,
    educationalNote: 'This is H&C\'s ceramic sake cups from Takara Design Co. (Kyoto). From Japan: 0% under CEPA. From China: 12% MFN + 36.1% anti-dumping = 48.1% total. This dramatic difference demonstrates why origin determination is critical. Students should also note: if Takara moved production to China, the duty picture would change completely.',
    classificationNote: 'Porcelain vs stoneware is a key classification distinction. Porcelain (china) is vitrified, translucent, and has a clear ring when struck. Stoneware is opaque and heavier. Japanese sake cups can be either — for H&C, Takara\'s cups are porcelain/china.',
    searchKeywords: ['ceramic', 'porcelain', 'china', 'cups', 'tableware', 'kitchenware', 'sake cups', 'mugs', 'plates', 'bowls'],
  },
  {
    code: '6911900000',
    description: 'Other household articles and toilet articles, of porcelain or china',
    shortDescription: 'Other porcelain/china household articles',
    hierarchy: {
      section: { number: 'XIII', title: 'Articles of stone, cement, ceramics; glass and glassware' },
      chapter: { code: '69', title: 'Ceramic products' },
      heading: { code: '6911', title: 'Tableware, kitchenware, other household articles and toilet articles, of porcelain or china' },
      subheading: { code: '691190', title: 'Other (household/toilet articles)' },
      commodityCode: { code: '6911900000', title: 'Other household/toilet articles' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(12),
    preferentialRates: {
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin'),
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      CN: adValoremRate(12, 'mfn', 100, null),
    },
    tradeRemedies: [],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated',
    importControls: [],
    supplementaryUnits: null,
    educationalNote: 'Decorative items, vases, etc. of porcelain. Same 12% MFN as tableware, but NOT subject to the Chinese ceramics anti-dumping duty (which specifically covers tableware and kitchenware).',
    classificationNote: 'Heading 6911 covers both tableware/kitchenware (6911.10) and other household articles (6911.90). The anti-dumping measure only covers 6911.10.',
    searchKeywords: ['porcelain', 'china', 'vase', 'decorative', 'household', 'toilet article'],
  },
  {
    code: '6912002310',
    description: 'Tableware and kitchenware of stoneware',
    shortDescription: 'Stoneware tableware',
    hierarchy: {
      section: { number: 'XIII', title: 'Articles of stone, cement, ceramics; glass and glassware' },
      chapter: { code: '69', title: 'Ceramic products' },
      heading: { code: '6912', title: 'Ceramic tableware, kitchenware, other household articles and toilet articles, other than of porcelain or china' },
      subheading: { code: '691200', title: 'Ceramic tableware (not porcelain)' },
      commodityCode: { code: '6912002310', title: 'Of stoneware' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(4),
    preferentialRates: {
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin'),
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      CN: adValoremRate(4, 'mfn', 100, null),
    },
    tradeRemedies: [CHINESE_CERAMICS_AD],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated',
    importControls: [],
    supplementaryUnits: null,
    educationalNote: 'Stoneware attracts only 4% MFN — much less than porcelain\'s 12%. However, the Chinese ceramics anti-dumping duty still applies to stoneware tableware from China.',
    classificationNote: 'Stoneware is opaque, non-translucent, and heavier than porcelain. Classification between 6911 and 6912 depends on the material. Getting this distinction right matters for the base duty rate.',
    searchKeywords: ['stoneware', 'ceramic', 'tableware', 'earthenware', 'cups', 'plates'],
  },
  {
    code: '6912002110',
    description: 'Tableware and kitchenware of common pottery',
    shortDescription: 'Common pottery tableware',
    hierarchy: {
      section: { number: 'XIII', title: 'Articles of stone, cement, ceramics; glass and glassware' },
      chapter: { code: '69', title: 'Ceramic products' },
      heading: { code: '6912', title: 'Ceramic tableware (not porcelain or china)' },
      subheading: { code: '691200', title: 'Ceramic tableware (not porcelain)' },
      commodityCode: { code: '6912002110', title: 'Of common pottery' },
    },
    declarable: true,
    thirdCountryDuty: adValoremRate(4),
    preferentialRates: {
      JP: prefRate(0, 'uk-japan-cepa', 300, 'Statement of origin'),
      IT: prefRate(0, 'uk-eu-tca', 300, 'Origin declaration on commercial document'),
      CN: adValoremRate(4, 'mfn', 100, null),
    },
    tradeRemedies: [CHINESE_CERAMICS_AD],
    vatOnImportation: 'standard',
    vatPercent: 20,
    vatReference: 'Standard-rated',
    importControls: [],
    supplementaryUnits: null,
    educationalNote: 'Common pottery is the lowest grade of ceramic — porous, often unglazed or partially glazed. Same 4% MFN as stoneware.',
    classificationNote: 'Common pottery = porous ceramic body. Absorbs water unless glazed. The simplest form of ceramic.',
    searchKeywords: ['pottery', 'ceramic', 'tableware', 'terracotta', 'earthenware'],
  },
];

// ─── Lookup Functions ──────────────────────────────────────────────────────────

/** Find a commodity record by its 10-digit code */
export function getCommodityByCode(code: string): CommodityRecord | undefined {
  return COMMODITY_RECORDS.find((r) => r.code === code);
}

/** Find commodity records matching a text search query */
export function searchCommodities(query: string): SearchResult[] {
  const normalised = query.toLowerCase().trim();
  if (!normalised) return [];

  const results: SearchResult[] = [];

  for (const record of COMMODITY_RECORDS) {
    let relevance = 0;

    // Check search keywords
    for (const keyword of record.searchKeywords) {
      if (keyword.toLowerCase().includes(normalised)) {
        relevance += 50;
        if (keyword.toLowerCase() === normalised) {
          relevance += 30;
        }
      }
    }

    // Check description
    if (record.description.toLowerCase().includes(normalised)) {
      relevance += 40;
    }
    if (record.shortDescription.toLowerCase().includes(normalised)) {
      relevance += 20;
    }

    // Check commodity code
    if (record.code.startsWith(normalised)) {
      relevance += 60;
    }

    if (relevance > 0) {
      results.push({
        code: record.code,
        description: record.shortDescription,
        fullDescription: record.description,
        hierarchy: record.hierarchy,
        declarable: record.declarable,
        relevance: Math.min(relevance, 100),
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

/** Find commodity records by chapter code */
export function getCommoditiesByChapter(chapterCode: string): CommodityRecord[] {
  return COMMODITY_RECORDS.filter((r) => r.code.startsWith(chapterCode.padStart(2, '0')));
}

/** Find commodity records by heading (4-digit) */
export function getCommoditiesByHeading(headingCode: string): CommodityRecord[] {
  return COMMODITY_RECORDS.filter((r) => r.code.startsWith(headingCode));
}

/** Get a country by its ISO code */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Find the section a chapter belongs to */
export function getSectionByChapter(chapterCode: string): TariffSection | undefined {
  return TARIFF_SECTIONS.find((s) => s.chapters.includes(chapterCode.padStart(2, '0')));
}

// ─── Duty Calculation ──────────────────────────────────────────────────────────

/** Get the applicable duty rate for a commodity + country combination */
export function getApplicableDuty(commodity: CommodityRecord, country: Country): DutyRate {
  const prefRate = commodity.preferentialRates[country.code];
  if (prefRate && country.preferenceScheme !== 'mfn') {
    return prefRate;
  }
  return commodity.thirdCountryDuty;
}

/** Get trade remedies applicable for a commodity + country combination */
export function getApplicableRemedies(commodity: CommodityRecord, countryCode: string): TradeRemedy[] {
  return commodity.tradeRemedies.filter((r) => r.affectedOrigins.includes(countryCode));
}

/** Calculate the effective duty percentage (ad valorem only — specific duties shown separately) */
export function calculateEffectiveDutyPercent(duty: DutyRate, remedies: TradeRemedy[]): number {
  let total = duty.adValoremPercent ?? 0;
  for (const remedy of remedies) {
    total += remedy.rate;
  }
  return Math.round(total * 100) / 100;
}

/** Generate a display string for the effective duty */
export function formatEffectiveDuty(duty: DutyRate, remedies: TradeRemedy[]): string {
  const parts: string[] = [];

  if (duty.rateType === 'specific') {
    parts.push(duty.displayRate);
  } else if (duty.rateType === 'compound') {
    parts.push(duty.displayRate);
  } else {
    parts.push(duty.displayRate);
  }

  for (const remedy of remedies) {
    parts.push(`+ ${remedy.displayRate} (${remedy.type})`);
  }

  if (remedies.length > 0 && duty.rateType === 'ad-valorem') {
    const total = calculateEffectiveDutyPercent(duty, remedies);
    parts.push(`= ${total.toFixed(2)}% total`);
  }

  return parts.join(' ');
}

// ─── Rules of Origin Notes ──────────────────────────────────────────────────────

/** Generate a rules of origin note for a country */
export function getRulesOfOriginNote(country: Country): string {
  if (country.preferenceScheme === 'mfn') {
    return `No preferential trade agreement between the UK and ${country.name}. The Third Country (MFN) rate applies. No proof of origin is required (but origin must still be declared on the import entry for statistical and trade remedy purposes).`;
  }

  return `To claim the preferential rate under the ${country.schemeName}, proof of origin is required: ${country.proofOfOrigin}. The goods must satisfy the rules of origin set out in the agreement — typically a change in tariff classification or local value-added threshold. The preference code on the CDS declaration is ${country.preferenceCode}.`;
}

// ─── Validation Engine ──────────────────────────────────────────────────────────

/** T1: Declarable code check */
function validateDeclarableCode(commodity: CommodityRecord): TariffAlert | null {
  if (!commodity.declarable) {
    return {
      ruleId: 'T1',
      severity: 'error',
      message: `Code ${commodity.code} is not declarable on an import entry. You need to drill down to a 10-digit commodity code.`,
      educationalNote: 'Only 10-digit codes can be used on CDS import declarations. Intermediate headings and subheadings are for classification navigation only.',
    };
  }
  return null;
}

/** T2: Country-preference match */
function validateCountryPreference(commodity: CommodityRecord, country: Country): TariffAlert | null {
  if (country.preferenceScheme === 'mfn') {
    const hasFTACountries = Object.keys(commodity.preferentialRates).some(
      (code) => {
        const c = getCountryByCode(code);
        return c && c.preferenceScheme !== 'mfn';
      }
    );
    if (hasFTACountries) {
      return {
        ruleId: 'T2',
        severity: 'warning',
        message: `${country.name} has no preferential trade agreement with the UK. The full Third Country (MFN) duty rate applies. Other origin countries may attract lower preferential rates.`,
        educationalNote: 'Without an FTA or preference scheme, the UK Global Tariff (MFN rate) applies. This is the highest rate available. FTAs can reduce or eliminate duty entirely.',
      };
    }
  }
  return null;
}

/** T3: Trade remedy alert */
function validateTradeRemedies(commodity: CommodityRecord, countryCode: string): TariffAlert | null {
  const remedies = getApplicableRemedies(commodity, countryCode);
  if (remedies.length > 0) {
    const remedy = remedies[0];
    return {
      ruleId: 'T3',
      severity: 'warning',
      message: `Trade remedy duty applies: ${remedy.displayRate} ${remedy.type} duty on this commodity from this origin. Legal basis: ${remedy.legalBasis}. Expires: ${remedy.expiryDate}. Total effective rate includes MFN + trade remedy.`,
      educationalNote: 'Trade remedy duties are imposed by the UK Trade Remedies Authority (TRA) to counter unfair trade practices (dumping or subsidies). They are applied on top of the normal MFN rate and can significantly increase the cost of importing.',
    };
  }
  return null;
}

/** T4: Proof of origin reminder */
function validateProofOfOrigin(country: Country, duty: DutyRate): TariffAlert | null {
  if (duty.preferenceScheme && duty.preferenceScheme !== 'mfn' && (duty.adValoremPercent === 0 || (duty.adValoremPercent !== null && duty.adValoremPercent < 12))) {
    return {
      ruleId: 'T4',
      severity: 'info',
      message: `Preferential rate available under ${country.schemeName}. To claim this rate, include proof of origin on the import declaration: ${country.proofOfOrigin}. Preference code: ${country.preferenceCode}.`,
      educationalNote: 'Claiming a preferential rate without valid proof of origin is a compliance risk. HMRC can issue a C18 post-clearance demand if the origin documentation is inadequate or the goods do not meet the rules of origin.',
    };
  }
  return null;
}

/** T5: VAT rate confirmation */
function validateVATRate(commodity: CommodityRecord): TariffAlert {
  if (commodity.vatOnImportation === 'zero-rated') {
    return {
      ruleId: 'T5',
      severity: 'info',
      message: `This commodity is zero-rated for import VAT (${commodity.vatReference}). Declare additional code VATZ on the CDS entry to claim zero-rating. Without VATZ, standard 20% VAT will be charged.`,
      educationalNote: 'Food products are generally zero-rated for VAT on importation, matching their domestic VAT treatment. The zero-rating must be actively claimed using the VATZ additional code on the declaration.',
    };
  }
  return {
    ruleId: 'T5',
    severity: 'info',
    message: `This commodity is standard-rated for import VAT at 20% (${commodity.vatReference}). Import VAT can be paid at the border, deferred via a duty deferment account, or accounted for via Postponed VAT Accounting (PVA).`,
    educationalNote: 'Standard-rated goods attract 20% import VAT on the customs value plus any duty payable. PVA allows the VAT to be accounted for on the VAT return (Box 1 + Box 4) rather than paid at the border — improving cash flow.',
  };
}

/** T6: Import control alert */
function validateImportControls(commodity: CommodityRecord): TariffAlert | null {
  if (commodity.importControls.length > 0) {
    const controlNames = commodity.importControls.map((c) => `${c.name} (${c.documentCode || 'see conditions'})`).join('; ');
    return {
      ruleId: 'T6',
      severity: 'info',
      message: `Import controls apply: ${controlNames}. Check the conditions column for when each control is mandatory.`,
      educationalNote: 'Import controls are regulatory requirements beyond duty. They may include phytosanitary certificates for plant products, organic certification for organic goods, or CHED-D documents for goods under contamination monitoring.',
    };
  }
  return null;
}

/** T7: Supplementary units reminder */
function validateSupplementaryUnits(commodity: CommodityRecord): TariffAlert | null {
  if (commodity.supplementaryUnits) {
    return {
      ruleId: 'T7',
      severity: 'info',
      message: `Supplementary units required: ${commodity.supplementaryUnits}. This must be declared on the CDS entry (Data Element 6/2) alongside the net mass in kilograms.`,
      educationalNote: 'Supplementary units are additional measurements required by the tariff. They are used for statistical purposes and, in some cases, for calculating specific duties. Failing to declare them is a common error on import entries.',
    };
  }
  return null;
}

/** Run all validation rules for a lookup result */
export function validateLookup(commodity: CommodityRecord, country: Country, duty: DutyRate): TariffAlert[] {
  const alerts: TariffAlert[] = [];

  const t1 = validateDeclarableCode(commodity);
  if (t1) alerts.push(t1);

  const t2 = validateCountryPreference(commodity, country);
  if (t2) alerts.push(t2);

  const t3 = validateTradeRemedies(commodity, country.code);
  if (t3) alerts.push(t3);

  const t4 = validateProofOfOrigin(country, duty);
  if (t4) alerts.push(t4);

  alerts.push(validateVATRate(commodity));

  const t6 = validateImportControls(commodity);
  if (t6) alerts.push(t6);

  const t7 = validateSupplementaryUnits(commodity);
  if (t7) alerts.push(t7);

  return alerts;
}

// ─── Full Lookup ───────────────────────────────────────────────────────────────

/** Perform a complete tariff lookup for a commodity code + country combination */
export function performLookup(commodityCode: string, countryCode: string): TariffLookupResult | null {
  const commodity = getCommodityByCode(commodityCode);
  if (!commodity) return null;

  const country = getCountryByCode(countryCode);
  if (!country) return null;

  const applicableDuty = getApplicableDuty(commodity, country);
  const applicableRemedies = getApplicableRemedies(commodity, country.code);
  const effectiveDutyPercent = calculateEffectiveDutyPercent(applicableDuty, applicableRemedies);
  const effectiveDutyDisplay = formatEffectiveDuty(applicableDuty, applicableRemedies);
  const rulesOfOriginNote = getRulesOfOriginNote(country);
  const alerts = validateLookup(commodity, country, applicableDuty);

  return {
    commodity,
    country,
    applicableDuty,
    applicableRemedies,
    effectiveDutyPercent,
    effectiveDutyDisplay,
    vatOnImportation: commodity.vatOnImportation,
    vatPercent: commodity.vatPercent,
    importControls: commodity.importControls,
    rulesOfOriginNote,
    alerts,
  };
}

// ─── Country Comparison ────────────────────────────────────────────────────────

/** Compare duty treatment for the same commodity from two different countries */
export function compareCountries(
  commodityCode: string,
  countryCodeA: string,
  countryCodeB: string
): CountryComparison | null {
  const resultA = performLookup(commodityCode, countryCodeA);
  const resultB = performLookup(commodityCode, countryCodeB);

  if (!resultA || !resultB) return null;

  const dutyDifference = Math.abs(resultA.effectiveDutyPercent - resultB.effectiveDutyPercent);
  const lowerDutyCountry = resultA.effectiveDutyPercent <= resultB.effectiveDutyPercent
    ? resultA.country.name
    : resultB.country.name;

  let comparisonNote: string;
  if (dutyDifference === 0) {
    comparisonNote = `Same effective duty rate from both ${resultA.country.name} and ${resultB.country.name}. Other factors (lead time, quality, currency risk) may differentiate.`;
  } else {
    comparisonNote = `${lowerDutyCountry} offers a ${dutyDifference.toFixed(2)} percentage point duty advantage. On a £100,000 consignment, that is a £${(dutyDifference * 1000).toFixed(0)} duty saving.`;
  }

  return {
    commodity: resultA.commodity,
    countryA: resultA,
    countryB: resultB,
    dutyDifference,
    lowerDutyCountry,
    comparisonNote,
  };
}

// ─── H&C Test Scenarios ────────────────────────────────────────────────────────

export const HC_TARIFF_SCENARIOS: HCTariffScenario[] = [
  // ── Scenario 1: Section 2 — Classify Olive Oil ────────────────────────────
  {
    id: 's2-olive-oil',
    name: 'S2 — Classify Olive Oil',
    section: 2,
    description: 'H&C receives 8,000 bottles of extra virgin olive oil from Puglia, Italy (FOB Bari, EUR 42,000). Classify the product and determine the applicable duty rate.',
    config: {
      initialMode: 'text',
      compareEnabled: false,
      preSelectedCode: undefined,
      preSelectedCountry: 'IT',
      scenarioLabel: 'S2 — Classify Olive Oil',
    },
    expectedCode: '1509200090',
    expectedCountry: 'IT',
    expectedResult: {
      commodityCode: '1509200090',
      effectiveDutyPercent: 0,
      effectiveDutyDisplay: '0.00% (duty-free)',
      vatPercent: 0,
    },
    hints: {
      search: [
        'Try searching for "olive oil" — it falls under Chapter 15 (Fats and oils).',
        'Extra virgin olive oil is heading 1509, subheading 150920.',
      ],
      classification: [
        'The key distinction is container size: ≤5L (1509200010) vs >5L/bulk (1509200090).',
        'H&C imports in bulk for repackaging — use 1509200090.',
      ],
      duty: [
        'The MFN rate is £104.00 per 100 kg — a specific duty, not a percentage.',
        'Italy is in the EU. Under the UK-EU TCA, olive oil from the EU is duty-free (0%).',
        'To claim 0%, an origin declaration from the Italian exporter is required.',
      ],
      origin: [
        'Proof of origin: origin declaration on the commercial invoice or other document.',
        'The declaration must state that the olive oil originates in the EU.',
        'Preference code 300 on the CDS declaration.',
      ],
      controls: [
        'No phytosanitary certificate required for processed olive oil.',
        'If marketed as organic, organic certification (C644) is required.',
        'Olive oil is zero-rated for import VAT — declare additional code VATZ.',
      ],
    },
  },

  // ── Scenario 2: Section 2 — Classify Ceramic Cups ────────────────────────
  {
    id: 's2-ceramic-cups',
    name: 'S2 — Classify Ceramic Cups',
    section: 2,
    description: 'H&C receives 3,000 ceramic sake cups from Takara Design Co., Kyoto, Japan (CIF Felixstowe, JPY 5,400,000). Classify and determine duty rates.',
    config: {
      initialMode: 'text',
      compareEnabled: true,
      preSelectedCode: undefined,
      preSelectedCountry: 'JP',
      scenarioLabel: 'S2 — Classify Ceramic Cups',
    },
    expectedCode: '6911100090',
    expectedCountry: 'JP',
    expectedResult: {
      commodityCode: '6911100090',
      effectiveDutyPercent: 0,
      effectiveDutyDisplay: '0.00% (duty-free)',
      vatPercent: 20,
    },
    hints: {
      search: [
        'Try "ceramic cups" or "porcelain" — ceramics are in Chapter 69 (Section XIII).',
        'Porcelain/china tableware = heading 6911. Stoneware/pottery = heading 6912.',
      ],
      classification: [
        'Japanese sake cups from Takara are porcelain/china — use 6911100090.',
        'If they were stoneware, the code would be 6912002310 with a lower MFN rate (4% vs 12%).',
        'The material (porcelain vs stoneware) is the critical classification criterion.',
      ],
      duty: [
        'MFN rate for porcelain tableware: 12% ad valorem.',
        'Japan: 0% under UK-Japan CEPA — duty-free with statement of origin.',
        'Try comparing Japan vs China: same cups from China would attract 48.1% (12% + 36.1% anti-dumping).',
      ],
      origin: [
        'Proof of origin: statement of origin on commercial documentation.',
        'For consignments below JPY 200,000 (~£1,100), a simplified origin declaration suffices.',
        'Preference code 300 on the CDS declaration.',
      ],
      controls: [
        'No import controls for ceramics — no phytosanitary or food safety requirements.',
        'Ceramics are standard-rated for VAT at 20% — they are not food products.',
        'VAT can be paid at the border, deferred, or accounted for via PVA.',
      ],
    },
  },

  // ── Scenario 3: Section 2 — China Contrast (Anti-Dumping) ────────────────
  {
    id: 's2-china-contrast',
    name: 'S2 — China Origin Contrast',
    section: 2,
    description: 'Look up the same ceramic cups (6911100090) but from China instead of Japan. See how anti-dumping duties change the picture.',
    config: {
      initialMode: 'direct',
      compareEnabled: true,
      preSelectedCode: '6911100090',
      preSelectedCountry: 'CN',
      scenarioLabel: 'S2 — China Origin Contrast',
    },
    expectedCode: '6911100090',
    expectedCountry: 'CN',
    expectedResult: {
      commodityCode: '6911100090',
      effectiveDutyPercent: 48.1,
      effectiveDutyDisplay: '12.00% + 36.10% (anti-dumping) = 48.10% total',
      vatPercent: 20,
    },
    hints: {
      search: ['Code is already selected: 6911100090.'],
      classification: ['Same code as Japan scenario — the classification does not change with origin.'],
      duty: [
        'MFN rate: 12% — same as Japan.',
        'But China attracts an anti-dumping duty of 36.10% (residual rate) on top.',
        'Total effective rate: 12% + 36.1% = 48.1%.',
        'This anti-dumping duty was imposed by the TRA (Trade Remedies Notice 2025/21), expiring 16 July 2029.',
      ],
      origin: [
        'No FTA between UK and China — MFN rate applies.',
        'No proof of origin needed for MFN, but origin must still be declared.',
      ],
      controls: [
        'No additional controls beyond the anti-dumping duty.',
        'VAT: 20% standard rate (same as Japan — VAT does not change with origin).',
      ],
    },
  },

  // ── Scenario 4: Section 3 — Classify Preserves for Export ─────────────────
  {
    id: 's3-preserves-export',
    name: 'S3 — Classify Preserves (Export)',
    section: 3,
    description: 'H&C exports artisan preserves (strawberry jam) to a New York distributor. Classify the product and check for export controls.',
    config: {
      initialMode: 'text',
      compareEnabled: false,
      preSelectedCode: undefined,
      preSelectedCountry: 'US',
      scenarioLabel: 'S3 — Classify Preserves (Export)',
    },
    expectedCode: '2007993325',
    expectedCountry: 'US',
    expectedResult: {
      commodityCode: '2007993325',
      effectiveDutyPercent: 0,
      effectiveDutyDisplay: 'N/A — export (no UK duty on exports)',
      vatPercent: 0,
    },
    hints: {
      search: [
        'Try "jam" or "preserves" — they fall under Chapter 20 (Preparations of fruit).',
        'Heading 2007 covers jams, jellies, marmalades, fruit purée and pastes.',
      ],
      classification: [
        'Strawberry jam: 2007993325 (sugar content <70%, not homogenised).',
        'The sugar content and fruit type determine the 10-digit code.',
        'For export declarations, use the 8-digit code: 20079933.',
      ],
      duty: [
        'No UK duty applies on exports — duty is an import measure only.',
        'If H&C were importing this (not exporting), the MFN duty would be 20% + £19/100 kg (compound duty).',
        'The classification is still needed for the export declaration and trade statistics.',
      ],
      origin: [
        'UK-manufactured products (Swansea plant) are of UK origin.',
        'The US importer may need the UK origin for their own import duty assessment.',
      ],
      controls: [
        'No specific UK export controls for food preserves to the US.',
        'The US importer should check FDA import requirements on their side.',
        'The export is zero-rated for VAT — proof of export required.',
        'Supplementary units: kg/raw sugar (for statistical purposes on the declaration).',
      ],
    },
  },

  // ── Scenario 5: Section 3 — Classify Specialty Tea ────────────────────────
  {
    id: 's3-specialty-tea',
    name: 'S3 — Classify Specialty Tea',
    section: 3,
    description: 'H&C receives specialty tea from India. Classify the product and determine duty rates.',
    config: {
      initialMode: 'text',
      compareEnabled: false,
      preSelectedCode: undefined,
      preSelectedCountry: 'IN',
      scenarioLabel: 'S3 — Classify Specialty Tea',
    },
    expectedCode: '0902300000',
    expectedCountry: 'IN',
    expectedResult: {
      commodityCode: '0902300000',
      effectiveDutyPercent: 0,
      effectiveDutyDisplay: '0.00% (duty-free)',
      vatPercent: 0,
    },
    hints: {
      search: [
        'Search "tea" — Chapter 09 (Coffee, tea, maté and spices).',
        'Black tea in retail packs (≤3 kg): 0902300000.',
      ],
      classification: [
        'Key distinctions: green (unfermented) vs black (fermented), and pack size (≤3 kg vs >3 kg).',
        'H&C\'s specialty tea is black/fermented in retail packs — 0902300000.',
      ],
      duty: [
        'Black tea is MFN duty-free (0%) — the DCTS provides no additional benefit here.',
        'This is unusual — most goods have a positive MFN rate that FTAs/DCTS can reduce.',
        'India qualifies for DCTS Standard Preferences, but the 0% MFN means no duty saving from the scheme on tea.',
      ],
      origin: [
        'India is classified under DCTS Standard Preferences.',
        'For other products from India, the DCTS can provide significant duty reductions.',
        'Proof of origin: GSP Form A or origin declaration.',
      ],
      controls: [
        'No phytosanitary certificate for processed tea from India.',
        'If organic, organic certification (C644) required.',
        'Tea is zero-rated for VAT — declare VATZ on the CDS entry.',
      ],
    },
  },
];

/** Look up an H&C tariff scenario by ID */
export function getScenarioById(id: string): HCTariffScenario | undefined {
  return HC_TARIFF_SCENARIOS.find((s) => s.id === id);
}

/** Look up H&C tariff scenarios by section number */
export function getScenariosBySection(section: number): HCTariffScenario[] {
  return HC_TARIFF_SCENARIOS.filter((s) => s.section === section);
}
