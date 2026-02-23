# Termination Payment Analyser (PENP Calculator) — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `penp-calculator` |
| Tool Slug | `penp-calculator` |
| Display Name | Termination Payment Analyser (PENP Calculator) |
| Component Name | `PenpCalculator` |
| Real-World Equivalent | HMRC PENP formula on GOV.UK; standard termination payment working paper |
| Tool Type | `calculator` |
| Category | `employment-tax` |
| Difficulty | Advanced |
| Sections Used | S7 (primary) |
| Build Order | 7 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'penp-calculator',
  'Termination Payment Analyser (PENP Calculator)',
  'Breaks down a termination payment into its taxable and exempt components. Calculates Post-Employment Notice Pay (PENP) using the statutory formula ((BP × D) / P − T), classifies each payment component, applies the £30,000 exemption, computes employer Class 1A NIC on the excess, and cross-checks statutory redundancy.',
  'PenpCalculator',
  'employment-tax',
  'calculator',
  'advanced',
  true,
  7
);
```

---

## 2. Purpose & Context

The Post-Employment Notice Pay (PENP) rules, introduced by Finance (No.2) Act 2017 effective from 6 April 2018, fundamentally changed how termination payments are taxed. Before PENP, employers could structure termination payments to avoid tax by making payments in lieu of notice (PILONs) without a contractual PILON clause. The PENP formula now automatically treats a portion of any termination payment as employment earnings where notice is not fully served.

### Why This Tool Matters for OMB Students

- **Section 7.D is Level 1:** Termination payments and PENP are core syllabus content, tested frequently in CTA OMB exams.
- **Multi-component classification:** Students must correctly classify each element of a termination package — contractual PILON, PENP, statutory redundancy, restrictive covenant, and ex gratia — each with different tax treatment. This requires genuine analytical skill.
- **£30,000 exemption application:** Understanding the ordering rules (what reduces the £30,000 exemption and what does not) is a common exam pitfall.
- **Employer NIC obligations:** Two distinct NIC charges arise — employer Class 1 on elements treated as earnings, and employer Class 1A on the termination payment element exceeding £30,000.
- **Statutory redundancy cross-check:** Students must verify statutory redundancy entitlements using age, service years, and the capped weekly pay.
- **Restrictive covenant change:** Since 6 April 2020, restrictive covenant payments are taxable as employment earnings — a recent change that students may miss.
- **Practical relevance:** Every employer faces termination payment calculations. CTA candidates advising OMBs must understand the tax implications for both employer and employee.

### Key Legislation

- ITEPA 2003 s.401 — Payments and benefits on termination of employment
- ITEPA 2003 s.402A — Termination awards: treatment of relevant termination awards
- ITEPA 2003 s.402B — Section 402A: "relevant termination award"
- ITEPA 2003 s.402C — Section 402A: "post-employment notice pay"
- ITEPA 2003 s.402D — Calculation of post-employment notice pay
- ITEPA 2003 s.402E — Treatment of post-employment notice pay
- ITEPA 2003 s.403 — Charge to tax on termination payments: £30,000 threshold
- ITEPA 2003 s.309 — Exemption for statutory redundancy payments
- ITEPA 2003 s.225A — Restrictive covenant payments treated as earnings (from 6 April 2020)
- ERA 1996 s.135-165 — Statutory redundancy pay
- SSCBA 1992 — Class 1A NIC on termination payments exceeding £30,000
- HMRC Employment Income Manual EIM13874–EIM13890 — PENP guidance

---

## 3. Input Definitions

### 3.1 Employee Details

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `employeeName` | `string` | Optional. For display only. | The employee's name. Used for labelling the output — not required for the computation. |
| `dateOfBirth` | `date` | Required for statutory redundancy cross-check. | Date of birth determines the employee's age at termination, which affects the statutory redundancy multiplier (1.5 weeks for age 41+, 1 week for age 22-40, 0.5 weeks for under 22). |
| `employmentStartDate` | `date` | Required. Must be before termination date. | The date continuous employment began. Used to calculate complete years of service for the statutory redundancy cross-check. |
| `terminationDate` | `date` | Required. Must be after employment start date. | The last day of employment (the leaving date). This is the date from which the post-employment notice period begins. The tax year of this date determines applicable rates. |

### 3.2 Pay Details

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `basicPay` | `number` | > 0. Required. | **BP** in the PENP formula. This is the employee's basic pay in the last pay period before the trigger date (usually the date notice was given). It excludes overtime, bonuses, commission, benefits in kind, and employer pension contributions. Only basic contractual pay. |
| `payPeriodType` | `select` | `monthly` / `weekly` / `fortnightly` / `four-weekly` / `annual` / `custom` | The frequency of the employee's pay. Determines the value of P in the PENP formula. Monthly = 30.42 days (365/12). Weekly = 7 days. |
| `payPeriodDays` | `number` | > 0. Required if custom. | **P** in the PENP formula. The number of calendar days in the employee's last pay period. For standard periods: monthly = 30.42, weekly = 7, fortnightly = 14, four-weekly = 28, annual = 365. For monthly employees, 30.42 is the statutory default (365 ÷ 12). |

### 3.3 Notice Details

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `contractualNoticeDays` | `number` | > 0. Required. | The employee's contractual notice period expressed in calendar days. If the contract states notice in months, convert to days (e.g., 3 months = 91 days, or use the actual calendar days). The minimum statutory notice is 1 week per year of service (max 12 weeks). |
| `noticeServedDays` | `number` | >= 0. Must be <= contractualNoticeDays. | The number of calendar days of notice actually served by the employee (i.e., days worked during the notice period). If the employee was placed on garden leave for the full notice period, this is still "served" as the employment continues. |
| `hasContractualPILON` | `boolean` | Required. | Whether the employment contract contains a Payment in Lieu of Notice (PILON) clause. If yes, any PILON is fully taxable as employment earnings (not subject to the PENP formula — it goes directly into T). If no PILON clause exists, the PENP formula applies to calculate the earnings element. |
| `contractualPILONAmount` | `number` | >= 0. Required if hasContractualPILON is true. | The amount of contractual PILON paid. This is fully taxable as employment earnings and counts towards T in the PENP formula (reducing the additional PENP charge). |

### 3.4 Termination Payment Components

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `priorTaxableTerminationPayments` | `number` | >= 0. Defaults to 0. | **T** in the PENP formula (excluding contractual PILON which is added automatically). Any other amounts already paid and treated as taxable termination payments. This reduces the PENP charge. |
| `statutoryRedundancyAmount` | `number` | >= 0. | The statutory redundancy payment. This is completely exempt from income tax (ITEPA 2003 s.309) and does NOT count against the £30,000 exemption. The tool provides a cross-check calculation, but the employer's figure may differ due to enhanced terms. |
| `restrictiveCovenantAmount` | `number` | >= 0. | Payment for agreeing to a restrictive covenant (e.g., non-compete clause). Since 6 April 2020 (Finance Act 2020), ALL restrictive covenant payments are taxable as employment earnings — they are no longer within the £30,000 exemption. This is a common exam trap. |
| `exGratiaAmount` | `number` | >= 0. | The ex gratia / goodwill / loyalty payment. This is the element that is subject to the £30,000 exemption. Any amount within £30,000 (after deducting other non-earnings elements) is exempt from income tax. The excess is taxable and subject to employer Class 1A NIC. |

### 3.5 Statutory Redundancy Cross-Check

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `cappedWeeklyPay` | `number` | > 0. Defaults to 643. | The statutory cap on a week's pay for redundancy calculation purposes. Updated annually from 6 April. For 2025/26: £643. For 2024/25: £643. The actual weekly pay is used if below the cap; the cap applies if actual weekly pay exceeds it. |
| `isRedundancy` | `boolean` | Required. | Whether the termination is a genuine redundancy (role no longer needed). If not a redundancy, no statutory redundancy payment is due, and the cross-check is skipped. |

---

## 4. Output Definitions

### 4.1 PENP Calculation

| Output | Description |
|--------|-------------|
| `basicPay` | BP — basic pay per period |
| `unservedNoticeDays` | D — calendar days in the unserved notice period |
| `payPeriodDays` | P — calendar days in the pay period |
| `priorTaxablePayments` | T — taxable termination payments already made (including contractual PILON) |
| `penpFormula` | Display string: "((£BP × D) / P) − T" with values substituted |
| `penpAmount` | The PENP result (floored to 0 if negative) |

### 4.2 Component Classification

For each payment component:

| Output | Description |
|--------|-------------|
| `componentName` | Display name (e.g., "Contractual PILON", "PENP", "Statutory Redundancy") |
| `amount` | The amount of the component |
| `taxTreatment` | `taxable-earnings` / `exempt` / `thirty-thousand-exemption` |
| `taxTreatmentLabel` | Human-readable label (e.g., "Taxable as earnings", "Exempt (s.309)") |
| `legislativeRef` | Statutory reference |
| `educationalNote` | Why this treatment applies |
| `employerNICType` | `class-1` / `class-1a` / `none` |

### 4.3 £30,000 Exemption

| Output | Description |
|--------|-------------|
| `totalTerminationAward` | Total of all termination payment components |
| `earningsElements` | Sum of PENP + contractual PILON + restrictive covenant |
| `exemptElements` | Statutory redundancy (separately exempt) |
| `relevantTerminationAward` | Total minus earnings elements minus exempt elements |
| `exemptionLimit` | £30,000 |
| `amountWithinExemption` | min(relevantTerminationAward, £30,000) |
| `amountExceedingExemption` | max(0, relevantTerminationAward − £30,000) |
| `remainingExemption` | £30,000 minus amountWithinExemption |

### 4.4 Employer NIC

| Output | Description |
|--------|-------------|
| `class1NICBase` | Earnings elements subject to employer Class 1 NIC |
| `class1NICRate` | Employer Class 1 NIC rate (15% for 2025/26+, 13.8% for 2024/25) |
| `class1NICAmount` | Employer Class 1 NIC on earnings elements |
| `class1ANICBase` | Amount exceeding £30,000 exemption |
| `class1ANICRate` | Class 1A NIC rate (same as Class 1 employer rate) |
| `class1ANICAmount` | Employer Class 1A NIC on excess |
| `totalEmployerNIC` | Total employer NIC (Class 1 + Class 1A) |

### 4.5 Statutory Redundancy Cross-Check

| Output | Description |
|--------|-------------|
| `ageAtTermination` | Employee's age at termination date |
| `completeYearsOfService` | Complete years (capped at 20) |
| `breakdown` | Array of { year, ageAtStart, multiplier } for each year |
| `totalWeeks` | Total weeks' pay entitlement |
| `cappedWeeklyPay` | The cap applied |
| `calculatedAmount` | totalWeeks × cappedWeeklyPay |
| `enteredAmount` | The statutory redundancy amount entered by the user |
| `difference` | calculatedAmount − enteredAmount |

### 4.6 Summary

| Output | Description |
|--------|-------------|
| `grossTerminationPackage` | Total of all components |
| `totalTaxableAsEarnings` | PENP + PILON + restrictive covenant |
| `totalExempt` | Statutory redundancy |
| `totalWithinThirtyThousand` | Amount sheltered by £30,000 exemption |
| `totalTaxableAboveThirtyThousand` | Amount exceeding £30,000 (taxable + Class 1A NIC) |
| `totalEmployerNIC` | Class 1 + Class 1A NIC |
| `totalCostToEmployer` | Gross package + total employer NIC |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Dates valid | `error` | Termination date must be provided. Employment start date must be before termination date. Date of birth must be before employment start date (if provided). |
| V2 | Basic pay positive | `error` | Basic pay must be greater than zero. |
| V3 | Notice period valid | `error` | Contractual notice period must be greater than zero. Notice served must not exceed contractual notice. |
| V4 | Pay period valid | `error` | Pay period days must be greater than zero. |
| V5 | PILON consistency | `warning` | If contractual PILON is indicated but amount is zero, flag as potentially incomplete. |
| V6 | Statutory redundancy cross-check | `info` | If the entered statutory redundancy differs from the calculated amount by more than £100, flag for review. The employer may be paying enhanced terms (above statutory minimum). |
| V7 | PENP is zero | `info` | If D = 0 (all notice served), PENP is zero and no earnings reclassification applies. This is the ideal scenario for tax efficiency. |
| V8 | Restrictive covenant since April 2020 | `info` | Restrictive covenant payments entered are taxable as earnings since 6 April 2020. Prior to that date, they were within the £30,000 exemption. If the termination date is before 6 April 2020, the treatment differs. |
| V9 | £30,000 threshold | `warning` | If the relevant termination award exceeds £30,000, the excess is taxable and employer Class 1A NIC applies. Flag this clearly. |

---

## 6. Calculation Logic

### 6.1 Determine Tax Year and Rates

```
taxYear = getTaxYear(terminationDate)
  If terminationDate is between 6 April 2024 and 5 April 2025 → '2024-25'
  If terminationDate is between 6 April 2025 and 5 April 2026 → '2025-26'
  If terminationDate is on or after 6 April 2026 → '2026-27'

