# VAT Return (Boxes 1-9) — Tool Specification

## 1. Tool Specification

| Field | Value |
|-------|-------|
| **ID** | `vat-return-boxes-1-9` |
| **Name** | VAT Return (Boxes 1-9) |
| **Slug** | `vat-return` |
| **Real-World Equivalent** | HMRC VAT100 Return (standard UK VAT return via MTD) |
| **Tool Type** | `form` |
| **Category** | `vat` |
| **Workflow Steps** | 3 (Setup, Box Entry, Review & Submit) |
| **Completion Criteria** | All 9 boxes populated + all validation checks pass |
| **Saved Data Shape** | `SavedVATReturnData` (types.ts) |

---

## 2. Workflow

### Step 1: Setup

The student configures the return before entering transactions.

| Field | Type | Options | Default |
|-------|------|---------|---------|
| **Return period** | Date range | Start date, end date | — |
| **Business type** | Select | `GB` / `XI` | `GB` |
| **PVA elected** | Toggle | Yes / No | Yes |
| **Partially exempt** | Toggle | Yes / No | No |
| **PE method** | Select (conditional) | `standard` / `special` | `standard` |
| **Error correction** | Toggle | Yes / No | No |
| **Return type** | Select | `quarterly` / `monthly` / `annual` | `quarterly` |

**Interface:** `VATReturnSetup` (types.ts)

**Behaviour:**
- If `businessType = 'GB'`, Boxes 2, 8, and 9 are greyed out in Step 2
- If `partiallyExempt = true`, the PE module appears in Step 2
- If `hasErrorCorrection = true`, the error correction module appears in Step 2

---

### Step 2: Box Entry

The student enters transactions into each box with line-item breakdown.

**Auto-calculated boxes:**
- **Box 3** = Box 1 + Box 2 → `calculateBox3()` (utils.ts)
- **Box 5** = Box 3 − Box 4 → `calculateBox5()` (utils.ts)

**Per-box transaction entry:**
Each box displays a table of `TransactionEntry` items (types.ts). The student adds entries with:
- Description (free text)
- Net amount (GBP)
- VAT amount (GBP)
- Transaction type (select from `TransactionType`)
- VAT rate (auto-filled based on transaction type)

**Box allocations are auto-determined** by the `TransactionType` — see §4 (Common Return Entries) below.

**Conditional modules (inline):**
- **Partial Exemption module** — appears below Box 4 if `partiallyExempt = true`
- **Error Correction module** — appears below Box 4 if `hasErrorCorrection = true`
- **Bad Debt Relief module** — appears when a `bdr_claim` transaction type is selected

**Educational notes** appear inline beneath each box — see §10.

---

### Step 3: Review & Submit

| Panel | Content |
|-------|---------|
| **Summary table** | All 9 boxes with values, formatted using `formatCurrency()` |
| **Net position** | Highlighted: payable (positive Box 5), repayable (negative), or nil → `getNetPosition()` |
| **Filing deadline** | Calculated from period end → `calculateFilingDeadline()` |
| **Validation panel** | All checks from `runAllValidations()` with pass/fail/warning indicators |
| **Educational notes** | Per-check notes with references to legislation and HMRC guidance |

**Completion:** All boxes must be populated and all validation checks must pass (status !== 'fail'). Warnings are informational.

**Output interface:** `VATReturnResult` (types.ts)

---

## 3. The 9-Box Reference

Authoritative definitions from HMRC VAT100 guidance.

### Box 1 — VAT due on sales and other outputs

Output tax on:
- Standard-rated and reduced-rated sales
- Reverse charge output tax (s.8 VATA 1994)
- PVA output tax (SI 2019/60)
- Domestic reverse charge output (construction, mobile phones)

**Does NOT include:** Zero-rated or exempt sales (no VAT charged).

### Box 2 — VAT due on acquisitions from EU member states

