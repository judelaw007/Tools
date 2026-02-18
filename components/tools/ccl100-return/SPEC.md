# CCL100 Return — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `ccl100-return` |
| Tool Slug | `ccl100-return` |
| Display Name | CCL100 Return |
| Component Name | `CCL100Return` |
| Real-World Equivalent | HMRC CCL100 (quarterly return for CCL-registered businesses) |
| Tool Type | `form` |
| Category | `vat` |
| Difficulty | Intermediate |
| Sections Used | S9, S10 |
| Build Order | 5 of 5 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'ccl100-return',
  'CCL100 Return',
  'Complete an HMRC CCL100 quarterly return for Climate Change Levy. Covers electricity, gas, LPG, and solid fuel supplies at main rates. Handles CCA reduced rate discounts, exemptions (renewables, CHP, mineralogical/metallurgical), credits from prior periods, and Carbon Price Support rates for generators.',
  'CCL100Return',
  'vat',
  'form',
  'intermediate',
  true,
  5
);
```

---

## 2. Purpose & Context

The CCL100 is the quarterly return for businesses registered for Climate Change Levy. CCL is charged on supplies of electricity, gas, LPG, and solid fuels to business consumers. Suppliers account for CCL on their returns; end-users with CCA certificates receive reduced rates passed through by their suppliers.

This tool simulates the CCL100 return with full commodity breakdown, CCA discount calculations, exemption handling, validation, educational annotations, and tracking callbacks for the MojiTax platform. Students complete the return for H&C's Swansea manufacturing plant across 2 course sections.

### Why This Tool Matters

- **Environmental tax compliance**: CCL is one of four UK environmental taxes (alongside PPT, Landfill Tax, and Aggregates Levy) — CTA candidates must demonstrate competence in all
- **CCA complexity**: The interaction between main rates, CCA reduced rates, and exemptions is a common exam topic
- **Rate application**: Different rates per commodity and different CCA discount percentages per commodity test precision
- **Integration with other taxes**: CCL interacts with VAT (CCL is part of the taxable supply value for VAT purposes — but this tool focuses on the CCL return itself)

---

## 3. CCL100 Form Structure

The real HMRC CCL100 has 9 boxes organised in two sections: main rates (Boxes 1–5) and Carbon Price Support rates (Boxes 6–9). For this practice tool, we focus on the main rate boxes (1–5) which are relevant to H&C's manufacturing operations. CPS boxes (6–9) are displayed but only relevant for electricity generators.

### Box 1 — Electricity

**What goes here:**
- Total CCL due on taxable supplies of electricity at the main rate
- Calculated as: (total kWh supplied × main rate per kWh) minus CCA relief minus exemptions minus credits

**Sub-components the student must calculate:**
- Standard-rate electricity (kWh × main rate)
- CCA-rate electricity (kWh × main rate × (1 − CCA discount %))
- Less: exempt electricity (renewables with LECs, CHP qualifying)
- Less: credits from prior periods (if any)

**Educational note:** Electricity has the highest CCA discount (92%), meaning CCA holders pay only 8% of the main rate on electricity covered by their agreement. This makes it the most valuable CCA commodity.

---

### Box 2 — Gas

**What goes here:**
- Total CCL due on taxable supplies of gas at the main rate
- Plus: CCL due at the CPS rate for gas (if applicable — generators only)

**Sub-components the student must calculate:**
- Standard-rate gas (kWh × main rate)
- CCA-rate gas (kWh × main rate × (1 − CCA discount %))
- Less: exempt gas (CHP qualifying)
- Less: credits from prior periods (if any)

**Educational note:** Gas has an 89% CCA discount, meaning CCA holders pay 11% of the main rate. The CPS rate (£0.00331/kWh) applies additionally when gas is used for electricity generation — not relevant for H&C's manufacturing use.

---

### Box 3 — LPG

**What goes here:**
- Total CCL due on taxable supplies of LPG at the main rate
- Plus: CCL due at the CPS rate for LPG (if applicable — generators only)

**Sub-components the student must calculate:**
- Standard-rate LPG (kg × main rate per kg)
- CCA-rate LPG (kg × main rate × (1 − CCA discount %))
- Less: exempt LPG
- Less: credits from prior periods (if any)

**Educational note:** LPG rates have been frozen since 2024 at £0.02175/kg. The CCA discount for LPG is 77%, the lowest of the four commodities. LPG is measured in kilograms, not kWh.

---

### Box 4 — Solid Fuels (Coal and other taxable commodities)

**What goes here:**
- Total CCL due on taxable supplies of solid fuels at the main rate
- Plus: CCL due at the CPS rate for solid fuels (if applicable — generators only)

**Sub-components the student must calculate:**
- Standard-rate solid fuels (kg × main rate per kg)
- CCA-rate solid fuels (kg × main rate × (1 − CCA discount %))
- Less: exempt solid fuels (mineralogical/metallurgical processes)
- Less: credits from prior periods (if any)

**Educational note:** "Other taxable commodities" covers coal, coke, lignite, and petroleum coke. The rate is per kilogram. The CCA discount is 89%, same as gas.

---

### Box 5 — Net CCL Due (auto-calculated)

**Formula:** Box 1 + Box 2 + Box 3 + Box 4

- **Positive result** → CCL payable to HMRC
- **Negative result** → CCL repayable by HMRC (possible when credits exceed current liability)

**Educational note:** Payment is due within 30 days of the period end date. Late filing triggers the penalty points regime and may result in HMRC requiring monthly returns instead of quarterly.

---

### Boxes 6–9 — Carbon Price Support (CPS)

These boxes only apply to electricity generators and energy producers using gas, LPG, or solid fuels to generate electricity. H&C is a manufacturer, not a generator, so these boxes are zero in all H&C scenarios.

- **Box 6**: CPS rate CCL on gas used for electricity generation
- **Box 7**: CPS rate CCL on LPG used for electricity generation
- **Box 8**: CPS rate CCL on solid fuels used for electricity generation
- **Box 9**: Total CPS CCL due (Box 6 + Box 7 + Box 8)

The tool displays these boxes as read-only zeros with an educational note explaining CPS.

---

## 4. Input Structure

### Accounting Period

```typescript
{
  startDate: string;   // ISO 8601 (e.g., "2027-01-01")
  endDate: string;     // ISO 8601 (e.g., "2027-03-31")
  label: string;       // Human-readable (e.g., "Q4 2026/27")
}
```

### Commodity Input (repeated for electricity, gas, LPG, solid fuels)

```typescript
{
  // Quantities
  standardQuantity: number;  // kWh (elec/gas) or kg (LPG/solid)
  ccaQuantity: number;       // kWh or kg covered by CCA

  // Exemptions
  exemptRenewables: number;  // kWh — electricity only (LECs required)
  exemptCHP: number;         // kWh or kg — CHP qualifying
  exemptMineralogical: number; // kg — solid fuels only

  // Credits
  creditFromPrior: number;   // £ — credit from previous periods
}
```

### CCA Details

```typescript
{
  hasCCA: boolean;              // Whether a CCA is in force
  ccaCertificateRef: string;    // CCA certificate reference number
  ccaFacilityName: string;      // Name of the CCA-certified facility
}
```

---

## 5. Validation Rules

### Cross-Box Validations

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Box 5 calculation | `error` | Box 5 must equal Box 1 + Box 2 + Box 3 + Box 4 exactly. |
| V2 | CCA without certificate | `error` | If any commodity has CCA quantities > 0 but no CCA certificate reference is entered, flag as error. CCA relief requires a valid PP10/PP11 in place. |
| V3 | CCA exceeds total | `error` | CCA quantity for any commodity must not exceed total quantity (standard + CCA). |
| V4 | Exemptions exceed supply | `error` | Total exempt quantity for any commodity must not exceed total quantity supplied. |
| V5 | Negative box warning | `warning` | If any box (1–4) is negative, warn that this implies credits exceed liability — confirm this is correct. |
| V6 | LPG unit check | `info` | Remind that LPG is measured in kg, not kWh. Confirm units are correct. |
| V7 | Zero return check | `info` | If all boxes are zero, confirm this is a nil return (valid, but remind that nil returns must still be filed). |
| V8 | Rate period check | `info` | Confirm which rate table applies based on the accounting period dates (rates change on 1 April each year). |
| V9 | CCA rate application | `info` | If CCA is applied, display the effective CCA rate per commodity and confirm the discount percentage. |
| V10 | Payment deadline | `info` | Display the payment deadline (30 days after period end) and warn if approaching. |

### Field-Level Validations

| Rule | Description |
|------|-------------|
| Non-negative quantities | All quantity fields must be ≥ 0 |
| Pence precision | All monetary amounts rounded to 2 decimal places |
| Period dates | End date must be after start date; period should be approximately 3 months |
| Certificate format | CCA certificate reference should be non-empty if CCA is ticked |

---

## 6. Output Structure

### Completed Return

```typescript
{
  boxes: {
    box1: number;  // Electricity CCL due
    box2: number;  // Gas CCL due
    box3: number;  // LPG CCL due
    box4: number;  // Solid fuels CCL due
    box5: number;  // Net CCL due (Box 1 + 2 + 3 + 4)
    box6: number;  // CPS gas (0 for non-generators)
    box7: number;  // CPS LPG (0 for non-generators)
    box8: number;  // CPS solid fuels (0 for non-generators)
    box9: number;  // Total CPS (0 for non-generators)
  };
  position: 'payable' | 'repayable' | 'nil';
  commodityBreakdowns: CommodityBreakdown[];
  validationResults: ValidationResult[];
  paymentDeadline: string;
  rateReference: RateReference;
}
```

### Commodity Breakdown

```typescript
{
  commodity: 'electricity' | 'gas' | 'lpg' | 'solid-fuels';
  standardQuantity: number;
  standardRate: number;
  standardCCL: number;
  ccaQuantity: number;
  ccaRate: number;     // main rate × (1 - discount %)
  ccaCCL: number;
  exemptQuantity: number;
  exemptDeduction: number;
  creditDeduction: number;
  netCCLDue: number;
  calculationSteps: CalculationStep[];
}
```

---

## 7. Educational Notes

### Commodity-Specific Notes

After submission, the tool generates educational annotations per commodity:

1. **Electricity**: "Electricity has the highest CCA discount at 92%. Without a CCA, the full main rate of £0.00775/kWh applies. With a CCA, only £0.00062/kWh is payable — a saving of £0.00713 per kWh."
2. **Gas**: "Gas CCA discount is 89%. The CPS rate additionally applies only when gas is used for electricity generation — not for manufacturing heat."
3. **LPG**: "LPG is the only commodity measured in kg, not kWh. The CCA discount is 77% — the lowest of the four commodities."
4. **Solid fuels**: "Solid fuels cover coal, coke, lignite, and petroleum coke. The rate is per kg. CCA discount is 89%, same as gas."

### Contextual Tips

Displayed inline as the student completes each commodity section:
- **CCA field**: "A Climate Change Agreement is between a sector association and the Environment Agency. Individual facilities are certified. The PP10 form reports actual energy use to HMRC; the PP11 certifies the facility to the supplier."
- **Exemptions**: "Renewable electricity is only exempt from CCL when supplied directly by auto-generators or unlicensed suppliers with Levy Exemption Certificates (LECs). Grid electricity labelled 'green' by a licensed supplier is still taxable."
- **Credits**: "Credits arise when you have overpaid CCL in a previous period. Enter the sterling amount of the credit, not the quantity."

---

## 8. H&C Test Scenarios

### Scenario 1 — Section 9: CCL for Swansea Plant

**Context:** H&C's Swansea manufacturing plant consumes 1.6m kWh electricity and 1.2m kWh gas per quarter. The plant has a Climate Change Agreement. No LPG or solid fuel consumption. No exemptions (grid electricity, not auto-generated). No credits from prior periods.

**Fact register values:**
- Electricity: 1,600,000 kWh (all CCA-covered)
- Gas: 1,200,000 kWh (all CCA-covered)
- CCA certificate: in force for Swansea plant

**Expected calculation (using 2025/26 rates — £0.00775/kWh for both):**

*Electricity (Box 1):*
- CCA rate = £0.00775 × (1 − 0.92) = £0.00062/kWh
- CCL = 1,600,000 × £0.00062 = £992.00

*Gas (Box 2):*
- CCA rate = £0.00775 × (1 − 0.89) = £0.0008525/kWh
- CCL = 1,200,000 × £0.0008525 = £1,023.00

*LPG (Box 3):* £0.00
*Solid fuels (Box 4):* £0.00
*Net CCL due (Box 5):* £2,015.00

**Key validation:** V2 should pass (CCA certificate entered). V8 should confirm 2025/26 rates apply.

---

### Scenario 2 — Section 10: Q4 CCL Return (Capstone)

**Context:** Year-end return. Same Swansea plant consumption as S9 (the quarterly figures are consistent). This is the Q4 return, demonstrating the student can complete the return independently as part of the full capstone compliance pack.

**Fact register values:**
- Electricity: 1,600,000 kWh (all CCA-covered)
- Gas: 1,200,000 kWh (all CCA-covered)
- CCA certificate: in force for Swansea plant

**Expected calculation (same as Scenario 1 — same quarter, same rates):**

*Box 1:* £992.00
*Box 2:* £1,023.00
*Box 3:* £0.00
*Box 4:* £0.00
*Box 5:* £2,015.00

**Key validations:** All standard validations. V10 should display payment deadline (30 days after period end).

---

## 9. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onCommodityEntry` | Student enters/modifies a commodity input | `{ commodity, field, value, timestamp }` |
| `onValidation` | Return is validated (submit or re-check) | `{ validationResults, passCount, failCount }` |
| `onSubmit` | Student submits completed return | `{ boxes, position, isCorrect, attemptNumber }` |
| `onHint` | Student requests a hint | `{ commodity, hintType }` |
| `onReset` | Student resets the form | `{ previousAttempt }` |
| `onBreakdownView` | Student views commodity breakdown | `{ commodity }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section }` |

