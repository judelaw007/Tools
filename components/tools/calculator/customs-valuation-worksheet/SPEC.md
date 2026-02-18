# Customs Valuation Worksheet — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `customs-valuation-worksheet` |
| Tool Slug | `customs-valuation-worksheet` |
| Display Name | Customs Valuation Worksheet |
| Component Name | `CustomsValuationWorksheet` |
| Real-World Equivalent | Practitioner working paper — standard document for computing customs value under Method 1 before CDS entry (TCTA 2018 / retained UCC) |
| Tool Type | `calculator` |
| Category | `vat` |
| Difficulty | Intermediate |
| Sections Used | S2 |
| Build Order | 3 of 5 (upstream — customs value feeds into CDS import declarations) |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'customs-valuation-worksheet',
  'Customs Valuation Worksheet',
  'Calculate the customs value of imported goods under valuation Method 1 (transaction value). Handles currency conversion, Incoterms adjustments (FOB, CIF, EXW, etc.), additions (assists, royalties, commissions, packing), deductions (post-import transport, installation), and related party analysis. Produces an itemised build-up with educational annotations.',
  'CustomsValuationWorksheet',
  'vat',
  'calculator',
  'intermediate',
  true,
  3
);
```

---

## 2. Purpose & Context

This tool is a practitioner working paper — not an HMRC form. Every customs adviser produces one before completing a CDS import declaration. It documents how the customs value was derived, providing an audit trail for HMRC review.

The customs value is the base on which customs duty and import VAT are calculated. Getting it wrong means incorrect duty and VAT, which triggers HMRC assessments (C18 post-clearance demands) and potential penalties.

### Legal Framework

- **Taxation (Cross-border Trade) Act 2018 (TCTA)**, ss 15–21 — UK customs valuation rules
- **Retained Union Customs Code (UCC)**, Arts 70–74 — valuation methods 1–6
- **UK Trade Tariff: Valuation of imported goods (Notice 252)** — HMRC guidance

### Valuation Methods

| Method | Name | Basis | When Used |
|--------|------|-------|-----------|
| 1 | Transaction value | Price actually paid or payable | Default — used in ~90% of declarations |
| 2 | Transaction value of identical goods | Same goods, same country, same time | When Method 1 fails |
| 3 | Transaction value of similar goods | Similar goods, same country, same time | When Method 2 fails |
| 4 | Deductive method | UK resale price minus deductions | When Methods 2–3 fail |
| 5 | Computed method | Cost of production + profit margin | Rarely used (requires foreign records) |
| 6 | Fall-back method | Flexible application of Methods 1–5 | Last resort |

This tool implements **Method 1** in full detail — the method used for the vast majority of declarations and the one CTA candidates must master. Methods 2–6 are referenced for educational context but not calculated.

### Why This Tool Matters

- **Upstream dependency**: The customs value calculated here feeds directly into the CDS Import Declaration (Tool 4) and determines the duty/VAT amounts
- **Incoterms understanding**: Students must know which costs are included in each Incoterm and what adjustments are needed
- **Additions & adjustments**: Assists, royalties, and commissions are commonly missed — each has specific rules
- **Currency conversion**: HMRC publishes monthly exchange rates; using the wrong rate is a common error
- **Related party risk**: Transactions between related parties require additional scrutiny under Method 1

---

## 3. Input Structure

### Core Transaction Inputs

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 1 | Invoice price | `number` | Yes | Price actually paid or payable for the goods |
| 2 | Invoice currency | `CurrencyCode` | Yes | Three-letter ISO currency code (EUR, JPY, USD, GBP, etc.) |
| 3 | HMRC exchange rate | `number` | Yes if currency ≠ GBP | HMRC-published rate for the month of import |
| 4 | Incoterms code | `IncotermsCode` | Yes | Delivery term (EXW, FOB, CIF, DDP, etc.) |
| 5 | Port of importation | `string` | Yes | UK port where goods arrive (e.g., Felixstowe, Dover) |

### Transport & Insurance

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 6 | Freight to UK port | `number` | Conditional | Cost of transporting goods to the UK port. Required for EXW, FCA, FOB, FAS. Not required for CIF, CIP, DAP, DDP (already included). |
| 7 | Insurance to UK port | `number` | Conditional | Cost of insuring goods during transit to UK port. Same conditionality as freight. |

### Additions (TCTA 2018, s 16)

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 8 | Selling commissions | `number` | No | Commissions paid by the buyer to the seller's agent |
| 9 | Royalties / licence fees | `number` | No | Payments for the right to use IP, trademarks, patents as a condition of sale |
| 10 | Assists | `number` | No | Value of materials, tools, moulds, dies, or engineering provided free or at reduced cost by the buyer to the seller |
| 11 | Packing costs | `number` | No | Cost of containers and packing (if not already in invoice price) |

### Deductions (TCTA 2018, s 17)

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 12 | Post-import transport | `number` | No | Cost of transporting goods after arrival at UK port (deductible if separately identified) |
| 13 | Installation / assembly | `number` | No | Cost of installation, assembly, or technical assistance after importation |

### Method 1 Conditions

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 14 | Related party indicator | `boolean` | Yes | Are the buyer and seller related? (per TCTA 2018, s 19) |
| 15 | Arm's length confirmation | `boolean` | If related | If related, has the transaction value been accepted as arm's length? |
| 16 | Valuation method | `ValuationMethod` | Yes | Method 1–6 (default: 1) |

### Duty & VAT Context

| # | Field | Type | Required | Description |
|---|-------|------|----------|-------------|
| 17 | Commodity code | `string` | No | 10-digit code (for educational cross-reference) |
| 18 | Duty rate (%) | `number` | No | Applicable duty rate (from Trade Tariff Lookup) |
| 19 | VAT rate (%) | `number` | Yes | Import VAT rate (20% standard or 0% for zero-rated goods) |

---

## 4. Calculation Logic

### Step 1: Currency Conversion

```
invoicePriceGBP = invoicePrice / hmrcExchangeRate  (if currency ≠ GBP)
invoicePriceGBP = invoicePrice                      (if currency = GBP)
```

HMRC publishes monthly exchange rates. The rate applicable is the one in force on the date of acceptance of the import declaration. Rates are expressed as foreign currency per £1 GBP — so divide, do not multiply.

### Step 2: Incoterms Adjustment

The customs value must include the cost of transport and insurance to the UK port of importation. Different Incoterms include different elements:

| Incoterm | Transport to UK | Insurance to UK | Adjustment Needed |
|----------|----------------|-----------------|-------------------|
| EXW | Not included | Not included | Add freight + insurance |
| FCA | To carrier only | Not included | Add freight to UK port + insurance |
| FAS | To ship's side | Not included | Add freight from port + insurance |
| FOB | Loaded on vessel | Not included | Add freight + insurance |
| CFR | To UK port | Not included | Add insurance only |
| CIF | To UK port | To UK port | None — already included |
| CIP | To destination | To destination | None (may need to deduct onward transport if CIP to inland point) |
| DAP | To named place | Typically included | None (may need to deduct inland transport) |
| DDP | To destination | Typically included | Deduct import duty if included in price |

### Step 3: Additions

```
additions = sellingCommissions + royalties + assists + packingCosts
```

Each addition has specific rules:
- **Selling commissions**: Only commissions paid by the buyer to the seller's agent. Buying commissions (buyer's own agent) are NOT added.
- **Royalties**: Only if payment is a condition of sale and relates to the imported goods.
- **Assists**: Must be apportioned if the assist benefits multiple shipments. Value is cost to the buyer.
- **Packing**: Only if not already reflected in the invoice price.

### Step 4: Deductions

```
deductions = postImportTransport + installationAssembly
```

These costs are deductible only if they are:
1. Separately identified in the transaction documents
2. Incurred after importation into the UK

### Step 5: Customs Value

```
customsValue = invoicePriceGBP + incotermsAdjustment + additions − deductions
```

### Step 6: Duty Calculation

```
dutyAmount = customsValue × (dutyRate / 100)
```

### Step 7: VAT Value on Importation

```
vatValue = customsValue + dutyAmount
importVAT = vatValue × (vatRate / 100)
```

The VAT value includes customs value plus duty. This is a key point — VAT is charged on the duty-inclusive value.

---

## 5. Validation Rules

### Cross-Field Validations

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | FOB freight check | `warning` | If Incoterm is EXW/FCA/FAS/FOB and freight is zero or missing, warn that freight to UK port should be added. |
| V2 | CIF double-count check | `warning` | If Incoterm is CIF/CIP/DAP/DDP and freight or insurance is entered, warn of potential double-counting — these costs are already in the invoice price. |
| V3 | Related party Method 1 check | `warning` | If related party = true and arm's length not confirmed, warn that Method 1 may not be applicable. |
| V4 | Currency conversion check | `info` | If currency ≠ GBP, confirm HMRC rate is being used (not bank rate or spot rate). |
| V5 | Assists apportionment check | `info` | If assists > 0, remind that the value must be apportioned if the assists benefit multiple shipments. |
| V6 | Method 1 conditions met | `error` | If related party = true and arm's length = false, Method 1 cannot be used. Flag error. |
| V7 | Negative customs value | `error` | Customs value must be positive. If deductions exceed the adjusted invoice price, flag error. |
| V8 | Zero invoice price | `error` | Invoice price must be greater than zero (unless Method 1 is genuinely free-of-charge — rare). |
| V9 | DDP duty deduction | `info` | If Incoterm is DDP, remind that any import duty included in the price should be deducted to avoid double-counting duty. |
| V10 | Insurance estimation | `info` | If Incoterm requires insurance to be added but insurance is zero, inform that HMRC may impute a notional insurance charge (typically 1% of CIF value). |

### Field-Level Validations

| Rule | Description |
|------|-------------|
| Non-negative amounts | Invoice price, freight, insurance, additions must be ≥ 0 |
| Exchange rate range | HMRC rates are typically 1.0–200.0. Flag outliers. |
| Currency required | If invoice price > 0 and currency ≠ GBP, exchange rate must be provided |
| Method validation | If method ≠ 1, tool shows informational note (Methods 2–6 not calculated) |

---

## 6. Output Structure

### Completed Worksheet

```typescript
{
  // Currency conversion
  invoicePriceOriginal: number;
  invoiceCurrency: string;
  exchangeRate: number;
  invoicePriceGBP: number;

  // Incoterms adjustment
  incotermsCode: string;
  freightAdjustment: number;
  insuranceAdjustment: number;
  incotermsAdjustmentTotal: number;

  // Additions
  additions: {
    sellingCommissions: number;
    royalties: number;
    assists: number;
    packingCosts: number;
    total: number;
  };

  // Deductions
  deductions: {
    postImportTransport: number;
    installationAssembly: number;
    total: number;
  };

  // Customs value
  customsValue: number;

  // Duty
  dutyRate: number;
  dutyAmount: number;

  // VAT
  vatValue: number;
  vatRate: number;
  importVAT: number;

  // Total landed cost
  totalDutyAndVAT: number;

  // Method 1 conditions
  method1Applicable: boolean;
  relatedParty: boolean;

  // Validation
  validationResults: ValidationResult[];

  // Itemised build-up (for display)
  buildUpLines: BuildUpLine[];
}
```

### Build-Up Line

```typescript
{
  label: string;           // e.g., "Invoice price (EUR 42,000 ÷ 1.1765)"
  amount: number;          // GBP value
  type: 'base' | 'add' | 'deduct' | 'subtotal' | 'total';
  educationalNote: string; // Why this line matters
}
```

---

## 7. Educational Notes

### Line-by-Line Explanations

Each line in the build-up includes an educational note:

| Line | Note |
|------|------|
| Invoice price (GBP) | "The starting point for Method 1. This is the price actually paid or payable — not the market value or theoretical value." |
| Currency conversion | "HMRC publishes monthly exchange rates. Always use the HMRC rate, not a bank or spot rate. The rate is foreign currency per £1, so divide the foreign amount by the rate." |
| Freight to UK port | "Transport costs to the UK port of importation must be included in the customs value. For FOB terms, the seller delivers to the ship — the buyer pays onward freight." |
| Insurance to UK port | "Insurance during transit must be included. If no insurance was actually taken out, HMRC may impute a notional charge (typically 1% of CIF value)." |
| Selling commissions | "Only commissions paid by the buyer to the seller's agent are added. Buying commissions (paid to the buyer's own agent) are NOT added — this distinction is frequently tested." |
| Royalties / licence fees | "Royalties are added only if: (1) they relate to the imported goods, AND (2) payment is a condition of the sale. If the royalty is for a different right or is payable regardless of the import, it is not added." |
| Assists | "Free-of-charge materials, moulds, tools, or engineering provided by the buyer to the seller. Must be valued at cost to the buyer. If the assist benefits multiple shipments, its value must be apportioned." |
| Packing costs | "Containers, wrapping, and labour for packing. Only add if not already reflected in the invoice price." |
| Post-import transport | "Transport costs after the goods arrive at the UK port are deductible — but only if separately identified in the contract/invoice." |
| Installation / assembly | "Post-import installation, assembly, or technical assistance is deductible if separately identified and incurred after importation." |
| Customs value | "This is the value declared on the CDS import declaration (Data Element 4/14). Duty and VAT are calculated on this amount." |
| Duty amount | "Customs value × duty rate. The duty rate comes from the UK Trade Tariff for the relevant commodity code and country of origin." |
| VAT value | "Import VAT is charged on the customs value PLUS the duty amount. This is a key difference from domestic VAT where the tax is on the net sale price." |
| Import VAT | "The VAT payable on importation. If using PVA, this is self-assessed in Box 1 and recovered in Box 4 of the VAT return." |

### Contextual Tips

Displayed inline as the student completes fields:
- **Incoterms**: "FOB = Free on Board. The seller delivers goods loaded on the vessel. You must add freight and insurance from the port of loading to the UK port."
- **Assists**: "Common example: H&C provided free moulds worth £2,000 to Takara for the ceramic cups. This must be added to the customs value."
- **Related party**: "Related parties include parent/subsidiary, partners, employer/employee, and anyone who directly or indirectly controls 5%+ of voting power."

---

## 8. H&C Test Scenarios

### Scenario 1 — Olive Oil (FOB, EUR, Italy)

**Context:** H&C imports 8,000 bottles of extra virgin olive oil from Puglia, Italy. Shipped FOB Bari, invoice EUR 42,000.

**Expected inputs:**
- Invoice price: 42,000
- Currency: EUR
- Exchange rate: 1.1765 (HMRC rate, illustrative)
- Incoterms: FOB
- Port: Felixstowe
- Freight to UK port: £2,000
- Insurance to UK port: £200
- Assists: £0
- Related party: No
- Duty rate: 0% (Italy, UK-EU TCA)
- VAT rate: 0% (olive oil = zero-rated food, VATA Sch 8 Group 1)

**Expected outputs:**
- Invoice price GBP: £35,697.41 (42,000 / 1.1765)
- Freight adjustment: £2,000.00
- Insurance adjustment: £200.00
- Total additions: £0.00
- Customs value: £37,897.41
- Duty: £0.00 (0%)
- VAT value: £37,897.41
- Import VAT: £0.00 (zero-rated food)
- Total landed cost (duty + VAT): £0.00

**Key validations:** V1 should pass (FOB has freight), V4 should trigger (currency conversion info).

---

### Scenario 2 — Ceramic Cups (CIF, JPY, Japan + Assists)

**Context:** H&C imports 3,000 ceramic sake cups from Takara Design Co., Kyoto. Shipped CIF Felixstowe, invoice JPY 5,400,000. H&C provided free moulds (assists) worth £2,000.

**Expected inputs:**
- Invoice price: 5,400,000
- Currency: JPY
- Exchange rate: 191.42 (HMRC rate, illustrative)
- Incoterms: CIF
- Port: Felixstowe
- Freight to UK port: £0 (included in CIF)
- Insurance to UK port: £0 (included in CIF)
- Assists: £2,000
- Related party: No
- Duty rate: 0% (Japan, UK-Japan CEPA preferential for ceramics)
- VAT rate: 20% (standard-rated homeware)

**Expected outputs:**
- Invoice price GBP: £28,213.63 (5,400,000 / 191.42)
- Freight adjustment: £0.00 (CIF — already included)
- Insurance adjustment: £0.00 (CIF — already included)
- Assists: £2,000.00
- Total additions: £2,000.00
- Customs value: £30,213.63
- Duty: £0.00 (0% CEPA preferential)
- VAT value: £30,213.63
- Import VAT: £6,042.73 (20%)
- Total landed cost (duty + VAT): £6,042.73

**Key validations:** V2 should not trigger (freight/insurance are zero for CIF), V5 should trigger (assists reminder).

---

## 9. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onFieldEntry` | Student enters/modifies any input field | `{ field, value, timestamp }` |
| `onValidation` | Worksheet is validated (calculate or re-check) | `{ validationResults, passCount, failCount }` |
| `onCalculate` | Student calculates the customs value | `{ customsValue, dutyAmount, importVAT, attemptNumber }` |
| `onHint` | Student requests a hint | `{ field, hintType }` |
| `onReset` | Student resets the form | `{ previousAttempt }` |
| `onBuildUpView` | Student views the itemised build-up | `{ timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section }` |

