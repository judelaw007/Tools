# Capital Allowances Computation — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `capital-allowances` |
| Tool Slug | `capital-allowances` |
| Display Name | Capital Allowances Computation |
| Component Name | `CapitalAllowances` |
| Real-World Equivalent | CT600 capital allowances supplementary pages; HMRC Helpsheet HS252; standard CA working paper |
| Tool Type | `calculator` |
| Category | `corporation-tax` |
| Difficulty | Core |
| Sections Used | S3 (primary) |
| Build Order | 3 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'capital-allowances',
  'Capital Allowances Computation',
  'Multi-pool capital allowances computation tracking main pool, special rate pool, and single asset pools. Handles AIA allocation decisions, full expensing eligibility, zero-emission car FYA, CO2-based car pool allocation, balancing adjustments on disposal, and short-period apportionment. Produces exam-format CA computation layout.',
  'CapitalAllowances',
  'corporation-tax',
  'calculator',
  'core',
  true,
  3
);
```

---

## 2. Purpose & Context

Capital allowances replace depreciation for tax purposes. Businesses cannot deduct depreciation from taxable profits — instead, they claim capital allowances on qualifying expenditure. The capital allowances computation is one of the most tested topics in the CTA OMB paper, requiring multi-pool management, strategic AIA allocation, and understanding of first year allowances.

### Why This Tool Matters for OMB Students

- **Tested in virtually every sitting:** CA computations appear in most OMB exam papers, often as a component of a larger CT or profit extraction question.
- **Strategic decisions:** AIA allocation is not mechanical — the student must decide which assets to direct AIA toward (prioritising assets that don't qualify for full expensing).
- **Multiple relief types:** Full expensing (100% for new main-rate P&M), zero-emission car FYA (100%), 50% special rate FYA, AIA, and WDA — the student must know which applies to which asset.
- **CO2-based car allocation:** Cars are allocated to different pools based on CO2 emissions — 0 g/km gets 100% FYA, 1-50 g/km goes to main pool, 51+ g/km goes to special rate pool.
- **Company vs sole trader:** Full expensing is only available to companies. Private use adjustments apply differently (companies: no CA restriction, BIK route instead; sole traders: CA restricted by business-use proportion).
- **Short-period apportionment:** AIA and WDA are apportioned for short accounting periods; FYAs are not.

### Key Legislation

- Capital Allowances Act 2001 (CAA 2001) — primary legislation for all capital allowances
- s.11 CAA 2001 — general conditions for plant and machinery allowances
- s.38A CAA 2001 — full expensing (100% first year allowance for qualifying expenditure)
- s.39 CAA 2001 — first year allowances for zero-emission cars
- s.51A CAA 2001 — annual investment allowance
- s.56 CAA 2001 — writing-down allowances (18% main rate)
- s.56(3) CAA 2001 — special rate writing-down allowance (6%)
- s.104A CAA 2001 — integral features definition
- Schedule 1 CAA 2001 — list of integral features

---

## 3. Input Definitions

### 3.1 Accounting Period

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `periodStart` | `date` | Required. Must be a valid date. | The first day of the accounting period. For ongoing businesses, this is the day after the previous period ended. |
| `periodEnd` | `date` | Required. Must be after periodStart. Period cannot exceed 18 months. | The last day of the accounting period. Used to determine if short-period apportionment is needed (< 365 days). |
| `entityType` | `select` | `company` / `sole-trader-partnership` | Companies can claim full expensing. Sole traders/partnerships cannot. Private use adjustments also differ: companies claim full CA (private use taxed via BIK); sole traders restrict the allowance by business-use proportion. |

### 3.2 Pool Brought Forward

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `mainPoolBF` | `number` | >= 0. Defaults to 0. | The balance of the main pool (18% WDA) carried forward from the previous accounting period. |
| `specialRatePoolBF` | `number` | >= 0. Defaults to 0. | The balance of the special rate pool (6% WDA) carried forward from the previous period. Includes integral features, long-life assets, thermal insulation, and cars with CO2 > 50 g/km. |

### 3.3 Asset Additions (Dynamic List)

Each addition has:

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `description` | `text` | Required. | Describe the asset (e.g., "Mazak Integrex i-300S CNC machine"). |
| `cost` | `number` | > 0. Required. | The capital cost excluding recoverable VAT. For cars where input VAT is not recoverable (common for cars with private use), use the VAT-inclusive cost. |
| `category` | `select` | `general-plant` / `car` / `integral-feature` / `thermal-insulation` / `long-life` | Asset category determines pool allocation and relief eligibility. General plant goes to main pool. Integral features, thermal insulation, and long-life assets go to special rate pool. Cars are allocated by CO2 emissions. |
| `isNew` | `boolean` | Defaults to true. | Is the asset new and unused? Full expensing (100% FYA) is only available for new, unused assets. Second-hand assets can claim AIA or WDA but not full expensing. |
| `co2Emissions` | `number` | Required if category = `car`. >= 0. | CO2 emissions in g/km. Determines pool allocation: 0 g/km = 100% FYA; 1-50 g/km = main pool; 51+ g/km = special rate pool. |
| `privateUsePercent` | `number` | 0-100. Defaults to 0. | Percentage of private (non-business) use. For companies: informational only (no CA restriction — private use taxed via BIK). For sole traders/partnerships: restricts the allowance to the business-use proportion. |
| `reliefElection` | `select` | `auto` / `full-expensing` / `aia` / `wda-only` | Which relief to claim. `auto` selects the best available relief. Full expensing: 100% FYA (company, new main-rate P&M, not cars). AIA: 100% relief up to limit. WDA only: asset enters pool for WDA. |

### 3.4 Asset Disposals (Dynamic List)

Each disposal has:

| Field | Type | Validation | Educational Note |
|-------|------|------------|-----------------|
| `description` | `text` | Required. | Describe the disposed asset. |
| `proceeds` | `number` | >= 0. Required. | Sale proceeds or market value. If scrapped for nil, enter 0. Proceeds are deducted from the relevant pool. If proceeds exceed the pool balance, a balancing charge arises. |
| `pool` | `select` | `main` / `special-rate` | Which pool the disposed asset was in. Disposals reduce the pool balance. |

---

## 4. Output Definitions

### 4.1 Relief Summary

| Output | Description |
|--------|-------------|
| `fullExpensingTotal` | Total full expensing (100% FYA) claimed on qualifying new main-rate P&M |
| `zeroEmissionFYATotal` | Total FYA claimed on zero-emission cars (100%) |
| `specialRateFYATotal` | Total 50% FYA claimed on special rate assets (if elected) |
| `aiaTotal` | Total AIA claimed (capped at available limit) |
| `aiaRemaining` | Unused AIA limit (available limit minus AIA claimed) |
| `aiaAvailable` | Total AIA available for the period (£1,000,000 apportioned for short periods) |

### 4.2 Pool Computations

For each pool (main, special rate):

| Output | Description |
|--------|-------------|
| `poolBF` | Brought-forward balance |
| `additionsToPool` | Additions entering the pool (net of FYA/FE/AIA) |
| `disposalsFromPool` | Total disposal proceeds deducted |
| `balanceAfterDisposals` | Pool value after additions and disposals |
| `balancingCharge` | If pool goes negative: the charge amount (pool reset to nil) |
| `balanceForWDA` | Pool balance before WDA (after any balancing charge adjustment) |
| `smallPoolClaimed` | Whether the small pool allowance was applied (balance <= £1,000) |
| `wdaRate` | The WDA percentage (18% main, 6% special rate) |
| `wdaAmount` | Writing-down allowance claimed |
| `poolCF` | Carried-forward balance |

### 4.3 Total Allowances

| Output | Description |
|--------|-------------|
| `totalFYAs` | Full expensing + zero-emission FYA + special rate FYA |
| `totalAIA` | AIA claimed |
| `totalWDA` | Sum of WDA across all pools |
| `totalBalancingAllowances` | Sum of any balancing allowances (single asset disposals) |
| `totalBalancingCharges` | Sum of any balancing charges (negative pool values) |
| `totalAllowances` | Grand total: FYAs + AIA + WDA + BA - BC |
| `periodDays` | Number of days in the accounting period |
| `isShortPeriod` | Whether the period is less than 365 days |

### 4.4 Per-Addition Breakdown

For each addition:

| Output | Description |
|--------|-------------|
| `description` | Asset description |
| `cost` | Original cost |
| `reliefType` | Relief claimed: `full-expensing` / `fya-100` / `fya-50` / `aia` / `wda` |
| `reliefAmount` | Amount relieved immediately (FYA/AIA) |
| `amountToPool` | Amount entering the pool for future WDA |
| `targetPool` | Which pool the asset enters (if any) |
| `educationalNote` | Why this relief/pool was determined |

### 4.5 Exam-Format Computation

| Output | Description |
|--------|-------------|
| `examLayout` | Structured data for rendering a multi-column exam-format CA computation table |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | Period dates valid | `error` | Period start must be before period end. Period cannot exceed 18 months. |
| V2 | At least one input | `error` | Must have at least one addition, disposal, or pool b/f value > 0. |
| V3 | CO2 required for cars | `error` | If asset category is `car`, CO2 emissions must be provided. |
| V4 | AIA not exceeding limit | `error` | Total AIA allocated across all additions cannot exceed the available AIA limit (apportioned for short periods). |
| V5 | AIA not on cars | `warning` | AIA cannot be claimed on cars. If a car has AIA elected, warn and override to WDA. |
| V6 | Full expensing company only | `warning` | Full expensing is only available for companies. If entity type is sole-trader-partnership and full expensing is elected, warn and override to AIA or WDA. |
| V7 | Full expensing new only | `warning` | Full expensing is only available for new, unused assets. If isNew is false and full expensing is elected, warn. |
| V8 | Full expensing not cars | `warning` | Full expensing is not available for cars. Cars with CO2 = 0 get FYA instead. |
| V9 | Private use company info | `info` | For companies, private use does not restrict capital allowances. The employee pays BIK. This is an informational note to reinforce the learning point. |

---

## 6. Calculation Logic

### 6.1 Period Length

```
periodDays = (periodEnd - periodStart) + 1
isShortPeriod = periodDays < 365
```

### 6.2 AIA Available

```
If isShortPeriod:
  aiaAvailable = £1,000,000 × (periodDays / 365)    [rounded down to nearest £]
