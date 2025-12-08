import type { Tool, Course, CourseTool } from '@/types';

// Seed data for tools
// This tool is added by developers for testing
// In production, tools will be managed via admin interface and stored in Supabase

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
];

export const SEED_COURSES: Course[] = [
  {
    id: 'globe-information-return',
    name: 'GloBE Information Return: Complete Filing Implementation',
    slug: 'globe-information-return',
    description: 'Master the GloBE Information Return (GIR) filing process with practical tools for ETR calculations, safe harbour assessments, and deadline tracking.',
    learnworldsUrl: 'https://mojitax.co.uk/course/globe-information-return',
    category: 'pillar_two',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
];

export const SEED_COURSE_TOOLS: Omit<CourseTool, 'id'>[] = [
  {
    courseId: 'globe-information-return',
    toolId: 'gir-globe-calculator',
    accessLevel: 'full',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-12-08'),
  },
  {
    courseId: 'globe-information-return',
    toolId: 'gir-safe-harbour-qualifier',
    accessLevel: 'full',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2024-12-08'),
  },
  {
    courseId: 'globe-information-return',
    toolId: 'gir-filing-deadline-calculator',
    accessLevel: 'full',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date('2024-12-08'),
  },
];
