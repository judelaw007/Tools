# Tool Creation Guide

How to add a new interactive tool to the MojiTax Tools Platform with tracking, skills, and course allocation correctly wired from day one.

---

## 1. Tool Specification

Before writing code, define the following:

| Field | Example | Notes |
|---|---|---|
| **ID** | `gir-globe-calculator` | Kebab-case, globally unique |
| **Name** | `GloBE Calculator` | Display name shown to users |
| **Slug** | `globe-calculator` | URL path segment (`/tools/globe-calculator`) |
| **Tool Type** | `calculator` | One of: `calculator`, `search`, `validator`, `generator`, `tracker`, `reference`, `external-link`, `spreadsheet`, `form` |
| **Category** | `pillar_two` | One of: `transfer_pricing`, `vat`, `fatca_crs`, `withholding_tax`, `pillar_two`, `pe_assessment`, `cross_category` |
| **Target Course(s)** | `pillar-two-fundamentals` | LearnWorlds course ID(s) for allocation |
| **Workflow Steps** | 3 steps: ETR, SBIE, Top-up | Numbered with names, inputs, and outputs |
| **Completion Criteria** | Final step calculated | What triggers `onTrackCompletion` |
| **Saved Data Shape** | `SavedCalculation` | TypeScript interface for persisted data |

---

## 2. Folder Structure

Create a new folder under `components/tools/calculator/`:

```
components/tools/calculator/NewTool/
  NewTool.tsx      # Main component
  types.ts         # TypeScript interfaces
  utils.ts         # Calculations, constants, helpers
  index.ts         # Public exports
```

---

## 3. Types File

`types.ts` must define:

1. **Step/domain data interfaces** — inputs and results for each workflow step
2. **Saved data interface** — shape persisted to `user_saved_work` (must include `id` and `updatedAt`)
3. **Component props interface** — includes save/delete/tracking callbacks

```typescript
// types.ts

// Step data
export interface Step1Data {
  inputA: number;
  inputB: string;
}

export interface Step1Result {
  output: number;
  status: 'PASS' | 'FAIL';
}

// Saved data — MUST have id + updatedAt
export interface SavedNewToolData {
  id: string;
  name: string;
  step1: Step1Data;
  result: Step1Result | null;
  updatedAt: Date;
}

// Component props
export interface NewToolProps {
  userId?: string;
  onSave?: (data: Omit<SavedNewToolData, 'id' | 'updatedAt'>) => Promise<string>;
  onDelete?: (id: string) => Promise<void>;
  savedItems?: SavedNewToolData[];
  // Tracking props — all optional, tool works without them
  onTrackCalculation?: (stepName: string, metadata?: Record<string, unknown>) => void;
  onTrackStepChange?: (fromStep: number | string, toStep: number | string) => void;
  onTrackError?: (errorMessage: string, context?: Record<string, unknown>) => void;
  onTrackCompletion?: (metadata?: Record<string, unknown>) => void;
}
```

**Convention**: The `onTrackStepChange` prop is only needed for multi-step tools. Single-step tools can omit it.

---

## 4. Utils File

`utils.ts` contains pure functions and constants. No React, no side effects.

```typescript
// utils.ts

export const MIN_THRESHOLD = 15.0;

export function calculateResult(a: number, b: number): number {
  return a * b;
}

export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
```

---

## 5. Main Component

`NewTool.tsx` — the `'use client'` component rendered inside `ToolPageClient`.

### Tracking Integration Points

Call tracking callbacks at these moments:

| Event | When | Callback |
|---|---|---|
| **Calculation** | User completes a calculation step | `onTrackCalculation?.('Step Name', { key: value })` |
| **Step change** | User navigates between steps | `onTrackStepChange?.(fromStep, toStep)` |
| **Error** | Validation fails or calculation errors | `onTrackError?.('message', { context })` |
| **Completion** | User finishes the entire workflow | `onTrackCompletion?.({ summary: data })` |

### Component Skeleton