Acquisition tax on goods acquired in **Northern Ireland** from EU suppliers. Only used by XI-registered businesses. GB businesses leave this at zero.

### Box 3 — Total VAT due (auto-calculated)

```
Box 3 = Box 1 + Box 2
```
Function: `calculateBox3(box1, box2)` (utils.ts)

### Box 4 — VAT reclaimed on purchases and other inputs

Input tax on:
- Standard-rated purchases
- Reverse charge input tax (recoverable portion)
- PVA input tax (recoverable portion)
- Bad debt relief claims (s.36 VATA 1994)
- Error corrections (input tax overclaims reduce this box)

**Reductions applied:**
- Partial exemption restriction → `calculatePartialExemption()` → adjustment deducted
- Blocked input tax (entertainment, motor cars) → excluded entirely
- Error correction for overclaimed input tax → deducted

### Box 5 — Net VAT to pay or reclaim (auto-calculated)

```
Box 5 = Box 3 − Box 4
```
Function: `calculateBox5(box3, box4)` (utils.ts)

- **Positive** = VAT payable to HMRC
- **Negative** = VAT repayable by HMRC
- **Zero** = nil return

### Box 6 — Total value of sales excluding VAT

**Includes:**
- Standard-rated sales (net of VAT)
- Reduced-rated sales (net of VAT)
- Zero-rated sales including exports
- **Exempt supplies** (per HMRC guidance: "Includes zero-rated and exempt supplies")

**Does NOT include:** PVA output amounts, reverse charge output amounts.

### Box 7 — Total value of purchases excluding VAT

**Includes:**
- Standard-rated purchases (net)
- Zero-rated purchases (net)
- PVA imports (net value of imported goods)
- Reverse charge services (net value)

**Does NOT include:** BDR claims (s.36 VATA 1994 — Box 7 is not adjusted for BDR).

### Box 8 — Total value of supplies to EU member states

Dispatches of goods from Northern Ireland to EU. XI-registered businesses only. GB businesses must leave at zero.

### Box 9 — Total value of acquisitions from EU member states

Goods acquired in Northern Ireland from EU. XI-registered businesses only. GB businesses must leave at zero.

---

## 4. Common Return Entries

How each transaction type maps to boxes. Source: HMRC VAT100 guidance.

| Transaction | Type (`TransactionType`) | Box 1 | Box 2 | Box 4 | Box 6 | Box 7 | Box 8 | Box 9 |
|---|---|---|---|---|---|---|---|---|
| Standard-rated sale | `output_standard` | VAT | — | — | net | — | — | — |
| Reduced-rated sale | `output_reduced` | VAT | — | — | net | — | — | — |
| Zero-rated domestic sale | `output_zero` | — | — | — | net | — | — | — |
| Exempt supply | `output_exempt` | — | — | — | net | — | — | — |
| Zero-rated export | `export` | — | — | — | net | — | — | — |
| PVA import (output) | `pva_output` | VAT | — | — | — | — | — | — |
| PVA import (input) | `pva_input` | — | — | VAT | — | net | — | — |
| Reverse charge (output) | `reverse_charge_output` | VAT | — | — | — | — | — | — |
| Reverse charge (input) | `reverse_charge_input` | — | — | VAT | — | net | — | — |
| Standard-rated purchase | `input_standard` | — | — | VAT | — | net | — | — |
| Zero-rated purchase | `input_zero` | — | — | — | — | net | — | — |
| Bad debt relief | `bdr_claim` | — | — | VAT | — | — | — | — |
| Error correction | `error_correction` | ±VAT | — | ±VAT | — | — | — | — |
| PE adjustment | `pe_adjustment` | — | — | −VAT | — | — | — | — |
| EU acquisition (NI) | `eu_acquisition` | — | VAT | VAT | — | net | — | net |
| EU dispatch (NI) | `eu_dispatch` | — | — | — | net | — | net | — |