Else:
  aiaAvailable = £1,000,000
```

### 6.3 Classify Each Addition

For each addition, determine:

1. **Target pool:**
   - `general-plant` → main pool
   - `car` with CO2 = 0 → no pool (100% FYA)
   - `car` with CO2 1-50 → main pool
   - `car` with CO2 51+ → special rate pool
   - `integral-feature` → special rate pool
   - `thermal-insulation` → special rate pool
   - `long-life` → special rate pool

2. **Available reliefs (in priority order):**
   - Zero-emission car: `fya-100` (always, regardless of new/used)
   - Company + new + main-rate P&M (not car): `full-expensing` (100%)
   - Company + new + special-rate: `fya-50` (50% FYA) OR `aia`
   - Not car + AIA available: `aia` (up to remaining limit)
   - Everything else: `wda` (enters pool)

3. **Auto-selection logic:**
   - Zero-emission cars → FYA 100% (always best)
   - New main-rate P&M (company) → full expensing (same as AIA but doesn't use AIA limit)
   - Special rate assets → AIA first (100% vs 50% FYA or 6% WDA)
   - Remaining AIA-eligible → AIA
   - Cars (non-zero-emission) → WDA only

### 6.4 Apply First Year Allowances

First year allowances are claimed on specific additions before they enter any pool:

```
For each addition with FYA/full expensing:
  If full-expensing:    reliefAmount = cost × 100% = cost
  If fya-100:           reliefAmount = cost × 100% = cost
  If fya-50:            reliefAmount = cost × 50%
                        amountToPool = cost × 50%  (enters special rate pool)

  amountToPool = cost - reliefAmount
