# Corporation Tax Computation with Marginal Relief — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `ct-computation` |
| Tool Slug | `ct-computation` |
| Display Name | Corporation Tax Computation with Marginal Relief |
| Component Name | `CtComputation` |
| Real-World Equivalent | CT600 corporation tax return; HMRC marginal relief calculator; standard CT computation working paper |
| Tool Type | `calculator` |
| Category | `corporation-tax` |
| Difficulty | Core |
| Sections Used | S5 (primary) |
| Build Order | 5 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'ct-computation',
  'Corporation Tax Computation with Marginal Relief',
  'Complete corporation tax computation from taxable total profits through to CT liability. Handles income categorisation, augmented profits calculation, associated company threshold division, marginal relief formula application, short-period apportionment, and CT600-format output.',
  'CtComputation',
  'corporation-tax',
  'calculator',
  'core',
  true,
  5
);
```

---

## 2. Purpose & Context

Corporation tax computation is the foundation of company tax compliance. From 1 April 2023, the UK introduced a two-rate CT structure: 19% (small profits rate) for companies with taxable total profits at or below the lower limit and 25% (main rate) for those above the upper limit. Companies in the marginal band receive marginal relief — a deduction that tapers the effective rate from 25% down towards 19%.

### Why This Tool Matters for OMB Students

- **Upstream foundation:** CT rates (19%/25%/marginal) and the marginal relief formula are referenced by the Profit Extraction Optimiser (CT saved per £ of salary deduction) and contextually by the BADR Checker (company CGT in exit planning).
- **Associated company rules:** The thresholds are divided by the number of associated companies. C&S Engineering has Caldwell Investments as an associated company (common control by Marcus) — dividing the thresholds by 2 and pushing C&S into the marginal band. Students must identify the association.
- **Marginal relief formula:** The formula 3/200 × (U − A) × N/A requires careful application. Students must understand that U is the upper limit (after division/apportionment), A is augmented profits, and N is TTP. The N/A fraction equals 1 when there are no exempt distributions.
- **Short-period apportionment:** If the accounting period is less than 12 months, thresholds are proportionally reduced.
- **CT600 format:** The computation must be presented in exam-standard CT600 format — this is a core presentation skill tested in every CTA sitting.
- **Augmented profits:** Students must understand the distinction between TTP (determines the tax charge) and augmented profits (determines the rate band). Exempt ABGH distributions received increase augmented profits without increasing TTP.

### Key Legislation

- CTA 2010 s.3 — charge to corporation tax
- CTA 2010 s.4 — main rate of CT (25% from 1 April 2023)
- CTA 2010 s.18 — small profits rate (19%)
- CTA 2010 s.19 — marginal relief
- CTA 2010 s.24 — augmented profits
- CTA 2010 s.25A — associated companies (from 1 April 2023)
- CTA 2010 s.189 — qualifying charitable donations
- CTA 2009 Part 5 — loan relationships
- CTA 2009 Part 4 — property income
- TCGA 1992 — chargeable gains
- SI 2023/199 — Corporation Tax (Marginal Relief) Regulations 2023 (standard fraction 3/200)
- HMRC Company Taxation Manual CTM01405–CTM01720

---

## 3. Input Definitions

### 3.1 Accounting Period

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `periodStart` | `date` | Required. Valid date. | The first day of the accounting period. For CT purposes, an accounting period cannot exceed 12 months. If accounts cover more than 12 months, they are split into two periods. |
| `periodEnd` | `date` | Required. Must be after periodStart. | The last day of the accounting period. Determines the CT payment deadline (9 months and 1 day after AP end) and the filing deadline (12 months after AP end). |

### 3.2 Income Components

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `tradingProfits` | `number` | >= 0. Required. | Trading profits after capital allowances (the figure from the trading profit computation / CA computation). This is the company's taxable trading income after all allowable deductions and capital allowances have been claimed. |
| `loanRelationshipIncome` | `number` | Can be negative (deficit). Defaults to 0. | Net income from loan relationships — typically bank interest received minus interest paid on qualifying loans. A deficit reduces total profits. Non-trading loan relationship deficits can be carried forward or surrendered as group relief. |
| `propertyIncome` | `number` | >= 0. Defaults to 0. | Net property income — rental income less allowable property expenses. For companies, this is a separate source of income (unlike individuals where it is taxed under ITTOIA 2005). |
| `chargeableGains` | `number` | >= 0. Defaults to 0. | Net chargeable gains after deducting capital losses (current year losses must be set against gains before brought-forward losses). Companies do not get an annual exempt amount — that only applies to individuals. |

### 3.3 Deductions

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `qualifyingCharitableDonations` | `number` | >= 0. Cannot exceed total profits. Defaults to 0. | Gift Aid donations to registered charities. Deducted from total profits to arrive at TTP. Cannot create or augment a trading loss — excess QCD is lost (not carried forward). The company must have sufficient total profits to absorb the deduction. |

### 3.4 Augmented Profits Adjustment

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `exemptDistributions` | `number` | >= 0. Defaults to 0. | Exempt ABGH distributions received from other companies (typically dividends from non-group companies that are exempt from CT). These do NOT increase TTP but DO increase augmented profits, which determines the rate band. If a company receives large exempt dividends, it can push augmented profits into the main rate band even though TTP is low. For C&S Engineering, this is £nil — the company receives no dividends from other companies. |

### 3.5 Associated Companies

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `associatedCompanyCount` | `number` | >= 1. Required. Integer. | Total number of associated companies INCLUDING the company itself. Under CTA 2010 s.25A (from 1 April 2023), companies are associated if one controls the other, or both are under common control. Control means holding a majority of voting rights, share capital, or the right to a majority of distributable profits or assets on winding up. The thresholds (upper £250,000, lower £50,000) are divided by this number. A company with no associated companies enters 1. |

---

## 4. Output Definitions

### 4.1 Period Information

| Output | Description |
|--------|-------------|
| `periodDays` | Number of days in the accounting period |
| `isShortPeriod` | Whether the period is less than 365 days |
| `apportionmentFraction` | periodDays / 365 (used for threshold adjustment if short period) |

### 4.2 TTP Computation

| Output | Description |
|--------|-------------|
| `tradingProfits` | Trading profits (after CA) — as input |
| `loanRelationshipIncome` | Loan relationship income — as input |
| `propertyIncome` | Property income — as input |
| `chargeableGains` | Chargeable gains — as input |
| `totalProfits` | Sum of all income components |
| `qualifyingCharitableDonations` | QCD deducted (limited to total profits) |
| `taxableTotalProfits` | TTP = total profits − QCD |

### 4.3 Augmented Profits & Rate Band

| Output | Description |
|--------|-------------|
| `augmentedProfits` | TTP + exempt distributions |
| `upperLimit` | £250,000 ÷ associated companies (× apportionment if short period) |
| `lowerLimit` | £50,000 ÷ associated companies (× apportionment if short period) |
| `rateBand` | `small-profits` / `main-rate` / `marginal` |
| `rateBandExplanation` | Explanation of why this rate band applies |

### 4.4 CT Liability

| Output | Description |
|--------|-------------|
| `ctAtMainRate` | TTP × 25% (always computed for comparison) |
| `ctAtSmallProfitsRate` | TTP × 19% (always computed for comparison) |
| `marginalRelief` | 3/200 × (U − A) × N/A (zero if not in marginal band) |
| `marginalReliefFormula` | Formatted formula string showing the calculation |
| `ctLiability` | Final CT liability after marginal relief |
| `effectiveRate` | CT liability / TTP |

### 4.5 Key Dates

| Output | Description |
|--------|-------------|
| `paymentDueDate` | 9 months and 1 day after AP end |
| `filingDeadline` | 12 months after AP end |

### 4.6 CT600-Format Layout

| Output | Description |
|--------|-------------|
| `ct600Lines` | Array of formatted lines for CT600-style presentation, each with label, amount, and formatting hints (indent, bold, underline, deduction) |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | AP dates valid | `error` | Both period start and end dates must be provided. End date must be after start date. |
| V2 | AP length | `error` | Accounting period cannot exceed 366 days (12 months). If accounts cover > 12 months, they must be split into two periods. |
| V3 | Associated companies | `error` | Number of associated companies must be at least 1 (the company itself counts). |
| V4 | Income sources | `warning` | At least one income component should be positive. If all are zero, no CT arises. |
| V5 | QCD cap | `warning` | Qualifying charitable donations cannot exceed total profits. Excess QCD is automatically capped and a warning shown. |
| V6 | Negative TTP | `info` | If TTP is zero or negative after QCD deduction, no CT liability arises. Consider loss relief options. |
| V7 | Short period | `info` | If AP is less than 365 days, thresholds are apportioned. Shows the apportionment fraction and adjusted limits. |
| V8 | Loan relationship deficit | `info` | If loan relationship income is negative (deficit), it reduces total profits. The deficit may alternatively be carried forward or surrendered as group relief. |
| V9 | Near-boundary | `info` | If augmented profits are within £5,000 of a threshold, a planning note is shown (marginal rate sensitivity). |

---

## 6. Calculation Logic

### 6.1 Calculate Period Length

```
periodDays = (periodEnd - periodStart) + 1 day (inclusive)
isShortPeriod = periodDays < 365
apportionmentFraction = periodDays / 365
```

### 6.2 Calculate Taxable Total Profits

```
totalProfits = tradingProfits + loanRelationshipIncome + propertyIncome + chargeableGains
qcdCapped = min(qualifyingCharitableDonations, max(0, totalProfits))
taxableTotalProfits = max(0, totalProfits - qcdCapped)
```

### 6.3 Calculate Augmented Profits

```
augmentedProfits = taxableTotalProfits + exemptDistributions
```

### 6.4 Calculate Thresholds

```
N = associatedCompanyCount

