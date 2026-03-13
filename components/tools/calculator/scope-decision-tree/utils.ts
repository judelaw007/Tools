// T-SDT: Scope Determination Decision Tree — Utilities

import type {
  RevenueYear,
  GroupInfo,
  Entity,
  EntityClassification,
  ScopeResult,
  SelectOption,
  StepConfig,
  DecisionStep,
  CEType,
  ExcludedReason,
  OutOfScopeReason,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** Article 1.1.1: €750 million consolidated revenue threshold */
export const REVENUE_THRESHOLD_EUR = 750_000_000;

/** Article 1.1.1: Must meet threshold in at least 2 of 4 preceding FYs */
export const YEARS_REQUIRED = 2;

/** Number of preceding fiscal years to test */
export const YEARS_TESTED = 4;

/** MOCE ownership threshold (Article 5.6) */
export const MOCE_THRESHOLD_PERCENT = 30;

// ============================================================
// STEP CONFIGURATION
// ============================================================

export const STEP_CONFIGS: StepConfig[] = [
  {
    key: 'GROUP_INFO',
    label: 'Group Information',
    shortLabel: 'Group',
    articleRef: '',
  },
  {
    key: 'REVENUE_TEST',
    label: 'Revenue Threshold Test',
    shortLabel: 'Revenue',
    articleRef: 'Article 1.1.1',
  },
  {
    key: 'ENTITY_REGISTER',
    label: 'Entity Register',
    shortLabel: 'Entities',
    articleRef: 'Articles 1.2–1.4',
  },
  {
    key: 'ENTITY_CLASSIFICATION',
    label: 'Entity Classification',
    shortLabel: 'Classification',
    articleRef: 'Article 1.5',
  },
  {
    key: 'RESULTS',
    label: 'Scope Determination',
    shortLabel: 'Results',
    articleRef: 'Articles 1.1–1.5',
  },
];

export const DECISION_STEPS: DecisionStep[] = STEP_CONFIGS.map((s) => s.key);

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
  { value: 'Canada', label: 'Canada' },
  { value: 'Switzerland', label: 'Switzerland' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Cayman Islands', label: 'Cayman Islands' },
  { value: 'Malaysia', label: 'Malaysia' },
];

export const CURRENCIES: SelectOption[] = [
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'HKD', label: 'HKD — Hong Kong Dollar' },
];

export const ACCOUNTING_STANDARDS: SelectOption[] = [
  { value: 'IFRS', label: 'IFRS' },
  { value: 'US_GAAP', label: 'US GAAP' },
  { value: 'LOCAL_GAAP', label: 'Local GAAP' },
  { value: 'OTHER', label: 'Other' },
];

export const CE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'UPE', label: 'Ultimate Parent Entity (Art. 1.4)' },
  { value: 'IPE', label: 'Intermediate Parent Entity (Art. 2.1.2)' },
  { value: 'OPERATING', label: 'Operating Subsidiary' },
  { value: 'PE', label: 'Permanent Establishment (Art. 1.3.1)' },
  { value: 'TTE', label: 'Tax Transparent Entity (Art. 3.5)' },
  { value: 'MOCE', label: 'Minority-Owned CE (Art. 5.6)' },
];

export const EXCLUDED_REASON_OPTIONS: SelectOption[] = [
  { value: 'GOVERNMENT_ENTITY', label: 'Government Entity — Art. 1.5.1(a)' },
  {
    value: 'INTERNATIONAL_ORG',
    label: 'International Organisation — Art. 1.5.1(b)',
  },
  {
    value: 'NPO',
    label: 'Non-profit Organisation — Art. 1.5.1(c)',
  },
  { value: 'PENSION_FUND', label: 'Pension Fund — Art. 1.5.1(d)' },
  {
    value: 'INVESTMENT_FUND_UPE',
    label: 'Investment Fund (UPE) — Art. 1.5.1(e)',
  },
  { value: 'REIV_UPE', label: 'Real Estate Investment Vehicle (UPE) — Art. 1.5.1(f)' },
];

export const OUT_OF_SCOPE_REASON_OPTIONS: SelectOption[] = [
  {
    value: 'EQUITY_METHOD',
    label: 'Equity method investment — not consolidated',
  },
  {
    value: 'NOT_CONSOLIDATED',
    label: 'Not part of consolidated group',
  },
];

// ============================================================
// ARTICLE REFERENCE LOOKUP
// ============================================================

