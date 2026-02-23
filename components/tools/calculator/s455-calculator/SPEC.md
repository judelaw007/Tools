# s.455 Loans to Participators Calculator — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `s455-calculator` |
| Tool Slug | `s455-calculator` |
| Display Name | s.455 Loans to Participators Calculator |
| Component Name | `S455Calculator` |
| Real-World Equivalent | HMRC CTM61505 guidance; Directors' Loan Accounts Toolkit; standard close company compliance check |
| Tool Type | `calculator` |
| Category | `corporation-tax` |
| Difficulty | Advanced |
| Sections Used | S6 (primary) |
| Build Order | 6 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  's455-calculator',
  's.455 Loans to Participators Calculator',
  'Calculates s.455 CTA 2010 tax liability on loans to participators in close companies. Tracks DLA movements, applies the s.464C bed-and-breakfast anti-avoidance rule (repayment followed by re-borrowing within 30 days), computes key compliance dates, and analyses loan write-off consequences (distribution vs BIK treatment). Includes timeline visualisation of DLA events.',
  'S455Calculator',
  'corporation-tax',
  'calculator',
  'advanced',
  true,
  6
);
```

---

## 2. Purpose & Context

Section 455 CTA 2010 imposes a tax charge on close companies that make loans (or advance money) to participators. The charge is 33.75% of the outstanding loan balance at the accounting period end, payable alongside the company's corporation tax. The charge is refundable when the loan is repaid, but the timing of repayments and re-borrowings creates compliance traps — particularly the "bed-and-breakfast" arrangement targeted by s.464C.

### Why This Tool Matters for OMB Students

- **Perennial exam topic:** Close company loans to participators and the s.455 charge appear in virtually every CTA OMB paper. The bed-and-breakfast rule adds genuine complexity beyond a simple rate × balance calculation.
- **Close company ubiquity:** Every company with fewer than 5 participators is a close company (CTA 2010 s.439). Most OMBs are close companies with shareholder-directors who routinely withdraw funds via their DLA.
- **Real compliance trap:** Directors frequently repay their DLA before the AP end and re-borrow shortly after, thinking they have avoided the s.455 charge. The s.464C rule catches this arrangement.
- **Write-off analysis requires judgement:** When a company considers writing off an overdrawn DLA, the student must compare: (a) distribution treatment (permanent income tax at dividend rates, no NIC, s.455 refund) vs (b) keeping the loan outstanding (temporary s.455 charge, refundable on repayment, but ongoing BIK).
- **Temporal compliance:** The 9-months-and-1-day timing for both the s.455 charge due date and the refund date tests the student's understanding of CT compliance deadlines.
- **Integration with S5 and S7:** The s.455 due date coincides with the CT payment deadline (from the CT Computation tool). The beneficial loan BIK from the overdrawn DLA feeds into the P11D (from the PENP/Employment section).

### Key Legislation

- CTA 2010 s.455 — tax charge on loans to participators
- CTA 2010 s.455(4) — relief (refund) on repayment of loan
- CTA 2010 s.456 — loan released or written off (consequences)
- CTA 2010 s.464C — bed-and-breakfast anti-avoidance rule
- CTA 2010 s.439 — close company definition
- CTA 2010 s.454 — participator definition
- ITTOIA 2005 s.415 — write-off treated as distribution (if participator is shareholder)
- ITEPA 2003 s.175 — beneficial loan BIK (official rate of interest)
- HMRC Company Taxation Manual CTM61500–CTM61560

---

## 3. Input Definitions

### 3.1 Accounting Period

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `startDate` | `date` | Required. Must be valid date. | First day of the company's accounting period. For C&S Engineering, this is 1 April 2025. |
| `endDate` | `date` | Required. Must be after startDate. Max 18 months. | Last day of the accounting period. The s.455 charge is based on the outstanding loan balance at this date. For C&S Engineering, this is 31 March 2026. |

### 3.2 DLA Opening Balance

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `openingBalance` | `number` | >= 0. Required. | The overdrawn DLA balance brought forward at the start of the accounting period. A positive number means the participator owes money to the company (loan to participator). If the DLA is in credit (company owes participator), no s.455 issue arises — enter 0. |

### 3.3 DLA Movements (Aggregated)

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `totalCredits` | `number` | >= 0. Required. | Total credits to the DLA during the AP that reduce the overdrawn balance. Includes: salary credited, dividends declared, expenses reimbursed, other credits. Does NOT include specific dated repayments (enter those separately in the Repayments section). |
| `totalDebits` | `number` | >= 0. Required. | Total debits to the DLA during the AP that increase the overdrawn balance. Includes: cash drawings, personal expenses paid by company, other charges. Does NOT include post-AP re-borrowings (enter those in the Re-borrowings section). |

### 3.4 Repayments (Dated)

Each repayment is entered separately with its date, because the date is critical for the s.464C bed-and-breakfast check.

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `date` | `date` | Required. Must be within or near the AP. | The date the repayment was made. For s.464C, any re-borrowing within 30 days of this date triggers the bed-and-breakfast rule. Repayments near the AP end are the most likely to be caught. |
| `amount` | `number` | > 0. Required. | The repayment amount. This reduces the DLA closing balance. If matched with a re-borrowing under s.464C, the repayment is disregarded for s.455 purposes. |
| `description` | `string` | Optional. | Description of the repayment (e.g., "Bank transfer from Marcus to company"). |

### 3.5 Re-borrowings (Dated)

Each re-borrowing is entered separately. These may occur after the AP end — they are only relevant for the s.464C check.

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `date` | `date` | Required. | The date a new loan or advance was made to the participator. If this falls within 30 days of a repayment, the bed-and-breakfast rule applies. Re-borrowings AFTER the AP end are still relevant for s.464C — the rule looks at the 30-day window, not the AP boundary. |
| `amount` | `number` | > 0. Required. | The amount re-borrowed. The s.464C matching amount is the lesser of the repayment and the re-borrowing. |
| `description` | `string` | Optional. | Description (e.g., "Cash withdrawal by Marcus"). |

### 3.6 Write-Off Analysis

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `enabled` | `boolean` | Required. Defaults to false. | Whether to analyse the consequences of writing off part of the loan. A write-off is a company decision — the loan is released, and the amount is never recovered. The tax consequences depend on whether the participator is a shareholder. |
| `amount` | `number` | > 0 if enabled. Must not exceed adjusted closing balance. | The amount the company is considering writing off. For C&S, this is £20,000. |
| `participatorTaxBand` | `select` | `basic` / `higher` / `additional`. Required if enabled. | The participator's marginal income tax band. Determines the dividend tax rate applied to the write-off if treated as a distribution. For Marcus (total income ~£98,670), this is `higher`. |
| `isShareholderDirector` | `boolean` | Required if enabled. Defaults to true. | Whether the participator is both a shareholder and director. If yes, the write-off is treated as a distribution (deemed dividend under s.415 ITTOIA 2005). If no (e.g., employee participator), it may be treated as employment income subject to PAYE and NIC. |
| `dividendAllowanceUsed` | `boolean` | Defaults to true. | Whether the participator's dividend allowance (£500 for 2025/26) has already been used against other dividend income. If Marcus receives £30,000+ in dividends from C&S, the allowance is already consumed. |

### 3.7 Rates

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `s455Rate` | `number` | 0–1. Defaults to 0.3375. | The s.455 tax rate. Currently 33.75% (from 6 April 2022), aligning with the higher rate of dividend tax. Previously 32.5% (6 April 2016 to 5 April 2022) and 25% (before 6 April 2016). |
| `officialRate` | `number` | 0–1. Defaults to 0.0225. | HMRC official rate of interest for beneficial loan BIK calculation. Used to estimate the annual BIK cost if the loan is kept outstanding. Currently 2.25%. |

---

## 4. Output Definitions

### 4.1 Balance Tracker

| Output | Description |
|--------|-------------|
| `openingBalance` | DLA opening balance (overdrawn) |
| `totalCredits` | Total credits in the period |
| `totalDebits` | Total debits in the period |
| `totalRepayments` | Sum of all dated repayments |
| `closingBalanceRaw` | Closing balance before s.464C adjustment |
| `totalDisregarded` | Total repayments disregarded under s.464C |
| `closingBalanceAdjusted` | Closing balance after s.464C adjustment (the s.455 charge base) |

### 4.2 Bed-and-Breakfast Result (s.464C)

| Output | Description |
|--------|-------------|
| `triggered` | Whether s.464C applies (any matches found) |
| `matches` | Array of matched repayment/re-borrowing pairs with dates, amounts, days between, and disregarded amount |
| `totalDisregarded` | Total amount of repayments disregarded |
| `explanation` | Human-readable explanation of the s.464C result |

### 4.3 s.455 Tax Computation

| Output | Description |
|--------|-------------|
| `chargeableAmount` | The adjusted closing balance on which s.455 applies |
| `s455Rate` | The rate applied |
| `s455Tax` | Tax liability (chargeableAmount × rate) |
| `s455TaxWithoutS464C` | What the tax would have been without s.464C (for comparison) |
| `s464CDifference` | Additional tax due to s.464C (the "cost" of the bed-and-breakfast) |

### 4.4 Key Dates

| Output | Description |
|--------|-------------|
| `apEndDate` | Accounting period end date |
| `s455DueDate` | Date s.455 tax is due (9 months + 1 day after AP end) |
| `ctFilingDeadline` | CT600 filing deadline (12 months after AP end) |
| `ctPaymentDeadline` | CT payment deadline (same as s.455 due date) |
| `earliestRefundDate` | Earliest date s.455 refund can be claimed (9m+1d after end of AP in which loan is fully repaid) |

### 4.5 Write-Off Analysis

| Output | Description |
|--------|-------------|
| `writeOffAmount` | Amount being written off |
| `distributionTax` | Income tax on the deemed distribution (at dividend rates) |
| `distributionRate` | The dividend tax rate applied |
| `s455Relief` | s.455 tax refundable on the written-off portion |
| `netCostToParticipator` | Net income tax cost to the participator |
| `netCostToCompany` | Net cost to the company (asset lost minus s.455 refund) |
| `keepLoanBIK` | Annual BIK if loan kept outstanding (official rate × amount) |
| `keepLoanBIKTax` | Annual income tax on the BIK |
| `keepLoanEmployerNIC` | Annual employer Class 1A NIC on the BIK |
| `recommendation` | Whether write-off or keeping the loan is more advantageous |
| `explanation` | Detailed reasoning |

### 4.6 Timeline Events

Array of events for visualisation:

| Output | Description |
|--------|-------------|
| `date` | Event date |
| `label` | Short description |
| `type` | `period-start` / `period-end` / `repayment` / `reborrowing` / `deadline` / `refund` |
| `amount` | Associated amount (if applicable) |
| `note` | Additional context |

### 4.7 Validation Results

| Output | Description |
|--------|-------------|
| `ruleId` | Rule identifier (V1–V9) |
| `severity` | `error` / `warning` / `info` |
| `message` | Human-readable message |
| `passed` | Whether the rule passed |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | AP dates valid | `error` | Both AP start and end dates must be provided. Start must be before end. AP must not exceed 18 months. |
| V2 | Opening balance valid | `error` | Opening balance must be provided and >= 0 (positive = overdrawn/loan to participator). |
| V3 | Credits and debits valid | `error` | Total credits and total debits must be >= 0. |
| V4 | Repayment amounts valid | `error` | Each repayment must have a valid date and amount > 0. |
| V5 | Re-borrowing amounts valid | `error` | Each re-borrowing must have a valid date and amount > 0. |
| V6 | Closing balance check | `info` | If the adjusted closing balance is zero or negative (i.e., DLA is in credit), no s.455 charge arises. The participator does not owe money to the company. |
| V7 | Write-off amount check | `warning` | If write-off is enabled, the amount must be > 0 and must not exceed the adjusted closing balance. |
| V8 | s.464C de minimis | `info` | s.464C may not apply where the total re-borrowing within 30 days is less than £5,000. HMRC guidance suggests a de minimis threshold. |
| V9 | Repayment timing | `info` | Repayments made within 30 days of the AP end are at highest risk of s.464C matching. Flags any repayment where a re-borrowing is found within the 30-day window. |

---

## 6. Calculation Logic

### 6.1 Compute Raw Closing Balance

```
closingBalanceRaw = openingBalance
                  + totalDebits
                  - totalCredits
                  - sum(repayment.amount for each repayment where repayment.date <= AP end)