**Key points:**
- PVA and RC require **paired entries** (output + input) — see validation checks 1 and 2
- BDR enters Box 4 **only** — Box 7 is NOT adjusted (s.36 VATA 1994)
- Exempt supplies appear in Box 6 alongside taxable supplies (HMRC VAT100 guidance)
- EU acquisition/dispatch boxes (2, 8, 9) only for XI businesses

---

## 5. Validation Rules

Ten checks run by `runAllValidations()` (utils.ts).

### Check 1: PVA Mirror — `validatePVAMirror()`

| Field | Value |
|-------|-------|
| **Trigger** | PVA transactions exist |
| **Rule** | Box 1 PVA = Box 4 PVA (unless partly exempt) |
| **Fail message** | "PVA mismatch: Box 1 PVA = £X, Box 4 PVA = £Y" |
| **Educational note** | PVA requires matching entries. Download Monthly Postponed Import VAT Statement to reconcile. |
| **Partly exempt** | Box 4 PVA may be less than Box 1 PVA (restriction expected) |

### Check 2: Reverse Charge Mirror — `validateRCMirror()`

| Field | Value |
|-------|-------|
| **Trigger** | Reverse charge transactions exist |
| **Rule** | Box 1 RC = Box 4 RC (unless partly exempt) |
| **Fail message** | "RC mismatch: Box 1 RC = £X, Box 4 RC = £Y" |
| **Educational note** | Omitting one side of the reverse charge is a common error. Both output and input entries must be made. |
| **Partly exempt** | Box 4 RC may be restricted |

### Check 3: Bad Debt Relief — `validateBDR()`

| Field | Value |
|-------|-------|
| **Trigger** | BDR data provided |
| **Rule** | All conditions verified: claim ≤ original VAT, 6-month wait met, within 4y6m, written off before period end |
| **Fail message** | Lists specific failing conditions |
| **Educational note** | 5 conditions from s.36 VATA 1994. Enters Box 4 only — do NOT adjust Box 7. |

**The 5 conditions (s.36 VATA 1994):**
1. VAT accounted for and paid to HMRC
2. Debt written off in accounts
3. 6 months since later of payment due date / date of supply → `isBDRWaitingPeriodMet()`
4. Debt not assigned or factored
5. Supply at customary selling price

**Time limit:** 4 years 6 months (54 months) → `isBDRWithinTimeLimit()`

**VAT calculation:** `calculateBDRAmount(grossAmountUnpaid)` = gross × 1/6

### Check 4: NI Boxes — `validateNIBoxes()`

| Field | Value |
|-------|-------|
| **Trigger** | Always |
| **Rule** | GB businesses: Box 8 = 0 and Box 9 = 0 |
| **Fail message** | "GB business has values in Box 8/9 — must be zero" |
| **Educational note** | Boxes 8 and 9 for NI intra-Community trade only. GB businesses must leave at zero. |

### Check 5: Export Evidence — `validateExportEvidence()`

| Field | Value |
|-------|-------|
| **Trigger** | Zero-rated exports in Box 6 |
| **Status** | `warning` (not fail) |
| **Message** | "Zero-rated exports of £X in Box 6 — ensure export evidence obtained" |
| **Educational note** | Proof of export required within 3 months. Without it, HMRC may assess at standard rate. |

### Check 6: Box 3 Auto-Calculation — `validateBox3Calculation()`

| Field | Value |
|-------|-------|
| **Trigger** | Always |
| **Rule** | Box 3 = Box 1 + Box 2 |
| **Educational note** | Box 3 is always Box 1 + Box 2. |

### Check 7: Box 5 Auto-Calculation — `validateBox5Calculation()`

| Field | Value |
|-------|-------|
| **Trigger** | Always |
| **Rule** | Box 5 = Box 3 − Box 4 |
| **Educational note** | Positive = payable, negative = repayable. |

### Check 8: Partial Exemption Applied — `validatePEApplied()`