export const EXCLUDED_ARTICLE_REFS: Record<ExcludedReason, string> = {
  GOVERNMENT_ENTITY: 'Article 1.5.1(a)',
  INTERNATIONAL_ORG: 'Article 1.5.1(b)',
  NPO: 'Article 1.5.1(c)',
  PENSION_FUND: 'Article 1.5.1(d)',
  INVESTMENT_FUND_UPE: 'Article 1.5.1(e)',
  REIV_UPE: 'Article 1.5.1(f)',
};

export const CE_TYPE_ARTICLE_REFS: Record<CEType, string> = {
  UPE: 'Article 1.4',
  IPE: 'Article 2.1.2',
  OPERATING: 'Article 1.2.1',
  PE: 'Article 1.3.1',
  TTE: 'Article 3.5',
  MOCE: 'Article 5.6',
};

// ============================================================
// EDUCATIONAL NOTES
// ============================================================

export const STEP_EDUCATIONAL_NOTES: Record<DecisionStep, string> = {
  GROUP_INFO:
    'The scope determination starts by identifying the MNE Group and its Ultimate Parent Entity. The UPE jurisdiction is critical because it determines which jurisdiction applies the Income Inclusion Rule (IIR) first under the GloBE ordering rules.',
  REVENUE_TEST:
    'Article 1.1.1 requires consolidated revenue of €750 million or more in at least 2 of the 4 fiscal years immediately preceding the tested fiscal year. Revenue is always tested in EUR — groups reporting in other currencies must convert using the annual average exchange rate.',
  ENTITY_REGISTER:
    'Article 1.2 defines Constituent Entities broadly: any entity included in the Consolidated Financial Statements, plus entities excluded solely on size or materiality grounds. Permanent Establishments in a different jurisdiction from their head office are treated as separate CEs under Article 1.3.1.',
  ENTITY_CLASSIFICATION:
    'Article 1.5 defines Excluded Entities — these are mandatory exclusions, not elective. If an entity meets the criteria (government, NPO, pension fund, etc.), it must be excluded. Entities held by an Excluded Entity that do not themselves qualify for exclusion remain in scope as CEs.',
  RESULTS:
    'The scope determination produces the definitive list of Constituent Entities subject to the GloBE Rules. This list feeds directly into the GIR (General Information section) and determines which entities require jurisdictional ETR computation.',
};

export const CLASSIFICATION_GUIDANCE: Record<string, string> = {
  CE:
    'A Constituent Entity is any entity included in the MNE Group\'s Consolidated Financial Statements, or that would be included if the group prepared such statements. This includes entities excluded solely on size or materiality grounds (Article 1.2.1).',
  EXCLUDED:
    'Excluded Entities are mandatory — if an entity meets the Article 1.5 criteria, it must be excluded from the GloBE computation. The exclusion applies to the entity itself, not to entities it owns. A subsidiary of an Excluded Entity remains a CE if it does not independently qualify for exclusion.',
  OUT_OF_SCOPE:
    'Entities outside the consolidation perimeter (e.g., equity-method investments where the MNE Group holds less than a controlling interest) are not Constituent Entities and fall outside the GloBE Rules entirely.',
};

// ============================================================
// INITIAL STATE
// ============================================================

export const INITIAL_GROUP_INFO: GroupInfo = {
  groupName: '',
  upeJurisdiction: '',
  reportingCurrency: 'EUR',
  accountingStandard: 'IFRS',
  fiscalYearEnd: '31 December',
  testingFiscalYear: new Date().getFullYear(),
};

export const INITIAL_ENTITY: Omit<Entity, 'id'> = {
  entityName: '',
  jurisdiction: '',
  ownershipPercent: 100,
  parentEntityId: null,
  isUPE: false,
  isDFE: false,
  isPE: false,
  peOfEntityId: null,
  classification: { status: 'UNCLASSIFIED' },
  notes: '',
};

// ============================================================
// PURE FUNCTIONS — Revenue Threshold
// ============================================================

/**
 * Convert local currency revenue to EUR.
 * If reporting currency is already EUR, exchangeRate should be 1.
 */
export function convertToEUR(
  revenueLocal: number,
  exchangeRate: number
): number {
  return Math.round(revenueLocal * exchangeRate * 100) / 100;
}

/**
 * Calculate a single RevenueYear from local inputs.
 */
export function calculateRevenueYear(
  fiscalYear: number,
  revenueLocal: number,
  exchangeRate: number
): RevenueYear {
  const revenueEUR = convertToEUR(revenueLocal, exchangeRate);
  return {
    fiscalYear,
    revenueLocal,
    exchangeRate,
    revenueEUR,
    meetsThreshold: revenueEUR >= REVENUE_THRESHOLD_EUR,
  };
}

/**
 * Generate the 4 fiscal years to test (preceding the testing FY).
 */
