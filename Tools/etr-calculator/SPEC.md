# T-ETR: ETR and Top-Up Tax Calculator — Specification

## Registration Data

| Field | Value |
|-------|-------|
| **ID** | T-ETR |
| **Slug** | etr-calculator |
| **Component** | EtrCalculator |
| **Name** | ETR and Top-Up Tax Calculator |
| **Type** | Calculator |
| **Category** | Core computation |
| **Sections used** | S3 (PRIMARY — income module), S4 (PRIMARY — tax module), S5 (PRIMARY — full computation) |
| **Build order** | 3 (of 5) |
| **Dependencies** | None — foundational tool. T-CMA takes top-up tax outputs as downstream input. |
| **Replaces** | Enhances existing GloBECalculator |
| **Real-world equivalent** | OECDPillars.com Top-Up Tax Calculator; Deloitte Impact Assessment Model |

---

## Purpose

The ETR and Top-Up Tax Calculator guides students through the complete five-step GloBE computation: from raw financial data to jurisdictional top-up tax amounts. Students enter per-jurisdiction financial data (accounting income, Article 3.2 adjustments, covered tax entries), and the tool computes GloBE Income, Adjusted Covered Taxes, the Effective Tax Rate, the Substance-Based Income Exclusion, and the resulting top-up tax for each jurisdiction.

**Key design principle:** The tool makes the layered GloBE computation transparent. Students see exactly how FANI is derived from accounting net income plus covered tax add-back (Article 3.1.2), how each Article 3.2 adjustment modifies GloBE Income, how covered taxes are grouped and adjusted (including the 15% DTL cap under Article 4.4.4), how the SBIE transitional rates reduce excess profit, and how the final top-up tax percentage applies. The scenario comparison feature lets students toggle the SBC election (Article 3.2.3) to see its impact on ETR and top-up tax.

---

## Inputs

| Input | Type | Required | Source Article | Educational Note |
|-------|------|----------|----------------|------------------|
| Jurisdiction name | Text / Dropdown | Yes | — | Identifies the jurisdiction being assessed |
| Display label | Text | Yes | — | Distinguishes multiple entries for the same jurisdiction (e.g., "Ireland (Main Group)" vs "Ireland (Atlas — MOCE)") |
| Fiscal year | Number | Yes | Art. 9.2 | Determines SBIE transitional carve-out rates |
| Accounting net income | Number | Yes | Art. 3.1.2 | Post-tax accounting net income per financial statements |
| Covered tax add-back | Number | Yes | Art. 3.1.2 | Tax expense added back to arrive at FANI |
| Article 3.2 adjustments | Adjustment[] | No | Art. 3.2.1–3.2.3 | Each adjustment has category, description, amount, article reference, and elective flag |
| Covered tax entries | TaxEntry[] | Yes | Art. 4.1–4.6 | Each entry has category, description, amount, article reference, and DTL cap flag |
| Eligible payroll | Number | Yes | Art. 9.1.1 | For SBIE payroll carve-out computation |
| Tangible asset NBV | Number | Yes | Art. 9.1.2 | For SBIE asset carve-out computation |
| MOCE flag | Boolean | No | Art. 5.6 | Marks jurisdiction as Minority-Owned CE with separate computation |
| MOCE ownership % | Number | Conditional | Art. 5.6 | Required if MOCE flag is true; must be 0–100% |
| De minimis data (3 years) | DeMinimisData | No | Art. 5.5 | Revenue and income for 3 consecutive fiscal years for the de minimis exclusion test |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| GloBE Income breakdown | Per jurisdiction | FANI (accounting net income + tax add-back), adjustment breakdown by category, total GloBE Income |
| Covered Tax breakdown | Per jurisdiction | Current tax total, current adjustments (credits, UTPs), deferred tax movements, DTL cap adjustment, Adjusted Covered Taxes |
| ETR | Per jurisdiction | Adjusted Covered Taxes / GloBE Income, displayed as percentage with colour coding (green ≥15%, amber 10–15%, red <10%) |
| SBIE breakdown | Per jurisdiction | Payroll rate, asset rate (year-appropriate transitional), payroll carve-out, asset carve-out, total SBIE |
| Excess profit | Per jurisdiction | max(0, GloBE Income − SBIE) |
| Top-up tax percentage | Per jurisdiction | max(0, 15% − ETR) |
| Top-up tax amount | Per jurisdiction | Top-up tax % × Excess profit |
| De minimis test result | Per jurisdiction | 3-year averages, test outcomes, qualification status |
| Multi-jurisdiction summary | Table | All jurisdictions compared: GloBE Income, Covered Taxes, ETR, SBIE, excess profit, top-up tax, status |
| Status classification | Per jurisdiction | ABOVE_MINIMUM / BELOW_MINIMUM / DE_MINIMIS / MOCE |
| Totals | Summary | Total GloBE Income, total Covered Taxes, total Top-Up Tax, total SBIE, counts by status |
| Scenario comparison | Side-by-side | With/without SBC election: ETR delta, top-up tax delta per jurisdiction |

