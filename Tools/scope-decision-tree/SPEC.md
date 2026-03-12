# T-SDT: Scope Determination Decision Tree — Specification

## Registration Data

| Field | Value |
|-------|-------|
| **ID** | T-SDT |
| **Slug** | scope-decision-tree |
| **Component** | ScopeDecisionTree |
| **Name** | Scope Determination Decision Tree |
| **Type** | Form / decision tree |
| **Category** | Scope & classification |
| **Sections used** | S1 (PRIMARY) |
| **Build order** | 1 (of 5) |
| **Dependencies** | None — entry point tool |
| **Replaces** | DFEAssessmentTool (retired — taught incorrect scoring-based mental model) |
| **Real-world equivalent** | HMRC MTT/DTT Manual scope guidance (MTT01100+); OECD Model Rules Article 1.1–1.5 flowcharts |

---

## Purpose

The Scope Determination Decision Tree guides students through the Article 1.1–1.5 analytical framework to determine whether an MNE Group falls within the GloBE Rules. Unlike the retired DFEAssessmentTool (which used a weighted scoring algorithm), this tool follows the actual legal determination process: a series of binary tests with defined Article references at each decision point.

**Key design principle:** Every output is a legal determination (yes/no), not a score. Students learn to think in terms of "does this entity meet the Article 1.5.1(a) criteria?" rather than "what score does this entity get?"

---

## Inputs

| Input | Type | Required | Source Article | Educational Note |
|-------|------|----------|----------------|------------------|
| Group name | Text | Yes | — | Identifies the MNE Group being assessed |
| UPE jurisdiction | Dropdown | Yes | Art. 1.4 | The jurisdiction of the Ultimate Parent Entity determines which IIR applies first |
| Reporting currency | Dropdown | Yes | Art. 1.1.1 | Groups not reporting in EUR must convert; the threshold is always tested in EUR |
| Accounting standard | Dropdown | Yes | Art. 3.1 | GloBE starts from Consolidated Financial Statements — the standard determines the starting point |
| Fiscal year end | Text | Yes | Art. 1.1.1 | Determines the 4-year lookback window |
| Testing fiscal year | Number | Yes | Art. 1.1.1 | The fiscal year being assessed for scope |
| Revenue history (4 years) | Number[] | Yes | Art. 1.1.1 | Consolidated revenue in local currency for each of the 4 preceding fiscal years |
| Exchange rates (4 years) | Number[] | Conditional | Art. 1.1.1 | Required if reporting currency ≠ EUR; annual average EUR exchange rates |
| Entity list | Entity[] | Yes | Art. 1.2–1.5 | All entities in the consolidation perimeter plus potential excluded entities |
| Ownership percentages | Number[] | Yes | Art. 1.2.1 | Determines CE status and MOCE classification (< 30%) |
| Entity classifications | Enum[] | Yes | Art. 1.5 | Government, NPO, pension fund, investment fund, REIV, or standard CE |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| In-scope determination | Boolean | YES if ≥ 2 of 4 preceding FYs have consolidated revenue ≥ €750M |
| Revenue threshold detail | Table | Year-by-year EUR revenue with threshold status |
| Constituent Entity list | Entity[] | All entities classified as CEs under Article 1.2 |
| CE count | Number | Total Constituent Entities |
| Jurisdiction count | Number | Unique jurisdictions with CEs |
| UPE identification | Entity | The Ultimate Parent Entity (Article 1.4) |
| DFE identification | Entity | The Designated Filing Entity (defaults to UPE) |
| Excluded Entity list | Entity[] | Entities excluded under Article 1.5 with specific reason and Article reference |
| Out of Scope list | Entity[] | Entities outside GloBE scope (equity method, not consolidated) with rationale |

---

## Decision Tree Flow

### Step 1: Group Information

Collect MNE Group identification data. No decisions made at this step.

**Validation:** Group name, UPE jurisdiction, and testing fiscal year are required.

### Step 2: Revenue Threshold Test (Article 1.1.1)

```
For each of the 4 fiscal years immediately preceding the testing FY:
  ├── Revenue in local currency × exchange rate = Revenue in EUR
  ├── Revenue EUR ≥ €750,000,000? → YES / NO
  │
  └── Count years with YES
      ├── ≥ 2 years → IN SCOPE → proceed to Step 3
      └── < 2 years → NOT IN SCOPE → show result (no further steps needed)
```