export function getPrecedingYears(testingFY: number): number[] {
  return [
    testingFY - 4,
    testingFY - 3,
    testingFY - 2,
    testingFY - 1,
  ];
}

/**
 * Determine in-scope status from revenue years.
 * Returns true if ≥ YEARS_REQUIRED of YEARS_TESTED exceed €750M.
 */
export function checkRevenueThreshold(revenueYears: RevenueYear[]): {
  inScope: boolean;
  yearsExceeding: number;
} {
  const yearsExceeding = revenueYears.filter((y) => y.meetsThreshold).length;
  return {
    inScope: yearsExceeding >= YEARS_REQUIRED,
    yearsExceeding,
  };
}

// ============================================================
// PURE FUNCTIONS — Entity Classification
// ============================================================

/**
 * Build a CE classification object.
 */
export function classifyAsCE(ceType: CEType): EntityClassification {
  return {
    status: 'CE',
    ceType,
    articleReference: CE_TYPE_ARTICLE_REFS[ceType],
  };
}

/**
 * Build an Excluded Entity classification object.
 */
export function classifyAsExcluded(
  reason: ExcludedReason
): EntityClassification {
  return {
    status: 'EXCLUDED',
    excludedReason: reason,
    articleReference: EXCLUDED_ARTICLE_REFS[reason],
  };
}

/**
 * Build an Out of Scope classification object.
 */
export function classifyAsOutOfScope(
  reason: OutOfScopeReason,
  rationale: string
): EntityClassification {
  return {
    status: 'OUT_OF_SCOPE',
    outOfScopeReason: reason,
    rationale,
  };
}

/**
 * Determine if an entity qualifies as MOCE (< 30% ownership).
 */
export function isMOCE(ownershipPercent: number): boolean {
  return ownershipPercent > 0 && ownershipPercent < MOCE_THRESHOLD_PERCENT;
}

// ============================================================
// PURE FUNCTIONS — Results Computation
// ============================================================

/**
 * Compute the full scope determination result from inputs.
 */
export function computeScopeResult(
  revenueYears: RevenueYear[],
  entities: Entity[]
): ScopeResult {
  const threshold = checkRevenueThreshold(revenueYears);

  const constituentEntities = entities.filter(
    (e) => e.classification.status === 'CE'
  );
  const excludedEntities = entities.filter(
    (e) => e.classification.status === 'EXCLUDED'
  );
  const outOfScopeEntities = entities.filter(
    (e) => e.classification.status === 'OUT_OF_SCOPE'
  );

  const upeEntity = entities.find((e) => e.isUPE) ?? null;
  const dfeEntity = entities.find((e) => e.isDFE) ?? upeEntity;

  const jurisdictions = [
    ...Array.from(new Set(constituentEntities.map((e) => e.jurisdiction))),
  ].sort();

  return {
    inScope: threshold.inScope,
    yearsExceeding: threshold.yearsExceeding,
    totalYearsTested: revenueYears.length,
    revenueYears,
    constituentEntities,
    excludedEntities,
    outOfScopeEntities,
    upeEntity,
    dfeEntity,
    totalCEs: constituentEntities.length,
    jurisdictionCount: jurisdictions.length,
    jurisdictions,
  };
}

// ============================================================
// UTILITY HELPERS
// ============================================================

/**
 * Format a number as currency with thousands separators.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR'
): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    GBP: '£',
    USD: '$',
    CHF: 'CHF ',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    HKD: 'HK$',
  };
  const symbol = symbols[currency] || `${currency} `;
  const formatted = Math.round(amount).toLocaleString('en-GB');
  return `${symbol}${formatted}`;
}

/**
 * Format a number as millions for display.
 */
export function formatMillions(
  amount: number,
  currency: string = 'EUR'
): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    GBP: '£',
    USD: '$',
    CHF: 'CHF ',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    HKD: 'HK$',
  };
  const symbol = symbols[currency] || `${currency} `;
  const millions = (amount / 1_000_000).toFixed(1);
  return `${symbol}${millions}M`;
}

/**
 * Generate a unique ID for a new entity.
 */