---

## 10. Rate Tables

### Main CCL Rates

| Commodity | Unit | 2024/25 | 2025/26 | 2026/27 | 2027/28 | Source |
|-----------|------|---------|---------|---------|---------|--------|
| Electricity | £/kWh | 0.00775 | 0.00775 | 0.00801 | 0.00827 | Finance Act 2000, Sch 6 |
| Gas | £/kWh | 0.00775 | 0.00775 | 0.00801 | 0.00827 | Finance Act 2000, Sch 6 |
| LPG | £/kg | 0.02175 | 0.02175 | 0.02175 | 0.02175 | Finance Act 2000, Sch 6 |
| Solid fuels | £/kg | 0.06064 | 0.06064 | 0.06264 | 0.06468 | Finance Act 2000, Sch 6 |

### CCA Discount Percentages

| Commodity | Discount | Effective rate (2025/26) |
|-----------|----------|--------------------------|
| Electricity | 92% | £0.00062/kWh |
| Gas | 89% | £0.0008525/kWh |
| LPG | 77% | £0.0050025/kg |
| Solid fuels | 89% | £0.0066704/kg |

### Carbon Price Support Rates (fixed from 1 April 2016 to 31 March 2028)

| Commodity | Rate | Unit |
|-----------|------|------|
| Gas | £0.00331 | per kWh |
| LPG | £0.05280 | per kg |
| Solid fuels | £1.54790 | per GJ (gross calorific value) |

