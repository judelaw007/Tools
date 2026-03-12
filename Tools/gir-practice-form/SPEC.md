# T-GIR: GloBE Information Return — Practice Form Specification

## Registration Data

| Field | Value |
|-------|-------|
| **ID** | T-GIR |
| **Slug** | gir-practice-form |
| **Component** | GirPracticeForm |
| **Name** | GIR Practice Form |
| **Type** | Form |
| **Category** | Filing & compliance |
| **Sections used** | S1 (Partial), S2 (Partial), S5 (Partial), S6 (Partial), S7 (PRIMARY) |
| **Build order** | 5 (of 5) — capstone integrator |
| **Dependencies** | T-SDT (scope), T-CMA (charging), T-ETR (computations), T-SHQ (safe harbours) |
| **Replaces** | Existing GIRPracticeForm (tab-based, 3-tab layout → 5-step wizard) |
| **Real-world equivalent** | OECD GloBE Information Return (January 2025 XML Schema release) |

---

## Purpose

The GIR Practice Form is the capstone tool for the ADIT Pillar Two Award Professional Practice Course. It integrates outputs from all four preceding tools (T-SDT, T-ETR, T-CMA, T-SHQ) into a single filing document that mirrors the OECD's standardised GloBE Information Return.

**Key design principle:** Students experience the complete GIR filing process end-to-end — from group identification through entity structure, safe harbour elections, full GloBE computations, to a validated filing summary. Every data point includes contextual help explaining WHY the field matters, WHERE to find the data in an ERP system, and WHAT common errors to watch for.

---

## Inputs

### Section 1: General Information (16 data points)

| Input | Type | Required | Data Point | Source Article |
|-------|------|----------|------------|----------------|
| MNE Group Name | Text | Yes | S1.1.1 | Art. 10.1 |
| UPE Legal Name | Text | Yes | S1.1.2 | Art. 1.4 |
| UPE Jurisdiction | Select | Yes | S1.1.3 | Art. 1.4 |
| UPE Tax ID | Text | Yes | S1.1.4 | Art. 8.1 |
| LEI | Text | No | S1.1.5 | GIR XML Schema |
| Fiscal Year Start | Date | Yes | S1.2.1 | Art. 10.1 |
| Fiscal Year End | Date | Yes | S1.2.2 | Art. 10.1 |
| Reporting Currency | Select | Yes | S1.2.3 | Art. 10.1 |
| First Filing Year | Boolean | Yes | S1.2.4 | Art. 8.1.4 |
| Consolidated Revenue | Number | Yes | S1.2.5 | Art. 1.1 |
| Years Exceeding Threshold | Number | No | — | Art. 1.1 |
| DFE Name | Text | Yes | S1.3.1 | Art. 8.1.3 |
| DFE Jurisdiction | Select | Yes | S1.3.2 | Art. 8.1.3 |
| DFE Tax ID | Text | Yes | S1.3.3 | Art. 8.1.3 |
| Filing Type | Select | Yes | S1.3.4 | Art. 8.1 |
| Amendment Reason | Text | Cond. | S1.3.5 | Art. 8.1 |

### Section 2: Entity Structure (14 data points per entity)

| Input | Type | Required | Data Point | Source Article |
|-------|------|----------|------------|----------------|
| Entity Name | Text | Yes | S2.1.1 | Art. 10.1 |
| Internal ID | Text | No | S2.1.2 | GIR XML Schema |
| Jurisdiction | Select | Yes | S2.1.3 | Art. 10.1 |
| Tax ID | Text | Yes | S2.1.4 | Art. 8.1 |
| Direct Parent | Reference | Yes* | S2.2.1 | Art. 10.1 |
| Ownership % | Number | Yes | S2.2.2 | Art. 2.1 |
| Classification | Select | Yes | S2.3.1 | Art. 1.4–10.1 |
| Excluded Entity | Boolean | Yes | S2.3.2 | Art. 1.5 |
| Exclusion Reason | Text | Cond. | S2.3.3 | Art. 1.5.1–1.5.5 |
| Consolidation Method | Select | Yes | S2.3.4 | Art. 10.1 |
| Acquisition Date | Date | No | S2.3.5 | Art. 6.2 |
| Flow-Through Entity | Boolean | Yes | S2.3.6 | Art. 3.5 |
| PE Flag | Boolean | Yes | — | Art. 10.1 |
| Notes | Text | No | — | — |

*Not required for UPE

### Section 3A: Safe Harbour Elections (10 data points per jurisdiction)

