# BADR Eligibility Checker and Calculator — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `badr-checker` |
| Tool Slug | `badr-checker` |
| Display Name | BADR Eligibility Checker and Calculator |
| Component Name | `BadrChecker` |
| Real-World Equivalent | HMRC Helpsheet HS275; GOV.UK BADR guidance; standard BADR compliance checklist |
| Tool Type | `decision-tree + calculator` |
| Category | `cgt` |
| Difficulty | Advanced |
| Sections Used | S9 (primary), S11 (secondary) |
| Build Order | 4 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'badr-checker',
  'BADR Eligibility Checker and Calculator',
  'Two-part tool: (1) checks all BADR qualifying conditions (2-year holding, 5% tests, personal company, trading company with 80% threshold), (2) calculates CGT liability at the BADR rate with lifetime limit tracking. Includes associated disposal rent restriction calculation and comparison against standard CGT rates.',
  'BadrChecker',
  'cgt',
  'decision-tree-calculator',
  'advanced',
  true,
  4
);
```

---

## 2. Purpose & Context

Business Asset Disposal Relief (BADR) — formerly Entrepreneurs' Relief — is the most frequently tested CGT relief in the CTA OMB paper. BADR provides a reduced rate of CGT (14% for 2025/26, rising to 18% from 2026/27) on qualifying business disposals up to a £1,000,000 lifetime limit.

### Why This Tool Matters for OMB Students

- **Tested in nearly every sitting:** BADR appears as a major component of exit planning, share disposal, and business disposal questions.
- **Two-part analysis:** Students must first assess eligibility (a decision-tree exercise requiring careful condition checking) and then compute the CGT liability (a calculation exercise). Both skills are examined.
- **Multiple disposal types:** Shares in a personal company, business assets, and associated disposals each have different qualifying conditions.
- **Rate changes:** The BADR rate changed from 10% (2024/25) to 14% (2025/26) to 18% (2026/27). Students must apply the correct rate for the disposal date.
- **Lifetime limit tracking:** The £1,000,000 lifetime limit means prior qualifying disposals reduce the amount available for future claims. Students must track cumulative usage.
- **Exit planning integration:** BADR is central to comparing exit routes (share sale, purchase of own shares, MVL, EOT) — the #1 exam topic.
- **Deferred gains from incorporation:** Where shares were acquired on s.162 incorporation, the base cost reflects deferred gains. Students must understand this.

### Key Legislation

- TCGA 1992 s.169H — BADR definitions
- TCGA 1992 s.169I — relief for relevant business disposals
- TCGA 1992 s.169J — material disposal of business assets
- TCGA 1992 s.169K — associated disposals
- TCGA 1992 s.169N — the qualifying period (2 years)
- TCGA 1992 s.169P — lifetime limit (£1,000,000)
- TCGA 1992 s.169S — personal company definition
- CTA 2010 s.1033 — purchase of own shares (capital treatment conditions)
- HMRC Helpsheet HS275 — Business Asset Disposal Relief
- HMRC Capital Gains Manual CG63950–CG64175

---

## 3. Input Definitions

### 3.1 Disposal Details

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `disposalType` | `select` | `shares` / `business-assets` / `associated-disposal` | **Shares:** disposal of shares in a personal company (the most common exam scenario). **Business assets:** disposal of the whole or part of a business (sole trader/partnership). **Associated disposal:** disposal of a privately-owned asset used by the individual's personal company (e.g., a building owned personally but used by the company). |
| `disposalDate` | `date` | Required. Must be a valid date. | The date of disposal determines which BADR rate applies (10% for 2024/25, 14% for 2025/26, 18% from 2026/27) and which tax year the disposal falls in. |
| `acquisitionDate` | `date` | Required. Must be before disposalDate. | The date the shares/assets were acquired. Used to check the 2-year minimum holding period. For shares acquired on incorporation (s.162 TCGA 1992), this is the date of incorporation, not the original business start date. |

### 3.2 Gain Computation

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `disposalProceeds` | `number` | > 0. Required. | The amount received on disposal (or market value if not an arm's-length transaction). For purchase of own shares, this is the amount paid by the company. |
| `baseCost` | `number` | >= 0. Required. | The allowable base cost. For shares acquired on s.162 incorporation, this is the aggregate base cost of the chargeable assets transferred, allocated to the shares by ownership proportion. Deferred gains from incorporation are embedded in this reduced base cost. |
| `allowableCosts` | `number` | >= 0. Defaults to 0. | Other allowable costs (legal fees, valuation fees, stamp duty on acquisition). |
| `annualExemptAmountUsed` | `number` | >= 0. Defaults to 0. | Annual exempt amount already used against other gains in the same tax year. The AEA for 2024/25 onwards is £3,000. If this disposal is the only gain, enter 0 to apply the full AEA. |

### 3.3 Shareholding Details (shares disposal only)

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `percentShareCapital` | `number` | 0-100. Required if disposal type is shares. | Percentage of the company's ordinary share capital held by the individual. Must be at least 5% throughout the 2-year qualifying period. Note: only ORDINARY share capital counts — preference shares are excluded. |
| `percentVotingRights` | `number` | 0-100. Required if disposal type is shares. | Percentage of voting rights held. Must be at least 5% throughout the 2-year qualifying period. Usually the same as share capital for simple share structures, but can differ if shares carry different voting rights. |
| `isEmployeeOrOfficer` | `boolean` | Required if disposal type is shares. | Whether the individual is (and has been throughout the 2-year qualifying period) an employee or officer (director) of the company. Part-time directors qualify. |

### 3.4 Company Status (shares and associated disposals)

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `tradingIncomePercent` | `number` | 0-100. Required for shares/associated disposals. | Percentage of the company's activities that are trading. The company must be a "trading company" — meaning its activities do not include to a substantial extent activities other than trading. HMRC interprets "substantial" as 20%, so at least 80% of activities must be trading. Activities are assessed by reference to turnover, assets, expenses, and management time — not just income. |
| `tradingIncomeAmount` | `number` | >= 0. Optional. | Absolute trading income (for display/context). |
| `nonTradingIncomeAmount` | `number` | >= 0. Optional. | Absolute non-trading income — rental income, investment income, interest received. For display alongside the percentage test. |

### 3.5 Lifetime Allowance

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `lifetimePreviouslyUsed` | `number` | >= 0. Must not exceed £1,000,000. Defaults to 0. | The cumulative amount of BADR gains previously claimed by this individual. The lifetime limit is £1,000,000 (reduced from £10m from 11 March 2020). If the individual has never claimed BADR, enter 0. |

### 3.6 Taxpayer Details (for rate comparison)

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `taxableIncomeAbovePA` | `number` | >= 0. Defaults to 37700. | The individual's taxable income above the personal allowance. Used to determine how much of the gain falls in the basic rate band (taxed at 18%) vs higher rate (taxed at 24%). If unknown, use £37,700 (i.e., assume higher rate taxpayer — the common scenario for OMB directors). |

### 3.7 Associated Disposal Details (associated disposal only)

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `totalOwnershipDays` | `number` | > 0. Required if associated disposal. | Total number of days the individual owned the asset. |
| `tradeUseDays` | `number` | > 0. Must be <= totalOwnershipDays. | Number of days during ownership that the asset was used for the purposes of the company's trade. Only this proportion of the gain qualifies for BADR (time apportionment). |
| `rentCharged` | `boolean` | Required if associated disposal. | Whether rent was charged to the company for use of the asset. If commercial rent was charged, the gain does NOT qualify for BADR. If rent was below market rate, a partial restriction applies. |
| `rentAsPercentOfMarket` | `number` | 0-100. Required if rentCharged is true. | The rent charged as a percentage of full market rent. 100% = full market rent (no BADR). 0% = rent-free (full BADR on time-apportioned gain). Between 0-100% = proportional restriction. |

---

## 4. Output Definitions

### 4.1 Eligibility Assessment

| Output | Description |
|--------|-------------|
| `overallEligibility` | `qualifying` / `not-qualifying` / `partially-qualifying` — overall BADR eligibility result |
| `eligibilityReason` | Summary explanation of the eligibility determination |
| `conditions` | Array of individual condition results (see below) |

### 4.2 Condition Results

For each qualifying condition:

| Output | Description |
|--------|-------------|
| `conditionId` | Unique condition identifier (e.g., `two-year-holding`) |
| `conditionName` | Display name (e.g., "2-Year Holding Period") |
| `status` | `met` / `not-met` / `not-applicable` |
| `detail` | Specific explanation with relevant values |
| `legislativeRef` | Statutory reference (e.g., "TCGA 1992 s.169I(7)") |
| `educationalNote` | Why this condition matters |

### 4.3 CGT Computation

| Output | Description |
|--------|-------------|
| `gain` | Total chargeable gain (proceeds - base cost - allowable costs) |
| `annualExemptAmount` | AEA applied (£3,000 minus amount already used) |
| `taxableGain` | Gain after AEA |
| `badrQualifyingGain` | Amount qualifying for BADR (may be less than taxable gain if exceeds lifetime remaining) |
| `nonBadrGain` | Taxable gain not qualifying for BADR |
| `badrRate` | The BADR rate for the disposal date (0.10 / 0.14 / 0.18) |
| `cgtAtBadrRate` | CGT on the BADR qualifying gain |
| `standardRateOnExcess` | CGT at standard rate on non-BADR gain |
| `totalCGT` | Total CGT liability (BADR + standard) |
| `effectiveRate` | Effective CGT rate (totalCGT / taxableGain) |

### 4.4 Lifetime Allowance Tracking

| Output | Description |
|--------|-------------|
| `lifetimeLimit` | £1,000,000 |
| `previouslyUsed` | Amount previously claimed |
| `usedOnThisDisposal` | BADR gain on this disposal |
| `remainingAfterDisposal` | Amount remaining for future claims |

### 4.5 Associated Disposal Adjustment (if applicable)

| Output | Description |
|--------|-------------|
| `totalGain` | Gain on the associated asset |
| `timeApportionmentFraction` | tradeUseDays / totalOwnershipDays |
| `timeApportionedGain` | Gain × time apportionment fraction |
| `rentRestrictionFraction` | 1 - (rentAsPercentOfMarket / 100) |
| `badrQualifyingGain` | Time-apportioned gain × rent restriction fraction |

### 4.6 Rate Comparison

| Output | Description |
|--------|-------------|
| `cgtWithBadr` | CGT with BADR applied |
| `cgtWithoutBadr` | CGT at full standard rates (no BADR) |
| `taxSaving` | Difference (saving from BADR) |
| `standardBasicRateAmount` | Amount taxed at 18% standard rate (if any falls in basic band) |
| `standardHigherRateAmount` | Amount taxed at 24% standard rate |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Dates valid | `error` | Disposal date must be provided. Acquisition date must be before disposal date. |
| V2 | Proceeds positive | `error` | Disposal proceeds must be greater than zero. |
| V3 | Shareholding required for shares | `error` | If disposal type is `shares`, share capital % and voting rights % must be provided. |
| V4 | Company status required | `error` | For shares and associated disposals, trading income percentage must be provided. |
| V5 | Lifetime limit check | `warning` | If lifetime previously used >= £1,000,000, no further BADR is available. Warning shown but computation continues to show comparison. |
| V6 | 2-year holding check | `info` | If holding period < 2 years, BADR does not apply. The tool flags this clearly with the exact holding period. |
| V7 | 5% test check | `info` | If shareholding < 5%, BADR does not apply. Shows the shortfall. |
| V8 | Associated disposal inputs | `error` | If disposal type is `associated-disposal`, ownership days and trade use days must be provided. |
| V9 | Gain is positive | `warning` | If gain is zero or negative (proceeds <= base cost + allowable costs), no CGT arises. BADR is irrelevant. |

---

## 6. Calculation Logic

### 6.1 Determine Tax Year

```
taxYear = getTaxYear(disposalDate)
  If disposalDate is between 6 April 2024 and 5 April 2025 → '2024-25'
  If disposalDate is between 6 April 2025 and 5 April 2026 → '2025-26'
  If disposalDate is on or after 6 April 2026 → '2026-27'