employerNICRate = {
  '2024-25': 13.8%,
  '2025-26': 15%,
  '2026-27': 15%,
}[taxYear]
```

### 6.2 Calculate Unserved Notice

```
D = contractualNoticeDays - noticeServedDays
If D < 0: D = 0
```

### 6.3 Determine Pay Period Days

```
P = {
  'monthly': 30.42,
  'weekly': 7,
  'fortnightly': 14,
  'four-weekly': 28,
  'annual': 365,
  'custom': payPeriodDays (user-entered),
}[payPeriodType]
```

### 6.4 Calculate PENP

```
T = priorTaxableTerminationPayments + contractualPILONAmount

penpAmount = max(0, ((basicPay × D) / P) − T)
```

### 6.5 Classify Components

```
Component 1: Contractual PILON
  amount = contractualPILONAmount
  treatment = taxable-earnings
  employerNIC = class-1

Component 2: PENP
  amount = penpAmount
  treatment = taxable-earnings
  employerNIC = class-1

Component 3: Statutory Redundancy
  amount = statutoryRedundancyAmount
  treatment = exempt (s.309)
  employerNIC = none

Component 4: Restrictive Covenant
  amount = restrictiveCovenantAmount
  treatment = taxable-earnings (since 6 April 2020)
  employerNIC = class-1