| Field | Value |
|-------|-------|
| **Trigger** | Exempt supplies detected in Box 6 |
| **Rule** | PE data must be provided |
| **Fail message** | "Exempt supplies detected but no PE calculation provided" |
| **Educational note** | Any business making taxable + exempt supplies must apply PE (s.26 VATA 1994). |

### Check 9: Blocked Input Tax — `isBlockedInputTax()`

| Field | Value |
|-------|-------|
| **Trigger** | User selects a blocked category |
| **Status** | `info` |
| **Categories** | `business_entertainment`, `motor_car_private_use`, `non_business_use` |
| **Output** | `{ blocked: true, reason: string }` |
| **Source** | `BLOCKED_CATEGORIES` constant (utils.ts) |

### Check 10: Error Correction Threshold — `validateErrorCorrection()`

| Field | Value |
|-------|-------|
| **Trigger** | Error correction data provided |
| **Rule** | Threshold check via `checkErrorCorrectionThreshold()` |
| **Pass** | "Error of £X: Adjust on next VAT return" |
| **Warning** | "Error of £X: Notify HMRC separately" |
| **Educational note** | ≤ £10k: adjust on return. £10k–£50k and ≤ 1% Box 6: may adjust. Above: notify HMRC (VAT Notice 700/45). |

---

## 6. Partial Exemption Module

Source: s.26 VATA 1994, VAT Notice 706. Appears in Step 2 when `partiallyExempt = true`.

### Standard Method — 3-Step Process

**Step 1: Direct attribution**

| Category | Treatment |
|----------|-----------|
| Input tax directly attributable to **taxable** supplies | Fully recoverable |
| Input tax directly attributable to **exempt** supplies | Not recoverable (subject to de minimis) |

**Step 2: Identify residual input tax**

General overheads that cannot be directly attributed (rent, IT, professional fees, shared utilities).

**Step 3: Apportion residual**

```
Recoverable residual = Residual input tax × (Taxable supplies ÷ Total supplies)
```

Function: `calculatePEStandardMethod(taxableSupplies, totalSupplies, residualInputTax)` (utils.ts)

### Rounding Rule

The taxable turnover ratio is **rounded UP to the next whole percentage point**.

Function: `roundPEPercentage(percentage)` (utils.ts)

| Example | Calculation |
|---------|-------------|
| £2,800,000 / £2,920,000 | = 95.8904...% → **96%** |
| £800,000 / £1,100,000 | = 90.9090...% → **91%** |

### De Minimis Tests

Function: `checkDeMinimis(exemptInputTax, totalInputTax, monthsInPeriod)` (utils.ts)

Both tests must pass for exempt input tax to be treated as de minimis:

| Test | Threshold | Constant |
|------|-----------|----------|
| **Test 1** | Exempt input tax ≤ £625/month average | `DE_MINIMIS_MONTHLY` |
| **Test 2** | Exempt input tax < 50% of total input tax | `DE_MINIMIS_PERCENTAGE` |

| Return Period | Monthly Average Threshold |
|---------------|--------------------------|
| Monthly | £625 |
| Quarterly | £1,875 (£625 × 3) |
| Annual | £7,500 (£625 × 12) |

If de minimis: recover all input tax (adjustmentAmount = 0).
If not de minimis: restrict by totalExemptInputTax.

### Complete Calculation

Function: `calculatePartialExemption(...)` (utils.ts) → returns `PartialExemptionData` (types.ts)

### Annual Adjustment

The annual adjustment recalculates using full-year figures. The difference between annual and cumulative quarterly recoveries is entered on the year-end return. De minimis tests are re-applied using annual figures.

---

## 7. Error Correction Module

Source: VAT Notice 700/45. Appears in Step 2 when `hasErrorCorrection = true`.

### Threshold Logic

Function: `checkErrorCorrectionThreshold(netErrorAmount, box6Turnover)` (utils.ts)

