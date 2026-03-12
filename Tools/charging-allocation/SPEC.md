# T-CMA: Charging Mechanism Allocation Workbench — Specification

## Registration Data

| Field | Value |
|-------|-------|
| **ID** | T-CMA |
| **Slug** | charging-allocation |
| **Component** | ChargingAllocation |
| **Name** | Charging Mechanism Allocation Workbench |
| **Type** | Calculator |
| **Category** | Charging mechanism |
| **Sections used** | S2 (PRIMARY), S5 (Secondary) |
| **Build order** | 2 (of 5) |
| **Dependencies** | T-ETR (takes top-up tax outputs as inputs) |
| **Replaces** | N/A — new build |
| **Real-world equivalent** | OECDPillars.com IIR/UTPR Calculators; PwC Pillar Two Engine allocation tracing |

---

## Purpose

The Charging Mechanism Allocation Workbench guides students through the three-step ordering of Pillar Two collection mechanisms: QDMTT → IIR → UTPR. Students enter a simplified group structure with ownership chain, top-up tax amounts per low-taxed jurisdiction, and substance data, then observe how the allocation flows through each mechanism in sequence.

**Key design principle:** The tool makes the abstract ordering rules tangible. Students see exactly how much top-up tax each mechanism collects at each step, why QDMTT takes priority, how IIR traces through the ownership chain, and when (if ever) the UTPR backstop activates. The "what-if" capability lets students toggle jurisdiction implementation status to see all three mechanisms in action.

---

## Inputs

| Input | Type | Required | Source Article | Educational Note |
|-------|------|----------|----------------|------------------|
| Group name | Text | Yes | — | Identifies the MNE Group being assessed |
| Entities | Entity[] | Yes | Art. 2.1–2.6 | Ownership chain from UPE through IPEs to low-taxed CEs — determines IIR allocation path |
| Entity ownership % | Number | Yes | Art. 2.3 | The direct ownership percentage at each level of the chain; effective ownership is computed as the product through the chain |
| Entity parent | Reference | Yes | Art. 2.1.2 | Parent-child relationships define the IIR allocation waterfall |
| UPE / IPE / MOCE flags | Boolean | Yes | Art. 1.4 / 2.1.2 / 5.6 | UPE collects IIR first; IPEs collect if UPE jurisdiction lacks IIR; MOCEs have limited allocable share |
| Top-up tax per jurisdiction | Number | Yes | Art. 5.2 | Pre-computed top-up tax amount from the ETR Calculator (T-ETR) |
| QDMTT amount per jurisdiction | Number | Conditional | Art. 5.2.3 | Amount already collected domestically; only relevant if the jurisdiction has implemented QDMTT |
| Jurisdiction IIR / UTPR / QDMTT status | Boolean | Yes | Art. 2.1–2.6 | Determines which mechanisms apply; editable for what-if scenarios |
| Employee count per jurisdiction | Number | Yes | Art. 2.6.1 | Numerator for the UTPR employee component (50% weighting) |
| Tangible asset NBV per jurisdiction | Number | Yes | Art. 2.6.1 | Numerator for the UTPR asset component (50% weighting) |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| QDMTT offset summary | Table | Per-jurisdiction QDMTT deduction showing domestic collection before IIR/UTPR |
| IIR allocation waterfall | Table | For each low-taxed jurisdiction: collecting entity, jurisdiction, effective ownership %, IIR amount, Article reference |
| UTPR allocation schedule | Table | For each UTPR jurisdiction: employee count, employee share, tangible asset NBV, asset share, allocation %, UTPR amount |
| Non-allocable amounts | Table | For MOCE jurisdictions: portion attributable to outside shareholders (not collected by any GloBE mechanism) |
| Jurisdiction summary | Table | Per jurisdiction: top-up tax, QDMTT, IIR, UTPR, non-allocable, net liability, primary mechanism |
| Totals | Summary | Total top-up tax, total QDMTT, total IIR, total UTPR, total non-allocable |

---

## Wizard Flow

### Step 1: Group Structure

Define the ownership chain relevant to the charging mechanism. Not every entity needs to be entered — only the UPE, key IPEs in the chain, and CEs in low-taxed jurisdictions.

For each entity:
- Legal name, jurisdiction (dropdown with auto-populated IIR/UTPR/QDMTT status)
- Direct ownership percentage and parent entity
- Classification: UPE, IPE, Operating, or MOCE

**Educational note:** The IIR allocation follows the ownership chain top-down (Article 2.1). The UPE's jurisdiction applies IIR first. If the UPE jurisdiction has not implemented IIR, it cascades to Intermediate Parent Entities down the chain. The effective ownership percentage through the chain determines the allocable share.