Component 5: Ex Gratia
  amount = exGratiaAmount
  treatment = thirty-thousand-exemption
  employerNIC = class-1a (on excess only)
```

### 6.6 Apply £30,000 Exemption

```
earningsElements = contractualPILON + PENP + restrictiveCovenant
exemptElements = statutoryRedundancy
relevantTerminationAward = exGratia  // Only ex gratia goes through the £30,000 test

amountWithinExemption = min(relevantTerminationAward, 30000)
amountExceedingExemption = max(0, relevantTerminationAward - 30000)
remainingExemption = 30000 - amountWithinExemption
```

### 6.7 Compute Employer NIC

```
// Class 1 on earnings elements
class1Base = PENP + contractualPILON + restrictiveCovenant
class1NIC = class1Base × employerNICRate

// Class 1A on excess over £30,000
class1ABase = amountExceedingExemption
class1ANIC = class1ABase × employerNICRate

totalEmployerNIC = class1NIC + class1ANIC
```

### 6.8 Statutory Redundancy Cross-Check

```
completeYears = min(20, floor(years between startDate and terminationDate))

For each year (counting backwards from most recent anniversary):
  ageAtStart = age at the start of that service year
  If ageAtStart >= 41: multiplier = 1.5
  Else if ageAtStart >= 22: multiplier = 1.0
  Else: multiplier = 0.5
  totalWeeks += multiplier

