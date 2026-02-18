# CDS Import Declaration (C88) — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `cds-import-declaration` |
| Tool Slug | `cds-import-declaration` |
| Display Name | CDS Import Declaration (C88) |
| Component Name | `CDSImportDeclaration` |
| Real-World Equivalent | HMRC Customs Declaration Service (CDS) — Single Administrative Document (SAD/C88) |
| Tool Type | `form` |
| Category | `vat` |
| Difficulty | Advanced |
| Sections Used | S2, S3 |
| Build Order | 4 of 5 (depends on Trade Tariff Lookup + Customs Valuation Worksheet) |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'cds-import-declaration',
  'CDS Import Declaration (C88)',
  'Complete a UK customs import declaration on the Customs Declaration Service. Covers standard imports (4000), re-imports under Outward Processing relief (6121), preference claims, Postponed VAT Accounting, and duty calculation. Validates procedure codes, preference codes, document references, and cross-checks customs value.',
  'CDSImportDeclaration',
  'vat',
  'form',
  'advanced',
  true,
  4
);
```

---

## 2. Purpose & Context

Every import of goods into the UK requires a customs declaration on the Customs Declaration Service (CDS). CDS replaced the legacy CHIEF system in 2023. The declaration captures who is importing, what is being imported, where it comes from, how it is valued, what procedure applies, and what duties/taxes are due.

This tool simulates a CDS import declaration with the key data elements, validation logic, duty/VAT calculation, and educational annotations. Students complete declarations for progressively complex scenarios across 2 course sections.

### Why This Tool Matters

- **Universal requirement**: Every import requires a C88 declaration — no exceptions
- **Procedure code mastery**: Understanding CPCs is essential for customs advisory work
- **Financial impact**: Incorrect declarations trigger customs debt, penalties, and post-clearance audits
- **Integration point**: This tool consumes outputs from the Trade Tariff Lookup (commodity codes) and Customs Valuation Worksheet (customs value), and its outputs feed into the VAT Return (PVA entries)
- **CTA exam relevance**: CDS procedure codes and preference claims are regularly examined

---

## 3. CDS Data Elements Covered

This tool models a simplified but technically accurate subset of the full CDS declaration. It focuses on the data elements most relevant to educational practice.

### Header-Level Fields

| DE | Field | Description |
|----|-------|-------------|
| 1/1 | Declaration type | Always "IM" for imports |
| 1/2 | Additional declaration type | A = standard full declaration |
| 3/17 | Declarant EORI | EORI of the person submitting the declaration |
| 3/18 | Declarant name | Name and address of declarant |
| 3/20 | Representative EORI | EORI of the customs agent (if applicable) |
| 3/21 | Representation type | 2 = direct, 3 = indirect |
| 3/37 | Importer EORI | EORI of the importer (owner of goods) |
| 3/40 | Importer VAT number | Entered to elect PVA — primary PVA trigger |
| 5/23 | Location of goods | Port/location where goods are presented |

### Item-Level Fields

| DE | Field | Description |
|----|-------|-------------|
| 1/10 | Procedure code | 4-digit code (requested + previous procedure) |
| 1/11 | Additional procedure code | 3-digit additional code(s) |
| 4/1 | Delivery terms (Incoterms) | e.g., FOB, CIF, EXW |
| 4/11 | Customs value (GBP) | Declared customs value |
| 4/16 | Valuation method | 1–6 |
| 4/13 | Valuation indicators | 4-digit code (Method 1 only) |
| 4/17 | Preference code | 3-digit preference code |
| 4/8 | Method of payment | E = DDA, A = cash, blank = PVA (VAT line) |
| 5/14 | Country of dispatch | Country from which goods were dispatched |
| 5/15 | Country of origin | Non-preferential origin |
| 5/16 | Country of preferential origin | Preferential origin (if different) |
| 6/1 | Net mass (kg) | Net weight |
| 6/2 | Supplementary units | Additional quantity measure |
| 6/8 | Goods description | Free text description of goods |
| 6/14+6/15 | Commodity code | 10-digit UK tariff code |
| 2/3 | Document references | Supporting documents (invoices, origin proofs, authorisations) |
| 2/6 | Duty deferment account | DDA number (if method of payment = E) |

---

## 4. Procedure Codes (DE 1/10)

### Supported Procedure Codes

| Code | Name | Description | H&C Usage |
|------|------|-------------|-----------|
| 4000 | Free circulation (standard import) | Release to free circulation — no previous procedure | S2: Olive oil, ceramic cups |
| 6121 | OP re-import (with duty on repair) | Re-import following outward processing with duty on repair/processing cost | S3: Repaired cups from Japan |
| 6122 | OP re-import (guarantee repair) | Re-import following OP where repair was free under guarantee | Reference only |
| 6110 | Returned Goods Relief | Re-import of unaltered UK goods within 3 years | Reference only |
| 5100 | Inward Processing | Entry to IP suspension | Reference only |
| 5300 | Temporary Admission | Entry to TA | Reference only |

### Procedure Code Validation Rules

- 4000: Standard import. Additional procedure code 000 unless specific reliefs apply.
- 6121: Requires C600 (OP authorisation) in DE 2/3. Customs value = repair cost + inward freight + insurance (NOT full goods value).
- 6122 + B02: Guarantee repair — no customs duty payable. C600 required.
- 6110: Goods must NOT have been altered abroad. Requires F01 or F05 in DE 1/11. Goods must have been in free circulation before export.

---

## 5. Preference Codes (DE 4/17)

| Code | Scheme | Origin Countries (H&C Relevant) |
|------|--------|--------------------------------|
| 100 | Third Country (MFN) — no preference | China, any country without FTA |
| 200 | DCTS (Developing Countries Trading Scheme) | India |
| 300 | UK-EU TCA preferential rate | Italy, Spain, France |
| 300 | UK-Japan CEPA preferential rate | Japan |

### Preference Code Validation

- 100: No origin proof required.
- 200: Requires document code 9001 (DCTS origin declaration) or N865 (Form A) in DE 2/3.
- 300 (EU TCA): Requires U110 (statement on origin, single shipment), U111 (multiple shipments), or U112 (importer's knowledge) in DE 2/3.
- 300 (Japan CEPA): Requires U110 or U112 in DE 2/3.

---

## 6. Document Reference Codes (DE 2/3)

| Code | Document | When Required |
|------|----------|---------------|
| N935 | Commercial invoice | Always |
| C506 | Duty Deferment Account (DPO) | When DE 4/8 = E |
| C600 | Outward Processing authorisation | When DE 1/10 = 6121 or 6122 |
| C601 | Inward Processing authorisation | When DE 1/10 = 5100 |
| U110 | Statement on origin (single shipment) | EU TCA / Japan CEPA preference |
| U111 | Statement on origin (multiple shipments) | EU TCA preference |
| U112 | Importer's knowledge | EU TCA / Japan CEPA preference |
| 9001 | DCTS origin declaration | DCTS preference |
| N865 | Form A (DCTS origin certificate) | DCTS preference |

---

## 7. Duty & Tax Calculation

### Standard Import (4000)

```
Customs Duty = Customs Value × Duty Rate
VAT Value    = Customs Value + Customs Duty
Import VAT   = VAT Value × VAT Rate (20% standard, 0% zero-rated)
Total Taxes  = Customs Duty + Import VAT
```

### OP Re-Import After Repair (6121)

```
Customs Value = Repair Cost + Inward Freight + Inward Insurance
Customs Duty  = Customs Value × Duty Rate
VAT Value     = Repair Cost + Outward Freight + Inward Freight + Customs Duty
Import VAT    = VAT Value × VAT Rate
Total Taxes   = Customs Duty + Import VAT
```

**Key difference**: Duty is only on the repair cost, NOT the original goods value. For VAT, insurance is excluded from the VAT value but outward freight is included.

### Guarantee Repair (6122 + B02)

```
Customs Duty  = £0 (repair was free under guarantee)
Import VAT    = £0 (if goods were originally in free circulation)
```

### PVA Election

When DE 3/40 (VAT number) is completed:
- Import VAT is not paid at the border
- Instead, accounted for on the VAT return: Box 1 (output) and Box 4 (recovery)
- DE 4/8 for the VAT tax line is left blank

---

## 8. Validation Rules

### Cross-Field Validations

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Procedure-preference compatibility | `error` | Certain procedure codes are incompatible with certain preference codes. E.g., 6121 OP re-import may still claim preference on the repair cost. |
| V2 | Missing document reference | `error` | If preference code requires origin proof (e.g., 300 needs U110/U111/U112), check DE 2/3 contains it. |
| V3 | OP authorisation check | `error` | If DE 1/10 = 6121 or 6122, DE 2/3 must contain C600 (OP authorisation). |
| V4 | DDA consistency | `warning` | If DE 4/8 = E (deferment), DE 2/6 must contain a DDA number. |
| V5 | PVA election check | `info` | If DE 3/40 is completed, confirm PVA is intended. Remind that import VAT will appear on VAT return (Box 1 + Box 4). |
| V6 | Customs value reasonableness | `warning` | If customs value < £100 or > £10,000,000, flag for review. |
| V7 | OP customs value check | `warning` | If DE 1/10 = 6121, customs value should represent repair cost only, not full goods value. Flag if value seems too high relative to typical repair costs. |
| V8 | Country-preference match | `warning` | Check that preference code is consistent with country of origin. E.g., preference 300 with country CN (China) is invalid — no FTA. |
| V9 | Commodity code format | `error` | Commodity code must be exactly 10 digits. |
| V10 | EORI format check | `warning` | GB EORI should match pattern GB + 12 digits. XI EORI should match XI + 12 digits. |
| V11 | Valuation indicators (Method 1) | `info` | If DE 4/16 = 1, DE 4/13 should be completed. Last digit = 1 if related party. |
| V12 | Net mass positive | `error` | Net mass must be > 0. |
| V13 | Representation consistency | `warning` | If DE 3/21 is completed, DE 3/20 (representative EORI) must also be completed. |

### Field-Level Validations

| Rule | Description |
|------|-------------|
| Required fields | EORI, commodity code, customs value, procedure code, goods description, country of origin |
| Numeric precision | All monetary values to 2 decimal places |
| Commodity code | Must be exactly 10 digits |
| EORI format | GB/XI prefix + 12 digits |
| Procedure code | Must be a valid 4-digit code from the supported list |

---

## 9. Output Structure

### Declaration Summary

After submission, the tool generates:

1. **Accepted/Rejected indicator** — Based on validation results (errors = rejected)
2. **Duty calculation** — Customs duty amount at the applicable rate
3. **Import VAT calculation** — VAT at 20% (or 0% for zero-rated goods) on customs value + duty
4. **Total taxes due** — Sum of duty + import VAT
5. **PVA indicator** — Whether import VAT is deferred to the VAT return
6. **Document checklist** — Required documents based on procedure and preference codes
7. **Validation results** — All V1–V13 results with pass/fail/warning
8. **Educational notes** — Explanations for each data element and calculation step

---

## 10. H&C Test Scenarios

### Scenario 1 — Section 2: Italian Olive Oil (Standard Import)

**Context:** 8,000 bottles of extra virgin olive oil from Puglia, Italy. Shipped FOB Bari. Invoice EUR 42,000. Customs value (from Valuation Worksheet) = ~£35,700. Commodity code 1509200090. UK-EU TCA preference applies — 0% preferential duty. Zero-rated food (VATZ).

**Key declaration fields:**
- DE 1/10: 4000 (free circulation)
- DE 1/11: 000
- DE 4/17: 300 (UK-EU TCA)
- DE 5/15: IT (Italy)
- DE 6/14: 1509200090
- DE 4/11: £35,700 (customs value from worksheet)
- DE 4/16: 1 (Method 1)
- DE 2/3: N935 (invoice), U110 (statement on origin)
- DE 3/40: H&C VAT number (PVA elected)
- Duty: £0 (0% preferential)
- Import VAT: £35,700 × 0% = £0 (zero-rated food)
- Total taxes: £0

**Key validation:** V2 passes (U110 present for 300 preference). V5 fires (PVA elected). V8 passes (IT + 300 = valid TCA claim).

---

### Scenario 2 — Section 2: Japanese Ceramic Cups (Standard Import)

**Context:** 3,000 ceramic sake cups from Takara Design Co., Kyoto, Japan. Shipped CIF Felixstowe. Invoice JPY 5,400,000. Customs value (from Valuation Worksheet, incl. £2,000 assists) = ~£25,500. Commodity code 6912001000. UK-Japan CEPA preference — 0% preferential duty. Standard-rated (20% VAT).

**Key declaration fields:**
- DE 1/10: 4000
- DE 1/11: 000
- DE 4/17: 300 (UK-Japan CEPA)
- DE 5/15: JP (Japan)
- DE 6/14: 6912001000
- DE 4/11: £25,500
- DE 4/16: 1
- DE 4/13: 0000 (unrelated parties, no conditions)
- DE 2/3: N935, U110 (statement on origin)
- DE 3/40: H&C VAT number (PVA)
- Duty: £0 (0% CEPA)
- Import VAT: £25,500 × 20% = £5,100
- Total taxes: £5,100 (deferred via PVA)

**Key validation:** V5 fires (PVA — VAT goes to Box 1 + Box 4).

---

### Scenario 3 — Section 3: Repaired Cups Re-Import (OP Relief)

**Context:** 500 defective ceramic cups returned to Takara in Kyoto for repair. Repair cost JPY 900,000 (~£5,000 GBP). Return freight £800. Return insurance £50. Re-imported under Outward Processing relief. Duty only on repair cost, not full goods value.

**Key declaration fields:**
- DE 1/10: 6121 (OP re-import)
- DE 1/11: 000
- DE 4/17: 300 (UK-Japan CEPA on repair element)
- DE 5/15: JP
- DE 6/14: 6912001000
- DE 4/11: £5,850 (repair £5,000 + freight £800 + insurance £50)
- DE 4/16: 1
- DE 2/3: N935 (repair invoice), C600 (OP authorisation), U110 (origin proof)
- DE 3/40: H&C VAT number (PVA)
- Duty: £0 (0% CEPA on repair cost)
- Import VAT: (£5,000 + outward freight + £800 + £0 duty) × 20%
- Total taxes: Import VAT only (deferred via PVA)

**Key validation:** V3 passes (C600 present). V7 fires (customs value is repair cost — confirms correct OP valuation). V5 fires (PVA).

---

## 11. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onFieldEntry` | Student enters/modifies a data element | `{ dataElement, value, timestamp }` |
| `onValidation` | Declaration is validated | `{ validationResults, passCount, failCount }` |
| `onSubmit` | Student submits declaration | `{ declarationSummary, isAccepted, attemptNumber }` |
| `onHint` | Student requests a hint | `{ dataElement, hintType }` |
| `onReset` | Student resets the form | `{ previousAttempt }` |
| `onDocumentCheck` | Student views document checklist | `{ requiredDocs }` |
| `onDutyCalculation` | Duty/VAT calculation displayed | `{ dutyAmount, vatAmount, totalTaxes }` |
| `onScenarioLoad` | H&C scenario loaded | `{ scenarioId, section }` |