| Input | Type | Required | Data Point | Source Article |
|-------|------|----------|------------|----------------|
| Election Type | Select | Yes | S3A.1 | AG Chapter 2 |
| CbCR Revenue | Number | Cond. | S3A.2 | AG 2.1 |
| CbCR Profit Before Tax | Number | Cond. | S3A.3 | AG 2.1 |
| CbCR Tax Accrued | Number | Cond. | S3A.4 | AG 2.2 |
| CbCR Employees | Number | Cond. | S3A.5 | AG 2.3 |
| CbCR Tangible Assets | Number | Cond. | S3A.6 | AG 2.3 |
| De Minimis Revenue 3-Yr Avg | Number | Cond. | S3A.7 | Art. 5.5.1 |
| De Minimis Income 3-Yr Avg | Number | Cond. | S3A.8 | Art. 5.5.1 |
| Transition Year | Boolean | No | S3A.10 | Art. 9.1–9.4 |
| Notes | Text | No | — | — |

### Section 3B: GloBE Computations (19+ data points per jurisdiction)

| Input | Type | Required | Data Point | Source Article |
|-------|------|----------|------------|----------------|
| Jurisdiction | Select | Yes | S3.1.1 | Art. 5.1 |
| Number of CEs | Number | Yes | S3.1.2 | Art. 5.1 |
| FANI | Number | Yes | S3.2.1 | Art. 3.1.1 |
| Net Taxes Excluded | Number | Yes | S3.2.2 | Art. 3.2.1(a) |
| Excluded Dividends | Number | No | S3.2.3 | Art. 3.2.1(b) |
| Excluded Equity Gains | Number | No | S3.2.4 | Art. 3.2.1(b) |
| Policy Disallowed | Number | No | S3.2.5 | Art. 3.2.1(c) |
| Stock Comp Adj | Number | No | S3.2.6 | Art. 3.2.3 |
| Other Adjustments | Number | No | S3.2.7 | Art. 3.2.1(d)–(j) |
| Current Tax Expense | Number | Yes | S3.3.1 | Art. 4.1 |
| Deferred Tax Adj | Number | No | S3.3.2 | Art. 4.4 |
| DTL Cap Adj | Number | No | S3.3.3 | Art. 4.4.4 |
| UTP Adj | Number | No | S3.3.4 | Art. 4.1.3 |
| Non-Covered Tax Adj | Number | No | S3.3.5 | Art. 4.2 |
| Eligible Payroll | Number | Yes | S3.4.1 | Art. 5.3.3 |
| Tangible Assets NBV | Number | Yes | S3.4.2 | Art. 5.3.4 |
| QDMTT Amount | Number | No | S3.5.5 | Art. 5.2.3 |
| Charging Mechanism | Select | Yes | S3.5.7 | Art. 2.1–2.6 |
| Safe Harbour / De Minimis / MOCE flags | Boolean | — | — | Various |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| Filing deadline | Calculated | 15 months (or 18 for first filing) after FY end |
| Safe harbour test results | Table | Per jurisdiction: de minimis, simplified ETR, routine profits — pass/fail |
| GloBE Income per jurisdiction | Calculated | FANI + Article 3.2 adjustments |
| Adjusted Covered Taxes | Calculated | Current tax + deferred tax adjustments |
| Jurisdictional ETR | Calculated | Adjusted Covered Taxes / GloBE Income |
| SBIE per jurisdiction | Calculated | Payroll + asset carve-out with transitional rates |
| Excess Profit | Calculated | max(0, GloBE Income - SBIE) |
| Top-Up Tax % | Calculated | max(0, 15% - ETR) |
| Gross Top-Up Tax | Calculated | Excess Profit x Top-Up Tax % |
| Net Top-Up Tax | Calculated | Gross Top-Up Tax - QDMTT |
| Filing Summary Dashboard | Dashboard | Totals, jurisdiction outcomes, validation checks |
| Jurisdictional detail table | Table | All jurisdictions with ETR, SBIE, top-up tax, mechanism |

---

## Wizard Flow

### Step 1: General Information (GIR Section 1)

MNE Group identification, reporting period, and Designated Filing Entity details.

**Educational note:** The GIR is the standardised filing instrument under Article 8.1. The DFE is typically the UPE but can be designated to another entity under Article 8.1.3. First filings receive an 18-month deadline (vs standard 15 months).

**Validation:** Group name, UPE name, UPE jurisdiction, UPE tax ID, FY dates, currency, revenue, DFE details all required. Amendment reason required if filing type is AMENDED.

### Step 2: Entity Structure (GIR Section 1 continued)

Full Constituent Entity register with ownership chains, classifications, and exclusions.

**Educational note:** Every CE must be reported including PEs treated as separate CEs under Article 10.1. Classifications (UPE, IPE, POPE, MOCE, JV, IE, PE, EE) determine computational treatment.

**Validation:** At least one entity required. Exactly one UPE. All entities need jurisdiction. Non-UPE entities need a parent. Ownership 0-100%.