| Error Size | Test | Method | Constants |
|------------|------|--------|-----------|
| ≤ £10,000 | — | Adjust on next VAT return | `ERROR_CORRECTION_THRESHOLD` |
| £10,001–£50,000 | AND ≤ 1% of Box 6 | May adjust on next return | `ERROR_CORRECTION_UPPER_LIMIT` |
| > £50,000 | OR > 1% of Box 6 (when > £10k) | Notify HMRC separately | — |

### Correction Entry

| Error Type | Correction |
|-----------|------------|
| Output tax **underpaid** | Add to Box 1 (increases VAT payable) |
| Input tax **overclaimed** | Reduce Box 4 (increases VAT payable) |
| Output tax **overpaid** | Reduce Box 1 (decreases VAT payable) |
| Input tax **underclaimed** | Add to Box 4 (decreases VAT payable) |

### Time Limit

4 years from the end of the return period containing the error. Beyond 4 years: time-barred (subject to 20-year extended limit for deliberate errors).

**Note:** This is 4 years (error correction), NOT 4 years 6 months (which is BDR).

---

## 8. Bad Debt Relief Module

Source: s.36 VATA 1994. Appears in Step 2 when a `bdr_claim` transaction is entered.

### Five Conditions (s.36 VATA 1994)

| # | Condition | Verifiable by Tool? |
|---|-----------|---------------------|
| 1 | VAT accounted for and paid to HMRC | Attestation (user confirms) |
| 2 | Debt written off in accounts | Date check — `dateWrittenOff` before `returnPeriodEnd` |
| 3 | 6 months since later of payment due / date of supply | `isBDRWaitingPeriodMet()` |
| 4 | Debt not assigned or factored | Attestation (user confirms) |
| 5 | Supply at customary selling price | Attestation (user confirms) |

### 6-Month Trigger

Function: `isBDRWaitingPeriodMet(paymentDueDate, dateOfSupply, returnPeriodEnd)` (utils.ts)

The trigger date is the **later of**:
- Date payment was due and payable
- Date of supply (tax point)

6 months must have elapsed from the trigger date to the return period end.

### Absolute Time Limit

Function: `isBDRWithinTimeLimit(paymentDueDate, dateOfSupply, returnPeriodEnd)` (utils.ts)

54 months (4 years 6 months) from the later of payment due date / date of supply.

Constant: `BDR_TIME_LIMIT_MONTHS = 54`

### Claim Amount

Function: `calculateBDRAmount(grossAmountUnpaid)` (utils.ts)

```
VAT claimed = grossAmountUnpaid × 1/6
```

Constant: `VAT_FRACTION = 1/6`

For partial payments: apply 1/6 to the **unpaid portion** only.

### Box Entry

| Box | Entry |
|-----|-------|
| **Box 4** | VAT amount claimed |
| **Box 7** | **No entry** — original Box 6 value is not adjusted |

---

## 9. Educational Framework

### Inline Notes Per Box

| Box | Note |
|-----|------|
| 1 | "Includes output tax on sales, reverse charge output, and PVA output. Does NOT include zero-rated or exempt supplies." |
| 2 | "NI only — acquisition tax on goods acquired from EU. GB businesses leave this at zero." |
| 3 | "Auto-calculated: Box 1 + Box 2." |
| 4 | "Includes input tax on purchases, PVA input (if recoverable), RC input (if recoverable), BDR claims. Reduced by PE restriction and error corrections." |
| 5 | "Auto-calculated: Box 3 − Box 4. Positive = payable to HMRC. Negative = repayable." |
| 6 | "Total sales value excluding VAT. Includes zero-rated AND exempt supplies. Does NOT include PVA/RC output amounts." |
| 7 | "Total purchases value excluding VAT. Includes PVA import values and RC service values. Does NOT include BDR claims." |
| 8 | "NI only — value of goods dispatched to EU. GB businesses leave at zero." |
| 9 | "NI only — value of goods acquired from EU. GB businesses leave at zero." |