```typescript
// NewTool.tsx
'use client';

import React, { useState } from 'react';
import type { NewToolProps, Step1Data, Step1Result } from './types';
import { calculateResult, formatCurrency } from './utils';

export function NewTool({
  userId,
  onSave,
  onDelete,
  savedItems = [],
  onTrackCalculation,
  onTrackStepChange,
  onTrackError,
  onTrackCompletion,
}: NewToolProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [data, setData] = useState<Step1Data>({ inputA: 0, inputB: '' });
  const [result, setResult] = useState<Step1Result | null>(null);

  // Step navigation with tracking
  const goToStep = (step: number) => {
    onTrackStepChange?.(activeStep, step);
    setActiveStep(step);
  };

  // Calculation with tracking
  const handleCalculate = () => {
    try {
      if (!data.inputA) {
        onTrackError?.('Input A is required', { step: activeStep });
        return;
      }

      const output = calculateResult(data.inputA, 2);
      const calcResult: Step1Result = {
        output,
        status: output > 100 ? 'PASS' : 'FAIL',
      };
      setResult(calcResult);

      // Track the calculation
      onTrackCalculation?.('Step 1 Calculation', {
        output: calcResult.output,
        status: calcResult.status,
      });

      // If this is the final step, track completion
      if (activeStep === totalSteps) {
        onTrackCompletion?.({
          finalOutput: calcResult.output,
          status: calcResult.status,
        });
      }
    } catch (err) {
      onTrackError?.('Unexpected calculation error', { step: activeStep });
    }
  };

  return (
    <div>
      {/* Render steps, inputs, results, saved items UI */}
    </div>
  );
}

export default NewTool;
```

---

## 6. Index File

```typescript
// index.ts
export { NewTool, default } from './NewTool';
export type { NewToolProps, SavedNewToolData } from './types';
```

---

## 7. Registration Checklist

After creating the component files, register the tool in these locations:

### 7.1 Calculator Registry

**File**: `components/tools/calculator/index.ts`

Add exports and register in `CALCULATOR_COMPONENTS`:

```typescript
// Add exports
export { NewTool } from './NewTool';
export type { NewToolProps, SavedNewToolData } from './NewTool';

// Add to imports
import { NewTool } from './NewTool';

// Add to CALCULATOR_COMPONENTS
export const CALCULATOR_COMPONENTS: Record<string, ComponentType<any>> = {
  // ... existing tools
  'new-tool-id': NewTool,
  'new-tool-slug': NewTool, // alias for slug-based lookup
};
```

### 7.2 ToolPageClient

**File**: `components/tools/ToolPageClient.tsx`

Add the import, type import, and render block:

```typescript
// 1. Import component and saved type
import { NewTool } from '@/components/tools/calculator/NewTool';
import type { SavedNewToolData } from '@/components/tools/calculator/NewTool';

// 2. Add to SavedItemData union
type SavedItemData = SavedCalculation | ... | SavedNewToolData;

// 3. Add render block (inside the calculator section)
if (tool.id === 'new-tool-id' || tool.slug === 'new-tool-slug') {
  return (
    <>
      {errorBanner}
      <NewTool
        userId={userEmail}
        onSave={handleSave as (data: Omit<SavedNewToolData, 'id' | 'updatedAt'>) => Promise<string>}
        onDelete={handleDelete}
        savedItems={savedItems as SavedNewToolData[]}
        onTrackCalculation={tracking.trackCalculation}
        onTrackStepChange={tracking.trackStepChange}
        onTrackError={tracking.trackError}
        onTrackCompletion={tracking.trackCompletion}
      />
    </>
  );
}
```

### 7.3 Database Record

Insert a tool record into the `tools` table. Use the admin panel or SQL:

```sql
INSERT INTO tools (
  id, name, slug, tool_type, category, icon,
  short_description, description,
  status, is_public, is_premium, version,
  config, created_at, updated_at
) VALUES (
  'new-tool-id',
  'New Tool Name',
  'new-tool-slug',
  'calculator',
  'pillar_two',
  'Calculator',
  'Short description for tool cards.',
  'Full markdown description for the tool detail page.',
  'active',
  true,
  false,
  '1.0',
  '{"calculatorType": "new-tool", "version": "1.0"}',
  NOW(),
  NOW()
);
```