If closingBalanceRaw < 0 → set to 0 (DLA in credit, no s.455 issue)
```

### 6.2 Apply s.464C Bed-and-Breakfast Rule

```
For each repayment (R) in the repayments array:
  matchedReborrowings = []
  For each re-borrowing (B) in the reborrowings array:
    daysBetween = B.date - R.date (in calendar days)
    If 0 <= daysBetween <= 30:
      matchedReborrowings.push(B)

  totalReborrowed = sum(matchedReborrowings.amount)

  If totalReborrowed > 0:
    disregardedAmount = min(R.amount, totalReborrowed)
    Record match: { repayment: R, reborrowings: matchedReborrowings, disregarded: disregardedAmount }

totalDisregarded = sum(all disregardedAmounts)
```

### 6.3 Compute Adjusted Closing Balance

```
closingBalanceAdjusted = closingBalanceRaw + totalDisregarded

If closingBalanceAdjusted < 0 → set to 0
```

### 6.4 Compute s.455 Tax

```
If closingBalanceAdjusted > 0:
  s455Tax = closingBalanceAdjusted × s455Rate
  s455TaxRounded = round to 2 decimal places

  s455TaxWithoutS464C = max(0, closingBalanceRaw) × s455Rate
  s464CDifference = s455Tax - s455TaxWithoutS464C