---

## 12. Educational Notes

### Data Element Annotations

Each field has an inline tooltip explaining:
1. What the field means in practice
2. Where the data comes from (e.g., "From Trade Tariff Lookup" for commodity code)
3. Common errors
4. Exam tips

### Post-Submission Explanations

After submission, the tool generates a section-by-section walkthrough:
- **Procedure code**: Why this CPC was chosen and what it means
- **Preference code**: Whether a preference was claimed and what evidence is required
- **Customs value**: How the value was determined (cross-reference to Valuation Worksheet)
- **Duty calculation**: Step-by-step duty and VAT calculation with formulae
- **PVA impact**: How import VAT flows to the VAT return
- **Document checklist**: Why each document is required

---

## 13. Accessibility & UX

- Tab order follows logical declaration completion sequence: parties → goods → value → procedure → preference → documents
- Grouped fieldsets with clear section headers matching CDS groups
- Tooltips on every field header
- Validation runs on blur (per field) and on submit (full declaration)
- Colour coding: green (valid/info), amber (warning), red (error)
- Responsive layout: single-column on mobile, two-column on desktop
- Scenario loader for H&C pre-configured declarations

---

## 14. Rate Constants & Reference Data

| Constant | Value | Source |
|----------|-------|--------|
| Standard VAT rate | 20% | VATA 1994, s 2(1) |
| Zero rate | 0% | VATA 1994, s 30, Sch 8 |
| Reduced rate | 5% | VATA 1994, s 29A |
| GB EORI format | GB + 12 digits | The Customs (Import Duty) (EU Exit) Regulations 2018 |
| XI EORI format | XI + 12 digits | Windsor Framework |
| CDS replacement of CHIEF | 2023 | HMRC |
| PVA trigger | DE 3/40 (VAT number) populated | VATA 1994, s 38A |
| OP valuation basis | Repair cost + inward freight + insurance | Customs (Special Procedures) (EU Exit) Regulations 2018 |
| Procedure codes | TCTA 2018 + retained UCC | GOV.UK Appendix 1 |
| Preference codes | TCTA 2018, various FTAs | GOV.UK Appendix 12 |
