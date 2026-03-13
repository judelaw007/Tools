// T-GIR: GIR Practice Form — Utilities

import type {
  GIRStep,
  StepConfig,
  GeneralInformation,
  EntityEntry,
  EntityClassification,
  ConsolidationMethod,
  SafeHarbourEntry,
  SafeHarbourResult,
  SafeHarbourTestResult,
  JurisdictionComputation,
  JurisdictionResult,
  ChargingMechanism,
  FilingSummary,
  DataPointDefinition,
  SelectOption,
  ValidationError,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** Minimum ETR under GloBE Rules — 15% (Article 5.2.2) */
export const MINIMUM_ETR = 0.15;

/** €750 million consolidated revenue threshold (Article 1.1) */
export const REVENUE_THRESHOLD_EUR = 750_000_000;

/** De minimis revenue threshold — €10 million (Article 5.5.1) */
export const DE_MINIMIS_REVENUE = 10_000_000;

/** De minimis income threshold — €1 million (Article 5.5.1) */
export const DE_MINIMIS_INCOME = 1_000_000;

/** MOCE ownership threshold — below 30% (Article 5.6) */
export const MOCE_THRESHOLD_PERCENT = 30;

/** Standard filing deadline — 15 months after FY end */
export const STANDARD_FILING_MONTHS = 15;

/** First filing deadline — 18 months after FY end */
export const FIRST_FILING_MONTHS = 18;

// ============================================================
// SBIE TRANSITIONAL RATES (Article 9.1)
// ============================================================

export interface SBIERate {
  fiscalYear: number;
  payrollRate: number;
  tangibleAssetRate: number;
}

/**
 * SBIE transitional carve-out rates.
 * Source: OECD Model Rules Article 9.1, Agreed Administrative Guidance.
 * Rates decline from 2024 to steady-state in 2033.
 */
export const SBIE_TRANSITIONAL_RATES: SBIERate[] = [
  { fiscalYear: 2024, payrollRate: 0.098, tangibleAssetRate: 0.078 },
  { fiscalYear: 2025, payrollRate: 0.096, tangibleAssetRate: 0.076 },
  { fiscalYear: 2026, payrollRate: 0.094, tangibleAssetRate: 0.074 },
  { fiscalYear: 2027, payrollRate: 0.092, tangibleAssetRate: 0.072 },
  { fiscalYear: 2028, payrollRate: 0.090, tangibleAssetRate: 0.070 },
  { fiscalYear: 2029, payrollRate: 0.082, tangibleAssetRate: 0.066 },
  { fiscalYear: 2030, payrollRate: 0.074, tangibleAssetRate: 0.062 },
  { fiscalYear: 2031, payrollRate: 0.066, tangibleAssetRate: 0.058 },
  { fiscalYear: 2032, payrollRate: 0.058, tangibleAssetRate: 0.054 },
  { fiscalYear: 2033, payrollRate: 0.050, tangibleAssetRate: 0.050 },
];

/**
 * Get SBIE rates for a given fiscal year.
 * Returns steady-state rates (5%/5%) for years beyond 2033.
 */
export function getSBIERates(fiscalYear: number): SBIERate {
  if (fiscalYear >= 2033) {
    return { fiscalYear, payrollRate: 0.050, tangibleAssetRate: 0.050 };
  }
  return (
    SBIE_TRANSITIONAL_RATES.find((r) => r.fiscalYear === fiscalYear) ??
    SBIE_TRANSITIONAL_RATES[SBIE_TRANSITIONAL_RATES.length - 1]
  );
}

// ============================================================
// SAFE HARBOUR TRANSITION ETR RATES
// ============================================================

export interface TransitionETRRate {
  fiscalYear: number;
  rate: number;
}

/**
 * Transitional CbCR safe harbour simplified ETR rates.
 * Source: OECD AG Chapter 2.
 */
export const SAFE_HARBOUR_TRANSITION_ETR: TransitionETRRate[] = [
  { fiscalYear: 2024, rate: 0.15 },
  { fiscalYear: 2025, rate: 0.16 },
  { fiscalYear: 2026, rate: 0.17 },
];

export function getSafeHarbourETRRate(fiscalYear: number): number {
  const entry = SAFE_HARBOUR_TRANSITION_ETR.find(
    (r) => r.fiscalYear === fiscalYear
  );
  return entry?.rate ?? 0.15;
}

// ============================================================
// STEP CONFIGURATION
// ============================================================

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'GENERAL_INFO',
    label: 'General Information',
    shortLabel: 'General',
    girSection: 'GIR Section 1',
    description: 'MNE Group identification, reporting period, and filing entity details',
  },
  {
    key: 'ENTITY_STRUCTURE',
    label: 'Entity Structure',
    shortLabel: 'Entities',
    girSection: 'GIR Section 1 (contd.)',
    description: 'Constituent Entity register with ownership chains and classifications',
  },
  {
    key: 'SAFE_HARBOURS',
    label: 'Safe Harbours & Exclusions',
    shortLabel: 'Safe Harbours',
    girSection: 'GIR Section 2',
    description: 'Transitional CbCR safe harbour elections and de minimis exclusions',
  },
  {
    key: 'GLOBE_COMPUTATIONS',
    label: 'GloBE Computations',
    shortLabel: 'Computations',
    girSection: 'GIR Section 3',
    description: 'Jurisdictional ETR, SBIE, and top-up tax calculations',
  },
  {
    key: 'FILING_SUMMARY',
    label: 'Filing Summary',
    shortLabel: 'Summary',
    girSection: 'Complete GIR',
    description: 'Validation dashboard, total liability, and filing deadline',
  },
];

export const GIR_STEPS: GIRStep[] = STEP_CONFIGS.map((s) => s.key);

// ============================================================
// EDUCATIONAL NOTES
// ============================================================

export const STEP_EDUCATIONAL_NOTES: Record<GIRStep, string> = {
  GENERAL_INFO:
    'The GloBE Information Return (GIR) is the standardised filing instrument under the OECD Pillar Two framework. Section 1 identifies the MNE Group, the reporting period, and the Designated Filing Entity (DFE). The DFE is typically the UPE but can be designated to another entity under Article 8.1.3. For Stratos\'s first filing year (FY 2025), the filing deadline is 18 months after the fiscal year end (30 June 2027), compared to the standard 15 months for subsequent years.',

  ENTITY_STRUCTURE:
    'Every Constituent Entity (CE) in the MNE Group must be reported in the GIR, including PEs treated as separate CEs under Article 10.1. Each entity requires its legal name, jurisdiction, tax identification number, ownership percentage, and classification. Classifications (UPE, IPE, POPE, MOCE, JV, IE, PE, EE) determine how the entity is treated in subsequent GloBE computations — getting classifications wrong cascades errors through the entire return.',

  SAFE_HARBOURS:
    'The Transitional CbCR Safe Harbour (extended to FY beginning on or before 31 December 2027) allows jurisdictions to be excluded from full GloBE computation if they pass any one of three tests using Country-by-Country Report data: (1) De Minimis — revenue <€10M AND profit <€1M; (2) Simplified ETR — CbCR ETR ≥ transition rate (16% for FY 2025); (3) Routine Profits — CbCR profit ≤ SBIE. If a jurisdiction qualifies, its top-up tax is deemed zero — a significant compliance simplification.',

  GLOBE_COMPUTATIONS:
    'For jurisdictions that do not qualify for safe harbour, the full GloBE computation is required: (1) Calculate GloBE Income from FANI plus Article 3.2 adjustments; (2) Determine Adjusted Covered Taxes from current and deferred tax with Article 4.1–4.4 adjustments; (3) Compute jurisdictional ETR; (4) Calculate SBIE using transitional carve-out rates; (5) Determine excess profit and top-up tax. The charging mechanism (QDMTT → IIR → UTPR) then allocates the collection obligation.',

  FILING_SUMMARY:
    'The Filing Summary consolidates all GIR data into a complete return. Review the validation dashboard to ensure all sections are complete and internally consistent. Key checks: (1) every jurisdiction with CEs has either a safe harbour election or full computation; (2) total top-up tax reconciles across mechanisms; (3) filing deadline is correctly calculated. For Stratos\'s FY 2025, the total liability is allocated between QDMTT (collected domestically in Ireland and Singapore) and IIR (collected by the UK UPE for jurisdictions without QDMTT).',
};

// ============================================================
// DATA POINT DEFINITIONS (68 data points)
// ============================================================

