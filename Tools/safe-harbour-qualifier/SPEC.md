# T-SHQ: Transitional CbCR Safe Harbour Assessment — Specification

## Registration Data

| Field | Value |
|-------|-------|
| **ID** | T-SHQ |
| **Slug** | safe-harbour-qualifier |
| **Component** | SafeHarbourQualifier |
| **Name** | Transitional CbCR Safe Harbour Assessment |
| **Type** | Calculator |
| **Category** | Compliance shortcut |
| **Sections used** | S5 (Secondary), S7 (PRIMARY) |
| **Build order** | 4 (of 5) |
| **Dependencies** | T-ETR (students should understand full ETR computation before learning the safe harbour shortcut) |
| **Replaces** | Existing SafeHarbourQualifier (enhanced with multi-jurisdiction support, wizard flow, extended transitional period, H&C scenarios) |
| **Real-world equivalent** | OECDPillars.com Safe Harbour Modelling Tool; Big 4 CbCR safe harbour assessments |

---

## Purpose

The Transitional CbCR Safe Harbour Assessment enables students to evaluate whether jurisdictions qualify for the transitional safe harbour under the GloBE Rules, avoiding the need for a full ETR computation. Students enter CbCR data per jurisdiction and the tool applies all three safe harbour tests simultaneously, showing which jurisdictions qualify (and why) and which require full GloBE computation.

**Key design principle:** The safe harbour is the most practically important compliance mechanism for 2024–2027. In the first years of Pillar Two, most MNE groups will use CbCR data to screen jurisdictions before committing to full GloBE calculations. This tool teaches students to perform that screening efficiently, understand the three tests, and identify the jurisdictions that need further work.

**Enhancement from existing tool:** The original SafeHarbourQualifier assessed one jurisdiction at a time. This rebuild supports multi-jurisdiction assessment in a single session, matching real-world practice where practitioners screen all jurisdictions simultaneously. It also extends the transitional period to FY 2027, adds CbCR field labels matching OECD CbCR Table 2, and includes H&C test scenarios.

---

## Inputs

| Input | Type | Required | Source | Educational Note |
|-------|------|----------|--------|------------------|
| Group name | Text | Yes | — | Identifies the MNE Group being assessed |
| Fiscal year | Dropdown (2024–2027) | Yes | Art. 9.1 | The transitional safe harbour applies to fiscal years beginning on or before 31 December 2027. The simplified ETR transition rate increases each year. |
| Currency | Dropdown | Yes | — | CbCR data currency. All thresholds are in EUR — if a different currency is selected, values should be EUR-equivalent. |
| Jurisdictions | Array | Yes | CbCR Table 2 | Each jurisdiction where the MNE Group has Constituent Entities |
| Per jurisdiction: CbCR Revenue | Number | Yes | CbCR Table 2, Col. 3 | Total revenue from CbCR — includes related and unrelated party revenue. Used for de minimis test (< €10M threshold). |
| Per jurisdiction: CbCR Profit (Loss) Before Tax | Number | Yes | CbCR Table 2, Col. 4 | Profit or loss before income tax from CbCR. Used for de minimis (< €1M), simplified ETR (denominator), and routine profits (compared to SBIE). Losses are entered as negative. |
| Per jurisdiction: Income Tax Accrued | Number | Yes | CbCR Table 2, Col. 5 | Current year income tax accrued from CbCR. This is the simplified covered taxes figure for the ETR test. |
| Per jurisdiction: Number of Employees | Number | Yes | CbCR Table 2, Col. 9 | Headcount — informational context for the assessment. |
| Per jurisdiction: Employee Compensation | Number | Yes | CbCR Table 2 derived | Total employee costs including salaries, social contributions, pension, and benefits. Used for the payroll component of the SBIE in the routine profits test. |
| Per jurisdiction: Tangible Assets NBV | Number | Yes | CbCR Table 2, Col. 10 | Net book value of tangible assets from CbCR. Used for the asset component of the SBIE in the routine profits test. |

---

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| Per-jurisdiction assessment | Card | Shows all 3 test results with pass/fail, calculations, and Article references |
| Test 1: De Minimis result | Pass/Fail | Revenue < €10M AND \|Profit\| < €1M (Article 9.1.2) |
| Test 2: Simplified ETR result | Pass/Fail with ETR | Simplified ETR ≥ transition rate for the fiscal year (Article 9.1.3). Loss-making jurisdictions automatically qualify. |
| Test 3: Routine Profits result | Pass/Fail with SBIE | Profit ≤ SBIE using transitional carve-out rates (Article 9.1.4) |
| Overall qualification | Pass/Fail | Any single test passing = safe harbour applies for that jurisdiction |
| Summary dashboard | Table | All jurisdictions: qualification status, qualifying test, key metrics |
| Transition rate schedule | Reference | Shows the applicable ETR rates and SBIE rates for the selected fiscal year |
| Action items | List | Jurisdictions requiring full GloBE computation highlighted |

---

## Wizard Flow

### Step 1: Group Information

Enter the MNE Group details and select the fiscal year for the assessment.

