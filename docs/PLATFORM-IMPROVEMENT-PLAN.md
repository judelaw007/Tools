# MojiTax Tools Platform — Improvement Plan

## Status: COMPLETE

All 4 steps have been implemented, tested, and deployed.

## Context

The platform provides interactive tax tools that enhance mojitax.co.uk course studies. An audit identified three gaps and one bug:

1. **Journey tracking is shallow** — only "opened" and "saved" were logged; no step-by-step progress or completion tracking
2. **Skills integration is disconnected** — `incrementToolUsage()` existed but was never called from tool components; skills only updated on save or manual sync
3. **No tool creation formula** — adding a new tool was a manual 6-step developer process with no standardised checklist
4. **Visibility bug** — unallocated tools appeared on `/tools` (public listing) and `/tools/[slug]` (as "Locked" or preview); they needed to be completely invisible

---

## Current State Summary

### 6 Implemented Tools (Pillar Two / GIR)

| Tool | Type | Purpose |
|------|------|---------|
| GloBE Calculator | calculator | 3-step Pillar Two tax calculation (ETR → SBIE → Top-up Tax) |
| Safe Harbour Qualifier | calculator | GIR safe harbour eligibility across 3 tests |
| Filing Deadline Calculator | calculator | GIR filing deadlines with milestone tracking |
| GIR Practice Form | form | Interactive practice scenarios for GIR filing |
| DFE Assessment Tool | validator | Digital Filing Environment readiness assessment |
| Audit File Checklist | form | Compliance checklist for audit file preparation |

### What Works Well

- **Course-tool allocation** — Admin can link tools to courses; access enforced via LearnWorlds enrollment intersection
- **Saved work** — Users save/load calculations per tool (database-backed with localStorage fallback)
- **Activity logging** — Login, logout, tool access, project saves, skill syncs all logged
- **Skills matrix** — Auto-detected skills + admin-defined categories with printable PDF and QR verification
- **Admin dashboards** — Tool management, course allocation, activity logs, skill configuration

### What Was Missing (Now Resolved)

- ~~No tool session concept (start → progress → complete)~~ → Fixed in Step 2: `useToolTracking` hook provides session lifecycle
- ~~No step-by-step tracking within tools~~ → Fixed in Step 2: all 6 tools instrumented with `onTrackStepChange`
- ~~`tool_usage_logs` actions never emitted from tool components~~ → Fixed in Step 2: `calculate`, `view`, `error` events fired via `/api/tools/track`
- ~~`incrementToolUsage()` defined but never called~~ → Fixed in Step 3: called on every `calculate` event
- ~~Unallocated tools visible to users~~ → Fixed in Step 1: `getAllocatedToolIds()` filters public listing, page, and API
- ~~No standardised process for creating new tools~~ → Fixed in Step 4: `docs/TOOL-CREATION-GUIDE.md`

---

## Step 1: Tool Visibility Fix (Unallocated = Invisible) — COMPLETE

**Goal**: Tools with zero active course allocations must not appear anywhere except admin panels.

### 1A. Add `getAllocatedToolIds()` to `lib/db/index.ts`

New function querying `course_tool_allocations` for tool IDs with at least one active allocation. Returns `Set<string>`.

### 1B. Filter `getPublicTools()` in `lib/db/index.ts`

After fetching active+public tools, filter to only those present in `getAllocatedToolIds()`. Apply to all code paths including seed data fallbacks.

### 1C. Guard individual tool page `app/(public)/tools/[slug]/page.tsx`

After fetching tool, check course allocations. If `courses.length === 0` and user is not admin, return `notFound()`.

### 1D. Remove public-tool bypass in `lib/learnworlds/access-control.ts`

Currently grants access to `isPublic && !isPremium` tools with zero allocations. Change to always deny access when no allocations exist.

### 1E. Guard tool API route `app/api/tools/[slug]/route.ts`

Add allocation check — return 404 for unallocated tools via API.

### 1F. Fix `getCoursesForTool()` in `lib/course-allocations.ts`

Ensure no `is_active` filters are applied (the column does not exist in the deployed database; queries that used it silently returned empty results).

**Files modified**: `lib/db/index.ts`, `app/(public)/tools/[slug]/page.tsx`, `lib/learnworlds/access-control.ts`, `app/api/tools/[slug]/route.ts`, `lib/course-allocations.ts`