### Step 3: Safe Harbours (GIR Section 2)

Transitional CbCR safe harbour elections per jurisdiction with automatic test computation.

**Educational note:** Three tests using CbCR data: de minimis (revenue <€10M AND income <€1M), simplified ETR (≥ transition rate), routine profits (PBT ≤ SBIE). Any one passing = safe harbour applies.

**No mandatory validation** — safe harbour entries are optional.

### Step 4: GloBE Computations (GIR Section 3)

Full jurisdictional ETR, SBIE, and top-up tax calculations for non-safe-harboured jurisdictions.

**Educational note:** The full GloBE computation path: GloBE Income → Adjusted Covered Taxes → ETR → SBIE → Excess Profit → Top-Up Tax. Charging mechanism (QDMTT → IIR → UTPR) allocates collection.

**Validation:** Jurisdictions without safe harbour or de minimis should have FANI > 0.

### Step 5: Filing Summary (Complete GIR)

Consolidated dashboard with entity statistics, jurisdiction outcomes, total liability, and pre-filing validation checklist.

**No inputs** — this step is read-only, displaying calculated results from all previous steps.

---

## H&C Storyline Usage

**Entity:** Stratos Holdings plc (Combined Group — Post-TechStart Acquisition)
**Fiscal Year:** 2025 (1 January — 31 December)
**First Filing:** Yes (18-month deadline → 30 June 2027)

### Pre-loaded Test Data

- **27 entities** across 10 jurisdictions (20 core Stratos + 7 TechStart)
- **7 safe harbour entries** (4 qualifying: UK, Germany, Luxembourg, USA)
- **7 computation entries** (Singapore/Ireland/Cayman below 15%, USA/Germany/Luxembourg safe harbour, UK above 15%)
- **2 excluded entities** (pension fund, NPO)
- **1 MOCE** (Atlas Ireland, 28% ownership)
- **1 JV** (TechStart JV, 55%, equity method)
- **1 flow-through** (TechStart IP LLC, 80%)

### Key Teaching Points

1. Safe harbours reduce compliance: 4 of 7 jurisdictions qualify (UK above minimum, Germany/Luxembourg/USA via CbCR safe harbour)
2. QDMTT is primary mechanism for Ireland and Singapore
3. Cayman Islands is the only IIR jurisdiction (no QDMTT)
4. First filing = 18-month deadline (30 June 2027)
5. TechStart acquisition requires partial-year entries (184/365 proration)
6. Atlas Ireland MOCE requires separate computation from main Ireland group
7. DFE is UK UPE — filing covers all jurisdictions via QCAA agreements

---

## Validation Rules

| Rule | Scope | Error Message |
|------|-------|---------------|
| MNE Group name required | Step 1 | "MNE Group name is required" |
| UPE name required | Step 1 | "UPE legal name is required" |
| UPE jurisdiction required | Step 1 | "UPE jurisdiction is required" |
| Fiscal year dates required | Step 1 | "Fiscal year start/end is required" |
| Revenue positive | Step 1 | "Consolidated revenue must be positive" |
| DFE details required | Step 1 | "DFE name/jurisdiction is required" |
| Amendment reason when amended | Step 1 | "Amendment reason is required for amended filings" |
| At least one entity | Step 2 | "At least one entity must be added" |
| Exactly one UPE | Step 2 | "One entity must be classified as UPE" |
| Entity jurisdiction required | Step 2 | "Entity: jurisdiction is required" |
| Non-UPE parent required | Step 2 | "Entity: non-UPE entities must have a parent" |
| FANI non-zero for active | Step 4 | "Jurisdiction: FANI should not be zero for active jurisdictions" |

---

## Tracking Callbacks

| Callback | Trigger | Metadata |
|----------|---------|----------|
| `onTrackStepChange` | Step navigation | `fromStep`, `toStep` |
| `onTrackCalculation` | Step 4 → 5 transition | `jurisdictionCount`, `totalGrossTopUpTax`, `totalNetTopUpTax` |
| `onTrackError` | Validation failure | `errorMessage`, `step` |
| `onTrackCompletion` | Reaching Step 5 | `totalJurisdictions`, `totalCEs`, `totalGrossTopUpTax`, `totalNetTopUpTax`, `safeHarbourCount`, `filingDeadline` |

---

## File Manifest

| File | Purpose | Lines (approx.) |
|------|---------|-----------------|
| `SPEC.md` | This specification document | ~230 |
| `types.ts` | TypeScript interfaces and type definitions | ~280 |
| `utils.ts` | Constants, pure functions, validation, H&C data, formatting | ~1800 |
| `GirPracticeForm.tsx` | React component with 5-step wizard | ~1700 |
| `index.ts` | Public exports | ~20 |