```

### 6.2 Look Up BADR Rate

```
badrRate = {
  '2024-25': 10%,
  '2025-26': 14%,
  '2026-27': 18%,
}[taxYear]
```

### 6.3 Check Eligibility Conditions (Shares)

```
Condition 1: 2-Year Holding Period
  holdingDays = disposalDate - acquisitionDate
  holdingYears = holdingDays / 365.25
  met = holdingYears >= 2

Condition 2: 5% Ordinary Share Capital
  met = percentShareCapital >= 5

Condition 3: 5% Voting Rights
  met = percentVotingRights >= 5

Condition 4: Employee or Officer
  met = isEmployeeOrOfficer === true

Condition 5: Personal Company
  met = conditions 2, 3, and 4 are all met
  (Personal company = holds >= 5% of ordinary shares, >= 5% of votes, AND is employee/officer)

Condition 6: Trading Company (80% Test)
  met = tradingIncomePercent >= 80
```

### 6.4 Compute CGT

```
Step 1: Compute gain
  gain = disposalProceeds - baseCost - allowableCosts

Step 2: Apply AEA
  aeaAvailable = max(0, 3000 - annualExemptAmountUsed)
  aeaApplied = min(gain, aeaAvailable)
  taxableGain = gain - aeaApplied

Step 3: Determine BADR qualifying gain
  lifetimeRemaining = 1,000,000 - lifetimePreviouslyUsed
  badrQualifyingGain = min(taxableGain, lifetimeRemaining)
  nonBadrGain = taxableGain - badrQualifyingGain

  If NOT eligible:
    badrQualifyingGain = 0
    nonBadrGain = taxableGain

