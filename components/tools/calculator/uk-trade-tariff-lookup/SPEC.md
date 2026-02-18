# UK Trade Tariff Lookup — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `uk-trade-tariff-lookup` |
| Tool Slug | `uk-trade-tariff-lookup` |
| Display Name | UK Trade Tariff Lookup |
| Component Name | `UKTradeTariffLookup` |
| Real-World Equivalent | HMRC Online Trade Tariff (trade-tariff.service.gov.uk) |
| Tool Type | `search` |
| Category | `vat` |
| Difficulty | Foundation–Intermediate |
| Sections Used | S2, S3 |
| Build Order | 2 of 5 (upstream — classification feeds into CDS declarations and customs valuation) |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'uk-trade-tariff-lookup',
  'UK Trade Tariff Lookup',
  'Look up UK commodity codes, duty rates, preferential tariffs, trade remedies, and import controls. Simulates the HMRC Online Trade Tariff with a curated dataset of ~30 commodity codes across food, beverages, ceramics, and homeware — the product lines relevant to the H&C case study.',
  'UKTradeTariffLookup',
  'vat',
  'search',
  'foundation',
  true,
  2
);
```

---

## 2. Purpose & Context

The UK Trade Tariff is the official classification tool for all goods imported into or exported from the United Kingdom. Practitioners use it to determine the correct commodity code, applicable duty rates (MFN and preferential), trade remedy duties, import controls, and VAT liability on importation.

This tool simulates the real HMRC Online Trade Tariff with a curated dataset focused on the product lines relevant to Harrington & Cole's business. Students navigate the tariff hierarchy, select commodity codes, specify countries of origin, and receive the full duty picture — exactly as they would when advising on a real import.

### Why This Tool Matters

- **Gateway skill**: Commodity classification is the first step in any import or export transaction — every customs declaration, valuation, and duty calculation depends on getting the code right
- **Legal obligation**: Misclassification can result in underpaid duty (C18 post-clearance demand), overpaid duty (wasted cash flow), wrong import controls, or HMRC penalties
- **FTA navigation**: The same goods attract very different duty rates depending on origin — students must understand how preferential rates work and what proof of origin is required
- **Trade remedies**: Anti-dumping duties can more than triple the effective rate (e.g., Chinese ceramics: 12% MFN + 36.1% anti-dumping = 48.1%) — students must check for these
- **CTA exam relevance**: Classification questions appear regularly in the AT Cross-Border paper; candidates must demonstrate they can navigate the tariff hierarchy

### Real-World Equivalent

The HMRC Online Trade Tariff at trade-tariff.service.gov.uk contains ~16,000 declarable commodity codes across 21 Sections and 99 Chapters. This tool uses a curated subset of ~30 codes relevant to H&C's product lines (olive oil, ceramics, preserves, tea, wine, gift hampers), with accurate duty rates, preferential rates for H&C's trading partners, trade remedy duties, and import controls.

---

## 3. Tariff Hierarchy

The UK tariff uses a hierarchical 10-digit code structure:

```
1 5 0 9  .  2 0  .  0 0  .  9 0
├──┘        ├──┘     ├──┘     ├──┘
Chapter     HS       CN       UK
(2-digit)   Sub      Sub      Sub
            (6-dig)  (8-dig)  (10-dig)