---

## Wizard Flow

### Step 1: Jurisdiction Setup

Define the jurisdictions to be assessed. Each jurisdiction represents a jurisdictional grouping of Constituent Entities (or a MOCE under Article 5.6).

For each jurisdiction:
- Jurisdiction (dropdown), display label (text)
- Fiscal year (dropdown — determines SBIE transitional rates)
- MOCE checkbox with ownership percentage
- Eligible payroll and tangible asset NBV (for SBIE)
- De minimis toggle with 3-year revenue/income data entry

**Educational note:** The ETR is computed at the jurisdictional level, not the entity level. All Constituent Entities in the same jurisdiction are aggregated — except MOCEs (Article 5.6), which are computed separately because the MNE Group holds less than 30% ownership.

**Validation:** At least one jurisdiction required. Jurisdiction and label must be non-empty. MOCE ownership must be 0–100%. Payroll and assets must be ≥ 0.

### Step 2: GloBE Income

For each jurisdiction, compute GloBE Income through three layers:
1. **FANI** = Accounting Net Income + Covered Tax Add-Back (Article 3.1.2)
2. **Article 3.2 Adjustments** — add/remove entries with category dropdown, description, amount, and article reference
3. **GloBE Income** = FANI + Σ(adjustments)

Each adjustment category includes an info tooltip explaining the Article reference and practical guidance.

**Educational note:** FANI starts with the post-tax accounting net income from the financial statements, then adds back the covered tax expense (Article 3.1.2). This gives a pre-tax starting point. The Article 3.2 adjustments then modify FANI to arrive at GloBE Income — removing items that should not be in the GloBE base (excluded dividends, asymmetric FX) and adding back policy-disallowed expenses.

**Validation:** Warning if GloBE Income ≤ 0 (no top-up tax liability, but may be intentional).

### Step 3: Covered Taxes

For each jurisdiction, build up the Adjusted Covered Taxes:
1. **Current tax entries** — CIT, trade tax, solidarity surcharges, settled UTPs
2. **Current adjustments** — qualified refundable credits, non-qualified credits, outstanding UTPs, CFC allocations
3. **Deferred tax** — DTL movements, DTA movements, DTL cap adjustments
4. **Summary** — Current total + adjustments + deferred = Adjusted Covered Taxes

Each entry has a DTL cap checkbox for entries subject to the 15% cap (Article 4.4.4).

**Educational note:** Adjusted Covered Taxes include both current and deferred tax components. Qualified Refundable Credits (Article 4.1.2(a)) reduce covered taxes but increase GloBE Income — they are not double-counted. The 15% DTL cap (Article 4.4.4) prevents deferred tax liabilities from exceeding the minimum rate, ensuring entities cannot inflate covered taxes through timing differences alone.

**Validation:** At least one covered tax entry per jurisdiction.

### Step 4: ETR & Top-Up Tax

For each jurisdiction, display the complete computation:
- GloBE Income and Adjusted Covered Taxes (from Steps 2–3)
- **ETR** = Adjusted Covered Taxes / GloBE Income (colour-coded)
- **Top-Up Tax %** = max(0, 15% − ETR)
- **SBIE** breakdown: payroll rate × payroll + asset rate × assets (with transitional rates shown)
- **Excess Profit** = max(0, GloBE Income − SBIE)
- **Top-Up Tax** = Top-Up Tax % × Excess Profit
- De minimis test results (if applicable)
- MOCE indicator (if applicable)

