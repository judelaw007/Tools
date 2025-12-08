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
];

export const SEED_COURSES: Course[] = [
  {
    id: 'pillar-two-fundamentals',
    name: 'Pillar Two Fundamentals',
    slug: 'pillar-two-fundamentals',
    description: 'Learn the basics of OECD Pillar Two global minimum tax rules including GloBE, IIR, UTPR, and QDMTT.',
    learnworldsUrl: 'https://mojitax.co.uk/course/pillar-two-fundamentals',
    category: 'pillar_two',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-12-08'),
    updatedAt: new Date('2024-12-08'),
  },
];

export const SEED_COURSE_TOOLS: Omit<CourseTool, 'id'>[] = [
  {
    courseId: 'pillar-two-fundamentals',
    toolId: 'gir-globe-calculator',
    accessLevel: 'full',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-12-08'),
  },
];