Fields:
- Group name (text)
- Fiscal year (dropdown: 2024, 2025, 2026, 2027)
- Currency (dropdown: EUR, USD, GBP, CHF)

Displays the transition rate and SBIE rates applicable to the selected fiscal year.

**Educational note:** The Transitional CbCR Safe Harbour allows MNE Groups to use existing Country-by-Country Report (CbCR) data to determine whether a jurisdiction has a sufficiently high ETR, avoiding the need for a full GloBE computation. The safe harbour is available for fiscal years beginning on or before 31 December 2027. If any one of three tests is satisfied, the jurisdiction qualifies and no top-up tax is due.

**Validation:** Group name must be non-empty.

### Step 2: CbCR Data Entry

Enter CbCR data for each jurisdiction to be assessed. Jurisdictions can be added individually or pre-loaded from the H&C scenario.

Per jurisdiction:
- Jurisdiction (dropdown with common jurisdictions)
- CbCR Revenue (numeric)
- Profit (Loss) Before Income Tax (numeric, can be negative)
- Income Tax Accrued — Current Year (numeric)
- Number of Employees (numeric)
- Employee Compensation (numeric)
- Tangible Assets Net Book Value (numeric)

**Educational note:** The CbCR data used for the safe harbour comes from the MNE Group's Country-by-Country Report (OECD BEPS Action 13). This is an existing compliance document — most in-scope MNE Groups already file a CbCR. The advantage of the safe harbour is that it avoids the complex GloBE adjustments (Articles 3.2–4.6) by using CbCR data as a reasonable proxy. However, CbCR data may differ significantly from GloBE Income and Adjusted Covered Taxes due to different accounting bases.

**Validation:** At least one jurisdiction required. Revenue and employee compensation must be ≥ 0. Employee count must be ≥ 0. Tangible assets must be ≥ 0.

### Step 3: Assessment Results

Automatically computes and displays all three safe harbour tests for each jurisdiction:

```
For each jurisdiction:
├── Test 1: De Minimis (Article 9.1.2)
│   ├── Revenue < €10,000,000?
│   ├── |Profit| < €1,000,000?
│   └── Result: PASS (both conditions met) / FAIL
│
├── Test 2: Simplified ETR (Article 9.1.3)
│   ├── Simplified ETR = Income Tax Accrued ÷ Profit Before Tax
│   ├── Compare to transition rate (15%/16%/17% depending on FY)
│   ├── Loss-making: automatic PASS
│   └── Result: PASS (ETR ≥ rate) / FAIL
│
├── Test 3: Routine Profits (Article 9.1.4)
│   ├── SBIE = (payroll rate × Employee Compensation) + (asset rate × Tangible Assets)
│   ├── Compare: Profit ≤ SBIE?
│   ├── Loss-making: automatic PASS
│   └── Result: PASS (profit ≤ SBIE) / FAIL
│
└── Overall: QUALIFIES if any test passes / DOES NOT QUALIFY if all fail
```

**Educational note:** The three tests operate independently — a jurisdiction needs to pass only one test to qualify for the safe harbour. The tests are designed to catch different situations: (1) de minimis catches small operations where the compliance burden of a full computation is disproportionate; (2) simplified ETR catches jurisdictions where the tax rate is clearly above the minimum; (3) routine profits catches jurisdictions where all profit is attributable to substance (payroll and tangible assets) rather than excess returns.

### Step 4: Summary Dashboard

Displays the complete assessment result:
- Qualification count (X of Y jurisdictions qualify)
- Per-jurisdiction summary table with qualification status and qualifying test
- Jurisdictions requiring full GloBE computation highlighted
- Transition rate schedule for reference
- Key insights (e.g., "4 of 7 jurisdictions qualify — Singapore, Cayman Islands, and Ireland require full GloBE computation")

---

## H&C Storyline Usage

**Scenario:** Stratos Group safe harbour analysis — FY 2025 (Section 7)

**Story trigger:** The GIR filing deadline is approaching. David Roberts assigns the student to screen all 7 jurisdictions using CbCR data before committing to full GloBE computations.

### Pre-loaded Test Data

**Group:** Stratos Holdings plc — FY 2025

| Jurisdiction | CbCR Revenue (€) | CbCR PBT (€) | Tax Accrued (€) | Employees | Employee Costs (€) | Tangible Assets (€) |
|---|---|---|---|---|---|---|
| United Kingdom | 125,000,000 | 12,000,000 | 2,950,000 | 450 | 32,000,000 | 18,000,000 |
| Germany | 285,000,000 | 58,000,000 | 13,500,000 | 1,200 | 132,000,000 | 42,000,000 |
| Ireland | 92,000,000 | 16,500,000 | 1,960,000 | 180 | 16,200,000 | 12,000,000 |
| Luxembourg | 9,200,000 | 630,000 | 157,000 | 10 | 520,000 | 180,000 |
| United States | 78,000,000 | 14,800,000 | 3,120,000 | 334 | 28,500,000 | 4,900,000 |
| Singapore | 45,000,000 | 4,200,000 | 400,000 | 85 | 5,950,000 | 3,500,000 |
| Cayman Islands | 15,000,000 | 2,016,000 | 20,200 | 5 | 1,200,000 | 50,000 |