```

### 6.5 Apply AIA

```
aiaRemaining = aiaAvailable

For each addition with AIA elected (in user-specified order):
  aiaOnThisAsset = min(cost, aiaRemaining)
  reliefAmount = aiaOnThisAsset
  amountToPool = cost - aiaOnThisAsset
  aiaRemaining -= aiaOnThisAsset
```

### 6.6 Pool Computations

For each pool (main, special rate):

```
Step 1: Balance after additions and disposals
  balance = poolBF + additionsToPool - disposalsFromPool

Step 2: Balancing charge check
  If balance < 0:
    balancingCharge = |balance|
    balance = 0

Step 3: Small pool check
  If balance > 0 AND balance <= £1,000:
    wdaAmount = balance     (claim full balance)
    poolCF = 0
  Else:
    wdaAmount = balance × wdaRate
    poolCF = balance - wdaAmount

Step 4: Short-period apportionment of WDA
  If isShortPeriod:
    wdaAmount = wdaAmount × (periodDays / 365)
    poolCF = balanceForWDA - wdaAmount
```

### 6.7 Private Use Adjustment (Sole Trader/Partnership Only)

```
If entityType = 'sole-trader-partnership' AND privateUsePercent > 0:
  allowableProportion = (100 - privateUsePercent) / 100
  allowancesClaimed = wdaAmount × allowableProportion

  Note: The FULL WDA still reduces the pool balance.
  Only the business-use proportion is claimed as a capital allowance.
  The private-use proportion is effectively lost.
