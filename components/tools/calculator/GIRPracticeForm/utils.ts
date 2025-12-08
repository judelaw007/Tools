import type {
  DataPoints,
  Section1Data,
  EntityData,
  JurisdictionCalcData,
  JurisdictionCalcResult,
  CaseStudy,
} from './types';

// Data Point Reference Database (Aligned with GIR Spec)
export const DATA_POINTS: DataPoints = {
  // Section 1.1 MNE Group
  'S1.1.1': { name: 'MNE Group Name', type: 'Text', required: 'Yes', desc: 'Legal name of the MNE group.', erp: 'Legal entity master data', issues: 'Inconsistent naming conventions.' },
  'S1.1.2': { name: 'UPE Legal Name', type: 'Text', required: 'Yes', desc: 'Ultimate Parent Entity legal name.', erp: 'Entity Master', issues: 'Must match tax registration exactly.' },
  'S1.1.3': { name: 'UPE Jurisdiction', type: 'Code', required: 'Yes', desc: 'Country of UPE incorporation (ISO 3166-1).', erp: 'Entity Master (Country Code)', issues: 'Using full names instead of codes.' },
  'S1.1.4': { name: 'UPE Tax ID', type: 'Text', required: 'Conditional', desc: 'Tax identification number (use "NOTIN" if none).', erp: 'Tax Master Data', issues: 'Formatting differences.' },
  'S1.1.5': { name: 'LEI', type: 'Text', required: 'Optional', desc: 'Legal Entity Identifier (20 chars).', erp: 'Treasury System', issues: 'Expired LEIs.' },

  // Section 1.2 Reporting Period
  'S1.2.1': { name: 'Fiscal Year Start', type: 'Date', required: 'Yes', desc: 'Start date of the reporting fiscal year.', erp: 'GL Configuration', issues: 'Wrong format (must be YYYY-MM-DD).' },
  'S1.2.2': { name: 'Fiscal Year End', type: 'Date', required: 'Yes', desc: 'End date of the reporting fiscal year.', erp: 'GL Configuration', issues: 'Non-standard fiscal years.' },
  'S1.2.3': { name: 'Reporting Currency', type: 'Code', required: 'Yes', desc: 'ISO 4217 Currency Code (e.g., EUR, USD).', erp: 'Consolidation System', issues: 'Using symbols instead of codes.' },
  'S1.2.4': { name: 'First Filing Year', type: 'Boolean', required: 'Yes', desc: 'Indicates if this is the first GloBE filing.', erp: 'N/A', issues: 'Incorrect toggle for transition years.' },
  'S1.2.5': { name: 'Consolidated Revenue', type: 'Numeric', required: 'Yes', desc: 'Total consolidated revenue of the MNE Group.', erp: 'Consolidated P&L', issues: 'Excluding relevant income streams.' },

  // Section 1.3 Filing Entity
  'S1.3.1': { name: 'DFE Name', type: 'Text', required: 'Yes', desc: 'Designated Filing Entity Name.', erp: 'Tax Admin', issues: 'Mismatch with notification.' },
  'S1.3.2': { name: 'DFE Jurisdiction', type: 'Code', required: 'Yes', desc: 'Jurisdiction of the Filing Entity.', erp: 'Tax Admin', issues: 'Must match DFE tax residency.' },
  'S1.3.3': { name: 'DFE Tax ID', type: 'Text', required: 'Yes', desc: 'Tax ID of the Filing Entity.', erp: 'Tax Admin', issues: 'Typos.' },
  'S1.3.4': { name: 'Filing Type', type: 'Code', required: 'Yes', desc: 'ORIGINAL or AMENDED.', erp: 'N/A', issues: 'Amending without reason.' },
  'S1.3.5': { name: 'Amendment Reason', type: 'Text', required: 'Conditional', desc: 'Reason for amendment if type is AMENDED.', erp: 'N/A', issues: 'Vague descriptions.' },

  // Section 2 Entity Details
  'S2.1.1': { name: 'Entity Name', type: 'Text', required: 'Yes', desc: 'Legal name of the Constituent Entity.', erp: 'Entity Master', issues: 'Abbreviations not matching legal docs.' },
  'S2.1.2': { name: 'Entity Internal ID', type: 'Text', required: 'Yes', desc: 'Internal reference code for the entity.', erp: 'Entity Master', issues: 'System ID changes.' },
  'S2.1.3': { name: 'Entity Jurisdiction', type: 'Code', required: 'Yes', desc: 'Tax jurisdiction of the entity.', erp: 'Entity Master', issues: 'PE jurisdiction vs Main Entity jurisdiction.' },
  'S2.1.4': { name: 'Entity Tax ID', type: 'Text', required: 'Conditional', desc: 'Tax Identification Number.', erp: 'Tax Master', issues: 'Missing for new entities.' },
  'S2.2.1': { name: 'Direct Parent Entity', type: 'Reference', required: 'Yes', desc: 'ID of the immediate parent entity.', erp: 'Structure Chart', issues: 'Circular references.' },
  'S2.2.2': { name: 'Ownership Percentage', type: 'Numeric', required: 'Yes', desc: 'Direct ownership percentage held by parent.', erp: 'Share Register', issues: 'Not summing to 100% correctly.' },
  'S2.3.1': { name: 'Entity Type', type: 'Code', required: 'Yes', desc: 'UPE, CE, PE, JV, or MOCE.', erp: 'Tax Hierarchy', issues: 'Misclassification of PEs.' },
  'S2.3.2': { name: 'Is Excluded Entity', type: 'Boolean', required: 'Yes', desc: 'Pension funds, govt entities, etc.', erp: 'Tax Classification', issues: 'Incorrect exclusions.' },

  // Section 3 GloBE Income
  'S3.2.1': { name: 'Financial Accounting Net Income', type: 'Numeric', required: 'Yes', desc: 'Net income/loss before consolidation adjustments.', erp: 'Trial Balance', issues: 'Using local GAAP instead of UPE GAAP.' },
  'S3.2.2': { name: 'Net Taxes Included in Income', type: 'Numeric', required: 'Yes', desc: 'Tax expense included in financial income.', erp: 'GL Tax Accounts', issues: 'Missing deferred tax impacts.' },
  'S3.2.3': { name: 'Excluded Dividends', type: 'Numeric', required: 'Optional', desc: 'Dividends from portfolio holdings.', erp: 'Investment Subledger', issues: 'Including operating dividends.' },
  'S3.2.4': { name: 'Excluded Equity Gains/Losses', type: 'Numeric', required: 'Optional', desc: 'Gains/losses from equity interests.', erp: 'Investment Subledger', issues: 'Including portfolio <10% holdings.' },
  'S3.2.5': { name: 'Policy Disallowed Expenses', type: 'Numeric', required: 'Optional', desc: 'Expenses disallowed under GloBE rules.', erp: 'GL Analysis', issues: 'Missing certain disallowed items.' },
  'S3.2.6': { name: 'Stock Compensation Adjustment', type: 'Numeric', required: 'Optional', desc: 'Stock-based compensation adjustments.', erp: 'HR/Payroll', issues: 'Timing differences.' },
  'S3.2.7': { name: 'Other Adjustments', type: 'Numeric', required: 'Optional', desc: 'Other GloBE income adjustments.', erp: 'Various', issues: 'Undocumented adjustments.' },
  'S3.2.8': { name: 'GloBE Income', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Net GloBE Income after adjustments.', erp: 'Calculated', issues: 'Incorrect adjustments applied.' },

  // Section 3 Covered Taxes
  'S3.3.1': { name: 'Current Tax Expense', type: 'Numeric', required: 'Yes', desc: 'Current tax expense for the fiscal year.', erp: 'Tax Provision', issues: 'Accruals vs cash tax confusion.' },
  'S3.3.2': { name: 'Deferred Tax Expense', type: 'Numeric', required: 'Yes', desc: 'Deferred tax expense for the period.', erp: 'Tax Provision', issues: 'Recapture timing.' },
  'S3.3.4': { name: 'UTP Adjustment', type: 'Numeric', required: 'Optional', desc: 'Uncertain Tax Positions adjustments.', erp: 'Tax Provision Workpapers', issues: 'Double counting.' },
  'S3.3.5': { name: 'Non-Covered Tax Adjustment', type: 'Numeric', required: 'Optional', desc: 'Taxes not qualifying as covered.', erp: 'GL Analysis', issues: 'Digital Services Taxes inclusion.' },
  'S3.3.6': { name: 'Adjusted Covered Taxes', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Total covered taxes after adjustments.', erp: 'Calculated', issues: 'Missed uncertain tax positions.' },

  // Section 3 SBIE & Top-up
  'S3.4.1': { name: 'Eligible Payroll Costs', type: 'Numeric', required: 'Yes', desc: 'Payroll costs for employees in jurisdiction.', erp: 'HR/Payroll System', issues: 'Including independent contractors.' },
  'S3.4.4': { name: 'Eligible Tangible Assets', type: 'Numeric', required: 'Yes', desc: 'Carrying value of tangible assets.', erp: 'Fixed Asset Register', issues: 'Using gross book value instead of carrying value.' },
  'S3.4.7': { name: 'Total SBIE', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Total Substance-Based Income Exclusion.', erp: 'Calculated', issues: 'Using wrong year rates.' },
  'S3.5.3': { name: 'Jurisdictional ETR', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Effective Tax Rate (Taxes / Income).', erp: 'Calculated', issues: 'Zero income denominator errors.' },
  'S3.5.7': { name: 'Excess Profit', type: 'Numeric', required: 'Yes', calculated: true, desc: 'GloBE Income minus SBIE.', erp: 'Calculated', issues: 'Negative values handling.' },
  'S3.5.8': { name: 'Gross Top-up Tax', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Top-up Tax before QDMTT.', erp: 'Calculated', issues: 'Negative top-up tax handling.' },
  'S3.5.10': { name: 'Net Top-up Tax', type: 'Numeric', required: 'Yes', calculated: true, desc: 'Final top-up tax after QDMTT offset.', erp: 'Calculated', issues: 'QDMTT allocation errors.' },
};

// Jurisdiction options
export const JURISDICTIONS = ['GB', 'US', 'FR', 'DE', 'IE', 'JP', 'NL', 'CH', 'SG', 'AU'];

// Currency options
export const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CHF'];

// Entity types
export const ENTITY_TYPES = ['UPE', 'CE', 'PE', 'JV', 'MOCE'];

// Filing types
export const FILING_TYPES = ['ORIGINAL', 'AMENDED'];

// Initial states
export const INITIAL_SECTION_1: Section1Data = {
  mneGroupName: '',
  upeLegalName: '',
  upeJurisdiction: '',
  upeTaxId: '',
  lei: '',
  fiscalYearStart: '',
  fiscalYearEnd: '',
  reportingCurrency: 'EUR',
  firstFiling: true,
  consolidatedRevenue: 0,
  dfeName: '',
  dfeJurisdiction: '',
  dfeTaxId: '',
  filingType: 'ORIGINAL',
  amendmentReason: '',
};

export const INITIAL_ENTITY: EntityData = {
  id: '',
  name: '',
  internalId: '',
  jurisdiction: '',
  taxId: '',
  directParent: '',
  ownershipPct: 100,
  ownershipType: 'DIRECT',
  controllingInterest: true,
  entityType: 'CE',
  isExcluded: false,
  exclusionReason: '',
  popeStatus: false,
  investmentEntity: false,
};

export const INITIAL_JURISDICTION_CALC: JurisdictionCalcData = {
  jurisdiction: '',
  fani: 0,
  netTaxes: 0,
  excludedDividends: 0,
  excludedEquity: 0,
  disallowedExpenses: 0,
  stockCompAdj: 0,
  otherAdj: 0,
  currentTax: 0,
  deferredTax: 0,
  utpAdj: 0,
  nonCoveredAdj: 0,
  payrollCosts: 0,
  tangibleAssets: 0,
  qdmtt: 0,
};

// Case Studies
export const CASE_STUDIES: Record<string, CaseStudy> = {
  CS1: {
    name: 'GlobalTech Manufacturing',
    section1: {
      ...INITIAL_SECTION_1,
      mneGroupName: 'GlobalTech Manufacturing Group',
      upeLegalName: 'GlobalTech Manufacturing Ltd',
      upeJurisdiction: 'GB',
      upeTaxId: '1234567890',
      fiscalYearStart: '2024-01-01',
      fiscalYearEnd: '2024-12-31',
      consolidatedRevenue: 1350000000,
      dfeName: 'GlobalTech Manufacturing Ltd',
      dfeJurisdiction: 'GB',
      dfeTaxId: 'GB1234567890',
      filingType: 'ORIGINAL',
    },
    section2: [
      { ...INITIAL_ENTITY, id: 'E001', name: 'GlobalTech Mfg Ltd', internalId: 'GT-UK-01', jurisdiction: 'GB', entityType: 'UPE' },
      { ...INITIAL_ENTITY, id: 'E002', name: 'GT Ireland Sales', internalId: 'GT-IE-01', jurisdiction: 'IE', entityType: 'CE', directParent: 'E001' },
      { ...INITIAL_ENTITY, id: 'E003', name: 'GT Ireland Ops', internalId: 'GT-IE-02', jurisdiction: 'IE', entityType: 'CE', directParent: 'E001' },
      { ...INITIAL_ENTITY, id: 'E004', name: 'GT Germany GmbH', internalId: 'GT-DE-01', jurisdiction: 'DE', entityType: 'CE', directParent: 'E001' },
      { ...INITIAL_ENTITY, id: 'E005', name: 'GT France SARL', internalId: 'GT-FR-01', jurisdiction: 'FR', entityType: 'CE', directParent: 'E001' },
    ],
    section3: [
      {
        ...INITIAL_JURISDICTION_CALC,
        jurisdiction: 'IE',
        fani: 28000000,
        netTaxes: 3500000,
        disallowedExpenses: -200000,
        stockCompAdj: 1200000,
        otherAdj: 300000,
        currentTax: 3000000,
        deferredTax: 800000,
        utpAdj: -150000,
        nonCoveredAdj: -50000,
        payrollCosts: 19000000,
        tangibleAssets: 17000000,
      },
    ],
  },
};

// Format currency
export function formatCurrency(val: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// Calculate jurisdiction results
export function calculateJurisdiction(data: JurisdictionCalcData): JurisdictionCalcResult {
  // 3.2 GloBE Income
  const globeIncome =
    parseFloat(String(data.fani || 0)) +
    parseFloat(String(data.netTaxes || 0)) +
    parseFloat(String(data.excludedDividends || 0)) +
    parseFloat(String(data.excludedEquity || 0)) +
    parseFloat(String(data.disallowedExpenses || 0)) +
    parseFloat(String(data.stockCompAdj || 0)) +
    parseFloat(String(data.otherAdj || 0));

  // 3.3 Adjusted Covered Taxes
  const totalTaxExpense =
    parseFloat(String(data.currentTax || 0)) + parseFloat(String(data.deferredTax || 0));
  const adjustedCoveredTaxes =
    totalTaxExpense +
    parseFloat(String(data.utpAdj || 0)) +
    parseFloat(String(data.nonCoveredAdj || 0));

  // 3.4 SBIE (Using 2024 rates: 9.8% payroll, 7.8% assets)
  const payrollSBIE = parseFloat(String(data.payrollCosts || 0)) * 0.098;
  const assetSBIE = parseFloat(String(data.tangibleAssets || 0)) * 0.078;
  const totalSBIE = payrollSBIE + assetSBIE;

  // 3.5 Top-up Tax
  let etr = 0;
  if (globeIncome > 0) {
    etr = adjustedCoveredTaxes / globeIncome;
  }

  const minRate = 0.15;
  const topUpTaxPct = Math.max(0, minRate - etr);
  const excessProfit = Math.max(0, globeIncome - totalSBIE);
  const grossTopUp = excessProfit * topUpTaxPct;
  const netTopUp = Math.max(0, grossTopUp - parseFloat(String(data.qdmtt || 0)));

  return {
    globeIncome,
    adjustedCoveredTaxes,
    totalSBIE,
    etr,
    topUpTaxPct,
    excessProfit,
    grossTopUp,
    netTopUp,
  };
}