**Educational note:** The SBIE (Article 9.1) excludes a portion of income attributable to substantive activities — real employees and real assets. The transitional rates (Article 9.2) start higher (9.6% payroll / 7.6% assets for FY 2025) and decline to 5% / 5% from 2033 onwards. This rewards jurisdictions with genuine economic substance.

### Step 5: Results Summary

Displays the complete multi-jurisdiction picture:
- Summary cards: total GloBE Income, total Covered Taxes, total Top-Up Tax, total SBIE
- Status counts: above minimum, below minimum, de minimis excluded, MOCE
- Multi-jurisdiction comparison table (all key metrics side-by-side)
- Scenario comparison toggle (SBC election impact)
- SBIE transitional rate schedule reference
- Key insights panel

**Educational note:** The results view is the convergence point — students see how individual jurisdictional computations combine into the group's total Pillar Two liability. The scenario comparison demonstrates how elective choices (e.g., SBC under Article 3.2.3) can shift the ETR and top-up tax across jurisdictions.

---

## H&C Storyline Usage

**Scenario:** Stratos Group multi-jurisdiction ETR computation (Sections 3, 4, 5)

**Story trigger:** The Group Tax team needs to compute the jurisdictional ETR for each territory where Stratos has Constituent Entities, identify low-taxed jurisdictions, and determine the total top-up tax liability.

### Pre-loaded Test Data

**Full Computation (6 Jurisdictions, FY 2025):**

| Jurisdiction | Label | Accounting Net Income (€) | Tax Add-Back (€) | GloBE Income (€) | Covered Taxes (€) | ETR | Status |
|---|---|---|---|---|---|---|---|
| United Kingdom | United Kingdom | 6,375,000 | 2,125,000 | 8,500,000 | 2,125,000 | 25.00% | Above minimum |
| Germany | Germany | 44,907,000 | 12,393,000 | 53,880,000 | 12,393,000 | 23.00% | Above minimum |
| Singapore | Singapore | 3,607,794 | 392,206 | 4,000,000 | 392,206 | 9.81% | Below minimum |
| Ireland | Ireland (Main Group) | 13,230,000 | 1,770,000 | 15,000,000 | 1,770,000 | 11.80% | Below minimum |
| Luxembourg | Luxembourg | 575,000 | 55,000 | 630,000 | 55,000 | 8.73% | De minimis |
| Ireland | Ireland (Atlas — MOCE 28%) | 2,112,000 | 288,000 | 2,400,000 | 288,000 | 12.00% | MOCE |

**Germany Detailed Adjustments (S3 Deep-Dive):**

Article 3.2 adjustments:
- Excluded dividends: −€3,100,000 (Art. 3.2.1(b))
- Asymmetric FX: −€900,000 (Art. 3.2.1(a))
- Policy-disallowed fine: +€300,000 (Art. 3.2.1(c))
- Prior-period correction: +€500,000 (Art. 3.2.1(h))
- Pension timing: +€300,000 (Art. 3.2.1(i))
- Other: −€520,000 (Art. 3.2)
- SBC election: €0 (elective — toggle for comparison)

Covered tax entries:
- CIT (Körperschaftsteuer): €8,200,000
- Solidarity surcharge: €451,000
- Trade tax (Gewerbesteuer): €3,100,000
- R&D credit (Forschungszulage): −€180,000
- UTP settled: +€150,000
- UTP outstanding: −€280,000
- DTL intangibles: +€900,000
- DTL PP&E: +€400,000
- DTA provisions: −€250,000
- DTL cap adjustment: −€98,000

**Luxembourg De Minimis Data (3-Year):**

| Year | Revenue (€) | Income (€) |
|---|---|---|
| FY 2023 | 7,900,000 | 580,000 |
| FY 2024 | 8,400,000 | 650,000 |
| FY 2025 | 9,200,000 | 630,000 |
| **Average** | **8,500,000** | **620,000** |

Both tests passed: avg revenue < €10M, avg income < €1M → de minimis exclusion applies.

**Expected Results:**