export const DATA_POINTS: Record<string, DataPointDefinition> = {
  // --- Section 1: General Information (16 data points) ---
  'S1.1.1': {
    name: 'MNE Group Name',
    description: 'The name commonly used in the Consolidated Financial Statements of the MNE Group.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — MNE Group definition',
    erpSource: 'Group consolidation system — entity master data',
    commonIssues: 'Must match the name used in CbCR and other international filings. Inconsistent naming across jurisdictions creates matching failures.',
  },
  'S1.1.2': {
    name: 'UPE Legal Name',
    description: 'The legal name of the Ultimate Parent Entity as registered in its jurisdiction of incorporation.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 1.4 — Ultimate Parent Entity',
    erpSource: 'Company registry records / legal entity database',
    commonIssues: 'Must be the exact legal name including suffixes (plc, Ltd, GmbH, etc.). Abbreviations are not acceptable.',
  },
  'S1.1.3': {
    name: 'UPE Jurisdiction',
    description: 'The jurisdiction where the UPE is located for tax purposes (ISO 3166-1 Alpha-2).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 1.4 — UPE location',
    erpSource: 'Legal entity database — registered office jurisdiction',
    commonIssues: 'Dual-resident entities may have ambiguous UPE location. Apply treaty tie-breaker rules.',
  },
  'S1.1.4': {
    name: 'UPE Tax ID',
    description: 'The local tax identification number of the UPE in its jurisdiction of tax residence.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1 — Filing obligations',
    erpSource: 'Tax registration records / HMRC portal',
    commonIssues: 'Format varies by jurisdiction. UK uses UTR (10 digits). Ensure the correct ID type is used.',
  },
  'S1.1.5': {
    name: 'LEI',
    description: 'Legal Entity Identifier — 20-character alphanumeric code from GLEIF system. Optional but recommended.',
    type: 'text',
    required: false,
    calculated: false,
    articleRef: 'GIR XML Schema — optional identifier',
    erpSource: 'LEI registration from Bloomberg, Refinitiv, or GLEIF portal',
    commonIssues: 'LEI must be valid and active (not lapsed). Check renewal status before filing.',
  },
  'S1.2.1': {
    name: 'Fiscal Year Start',
    description: 'The first day of the MNE Group\'s reporting fiscal year.',
    type: 'date',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Fiscal Year definition',
    erpSource: 'Group accounting system — reporting period configuration',
    commonIssues: 'Must align with the Consolidated Financial Statements period. Short periods (acquisitions) need special treatment.',
  },
  'S1.2.2': {
    name: 'Fiscal Year End',
    description: 'The last day of the MNE Group\'s reporting fiscal year.',
    type: 'date',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Fiscal Year definition',
    erpSource: 'Group accounting system — reporting period configuration',
    commonIssues: 'Filing deadline calculated from this date. An incorrect FY end date will produce an incorrect filing deadline.',
  },
  'S1.2.3': {
    name: 'Reporting Currency',
    description: 'The currency used for all monetary amounts in the GIR (ISO 4217).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Presentation currency',
    erpSource: 'Consolidated Financial Statements — presentation currency',
    commonIssues: 'The GIR currency should match the Consolidated Financial Statements currency. All local-currency amounts must be converted using consistent rates.',
  },
  'S1.2.4': {
    name: 'First Filing Year',
    description: 'Whether this is the MNE Group\'s first GIR filing. Affects filing deadline (18 months instead of 15).',
    type: 'boolean',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1.4 — Transitional filing provision',
    erpSource: 'Tax compliance calendar — manual determination',
    commonIssues: 'First filing applies once per group, not per jurisdiction. Groups entering scope in prior years may not qualify.',
  },
  'S1.2.5': {
    name: 'Consolidated Revenue',
    description: 'Total consolidated revenue of the MNE Group for the reporting fiscal year (in reporting currency).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 1.1 — €750M revenue threshold',
    erpSource: 'Consolidated Financial Statements — revenue line',
    commonIssues: 'Must be revenue per CFS, not CbCR. CbCR revenue includes intercompany; CFS revenue does not.',
  },
  'S1.2.6': {
    name: 'Filing Deadline',
    description: 'Calculated filing deadline — 15 months after FY end (18 months for first filing).',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 8.1.4 — Filing deadline',
    erpSource: 'Calculated from FY end date and first filing flag',
    commonIssues: 'The 18-month extension applies only to the first filing year. Subsequent years revert to 15 months.',
  },
  'S1.3.1': {
    name: 'DFE Name',
    description: 'Legal name of the Designated Filing Entity — the entity responsible for filing the GIR.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1.3 — Designated Filing Entity',
    erpSource: 'Group tax function — DFE designation decision',
    commonIssues: 'Typically the UPE unless another entity is designated. DFE designation must be notified to relevant tax authorities.',
  },
  'S1.3.2': {
    name: 'DFE Jurisdiction',
    description: 'Jurisdiction where the DFE is located. Determines primary filing obligation.',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1.3 — DFE location',
    erpSource: 'Legal entity database — DFE registered office',
    commonIssues: 'The DFE jurisdiction must have implemented Pillar Two and have exchange agreements (QCAAs) with other relevant jurisdictions.',
  },
  'S1.3.3': {
    name: 'DFE Tax ID',
    description: 'Local tax identification number of the DFE.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1.3 — DFE identification',
    erpSource: 'Tax registration records in DFE jurisdiction',
    commonIssues: 'If DFE is different from UPE, ensure the correct entity\'s tax ID is used.',
  },
  'S1.3.4': {
    name: 'Filing Type',
    description: 'Whether this is an original filing or an amendment to a previously filed GIR.',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1 — Filing obligations',
    erpSource: 'Tax compliance tracking — filing status',
    commonIssues: 'Amendments may trigger penalty provisions if filed after deadline. Document the reason for amendment.',
  },
  'S1.3.5': {
    name: 'Amendment Reason',
    description: 'Explanation for filing an amended GIR. Required only if Filing Type is AMENDED.',
    type: 'text',
    required: false,
    calculated: false,
    articleRef: 'Art. 8.1 — Amendment provisions',
    erpSource: 'Tax compliance function — amendment justification',
    commonIssues: 'Be specific about what changed and why. Vague reasons may invite further enquiry from tax authorities.',
  },

  // --- Section 2: Entity Structure (14 data points per entity) ---
  'S2.1.1': {
    name: 'Entity Name',
    description: 'Legal name of the Constituent Entity as registered in its jurisdiction.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Constituent Entity',
    erpSource: 'Legal entity master data / company registry',
    commonIssues: 'Must match the exact legal name. Trading names and abbreviations are not acceptable.',
  },
  'S2.1.2': {
    name: 'Entity Internal ID',
    description: 'Internal reference number used by the MNE Group to identify this entity.',
    type: 'text',
    required: false,
    calculated: false,
    articleRef: 'GIR XML Schema — entity identifier',
    erpSource: 'ERP system — company code or entity ID',
    commonIssues: 'Use a consistent numbering scheme across all entities. SAP company codes or Oracle org IDs are typical.',
  },
  'S2.1.3': {
    name: 'Entity Jurisdiction',
    description: 'Jurisdiction where the CE is located for GloBE purposes (ISO 3166-1).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — CE location',
    erpSource: 'Legal entity database — registered office or tax residence',
    commonIssues: 'PEs are located in the PE jurisdiction, not the head office jurisdiction. Flow-through entities may have split locations.',
  },
  'S2.1.4': {
    name: 'Entity Tax ID',
    description: 'Local tax identification number in the CE\'s jurisdiction.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 8.1 — Entity identification',
    erpSource: 'Tax registration records per jurisdiction',
    commonIssues: 'Some entities may have multiple tax IDs (e.g., VAT and CIT). Use the income tax / CIT registration number.',
  },
  'S2.2.1': {
    name: 'Direct Parent',
    description: 'The entity that directly holds the ownership interest in this CE.',
    type: 'text',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Ownership chain',
    erpSource: 'Group consolidation system — ownership structure',
    commonIssues: 'Must reflect the legal ownership chain, not the management reporting line. Intermediate holding companies must be included.',
  },
  'S2.2.2': {
    name: 'Ownership Percentage',
    description: 'Direct ownership percentage held by the parent entity (0–100%).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 2.1 — Ownership Interest',
    erpSource: 'Share register / consolidation system — ownership ledger',
    commonIssues: 'Must be the direct holding percentage, not the effective (indirect) percentage. Effective ownership is calculated through the chain.',
  },
  'S2.2.3': {
    name: 'Effective Ownership',
    description: 'Calculated effective ownership percentage from UPE through the ownership chain.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 2.1.2 — Effective ownership',
    erpSource: 'Calculated from direct ownership chain',
    commonIssues: 'Product of all direct ownership percentages in the chain from UPE to this entity.',
  },
  'S2.3.1': {
    name: 'Entity Classification',
    description: 'GloBE classification determining computational treatment (UPE, IPE, CE, POPE, MOCE, JV, IE, PE, EE).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 1.4, 2.1, 5.6, 6.4, 7.4, 10.1',
    erpSource: 'Group tax function — manual classification based on legal analysis',
    commonIssues: 'Each classification triggers different rules. MOCE (<30% owned), JV (≥50% equity-accounted), PE (branch = separate CE). Misclassification cascades errors.',
  },
  'S2.3.2': {
    name: 'Excluded Entity',
    description: 'Whether this entity qualifies for exclusion under Article 1.5 (Government Entity, International Organisation, NPO, Pension Fund, Investment Fund, REIT).',
    type: 'boolean',
    required: true,
    calculated: false,
    articleRef: 'Art. 1.5 — Excluded Entities',
    erpSource: 'Legal entity classification — manual assessment of exclusion criteria',
    commonIssues: 'Exclusion must be assessed each year. An entity may lose exclusion status if its activities change.',
  },
  'S2.3.3': {
    name: 'Exclusion Reason',
    description: 'The specific Article 1.5 exclusion ground if the entity is excluded.',
    type: 'text',
    required: false,
    calculated: false,
    articleRef: 'Art. 1.5.1–1.5.5 — Exclusion categories',
    erpSource: 'Legal analysis documentation',
    commonIssues: 'Must cite the specific exclusion category. "Pension Fund" is not sufficient — specify the regulatory registration.',
  },
  'S2.3.4': {
    name: 'Consolidation Method',
    description: 'How this entity is consolidated in the group accounts (Full, Proportional, Equity).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 10.1 — Consolidated Financial Statements',
    erpSource: 'Group consolidation system — method per entity',
    commonIssues: 'Equity-method investments below 50% are typically not CEs (excluded from scope). JVs ≥50% are separate MNE Groups.',
  },
  'S2.3.5': {
    name: 'Acquisition Date',
    description: 'Date when entity was acquired (for mid-year entries requiring partial-year treatment under Art. 6.2).',
    type: 'date',
    required: false,
    calculated: false,
    articleRef: 'Art. 6.2 — Acquisitions and disposals',
    erpSource: 'M&A records — completion date per SPA',
    commonIssues: 'Partial-year fraction = days from acquisition to FY end ÷ total FY days. Pre-acquisition income/tax must be excluded.',
  },
  'S2.3.6': {
    name: 'Flow-Through Entity',
    description: 'Whether this entity is a Tax Transparent Entity (TTE) whose income flows through to its owners.',
    type: 'boolean',
    required: true,
    calculated: false,
    articleRef: 'Art. 3.5 — Tax Transparent Entities',
    erpSource: 'Entity classification — tax status in formation jurisdiction',
    commonIssues: 'Flow-through treatment means income is allocated to owners proportionally. The entity itself may have zero covered taxes.',
  },

  // --- Section 3A: Safe Harbour (10 data points per jurisdiction) ---
  'S3A.1': {
    name: 'Safe Harbour Election',
    description: 'Type of safe harbour election for this jurisdiction (None, CbCR Transitional, QDMTT Safe Harbour).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'AG Chapter 2 — Transitional Safe Harbour',
    erpSource: 'Group tax function — election decision',
    commonIssues: 'Once elected for a jurisdiction, the CbCR transitional safe harbour applies for the full transition period. Election is irrevocable.',
  },
  'S3A.2': {
    name: 'CbCR Revenue',
    description: 'Total revenue for this jurisdiction as reported in the Country-by-Country Report (Table 2).',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'AG 2.1 — CbCR data source',
    erpSource: 'CbCR filing — Table 2 revenue per jurisdiction',
    commonIssues: 'CbCR revenue includes intercompany transactions (unlike CFS revenue). Ensure you use CbCR data, not CFS data.',
  },
  'S3A.3': {
    name: 'CbCR Profit Before Tax',
    description: 'Profit (loss) before income tax per jurisdiction from the CbCR Table 2.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'AG 2.1 — CbCR data source',
    erpSource: 'CbCR filing — Table 2 profit before tax',
    commonIssues: 'This is PBT per CbCR methodology, which may differ from GloBE Income. Used for safe harbour tests only.',
  },
  'S3A.4': {
    name: 'CbCR Income Tax Accrued',
    description: 'Income tax accrued (current year) per jurisdiction from the CbCR Table 2.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'AG 2.2 — Simplified ETR test',
    erpSource: 'CbCR filing — Table 2 income tax accrued',
    commonIssues: 'This is current tax only (not deferred). The simplified ETR = tax accrued ÷ PBT.',
  },
  'S3A.5': {
    name: 'CbCR Employees',
    description: 'Number of employees in this jurisdiction per the CbCR Table 2.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'AG 2.3 — Routine Profits test',
    erpSource: 'CbCR filing — Table 2 number of employees',
    commonIssues: 'Employee count methodology should match CbCR definitions (headcount vs FTE varies by jurisdiction).',
  },
  'S3A.6': {
    name: 'CbCR Tangible Assets',
    description: 'Net book value of tangible assets in this jurisdiction per the CbCR Table 2.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'AG 2.3 — Routine Profits test',
    erpSource: 'CbCR filing — Table 2 tangible assets',
    commonIssues: 'Tangible assets per CbCR may differ from SBIE-eligible tangible assets. CbCR includes all fixed assets.',
  },
  'S3A.7': {
    name: 'De Minimis Revenue (3-Year Avg)',
    description: 'Three-year average revenue for the jurisdiction (current + 2 prior years). Used for de minimis test.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 5.5.1 — De minimis exclusion',
    erpSource: 'CbCR data for 3 consecutive years — average calculation',
    commonIssues: 'All 3 years must be available. If the group was not in scope for all 3 years, de minimis may not be testable.',
  },
  'S3A.8': {
    name: 'De Minimis Income (3-Year Avg)',
    description: 'Three-year average GloBE Income (or CbCR profit) for the jurisdiction.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 5.5.1 — De minimis exclusion',
    erpSource: 'GloBE computation or CbCR data for 3 years — average calculation',
    commonIssues: 'Both revenue AND income must be below thresholds (€10M and €1M respectively). Failing either test disqualifies.',
  },
  'S3A.9': {
    name: 'Safe Harbour Test Result',
    description: 'Calculated result of the three safe harbour tests (De Minimis, Simplified ETR, Routine Profits, or Failed).',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'AG Chapter 2 — Three-test framework',
    erpSource: 'Calculated from CbCR data inputs',
    commonIssues: 'Only one test needs to pass for the safe harbour to apply. Test in order: de minimis first (quickest to assess).',
  },
  'S3A.10': {
    name: 'Transition Year',
    description: 'Whether the transition year provisions under Articles 9.1–9.4 apply to this jurisdiction.',
    type: 'boolean',
    required: false,
    calculated: false,
    articleRef: 'Art. 9.1–9.4 — Transition rules',
    erpSource: 'Tax compliance — first year analysis per jurisdiction',
    commonIssues: 'Transition rules may differ by jurisdiction (some implemented Pillar Two in 2024, others in 2025).',
  },

  // --- Section 3B: GloBE Computations (28 data points per jurisdiction) ---
  'S3.1.1': {
    name: 'Jurisdiction',
    description: 'The jurisdiction for which the GloBE computation is performed (all CEs blended).',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 5.1 — Jurisdictional blending',
    erpSource: 'Entity structure — group by jurisdiction',
    commonIssues: 'All CEs in the same jurisdiction are blended for ETR purposes. MOCEs may require separate computation.',
  },
  'S3.1.2': {
    name: 'Number of CEs',
    description: 'Count of Constituent Entities in this jurisdiction (excluding excluded entities).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 5.1 — Jurisdictional blending',
    erpSource: 'Entity register — count per jurisdiction',
    commonIssues: 'PEs count as separate CEs in the PE jurisdiction. Excluded entities are not counted.',
  },
  'S3.2.1': {
    name: 'Financial Accounting Net Income (FANI)',
    description: 'Net income or loss determined under the accounting standard used in the CFS, before adjustments.',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 3.1.1 — Starting point',
    erpSource: 'Consolidation system — entity-level P&L per IFRS/local GAAP',
    commonIssues: 'Must use the same accounting standard as the CFS. Local statutory accounts must be adjusted to group GAAP if different.',
  },
  'S3.2.2': {
    name: 'Net Taxes Excluded',
    description: 'Tax expense included in FANI that must be added back (taxes are handled separately in covered taxes).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 3.2.1(a) — Tax exclusion',
    erpSource: 'P&L — total tax expense (current + deferred)',
    commonIssues: 'Add back ALL income tax expense from FANI. Covered taxes are computed separately in the tax section.',
  },
  'S3.2.3': {
    name: 'Excluded Dividends',
    description: 'Dividends from group entities (≥10% ownership held for ≥12 months) excluded from GloBE Income.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 3.2.1(b) — Excluded dividends',
    erpSource: 'Intercompany register — dividends received from group entities',
    commonIssues: 'Only dividends from entities where the recipient holds ≥10% for ≥12 months qualify. Portfolio dividends are not excluded.',
  },
  'S3.2.4': {
    name: 'Excluded Equity Gains/Losses',
    description: 'Gains and losses on disposal of ownership interests in group entities, excluded from GloBE Income.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 3.2.1(b) — Excluded equity gains',
    erpSource: 'Capital gains records — disposal of subsidiaries / group investments',
    commonIssues: 'Only gains/losses on ownership interests that qualified for the dividend exclusion are themselves excluded.',
  },
  'S3.2.5': {
    name: 'Policy Disallowed Expenses',
    description: 'Expenses disallowed by GloBE policy: fines/penalties >€50K, illegal payments, and similar.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 3.2.1(c) — Policy disallowed expenses',
    erpSource: 'Legal/compliance — penalty and fine register',
    commonIssues: 'Only fines and penalties exceeding €50,000 are disallowed. Smaller amounts remain in GloBE Income.',
  },
  'S3.2.6': {
    name: 'Stock Compensation Adjustment',
    description: 'Adjustment for stock-based compensation — either IFRS 2 expense or tax deduction, depending on election.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 3.2.3 — SBC election',
    erpSource: 'HR/Compensation — IFRS 2 charge vs. tax deduction comparison',
    commonIssues: 'If the SBC election is made, replace IFRS 2 expense with the tax deduction amount. Election is irrevocable once made.',
  },
  'S3.2.7': {
    name: 'Other Adjustments',
    description: 'All other Article 3.2 adjustments: FX on intercompany, prior-year corrections, pension timing, etc.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 3.2.1(d)–(j) — Other mandatory adjustments',
    erpSource: 'Various: FX reports, actuarial valuations, error corrections',
    commonIssues: 'This is a catch-all for remaining adjustments. Each should be documented with its specific Article reference.',
  },
  'S3.2.8': {
    name: 'GloBE Income',
    description: 'Calculated: FANI + Net Taxes + Excluded Dividends + Equity Gains + Disallowed − SBC Adj + Other.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 3.1 — GloBE Income or Loss',
    erpSource: 'Calculated from inputs above',
    commonIssues: 'If GloBE Income is negative (GloBE Loss), no top-up tax arises for this jurisdiction in this year.',
  },
  'S3.3.1': {
    name: 'Current Tax Expense',
    description: 'Current income tax expense for the jurisdiction, after required adjustments.',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 4.1 — Current tax adjustments',
    erpSource: 'Tax provision — current year charge by jurisdiction',
    commonIssues: 'Must include all income tax types (CIT, solidarity surcharge, trade tax). Non-income taxes (VAT, property) are excluded.',
  },
  'S3.3.2': {
    name: 'Deferred Tax Adjustment',
    description: 'Net deferred tax expense adjustment, subject to the 15% DTL cap.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 4.4 — Deferred tax adjustments',
    erpSource: 'Tax provision — deferred tax movement schedule',
    commonIssues: 'DTL movements above 15% must be capped. DTAs can be included at full rate. 5-year recapture applies to capped DTLs.',
  },
  'S3.3.3': {
    name: 'DTL Cap Adjustment',
    description: 'Reduction to deferred tax for DTL amounts recognised at rates above the 15% minimum.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 4.4.4 — 15% DTL cap',
    erpSource: 'Tax provision — DTL analysis by underlying rate',
    commonIssues: 'Only DTLs that would reverse at rates above 15% need capping. Requires analysis of each DTL balance.',
  },
  'S3.3.4': {
    name: 'UTP Adjustment',
    description: 'Adjustment for Uncertain Tax Positions — only settled amounts are included in covered taxes.',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 4.1.3 — UTPs',
    erpSource: 'Tax provision — UTP schedule (IFRIC 23 / FIN 48)',
    commonIssues: 'Outstanding UTPs are excluded from covered taxes. Only amounts paid or refunded in the period are included.',
  },
  'S3.3.5': {
    name: 'Non-Covered Tax Adjustment',
    description: 'Taxes that do not qualify as covered taxes under Article 4.2 (e.g., non-creditable WHT, non-income taxes).',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 4.2 — Excluded taxes',
    erpSource: 'Tax provision — classification of tax types',
    commonIssues: 'Qualified Refundable Tax Credits (QRTCs) are treated as income, not as tax reductions. Non-QRTCs reduce covered taxes.',
  },
  'S3.3.6': {
    name: 'Adjusted Covered Taxes',
    description: 'Calculated: Current Tax + Deferred Tax Adj − DTL Cap − UTP Adj − Non-Covered Adj.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 4.1 — Total Adjusted Covered Taxes',
    erpSource: 'Calculated from inputs above',
    commonIssues: 'Negative adjusted covered taxes are possible (e.g., large refundable credits). This will produce a very low or negative ETR.',
  },
  'S3.4.1': {
    name: 'Eligible Payroll Costs',
    description: 'Employee compensation costs for eligible employees in the jurisdiction (for SBIE payroll carve-out).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 5.3.3 — Eligible payroll costs',
    erpSource: 'HR/Payroll system — total compensation by jurisdiction',
    commonIssues: 'Includes salaries, wages, benefits, employer social security. Excludes SBC expense and pension service costs above funding.',
  },
  'S3.4.2': {
    name: 'Tangible Assets NBV',
    description: 'Net book value of eligible tangible assets in the jurisdiction (for SBIE asset carve-out).',
    type: 'number',
    required: true,
    calculated: false,
    articleRef: 'Art. 5.3.4 — Eligible tangible assets',
    erpSource: 'Fixed asset register — NBV by jurisdiction',
    commonIssues: 'Includes PP&E, natural resources, and right-of-use assets. Excludes intangible assets, goodwill, and financial assets.',
  },
  'S3.4.3': {
    name: 'Total SBIE',
    description: 'Calculated: (Payroll × payroll rate) + (Assets × asset rate) using transitional rates for the fiscal year.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.3 — Substance-Based Income Exclusion',
    erpSource: 'Calculated from payroll, assets, and year-appropriate transitional rates',
    commonIssues: 'SBIE rates are transitional and decline annually. Ensure you use the correct rates for the fiscal year.',
  },
  'S3.5.1': {
    name: 'Jurisdictional ETR',
    description: 'Calculated: Adjusted Covered Taxes ÷ GloBE Income. The core measure under the GloBE Rules.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.1 — ETR formula',
    erpSource: 'Calculated from GloBE Income and Adjusted Covered Taxes',
    commonIssues: 'If GloBE Income ≤ 0, ETR is undefined and no top-up tax arises. ETR is calculated at jurisdictional level (all CEs blended).',
  },
  'S3.5.2': {
    name: 'Top-Up Tax Percentage',
    description: 'Calculated: max(0, 15% − ETR). The percentage applied to excess profit to determine top-up tax.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.2.2 — Top-up tax percentage',
    erpSource: 'Calculated from ETR',
    commonIssues: 'If ETR ≥ 15%, top-up tax percentage is zero. The minimum rate is 15% regardless of jurisdiction.',
  },
  'S3.5.3': {
    name: 'Excess Profit',
    description: 'Calculated: max(0, GloBE Income − Total SBIE). The profit base to which the top-up tax percentage is applied.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.2.3 — Excess profit',
    erpSource: 'Calculated from GloBE Income and SBIE',
    commonIssues: 'SBIE reduces the profit base — jurisdictions with high substance (payroll + assets) will have lower excess profit.',
  },
  'S3.5.4': {
    name: 'Gross Top-Up Tax',
    description: 'Calculated: Excess Profit × Top-Up Tax Percentage. The top-up tax before QDMTT offset.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.2 — Top-up tax computation',
    erpSource: 'Calculated from excess profit and top-up tax percentage',
    commonIssues: 'This is the gross amount before any QDMTT offset. The net top-up tax may be lower if the jurisdiction has QDMTT.',
  },
  'S3.5.5': {
    name: 'QDMTT Amount',
    description: 'Qualified Domestic Minimum Top-Up Tax collected by the jurisdiction domestically (offsets IIR/UTPR).',
    type: 'number',
    required: false,
    calculated: false,
    articleRef: 'Art. 5.2.3 — QDMTT priority',
    erpSource: 'Local tax filings — QDMTT return or assessment',
    commonIssues: 'QDMTT takes priority over IIR and UTPR. If QDMTT equals gross top-up tax, IIR liability is zero.',
  },
  'S3.5.6': {
    name: 'Net Top-Up Tax',
    description: 'Calculated: max(0, Gross Top-Up Tax − QDMTT). The net amount to be collected via IIR or UTPR.',
    type: 'calculated',
    required: false,
    calculated: true,
    articleRef: 'Art. 5.2 — Net top-up tax',
    erpSource: 'Calculated from gross top-up tax and QDMTT',
    commonIssues: 'If QDMTT fully covers the gross top-up tax, net top-up tax is zero and no IIR/UTPR liability arises.',
  },
  'S3.5.7': {
    name: 'Charging Mechanism',
    description: 'The primary mechanism through which the top-up tax for this jurisdiction is collected.',
    type: 'select',
    required: true,
    calculated: false,
    articleRef: 'Art. 2.1–2.6 — Charging provisions',
    erpSource: 'Group tax function — mechanism determination based on jurisdiction implementation status',
    commonIssues: 'Ordering: QDMTT first, then IIR (through ownership chain), then UTPR (backstop). Most jurisdictions with QDMTT will show zero IIR.',
  },
};

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