---

## Step 2: Journey Tracking System — COMPLETE

**Goal**: Track every meaningful user interaction — session lifecycle, step navigation, calculations, errors, and completion — with automatic skill progression.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Tool Component (e.g. GloBE Calculator)                  │
│                                                          │
│  onTrackCalculation('etr', { etr: 12.5, status: 'low' })│
│  onTrackStepChange(1, 2)                                 │
│  onTrackError('Invalid revenue', { step: 1 })            │
│  onTrackCompletion({ netTopUp: 500000 })                 │
└──────────────────┬───────────────────────────────────────┘
                   │ (props from ToolPageClient)
                   ▼
┌──────────────────────────────────────────────────────────┐
│  useToolTracking Hook                                    │
│                                                          │
│  • Generates sessionId (crypto.randomUUID)               │
│  • Fires session_start on mount                          │
│  • Fires session_end (with duration) on unmount          │
│  • Fire-and-forget POST to /api/tools/track              │
│  • Uses keepalive: true (non-blocking)                   │
└──────────────────┬───────────────────────────────────────┘
                   │ POST /api/tools/track
                   ▼
┌──────────────────────────────────────────────────────────┐
│  /api/tools/track  (server)                              │
│                                                          │
│  Authenticated session required                          │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │ tool_usage_logs  │  │ Skills Pipeline               │   │
│  │                  │  │                                │   │
│  │ logToolUsage()   │  │ on 'calculate':               │   │
│  │ • toolId         │  │   incrementToolUsage()        │   │
│  │ • action         │  │   → user_skills table         │   │
│  │ • userEmail      │  │   → auto-level progression    │   │
│  │ • metadata       │  │                                │   │
│  │ • sessionId      │  │ on 'workflow_complete':        │   │
│  │                  │  │   incrementToolProjectCount() │   │
│  │                  │  │   → user_tool_projects table  │   │
│  └─────────────────┘  └──────────────────────────────┘   │
│                                                          │
│  Also: logActivity() for dashboard visibility            │
└──────────────────────────────────────────────────────────┘
```

### Event Taxonomy

| Event | Action | When | Skills Impact |
|-------|--------|------|---------------|
| `session_start` | `view` | Tool component mounts | None |
| `session_end` | `view` | Tool component unmounts (includes duration) | None |
| `step_change` | `view` | User navigates between steps | None |
| `calculation` | `calculate` | User runs a calculation step | `incrementToolUsage()` |
| `calculation_error` | `error` | Validation or calculation fails | None |
| `workflow_complete` | `calculate` | User completes all steps | `incrementToolUsage()` + `incrementToolProjectCount()` |

### 2A. Create `hooks/useToolTracking.ts`

Client-side React hook providing:
- `sessionId` — unique per tool mount
- `trackCalculation(stepName, metadata)` — logs `calculate` action
- `trackStepChange(fromStep, toStep)` — logs step navigation
- `trackError(errorMessage, context)` — logs errors
- `trackCompletion(metadata)` — logs workflow completion

### 2B. Create API endpoint `app/api/tools/track/route.ts`

Dual-write architecture:
1. `tool_usage_logs` via existing `logToolUsage()`
2. Skills tables via `incrementToolUsage()` (on calculate) and `incrementToolProjectCount()` (on complete)
3. `activity_logs` via `logActivity()` for dashboard visibility

All writes are non-blocking (fire-and-forget with `.catch()`).

### 2C. Define shared tracking prop types

```typescript
export interface ToolTrackingProps {
  onTrackCalculation?: (stepName: string, metadata?: Record<string, unknown>) => void;
  onTrackStepChange?: (fromStep: number, toStep: number) => void;
  onTrackError?: (errorMessage: string, context?: Record<string, unknown>) => void;
  onTrackCompletion?: (metadata?: Record<string, unknown>) => void;
}
```

### 2D. Wire into `ToolPageClient.tsx`

Instantiate `useToolTracking` and pass callbacks to all 6 tool components.

### 2E. Instrument all 6 tool components

Each tool accepts `ToolTrackingProps` and calls them at appropriate moments:

- **GloBE Calculator**: Track ETR/SBIE/TopUp calculations + step changes + final completion
- **Safe Harbour Qualifier**: Track each test evaluation + final qualification
- **Filing Deadline Calculator**: Track date calculation + milestone generation
- **GIR Practice Form**: Track scenario selection + submission
- **DFE Assessment Tool**: Track assessment completion + score
- **Audit File Checklist**: Track completion percentage + submission

**Files created**: `hooks/useToolTracking.ts`, `app/api/tools/track/route.ts`
**Files modified**: `ToolPageClient.tsx`, all 6 tool `.tsx` and `types.ts` files

---

## Step 3: Skills Auto-Wiring — COMPLETE

**Goal**: Every meaningful tool interaction automatically updates the skills matrix in real-time.

### 3A. Real-time updates via tracking API

The `/api/tools/track` endpoint (from Step 2B) handles this:
- `calculate` events → `incrementToolUsage()` → `user_skills` table with auto-levelling (1-4 = familiar, 5-14 = proficient, 15+ = expert)
- `workflow_complete` events → `incrementToolProjectCount()` → `user_tool_projects` for portfolio

### 3B. Backwards compatibility

The existing saved-work flow (`/api/user/saved-work` POST → `awardSavedWorkSkill()` + `incrementToolProjectCount()`) remains unchanged. Users get both:
- **"Tool Proficiency"** skill from calculations (evidence_type: `tool_used`)
- **"Applied Practice"** skill from saving work (evidence_type: `work_saved`)

### 3C. Reconciliation

`syncToolUsageSkills()` (manual sync endpoint) continues to work as a reconciliation mechanism. It reads from `tool_usage_logs` filtering on `['view', 'calculate']` actions — our new events are correctly picked up.

---

## Step 4: Tool Creation Formula — COMPLETE

**Goal**: Codify the process so every new tool is born with tracking, skills, and allocation correctly wired.

### Deliverable: `docs/TOOL-CREATION-GUIDE.md`

**Section 1 — Specification Template**

Required before coding:
- Tool identity: ID (kebab-case, unique), name, slug, type, category
- Descriptions: short (one-liner) + full (markdown)
- Target courses: LearnWorlds course IDs
- Workflow: numbered steps with names, inputs, outputs
- Completion criteria: what constitutes "finished"
- Save data shape: TypeScript interface
- Skill mapping: which skill category

**Section 2 — Code Structure**

```
components/tools/calculator/NewTool/
├── NewTool.tsx     — Main component with tracking + save/load props
├── index.ts        — Exports
├── types.ts        — Props (includes ToolTrackingProps), saved data types
└── utils.ts        — Calculations, validation, constants
```

**Section 3 — Component Template**

Skeleton code showing tracking prop usage, save/load pattern, step navigation.

**Section 4 — Registration Checklist**

1. [ ] Component created with 4 files
2. [ ] Tracking props wired at every calculation, step change, error, completion
3. [ ] Added to `ToolPageClient.tsx` with tracking callbacks
4. [ ] Added to `CALCULATOR_COMPONENTS` registry
5. [ ] Database record in `tools` table (status: active, is_public: true)
6. [ ] Allocated to course(s) in `course_tool_allocations`
7. [ ] Linked to skill category in `skill_category_tools`
8. [ ] Verified invisible when unallocated, visible when allocated
9. [ ] Verified `tool_usage_logs` receives events
10. [ ] Verified `user_skills` updates after calculations
11. [ ] Verified save/load works, portfolio reflects usage

---

## Implementation Order

| Phase | What | Files | Depends On |
|-------|------|-------|------------|
| 1 | Visibility fix | 5 modified | Nothing |
| 2 | Journey tracking | 2 created, ~13 modified | Nothing (parallel with 1) |
| 3 | Skills auto-wiring | 1 modified | Step 2 |
| 4 | Tool creation guide | 1 created | Steps 1-3 |

Steps 1 and 2 can be built in parallel.

---

## Verification Plan

1. **Visibility**: Unallocated tool → invisible on `/tools`, 404 on `/tools/[slug]`, absent from dashboard. Allocate → appears.
2. **Journey**: Complete GloBE Calculator → `tool_usage_logs` has session_start, step_change, calculate (x3), workflow_complete, session_end — all same sessionId.
3. **Skills**: After calculations → `user_skills` shows incrementing "Tool Proficiency" evidence_count. After completion → `user_tool_projects` has incremented project_count.
4. **Saved work**: Save → `user_saved_work` entry AND "Applied Practice" skill award.
5. **Build**: `npm run build` passes with no TypeScript errors.