*Note: No CPS rate applies to electricity. CPS applies only when commodities are used for electricity generation.*

---

## 11. Accessibility & UX

- Tab order follows: Period → CCA details → Electricity → Gas → LPG → Solid fuels → Submit
- Each commodity section has expandable sub-sections for standard, CCA, exempt, and credit amounts
- Tooltips on each field explain what belongs there
- Validation runs on blur (per commodity) and on submit (full return)
- Colour coding: green (correct/info), amber (warning), red (error)
- Responsive layout: single-column on mobile, commodity sections stacked vertically
- Rate reference panel always visible showing current applicable rates

---

## 12. Filing & Payment Rules

| Rule | Value | Source |
|------|-------|--------|
| Filing frequency | Quarterly (default) or annual (if liability < £2,000/year) | Climate Change Levy (General) Regulations 2001 |
| Filing deadline | 30 days after period end | Climate Change Levy (General) Regulations 2001 |
| Payment deadline | 30 days after period end | Climate Change Levy (General) Regulations 2001 |
| Late filing penalty | Points-based regime; may trigger monthly filing | Finance Act 2021 |
| Nil returns | Must still be filed — write £0.00 in all boxes | HMRC CCL100 guidance |
| CCA certification | PP10 to HMRC + PP11 to supplier | Excise Notice CCL1/3 |