export const CURRENCIES: SelectOption[] = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
];

export const ENTITY_CLASSIFICATION_OPTIONS: SelectOption[] = [
  { value: 'UPE', label: 'UPE — Ultimate Parent Entity (Art. 1.4)' },
  { value: 'IPE', label: 'IPE — Intermediate Parent Entity (Art. 2.1.2)' },
  { value: 'CE', label: 'CE — Constituent Entity (Art. 10.1)' },
  { value: 'POPE', label: 'POPE — Partially-Owned Parent Entity (Art. 10.1)' },
  { value: 'MOCE', label: 'MOCE — Minority-Owned CE (<30%, Art. 5.6)' },
  { value: 'JV', label: 'JV — Joint Venture (≥50% equity, Art. 6.4)' },
  { value: 'IE', label: 'IE — Investment Entity (Art. 7.4)' },
  { value: 'PE', label: 'PE — Permanent Establishment (Art. 10.1)' },
  { value: 'EE', label: 'EE — Excluded Entity (Art. 1.5)' },
];

export const CONSOLIDATION_METHOD_OPTIONS: SelectOption[] = [
  { value: 'FULL', label: 'Full consolidation' },
  { value: 'PROPORTIONAL', label: 'Proportional consolidation' },
  { value: 'EQUITY', label: 'Equity method' },
];

