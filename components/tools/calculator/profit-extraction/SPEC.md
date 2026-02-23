# Salary vs Dividend Profit Extraction Optimiser — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `profit-extraction` |
| Tool Slug | `profit-extraction` |
| Display Name | Salary vs Dividend Profit Extraction Optimiser |
| Component Name | `ProfitExtraction` |
| Real-World Equivalent | Commercial profit extraction calculators (123 Financials, Alto Accounting, Outrise, Croner-i worksheets). Every firm advising OMBs has a version. |
| Tool Type | `calculator` |
| Category | `income-tax` |
| Difficulty | Advanced |
| Sections Used | S4 (secondary — NIC comparison), S8 (primary — full optimisation) |
| Build Order | 2 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'profit-extraction',
  'Salary vs Dividend Profit Extraction Optimiser',
  'Compares the after-tax cost of extracting profits from a company via salary, dividends, pension contributions, and rent. Calculates income tax, employee NIC, employer NIC, corporation tax impact, and dividend tax for each method to identify the optimal extraction strategy. Designed for UK owner-managed businesses with director-shareholders.',
  'ProfitExtraction',
  'income-tax',
  'calculator',
  'advanced',
  true,
  2
);
```

---

## 2. Purpose & Context

The profit extraction optimiser is THE defining OMB tool. Every firm advising owner-managed businesses has a version — whether a spreadsheet, a commercial product, or a bespoke model. The question "should I take salary or dividends?" is the most common advisory question in OMB tax practice.

The tool compares extraction methods across four dimensions:
1. **Salary** — deductible for CT but triggers employee NIC (Class 1) and employer NIC (Class 1)
2. **Dividends** — not deductible for CT, no NIC, but taxed at dividend rates
3. **Employer pension contributions** — deductible for CT, no BIK for director, no NIC
4. **Rental income** — deductible for CT (if arm's length), taxed as property income on director

### Why This Tool Matters for OMB Students

- **NIC efficiency point**: There is a specific salary level (personal allowance + primary threshold alignment) where the combined tax + NIC cost is minimised. Finding this point is the core skill.
- **CT interaction**: Every £1 of salary reduces CT-liable profit. At 25% CT (or marginal rate), the CT saving partially offsets the NIC cost. Students must understand this trade-off.
- **Dividend rate stacking**: Dividends are taxed after non-savings income. The dividend rate depends on which band the director falls into after salary and other income are allocated.
- **Pension efficiency**: Employer pension contributions are CT-deductible with no BIK — but subject to annual allowance (£60,000) and tapering for high earners.
- **Multi-year planning**: A director approaching retirement (like Marcus) may have different optimal strategies than one staying long-term (like Sophie).

---

## 3. Input Definitions

### 3.1 Company Details

| Field | Type | Description | Educational Note |
|-------|------|-------------|-----------------|
| `companyProfit` | `number` | Company profit before extraction (taxable total profits before salary deduction) | This is the starting point — how much profit is available to extract. For C&S, this is approximately £95,000–£105,000. |
| `associatedCompanies` | `number` | Number of associated companies (including the company itself), minimum 1 | Affects CT marginal relief thresholds. C&S has 2 (itself + Caldwell Investments). Each additional associated company divides the upper and lower limits. |
| `employmentAllowance` | `boolean` | Whether the company qualifies for Employment Allowance (£5,000 offset against employer NIC) | C&S is eligible — multiple employees beyond the sole-director test. The £5,000 EA reduces the employer NIC cost of salary extraction. |

### 3.2 Extraction Strategy

| Field | Type | Description | Educational Note |
|-------|------|-------------|-----------------|
| `salaryAmount` | `number` | Annual gross salary to the director | The key decision variable. Setting salary at £12,570 (PA) avoids income tax on salary entirely. Setting it at £50,270 (PA + basic rate band) means all salary is taxed at 20% or less. |
| `dividendAmount` | `number` | Annual gross dividends to the director | Dividends are paid from post-CT profits. No NIC. Taxed at 8.75% (basic), 33.75% (higher), 39.35% (additional). |
| `pensionContribution` | `number` | Annual employer pension contribution | CT-deductible, no BIK, no NIC. Subject to annual allowance (£60,000 or 100% of earnings, whichever is lower). Tapering applies if adjusted income > £260,000. |
| `rentalPayment` | `number` | Annual rent paid by company to director for property use (optional) | Must be at arm's length. CT-deductible for company. Taxed as property income on director (no NIC). C&S rents Unit 7B — but this field is for director-to-company property rental. |

### 3.3 Personal Tax Context

| Field | Type | Description | Educational Note |
|-------|------|-------------|-----------------|
| `otherIncome` | `number` | Other personal income outside the company (employment, savings, property partnership, etc.) | Marcus has ~£10,400 other income (property partnership £8,900 + bank interest £1,500). This pushes him into higher rate bands sooner. |
| `otherDividends` | `number` | Dividends from other companies | Marcus receives ~£8,000 from Caldwell Investments. These stack on top of C&S dividends. |
| `taxYear` | `TaxYear` | Tax year for rate lookup (2025/26, 2026/27) | Rates change between years. The tool must use the correct rates for the selected year. |

---

## 4. Output Definitions

### 4.1 Per-Method Breakdown

For each extraction method, the tool calculates:

| Output | Description |
|--------|-------------|
| `grossAmount` | Gross extraction amount |
| `corporationTax` | CT on the company profit used (or CT saved by the deduction) |
| `employerNIC` | Employer Class 1 NIC (salary only; reduced by EA if applicable) |
| `employeeNIC` | Employee Class 1 NIC (salary only) |
| `incomeTax` | Income tax on the amount received (at appropriate rate: non-savings, dividend, or property) |
| `totalTaxCost` | Sum of all taxes and NIC |
| `netReceipt` | Amount received by the director after all taxes |
| `effectiveRate` | Total tax cost as % of gross extraction |

### 4.2 Comparison Table

| Output | Description |
|--------|-------------|
| `methodComparison` | Side-by-side table: salary-only, dividend-only, optimal mix, and custom (user-entered) |
| `optimalStrategy` | The mix that maximises after-tax receipts |
| `nicEfficiencyPoint` | The salary level where marginal NIC cost exceeds marginal CT saving |
| `recommendation` | Plain-English explanation of why the optimal strategy works |

### 4.3 Summary Outputs

| Output | Description |
|--------|-------------|
| `totalExtracted` | Total gross amount extracted across all methods |
| `totalTaxCost` | Combined tax cost across all methods |
| `totalNetReceipt` | Combined after-tax amount received |
| `overallEffectiveRate` | Total tax cost / total extracted |
| `companyProfitRemaining` | Profit left in the company after all extractions |
| `companyTaxOnRemaining` | CT on the remaining profit |

---

## 5. Validation Rules

### Cross-Field Validations

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Extraction cap | `error` | Total extraction (salary + dividends + pension + rent) cannot exceed company profit. Dividends additionally cannot exceed post-CT distributable profit. |
| V2 | Dividend distributable check | `warning` | Dividends can only be paid from distributable reserves. If salary + pension + rent + CT exceed company profit, there is nothing to distribute. |
| V3 | Pension annual allowance | `warning` | Employer pension contribution exceeds £60,000 annual allowance. Annual allowance charge will apply. |
| V4 | Pension earnings cap | `info` | Pension contribution exceeds 100% of relevant UK earnings (salary). Tax relief limited to earnings amount unless carried-forward allowance is available. |
| V5 | Rental arm's length | `info` | Rental payment entered. Remind that the rent must be at arm's length — HMRC can challenge excessive payments. |
| V6 | Employment allowance check | `info` | If EA is claimed, confirm the company is eligible (not a single-director company with no other employees). |
| V7 | Salary below NIC threshold | `info` | Salary is between LEL and PT — NIC qualifying year secured without paying NIC. This is a deliberate strategy, not an error. |
| V8 | PA taper warning | `warning` | Total income exceeds £100,000 — personal allowance tapered at £1 per £2 of excess. Effective marginal rate of 60% between £100,000 and £125,140. |
| V9 | Negative remaining profit | `error` | Extractions exceed profit — the company cannot pay this amount. |

### Field-Level Validations

| Rule | Description |
|------|-------------|
| Non-negative amounts | All inputs must be ≥ 0 |
| Whole pounds | Salary and pension rounded to whole pounds (no pence) |
| Associated companies minimum | Must be ≥ 1 (the company itself) |

---

## 6. Tax Rate Tables (2025/26)

### Income Tax — Non-Savings

| Band | Range | Rate |
|------|-------|------|
| Personal allowance | £0 – £12,570 | 0% |
| Basic rate | £12,571 – £50,270 | 20% |
| Higher rate | £50,271 – £125,140 | 40% |
| Additional rate | £125,141+ | 45% |

**PA taper:** For income over £100,000, PA reduces by £1 for every £2 of excess. PA = £0 when income ≥ £125,140.

### Income Tax — Dividends

| Band | Rate |
|------|------|
| Dividend allowance | £500 at 0% |
| Basic rate | 8.75% |
| Higher rate | 33.75% |
| Additional rate | 39.35% |

Dividends use the same band thresholds as non-savings income but are taxed last (after non-savings and savings).

### National Insurance — Employee (Class 1 Primary)

| Threshold | Annual | Rate |
|-----------|--------|------|
| Lower Earnings Limit (LEL) | £6,396 | — |
| Primary Threshold (PT) | £12,570 | — |
| Upper Earnings Limit (UEL) | £50,270 | — |
| PT to UEL | £12,570 – £50,270 | 8% |
| Above UEL | £50,270+ | 2% |

### National Insurance — Employer (Class 1 Secondary)

| Threshold | Annual | Rate |
|-----------|--------|------|
| Secondary Threshold (ST) | £5,000 | — |
| Above ST | £5,000+ | 15% |

**Employment Allowance:** £5,000 offset against employer NIC liability. Not available to companies with a single director and no other employees.

### Corporation Tax

| Profit Range | Rate |
|-------------|------|
| £0 – lower limit | 19% (small profits rate) |
| Lower limit – upper limit | Marginal rate (effective 26.5%) |
| Above upper limit | 25% (main rate) |

**Limits (undivided):** Lower = £50,000, Upper = £250,000. Divided by number of associated companies.

**Marginal relief formula:** 3/200 × (Upper limit − Augmented profits) × TTP/Augmented profits

---

## 7. Calculation Logic

### Step 1: Company-Level Calculation

1. Start with company profit before extraction
2. Deduct salary (CT-deductible)
3. Deduct employer NIC on salary (CT-deductible)
4. Deduct employer pension contribution (CT-deductible)
5. Deduct rental payment to director (CT-deductible if arm's length)
6. Remaining profit = taxable total profits for CT
7. Calculate CT on remaining profit (applying marginal relief if applicable)
8. Distributable profit = remaining profit − CT
9. Dividends limited to distributable profit

### Step 2: Director-Level Calculation

1. Stack income in order: non-savings (salary + rental + other income), savings, dividends
2. Apply personal allowance (with taper if total income > £100,000)
3. Calculate income tax by band (non-savings rates, then dividend rates on dividends)
4. Calculate employee NIC on salary (Class 1 primary: 8% PT–UEL, 2% above)
5. Calculate employer NIC on salary (Class 1 secondary: 15% above ST, less EA if applicable)

### Step 3: Net Receipt Calculation

1. Net salary = gross salary − employee NIC − income tax on salary portion
2. Net dividend = gross dividend − dividend tax
3. Net pension = pension contribution (no immediate tax — benefit deferred)
4. Net rent = gross rent − income tax on rental income
5. Total net receipt = sum of all net amounts

### Step 4: Optimal Strategy Calculation

The tool pre-computes three standard strategies:
1. **Salary only** — all extraction as salary
2. **Dividend only** — minimum salary (£12,570 PA), remainder as dividends
3. **Optimal mix** — salary at NIC efficiency point, remainder as dividends, pension to annual allowance

The NIC efficiency point is where the marginal employer NIC cost (15%) exceeds the marginal CT saving on the next £1 of salary. At 25% CT, the CT saving is 25p but the employer NIC costs 15p — so salary remains efficient up to the UEL where employee NIC drops to 2%. The crossover depends on the marginal CT rate.

---

## 8. Educational Notes

### Inline Tooltips

- **Salary amount**: "Setting salary at the personal allowance (£12,570) means no income tax on salary. Setting it at £50,270 means all salary is within the basic rate band. Above £50,270, the employee pays 40% IT + 2% NIC = 42% marginal rate."
- **Dividend amount**: "Dividends are paid from post-CT profits. At 25% CT, every £100 of profit only yields £75 for dividends. But dividends have no NIC — so they are often cheaper than salary above the UEL."
- **Pension**: "Employer pension contributions are the most tax-efficient extraction method — CT-deductible, no NIC, no BIK. But you cannot access the funds until retirement age, and annual allowance limits apply."
- **Employment allowance**: "The £5,000 EA reduces employer NIC cost. For C&S (38 employees), EA is available. For a sole-director company, EA is NOT available."
- **NIC efficiency point**: "Below the UEL, salary costs 8% employee NIC + 15% employer NIC = 23% NIC. But salary is CT-deductible — saving 25% CT. Net cost of £1 salary above PT: 20p IT + 8p employee NIC + 15p employer NIC − 25p CT saved = 18p. This is cheaper than dividends (25p CT + 33.75p dividend tax on the remaining 75p = ~50p total)."

### Post-Calculation Explanations

After calculation, the tool generates:
1. A comparison table showing total tax cost per method
2. A waterfall chart explanation of how each tax element contributes
3. The NIC efficiency point with marginal rate analysis
4. A recommendation with plain-English reasoning

---

## 9. H&C Test Scenarios

### Scenario 1 — S4: Marcus's Current Position (Preliminary Comparison)

**Context:** Marcus asks "How much personal tax will I owe?" The student uses the tool to compare his current salary/dividend levels against alternatives. This is a preliminary analysis — the full optimisation comes in S8.

**Key data:**
- Company profit: £100,000 (approximate TTP before salary deduction)
- Associated companies: 2 (C&S + Caldwell Investments)
- Employment allowance: Yes
- Current salary: £50,270
- Current dividends: £30,000
- Other income: £10,400 (property partnership £8,900 + interest £1,500)
- Other dividends: £8,000 (Caldwell Investments)
- Tax year: 2025/26

**Expected outputs:**
- Marcus's salary at £50,270 is at the basic rate band ceiling — all salary taxed at 20% or less
- Employee NIC: 8% × (£50,270 − £12,570) = £3,016
- Employer NIC: 15% × (£50,270 − £5,000) − £5,000 EA = £1,790.50
- CT on remaining profit after salary + employer NIC deduction
- Dividends of £30,000 + £8,000 = £38,000 total dividends; £500 allowance; remainder at 33.75% (higher rate)

**Key learning points:** Salary at £50,270 is near-optimal for NIC efficiency. The £5,000 EA significantly reduces employer NIC cost. Marcus's other income pushes dividends into the higher rate band quickly.

---

### Scenario 2 — S8: Full Profit Extraction Optimisation (Marcus)

**Context:** Board meeting in September 2026. Full optimisation of salary/dividend/pension split for Marcus at C&S's profit level. Marcus is considering increasing pension contributions before his exit.

**Key data:**
- Company profit: £100,000
- Associated companies: 2
- Employment allowance: Yes
- Salary: £50,270 (current, to be compared against alternatives)
- Dividends: variable (optimise)
- Pension: £20,000 (proposed employer contribution)
- Other income: £10,400
- Other dividends: £8,000
- Tax year: 2025/26

**Expected outputs:**
- Comparison of three strategies: current (salary £50,270 + div £30,000), salary-only, optimal mix with pension
- Optimal: salary £50,270 + pension £20,000 + dividends from remaining distributable profit
- Pension saves: CT at marginal rate on £20,000 + avoids NIC entirely
- After-tax receipt comparison across strategies

**Key learning points:** Pension contributions are the most tax-efficient extraction method but lock up funds. Marcus's exit timeline (12–24 months) makes pension topping up attractive — use remaining annual allowance before retirement.

---

### Scenario 3 — S8: Full Profit Extraction Optimisation (Sophie)

**Context:** Same board meeting. Sophie's position differs — she is younger, single, staying in the business. Different optimal strategy.

**Key data:**
- Company profit: £100,000 (same company)
- Associated companies: 2
- Employment allowance: Yes (shared — already claimed against Marcus's NIC)
- Salary: £50,270 (current)
- Dividends: variable
- Pension: £10,000 (proposed)
- Other income: £0 (Sophie has no other income sources)
- Other dividends: £0
- Tax year: 2025/26

**Expected outputs:**
- Sophie's position is simpler: no other income means dividends stay in basic rate band longer
- Dividend allowance (£500) applies
- First £37,700 of salary above PA at 20% basic rate
- Dividends taxed at 8.75% if within basic rate band, 33.75% above
- With salary at £50,270 and only C&S dividends, she may keep more dividends in the basic rate band than Marcus

**Key learning points:** Sophie's simpler personal tax position means the optimal strategy differs from Marcus's. No other income = more basic rate band available for dividends. Pension contributions less urgent (younger, not exiting).

---

## 10. Tracking Callbacks

The tool fires these callbacks to the MojiTax platform for progress tracking:

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onInputChange` | Student modifies any input field | `{ field, value, timestamp }` |
| `onCalculate` | Student triggers calculation | `{ strategy, totalTaxCost, netReceipt, effectiveRate, attemptNumber, timestamp }` |
| `onValidation` | Validation runs (on calculate) | `{ validationResults, passCount, failCount, timestamp }` |
| `onStrategySelect` | Student selects a pre-built strategy | `{ strategyType, timestamp }` |
| `onHint` | Student requests a hint | `{ field, hintType, timestamp }` |
| `onReset` | Student resets the form | `{ previousAttempt, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onComparisonView` | Student views the comparison table | `{ timestamp }` |