calculatedRedundancy = totalWeeks × cappedWeeklyPay
```

---

## 7. Rate Tables

### Employer NIC Rates

| Tax Year | Class 1 Employer Rate | Class 1A Rate | Legislation |
|----------|-----------------------|---------------|-------------|
| 2024/25 | 13.8% | 13.8% | SSCBA 1992 |
| 2025/26+ | 15% | 15% | National Insurance Contributions (Secondary Class 1 Contributions) Act 2025 |

### Statutory Redundancy Multipliers

| Employee Age at Start of Service Year | Weeks' Pay per Year |
|----------------------------------------|---------------------|
| 41 or over | 1.5 weeks |
| 22 to 40 | 1.0 week |
| Under 22 | 0.5 weeks |

### Statutory Redundancy Caps

| Tax Year | Capped Weekly Pay | Maximum Years |
|----------|-------------------|---------------|
| 2024/25 | £643 | 20 |
| 2025/26 | £643 | 20 |

### £30,000 Exemption

| Limit | Amount | Since |
|-------|--------|-------|
| Exemption threshold | £30,000 | Unchanged since introduction |

### Pay Period Standard Days

| Period | Days (P) |
|--------|----------|
| Monthly | 30.42 (365 ÷ 12) |
| Weekly | 7 |
| Fortnightly | 14 |
| Four-weekly | 28 |
| Annual | 365 |

---

## 8. Educational Notes

### Inline Tooltips

Each input field has an educational note (see Input Definitions above) explaining WHY the field matters. These are shown as expandable tooltips beneath each input.

### Key Conceptual Points

- **PENP replaces the old PILON loophole:** Before 6 April 2018, if there was no contractual PILON clause, the entire termination payment could potentially fall within the £30,000 exemption. The PENP rules now automatically treat a portion as earnings, regardless of whether there is a PILON clause.
- **BP excludes variable pay:** Basic pay in the PENP formula is ONLY basic contractual pay in the last pay period. It excludes overtime, bonuses, commission, benefits in kind, share-based payments, and employer pension contributions. Students often include these incorrectly.
- **P = 30.42 for monthly employees:** The statutory default for monthly-paid employees is 30.42 days (365 ÷ 12). This is NOT the number of days in the actual last month — it is a standardised figure.
- **Statutory redundancy is separately exempt:** Statutory redundancy is exempt from income tax under s.309 ITEPA 2003. It does NOT count against the £30,000 exemption. This is a common exam error — students often deduct statutory redundancy from the £30,000.
- **Restrictive covenant — post April 2020 change:** Since 6 April 2020, ALL restrictive covenant payments are taxable as employment earnings. Before that date, they could fall within the £30,000 exemption. This is a frequently tested exam point.
- **£30,000 exemption ordering:** Only the "relevant termination award" is tested against £30,000. This is the total termination payment AFTER removing (1) amounts taxable as earnings (PENP, PILON, restrictive covenant) and (2) statutory redundancy (separately exempt). In practice, this usually means only the ex gratia element is tested against £30,000.
- **Employer Class 1 vs Class 1A:** Two distinct NIC charges arise: (1) employer Class 1 NIC on elements treated as employment earnings (PENP, PILON, restrictive covenant) — at the standard employer NIC rate, and (2) employer Class 1A NIC on the termination payment element exceeding £30,000 — also at the same rate. No employee NIC applies to termination payments (even on amounts exceeding £30,000).
- **No employee NIC on termination payments:** Even where the termination payment exceeds £30,000, no employee NIC is due on the excess. Only employer Class 1A NIC applies. This makes termination payments more tax-efficient than equivalent salary for the employee.
- **PENP cannot be negative:** If the PENP formula produces a negative result (because T exceeds ((BP × D) / P)), PENP is treated as zero. The negative amount does not create a deduction.
- **Contractual PILON is fully taxable regardless:** If the employment contract contains a PILON clause, the PILON is fully taxable as employment earnings — the PENP formula still applies but the contractual PILON feeds into T, reducing the additional PENP charge.

---

## 9. H&C Test Scenarios

### Scenario 1 — S7: Dave Reynolds Redundancy Package

**Context:** Dave Reynolds, Senior CNC Programmer at C&S Engineering Ltd, is being made redundant due to automation of CNC programming with AI-assisted CAM software. He has 15 years' service, is aged 52, and his termination package includes statutory redundancy, a £25,000 ex gratia payment, and a £5,000 restrictive covenant. The student must calculate PENP, classify each component, and determine the employer NIC position.

**Key data (from fact register):**

| Fact | Value |
|------|-------|
| Employee | Dave Reynolds |
| Date of birth | 8 October 1973 |
| Employment start | 14 March 2011 |
| Termination date | 30 June 2026 |
| Age at termination | 52 |
| Years of service | 15 complete years |
| Annual salary | £42,000 (£3,500/month) |
| Pay period | Monthly (P = 30.42) |
| Contractual notice | 3 months (91 days) |
| Notice given | 1 June 2026 |
| Notice served | 1 month (30 days) |
| Unserved notice (D) | 61 days |
| Contractual PILON | No |
| Statutory redundancy | To be calculated |
| Ex gratia | £25,000 |
| Restrictive covenant | £5,000 (12-month non-compete) |

**Pre-filled inputs:**
- Employee name: `Dave Reynolds`
- Date of birth: `1973-10-08`
- Employment start: `2011-03-14`
- Termination date: `2026-06-30`
- Basic pay: £3,500
- Pay period: Monthly (P = 30.42)
- Contractual notice: 91 days
- Notice served: 30 days
- Contractual PILON: No
- Prior taxable termination payments: £0
- Statutory redundancy: £13,181.50 (auto-calculated)
- Restrictive covenant: £5,000
- Ex gratia: £25,000
- Capped weekly pay: £643
- Is redundancy: Yes

**Expected results:**

| PENP Calculation | |
|------------------|---|
| BP | £3,500 |
| D | 61 days |
| P | 30.42 |
| T | £0 |
| Formula | (£3,500 × 61) / 30.42 − £0 |
| PENP | £7,018.41 |

| Component | Amount | Tax Treatment | Employer NIC |
|-----------|--------|---------------|--------------|
| PENP | £7,018.41 | Taxable as earnings | Class 1 (15%) |
| Statutory redundancy | £13,181.50 | Exempt (s.309) | None |
| Restrictive covenant | £5,000.00 | Taxable as earnings | Class 1 (15%) |
| Ex gratia | £25,000.00 | £30,000 exemption | Class 1A (if excess) |

| Statutory Redundancy Cross-Check | |
|----------------------------------|---|
| Age at termination | 52 |
| Complete years of service | 15 |
| Years at age 41+ (1.5 weeks) | 11 years = 16.5 weeks |
| Years at age 22-40 (1 week) | 4 years = 4 weeks |
| Total weeks | 20.5 |
| Capped weekly pay | £643 |
| Calculated amount | £13,181.50 |

| £30,000 Exemption | |
|--------------------|---|
| Earnings elements | £12,018.41 (PENP + RC) |
| Exempt elements | £13,181.50 (statutory redundancy) |
| Relevant termination award | £25,000.00 (ex gratia only) |
| Within £30,000 | £25,000.00 |
| Exceeding £30,000 | £0.00 |
| Remaining exemption | £5,000.00 |

| Employer NIC | |
|--------------|---|
| Class 1 on earnings (£12,018.41 × 15%) | £1,802.76 |
| Class 1A on excess (£0 × 15%) | £0.00 |
| Total employer NIC | £1,802.76 |

| Summary | |
|---------|---|
| Gross termination package | £50,199.91 |
| Total taxable as earnings | £12,018.41 |
| Total exempt | £13,181.50 |
| Total within £30,000 | £25,000.00 |
| Total cost to employer | £52,002.67 |

**Key learning points:**
- PENP of £7,018.41 arises because Dave only served 1 month of his 3-month notice period. The employer bears the tax cost of this earnings reclassification.
- Statutory redundancy (£13,181.50) is completely exempt — it does NOT reduce the £30,000 exemption.
- The restrictive covenant (£5,000) is taxable as earnings since April 2020 — NOT within the £30,000 exemption. This is a key exam distinction.
- The ex gratia (£25,000) is fully sheltered by the £30,000 exemption. No income tax or Class 1A NIC arises on this element.
- Had the ex gratia been £45,000 instead of £25,000, the excess £15,000 would be taxable AND attract employer Class 1A NIC at 15% (£2,250).
- Employer NIC on the PENP and restrictive covenant is Class 1 (not Class 1A) because these amounts are treated as employment earnings.
- Dave has no employee NIC on the termination payment elements (only on the earnings elements through PAYE).

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onInputChange` | Student changes any input field | `{ field, value, timestamp }` |
| `onCompute` | Student triggers PENP computation | `{ penpAmount, totalPackage, employerNIC, attemptNumber, timestamp }` |
| `onValidation` | Validation runs | `{ errors, warnings, timestamp }` |
| `onComponentView` | Student expands a component classification | `{ componentName, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onExemptionView` | Student views the £30,000 exemption breakdown | `{ withinExemption, exceeding, timestamp }` |
| `onRedundancyCheck` | Student views statutory redundancy cross-check | `{ calculated, entered, difference, timestamp }` |