Else:
  s455Tax = 0
  s455TaxWithoutS464C = 0
  s464CDifference = 0
```

### 6.5 Compute Key Dates

```
s455DueDate = AP end + 9 months + 1 day
  Example: AP end 31 March 2026 → 31 December 2026 + 1 day = 1 January 2027

ctFilingDeadline = AP end + 12 months
  Example: AP end 31 March 2026 → 31 March 2027

ctPaymentDeadline = s455DueDate (same date — s.455 is payable with CT)

earliestRefundDate = (AP end of the AP in which full repayment is made) + 9 months + 1 day
  Example: If fully repaid in AP ending 31 March 2027 → 1 January 2028
```

### 6.6 Write-Off Analysis

```
If write-off enabled:
  dividendRates = { basic: 0.0875, higher: 0.3375, additional: 0.3935 }
  dividendRate = dividendRates[participatorTaxBand]

  If dividendAllowanceUsed:
    taxableWriteOff = writeOffAmount
  Else:
    taxableWriteOff = max(0, writeOffAmount - 500)

  distributionTax = taxableWriteOff × dividendRate
  s455Relief = writeOffAmount × s455Rate

  netCostToParticipator = distributionTax
  netCostToCompany = writeOffAmount - s455Relief (asset lost minus tax refund)

  // Compare with keeping the loan
  keepLoanBIK = writeOffAmount × officialRate
  keepLoanBIKTax = keepLoanBIK × (participatorTaxBand === 'basic' ? 0.20 : participatorTaxBand === 'higher' ? 0.40 : 0.45)
  keepLoanEmployerNIC = keepLoanBIK × 0.138

  // The s.455 on the writeOff portion is refundable when repaid
  keepLoanS455 = writeOffAmount × s455Rate // This is temporary (refundable)

  recommendation = Compare permanent cost of write-off vs ongoing BIK cost