export const FILING_TYPE_OPTIONS: SelectOption[] = [
  { value: 'ORIGINAL', label: 'Original filing' },
  { value: 'AMENDED', label: 'Amended filing' },
];

export const SAFE_HARBOUR_ELECTION_OPTIONS: SelectOption[] = [
  { value: 'NONE', label: 'No safe harbour election' },
  { value: 'CBCR_TRANSITIONAL', label: 'CbCR Transitional Safe Harbour' },
  { value: 'QDMTT_SAFE_HARBOUR', label: 'QDMTT Safe Harbour' },
];

export const CHARGING_MECHANISM_OPTIONS: SelectOption[] = [
  { value: 'QDMTT', label: 'QDMTT — Domestic collection' },
  { value: 'IIR', label: 'IIR — Income Inclusion Rule' },
  { value: 'UTPR', label: 'UTPR — Undertaxed Profits Rule' },
  { value: 'SAFE_HARBOUR', label: 'Safe Harbour — No computation' },
  { value: 'DE_MINIMIS', label: 'De Minimis — Excluded' },
  { value: 'ABOVE_MINIMUM', label: 'Above 15% — No top-up' },
];

// ============================================================
// INITIAL STATE FACTORIES
// ============================================================

export const INITIAL_GENERAL_INFO: GeneralInformation = {
  mneGroupName: '',
  upeLegalName: '',
  upeJurisdiction: '',
  upeTaxId: '',
  lei: '',
  fiscalYearStart: '',
  fiscalYearEnd: '',
  reportingCurrency: 'EUR',
  isFirstFiling: true,
  consolidatedRevenue: 0,
  yearsExceedingThreshold: 0,
  dfeName: '',
  dfeJurisdiction: '',
  dfeTaxId: '',
  filingType: 'ORIGINAL',
  amendmentReason: '',
};