├────┘
Heading
(4-digit)
```

| Level | Digits | Standard | Description |
|-------|--------|----------|-------------|
| Section | — | WCO | 21 Sections (Roman I–XXI), grouping related Chapters |
| Chapter | 1–2 | WCO HS | 99 Chapters (first 6 digits identical worldwide) |
| Heading | 1–4 | WCO HS | Broad product category |
| Subheading | 1–6 | WCO HS | More specific — internationally harmonised |
| CN Subheading | 1–8 | UK (formerly EU CN) | Further subdivision for tariff/quota purposes |
| Commodity Code | 1–10 | UK-specific | Declarable code for import declarations |

**Key rules:**
- Only 10-digit codes are declarable on UK import entries (CDS)
- Export declarations use 8-digit codes
- Non-declarable codes (intermediate headings) cannot be used on declarations
- The hierarchy determines the General Interpretive Rules (GIRs) for classification

---

## 4. Input Structure

### Search Modes

The tool supports three ways to find a commodity code:

#### Mode 1: Text Search
- Free-text query (e.g., "olive oil", "ceramic cups")
- Searches across commodity descriptions in the curated dataset
- Returns matching codes ranked by relevance

#### Mode 2: Hierarchy Browse
- Start from Section (I–XXI)
- Drill into Chapter (2-digit)
- Drill into Heading (4-digit)
- Drill into Subheading (6-digit)
- Select declarable commodity code (10-digit)

#### Mode 3: Direct Code Entry
- Enter a known 2/4/6/8/10-digit code
- Tool expands to show the hierarchy and, if 10-digit, the full duty picture

### Country of Origin

After selecting a commodity code, the student specifies the country of origin from a curated list:

| Country | FTA / Preference Scheme | Preference Code |
|---------|------------------------|-----------------|
| Italy | UK-EU TCA | 300 |
| Spain | UK-EU TCA | 300 |
| France | UK-EU TCA | 300 |
| Germany | UK-EU TCA | 300 |
| Netherlands | UK-EU TCA | 300 |
| Ireland | UK-EU TCA | 300 |
| Japan | UK-Japan CEPA | 300 |
| India | DCTS Standard Preferences | 200 |
| China | No FTA (Third Country / MFN) | 100 |
| Turkey | UK-Turkey FTA | 300 |
| Australia | UK-Australia FTA | 300 |
| New Zealand | UK-New Zealand FTA | 300 |
| United States | No FTA (Third Country / MFN) | 100 |
| South Korea | UK-South Korea FTA | 300 |
| Canada | UK-Canada Continuity Agreement | 300 |
| Switzerland | UK-Switzerland Trade Agreement | 300 |
| Norway | UK-Norway/Iceland/Liechtenstein FTA | 300 |
| Nigeria | No FTA (Third Country / MFN) | 100 |
| Vietnam | UK-Vietnam FTA | 300 |
| Brazil | No FTA (Third Country / MFN) | 100 |

### Trade Date

- Defaults to today's date
- Used to check which duty rates are in effect (rate tables are dated)
- For H&C scenarios, all rates are current 2025/26 rates

---

## 5. Output Structure

### Primary Result: Duty Picture

For each commodity code + country of origin combination, the tool displays:

```typescript
{
  commodityCode: string;          // 10-digit code
  description: string;            // Full goods description
  hierarchy: HierarchyBreadcrumb; // Section → Chapter → Heading → Subheading → Code
  declarable: boolean;            // true for 10-digit codes
  thirdCountryDuty: DutyRate;     // MFN rate (always shown)
  preferentialDuty: DutyRate | null; // FTA/DCTS rate (if applicable)
  tradeRemedies: TradeRemedy[];   // Anti-dumping, countervailing, safeguard duties
  vatOnImportation: VATRate;      // Standard (20%) or zero-rated (0%)
  importControls: ImportControl[]; // Phytosanitary, organic cert, etc.
  supplementaryUnits: string | null; // e.g., "kg/raw sugar", "LTR"
  rulesOfOriginNote: string;      // Brief note on origin requirements
  effectiveDutyRate: number;      // Total duty % (MFN or pref + trade remedies)
}
```

### Hierarchy Breadcrumb

```typescript
{
  section: { number: string; title: string };    // e.g., "III", "Animal, vegetable or microbial fats..."
  chapter: { code: string; title: string };       // e.g., "15", "Fats and oils..."
  heading: { code: string; title: string };       // e.g., "1509", "Olive oil..."
  subheading: { code: string; title: string };    // e.g., "150920", "Extra virgin"
  commodityCode: { code: string; title: string }; // e.g., "1509200090", "Other (bulk)"
}
```

### Duty Rate

```typescript
{
  rateType: 'ad-valorem' | 'specific' | 'compound';
  adValoremPercent: number | null;    // e.g., 12 for 12%
  specificAmount: number | null;      // e.g., 104 (per 100kg)
  specificUnit: string | null;        // e.g., "per 100 kg"
  displayRate: string;                // Human-readable: "12.00%" or "£104.00 per 100 kg"
  preferenceScheme: string | null;    // e.g., "UK-EU TCA", "DCTS Standard"
  preferenceCode: number | null;      // e.g., 300, 200, 100
  proofOfOrigin: string | null;       // e.g., "Origin declaration on commercial document"
}
```

### Educational Annotations

Each result includes field-level educational notes:

| Field | Educational Note |
|-------|-----------------|
| Commodity Code | Explains the classification rationale — why this code and not a similar one |
| Third Country Duty | The default rate for countries with no FTA. This is the baseline. |
| Preferential Duty | The reduced rate under an FTA or preference scheme. Requires proof of origin. |
| Trade Remedies | Additional duties imposed to counter unfair trade practices. Applied on top of the MFN rate. |
| VAT on Importation | Food products are generally zero-rated; non-food is 20%. Declared using additional code VATZ. |
| Import Controls | Regulatory requirements beyond duty — phytosanitary certificates, organic certification, etc. |
| Supplementary Units | Additional measurement required on the declaration alongside net mass (kg). |
| Rules of Origin | To claim a preferential rate, goods must originate in the partner country per the FTA rules. |

---

## 6. Validation Rules

### Classification Validations

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| T1 | Declarable code check | `error` | Only 10-digit codes can be used on import declarations. If the student selects a non-declarable intermediate heading, warn that they need to drill down further. |
| T2 | Country-preference match | `warning` | If the student selects a country with no FTA (e.g., China) but expects a preferential rate, explain that only the MFN rate applies. |
| T3 | Trade remedy alert | `warning` | If the commodity + origin combination triggers anti-dumping or other trade remedy duties, flag prominently with the additional duty rate. |
| T4 | Proof of origin reminder | `info` | When a preferential rate is available, remind that proof of origin documentation is required on the import declaration. |
| T5 | VAT rate confirmation | `info` | Confirm whether the commodity is zero-rated or standard-rated for import VAT, with the relevant HMRC notice reference. |
| T6 | Import control alert | `info` | If the commodity requires phytosanitary certificates, organic certification, or other controls, list them with document codes. |
| T7 | Supplementary units reminder | `info` | If the commodity requires supplementary units, explain what must be declared and in what unit. |

---

## 7. Curated Commodity Dataset

### Coverage

The dataset covers commodity codes relevant to H&C's product lines across 5 Chapters:

| Chapter | Products | Codes |
|---------|----------|-------|
| 09 | Tea (green, black, speciality) | 4 codes |
| 15 | Olive oil (virgin, extra virgin, refined) | 4 codes |
| 20 | Preserves, jams, fruit preparations | 4 codes |
| 22 | Wine and beverages | 4 codes |
| 69 | Ceramic tableware (porcelain, stoneware) | 4 codes |

Plus additional codes for related products (gift hampers, packaging materials, etc.) — approximately 30 codes total.

### Key Commodity Codes (H&C Products)

#### Extra Virgin Olive Oil

| Code | Description | MFN Duty | EU TCA | Notes |
|------|-------------|----------|--------|-------|
| 1509200010 | Extra virgin olive oil, ≤5L containers | £104.00/100 kg | 0% | Retail packs |
| 1509200090 | Extra virgin olive oil, other (bulk) | £104.00/100 kg | 0% | H&C's import from Puglia |

#### Ceramic Cups

| Code | Description | MFN Duty | Japan CEPA | China (MFN + AD) | Notes |
|------|-------------|----------|------------|-------------------|-------|
| 6911100090 | Porcelain/china tableware, other | 12.00% | 0% | 48.10% | H&C's sake cups from Takara |

#### Preserves

| Code | Description | MFN Duty | EU TCA | Notes |
|------|-------------|----------|--------|-------|
| 2007993325 | Strawberry jam, <70% sugar | 20% + £19/100 kg | 0% | H&C's artisan preserves |

#### Tea

| Code | Description | MFN Duty | DCTS (India) | Notes |
|------|-------------|----------|--------------|-------|
| 0902300000 | Black tea, ≤3 kg packs | 0% | 0% | H&C's specialty tea |

---

## 8. H&C Test Scenarios

### Scenario 1 — Section 2: Classify Olive Oil

**Context:** H&C receives 8,000 bottles of extra virgin olive oil from Puglia, Italy. The student must classify the product and determine the applicable duty rate.

**Expected lookup:**
- Search: "olive oil" or browse Section III → Chapter 15 → Heading 1509 → 150920
- Commodity code: **1509200090** (extra virgin, bulk/containers >5L)
- Country: Italy
- Third Country Duty: £104.00 per 100 kg (specific duty)
- Preferential rate: **0%** under UK-EU TCA (preference code 300)
- Proof of origin: Origin declaration on commercial document by Italian exporter
- VAT: **0%** (zero-rated food — additional code VATZ)
- Import controls: Organic certification if marketed as organic; no routine phytosanitary cert
- Supplementary units: None

**Key learning points:**
- Olive oil has a specific duty (per 100 kg), not ad valorem (percentage) — this is unusual and worth noting
- The UK-EU TCA eliminates the duty entirely — demonstrating the value of FTAs
- Olive oil is zero-rated for VAT as a food product (despite standard rate being the default for imports)

---

### Scenario 2 — Section 2: Classify Ceramic Cups

**Context:** H&C receives 3,000 ceramic sake cups from Takara Design Co., Kyoto, Japan. The student must classify and check duty rates.

**Expected lookup:**
- Search: "ceramic cups" or browse Section XIII → Chapter 69 → Heading 6911
- Commodity code: **6911100090** (porcelain/china tableware, other)
- Country: Japan
- Third Country Duty: **12.00%** (ad valorem)
- Preferential rate: **0%** under UK-Japan CEPA (preference code 300)
- Proof of origin: Statement of origin on commercial documentation
- VAT: **20%** (standard-rated — ceramics are not food)
- Trade remedies: Anti-dumping duty applies to CHINESE origin only (not Japan). Alert shown if student checks China.
- Import controls: None for ceramics
- Supplementary units: None

**Key learning points:**
- Same heading (6911), very different duty treatment depending on origin
- Japan CEPA gives 0% — but if Takara moved production to China, duty would be 48.1%
- The anti-dumping duty on Chinese ceramics (36.1% residual) is a real trade remedy — educates on TRA measures

---

### Scenario 3 — Section 2: Contrast China vs Japan Origin

**Context:** The student should look up the same ceramic cup code (6911100090) for China origin to see the dramatic difference.

**Expected lookup:**
- Commodity code: **6911100090**
- Country: China
- Third Country Duty: **12.00%**
- Anti-dumping duty: **36.10%** (residual rate, Trade Remedies Notice 2025/21)
- Effective total duty: **48.10%**
- No preferential rate available (no UK-China FTA)
- VAT: **20%**

**Key learning point:** Anti-dumping duties can more than triple the effective rate. Classification and origin determination are critical.

---

### Scenario 4 — Section 3: Classify Preserves + Check Export Controls

**Context:** H&C exports artisan preserves to a New York distributor. The student must classify the preserves and check for export controls.

**Expected lookup:**
- Search: "preserves" or "jam" → Chapter 20 → Heading 2007 → 200799
- Commodity code: **2007993325** (strawberry jam, <70% sugar)
- Direction: Export (no duty on exports — classification still needed for statistical purposes)
- VAT: Zero-rated export (proof of export required)
- Export controls: No specific export controls for food preserves to the US
- Supplementary units: kg/raw sugar (for import — but student should note this for awareness)

**Key learning points:**
- Classification is needed for exports too (8-digit code for export declarations)
- Preserves have a compound duty (ad valorem + specific) — relevant if they were importing, not exporting
- No export licence required for standard food products to the US

---

### Scenario 5 — Section 3: Classify Specialty Tea

**Context:** H&C receives specialty tea from India. Student classifies the tea.

**Expected lookup:**
- Search: "tea" → Chapter 09 → Heading 0902
- Commodity code: **0902300000** (black tea, ≤3 kg packs)
- Country: India
- Third Country Duty: **0%** (already duty-free at MFN)
- DCTS Standard Preferences: **0%** (no additional benefit since MFN is already 0%)
- VAT: **0%** (zero-rated food)
- Import controls: Organic cert if applicable; no routine phytosanitary cert for Indian tea

**Key learning points:**
- Some commodities are already MFN duty-free — the FTA/DCTS makes no difference to the duty rate
- The DCTS still matters as a framework — for other products from India, it provides significant reductions
- Tea is zero-rated for import VAT as a food product

---

## 9. Tracking Callbacks

The tool fires these callbacks to the MojiTax platform for progress tracking and analytics:

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onSearch` | Student performs a text search | `{ query, resultsCount, timestamp }` |
| `onBrowse` | Student navigates the hierarchy | `{ level, code, timestamp }` |
| `onCodeSelect` | Student selects a commodity code | `{ commodityCode, description, timestamp }` |
| `onCountrySelect` | Student selects a country of origin | `{ countryCode, countryName, hasPreference, timestamp }` |
| `onResultView` | Student views the full duty picture | `{ commodityCode, country, effectiveDuty, vatRate, timestamp }` |
| `onHint` | Student requests a hint | `{ commodityCode, hintType, timestamp }` |
| `onCompare` | Student compares two countries for same code | `{ commodityCode, countries, timestamp }` |
| `onReset` | Student clears and starts a new search | `{ previousCode, timestamp }` |