Step 4: Compute CGT
  cgtAtBadr = badrQualifyingGain × badrRate

  // Standard rate on excess (if any)
  basicRateBandRemaining = max(0, 37700 - taxableIncomeAbovePA)
  gainInBasicBand = min(nonBadrGain, basicRateBandRemaining)
  gainInHigherBand = nonBadrGain - gainInBasicBand
  standardCGT = (gainInBasicBand × 0.18) + (gainInHigherBand × 0.24)

  totalCGT = cgtAtBadr + standardCGT
```

### 6.5 Associated Disposal Adjustment

```
If disposalType = 'associated-disposal':
  timeApportionmentFraction = tradeUseDays / totalOwnershipDays
  timeApportionedGain = taxableGain × timeApportionmentFraction

  If rentCharged:
    rentRestriction = 1 - (rentAsPercentOfMarket / 100)
    badrQualifyingGain = timeApportionedGain × rentRestriction
  Else:
    badrQualifyingGain = timeApportionedGain

  nonBadrGain = taxableGain - badrQualifyingGain
```

### 6.6 Rate Comparison

```
// CGT without BADR (all at standard rates)
allGainInBasicBand = min(taxableGain, basicRateBandRemaining)
allGainInHigherBand = taxableGain - allGainInBasicBand
cgtWithoutBadr = (allGainInBasicBand × 0.18) + (allGainInHigherBand × 0.24)