export const INITIAL_ENTITY: Omit<EntityEntry, 'id'> = {
  entityName: '',
  internalId: '',
  jurisdiction: '',
  taxId: '',
  directParentId: '',
  ownershipPercent: 100,
  classification: 'CE',
  isExcluded: false,
  exclusionReason: '',
  consolidationMethod: 'FULL',
  isPE: false,
  isFlowThrough: false,
  acquisitionDate: '',
  notes: '',
};

export const INITIAL_SAFE_HARBOUR: Omit<SafeHarbourEntry, 'id'> = {
  jurisdiction: '',
  electionType: 'NONE',
  cbcrRevenue: 0,
  cbcrPBT: 0,
  cbcrTaxAccrued: 0,
  cbcrEmployees: 0,
  cbcrTangibleAssets: 0,
  isDeMinimisEligible: false,
  deMinimisRevenue3YrAvg: 0,
  deMinimisIncome3YrAvg: 0,
  isTransitionYear: false,
  notes: '',
};

export const INITIAL_JURISDICTION_COMPUTATION: Omit<JurisdictionComputation, 'id'> = {
  jurisdiction: '',
  label: '',
  ceCount: 0,
  fani: 0,
  netTaxesExcluded: 0,
  excludedDividends: 0,
  excludedEquityGains: 0,
  policyDisallowed: 0,
  stockCompAdj: 0,
  otherAdjustments: 0,
  currentTaxExpense: 0,
  deferredTaxAdj: 0,
  dtlCapAdj: 0,
  utpAdj: 0,
  nonCoveredTaxAdj: 0,
  eligiblePayroll: 0,
  tangibleAssetsNBV: 0,
  qdmmtAmount: 0,
  safeHarbourApplied: false,
  deMinimisApplied: false,
  isMOCE: false,
  moceOwnershipPercent: 0,
  chargingMechanism: 'NONE',
};

// ============================================================
// PURE FUNCTIONS — ID Generation
// ============================================================

export function generateId(prefix: string = 'ID'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

// ============================================================
// PURE FUNCTIONS — Filing Deadline
// ============================================================

/**
 * Calculate the GIR filing deadline from the fiscal year end date.
 * Standard: 15 months after FY end.
 * First filing: 18 months after FY end.
 */
export function calculateFilingDeadline(
  fiscalYearEnd: string,
  isFirstFiling: boolean
): { deadline: string; daysRemaining: number } {
  if (!fiscalYearEnd) return { deadline: '', daysRemaining: 0 };

  const fyEnd = new Date(fiscalYearEnd);
  if (isNaN(fyEnd.getTime())) return { deadline: '', daysRemaining: 0 };

  const months = isFirstFiling ? FIRST_FILING_MONTHS : STANDARD_FILING_MONTHS;
  const deadline = new Date(fyEnd);
  deadline.setMonth(deadline.getMonth() + months);

  const today = new Date();
  const diffMs = deadline.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    deadline: deadline.toISOString().split('T')[0],
    daysRemaining,
  };
}

// ============================================================
// PURE FUNCTIONS — Fiscal Year Extraction
// ============================================================

export function getFiscalYear(fiscalYearEnd: string): number {
  if (!fiscalYearEnd) return 2025;
  const date = new Date(fiscalYearEnd);
  return isNaN(date.getTime()) ? 2025 : date.getFullYear();
}

// ============================================================
// PURE FUNCTIONS — Safe Harbour Assessment
// ============================================================

/**
 * Assess the three transitional CbCR safe harbour tests for a jurisdiction.
 */
export function assessSafeHarbour(
  entry: SafeHarbourEntry,
  fiscalYear: number
): SafeHarbourResult {
  const result: SafeHarbourResult = {
    jurisdiction: entry.jurisdiction,
    deMinimisPass: false,
    simplifiedETR: 0,
    simplifiedETRPass: false,
    routineProfitsSBIE: 0,
    routineProfitsPass: false,
    overallResult: 'NOT_TESTED',
    qualifies: false,
    reason: '',
  };

  if (entry.electionType === 'NONE') {
    result.overallResult = 'NOT_TESTED';
    result.reason = 'No safe harbour election made';
    return result;
  }

  // Test 1: De Minimis
  if (entry.isDeMinimisEligible) {
    const revPass = entry.deMinimisRevenue3YrAvg < DE_MINIMIS_REVENUE;
    const incPass = entry.deMinimisIncome3YrAvg < DE_MINIMIS_INCOME;
    result.deMinimisPass = revPass && incPass;
    if (result.deMinimisPass) {
      result.overallResult = 'DE_MINIMIS';
      result.qualifies = true;
      result.reason = `De minimis: avg revenue €${formatNumber(entry.deMinimisRevenue3YrAvg)} (<€10M) and avg income €${formatNumber(entry.deMinimisIncome3YrAvg)} (<€1M)`;
      return result;
    }
  }

  // Test 2: Simplified ETR
  if (entry.cbcrPBT > 0) {
    result.simplifiedETR = entry.cbcrTaxAccrued / entry.cbcrPBT;
    const transitionRate = getSafeHarbourETRRate(fiscalYear);
    result.simplifiedETRPass = result.simplifiedETR >= transitionRate;
    if (result.simplifiedETRPass) {
      result.overallResult = 'SIMPLIFIED_ETR';
      result.qualifies = true;
      result.reason = `Simplified ETR ${formatPercentage(result.simplifiedETR)} ≥ ${formatPercentage(transitionRate)} transition rate`;
      return result;
    }
  }

  // Test 3: Routine Profits
  const sbieRates = getSBIERates(fiscalYear);
  const payrollSBIE = entry.cbcrTangibleAssets * sbieRates.tangibleAssetRate;
  const empSBIE = entry.cbcrEmployees > 0
    ? (entry.cbcrPBT > 0 ? entry.cbcrPBT : 0) // Simplified: compare PBT to SBIE
    : 0;
  // For CbCR safe harbour, routine profits test: PBT ≤ SBIE
  // SBIE uses CbCR tangible assets and a simplified payroll proxy
  // In practice, this uses the same SBIE formula but with CbCR data
  result.routineProfitsSBIE = payrollSBIE; // Simplified for this tool
  result.routineProfitsPass = entry.cbcrPBT > 0 && entry.cbcrPBT <= result.routineProfitsSBIE;

  if (result.routineProfitsPass) {
    result.overallResult = 'ROUTINE_PROFITS';
    result.qualifies = true;
    result.reason = `Routine profits: CbCR PBT €${formatNumber(entry.cbcrPBT)} ≤ SBIE €${formatNumber(result.routineProfitsSBIE)}`;
    return result;
  }

  result.overallResult = 'FAILED';
  result.qualifies = false;
  result.reason = 'Failed all three safe harbour tests — full GloBE computation required';
  return result;
}