**Validation:** At least one UPE must be designated. Ownership must be 0–100%. Every non-UPE entity must have a parent.

### Step 2: Jurisdictional Data

For each jurisdiction with entities from Step 1, enter:
- Whether it is a low-taxed jurisdiction (has top-up tax to allocate)
- Top-up tax amount (if low-taxed)
- QDMTT amount (if jurisdiction has QDMTT)
- Employee count and tangible asset NBV (for UTPR formula)
- Implementation status (IIR / UTPR / QDMTT) — pre-populated, editable for what-if scenarios

**Educational note:** The UTPR formula under Article 2.6.1 allocates residual top-up tax using a 50/50 weighting: 50% based on employee headcount and 50% based on tangible asset net book value. Only jurisdictions that have implemented the UTPR participate in the allocation. The low-taxed jurisdiction itself is excluded from the UTPR allocation base.

**Validation:** Low-taxed jurisdictions must have top-up tax > 0. QDMTT amount cannot exceed top-up tax. Employee count and tangible assets must be ≥ 0.

### Step 3: Allocation Waterfall

Displays the three-round allocation process with visual breakdown:

```
Round 1: QDMTT Offset (Article 5.2.3)
  For each low-taxed jurisdiction:
  ├── Top-up tax
  ├── Less: QDMTT collected domestically
  └── Remaining for IIR/UTPR

Round 2: IIR Allocation (Articles 2.1–2.3)
  For each remaining amount:
  ├── Trace ownership chain from CE to UPE
  ├── Find highest entity with IIR jurisdiction (top-down)
  ├── IIR = remaining × allocable share (effective ownership %)
  ├── For MOCE: allocable share < 100% → non-allocable portion identified
  └── Residual (if no IIR in chain) → passes to UTPR

Round 3: UTPR Allocation (Articles 2.4–2.6)
  For any residual top-up tax:
  ├── Sum employees and tangible assets across UTPR jurisdictions
  ├── Per jurisdiction: allocation % = 50% × (emp/total) + 50% × (assets/total)
  └── UTPR amount = residual × allocation %
```

**Educational note:** The ordering rules are mandatory: QDMTT always takes priority (domestic collection first), then IIR (top-down through ownership chain), then UTPR (backstop allocation by substance). In practice, if all low-taxed jurisdictions have QDMTT, IIR and UTPR will both be zero.

### Step 4: Results Summary

Displays the complete allocation result:
- Per-jurisdiction summary table (top-up tax → QDMTT → IIR → UTPR → non-allocable)
- Collecting entity identification for IIR
- UTPR allocation by jurisdiction
- Total group liability breakdown by mechanism
- Key insights (e.g., "All top-up tax collected via QDMTT — IIR liability to UK = €0")

---

## H&C Storyline Usage

**Scenario:** Stratos Group multi-jurisdiction top-up tax allocation (Section 2)

**Story trigger:** Preliminary ETR data arrives from local finance teams. James Wilson asks the student to analyse how top-up tax would be allocated across the group using the IIR and UTPR.

### Pre-loaded Test Data

**Group Structure (Simplified for Charging Mechanism):**

```
Stratos Holdings plc (UK, UPE) — 100%
├── SG Holdings Ltd (UK, IPE) — 100%
│   └── SG Netherlands BV (NL, IPE) — 100%
│       ├── SG Ireland Ltd (IE, IPE) — 100%
│       │   └── SG Ireland IP Ltd (IE, Operating) — 100%
│       └── SG Singapore Pte Ltd (SG, IPE) — 100%
│           ├── SG Singapore Tech Pte Ltd (SG, Operating) — 100%
│           └── SG Hong Kong Ltd (HK, Operating) — 100%
├── SG Luxembourg S.à r.l. (LU, Operating) — 100%
└── Atlas Ireland Ltd (IE, MOCE) — 28%
```

**Low-Taxed Jurisdictions (Pre-Acquisition, FY 2025):**

| Jurisdiction | Top-Up Tax (€) | QDMTT (€) | Has QDMTT? |
|---|---|---|---|
| Singapore | 198,268 | 198,268 | Yes (from 1 Jan 2025) |
| Ireland (Main Group) | 425,011 | 425,011 | Yes (from 1 Jan 2024) |
| Ireland (Atlas — MOCE 28%) | 66,720 | 66,720 | Yes (from 1 Jan 2024) |
| Luxembourg | 0 | 0 | De minimis exclusion |

**Substance Data (For UTPR Formula):**