**Educational note:** The €750M threshold is tested in EUR regardless of the group's reporting currency. The OECD Model Rules specify the annual average exchange rate published by the central bank of the UPE jurisdiction. For GBP→EUR, ECB annual average rates are used.

**Validation:** All 4 revenue amounts must be entered. If currency ≠ EUR, exchange rates are required.

### Step 3: Entity Register

Add all entities within the consolidation perimeter. For each entity:
- Legal name and jurisdiction
- Ownership percentage and parent entity
- Whether it is the UPE
- Whether it is a Permanent Establishment (and of which entity)

**Educational note:** Article 1.2 defines Constituent Entities broadly — any entity included in the Consolidated Financial Statements, plus entities excluded solely on size or materiality grounds. PEs in a different jurisdiction from their head office are treated as separate CEs (Article 1.3.1).

**Validation:** At least one entity must be marked as UPE. Ownership percentages must be 0–100.

### Step 4: Entity Classification (Articles 1.2–1.5)

For each entity, determine its classification:

```
Entity
├── Is it consolidated (or excluded only on size/materiality)?
│   ├── YES → Constituent Entity
│   │   ├── Is ownership < 30%? → MOCE (Article 5.6)
│   │   ├── Is it a PE in a different jurisdiction? → PE (Article 1.3.1)
│   │   ├── Is it a Tax Transparent Entity? → TTE (Article 3.5)
│   │   ├── Is it an Intermediate Parent Entity? → IPE (Article 2.1.2)
│   │   └── Otherwise → Standard CE / Operating subsidiary
│   │
│   └── Does it qualify as an Excluded Entity? (Article 1.5)
│       ├── Government Entity (Art. 1.5.1(a)) → EXCLUDED
│       ├── International Organisation (Art. 1.5.1(b)) → EXCLUDED
│       ├── Non-profit Organisation (Art. 1.5.1(c)) → EXCLUDED
│       ├── Pension Fund (Art. 1.5.1(d)) → EXCLUDED
│       ├── Investment Fund that is UPE (Art. 1.5.1(e)) → EXCLUDED
│       └── REIV that is UPE (Art. 1.5.1(f)) → EXCLUDED
│
└── NO → Out of Scope
    ├── Equity method investment (not consolidated, < controlling interest)
    └── Not part of consolidated group
```

**Educational note:** Excluded Entity status is mandatory, not elective. If an entity meets the Article 1.5 criteria, it must be excluded — the group cannot choose to include it. However, entities held by an Excluded Entity that are themselves not excluded remain in scope.

**Validation:** Every entity must have a classification before proceeding.

### Step 5: Results Summary

Display the complete scope determination:
- In-scope / Not in scope banner
- Revenue threshold summary with year-by-year detail
- CE list with jurisdiction grouping and count
- Excluded Entity list with Article references
- Out of Scope list with rationale
- UPE and DFE identification

---

## H&C Storyline Usage

**Scenario:** Stratos Group initial scope assessment (Section 1)

**Story trigger:** Year-end FY 2024. James Wilson assigns the student Stratos's first-ever Pillar Two scope assessment. The group has never assessed whether it falls within the GloBE Rules.

### Pre-loaded Test Data

**Group Information:**
- Group name: Stratos Holdings plc
- UPE jurisdiction: United Kingdom
- Reporting currency: GBP
- Accounting standard: IFRS
- Fiscal year end: 31 December
- Testing fiscal year: 2025

**Revenue Threshold:**

| FY | Revenue (GBP) | EUR/GBP Rate | Revenue (EUR) | ≥ €750M? |
|----|---------------|--------------|---------------|----------|
| 2021 | £625,400,000 | 1.1630 | €727,340,200 | No |
| 2022 | £679,800,000 | 1.1729 | €797,349,420 | Yes |
| 2023 | £744,600,000 | 1.1499 | €856,195,540 | Yes |
| 2024 | £819,500,000 | 1.1453 | €938,563,500 | Yes |

**Result:** 3 of 4 years exceed €750M → **IN SCOPE**