Or add to `lib/db/seed-data.ts` for development:

```typescript
{
  id: 'new-tool-id',
  name: 'New Tool Name',
  slug: 'new-tool-slug',
  toolType: 'calculator',
  category: 'pillar_two',
  icon: 'Calculator',
  shortDescription: 'Short description for tool cards.',
  description: `Full markdown description.`,
  previewImage: undefined,
  config: { calculatorType: 'new-tool', version: '1.0' },
  status: 'active',
  isPublic: true,
  isPremium: false,
  version: '1.0',
  createdBy: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
},
```

### 7.4 Course Allocation

**Critical**: Unallocated tools are invisible to all non-admin users. Allocate to at least one course:

```sql
INSERT INTO course_tool_allocations (course_id, tool_id, access_level, display_order)
VALUES ('target-course-id', 'new-tool-id', 'full', 1);
```

Or use the admin panel at `/admin/courses` to allocate tools to courses.

### 7.5 Skill Category Mapping (Optional)

If the tool should contribute to a specific skill category for the portfolio system:

```sql
INSERT INTO skill_category_tools (skill_category_id, tool_id)
VALUES ('pillar-two-skills', 'new-tool-id');
```

---

## 8. How Tracking Works End-to-End

Understanding the full tracking pipeline helps you instrument correctly:

```
User clicks "Calculate"
  -> NewTool.tsx calls onTrackCalculation('Step 1', { etr: 12.5 })
    -> ToolPageClient passes tracking.trackCalculation
      -> useToolTracking hook fires POST /api/tools/track
        -> API endpoint:
           1. logToolUsage() -> writes to tool_usage_logs table
           2. incrementToolUsage() -> updates user_skills table
              (1-4 uses = familiar, 5-14 = proficient, 15+ = expert)
           3. logActivity() -> writes to activity dashboard

User completes workflow
  -> NewTool.tsx calls onTrackCompletion({ finalResult: 42 })
    -> Hook sends calculate action with event: 'workflow_complete'
      -> API endpoint additionally calls:
           incrementToolProjectCount() -> updates user_tool_projects
```

**Session lifecycle** (handled automatically by the hook):
- `session_start` fires on component mount
- `session_end` fires on component unmount (with duration in seconds)
- All events share the same `sessionId` (UUID generated per mount)

**All tracking is fire-and-forget** — failures are silently caught to never block the user.

---

## 9. Verification Checklist

After completing all registration steps, verify:

- [ ] `npm run build` passes with no TypeScript errors
- [ ] Tool is **invisible** on `/tools` when not allocated to any course
- [ ] Tool **appears** on `/tools` after allocating to a course
- [ ] Tool page loads at `/tools/[slug]` for enrolled users
- [ ] Tool returns 404 at `/tools/[slug]` for non-enrolled, non-admin users
- [ ] Admin can see the tool regardless of allocation status
- [ ] Performing a calculation writes to `tool_usage_logs` (check Supabase)
- [ ] `user_skills` row is created/incremented after calculations
- [ ] Completing the workflow increments `user_tool_projects`
- [ ] Save/load works — data persists across page refreshes
- [ ] Activity dashboard shows tool usage events

---

## 10. Existing Tools Reference

Current tools and their IDs for reference:

| Tool | ID | Slug | Steps |
|---|---|---|---|
| GloBE Calculator | `gir-globe-calculator` | `globe-calculator` | 3 (ETR, SBIE, Top-up) |
| Safe Harbour Qualifier | `gir-safe-harbour-qualifier` | `safe-harbour-qualifier` | 1 (Assessment) |
| Filing Deadline Calculator | `gir-filing-deadline-calculator` | `filing-deadline-calculator` | 1 (Date calc) |
| GIR Practice Form | `gir-practice-form` | `gir-practice-form` | 3 (Sections 1-3) |
| DFE Assessment Tool | `gir-dfe-assessment` | `dfe-assessment-tool` | 2 (Input, Results) |
| Audit File Checklist | `gir-audit-file-checklist` | `audit-file-checklist` | 3 (Modes) |

All tools live in `components/tools/calculator/` and follow the same 4-file structure described above.