// ============================================================
// PURE FUNCTIONS — GloBE Computation
// ============================================================

/**
 * Calculate jurisdictional GloBE results from computation inputs.
 */
export function calculateJurisdiction(
  comp: JurisdictionComputation,
  fiscalYear: number
): JurisdictionResult {
  // GloBE Income
  const globeIncome =
    comp.fani +
    comp.netTaxesExcluded -
    comp.excludedDividends -
    comp.excludedEquityGains +
    comp.policyDisallowed -
    comp.stockCompAdj +
    comp.otherAdjustments;

  // Adjusted Covered Taxes
  const adjustedCoveredTaxes =
    comp.currentTaxExpense +
    comp.deferredTaxAdj -
    comp.dtlCapAdj -
    comp.utpAdj -
    comp.nonCoveredTaxAdj;

  // ETR
  const etr = globeIncome > 0 ? adjustedCoveredTaxes / globeIncome : 0;
  const isBelowMinimum = etr < MINIMUM_ETR && globeIncome > 0;

  // SBIE
  const sbieRates = getSBIERates(fiscalYear);
  const payrollSBIE = roundTo2(comp.eligiblePayroll * sbieRates.payrollRate);
  const assetSBIE = roundTo2(comp.tangibleAssetsNBV * sbieRates.tangibleAssetRate);
  const totalSBIE = roundTo2(payrollSBIE + assetSBIE);

  // Top-Up Tax
  const excessProfit = Math.max(0, roundTo2(globeIncome - totalSBIE));
  const topUpTaxPercent = Math.max(0, roundTo2(MINIMUM_ETR - etr));
  const grossTopUpTax = roundTo2(excessProfit * topUpTaxPercent);
  const qdmmtOffset = Math.min(comp.qdmmtAmount, grossTopUpTax);
  const netTopUpTax = Math.max(0, roundTo2(grossTopUpTax - qdmmtOffset));

  // Determine charging mechanism
  let chargingMechanism: ChargingMechanism = comp.chargingMechanism;
  if (comp.safeHarbourApplied) chargingMechanism = 'SAFE_HARBOUR';
  else if (comp.deMinimisApplied) chargingMechanism = 'DE_MINIMIS';
  else if (!isBelowMinimum) chargingMechanism = 'ABOVE_MINIMUM';

  return {
    jurisdiction: comp.jurisdiction,
    label: comp.label || comp.jurisdiction,
    globeIncome: roundTo2(globeIncome),
    adjustedCoveredTaxes: roundTo2(adjustedCoveredTaxes),
    etr: roundTo4(etr),
    payrollSBIE,
    assetSBIE,
    totalSBIE,
    excessProfit,
    topUpTaxPercent: roundTo4(topUpTaxPercent),
    grossTopUpTax,
    qdmmtOffset,
    netTopUpTax,
    isBelowMinimum,
    chargingMechanism,
    safeHarbourApplied: comp.safeHarbourApplied,
    deMinimisApplied: comp.deMinimisApplied,
  };
}

/**
 * Calculate the complete filing summary from all computation data.
 */
export function calculateFilingSummary(
  generalInfo: GeneralInformation,
  entities: EntityEntry[],
  computations: JurisdictionComputation[]
): FilingSummary {
  const fiscalYear = getFiscalYear(generalInfo.fiscalYearEnd);
  const results = computations.map((c) => calculateJurisdiction(c, fiscalYear));

  const { deadline, daysRemaining } = calculateFilingDeadline(
    generalInfo.fiscalYearEnd,
    generalInfo.isFirstFiling
  );

  const totalGross = results.reduce((sum, r) => sum + r.grossTopUpTax, 0);
  const totalQDMTT = results.reduce((sum, r) => sum + r.qdmmtOffset, 0);
  const totalIIR = results
    .filter((r) => r.chargingMechanism === 'IIR' || r.chargingMechanism === 'QDMTT')
    .reduce((sum, r) => sum + r.netTopUpTax, 0);
  const totalNet = results.reduce((sum, r) => sum + r.grossTopUpTax, 0);

  return {
    totalJurisdictions: computations.length,
    totalCEs: entities.filter((e) => !e.isExcluded).length,
    excludedEntities: entities.filter((e) => e.isExcluded).length,
    safeHarbourCount: computations.filter((c) => c.safeHarbourApplied).length,
    deMinimisCount: computations.filter((c) => c.deMinimisApplied).length,
    aboveMinimumCount: results.filter(
      (r) => !r.isBelowMinimum && !r.safeHarbourApplied && !r.deMinimisApplied
    ).length,
    requiresComputationCount: results.filter(
      (r) => r.isBelowMinimum && !r.safeHarbourApplied && !r.deMinimisApplied
    ).length,
    totalGrossTopUpTax: roundTo2(totalGross),
    totalQDMTT: roundTo2(totalQDMTT),
    totalIIR: roundTo2(totalIIR),
    totalNetTopUpTax: roundTo2(totalNet - totalQDMTT),
    filingDeadline: deadline,
    filingDeadlineDays: daysRemaining,
    jurisdictionResults: results,
  };
}

// ============================================================
// VALIDATION
// ============================================================

export function validateGeneralInfo(
  info: GeneralInformation
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!info.mneGroupName.trim())
    errors.push({ field: 'S1.1.1', message: 'MNE Group name is required' });
  if (!info.upeLegalName.trim())
    errors.push({ field: 'S1.1.2', message: 'UPE legal name is required' });
  if (!info.upeJurisdiction)
    errors.push({ field: 'S1.1.3', message: 'UPE jurisdiction is required' });
  if (!info.upeTaxId.trim())
    errors.push({ field: 'S1.1.4', message: 'UPE tax ID is required' });
  if (!info.fiscalYearStart)
    errors.push({ field: 'S1.2.1', message: 'Fiscal year start is required' });
  if (!info.fiscalYearEnd)
    errors.push({ field: 'S1.2.2', message: 'Fiscal year end is required' });
  if (!info.reportingCurrency)
    errors.push({ field: 'S1.2.3', message: 'Reporting currency is required' });
  if (info.consolidatedRevenue <= 0)
    errors.push({ field: 'S1.2.5', message: 'Consolidated revenue must be positive' });
  if (!info.dfeName.trim())
    errors.push({ field: 'S1.3.1', message: 'DFE name is required' });
  if (!info.dfeJurisdiction)
    errors.push({ field: 'S1.3.2', message: 'DFE jurisdiction is required' });
  if (info.filingType === 'AMENDED' && !info.amendmentReason.trim())
    errors.push({ field: 'S1.3.5', message: 'Amendment reason is required for amended filings' });

  return errors;
}