taxSaving = cgtWithoutBadr - totalCGT
```

---

## 7. Rate Tables

### BADR Rates

| Tax Year | Rate | Legislation |
|----------|------|-------------|
| 2024/25 | 10% | TCGA 1992 s.169N |
| 2025/26 | 14% | Finance Act 2025 |
| 2026/27+ | 18% | Finance Act 2025 |

### Standard CGT Rates (from 30 October 2024)

| Band | Rate | Applies To |
|------|------|------------|
| Basic rate | 18% | Gains within unused basic rate band |
| Higher rate | 24% | Gains above basic rate band |

### Annual Exempt Amount

| Tax Year | AEA |
|----------|-----|
| 2024/25 onwards | £3,000 |

### Key Limits

| Limit | Amount | Notes |
|-------|--------|-------|
| Lifetime limit | £1,000,000 | Reduced from £10m from 11 March 2020 |
| Minimum holding period | 2 years | Continuous throughout qualifying period |
| Minimum share capital | 5% | Ordinary shares only |
| Minimum voting rights | 5% | Throughout qualifying period |
| Trading company threshold | 80% | Activities that are trading |

---

## 8. Educational Notes

### Inline Tooltips

Each input field has an educational note (see Input Definitions above) explaining WHY the field matters. These are shown as expandable tooltips beneath each input.

### Key Conceptual Points

- **BADR renamed from Entrepreneurs' Relief:** From April 2020, Entrepreneurs' Relief was renamed to Business Asset Disposal Relief. The conditions are the same — only the name changed. Students may encounter both names in older materials and exam questions.
- **2-year qualifying period is continuous:** The conditions must be met throughout the entire 2-year period ending with disposal. If any condition is broken even briefly (e.g., shareholding drops below 5%), BADR is lost.
- **Personal company test is compound:** The individual must hold at least 5% of ordinary share capital AND at least 5% of voting rights AND be an employee or officer. All three elements must be satisfied simultaneously.
- **Trading company test — "substantial":** HMRC interprets "substantial" non-trading activity as 20%+. So at least 80% of the company's activities must be trading. The test considers turnover, assets, expenses, and management time — not just one factor.
- **Lifetime limit is cumulative:** The £1,000,000 limit applies to all BADR claims made by the individual throughout their lifetime, not per disposal. Each qualifying gain reduces the available limit for future claims.
- **Deferred gains from incorporation:** Where shares were acquired on s.162 TCGA 1992 incorporation, the base cost of the shares reflects the deferred gains. The gain crystallises when the shares are disposed of. The base cost is the aggregate base cost of the chargeable assets transferred, allocated by ownership proportion.
- **Purchase of own shares and BADR:** If a company buys back its own shares and the s.1033 CTA 2010 conditions are met (5-year ownership, trade benefit, substantial reduction, not connected post-purchase), the distribution is treated as capital. BADR can then apply to the gain.
- **Associated disposals:** When an individual disposes of a personal asset used by their company, the gain may qualify for BADR if the disposal is associated with a material disposal (e.g., share sale). Time apportionment and rent restrictions apply.
- **Rate comparison matters:** Even when BADR applies, the rate advantage over standard rates has narrowed. For 2026/27, BADR at 18% vs standard higher rate at 24% gives only a 6% saving (vs 14% saving when BADR was 10%). Students should quantify the actual saving.

---

## 9. H&C Test Scenarios

### Scenario 1 — S9: Marcus BADR Eligibility Check (Pre-Exit)

**Context:** Marcus is exploring share disposal options as part of early exit planning. The student must assess his BADR eligibility on his 600 shares (60% holding) in C&S Engineering and run an illustrative CGT computation to quantify the potential tax saving from BADR.

**Key data (from fact register):**

| Fact | Value |
|------|-------|
| Disposal type | Shares in personal company |
| Disposal date | 31 October 2026 (S9 timeline) |
| Acquisition date | 18 March 2019 (incorporation) |
| Shares held | 600 of 1,000 (60%) |
| Voting rights | 60% |
| Role | Managing Director (employee/officer) |
| Trading income | ~£2,400,000 (~99.4% of total income) |
| Non-trading income | ~£14,400 (rent £12,000 + interest £2,400) |
| Share value (illustrative) | £750/share → proceeds = £450,000 |
| Base cost (s.162 incorporation) | £246,000 (60% × £410,000) |
| Allowable costs | £2,000 (legal/valuation fees) |
| BADR previously used | £nil |
| Other taxable income | ~£86,000 (higher rate taxpayer) |

**Pre-filled inputs:**
- Disposal type: `shares`
- Disposal date: `2026-10-31`
- Acquisition date: `2019-03-18`
- Proceeds: £450,000
- Base cost: £246,000
- Allowable costs: £2,000
- Share capital: 60%
- Voting rights: 60%
- Employee/officer: Yes
- Trading income %: 99.4%
- Lifetime previously used: £0
- Taxable income above PA: £86,000

**Expected results:**

| Condition | Status | Detail |
|-----------|--------|--------|
| 2-year holding | Met | 7 years 7 months (18 Mar 2019 to 31 Oct 2026) |
| 5% share capital | Met | 60% > 5% |
| 5% voting rights | Met | 60% > 5% |
| Employee/officer | Met | Managing Director |
| Personal company | Met | All sub-conditions met |
| Trading company | Met | 99.4% trading activities (well above 80%) |

| Computation | Amount |
|-------------|--------|
| Proceeds | £450,000 |
| Base cost | (£246,000) |
| Allowable costs | (£2,000) |
| Gain | £202,000 |
| AEA | (£3,000) |
| Taxable gain | £199,000 |
| BADR qualifying gain | £199,000 |
| CGT at 18% BADR | £35,820 |
| CGT without BADR (24%) | £47,760 |
| Tax saving | £11,940 |
| Remaining lifetime | £801,000 |

**Key learning points:**
- All six BADR conditions are met — Marcus is the textbook qualifying shareholder
- Base cost of £246,000 reflects deferred gains from the s.162 incorporation (total deferred gains of £270,000, Marcus's 60% share = £162,000)
- The deferred gains crystallise on share disposal — the effective gain includes the historical appreciation from the partnership era
- Disposal in 2026/27 means the 18% BADR rate applies (not 14%)
- Tax saving of £11,940 (24% vs 18% on £199,000) — quantify this for the client

---

### Scenario 2 — S11: Marcus Exit Route — Share Sale (400 Shares Post-S10)

**Context:** Marcus has sold 200 shares to Sophie in S10 (reducing from 600 to 400 shares, 40% holding). He now plans to sell his remaining 400 shares as part of a complete exit. The student must compute the CGT with BADR for the share sale route in the exit comparison.

**Key data (from fact register):**

| Fact | Value |
|------|-------|
| Disposal type | Shares in personal company |
| Disposal date | 31 March 2027 (S11 timeline) |
| Acquisition date | 18 March 2019 |
| Shares held | 400 of 1,000 (40%) — post S10 |
| Voting rights | 40% |
| Role | Managing Director (still employee/officer at disposal) |
| Trading income | ~99.4% |
| Share value | £750/share → proceeds = £300,000 |
| Base cost | £164,000 (400 × £410/share) |
| Allowable costs | £3,000 (legal/valuation fees) |
| BADR previously used | £0 (assume S9 was illustrative only) |
| Other taxable income | ~£86,000 |

**Pre-filled inputs:**
- Disposal type: `shares`
- Disposal date: `2027-03-31`
- Acquisition date: `2019-03-18`
- Proceeds: £300,000
- Base cost: £164,000
- Allowable costs: £3,000
- Share capital: 40%
- Voting rights: 40%
- Employee/officer: Yes
- Trading income %: 99.4%
- Lifetime previously used: £0
- Taxable income above PA: £86,000

**Expected results:**

| Condition | Status | Detail |
|-----------|--------|--------|
| 2-year holding | Met | 8 years (18 Mar 2019 to 31 Mar 2027) |
| 5% share capital | Met | 40% > 5% |
| 5% voting rights | Met | 40% > 5% |
| Employee/officer | Met | Managing Director |
| Personal company | Met | All sub-conditions met |
| Trading company | Met | 99.4% trading |

| Computation | Amount |
|-------------|--------|
| Proceeds | £300,000 |
| Base cost | (£164,000) |
| Allowable costs | (£3,000) |
| Gain | £133,000 |
| AEA | (£3,000) |
| Taxable gain | £130,000 |
| BADR qualifying gain | £130,000 |
| CGT at 18% BADR | £23,400 |
| CGT without BADR (24%) | £31,200 |
| Tax saving | £7,800 |
| Remaining lifetime | £870,000 |

**Key learning points:**
- Marcus still qualifies for BADR at 40% (well above 5% threshold)
- Student should note that if Marcus's holding had dropped below 5%, BADR would be lost
- In exit comparison (S11), this CGT figure feeds into the Route 1 (share sale to Sophie) analysis
- The same computation structure applies to Route 2 (purchase of own shares) if s.1033 conditions are met — the gain is the same, just the payer differs (company vs Sophie)
- Student should identify that Route 4 (EOT) provides 100% CGT exemption vs BADR's reduced rate

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onDisposalTypeChange` | Student changes disposal type | `{ disposalType, timestamp }` |
| `onEligibilityCheck` | Student triggers eligibility assessment | `{ conditions, overallResult, timestamp }` |
| `onCompute` | Student triggers CGT computation | `{ totalCGT, badrGain, taxSaving, attemptNumber, timestamp }` |
| `onValidation` | Validation runs | `{ errors, warnings, timestamp }` |
| `onConditionToggle` | Student views a condition detail | `{ conditionId, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onComparisonView` | Student views the rate comparison | `{ withBadr, withoutBadr, saving, timestamp }` |