---

## 10. Incoterms Reference

### The 11 Incoterms 2020 Rules

| Code | Full Name | Group | Freight to UK | Insurance to UK | Adjustment |
|------|-----------|-------|---------------|-----------------|------------|
| EXW | Ex Works | E | Add | Add | +freight +insurance |
| FCA | Free Carrier | F | Add (to UK port) | Add | +freight +insurance |
| FAS | Free Alongside Ship | F | Add (from port) | Add | +freight +insurance |
| FOB | Free on Board | F | Add | Add | +freight +insurance |
| CFR | Cost and Freight | C | Included | Add | +insurance |
| CIF | Cost, Insurance & Freight | C | Included | Included | None |
| CIP | Carriage & Insurance Paid To | C | Included | Included | None (deduct onward if beyond port) |
| CPT | Carriage Paid To | C | Included | Add | +insurance |
| DAP | Delivered at Place | D | Included | Included | Deduct post-port transport if included |
| DPU | Delivered at Place Unloaded | D | Included | Included | Deduct post-port transport + unloading |
| DDP | Delivered Duty Paid | D | Included | Included | Deduct duty if in price |

---

## 11. HMRC Exchange Rates

HMRC publishes monthly exchange rates for customs valuation purposes. Key rates used in H&C scenarios:

| Currency | Code | Rate (per £1 GBP) | Source |
|----------|------|-------------------|--------|
| Euro | EUR | ~1.17 | HMRC monthly rates |
| Japanese Yen | JPY | ~191.00 | HMRC monthly rates |
| US Dollar | USD | ~1.27 | HMRC monthly rates |
| Chinese Yuan | CNY | ~9.15 | HMRC monthly rates |
| Indian Rupee | INR | ~106.00 | HMRC monthly rates |