### Expected Results

| Jurisdiction | Overall | Qualifying Test | De Minimis | Simplified ETR | Routine Profits | CbCR ETR |
|---|---|---|---|---|---|---|
| **United Kingdom** | QUALIFIES | Simplified ETR | FAIL (Rev €125M) | PASS (24.58% ≥ 16%) | — | 24.58% |
| **Germany** | QUALIFIES | Simplified ETR | FAIL (Rev €285M) | PASS (23.28% ≥ 16%) | — | 23.28% |
| **Ireland** | DOES NOT QUALIFY | — | FAIL (Rev €92M) | FAIL (11.88% < 16%) | FAIL (PBT > SBIE) | 11.88% |
| **Luxembourg** | QUALIFIES | De Minimis | PASS (Rev €9.2M < €10M, PBT €630K < €1M) | — | — | 24.92% |
| **United States** | QUALIFIES | Simplified ETR | FAIL (Rev €78M) | PASS (21.11% ≥ 16%) | — | 21.11% |
| **Singapore** | DOES NOT QUALIFY | — | FAIL (Rev €45M) | FAIL (9.52% < 16%) | FAIL (PBT > SBIE) | 9.52% |
| **Cayman Islands** | DOES NOT QUALIFY | — | FAIL (Rev €15M) | FAIL (1.00% < 16%) | FAIL (PBT > SBIE) | 1.00% |

**Result:** 4 of 7 jurisdictions qualify for the transitional safe harbour. Singapore, Cayman Islands, and Ireland require full GloBE computation.

### Key Teaching Points

1. **CbCR as screening tool:** The safe harbour uses existing CbCR data, avoiding the need for complex GloBE adjustments (Articles 3.2–4.6) for most jurisdictions
2. **Any test suffices:** Luxembourg passes de minimis; UK/Germany/USA pass simplified ETR — each qualifying jurisdiction uses a different test
3. **Ireland fails all tests:** Revenue €92M exceeds de minimis; simplified ETR 11.88% < 16%; PBT €16.5M greatly exceeds SBIE ~€2.5M — Ireland requires full GloBE computation
4. **Singapore fails all tests:** Revenue too high for de minimis, ETR too low for simplified ETR, and insufficient substance for routine profits — requires full GloBE computation
5. **Practical outcome:** Safe harbour screening saves significant compliance effort — only 4 of 7 jurisdictions qualify, leaving Singapore, Cayman Islands, and Ireland needing the full computation chain (T-ETR)

---

## Validation Rules

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Group name required | `groupName.trim().length > 0` | Please enter the MNE Group name |
| At least one jurisdiction | `jurisdictions.length > 0` | At least one jurisdiction must be added |
| Jurisdiction name required | `jurisdiction.trim().length > 0` | Jurisdiction name is required |
| Revenue non-negative | `revenue >= 0` | Revenue cannot be negative |
| Employee count non-negative | `employeeCount >= 0` | Employee count cannot be negative |
| Employee compensation non-negative | `employeeCompensation >= 0` | Employee compensation cannot be negative |
| Tangible assets non-negative | `tangibleAssets >= 0` | Tangible assets cannot be negative |
| No duplicate jurisdictions | unique jurisdiction names | Duplicate jurisdiction: {name}. Combine entities into a single jurisdictional entry. |

---

## Registration SQL

```sql
INSERT INTO tools (
  slug, name, component, type, category, course_id,
  description, icon, sort_order, is_active
) VALUES (
  'safe-harbour-qualifier',
  'Transitional CbCR Safe Harbour Assessment',
  'SafeHarbourQualifier',
  'calculator',
  'Compliance shortcut',
  (SELECT id FROM courses WHERE slug = 'adit-pillar-two'),
  'Screen jurisdictions against the three Transitional CbCR Safe Harbour tests using existing CbCR data. Determine which jurisdictions qualify for the safe harbour (no top-up tax due) and which require full GloBE computation. Covers fiscal years 2024–2027 with year-appropriate transition rates.',
  'Shield',
  40,
  true
);
```

---

## Tracking Callbacks

| Callback | Trigger | Metadata |
|----------|---------|----------|
| `onTrackStepChange` | User navigates between steps | `{ fromStep, toStep }` |
| `onTrackCalculation` | Assessment computed for all jurisdictions | `{ qualifyingCount, totalCount, qualifyingJurisdictions }` |
| `onTrackCalculation` | Individual jurisdiction assessed | `{ jurisdiction, qualifies, qualifyingTest }` |
| `onTrackCompletion` | Summary step reached | `{ qualifyingCount, totalCount, fiscalYear }` |
| `onTrackError` | Validation failure | `{ step, errorMessage }` |

---

## File Manifest

| File | Purpose |
|------|---------|
| `SPEC.md` | This specification |
| `types.ts` | TypeScript interfaces for all inputs, outputs, internal state |
| `utils.ts` | Pure functions, constants, rate tables, H&C test scenarios |
| `SafeHarbourQualifier.tsx` | React component with 4-step wizard, tracking callbacks |
| `index.ts` | Public exports |