**Entity Register:** 23 entities (19 CEs + 2 Excluded + 2 Out of Scope)

**Expected Outputs:**
- In-scope: YES
- CEs: 19
- Jurisdictions: 12 (UK, Germany, France, Belgium, Netherlands, Ireland, Singapore, Hong Kong, USA, Australia, Japan, Luxembourg)
- Excluded: 2 (SG Pension Trustees Ltd — pension fund; Stratos Foundation — NPO)
- Out of Scope: 2 (Asian Technology JV — 40% equity method; Singapore Gov JV — 49% equity method)
- UPE: Stratos Holdings plc
- DFE: Stratos Holdings plc

### Key Teaching Points from H&C Scenario

1. **Currency conversion:** Students must convert GBP revenue to EUR — the threshold is always in EUR
2. **Belgium PE:** A branch of SG France SAS must be identified as a separate CE because it is in a different jurisdiction (Belgium ≠ France)
3. **Pension fund exclusion:** SG Pension Trustees Ltd meets Art. 1.5.1(d) — students must identify the correct Article
4. **NPO exclusion:** Stratos Foundation meets Art. 1.5.1(c) — students must verify charity registration
5. **Equity method JVs:** Asian Technology JV (40%) and Singapore Gov JV (49%) are not consolidated — students must correctly exclude them
6. **MOCE identification:** Atlas Ireland Ltd (28%) is a CE but qualifies as MOCE under Article 5.6 (< 30% ownership)
7. **UPE determination:** Stratos Holdings plc is at the top of the ownership chain and prepares consolidated financial statements

---

## Validation Rules

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Group name required | `groupName.trim().length > 0` | Please enter the MNE Group name |
| UPE jurisdiction required | `upeJurisdiction !== ''` | Please select the UPE jurisdiction |
| Testing FY valid | `testingFiscalYear >= 2024` | Testing fiscal year must be 2024 or later |
| Revenue amounts positive | `revenueLocal >= 0` for each year | Revenue cannot be negative |
| Exchange rates positive | `exchangeRate > 0` if currency ≠ EUR | Exchange rate must be greater than zero |
| At least one UPE | `entities.some(e => e.isUPE)` | One entity must be designated as UPE |
| Ownership in range | `0 <= ownershipPercent <= 100` | Ownership must be between 0% and 100% |
| All entities classified | `entities.every(e => e.classification.status !== 'UNCLASSIFIED')` | All entities must be classified |
| PE jurisdiction differs | PE jurisdiction ≠ head office jurisdiction | A PE is only a separate CE if in a different jurisdiction |

---

## Registration SQL

```sql
INSERT INTO tools (
  slug, name, component, type, category, course_id,
  description, icon, sort_order, is_active
) VALUES (
  'scope-decision-tree',
  'Scope Determination Decision Tree',
  'ScopeDecisionTree',
  'form',
  'Scope & classification',
  (SELECT id FROM courses WHERE slug = 'adit-pillar-two'),
  'Determine whether an MNE Group falls within the GloBE Rules under Articles 1.1–1.5. Tests the €750M revenue threshold, identifies Constituent Entities, classifies Excluded Entities, and confirms the Ultimate Parent Entity.',
  'GitBranch',
  10,
  true
);
```

---

## Tracking Callbacks

| Callback | Trigger | Metadata |
|----------|---------|----------|
| `onTrackStepChange` | User navigates between steps | `{ fromStep, toStep }` |
| `onTrackCalculation` | Revenue threshold calculated | `{ yearsExceeding, inScope, totalEntities }` |
| `onTrackCalculation` | Entity classified | `{ entityName, classification, articleRef }` |
| `onTrackCompletion` | Results step reached | `{ inScope, ceCount, excludedCount, jurisdictionCount }` |
| `onTrackError` | Validation failure | `{ step, errorMessage }` |

---

## File Manifest

| File | Purpose |
|------|---------|
| `SPEC.md` | This specification |
| `types.ts` | TypeScript interfaces for all inputs, outputs, internal state |
| `utils.ts` | Pure functions, constants, rate tables, H&C test scenarios |
| `ScopeDecisionTree.tsx` | React component with 5-step wizard, tracking callbacks |
| `index.ts` | Public exports |
