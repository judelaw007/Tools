import type { Tool } from '@/types';

// Seed data for tools
// Tools are added by developers for testing
// In production, tools will be managed via admin interface and stored in Supabase
// Course allocation is done by admins via the admin interface (not in seed data)

export const SEED_TOOLS: Tool[] = [
  {
    id: 'gir-globe-calculator',
    name: 'GloBE Calculator',
    slug: 'globe-calculator',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'Calculator',
    shortDescription: 'Calculate GloBE ETR, SBIE exclusions, and Top-up Tax liability under Pillar Two rules.',
    description: `This demo tool helps you understand how to calculate the Effective Tax Rate (ETR), Substance-Based Income Exclusion (SBIE), and Top-up Tax under the OECD Pillar Two GloBE rules.

## What You'll Learn

- How to calculate the jurisdictional ETR
- Understanding the 15% minimum tax threshold
- How SBIE carve-outs reduce excess profits
- QDMTT offset mechanics
- IIR Top-up Tax calculation

## How It Works

**Step 1: ETR Calculation**
Enter the GloBE Income and Adjusted Covered Taxes for a jurisdiction to determine if it's below the 15% minimum rate.

**Step 2: SBIE Exclusion**
Calculate the Substance-Based Income Exclusion based on payroll costs and tangible asset values. The rates decrease over the transition period.

**Step 3: Top-Up Tax**
Determine the final Top-up Tax liability after applying the SBIE exclusion and any QDMTT offset.

> **Note:** This is a simplified educational tool. Actual GloBE calculations involve many more complexities including income adjustments, timing differences, and group-level aggregations.`,
    previewImage: undefined,
    config: {
      calculatorType: 'globe',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'gir-safe-harbour-qualifier',
    name: 'Safe Harbour Qualifier',
    slug: 'safe-harbour-qualifier',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'Shield',
    shortDescription: 'Assess whether a jurisdiction qualifies for the Transitional CbCR Safe Harbour under Pillar Two.',
    description: `This demo tool helps you understand and apply the Transitional Country-by-Country Report (CbCR) Safe Harbour rules under OECD Pillar Two.

## What You'll Learn

- Understanding the three safe harbour tests
- De Minimis threshold requirements
- Simplified ETR test mechanics
- Routine Profits (SBIE) test application
- When full GloBE calculations can be avoided

## The Three Tests

If **any one** of these tests is satisfied, the jurisdiction qualifies for the safe harbour and no top-up tax is due:

**Test 1: De Minimis Test**
Revenue < €10 million AND Profit < €1 million. Small operations can avoid GloBE calculations entirely.

**Test 2: Simplified ETR Test**
The simplified covered taxes divided by profit before tax must meet or exceed the transition rate (15% for 2024, 16% for 2025, 17% for 2026).

**Test 3: Routine Profits Test**
Profit before tax must not exceed the Substance-Based Income Exclusion (SBIE) calculated from payroll and tangible assets.

> **Note:** This is a simplified educational tool. The Transitional CbCR Safe Harbour applies for fiscal years 2024-2026 based on qualifying CbCR data filed before the GloBE rules came into effect.`,
    previewImage: undefined,
    config: {
      calculatorType: 'safe-harbour',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'gir-filing-deadline-calculator',
    name: 'Filing Deadline Calculator',
    slug: 'filing-deadline-calculator',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'Calendar',
    shortDescription: 'Calculate GIR filing deadlines and track compliance milestones for Pillar Two reporting.',
    description: `This demo tool helps you determine your GloBE Information Return (GIR) filing deadlines and plan your compliance timeline.

## What You'll Learn

- Standard 15-month filing deadline calculation
- First-year 18-month transitional extension
- Jurisdiction-specific filing requirements
- Recommended milestone timeline for GIR preparation

## How It Works

**Enter Your Details**
Provide your fiscal year end date, filing jurisdiction, UPE location, and whether this is your first GIR filing year.

**Get Your Deadline**
The calculator determines your applicable filing deadline, accounting for the transitional 18-month extension for first-year filers.

**Track Milestones**
View recommended preparation milestones including data collection, safe harbour assessment, GloBE calculations, internal review, and XML generation.

## Jurisdiction Information

The tool provides filing portal details and key notes for major jurisdictions including UK (HMRC), Ireland (Revenue), Netherlands, Germany, France, Switzerland, US, Australia, Japan, and Singapore.

> **Note:** This is an educational tool. Always verify deadlines with local tax authorities as implementation details may vary.`,
    previewImage: undefined,
    config: {
      calculatorType: 'filing-deadline',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'gir-practice-form',
    name: 'GIR Practice Form',
    slug: 'gir-practice-form',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'Layout',
    shortDescription: 'Practice completing GloBE Information Return data with real-time validation and contextual help.',
    description: `This interactive practice tool helps you understand and practice completing the GloBE Information Return (GIR) with comprehensive data entry forms and real-time calculations.

## What You'll Learn

- GIR Section 1: MNE Group identification, reporting period, and filing entity details
- GIR Section 2: Corporate structure and entity classification
- GIR Section 3: GloBE income, covered taxes, SBIE, and top-up tax calculations
- Data point definitions and ERP source mapping
- Common data entry issues and how to avoid them

## Features

**Contextual Help**
Click any field to see its data point ID, definition, ERP source mapping, and common issues encountered during filing.

**Real-time Calculations**
Section 3 automatically calculates GloBE income, adjusted covered taxes, SBIE, ETR, and top-up tax as you enter data.

**Validation Checks**
Built-in validation ensures jurisdiction coverage between structure and computation sections.

**Case Studies**
Load pre-populated case studies to practice with realistic MNE group scenarios.

**Data Point Search**
Search across 40+ data points by ID or name to quickly find field definitions.

> **Note:** This is a practice tool for learning GIR data requirements. It does not generate actual XML files for filing.`,
    previewImage: undefined,
    config: {
      calculatorType: 'gir-practice',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'gir-dfe-assessment',
    name: 'DFE Assessment Tool',
    slug: 'dfe-assessment-tool',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'Building',
    shortDescription: 'Assess and compare Designated Filing Entity candidates for GloBE Information Return filing.',
    description: `This interactive tool helps you evaluate and select the optimal Designated Filing Entity (DFE) for your MNE Group's GloBE Information Return filing obligations.

## What You'll Learn

- How to evaluate DFE candidates based on multiple criteria
- The impact of Pillar Two implementation status on DFE selection
- Resource and capability requirements for GIR filing
- Notification requirements across jurisdictions

## Assessment Criteria

**UPE Status (25 points)**
Being the Ultimate Parent Entity simplifies compliance and centralizes filing responsibility.

**Pillar Two Status (20 points)**
Jurisdictions with full IIR implementation score higher as they have established filing infrastructure.

**Tax Team Resources (20 points)**
Larger, more experienced tax teams are better equipped to handle GIR complexity.

**Systems Capability (15 points)**
ERP-integrated systems enable automated data extraction and reduce manual effort.

**Advisor Support (10 points)**
Access to Big 4 or mid-tier advisory support enhances filing quality.

**Filing Experience (10 points)**
Prior GIR filing experience reduces learning curve and risk.

## Features

**Candidate Comparison**
Add multiple entities and compare their scores side-by-side.

**Case Study Mode**
Load the GlobalTech Manufacturing case study to practice assessment.

**Notification Checklist**
Get a summary of notification requirements based on your selection.

> **Note:** This is an educational tool. Final DFE selection should involve tax advisors and consider additional factors specific to your group structure.`,
    previewImage: undefined,
    config: {
      calculatorType: 'dfe-assessment',
      version: '2.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '2.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'gir-audit-file-checklist',
    name: 'Audit File Checklist',
    slug: 'audit-file-checklist',
    toolType: 'calculator',
    category: 'pillar_two',
    icon: 'CheckCircle',
    shortDescription: 'Comprehensive checklist for GloBE Information Return documentation and audit file preparation.',
    description: `This interactive tool provides a comprehensive checklist to ensure your GloBE Information Return (GIR) audit file is complete and compliant.

## What You'll Learn

- Required documentation for each GIR section
- Priority levels for different documentation items
- Gap analysis to identify missing items
- Progress tracking across all sections

## Checklist Sections

**Section 1: General Information (10 items)**
UPE identification, group structure, DFE appointment, and threshold analysis documentation.

**Section 2: Corporate Structure (10 items)**
Entity listings, ownership schedules, entity classifications, and structural change documentation.

**Section 3: GloBE Computation (18 items)**
Financial accounting data, GloBE adjustments, covered taxes, ETR calculations, and top-up tax workpapers.

**Elections Documentation (10 items)**
Election inventory, specific election documentation, and approval records.

**Safe Harbour Documentation (8 items)**
CbCR Safe Harbour qualification, test calculations, and reconciliation workpapers.

**System & Process Controls (10 items)**
Data collection processes, validation procedures, and audit trail documentation.

## Features

**Progress Dashboard**
Visual overview of completion status across all sections.

**Priority Filtering**
Focus on Critical, High, or Medium priority items.

**Gap Analysis Report**
Automated identification of incomplete items with recommended actions.

**Export Options**
Generate PDF reports or Excel workbooks for your audit file.

> **Note:** This checklist is based on OECD GloBE Model Rules and Administrative Guidance. Requirements may vary by jurisdiction.`,
    previewImage: undefined,
    config: {
      calculatorType: 'audit-file-checklist',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
  {
    id: 'vat-return-boxes-1-9',
    name: 'VAT Return (Boxes 1-9)',
    slug: 'vat-return',
    toolType: 'calculator',
    category: 'vat',
    icon: 'FileText',
    shortDescription: 'Complete a UK VAT return with transaction-level breakdown, auto-calculations, and comprehensive validation.',
    description: `The standard UK VAT return (form VAT100) filed quarterly via Making Tax Digital. Enter transactions into 9 boxes with auto-calculation of Boxes 3 and 5, partial exemption module, bad debt relief calculator, error correction threshold checker, and 10 validation checks with educational notes.

## What You'll Learn

- How to complete a UK VAT return (Boxes 1-9)
- Transaction-level allocation to correct boxes
- Auto-calculation of Box 3 (Box 1 + Box 2) and Box 5 (Box 3 - Box 4)
- Postponed VAT Accounting (PVA) and reverse charge entries
- Partial exemption standard method with de minimis tests
- Bad debt relief conditions under s.36 VATA 1994
- Error correction thresholds (VAT Notice 700/45)

## How It Works

**Step 1: Setup**
Configure the return period, business type (GB or XI/Northern Ireland), PVA election, partial exemption status, and error correction.

**Step 2: Transactions**
Enter transactions with automatic box allocation based on type. Add PVA imports, reverse charges, exports, exempt supplies, and more. Optional modules for partial exemption calculation, error correction, and bad debt relief.

**Step 3: Review & Submit**
View 9-box summary, net VAT position, filing deadline, and 10 validation checks with educational notes and common error guidance.

> **Note:** This is an educational tool for practising VAT return completion. It does not submit returns to HMRC.`,
    previewImage: undefined,
    config: {
      calculatorType: 'vat-return',
      version: '1.0',
      steps: 3,
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2025-02-16'),
    updatedAt: new Date('2025-02-16'),
  },
  {
    id: 'ccl100-return',
    name: 'CCL100 Return',
    slug: 'ccl100-return',
    toolType: 'calculator',
    category: 'vat',
    icon: 'FileText',
    shortDescription: 'Complete an HMRC CCL100 quarterly return for Climate Change Levy covering electricity, gas, LPG, and solid fuel supplies with CCA discount calculations.',
    description: `Practice completing the HMRC CCL100 quarterly return for Climate Change Levy. Enter commodity quantities and CCA details, and the tool calculates levy due per commodity with full validation.

## What You'll Learn

- Climate Change Levy (CCL) compliance mechanics
- Four-commodity tax breakdown (electricity, gas, LPG, solid fuels)
- Climate Change Agreement (CCA) reduced rate application and relief calculations
- Exemption handling (renewables, CHP, mineralogical/metallurgical processes)
- Prior period credits and payment deadline rules

## How It Works

**Step 1: Accounting Period**
Configure the return period and select which commodities your business supplies.

**Step 2: Commodity Data**
Enter quantities for standard and CCA-covered supplies, exemptions, and prior period credits.

**Step 3: Review**
View Boxes 1–5 (main rates), optional Boxes 6–9 (CPS for generators), commodity breakdowns, and validation checks.

> **Note:** This is an educational tool for practising CCL100 return completion. It does not submit returns to HMRC.`,
    previewImage: undefined,
    config: {
      calculatorType: 'ccl100-return',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18'),
  },
  {
    id: 'cds-import-declaration',
    name: 'CDS Import Declaration (C88)',
    slug: 'cds-import-declaration',
    toolType: 'calculator',
    category: 'vat',
    icon: 'FileText',
    shortDescription: 'Complete a UK customs import declaration on the Customs Declaration Service with procedure codes, preference claims, and duty/VAT calculation.',
    description: `Practice completing a UK import declaration on the Customs Declaration Service (CDS). Enter header and item-level data elements, and the tool validates procedure-preference compatibility, generates a document checklist, and calculates duty and import VAT.

## What You'll Learn

- CDS data elements for import declarations
- Procedure codes (4000 standard import, 6121 OP re-import, etc.) and validation rules
- Preference codes (100 MFN, 200 DCTS, 300 TCA/CEPA) and proof-of-origin requirements
- Document reference codes and required supporting documents
- Duty and import VAT calculation for standard imports and OP re-imports
- PVA election mechanics (Postponed VAT Accounting)

## How It Works

**Step 1: Header**
Complete declarant EORI, importer details, representation type, and PVA election.

**Step 2: Items**
Enter procedure code, preference code, commodity code, customs value, Incoterms, and country of dispatch/origin.

**Step 3: Review**
View duty calculation breakdown, document checklist, and validation results.

> **Note:** This is an educational tool for practising CDS declarations. It does not submit declarations to HMRC.`,
    previewImage: undefined,
    config: {
      calculatorType: 'cds-import-declaration',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18'),
  },
  {
    id: 'customs-valuation-worksheet',
    name: 'Customs Valuation Worksheet',
    slug: 'customs-valuation-worksheet',
    toolType: 'calculator',
    category: 'vat',
    icon: 'Calculator',
    shortDescription: 'Calculate the customs value of imported goods under valuation Method 1 (transaction value) with currency conversion, Incoterms adjustments, and additions/deductions.',
    description: `Calculate customs value under Method 1 (transaction value). Enter invoice price, currency, Incoterms, freight, insurance, and additions/deductions to build up the dutiable value with educational annotations at each step.

## What You'll Learn

- Customs valuation legal framework (TCTA 2018, Retained UCC Arts 70–74)
- Method 1 (transaction value) — the primary valuation method used in ~90% of declarations
- Incoterms impact on customs value (EXW/FOB add freight & insurance; CIF/DDP already include)
- Currency conversion using HMRC monthly exchange rates
- Additions (selling commissions, royalties, assists, packing costs)
- Deductions (post-import transport, installation/assembly)

## How It Works

**Step 1: Invoice & Currency**
Enter invoice price, select currency, and provide the HMRC exchange rate for conversion to GBP.

**Step 2: Incoterms & Freight**
Select the delivery term and enter freight and insurance costs. The tool adjusts based on Incoterms rules.

**Step 3: Additions & Deductions**
Add commissions, royalties, assists, and packing costs. Deduct post-import transport or installation.

**Step 4: Build-Up**
View the itemised customs value build-up with duty and import VAT calculations.

> **Note:** This is an educational tool. Always verify valuations with HMRC guidance and professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 'customs-valuation',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18'),
  },
  {
    id: 'uk-trade-tariff-lookup',
    name: 'UK Trade Tariff Lookup',
    slug: 'uk-trade-tariff-lookup',
    toolType: 'calculator',
    category: 'vat',
    icon: 'Search',
    shortDescription: 'Look up UK commodity codes, duty rates (MFN and preferential), trade remedies, and import controls for goods classified across food, ceramics, and homeware.',
    description: `Search, browse, and look up UK commodity codes with duty rates, trade remedies, and import controls. Compare duty impact across countries and understand classification rationale.

## What You'll Learn

- UK tariff hierarchy (Section → Chapter → Heading → Subheading → 10-digit Commodity Code)
- Commodity classification rationale
- MFN (Third Country) duty rates vs. preferential FTA/DCTS rates
- Trade remedies (anti-dumping, countervailing, safeguard duties)
- Proof-of-origin requirements per preference scheme
- VAT on importation (zero-rated vs. standard-rated)
- Import controls (phytosanitary, organic certification)

## How It Works

**Text Search**
Search by description (e.g., "olive oil", "ceramic cups") to find matching commodity codes.

**Hierarchy Browse**
Navigate Section → Chapter → Heading to explore the tariff structure.

**Direct Code Entry**
Enter a known commodity code to retrieve its full duty picture.

**Compare Mode**
Compare duty impact side-by-side for two countries on the same commodity code.

> **Note:** This tool uses a curated dataset of ~30 commodity codes for educational purposes. For live tariff data, use trade-tariff.service.gov.uk.`,
    previewImage: undefined,
    config: {
      calculatorType: 'tariff-lookup',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2025-02-18'),
    updatedAt: new Date('2025-02-18'),
  },
  {
    id: 'badr-checker',
    name: 'BADR Eligibility Checker and Calculator',
    slug: 'badr-checker',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Check BADR qualifying conditions and calculate CGT liability at the BADR rate with lifetime limit tracking and rate comparison.',
    description: `Two-part tool for Business Asset Disposal Relief: (1) checks all BADR qualifying conditions (2-year holding, 5% tests, personal company, trading company with 80% threshold), (2) calculates CGT liability at the BADR rate with lifetime limit tracking. Includes associated disposal rent restriction calculation and comparison against standard CGT rates.

## What You'll Learn

- BADR qualifying conditions for shares, business assets, and associated disposals
- The 2-year holding period requirement
- 5% shareholding and voting rights tests
- Trading company vs investment company distinction (80% threshold)
- CGT computation at BADR rates (14% for 2025/26, 18% from 2026/27)
- £1,000,000 lifetime limit tracking across multiple disposals
- Associated disposal rent restriction calculation
- Rate comparison against standard CGT rates

> **Note:** This is an educational tool based on TCGA 1992 ss.169H–169S. Always verify with professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 'badr-checker',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'capital-allowances',
    name: 'Capital Allowances Computation',
    slug: 'capital-allowances',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Calculate writing-down allowances, AIA, full expensing, and special rate FYA with exam-format layout.',
    description: `Compute capital allowances for corporation tax including main pool and special rate pool WDA, Annual Investment Allowance, full expensing for qualifying plant and machinery, and zero-emission car FYA. Produces exam-format working paper layout.

## What You'll Learn

- Asset classification by pool (main pool, special rate, single asset)
- CO2-based car classification
- Annual Investment Allowance (AIA) allocation
- Full expensing eligibility for companies
- Writing-down allowance computation with short period adjustments
- Small pool write-off threshold
- Balancing charges and allowances on disposal
- Exam-format capital allowances working paper

> **Note:** This is an educational tool for practising CA computations. Rates are based on current legislation.`,
    previewImage: undefined,
    config: {
      calculatorType: 'capital-allowances',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'cest-status',
    name: 'CEST Employment Status Tool',
    slug: 'cest-status',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'ClipboardList',
    shortDescription: 'Determine employment status for tax using HMRC CEST methodology with case law references and IR35 implications.',
    description: `Assess whether a worker is employed or self-employed for tax purposes using the HMRC Check Employment Status for Tax (CEST) methodology. Covers personal service, control, financial risk, mutuality of obligation, and part-and-parcel indicators with case law references.

## What You'll Learn

- The multi-factor employment status test
- Personal service and substitution rights
- Control indicators (what, how, when, where)
- Financial risk factors
- Mutuality of obligation
- Part-and-parcel integration indicators
- IR35 implications for off-payroll working
- Key case law references (Ready Mixed Concrete, Market Investigations, etc.)

> **Note:** This is an educational tool. HMRC's actual CEST tool is at gov.uk/guidance/check-employment-status-for-tax.`,
    previewImage: undefined,
    config: {
      calculatorType: 'cest-status',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'ct-computation',
    name: 'Corporation Tax Computation with Marginal Relief',
    slug: 'ct-computation',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Compute CT liability including marginal relief, associated companies adjustments, and CT600 box mapping.',
    description: `Compute corporation tax liability for UK companies including the small profits rate, main rate, and marginal relief calculation. Handles associated companies threshold adjustments, short accounting periods, and maps results to CT600 boxes.

## What You'll Learn

- Taxable total profits (TTP) computation
- Small profits rate (19%) vs main rate (25%) thresholds
- Marginal relief formula and calculation
- Associated companies impact on thresholds
- Short accounting period adjustments
- Augmented profits for rate band determination
- CT600 box mapping
- Key compliance dates (filing, payment, QIPs)

> **Note:** This is an educational tool based on CTA 2010. Always verify computations with professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 'ct-computation',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'penp-calculator',
    name: 'Termination Payment Analyser (PENP Calculator)',
    slug: 'penp-calculator',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Calculate Post-Employment Notice Pay, apply the £30,000 exemption, and compute employer NIC on termination payments.',
    description: `Analyse termination payments using the PENP formula to split payments into taxable earnings and potentially exempt components. Applies the £30,000 exemption under ITEPA 2003 s.403 and computes employer NIC on excess.

## What You'll Learn

- Post-Employment Notice Pay (PENP) formula
- Unserved notice period calculation
- Component classification (contractual vs ex-gratia)
- £30,000 exemption application order
- Employer NIC on termination payments above £30,000
- Statutory redundancy pay calculation and cross-check
- Pay period types and their impact on PENP

> **Note:** This is an educational tool based on ITEPA 2003 ss.402A–402E. Always verify with professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 'penp-calculator',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 'profit-extraction',
    name: 'Salary vs Dividend Profit Extraction Optimiser',
    slug: 'profit-extraction',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Compare salary, dividend, and mixed extraction strategies with full NIC, corporation tax, and income tax modelling.',
    description: `Model and compare profit extraction strategies for owner-managed businesses: salary only, dividend only, and optimal salary/dividend mix. Calculates the combined tax burden across corporation tax, income tax, NICs, and dividend tax.

## What You'll Learn

- Salary vs dividend tax efficiency
- Employer and employee NIC thresholds
- Corporation tax deductibility of salary
- Personal allowance and dividend allowance interaction
- Income tax bands for employment and dividend income
- NIC efficiency point calculation
- Optimal extraction strategy recommendation

> **Note:** This is an educational tool. Tax-efficient extraction depends on individual circumstances — always seek professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 'profit-extraction',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
  {
    id: 's455-calculator',
    name: 's.455 Loans to Participators Calculator',
    slug: 's455-calculator',
    toolType: 'calculator',
    category: 'owner_managed_business',
    icon: 'Calculator',
    shortDescription: 'Calculate s.455 tax on director loan accounts with bed-and-breakfast anti-avoidance checks and write-off analysis.',
    description: `Calculate s.455 CTA 2010 tax charges on loans to participators (director loan accounts). Tracks DLA balances, identifies s.464C bed-and-breakfast arrangements, computes repayment relief timing, and analyses write-off tax implications.

## What You'll Learn

- s.455 tax charge calculation (33.75% rate)
- Director loan account balance tracking
- Key compliance dates (9 months + 1 day after AP end)
- s.464C bed-and-breakfast anti-avoidance rules (30-day window)
- Repayment relief and timing
- Write-off analysis (income tax and NIC implications)
- Timeline visualisation of loan events

> **Note:** This is an educational tool based on CTA 2010 ss.455–464. Always verify with professional advice.`,
    previewImage: undefined,
    config: {
      calculatorType: 's455-calculator',
      version: '1.0',
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdBy: undefined,
    createdAt: new Date('2026-02-23'),
    updatedAt: new Date('2026-02-23'),
  },
];