---

## 11. Accessibility & UX

- Tab order: disposal type → dates → proceeds/cost → shareholding → company status → lifetime → compute
- Two-panel layout: left panel for eligibility conditions (decision tree), right panel for CGT computation (calculator)
- Condition cards show met/not-met status with traffic-light colours (green/red/grey)
- Eligibility result banner: green (qualifying), red (not qualifying), amber (partially qualifying)
- CGT computation shown in exam-answer format
- Rate comparison shown as a side-by-side table with tax saving highlighted
- Responsive layout: stacks panels vertically on mobile
- Lifetime allowance shown as a progress bar (used/remaining out of £1m)
- Disposal type selection dynamically shows/hides relevant input sections
- Educational tooltips expand/collapse beneath each input
- Validation runs on "Check Eligibility" and "Compute CGT" clicks

---

## 12. Computation Flow Diagram

```
Disposal Type
   │
   ├── Shares
   │     │
   │     ├── Check 2-year holding period
   │     ├── Check 5% share capital
   │     ├── Check 5% voting rights
   │     ├── Check employee/officer status
   │     ├── Derive personal company (compound of above)
   │     ├── Check 80% trading company test
   │     │
   │     └── All met? → QUALIFYING
   │           │
   │           ├── Compute gain (proceeds - base cost - costs)
   │           ├── Apply AEA
   │           ├── Check lifetime remaining
   │           ├── BADR gain = min(taxable gain, lifetime remaining)
   │           ├── CGT at BADR rate
   │           ├── Excess at standard rate (if any)
   │           └── Rate comparison (with vs without BADR)
   │
   ├── Business Assets
   │     │
   │     ├── Check 2-year trading period
   │     ├── Check business disposal type (whole/part)
   │     │
   │     └── Met? → QUALIFYING → same CGT computation
   │
   └── Associated Disposal
         │
         ├── Check qualifying conditions
         ├── Time apportionment (trade use / total ownership)
         ├── Rent restriction (if rent charged)
         │
         └── BADR gain = apportioned gain × rent restriction
               │
               └── CGT computation on split gain
```