---

## 10. Trade Remedy Reference

### Anti-Dumping Duties — Chinese Ceramic Tableware

| Field | Value |
|-------|-------|
| Measure | Anti-dumping duty |
| Product | Ceramic tableware and kitchenware |
| Origin | People's Republic of China |
| Legal basis | Trade Remedies Notice 2025/21 |
| Expiry | 16 July 2029 |
| Affected codes | 6911100090, 6912002191, 6912002111, 6912002310, 6912002510, 6912002910 |

| Exporter Category | Anti-Dumping Rate |
|-------------------|-------------------|
| Named companies (5 entities) | 13.1% to 18.3% |
| Annex 2 exporters (8 companies) | 17.6% |
| Annex 3 exporters (392 companies) | 17.9% |
| All other exporters (residual) | **36.10%** |

**Educational note:** The residual rate (36.10%) applies to any Chinese exporter not specifically listed. This is on top of the 12% MFN rate, giving a total effective rate of 48.10%. This is why origin determination matters — the same cup from Japan would attract 0% duty under CEPA.

---

## 11. FTA / Preference Scheme Reference

| Scheme | Legal Basis | Preference Code | Proof of Origin |
|--------|-------------|-----------------|-----------------|
| UK-EU TCA | Trade and Cooperation Agreement 2020 | 300 | Origin declaration on commercial document by EU exporter |
| UK-Japan CEPA | UK-Japan CEPA (S.I. 2020/1457) | 300 | Statement of origin on commercial documentation |
| DCTS Standard | Developing Countries Trading Scheme 2023 | 200 | GSP Form A or origin declaration |
| UK-Turkey FTA | UK-Turkey FTA 2020 | 300 | EUR.1 movement certificate or origin declaration |
| UK-Australia FTA | UK-Australia FTA 2023 | 300 | Origin declaration |
| MFN (no FTA) | UK Global Tariff (S.I. 2020/1430) | 100 | Not applicable |