### Common Errors Panel

Displayed in Step 3 (Review & Submit):

1. **Omitting one side of RC/PVA** — Must enter BOTH output (Box 1) and input (Box 4)
2. **Including BDR in Box 7** — BDR only enters Box 4; Box 7 is not adjusted
3. **Forgetting PE adjustment** — If exempt supplies exist, input tax must be restricted
4. **Entering blocked entertainment** — Business entertainment VAT is wholly blocked; do not include
5. **GB business using Boxes 8/9** — These are for NI intra-Community trade only
6. **Wrong error correction method** — Check threshold before adjusting on return vs notifying HMRC
7. **Missing export evidence** — Zero-rated exports require proof within 3 months
8. **Exempt supplies excluded from Box 6** — Box 6 includes ALL sales (taxable + exempt)

### Decision Trees

**PVA vs RC vs Standard import:**
```
Import of goods?
├─ Yes → Is PVA elected?
│   ├─ Yes → PVA entries (Box 1 + Box 4 + Box 7)
│   └─ No → Import VAT paid at border (Box 4 + Box 7 only)
└─ No → Is this a service from abroad?
    ├─ Yes → Reverse charge (Box 1 + Box 4 + Box 7)
    └─ No → Standard domestic purchase (Box 4 + Box 7)
```

**Zero-rated vs Exempt vs Standard:**
```
Is the supply taxable?
├─ Standard-rated → Box 1 (VAT) + Box 6 (net)
├─ Reduced-rated → Box 1 (VAT at 5%) + Box 6 (net)
├─ Zero-rated → Box 6 (net only, no VAT)
└─ Exempt → Box 6 (net only, no VAT, triggers PE if also making taxable supplies)
```

**Can I correct this error on the return?**
```
Net error amount?
├─ ≤ £10,000 → Yes — adjust Box 1 or Box 4
├─ £10,001–£50,000 → Is error ≤ 1% of Box 6?
│   ├─ Yes → May adjust on return
│   └─ No → Must notify HMRC
└─ > £50,000 → Must notify HMRC
```

---

## 10. Registration Data

### Database Insert

```sql
INSERT INTO tools (
  id, name, slug, tool_type, category, icon,
  short_description, description,
  status, is_public, is_premium, version,
  config, created_at, updated_at
) VALUES (
  'vat-return-boxes-1-9',
  'VAT Return (Boxes 1-9)',
  'vat-return',
  'form',
  'vat',
  'FileText',
  'Complete a UK VAT return with transaction-level breakdown, auto-calculations, and comprehensive validation.',
  'The standard UK VAT return (form VAT100) filed quarterly via Making Tax Digital. Enter transactions into 9 boxes with auto-calculation of Boxes 3 and 5, partial exemption module, bad debt relief calculator, error correction threshold checker, and 10 validation checks with educational notes.',
  'active',
  true,
  false,
  '1.0',
  '{"calculatorType": "vat-return", "version": "1.0", "steps": 3}',
  NOW(),
  NOW()
);
```

### Skill Category Mapping

```sql
INSERT INTO skill_category_tools (skill_category_id, tool_id)
VALUES ('vat-compliance', 'vat-return-boxes-1-9');
```

---

## 11. Source References

| Source | What It Provides |
|--------|------------------|
| VATA 1994, s.25–26 | Output tax, input tax, partial exemption framework |
| VATA 1994, s.36 | Bad debt relief — 5 statutory conditions |
| SI 2019/60 | Postponed VAT Accounting regulations |
| VAT Notice 700/12 | Error correction thresholds and procedures |
| VAT Notice 706 | Partial exemption — standard method, de minimis, annual adjustment |
| HMRC VAT100 (MTD) | 9-box return format, filing deadlines |
| `Tools/TOOL-CREATION-GUIDE.md` | Platform conventions (4-file structure, SavedData, props pattern) |