export function validateEntities(
  entities: EntityEntry[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (entities.length === 0) {
    errors.push({ field: 'entities', message: 'At least one entity must be added' });
    return errors;
  }

  const upeCount = entities.filter((e) => e.classification === 'UPE').length;
  if (upeCount === 0)
    errors.push({ field: 'upe', message: 'One entity must be classified as UPE' });
  if (upeCount > 1)
    errors.push({ field: 'upe', message: 'Only one UPE is permitted' });

  entities.forEach((e) => {
    if (!e.entityName.trim())
      errors.push({ field: `entity_name_${e.id}`, message: `Entity name is required` });
    if (!e.jurisdiction)
      errors.push({ field: `entity_jur_${e.id}`, message: `${e.entityName || 'Entity'}: jurisdiction is required` });
    if (e.ownershipPercent < 0 || e.ownershipPercent > 100)
      errors.push({ field: `entity_own_${e.id}`, message: `${e.entityName || 'Entity'}: ownership must be 0–100%` });
    if (e.classification !== 'UPE' && !e.directParentId)
      errors.push({ field: `entity_parent_${e.id}`, message: `${e.entityName || 'Entity'}: non-UPE entities must have a parent` });
  });

  return errors;
}

export function validateComputations(
  computations: JurisdictionComputation[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  computations.forEach((c) => {
    if (!c.jurisdiction)
      errors.push({ field: `comp_jur_${c.id}`, message: 'Jurisdiction is required' });
    if (c.fani === 0 && !c.safeHarbourApplied && !c.deMinimisApplied)
      errors.push({ field: `comp_fani_${c.id}`, message: `${c.jurisdiction}: FANI should not be zero for active jurisdictions` });
  });

  return errors;
}

// ============================================================
// UTILITY HELPERS
// ============================================================

export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundTo4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function formatEUR(amount: number): string {
  return `€${Math.round(amount).toLocaleString('en-GB')}`;
}

export function formatNumber(amount: number): string {
  return Math.round(amount).toLocaleString('en-GB');
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getOptionLabel(
  options: SelectOption[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// ============================================================
// H&C TEST SCENARIO — Stratos Group (FY 2025 Post-Acquisition)
// ============================================================

export const CASE_STUDY_GROUP_NAME = 'Stratos Holdings plc';

/** Section 1: General Information */
export const CASE_STUDY_GENERAL_INFO: GeneralInformation = {
  mneGroupName: 'Stratos Group',
  upeLegalName: 'Stratos Holdings plc',
  upeJurisdiction: 'United Kingdom',
  upeTaxId: 'GB123456789',
  lei: '5299001ABCDEF123GH45',
  fiscalYearStart: '2025-01-01',
  fiscalYearEnd: '2025-12-31',
  reportingCurrency: 'EUR',
  isFirstFiling: true,
  consolidatedRevenue: 938_600_000,
  yearsExceedingThreshold: 3,
  dfeName: 'Stratos Holdings plc',
  dfeJurisdiction: 'United Kingdom',
  dfeTaxId: 'GB123456789',
  filingType: 'ORIGINAL',
  amendmentReason: '',
};

/** Section 2: Entity Structure (Combined Group Post-Acquisition) */
export const CASE_STUDY_ENTITIES: EntityEntry[] = [
  // --- Core Stratos Group ---
  {
    id: 'gir-001', entityName: 'Stratos Holdings plc', internalId: 'SH001',
    jurisdiction: 'United Kingdom', taxId: 'GB123456789', directParentId: '',
    ownershipPercent: 100, classification: 'UPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'UK-listed UPE. Designated Filing Entity. London Stock Exchange.',
  },
  {
    id: 'gir-002', entityName: 'SG Holdings Ltd', internalId: 'SH002',
    jurisdiction: 'United Kingdom', taxId: 'GB234567890', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Intermediate holding for European and Asian sub-groups.',
  },
  {
    id: 'gir-003', entityName: 'SG Germany GmbH', internalId: 'SH003',
    jurisdiction: 'Germany', taxId: 'DE987654321', directParentId: 'gir-002',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Primary EU operations. CIT + solidarity + trade tax.',
  },
  {
    id: 'gir-004', entityName: 'SG Germany Sales GmbH', internalId: 'SH004',
    jurisdiction: 'Germany', taxId: 'DE876543210', directParentId: 'gir-003',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Sales arm under SG Germany GmbH.',
  },
  {
    id: 'gir-005', entityName: 'SG France SAS', internalId: 'SH005',
    jurisdiction: 'France', taxId: 'FR12345678901', directParentId: 'gir-002',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'French operations. Has Belgium PE.',
  },
  {
    id: 'gir-006', entityName: 'Belgium PE (of SG France SAS)', internalId: 'SH006',
    jurisdiction: 'Belgium', taxId: 'BE0123456789', directParentId: 'gir-005',
    ownershipPercent: 100, classification: 'PE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: true,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Branch of SG France — treated as separate CE under Art. 10.1.',
  },
  {
    id: 'gir-007', entityName: 'SG Netherlands BV', internalId: 'SH007',
    jurisdiction: 'Netherlands', taxId: 'NL123456789B01', directParentId: 'gir-002',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Intermediate holding for Ireland and Singapore sub-groups.',
  },
  {
    id: 'gir-008', entityName: 'SG Ireland Ltd', internalId: 'SH008',
    jurisdiction: 'Ireland', taxId: 'IE1234567T', directParentId: 'gir-007',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'European HQ. Ireland has QDMTT but no IIR.',
  },
  {
    id: 'gir-009', entityName: 'SG Ireland IP Ltd', internalId: 'SH009',
    jurisdiction: 'Ireland', taxId: 'IE2345678T', directParentId: 'gir-008',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'IP holding entity — contributes to Ireland jurisdictional ETR.',
  },
  {
    id: 'gir-010', entityName: 'SG Singapore Pte Ltd', internalId: 'SH010',
    jurisdiction: 'Singapore', taxId: 'SG12345678X', directParentId: 'gir-007',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Regional HQ. Singapore has QDMTT from 1 Jan 2025.',
  },
  {
    id: 'gir-011', entityName: 'SG Singapore Tech Pte Ltd', internalId: 'SH011',
    jurisdiction: 'Singapore', taxId: 'SG23456789X', directParentId: 'gir-010',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'R&D centre — contributes to Singapore jurisdictional ETR.',
  },
  {
    id: 'gir-012', entityName: 'SG Hong Kong Ltd', internalId: 'SH012',
    jurisdiction: 'Hong Kong', taxId: 'HK12345678', directParentId: 'gir-010',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Hong Kong operations.',
  },
  {
    id: 'gir-013', entityName: 'SG US Holdings Inc', internalId: 'SH013',
    jurisdiction: 'United States', taxId: 'US-12-3456789', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'US holding company (Delaware).',
  },
  {
    id: 'gir-014', entityName: 'SG US Operating Inc', internalId: 'SH014',
    jurisdiction: 'United States', taxId: 'US-12-3456790', directParentId: 'gir-013',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'US operations (California branch).',
  },
  {
    id: 'gir-015', entityName: 'SG US Services Inc', internalId: 'SH015',
    jurisdiction: 'United States', taxId: 'US-12-3456791', directParentId: 'gir-013',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'US services entity.',
  },
  {
    id: 'gir-016', entityName: 'SG Australia Pty Ltd', internalId: 'SH016',
    jurisdiction: 'Australia', taxId: 'AU12345678901', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Australian operations.',
  },
  {
    id: 'gir-017', entityName: 'SG Japan KK', internalId: 'SH017',
    jurisdiction: 'Japan', taxId: 'JP1234567890123', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Japanese operations.',
  },
  {
    id: 'gir-018', entityName: 'SG Luxembourg S.à r.l.', internalId: 'SH018',
    jurisdiction: 'Luxembourg', taxId: 'LU12345678', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Treasury services — qualifies for de minimis exclusion.',
  },
  {
    id: 'gir-019', entityName: 'Atlas Ireland Ltd', internalId: 'SH019',
    jurisdiction: 'Ireland', taxId: 'IE7654321T', directParentId: 'gir-001',
    ownershipPercent: 28, classification: 'MOCE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: '28% ownership — MOCE under Art. 5.6. Control via management contract.',
  },
  {
    id: 'gir-020', entityName: 'SG Pension Trustees Ltd', internalId: 'SH020',
    jurisdiction: 'United Kingdom', taxId: 'GB345678901', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'EE', isExcluded: true,
    exclusionReason: 'Pension Fund — Art. 1.5.3',
    consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Excluded Entity: occupational pension fund under regulatory supervision.',
  },
  {
    id: 'gir-021', entityName: 'Stratos Foundation', internalId: 'SH021',
    jurisdiction: 'United Kingdom', taxId: 'GB456789012', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'EE', isExcluded: true,
    exclusionReason: 'Non-Profit Organisation — Art. 1.5.2',
    consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '',
    notes: 'Excluded Entity: registered charity (No. 123456).',
  },
  // --- TechStart Acquisition (1 July 2025) ---
  {
    id: 'gir-022', entityName: 'TechStart Inc.', internalId: 'TS001',
    jurisdiction: 'United States', taxId: 'US-98-7654321', directParentId: 'gir-001',
    ownershipPercent: 100, classification: 'IPE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '2025-07-01',
    notes: 'Acquired 1 July 2025 for €450M. Partial-year: 184/365 = 50.41%.',
  },
  {
    id: 'gir-023', entityName: 'TechStart UK Ltd', internalId: 'TS002',
    jurisdiction: 'United Kingdom', taxId: 'GB567890123', directParentId: 'gir-022',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '2025-07-01',
    notes: 'UK subsidiary of TechStart — blends with Stratos UK entities.',
  },
  {
    id: 'gir-024', entityName: 'TechStart GmbH', internalId: 'TS003',
    jurisdiction: 'Germany', taxId: 'DE765432109', directParentId: 'gir-022',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '2025-07-01',
    notes: 'German subsidiary — blends with SG Germany entities.',
  },
  {
    id: 'gir-025', entityName: 'TechStart JV Pte Ltd', internalId: 'TS004',
    jurisdiction: 'Singapore', taxId: 'SG87654321X', directParentId: 'gir-022',
    ownershipPercent: 55, classification: 'JV', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'EQUITY', isPE: false,
    isFlowThrough: false, acquisitionDate: '2025-07-01',
    notes: '55% JV — treated as separate MNE Group under Art. 6.4.',
  },
  {
    id: 'gir-026', entityName: 'TechStart IP LLC', internalId: 'TS005',
    jurisdiction: 'United States', taxId: 'US-98-7654322', directParentId: 'gir-022',
    ownershipPercent: 80, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: true, acquisitionDate: '2025-07-01',
    notes: 'Tax Transparent Entity. 80% Stratos / 20% external LPs. Flow-through under Art. 3.5.',
  },
  {
    id: 'gir-027', entityName: 'TechStart Ventures Fund', internalId: 'TS006',
    jurisdiction: 'Cayman Islands', taxId: 'KY-EXEMPT-001', directParentId: 'gir-022',
    ownershipPercent: 100, classification: 'CE', isExcluded: false,
    exclusionReason: '', consolidationMethod: 'FULL', isPE: false,
    isFlowThrough: false, acquisitionDate: '2025-07-01',
    notes: 'Standard CE — failed Investment Entity test (Art. 10.1). 100% owned, no external capital pooling.',
  },
];

/** Section 3A: Safe Harbour Entries */
export const CASE_STUDY_SAFE_HARBOURS: SafeHarbourEntry[] = [
  {
    id: 'sh-de', jurisdiction: 'Germany', electionType: 'CBCR_TRANSITIONAL',
    cbcrRevenue: 285_000_000, cbcrPBT: 58_000_000, cbcrTaxAccrued: 13_500_000,
    cbcrEmployees: 1200, cbcrTangibleAssets: 42_000_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: false,
    notes: 'Passes simplified ETR test: 23.28% ≥ 16%',
  },
  {
    id: 'sh-lu', jurisdiction: 'Luxembourg', electionType: 'CBCR_TRANSITIONAL',
    cbcrRevenue: 9_200_000, cbcrPBT: 630_000, cbcrTaxAccrued: 157_500,
    cbcrEmployees: 10, cbcrTangibleAssets: 180_000,
    isDeMinimisEligible: true, deMinimisRevenue3YrAvg: 8_500_000, deMinimisIncome3YrAvg: 620_000,
    isTransitionYear: false,
    notes: 'Passes de minimis: avg revenue €8.5M (<€10M), avg income €620K (<€1M)',
  },
  {
    id: 'sh-us', jurisdiction: 'United States', electionType: 'CBCR_TRANSITIONAL',
    cbcrRevenue: 90_000_000, cbcrPBT: 12_300_000, cbcrTaxAccrued: 2_595_930,
    cbcrEmployees: 380, cbcrTangibleAssets: 8_200_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: false,
    notes: 'Passes simplified ETR test: 21.11% ≥ 16%',
  },
  {
    id: 'sh-uk', jurisdiction: 'United Kingdom', electionType: 'NONE',
    cbcrRevenue: 125_000_000, cbcrPBT: 12_000_000, cbcrTaxAccrued: 2_950_000,
    cbcrEmployees: 450, cbcrTangibleAssets: 18_000_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: false,
    notes: 'No safe harbour needed — ETR 25% is above 15% minimum',
  },
  {
    id: 'sh-ie', jurisdiction: 'Ireland', electionType: 'NONE',
    cbcrRevenue: 85_000_000, cbcrPBT: 15_200_000, cbcrTaxAccrued: 1_805_000,
    cbcrEmployees: 285, cbcrTangibleAssets: 12_800_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: false,
    notes: 'Below 15% — QDMTT applies. Full computation required.',
  },
  {
    id: 'sh-sg', jurisdiction: 'Singapore', electionType: 'NONE',
    cbcrRevenue: 45_000_000, cbcrPBT: 4_200_000, cbcrTaxAccrued: 400_000,
    cbcrEmployees: 85, cbcrTangibleAssets: 3_500_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: false,
    notes: 'Below 15% — QDMTT applies from 1 Jan 2025. Full computation required.',
  },
  {
    id: 'sh-ky', jurisdiction: 'Cayman Islands', electionType: 'NONE',
    cbcrRevenue: 5_000_000, cbcrPBT: 2_016_000, cbcrTaxAccrued: 20_200,
    cbcrEmployees: 8, cbcrTangibleAssets: 50_000,
    isDeMinimisEligible: false, deMinimisRevenue3YrAvg: 0, deMinimisIncome3YrAvg: 0,
    isTransitionYear: true,
    notes: 'Below 15% — no QDMTT. Top-up collected via IIR by UK UPE.',
  },
];

/** Section 3B: GloBE Computations (Non-Safe-Harboured Jurisdictions) */
export const CASE_STUDY_COMPUTATIONS: JurisdictionComputation[] = [
  // UK — Above 15%, no top-up
  {
    id: 'gc-uk', jurisdiction: 'United Kingdom', label: 'United Kingdom (Combined)',
    ceCount: 4,
    fani: 8_800_000, netTaxesExcluded: 2_881_200, excludedDividends: 156_000,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0, otherAdjustments: 0,
    currentTaxExpense: 2_881_200, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 7_400_000, tangibleAssetsNBV: 4_600_000,
    qdmmtAmount: 0,
    safeHarbourApplied: false, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'ABOVE_MINIMUM',
  },
  // Germany — Safe Harbour
  {
    id: 'gc-de', jurisdiction: 'Germany', label: 'Germany (Safe Harbour)',
    ceCount: 4,
    fani: 0, netTaxesExcluded: 0, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0, otherAdjustments: 0,
    currentTaxExpense: 0, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 0, tangibleAssetsNBV: 0,
    qdmmtAmount: 0,
    safeHarbourApplied: true, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'SAFE_HARBOUR',
  },
  // Singapore — Below minimum, QDMTT
  {
    id: 'gc-sg', jurisdiction: 'Singapore', label: 'Singapore',
    ceCount: 2,
    fani: 2_300_000, netTaxesExcluded: 392_206, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0,
    otherAdjustments: 1_307_794,
    currentTaxExpense: 392_206, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 1_200_000, tangibleAssetsNBV: 850_000,
    qdmmtAmount: 198_268,
    safeHarbourApplied: false, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'QDMTT',
  },
  // Ireland (Main Group) — Below minimum, QDMTT
  {
    id: 'gc-ie', jurisdiction: 'Ireland', label: 'Ireland (Main Group)',
    ceCount: 2,
    fani: 12_500_000, netTaxesExcluded: 1_770_000, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0,
    otherAdjustments: 730_000,
    currentTaxExpense: 1_770_000, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 8_400_000, tangibleAssetsNBV: 12_000_000,
    qdmmtAmount: 425_011,
    safeHarbourApplied: false, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'QDMTT',
  },
  // Ireland (Atlas MOCE) — Below minimum, QDMTT
  {
    id: 'gc-ie-moce', jurisdiction: 'Ireland', label: 'Ireland (Atlas Ireland — MOCE 28%)',
    ceCount: 1,
    fani: 2_000_000, netTaxesExcluded: 288_000, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0,
    otherAdjustments: 112_000,
    currentTaxExpense: 288_000, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 1_200_000, tangibleAssetsNBV: 800_000,
    qdmmtAmount: 66_720,
    safeHarbourApplied: false, deMinimisApplied: false,
    isMOCE: true, moceOwnershipPercent: 28,
    chargingMechanism: 'QDMTT',
  },
  // Luxembourg — De Minimis
  {
    id: 'gc-lu', jurisdiction: 'Luxembourg', label: 'Luxembourg (De Minimis)',
    ceCount: 1,
    fani: 0, netTaxesExcluded: 0, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0, otherAdjustments: 0,
    currentTaxExpense: 0, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 0, tangibleAssetsNBV: 0,
    qdmmtAmount: 0,
    safeHarbourApplied: false, deMinimisApplied: true,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'DE_MINIMIS',
  },
  // USA — Safe Harbour
  {
    id: 'gc-us', jurisdiction: 'United States', label: 'United States (Safe Harbour)',
    ceCount: 5,
    fani: 0, netTaxesExcluded: 0, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0, otherAdjustments: 0,
    currentTaxExpense: 0, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 0, tangibleAssetsNBV: 0,
    qdmmtAmount: 0,
    safeHarbourApplied: true, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'SAFE_HARBOUR',
  },
  // Cayman — Below minimum, IIR (no QDMTT)
  {
    id: 'gc-ky', jurisdiction: 'Cayman Islands', label: 'Cayman Islands',
    ceCount: 1,
    fani: 1_996_000, netTaxesExcluded: 20_200, excludedDividends: 0,
    excludedEquityGains: 0, policyDisallowed: 0, stockCompAdj: 0,
    otherAdjustments: 0,
    currentTaxExpense: 20_200, deferredTaxAdj: 0, dtlCapAdj: 0, utpAdj: 0, nonCoveredTaxAdj: 0,
    eligiblePayroll: 100_820, tangibleAssetsNBV: 50_000,
    qdmmtAmount: 0,
    safeHarbourApplied: false, deMinimisApplied: false,
    isMOCE: false, moceOwnershipPercent: 0,
    chargingMechanism: 'IIR',
  },
];

/**
 * Key teaching points for the H&C scenario.
 */
export const CASE_STUDY_TEACHING_POINTS: string[] = [
  'The GIR is the capstone compliance document — it integrates scope (S1), charging mechanism (S2), computations (S3–S5), restructuring (S6), and filing (S7).',
  'Safe harbours dramatically reduce compliance burden: 4 of 7 jurisdictions qualify (UK above minimum, Germany/Luxembourg/USA via transitional CbCR safe harbour), leaving Singapore, Ireland, and Cayman requiring full GloBE computation.',
  'QDMTT is the primary collection mechanism for Ireland and Singapore — domestic top-up tax collection means zero IIR liability for these jurisdictions.',
  'The Cayman Islands (TechStart Ventures Fund) is the only jurisdiction where IIR applies — no QDMTT means the UK UPE collects via IIR.',
  'First filing year entitles the group to 18-month filing deadline (30 June 2027) instead of the standard 15 months.',
  'The TechStart acquisition introduces partial-year entries requiring 184/365 = 50.41% proration of income and tax.',
  'Atlas Ireland (28% MOCE) requires separate computation from the main Ireland group — jurisdictional blending does not apply to MOCEs.',
  'The DFE is Stratos Holdings plc (UK UPE) — filing in the UK covers all jurisdictions with QCAA agreements.',
];
