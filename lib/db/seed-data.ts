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
];