upperLimit = 250_000 / N
lowerLimit = 50_000 / N

If isShortPeriod:
  upperLimit = upperLimit × apportionmentFraction
  lowerLimit = lowerLimit × apportionmentFraction
```

### 6.5 Determine Rate Band

```
If augmentedProfits <= lowerLimit → 'small-profits'
If augmentedProfits > upperLimit → 'main-rate'
Otherwise → 'marginal'
```

### 6.6 Calculate CT Liability

```
If rateBand = 'small-profits':
  ctLiability = taxableTotalProfits × 0.19

If rateBand = 'main-rate':
  ctLiability = taxableTotalProfits × 0.25

If rateBand = 'marginal':
  ctAtMainRate = taxableTotalProfits × 0.25
  standardFraction = 3 / 200  // 0.015
  marginalRelief = standardFraction × (upperLimit - augmentedProfits) × (taxableTotalProfits / augmentedProfits)
  ctLiability = ctAtMainRate - marginalRelief
```

### 6.7 Calculate Key Dates

```
paymentDueDate = periodEnd + 9 months + 1 day
filingDeadline = periodEnd + 12 months
```

### 6.8 Calculate Effective Rate

```
effectiveRate = taxableTotalProfits > 0 ? ctLiability / taxableTotalProfits : 0
```

---

## 7. Rate Tables

### CT Rates (from 1 April 2023)

| Rate | Percentage | Legislation |
|------|-----------|-------------|
| Main rate | 25% | CTA 2010 s.4 |
| Small profits rate | 19% | CTA 2010 s.18 |
| Standard fraction (marginal relief) | 3/200 (0.015) | SI 2023/199 |

### Thresholds (undivided)

| Threshold | Amount | Notes |
|-----------|--------|-------|
| Upper limit | £250,000 | Divided by number of associated companies, apportioned for short periods |
| Lower limit | £50,000 | Divided by number of associated companies, apportioned for short periods |

### Key Deadlines

| Deadline | Timing |
|----------|--------|
| CT payment | 9 months and 1 day after AP end |
| CT600 filing | 12 months after AP end |

---

## 8. Educational Notes

### Inline Tooltips

Each input field has an educational note (see Input Definitions above) explaining WHY the field matters. These are shown as expandable tooltips beneath each input.

### Key Conceptual Points

- **Two-rate system from April 2023:** Before April 2023, all companies paid CT at 19%. The reintroduction of the small profits rate and marginal relief was a significant change. Students must be able to apply the new rules from 2023/24 onwards.
- **TTP vs augmented profits:** TTP determines the TAX CHARGE (the amount multiplied by the rate). Augmented profits determine the RATE BAND (whether small profits, marginal, or main rate). When a company receives exempt distributions (dividends from other companies), its augmented profits increase without increasing TTP — this can push it into a higher rate band.
- **Associated companies — s.25A CTA 2010:** The associated company rules were reintroduced from 1 April 2023 (replacing the related 51% group company rules). Two companies are associated if one controls the other, or both are under common control. Common control by an individual counts — Marcus controlling both C&S (60%) and Caldwell Investments (100%) makes them associated. Dormant companies and passive investment companies are NOT excluded.
- **Marginal relief formula:** The standard fraction of 3/200 was specifically chosen to produce a linear taper from 19% at the lower limit to 25% at the upper limit. The N/A fraction (TTP/augmented profits) ensures the formula gives the correct result when exempt distributions push augmented profits above TTP.
- **Short-period apportionment:** CT thresholds are proportionally reduced for short periods. This prevents companies from gaining an advantage by having a short accounting period. A 6-month period gets half the thresholds.
- **QCD limitation:** Qualifying charitable donations are deducted from total profits, not from each income source. They cannot create or augment a loss — any excess is simply lost (not carried forward). This is different from trading losses which have extensive carry-forward rules.
- **CT payment dates — quarterly instalment payments:** Large companies (augmented profits > £1.5m, divided by associated companies) must pay CT in quarterly instalments. This tool shows the standard payment date (9 months + 1 day) but notes when QIPs may apply.
- **Effective rate analysis:** The effective rate shows the real cost of CT. In the marginal band, the effective rate varies linearly from 19% (at lower limit) to 25% (at upper limit). Understanding this helps with profit extraction planning — an additional £1 of profit in the marginal band is taxed at the marginal rate of 26.5% (the rate at which the effective rate increases).

---

## 9. H&C Test Scenarios

### Scenario 1 — S5: C&S Engineering CT Computation (y/e 31 March 2026)

**Context:** The CT600 for Caldwell & Shaw Engineering Ltd's accounting period y/e 31 March 2026 is due for filing. The student must prepare the complete CT computation incorporating the trading profit from S2, capital allowances from S3, plus other income sources. Caldwell Investments Ltd must be identified as an associated company, dividing the marginal relief thresholds by 2.

**Key data (from fact register):**

| Fact | Value |
|------|-------|
| Company | Caldwell & Shaw Engineering Ltd (Co. 12847593) |
| Accounting period | 1 April 2025 to 31 March 2026 (365 days) |
| Trading profits (after CA) | £87,100 |
| Loan relationship income | £2,400 (NatWest business account interest) |
| Property income | £12,000 (Unit 7B rent from Kelham IT Solutions) |
| Chargeable gains | £0 |
| Qualifying charitable donations | £1,500 (Gift Aid) |
| Exempt ABGH distributions | £0 (C&S receives no dividends from other companies) |
| Associated companies | 2 (C&S Engineering + Caldwell Investments Ltd) |
| Association basis | s.25A CTA 2010 — Marcus controls both (60% of C&S + 100% of Caldwell Investments) |

**Pre-filled inputs:**
- Period start: `2025-04-01`
- Period end: `2026-03-31`
- Trading profits: £87,100
- Loan relationship income: £2,400
- Property income: £12,000
- Chargeable gains: £0
- Qualifying charitable donations: £1,500
- Exempt distributions: £0
- Associated companies: 2

**Expected results:**

| Computation Step | Amount |
|-----------------|--------|
| Trading profits | £87,100 |
| Loan relationship income | £2,400 |
| Property income | £12,000 |
| Chargeable gains | £0 |
| **Total profits** | **£101,500** |
| Less: QCD | (£1,500) |
| **TTP** | **£100,000** |
| Exempt distributions | £0 |
| **Augmented profits** | **£100,000** |
| Upper limit (£250,000 ÷ 2) | £125,000 |
| Lower limit (£50,000 ÷ 2) | £25,000 |
| Rate band | Marginal |
| CT at 25% | £25,000 |
| Marginal relief: 3/200 × (£125,000 − £100,000) × £100,000/£100,000 | (£375) |
| **CT liability** | **£24,625** |
| Effective rate | 24.625% |
| Payment due | 1 January 2027 |
| Filing deadline | 31 March 2027 |

**Key learning points:**
- Caldwell Investments is associated under s.25A CTA 2010 because Marcus controls both companies (60% of C&S + 100% of Caldwell Investments = common control by an individual)
- The association divides the thresholds by 2: upper limit drops from £250,000 to £125,000, lower limit from £50,000 to £25,000
- Without the associated company, C&S's TTP of £100,000 would be between £50,000 and £250,000 — still in the marginal band but with a larger marginal relief (£2,250 vs £375)
- With the associated company: MR = 3/200 × (125,000 − 100,000) × 1 = £375. Without: MR = 3/200 × (250,000 − 100,000) × 1 = £2,250. Cost of association = £2,250 − £375 = £1,875 additional CT
- Augmented profits = TTP because C&S receives no exempt distributions. If it received dividends from other companies, augmented profits would be higher than TTP
- The N/A fraction (TTP/augmented profits) is £100,000/£100,000 = 1 because there are no exempt distributions
- Payment is due 9 months + 1 day after AP end: 1 January 2027

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onInputChange` | Student changes any input field | `{ field, value, timestamp }` |
| `onCompute` | Student triggers CT computation | `{ ttp, augmentedProfits, ctLiability, effectiveRate, rateBand, attemptNumber, timestamp }` |
| `onValidation` | Validation runs | `{ errors, warnings, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onRateBandView` | Student views rate band determination | `{ rateBand, upperLimit, lowerLimit, augmentedProfits, timestamp }` |
| `onMarginalReliefView` | Student views marginal relief detail | `{ formula, relief, ctBefore, ctAfter, timestamp }` |
| `onCT600View` | Student views CT600-format layout | `{ ttp, ctLiability, timestamp }` |