---

## 11. Accessibility & UX

- Tab order: employee details → pay details → notice details → payment components → redundancy cross-check → compute
- Single-column input layout with clear section headings
- Component classification shown as a colour-coded table (green = exempt, amber = £30,000 exemption, red = taxable earnings)
- PENP formula shown with values substituted, step by step
- £30,000 exemption shown as a waterfall / bar chart
- Statutory redundancy cross-check shown as a collapsible detail table
- Employer NIC shown as a two-part summary (Class 1 + Class 1A)
- Responsive layout: sections stack vertically on mobile
- Educational tooltips expand/collapse beneath each input
- Validation runs on "Analyse Termination Payment" click
- Scenario loader pre-fills the Dave Reynolds case study data

---

## 12. Computation Flow Diagram

```
Employee Details
   │
   ├── Calculate age at termination
   ├── Calculate complete years of service (max 20)
   │
Pay & Notice Details
   │
   ├── Determine P (pay period days)
   ├── Calculate D = contractualNotice − noticeServed
   │
   └── PENP Formula
         │
         ├── T = priorTaxablePayments + contractualPILON
         ├── PENP = max(0, ((BP × D) / P) − T)
         │
         └── Component Classification
               │
               ├── Contractual PILON → Taxable as earnings
               ├── PENP → Taxable as earnings
               ├── Statutory redundancy → Exempt (s.309)
               ├── Restrictive covenant → Taxable as earnings
               └── Ex gratia → £30,000 exemption test
                     │
                     ├── Relevant termination award (ex gratia)
                     ├── Within £30,000 → Exempt
                     └── Exceeding £30,000 → Taxable + Class 1A NIC
                           │
                           └── Employer NIC Summary
                                 ├── Class 1 on earnings elements
                                 ├── Class 1A on £30,000 excess
                                 └── Total employer NIC

Statutory Redundancy Cross-Check (parallel)
   │
   ├── Age-band breakdown (1.5 / 1 / 0.5 weeks per year)
   ├── Total weeks × capped weekly pay
   └── Compare with entered amount
```