export function generateEntityId(): string {
  return `E${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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

export interface ValidationError {
  field: string;
  message: string;
}

export function validateGroupInfo(info: GroupInfo): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!info.groupName.trim()) {
    errors.push({
      field: 'groupName',
      message: 'Please enter the MNE Group name',
    });
  }
  if (!info.upeJurisdiction) {
    errors.push({
      field: 'upeJurisdiction',
      message: 'Please select the UPE jurisdiction',
    });
  }
  if (info.testingFiscalYear < 2024) {
    errors.push({
      field: 'testingFiscalYear',
      message: 'Testing fiscal year must be 2024 or later',
    });
  }
  return errors;
}

export function validateRevenueYears(
  years: RevenueYear[],
  currency: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  years.forEach((y, i) => {
    if (y.revenueLocal < 0) {
      errors.push({
        field: `revenue_${i}`,
        message: `FY ${y.fiscalYear}: Revenue cannot be negative`,
      });
    }
    if (currency !== 'EUR' && y.exchangeRate <= 0) {
      errors.push({
        field: `rate_${i}`,
        message: `FY ${y.fiscalYear}: Exchange rate must be greater than zero`,
      });
    }
  });
  return errors;
}

export function validateEntities(entities: Entity[]): ValidationError[] {
  const errors: ValidationError[] = [];
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
  });
  return errors;
}

export function validateClassifications(entities: Entity[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const unclassified = entities.filter(
    (e) => e.classification.status === 'UNCLASSIFIED'
  );
  if (unclassified.length > 0) {
    errors.push({
      field: 'classification',
      message: `${unclassified.length} entity/entities still unclassified: ${unclassified.map((e) => e.entityName || 'unnamed').join(', ')}`,
    });
  }
  return errors;
}

// ============================================================
// H&C TEST SCENARIO — Stratos Group
// ============================================================

export const CASE_STUDY_GROUP_INFO: GroupInfo = {
  groupName: 'Stratos Holdings plc',
  upeJurisdiction: 'United Kingdom',
  reportingCurrency: 'GBP',
  accountingStandard: 'IFRS',
  fiscalYearEnd: '31 December',
  testingFiscalYear: 2025,
};

export const CASE_STUDY_REVENUE_YEARS: RevenueYear[] = [
  {
    fiscalYear: 2021,
    revenueLocal: 625_400_000,
    exchangeRate: 1.163,
    revenueEUR: 727_340_200,
    meetsThreshold: false, // €727.3M < €750M
  },
  {
    fiscalYear: 2022,
    revenueLocal: 679_800_000,
    exchangeRate: 1.1729,
    revenueEUR: 797_349_420,
    meetsThreshold: true, // €797.3M ≥ €750M
  },
  {
    fiscalYear: 2023,
    revenueLocal: 744_600_000,
    exchangeRate: 1.1499,
    revenueEUR: 856_195_540,
    meetsThreshold: true, // €856.2M ≥ €750M
  },
  {
    fiscalYear: 2024,
    revenueLocal: 819_500_000,
    exchangeRate: 1.1453,
    revenueEUR: 938_563_500,
    meetsThreshold: true, // €938.6M ≥ €750M
  },
];

export const CASE_STUDY_ENTITIES: Entity[] = [
  // === CONSTITUENT ENTITIES (19) ===
  {
    id: 's-001',
    entityName: 'Stratos Holdings plc',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: null,
    isUPE: true,
    isDFE: true,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('UPE'),
    notes: 'LSE-listed. Prepares consolidated financial statements under IFRS.',
  },
  {
    id: 's-002',
    entityName: 'SG Holdings Ltd',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('IPE'),
    notes: 'Intermediate holding company for European and Asian operations.',
  },
  {
    id: 's-003',
    entityName: 'SG Germany GmbH',
    jurisdiction: 'Germany',
    ownershipPercent: 100,
    parentEntityId: 's-002',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Primary EU operations — software development and consulting.',
  },
  {
    id: 's-004',
    entityName: 'SG Germany Sales GmbH',
    jurisdiction: 'Germany',
    ownershipPercent: 100,
    parentEntityId: 's-003',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Sales subsidiary of SG Germany GmbH.',
  },
  {
    id: 's-005',
    entityName: 'SG France SAS',
    jurisdiction: 'France',
    ownershipPercent: 100,
    parentEntityId: 's-002',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'French operations. Has a PE in Belgium.',
  },
  {
    id: 's-006',
    entityName: 'Belgium PE (of SG France SAS)',
    jurisdiction: 'Belgium',
    ownershipPercent: 100,
    parentEntityId: 's-005',
    isUPE: false,
    isDFE: false,
    isPE: true,
    peOfEntityId: 's-005',
    classification: classifyAsCE('PE'),
    notes:
      'Branch of SG France SAS in Belgium. Treated as separate CE under Art. 1.3.1 because it is in a different jurisdiction from its head office.',
  },
  {
    id: 's-007',
    entityName: 'SG Netherlands BV',
    jurisdiction: 'Netherlands',
    ownershipPercent: 100,
    parentEntityId: 's-002',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('IPE'),
    notes: 'Intermediate holding for Ireland and Singapore sub-groups.',
  },
  {
    id: 's-008',
    entityName: 'SG Ireland Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 100,
    parentEntityId: 's-007',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('IPE'),
    notes: 'European HQ and intermediate holding for SG Ireland IP Ltd.',
  },
  {
    id: 's-009',
    entityName: 'SG Ireland IP Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 100,
    parentEntityId: 's-008',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'IP holding entity under SG Ireland Ltd.',
  },
  {
    id: 's-010',
    entityName: 'SG Singapore Pte Ltd',
    jurisdiction: 'Singapore',
    ownershipPercent: 100,
    parentEntityId: 's-007',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('IPE'),
    notes: 'Asia-Pacific regional HQ and IP holding.',
  },
  {
    id: 's-011',
    entityName: 'SG Singapore Tech Pte Ltd',
    jurisdiction: 'Singapore',
    ownershipPercent: 100,
    parentEntityId: 's-010',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'R&D centre in Singapore.',
  },
  {
    id: 's-012',
    entityName: 'SG Hong Kong Ltd',
    jurisdiction: 'Hong Kong',
    ownershipPercent: 100,
    parentEntityId: 's-010',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Hong Kong operations.',
  },
  {
    id: 's-013',
    entityName: 'SG US Holdings Inc',
    jurisdiction: 'United States',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('IPE'),
    notes: 'US holding company (Delaware).',
  },
  {
    id: 's-014',
    entityName: 'SG US Operating Inc',
    jurisdiction: 'United States',
    ownershipPercent: 100,
    parentEntityId: 's-013',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes:
      'US operating subsidiary (Delaware). Has a California branch — domestic PEs are NOT separate CEs under Art. 1.3.1.',
  },
  {
    id: 's-015',
    entityName: 'SG US Services Inc',
    jurisdiction: 'United States',
    ownershipPercent: 100,
    parentEntityId: 's-013',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'US services subsidiary (Delaware).',
  },
  {
    id: 's-016',
    entityName: 'SG Australia Pty Ltd',
    jurisdiction: 'Australia',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Australian operations.',
  },
  {
    id: 's-017',
    entityName: 'SG Japan KK',
    jurisdiction: 'Japan',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Japanese operations.',
  },
  {
    id: 's-018',
    entityName: 'SG Luxembourg S.à r.l.',
    jurisdiction: 'Luxembourg',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('OPERATING'),
    notes: 'Treasury services entity.',
  },
  {
    id: 's-019',
    entityName: 'Atlas Ireland Ltd',
    jurisdiction: 'Ireland',
    ownershipPercent: 28,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsCE('MOCE'),
    notes:
      '28% ownership — qualifies as MOCE under Art. 5.6 (< 30%). Included in CFS via management contract control. Shared services arrangement.',
  },

  // === EXCLUDED ENTITIES (2) ===
  {
    id: 's-020',
    entityName: 'SG Pension Trustees Ltd',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsExcluded('PENSION_FUND'),
    notes:
      'Pension fund for Stratos Group employees. Meets Art. 1.5.1(d) criteria — regulated pension fund holding assets for the benefit of beneficiaries.',
  },
  {
    id: 's-021',
    entityName: 'Stratos Foundation',
    jurisdiction: 'United Kingdom',
    ownershipPercent: 100,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsExcluded('NPO'),
    notes:
      'Registered charity (No. 123456). Meets Art. 1.5.1(c) criteria — established and operated exclusively for charitable purposes.',
  },

  // === OUT OF SCOPE (2) ===
  {
    id: 's-022',
    entityName: 'Asian Technology JV Ltd',
    jurisdiction: 'Hong Kong',
    ownershipPercent: 40,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsOutOfScope(
      'EQUITY_METHOD',
      '40% equity method investment — not consolidated. Stratos does not hold a controlling interest.'
    ),
    notes:
      'Joint venture accounted for under equity method. Not part of CFS consolidation perimeter.',
  },
  {
    id: 's-023',
    entityName: 'Singapore Gov JV Pte Ltd',
    jurisdiction: 'Singapore',
    ownershipPercent: 49,
    parentEntityId: 's-001',
    isUPE: false,
    isDFE: false,
    isPE: false,
    peOfEntityId: null,
    classification: classifyAsOutOfScope(
      'EQUITY_METHOD',
      '49% equity method investment — not consolidated. Government co-investor (Singapore EDB) holds 51%.'
    ),
    notes:
      'Joint venture with Singapore EDB. Equity method — not controlled by Stratos.',
  },
];