---

## 11. Accessibility & UX

- Tab order: period dates → income components → deductions → augmented profits → associated companies → compute
- Single-panel layout with CT600-format results below the input form
- Rate band banner: green (small profits 19%), blue (marginal), amber (main rate 25%)
- CT600-format computation layout matching exam presentation style
- Marginal relief calculation shown as an expandable detail panel with the full formula
- Associated company threshold detail shown as a breakdown table
- Responsive layout: form fields stack vertically on mobile
- Educational tooltips expand/collapse beneath each input
- Validation runs on "Compute CT" click
- Key dates (payment, filing) shown in a summary box

---

## 12. Computation Flow Diagram

```
Inputs
  │
  ├── Accounting Period (start, end)
  │     │
  │     └── Calculate period days, short period flag, apportionment fraction
  │
  ├── Income Components
  │     │
  │     ├── Trading profits (after CA)
  │     ├── Loan relationship income (may be deficit)
  │     ├── Property income
  │     └── Chargeable gains
  │           │
  │           └── Total profits = sum of all components
  │
  ├── Deductions
  │     │
  │     └── QCD (capped at total profits) → TTP
  │
  ├── Augmented Profits
  │     │
  │     └── TTP + exempt distributions → Augmented profits
  │
  └── Associated Companies
        │
        └── Thresholds ÷ N, × apportionment
              │
              ├── AP ≤ Lower → Small profits rate (19%)
              │
              ├── AP > Upper → Main rate (25%)
              │
              └── Lower < AP ≤ Upper → Marginal rate
                    │
                    ├── CT at 25%
                    ├── Marginal relief = F × (U − A) × N/A
                    └── CT = CT at 25% − MR
                          │
                          └── Effective rate = CT / TTP
```