---

## 12. VAT on Importation Reference

| Product Type | VAT Rate | Legal Basis | Additional Code |
|--------------|----------|-------------|-----------------|
| Food for human consumption (most) | 0% | VATA 1994, s 30, Sch 8, Group 1 | VATZ |
| Beverages (tea, coffee, cocoa) | 0% | VATA 1994, Sch 8, Group 1, Item 4 | VATZ |
| Alcoholic beverages | 20% | Standard-rated (not in Sch 8) | — |
| Ceramic tableware | 20% | Standard-rated (not food) | — |
| Wine | 20% | Standard-rated (alcoholic) | — |

**Educational note:** The zero-rating for food at import mirrors the domestic zero-rating. To claim it, the importer must declare additional code VATZ on the CDS entry. Forgetting this results in 20% VAT being charged at the border (recoverable but creates cash flow issues).

---

## 13. Accessibility & UX

- Three search modes accessible via tabs: Search, Browse, Direct Entry
- Hierarchy breadcrumb always visible showing current position in the tariff
- Country selector with search-as-you-type filtering
- Duty results displayed in a structured card layout:
  - Top: Commodity code + description + declarable indicator
  - Middle: Duty rates panel (MFN, preferential, trade remedies)
  - Bottom: Import controls, VAT, supplementary units, rules of origin