```

---

## 7. Rate Tables

### s.455 Tax Rate

| Period | Rate | Legislation |
|--------|------|-------------|
| From 6 April 2022 | 33.75% | CTA 2010 s.455(2), as amended by FA 2022 |
| 6 April 2016 to 5 April 2022 | 32.5% | CTA 2010 s.455(2), as amended by FA 2016 |
| Before 6 April 2016 | 25% | CTA 2010 s.455(2) (original rate) |

### Dividend Tax Rates (2025/26)

| Band | Rate | Threshold |
|------|------|-----------|
| Basic rate | 8.75% | Dividends within basic rate band |
| Higher rate | 33.75% | Dividends in higher rate band |
| Additional rate | 39.35% | Dividends above £125,140 total income |

### Dividend Allowance

| Tax Year | Allowance |
|----------|-----------|
| 2025/26 | £500 |
| 2024/25 | £500 |

### Official Rate of Interest (Beneficial Loans BIK)

| Period | Rate |
|--------|------|
| From 6 April 2024 | 2.25% |

### s.464C Bed-and-Breakfast

| Parameter | Value |
|-----------|-------|
| Matching window | 30 calendar days after repayment |
| De minimis threshold | £5,000 (HMRC practice) |

### Employer NIC Rate (Class 1A)

| Period | Rate |
|--------|------|
| 2025/26 | 15% |
| 2024/25 | 13.8% |

---

## 8. Educational Notes

### Inline Tooltips

Each input field has an educational note (see Input Definitions above) explaining WHY the field matters.

### Key Conceptual Points

- **Close company definition:** A company controlled by 5 or fewer participators, or by any number of participator-directors (CTA 2010 s.439). Most OMBs are close companies. The s.455 charge ONLY applies to close companies — public companies are exempt.

- **Participator is broader than shareholder:** A participator includes shareholders, loan creditors, and anyone entitled to company assets on a winding up (CTA 2010 s.454). In practice, for OMBs, participators are usually shareholder-directors.

- **s.455 is a charge on the COMPANY:** The s.455 tax is paid by the company, not the participator. It is payable alongside the company's CT liability (9 months and 1 day after AP end). This is a common misconception — students often think the participator pays.

- **s.455 is REFUNDABLE:** Unlike income tax or CGT, the s.455 charge is temporary. When the loan is repaid, the s.455 tax is refunded (s.455(4)). The refund is available 9 months and 1 day after the end of the AP in which repayment is made. This is why s.455 is sometimes called a "temporary tax" — but the cash flow cost can be significant.

- **Bed-and-breakfast (s.464C):** The anti-avoidance rule targets arrangements where a participator repays a loan shortly before the AP end and re-borrows shortly after. If the repayment and re-borrowing are within 30 days, the repayment is disregarded for s.455 purposes. This means the closing balance is treated as though the repayment never happened.

- **Write-off = distribution:** When a company writes off (releases) a loan to a participator who is also a shareholder, the amount is treated as a distribution (deemed dividend) under s.415 ITTOIA 2005. The participator pays income tax at dividend rates. There is no NIC on a distribution. The company gets no deduction for the write-off, but it does get an s.455 refund on the written-off amount.

- **Write-off vs keeping the loan — the key comparison:**
  - **Write off:** Permanent income tax cost to the participator at dividend rates. Company loses the asset (the loan) but gets s.455 refund. No further BIK charges.
  - **Keep outstanding:** s.455 charge is temporary (refunded on repayment). But the participator faces an annual BIK on the beneficial loan (official rate × average balance), and the company pays employer Class 1A NIC on the BIK. The loan remains a company asset — it can be recovered.

- **Beneficial loan BIK interaction:** An overdrawn DLA is an interest-free loan to the participator. Under ITEPA 2003 s.175, this creates a BIK equal to the official rate of interest × the average outstanding balance. This BIK is reportable on the P11D and is subject to Class 1A NIC. The BIK exists regardless of s.455 — they are separate charges. s.455 is a charge on the company. The BIK is a charge on the participator.

- **CT payment deadline alignment:** The s.455 due date (9 months + 1 day after AP end) is the same date as the CT payment deadline. For AP ending 31 March 2026, both are due on 1 January 2027.

---

## 9. H&C Test Scenarios

### Scenario 1 — S6: Marcus's Overdrawn DLA with Bed-and-Breakfast

**Context:** HMRC has sent an enquiry letter about Marcus Caldwell's overdrawn director's loan account. The student discovers that Marcus repaid £50,000 on 15 March 2026 (shortly before the 31 March 2026 AP end) and then re-borrowed £50,000 on 10 April 2026 (11 days after the AP end). This triggers the s.464C bed-and-breakfast rule. The board is also considering writing off £20,000 of the DLA.

**Key data (from fact register):**

| Fact | Value |
|------|-------|
| Accounting period | 1 April 2025 to 31 March 2026 |
| DLA opening balance (1 Apr 2025) | £45,000 overdrawn |
| DLA credits in year | Salary £50,270 + dividends £30,000 = £80,270 |
| DLA debits in year | Drawings £120,270 |
| Repayment | £50,000 bank transfer (15 March 2026) |
| Re-borrowing | £50,000 cash withdrawn (10 April 2026) |
| s.455 rate | 33.75% |
| Write-off considered | £20,000 |
| Marcus's tax band | Higher rate |
| Marcus receives other dividends | Yes (£30,000+ from C&S, £8,000 from Caldwell Investments) — dividend allowance already used |

**Pre-filled inputs:**
- AP start: `2025-04-01`
- AP end: `2026-03-31`
- Opening balance: 45,000
- Total credits: 80,270 (salary £50,270 + dividends £30,000)
- Total debits: 120,270 (drawings)
- Repayment 1: date `2026-03-15`, amount 50,000, description "Bank transfer from Marcus to company"
- Re-borrowing 1: date `2026-04-10`, amount 50,000, description "Cash withdrawal by Marcus"
- Write-off: enabled, amount 20,000, participator rate `higher`, shareholder-director `true`, dividend allowance used `true`
- s.455 rate: 0.3375
- Official rate: 0.0225

**Expected results:**

| Computation | Amount |
|-------------|--------|
| Opening balance | £45,000 |
| Add: Debits | £120,270 |
| Less: Credits | (£80,270) |
| Less: Repayments | (£50,000) |
| **Closing balance (raw)** | **£35,000** |
| s.464C disregarded repayment | £50,000 |
| **Adjusted closing balance** | **£85,000** |
| s.455 tax (£85,000 × 33.75%) | **£28,687.50** |
| s.455 tax without s.464C (£35,000 × 33.75%) | £11,812.50 |
| Additional tax due to s.464C | £16,875.00 |

| Key Date | Date |
|----------|------|
| AP end | 31 March 2026 |
| s.455 due date | 1 January 2027 |
| CT filing deadline | 31 March 2027 |
| CT payment deadline | 1 January 2027 |

| Bed-and-Breakfast Analysis | Detail |
|---------------------------|--------|
| Repayment date | 15 March 2026 |
| Re-borrowing date | 10 April 2026 |
| Days between | 26 days (within 30-day window) |
| s.464C triggered | YES |
| Amount disregarded | £50,000 |

| Write-Off Analysis (£20,000) | Amount |
|-------------------------------|--------|
| Deemed distribution (s.415 ITTOIA 2005) | £20,000 |
| Dividend tax at 33.75% (higher rate) | £6,750 |
| s.455 relief to company | £6,750 (£20,000 × 33.75%) |
| Company asset lost | £20,000 |
| Net cost to company | £13,250 (£20,000 − £6,750 refund) |
| **Alternative: Keep loan outstanding** | |
| Annual BIK (£20,000 × 2.25%) | £450 |
| Marcus income tax on BIK (40%) | £180/year |
| Employer Class 1A NIC (15%) | £67.50/year |
| s.455 on £20,000 portion | £6,750 (refundable when repaid) |

**Key learning points:**
- The bed-and-breakfast rule increases the s.455 charge from £11,812.50 to £28,687.50 — a difference of £16,875
- Marcus's "clever" plan to repay £50,000 before year-end and re-borrow after is defeated by s.464C
- The 30-day window spans AP boundaries — the re-borrowing on 10 April (next AP) still triggers s.464C
- Write-off creates a permanent income tax charge of £6,750 on Marcus, whereas keeping the loan creates a refundable s.455 charge plus a small annual BIK cost (£180/year income tax + £67.50/year employer NIC)
- In most cases, keeping the loan outstanding is preferable unless the participator cannot or will not repay — because s.455 is refundable but the write-off distribution tax is permanent
- s.455 is paid by the company; the deemed distribution tax is paid by Marcus

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onAPChange` | Student changes accounting period dates | `{ startDate, endDate, timestamp }` |
| `onCompute` | Student triggers computation | `{ s455Tax, adjustedBalance, bedAndBreakfastTriggered, attemptNumber, timestamp }` |
| `onValidation` | Validation runs | `{ errors, warnings, timestamp }` |
| `onBedAndBreakfastView` | Student views the s.464C analysis detail | `{ matches, totalDisregarded, timestamp }` |
| `onWriteOffToggle` | Student enables/disables write-off analysis | `{ enabled, amount, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onTimelineView` | Student views the timeline visualisation | `{ eventCount, timestamp }` |