| Jurisdiction | ETR | Top-Up Tax (€) |
|---|---|---|
| United Kingdom | 25.00% | 0 |
| Germany | 23.00% | 0 |
| Singapore | 9.81% | 198,268 |
| Ireland (Main Group) | 11.80% | 425,011 |
| Luxembourg | 8.73% | 0 (de minimis) |
| Ireland (Atlas — MOCE 28%) | 12.00% | 66,720 |
| **Total** | — | **689,999** |

### What-If Scenario: SBC Election

When the SBC election (Article 3.2.3) is toggled ON for Germany:
- SBC adjustment changes from €0 to €600,000
- GloBE Income increases from €53,880,000 to €54,480,000
- ETR decreases from 23.00% to 22.75%
- Germany remains above minimum — no top-up tax impact in this case
- Demonstrates how elective choices affect the computation even when the outcome is unchanged

### Key Teaching Points

1. **FANI construction:** Accounting net income + covered tax add-back = pre-tax starting point (Article 3.1.2)
2. **Article 3.2 adjustments:** Each category has a specific policy rationale — excluded dividends prevent double taxation, policy-disallowed expenses add back fines/bribes
3. **DTL cap (Article 4.4.4):** Prevents entities from inflating covered taxes through timing differences
4. **SBIE substance reward:** Real payroll and real assets reduce excess profit — pure holding/IP structures get minimal carve-out
5. **De minimis exclusion:** Small jurisdictions below both thresholds are excluded entirely
6. **MOCE separate computation:** Minority-owned entities computed separately; only the allocable share (ownership %) enters the charging mechanism

---

## Validation Rules

| Rule | Condition | Error Message |
|------|-----------|---------------|
| At least one jurisdiction | `jurisdictions.length > 0` | At least one jurisdiction must be added |
| Jurisdiction selected | `jurisdiction.trim().length > 0` | Please select a jurisdiction |
| Label required | `label.trim().length > 0` | Display label is required |
| MOCE ownership in range | `!isMOCE OR (0 < moceOwnershipPercent < 100)` | MOCE ownership must be between 0% and 100% |
| Payroll non-negative | `eligiblePayroll >= 0` | Eligible payroll cannot be negative |
| Assets non-negative | `tangibleAssetNBV >= 0` | Tangible asset NBV cannot be negative |
| GloBE Income warning | `globeIncome <= 0 AND !hasDeMinimis` | GloBE Income is ≤ 0 — no top-up tax liability (warning, not blocking) |
| At least one tax entry | `coveredTaxEntries.length > 0` | Add at least current tax expense |

---

## Registration SQL

```sql
INSERT INTO tools (
  slug, name, component, type, category, course_id,
  description, icon, sort_order, is_active
) VALUES (
  'etr-calculator',
  'ETR and Top-Up Tax Calculator',
  'EtrCalculator',
  'calculator',
  'Core computation',
  (SELECT id FROM courses WHERE slug = 'adit-pillar-two'),
  'Compute the jurisdictional Effective Tax Rate and top-up tax under the GloBE Rules. Enter per-jurisdiction financial data, apply Article 3.2 adjustments, build Adjusted Covered Taxes, compute the SBIE substance carve-out, and determine top-up tax liability across multiple jurisdictions.',
  'Calculator',
  10,
  true
);
```

---

## Tracking Callbacks

| Callback | Trigger | Metadata |
|----------|---------|----------|
| `onTrackStepChange` | User navigates between steps | `{ fromStep, toStep }` |
| `onTrackCalculation` | Computation updated | `{ totalGloBEIncome, totalCoveredTaxes, totalTopUpTax, jurisdictionCount, lowTaxedCount }` |
| `onTrackCalculation` | Scenario comparison toggled | `{ scenarioName: 'SBC Election', jurisdiction, etrBefore, etrAfter }` |
| `onTrackCompletion` | Results step reached | `{ totalTopUpTax, jurisdictionCount, lowTaxedCount, deMinimisCount, moceCount }` |
| `onTrackError` | Validation failure | `{ step, errorMessage }` |

---

## File Manifest

| File | Purpose |
|------|---------|
| `SPEC.md` | This specification |
| `types.ts` | TypeScript interfaces for all inputs, outputs, internal state |
| `utils.ts` | Pure functions, constants, SBIE rates, H&C test scenarios, validation |
| `EtrCalculator.tsx` | React component with 5-step wizard, tracking callbacks |
| `index.ts` | Public exports |
