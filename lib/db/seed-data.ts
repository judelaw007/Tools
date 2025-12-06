import type { Tool, Course, CourseTool, ToolUsageLog } from '@/types';

// Initial seed data for tools
// This is the single source of truth for tool data
// In production, this would be replaced with Supabase queries

export const SEED_TOOLS: Tool[] = [
  {
    id: 'tp-margin-calculator',
    name: 'TP Margin Calculator',
    slug: 'tp-margin-calculator',
    toolType: 'calculator',
    category: 'transfer_pricing',
    icon: 'Calculator',
    shortDescription: 'Calculate gross margins, operating margins, and markups for transfer pricing analysis.',
    description: `## TP Margin Calculator

This demo tool helps you understand how transfer pricing professionals calculate arm's length margins.

### What you'll learn:
- **Gross Profit Margin**: Revenue minus COGS, divided by revenue
- **Operating Margin**: Used in TNMM (Transactional Net Margin Method)
- **Cost Plus Markup**: Common for service providers and contract manufacturers
- **Berry Ratio**: Gross profit divided by operating expenses

### When to use each margin:
- **Gross Margin**: Resale Price Method, distribution analysis
- **Operating Margin**: TNMM, most common PLI globally
- **Cost Plus**: Contract manufacturing, intra-group services
- **Berry Ratio**: Limited-risk distributors with low operating expenses

> **Note**: This is a demonstration tool for learning purposes only. Real transfer pricing analysis requires comprehensive benchmarking studies.`,
    config: {
      inputs: [
        { name: 'revenue', label: 'Revenue', type: 'currency', required: true, placeholder: 'Enter revenue' },
        { name: 'cogs', label: 'Cost of Goods Sold', type: 'currency', required: true, placeholder: 'Enter COGS' },
        { name: 'operatingExpenses', label: 'Operating Expenses', type: 'currency', required: true, placeholder: 'Enter OpEx' },
      ],
      calculations: [
        { name: 'grossProfit', formula: 'revenue - cogs', label: 'Gross Profit', format: 'currency' },
        { name: 'grossMargin', formula: '(revenue - cogs) / revenue * 100', label: 'Gross Margin', format: 'percentage' },
        { name: 'operatingMargin', formula: '(revenue - cogs - operatingExpenses) / revenue * 100', label: 'Operating Margin', format: 'percentage' },
        { name: 'costPlusMarkup', formula: '(revenue - cogs) / cogs * 100', label: 'Cost Plus Markup', format: 'percentage' },
        { name: 'berryRatio', formula: '(revenue - cogs) / operatingExpenses', label: 'Berry Ratio', format: 'decimal', precision: 2 },
      ],
      educationalNotes: {
        grossMargin: 'Gross margin shows profitability before operating costs. Used in Resale Price Method.',
        operatingMargin: 'Operating margin (or net cost plus) is the primary PLI for TNMM.',
        berryRatio: 'Berry ratio compares gross profit to operating expenses. Useful for distributors.',
      },
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'vat-calculator',
    name: 'VAT Calculator',
    slug: 'vat-calculator',
    toolType: 'calculator',
    category: 'vat',
    icon: 'Calculator',
    shortDescription: 'Calculate VAT amounts and gross/net values for any VAT rate.',
    description: `## VAT Calculator

A simple but essential tool for understanding VAT calculations.

### Features:
- Calculate VAT from net amount
- Reverse calculate net from gross (VAT inclusive) amount
- Support for any VAT rate
- Common UK rates pre-configured

### VAT Rates Reference:
- **Standard Rate**: 20% (most goods and services)
- **Reduced Rate**: 5% (home energy, child car seats)
- **Zero Rate**: 0% (food, children's clothing, books)

> **Learning Tip**: Understanding when to use inclusive vs exclusive calculations is crucial for VAT compliance.`,
    config: {
      inputs: [
        { name: 'amount', label: 'Amount', type: 'currency', required: true, placeholder: 'Enter amount' },
        { name: 'vatRate', label: 'VAT Rate (%)', type: 'percentage', required: true, defaultValue: 20 },
        {
          name: 'calculationType',
          label: 'Calculation Type',
          type: 'select',
          required: true,
          options: [
            { value: 'exclusive', label: 'Add VAT to amount (exclusive)' },
            { value: 'inclusive', label: 'Extract VAT from amount (inclusive)' },
          ],
        },
      ],
      calculations: [
        { name: 'vatAmount', formula: 'calculationType === "exclusive" ? amount * (vatRate / 100) : amount - (amount / (1 + vatRate / 100))', label: 'VAT Amount', format: 'currency' },
        { name: 'netAmount', formula: 'calculationType === "exclusive" ? amount : amount / (1 + vatRate / 100)', label: 'Net Amount', format: 'currency' },
        { name: 'grossAmount', formula: 'calculationType === "exclusive" ? amount * (1 + vatRate / 100) : amount', label: 'Gross Amount', format: 'currency' },
      ],
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'vat-rate-lookup',
    name: 'VAT Rate Lookup',
    slug: 'vat-rate-lookup',
    toolType: 'search',
    category: 'vat',
    icon: 'Search',
    shortDescription: 'Search and compare VAT rates across different countries and regions.',
    description: `## VAT Rate Lookup

Search and compare VAT/GST rates from around the world.

### Data Includes:
- Standard VAT/GST rates
- Reduced rates where applicable
- Special categories (zero-rated, exempt)
- Effective dates

### Use Cases:
- Cross-border transaction planning
- E-commerce VAT compliance
- Supply chain optimization`,
    config: {
      dataSource: 'ref_vat_rates',
      searchableFields: ['countryName', 'countryCode'],
      displayFields: [
        { field: 'countryName', label: 'Country' },
        { field: 'standardRate', label: 'Standard Rate', format: 'percentage' },
        { field: 'reducedRates', label: 'Reduced Rates' },
      ],
      filters: [
        { name: 'region', label: 'Region', type: 'select', options: [
          { value: 'eu', label: 'European Union' },
          { value: 'europe_non_eu', label: 'Non-EU Europe' },
          { value: 'americas', label: 'Americas' },
          { value: 'asia_pacific', label: 'Asia-Pacific' },
          { value: 'africa', label: 'Africa & Middle East' },
        ]},
      ],
      defaultSort: { field: 'countryName', direction: 'asc' },
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: 'eu-vat-validator',
    name: 'EU VAT Number Validator',
    slug: 'eu-vat-validator',
    toolType: 'validator',
    category: 'vat',
    icon: 'CheckCircle',
    shortDescription: 'Validate EU VAT numbers and check their format and structure.',
    description: `## EU VAT Number Validator

Validate EU VAT identification numbers for format compliance.

### Features:
- Format validation for all EU member states
- Country-specific pattern checking
- Batch validation support
- Educational explanations of each country's format

### Supported Countries:
All 27 EU member states including AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE.

> **Note**: This validates format only. For VIES verification (checking if the number is actually registered), use the official EU VIES service.`,
    config: {
      validationRules: [
        { type: 'format', pattern: '^[A-Z]{2}[0-9A-Z]+$', message: 'VAT number must start with 2-letter country code' },
      ],
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'giin-search',
    name: 'GIIN Search Demo',
    slug: 'giin-search',
    toolType: 'search',
    category: 'fatca_crs',
    icon: 'Search',
    shortDescription: 'Search the IRS FATCA GIIN database for registered financial institutions.',
    description: `## GIIN Search Demo

Search for Global Intermediary Identification Numbers (GIINs) in the IRS FATCA database.

### What is a GIIN?
A GIIN is a unique identification number assigned to foreign financial institutions (FFIs) that register with the IRS for FATCA compliance.

### Use Cases:
- Verify counterparty FATCA status
- Due diligence on financial institutions
- Compliance documentation`,
    config: {
      dataSource: 'ref_giin_database',
      searchableFields: ['fiName', 'giin', 'country'],
      displayFields: [
        { field: 'fiName', label: 'Institution Name' },
        { field: 'giin', label: 'GIIN' },
        { field: 'country', label: 'Country' },
        { field: 'fiType', label: 'FI Type' },
      ],
      defaultSort: { field: 'fiName', direction: 'asc' },
    },
    status: 'draft',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'treaty-rate-search',
    name: 'Treaty Rate Search',
    slug: 'treaty-rate-search',
    toolType: 'search',
    category: 'withholding_tax',
    icon: 'Search',
    shortDescription: 'Search withholding tax rates under double tax treaties between countries.',
    description: `## Treaty Rate Search

Look up withholding tax rates under double taxation agreements.

### Data Includes:
- Dividend withholding rates
- Interest withholding rates
- Royalty withholding rates
- Treaty article references

### Use Cases:
- Cross-border payment planning
- Treaty benefit analysis
- Withholding tax optimization`,
    config: {
      dataSource: 'ref_treaty_rates',
      searchableFields: ['sourceCountry', 'targetCountry'],
      displayFields: [
        { field: 'sourceCountry', label: 'Source Country' },
        { field: 'targetCountry', label: 'Residence Country' },
        { field: 'dividendRate', label: 'Dividends', format: 'percentage' },
        { field: 'interestRate', label: 'Interest', format: 'percentage' },
        { field: 'royaltyRate', label: 'Royalties', format: 'percentage' },
      ],
      defaultSort: { field: 'sourceCountry', direction: 'asc' },
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'hmrc-vat-registration',
    name: 'HMRC VAT Registration',
    slug: 'hmrc-vat-registration',
    toolType: 'external-link',
    category: 'vat',
    icon: 'ExternalLink',
    shortDescription: 'Link to the official HMRC VAT registration portal.',
    description: `## HMRC VAT Registration Portal

Direct link to the official HMRC VAT registration service.`,
    config: {
      url: 'https://www.gov.uk/vat-registration',
      openInNewTab: true,
      warningMessage: 'You are leaving MojiTax to visit an official government website.',
      relatedTools: ['vat-calculator', 'vat-rate-lookup'],
    },
    status: 'active',
    isPublic: true,
    isPremium: false,
    version: '1.0',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: 'tp-method-guide',
    name: 'TP Method Selector',
    slug: 'tp-method-guide',
    toolType: 'reference',
    category: 'transfer_pricing',
    icon: 'BookOpen',
    shortDescription: 'Interactive guide to selecting the most appropriate transfer pricing method.',
    description: `## Transfer Pricing Method Selector

An interactive guide to help you understand which TP method is most appropriate for different transaction types.`,
    config: {
      content: [
        { id: 'intro', title: 'Introduction', content: 'Overview of the five OECD-approved transfer pricing methods.' },
        { id: 'cup', title: 'CUP Method', content: 'Comparable Uncontrolled Price method details.' },
        { id: 'rpm', title: 'Resale Price Method', content: 'Resale Price Method for distribution transactions.' },
        { id: 'cpm', title: 'Cost Plus Method', content: 'Cost Plus Method for manufacturing and services.' },
        { id: 'tnmm', title: 'TNMM', content: 'Transactional Net Margin Method overview.' },
        { id: 'psm', title: 'Profit Split', content: 'Profit Split Method for integrated operations.' },
      ],
    },
    status: 'active',
    isPublic: true,
    isPremium: true,
    version: '1.0',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
];

// Seed courses data
export const SEED_COURSES: Course[] = [
  {
    id: 'tp-fundamentals',
    name: 'Transfer Pricing Fundamentals',
    slug: 'tp-fundamentals',
    description: 'Learn the basics of transfer pricing, including key concepts, methods, and documentation requirements.',
    learnworldsUrl: 'https://mojitax.co.uk/course/transfer-pricing-fundamentals',
    category: 'transfer_pricing',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'tp-advanced',
    name: 'Transfer Pricing Advanced',
    slug: 'tp-advanced',
    description: 'Advanced transfer pricing topics including complex transactions and dispute resolution.',
    learnworldsUrl: 'https://mojitax.co.uk/course/transfer-pricing-advanced',
    category: 'transfer_pricing',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'vat-masterclass',
    name: 'VAT Compliance Masterclass',
    slug: 'vat-masterclass',
    description: 'Comprehensive VAT training covering UK and EU regulations.',
    learnworldsUrl: 'https://mojitax.co.uk/course/vat-masterclass',
    category: 'vat',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'fatca-essentials',
    name: 'FATCA Essentials',
    slug: 'fatca-essentials',
    description: 'Essential training on FATCA compliance and reporting requirements.',
    learnworldsUrl: 'https://mojitax.co.uk/course/fatca-essentials',
    category: 'fatca_crs',
    displayOrder: 4,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Seed course-tool mappings
export const SEED_COURSE_TOOLS: Omit<CourseTool, 'id'>[] = [
  // TP Fundamentals includes TP tools
  { courseId: 'tp-fundamentals', toolId: 'tp-margin-calculator', accessLevel: 'full', displayOrder: 1, isActive: true, createdAt: new Date() },
  { courseId: 'tp-fundamentals', toolId: 'tp-method-guide', accessLevel: 'full', displayOrder: 2, isActive: true, createdAt: new Date() },

  // TP Advanced includes all TP tools
  { courseId: 'tp-advanced', toolId: 'tp-margin-calculator', accessLevel: 'full', displayOrder: 1, isActive: true, createdAt: new Date() },
  { courseId: 'tp-advanced', toolId: 'tp-method-guide', accessLevel: 'full', displayOrder: 2, isActive: true, createdAt: new Date() },
  { courseId: 'tp-advanced', toolId: 'treaty-rate-search', accessLevel: 'full', displayOrder: 3, isActive: true, createdAt: new Date() },

  // VAT Masterclass includes VAT tools
  { courseId: 'vat-masterclass', toolId: 'vat-calculator', accessLevel: 'full', displayOrder: 1, isActive: true, createdAt: new Date() },
  { courseId: 'vat-masterclass', toolId: 'vat-rate-lookup', accessLevel: 'full', displayOrder: 2, isActive: true, createdAt: new Date() },
  { courseId: 'vat-masterclass', toolId: 'eu-vat-validator', accessLevel: 'full', displayOrder: 3, isActive: true, createdAt: new Date() },
  { courseId: 'vat-masterclass', toolId: 'hmrc-vat-registration', accessLevel: 'full', displayOrder: 4, isActive: true, createdAt: new Date() },

  // FATCA Essentials includes FATCA tools
  { courseId: 'fatca-essentials', toolId: 'giin-search', accessLevel: 'full', displayOrder: 1, isActive: true, createdAt: new Date() },
];