---

## 11. Accessibility & UX

- Tab order: AP dates → opening balance → credits/debits → repayments → re-borrowings → write-off → compute
- Input form with add/remove rows for repayments and re-borrowings
- Compute button triggers calculation and displays results below
- Results panel shows: balance tracker → bed-and-breakfast analysis → s.455 computation → key dates → write-off analysis (if enabled) → timeline
- Bed-and-breakfast matches highlighted with red/amber warning styling
- Timeline shows events chronologically with colour-coding by type
- Key dates displayed as a summary card with countdown-style formatting
- Write-off comparison shown as a two-column table (write-off vs keep loan)
- Responsive layout: stacks vertically on mobile
- Educational tooltips expand/collapse beneath each input
- Validation runs on "Compute" click; errors block computation, warnings and info notes shown inline

---

## 12. Computation Flow Diagram

```
Inputs
  │
  ├── Accounting Period (start, end)
  ├── Opening Balance (overdrawn)
  ├── Credits & Debits (aggregated)
  ├── Repayments (dated)
  └── Re-borrowings (dated)
        │
        ▼
Step 1: Compute Raw Closing Balance
  opening + debits - credits - repayments
        │
        ▼
Step 2: s.464C Bed-and-Breakfast Check
  For each repayment:
    Find re-borrowings within 30 days
    Match → disregard repayment
        │
        ▼
Step 3: Adjusted Closing Balance
  raw closing + disregarded repayments
        │
        ▼
Step 4: s.455 Tax Computation
  adjusted closing × 33.75%
        │
        ▼
Step 5: Key Dates
  Due: AP end + 9m + 1d
  Refund: repayment AP end + 9m + 1d
        │
        ▼
Step 6: Write-Off Analysis (if enabled)
  Distribution tax vs BIK comparison
        │
        ▼
Output: Balance tracker, s.464C result, s.455 tax,
        key dates, write-off analysis, timeline
```