---

## 11. Accessibility & UX

- Tab order follows logical input sequence: company details → extraction amounts → personal context → calculate
- Each input has an expandable tooltip explaining WHY the field matters
- Validation runs on calculate (not on blur — too many interdependent fields)
- Colour coding: green (optimal/info), amber (warning), red (error)
- Responsive layout: single-column on mobile, two-column on desktop (inputs left, results right)
- Comparison table uses colour-coded bars showing relative tax cost
- NIC efficiency point highlighted with annotation on the comparison chart

---

## 12. Rate Constants

| Rate | Value | Effective From | Source |
|------|-------|----------------|--------|
| Personal allowance | £12,570 | 6 April 2023 (frozen to 2028) | ITA 2007, s 35 |
| Basic rate band | £37,700 (to £50,270) | 6 April 2023 (frozen to 2028) | ITA 2007, s 10 |
| Higher rate | 40% | 6 April 2023 | ITA 2007, s 6 |
| Additional rate threshold | £125,140 | 6 April 2023 | ITA 2007, s 6A |
| Additional rate | 45% | 6 April 2023 | ITA 2007, s 6A |
| Dividend allowance | £500 | 6 April 2024 | ITTOIA 2005, s 13A |
| Dividend ordinary rate | 8.75% | 6 April 2022 | ITTOIA 2005, s 8 |
| Dividend upper rate | 33.75% | 6 April 2022 | ITTOIA 2005, s 8 |
| Dividend additional rate | 39.35% | 6 April 2022 | ITTOIA 2005, s 8 |
| Employee NIC (PT–UEL) | 8% | 6 April 2024 | SSCBA 1992, s 8 |
| Employee NIC (above UEL) | 2% | 6 April 2003 | SSCBA 1992, s 8 |
| Employer NIC (above ST) | 15% | 6 April 2025 | SSCBA 1992, s 9 |
| Employer NIC secondary threshold | £5,000 | 6 April 2025 | SI 2025/xxx |
| Employment Allowance | £5,000 | 6 April 2022 | NIC Act 2014, s 1 |
| CT small profits rate | 19% | 1 April 2023 | CTA 2010, s 18A |
| CT main rate | 25% | 1 April 2023 | CTA 2010, s 18 |
| CT lower limit | £50,000 | 1 April 2023 | CTA 2010, s 18L |
| CT upper limit | £250,000 | 1 April 2023 | CTA 2010, s 18L |
| Marginal relief fraction | 3/200 | 1 April 2023 | CTA 2010, s 19 |
| Pension annual allowance | £60,000 | 6 April 2023 | FA 2004, s 228 |
| NIC LEL | £6,396 | 6 April 2025 | SI 2025/xxx |
| NIC PT | £12,570 | 6 April 2025 | SI 2025/xxx |
| NIC UEL | £50,270 | 6 April 2025 | SI 2025/xxx |
| NIC ST (employer) | £5,000 | 6 April 2025 | SI 2025/xxx |