Note: Actual rates are published monthly and vary. The tool uses illustrative rates for the H&C scenarios. In practice, the student enters the applicable rate for the month of importation.

---

## 12. Accessibility & UX

- Tab order follows the natural calculation flow: invoice price → currency → exchange rate → Incoterms → freight → insurance → additions → deductions → related party → calculate
- Each field has an expandable educational tooltip (toggle with `showTooltips` prop)
- The itemised build-up shows the calculation step by step after submission
- Colour coding: green (within expected range), amber (warning — possible error), red (error — calculation blocked)
- Responsive layout: single-column on mobile, two-column on desktop (inputs left, build-up right)
- Live calculation updates as fields change (no separate "submit" required — but formal "Calculate" button triggers validation)
- Incoterms dropdown includes a brief description of each term

---

## 13. Rate Constants

| Rate / Constant | Value | Source |
|-----------------|-------|--------|
| Standard VAT rate | 20% | VATA 1994, s 2(1) |
| Zero VAT rate | 0% | VATA 1994, s 30, Sch 8 |
| Notional insurance (HMRC imputation) | 1% of CIF value | HMRC practice |
| Method 1 related party threshold | 5% voting power | TCTA 2018, s 19 |
| Valuation methods available | 1–6 | TCTA 2018, ss 15–21 |