```

### 6.8 Total Allowances

```
totalAllowances =
  totalFYAs
  + totalAIA
  + totalWDA
  + totalBalancingAllowances
  - totalBalancingCharges
```

---

## 7. Rate Tables

### WDA Rates

| Pool | Rate | Legislation |
|------|------|-------------|
| Main pool | 18% | s.56(1) CAA 2001 |
| Special rate pool | 6% | s.56(3) CAA 2001 |

### Car CO2 Allocation (2025/26)

| CO2 Emissions | Pool Allocation | Allowance |
|---------------|----------------|-----------|
| 0 g/km | Not allocated to pool | 100% FYA (s.39 CAA 2001) |
| 1-50 g/km | Main pool | 18% WDA |
| 51+ g/km | Special rate pool | 6% WDA |

### Key Limits

| Limit | Amount | Notes |
|-------|--------|-------|
| AIA annual limit | £1,000,000 | Apportioned for short periods |
| Small pool threshold | £1,000 | Claim full balance instead of % WDA |
| Full expensing | 100% | New main-rate P&M, companies only (from April 2023, made permanent) |
| Special rate FYA | 50% | New special-rate assets, companies only |

### Integral Features (s.104A CAA 2001)

The following are integral features and go to the special rate pool:
1. Electrical systems (including lighting systems)
2. Cold water systems
3. Space or water heating systems, powered systems of ventilation, air cooling or air purification, and any floor or ceiling comprised in such a system
4. Lifts, escalators and moving walkways
5. External solar shading

---

## 8. Educational Notes

### Inline Tooltips

Each input field has an educational note (see Input Definitions above) explaining WHY the field matters and what it indicates. These are shown as expandable tooltips beneath each input.

### Key Conceptual Points

- **Depreciation is disallowed:** Companies add back depreciation in the trading profit computation and claim capital allowances instead. CA replaces depreciation for tax purposes.
- **AIA strategy:** When full expensing is available, direct AIA to assets that DON'T qualify for full expensing (e.g., special rate assets). Full expensing achieves the same 100% relief without using the AIA limit.
- **Cars are special:** Cars never qualify for AIA or full expensing. They are allocated to pools based on CO2 emissions. Zero-emission cars get 100% FYA. Other cars get WDA at 18% (main pool) or 6% (special rate pool).
- **Company vs sole trader:** Companies can claim full expensing (100% on new main-rate P&M). Sole traders cannot. Additionally, companies claim the full CA regardless of private use — the employee pays BIK instead. Sole traders restrict the CA by the business-use proportion.
- **Short-period apportionment:** AIA and WDA are apportioned for short accounting periods. FYAs are NOT apportioned — you get the full FYA regardless of period length.
- **Full expensing vs AIA:** Both give 100% relief. Full expensing doesn't use the AIA limit. AIA is more flexible (available to all business types, second-hand assets). Optimal strategy: use full expensing where available, save AIA for assets that need it.
- **Integral features:** Electrical systems, lifts, heating/cooling systems, etc. These go to the special rate pool at 6% WDA — significantly slower relief than main pool assets. AIA can accelerate relief on these.

---

## 9. H&C Test Scenarios

### Scenario 1 — S3: C&S Engineering Full CA Computation

**Context:** Ian Whitworth provides the capital expenditure schedule for y/e 31 March 2026. C&S Engineering acquired a new CNC machine, wire EDM machine, two company cars (BMW and Tesla), a delivery van, and carried out an office electrical refurbishment. The old CNC lathe was disposed of. The student must compute the complete multi-pool capital allowances.

**Key data (from fact register):**

| Asset | Cost | Category | CO2 | New | Notes |
|-------|------|----------|-----|-----|-------|
| Mazak Integrex i-300S CNC | £285,000 | General P&M | n/a | Yes | 5-axis multitasking machine, acquired 12 May 2025 |
| Mitsubishi MV2400S Wire EDM | £95,000 | General P&M | n/a | Yes | Acquired 8 August 2025 |
| Ford Transit Custom 300 L2 | £32,000 | General P&M | n/a | Yes | Commercial vehicle (not a car), acquired 1 April 2025 |
| BMW 530e xDrive | £52,000 | Car | 21 g/km | Yes | Plug-in hybrid, Marcus's company car, 20% private use |
| Tesla Model 3 Long Range | £45,000 | Car | 0 g/km | Yes | Zero-emission, Sophie's company car, 10% private use |
| Mezzanine office electrical refurb | £24,000 | Integral feature | n/a | Yes | Electrical systems — integral feature per s.104A |

| Disposal | Proceeds | Pool |
|----------|----------|------|
| Mazak Quick Turn 200 (old lathe) | £18,000 | Main pool |

**Pre-filled inputs:**
- Period: 1 April 2025 to 31 March 2026 (365 days, full year)
- Entity type: Company
- Main pool b/f: £142,000
- Special rate pool b/f: £38,000

**Expected computation:**

| Item | FYA/FE | AIA | Main Pool | Special Rate | Allowances |
|------|--------|-----|-----------|--------------|------------|
| CNC machine (FE 100%) | 285,000 | | | | 285,000 |
| Wire EDM (FE 100%) | 95,000 | | | | 95,000 |
| Ford Transit (FE 100%) | 32,000 | | | | 32,000 |
| Tesla Model 3 (FYA 100%) | 45,000 | | | | 45,000 |
| Electrical refurb (AIA) | | 24,000 | | | 24,000 |
| **FYA/AIA totals** | **457,000** | **24,000** | | | |
| Pool b/f | | | 142,000 | 38,000 | |
| BMW 530e (main pool) | | | 52,000 | | |
| | | | 194,000 | 38,000 | |
| Disposal (old CNC) | | | (18,000) | | |
| | | | 176,000 | 38,000 | |
| WDA @ 18% | | | (31,680) | | 31,680 |
| WDA @ 6% | | | | (2,280) | 2,280 |
| **c/f** | | | **144,320** | **35,720** | |
| **Total allowances** | | | | | **514,960** |

**Expected total allowances:** £514,960

**Key learning points:**
- Full expensing used for CNC, wire EDM, and Ford Transit (all new main-rate P&M, company purchase) — £412,000 relieved immediately without using AIA
- AIA directed to electrical refurbishment (integral feature, special rate pool) — £24,000 gets 100% relief instead of 6% WDA
- Tesla gets 100% FYA as zero-emission car — no pool allocation
- BMW enters main pool at 18% WDA — CO2 21 g/km puts it in 1-50 band. Private use (20%) does NOT restrict the CA because C&S is a company (Marcus pays BIK instead)
- Old CNC disposal reduces main pool by £18,000 — no balancing adjustment because pool remains positive
- Strategic AIA allocation: student should recognise that full expensing covers main-rate assets, so AIA should target the electrical refurbishment (the only asset that would otherwise get only 6% WDA)

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onAdditionAdd` | Student adds a new asset | `{ addition, timestamp }` |
| `onAdditionRemove` | Student removes an asset | `{ additionId, timestamp }` |
| `onDisposalAdd` | Student adds a disposal | `{ disposal, timestamp }` |
| `onDisposalRemove` | Student removes a disposal | `{ disposalId, timestamp }` |
| `onReliefElection` | Student changes relief election for an asset | `{ additionId, reliefType, previousRelief, timestamp }` |
| `onCompute` | Student triggers the computation | `{ totalAllowances, poolResults, attemptNumber, timestamp }` |
| `onValidation` | Validation runs (on compute) | `{ errors, warnings, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |

---

## 11. Accessibility & UX

- Tab order: period → entity type → pool b/f → additions → disposals → compute
- Additions and disposals are dynamic lists with add/remove buttons
- Each addition has a collapsible detail section showing relief classification and educational note
- Computation results shown in two views:
  1. **Summary view:** total allowances, per-pool breakdown cards
  2. **Exam-format view:** multi-column table matching CTA exam answer format
- Validation runs on "Compute Allowances" click
- Responsive layout: single-column on mobile
- Colour coding: green for allowances claimed, amber for pool balances, red for balancing charges
- Pool columns use right-aligned numbers with consistent formatting (commas, no decimals)
- Short-period warning displayed prominently when period < 365 days

---

## 12. Computation Flow Diagram

```
Additions
   │
   ├── Category + CO2 → Pool allocation
   │
   ├── Is car?
   │     ├── CO2 = 0 → FYA 100% (no pool)
   │     ├── CO2 1-50 → Main pool, WDA 18%
   │     └── CO2 51+ → Special rate pool, WDA 6%
   │
   ├── Is new main-rate P&M (company)?
   │     └── Full expensing 100% (no pool)
   │
   ├── AIA available?
   │     └── AIA (up to limit, no pool)
   │
   └── WDA only → enters pool

Pools
   │
   ├── b/f + additions (net of FYA/AIA) - disposals
   │
   ├── Negative? → Balancing charge, reset to nil
   │
   ├── ≤ £1,000? → Small pool WDA (full balance)
   │
   └── WDA @ rate% (apportioned for short periods)

Total Allowances = FYAs + AIA + WDAs + BA - BC
```