| Jurisdiction | Employees | Tangible Assets NBV (€) | Has UTPR? |
|---|---|---|---|
| United Kingdom | 350 | 2,800,000 | Yes |
| Germany | 420 | 18,000,000 | Yes |
| France | 115 | 5,200,000 | Yes |
| Netherlands | 18 | 600,000 | Yes |
| Luxembourg | 10 | 180,000 | Yes |
| Australia | 55 | 2,200,000 | Yes |
| Japan | 45 | 1,800,000 | Yes |

**Expected Results (Base Case):**

| Mechanism | Amount (€) |
|---|---|
| Total Top-Up Tax | 689,999 |
| QDMTT collected | 689,999 |
| IIR allocated | 0 |
| UTPR allocated | 0 |
| Non-allocable | 0 |

**Result:** All top-up tax collected via QDMTT → IIR liability to UK = €0

### What-If Scenarios (Educational)

**Scenario B: No QDMTT anywhere**
- Singapore top-up tax €198,268 → IIR via UK UPE (100% ownership)
- Ireland (Main) €425,011 → IIR via UK UPE (100% ownership)
- Ireland (Atlas MOCE) €66,720 → IIR 28% = €18,682; Non-allocable 72% = €48,038
- Total IIR: €641,961; Non-allocable: €48,038

**Scenario C: No QDMTT and no IIR in UK**
- All top-up tax flows to UTPR backstop
- Allocable amount: €641,961
- Distributed across 7 UTPR jurisdictions by 50/50 employee/asset formula

### Key Teaching Points

1. **QDMTT priority:** When all low-taxed jurisdictions have QDMTT, IIR and UTPR are both zero
2. **IIR through ownership chain:** UK UPE collects for all CEs because UK has IIR and sits at the top
3. **MOCE limited allocation:** Atlas Ireland (28%) — only 28% of top-up tax is allocable to the MNE Group
4. **UTPR as genuine backstop:** Only activates when QDMTT and IIR both fail to collect
5. **50/50 UTPR formula:** Employee headcount and tangible asset NBV weighted equally

---

## Validation Rules

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Group name required | `groupName.trim().length > 0` | Please enter the MNE Group name |
| At least one UPE | `entities.some(e => e.isUPE)` | One entity must be designated as UPE |
| Ownership in range | `0 <= ownershipPercent <= 100` | Ownership must be between 0% and 100% |
| Non-UPE has parent | `!isUPE → parentEntityId !== null` | Non-UPE entities must have a parent entity |
| Low-taxed has top-up tax | `isLowTaxed → topUpTax > 0` | Low-taxed jurisdictions must have top-up tax > 0 |
| QDMTT ≤ top-up tax | `qdmmtAmount <= topUpTaxAmount` | QDMTT cannot exceed total top-up tax |
| Employee count non-negative | `employeeCount >= 0` | Employee count cannot be negative |
| Asset value non-negative | `tangibleAssetNBV >= 0` | Tangible asset NBV cannot be negative |
| At least one low-taxed jurisdiction | `jurisdictions.some(j => j.isLowTaxed)` | At least one jurisdiction must be marked as low-taxed |

---

## Registration SQL

```sql
INSERT INTO tools (
  slug, name, component, type, category, course_id,
  description, icon, sort_order, is_active
) VALUES (
  'charging-allocation',
  'Charging Mechanism Allocation Workbench',
  'ChargingAllocation',
  'calculator',
  'Charging mechanism',
  (SELECT id FROM courses WHERE slug = 'adit-pillar-two'),
  'Allocate top-up tax across the three Pillar Two collection mechanisms: QDMTT, IIR, and UTPR. Trace the IIR allocation through the ownership chain, compute UTPR using the 50/50 employee/asset formula, and visualise the ordering rules under Articles 2.1–2.6.',
  'GitMerge',
  20,
  true
);
```

---

## Tracking Callbacks

| Callback | Trigger | Metadata |
|----------|---------|----------|
| `onTrackStepChange` | User navigates between steps | `{ fromStep, toStep }` |
| `onTrackCalculation` | Allocation computed | `{ totalTopUpTax, totalQDMTT, totalIIR, totalUTPR, jurisdictionCount }` |
| `onTrackCalculation` | What-if scenario toggled | `{ scenarioName, changedJurisdiction, changedField }` |
| `onTrackCompletion` | Results step reached | `{ totalTopUpTax, totalQDMTT, totalIIR, totalUTPR, lowTaxedCount }` |
| `onTrackError` | Validation failure | `{ step, errorMessage }` |

---

## File Manifest

| File | Purpose |
|------|---------|
| `SPEC.md` | This specification |
| `types.ts` | TypeScript interfaces for all inputs, outputs, internal state |
| `utils.ts` | Pure functions, constants, jurisdiction data, H&C test scenarios |
| `ChargingAllocation.tsx` | React component with 4-step wizard, tracking callbacks |
| `index.ts` | Public exports |