- Compare mode: side-by-side view for two countries on the same code
- Colour coding: green (preferential rate available), amber (MFN rate), red (trade remedies apply)
- Responsive layout: single-column on mobile, two-panel on desktop (hierarchy left, results right)
- Educational tooltips on each result field (expandable)
- All rates display with legislative reference links

---

## 14. Sections of the UK Tariff (Reference)

| Section | Title | Chapters |
|---------|-------|----------|
| I | Live animals; animal products | 01–05 |
| II | Vegetable products | 06–14 |
| III | Animal, vegetable or microbial fats and oils | 15 |
| IV | Prepared foodstuffs; beverages, spirits and vinegar; tobacco | 16–24 |
| V | Mineral products | 25–27 |
| VI | Products of the chemical or allied industries | 28–38 |
| VII | Plastics and articles thereof; rubber and articles thereof | 39–40 |
| VIII | Raw hides and skins, leather, furskins | 41–43 |
| IX | Wood and articles of wood; cork; straw; basketware | 44–46 |
| X | Pulp of wood; paper and paperboard | 47–49 |
| XI | Textiles and textile articles | 50–63 |
| XII | Footwear, headgear, umbrellas | 64–67 |
| XIII | Articles of stone, cement, ceramics; glass and glassware | 68–70 |
| XIV | Pearls, precious stones, precious metals; imitation jewellery | 71 |
| XV | Base metals and articles of base metal | 72–83 |
| XVI | Machinery and mechanical appliances; electrical equipment | 84–85 |
| XVII | Vehicles, aircraft, vessels | 86–89 |
| XVIII | Optical, photographic, measuring, medical instruments; clocks; musical instruments | 90–92 |
| XIX | Arms and ammunition | 93 |
| XX | Miscellaneous manufactured articles | 94–96 |
| XXI | Works of art, collectors' pieces and antiques | 97–99 |
