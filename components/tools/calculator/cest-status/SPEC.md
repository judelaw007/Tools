# CEST Employment Status Tool — Tool Specification

## 1. Registration Data

| Field | Value |
|-------|-------|
| Tool ID | `cest-status` |
| Tool Slug | `cest-status` |
| Display Name | CEST Employment Status Tool |
| Component Name | `CestStatus` |
| Real-World Equivalent | HMRC Check Employment Status for Tax (CEST) — gov.uk/guidance/check-employment-status-for-tax |
| Tool Type | `decision-tree` |
| Category | `employment-tax` |
| Difficulty | Introductory |
| Sections Used | S1 (primary) |
| Build Order | 2 of 7 |

### Database Registration SQL

```sql
INSERT INTO tools (
  slug, name, description, component_name, category,
  tool_type, difficulty, is_active, sort_order
) VALUES (
  'cest-status',
  'CEST Employment Status Tool',
  'Simulates HMRC''s Check Employment Status for Tax (CEST) tool for determining whether a worker should be treated as employed or self-employed for tax purposes. Evaluates control, substitution, mutuality of obligation, financial risk, and the "in business on own account" assessment. Links each factor to underlying case law principles and provides IR35/off-payroll working implications.',
  'CestStatus',
  'employment-tax',
  'decision-tree',
  'introductory',
  true,
  4
);
```

---

## 2. Purpose & Context

The CEST tool is HMRC's own digital tool for determining employment status for tax. Since the 2021 off-payroll working reforms (IR35), medium and large private sector clients are responsible for determining the employment status of workers engaged through intermediaries (PSCs). CEST is the tool HMRC expects end clients to use — and the one HMRC will stand behind if the determination is challenged.

The tool evaluates five assessment areas drawn from case law:
1. **Control** — who decides what, how, when, and where the work is done (Ready Mixed Concrete v Minister of Pensions [1968])
2. **Substitution** — whether the worker has a genuine right to send a substitute (Pimlico Plumbers v Smith [2018])
3. **Mutuality of obligation** — whether there is an obligation to offer and accept work (Carmichael v National Power [1999])
4. **Financial risk** — whether the worker bears genuine financial risk (Market Investigations v Minister of Social Security [1969])
5. **In business on own account** — the overall picture of whether the worker is running their own business (Hall v Lorimer [1994])

### Why This Tool Matters for OMB Students

- **IR35 is tested regularly** since the 2021 off-payroll reforms. Students must understand both the status tests and the procedural obligations (who makes the determination, SDS requirements).
- **Medium employer obligations**: C&S Engineering has 38 employees — above the small company threshold. The student must recognise that C&S (not Kirby's PSC) is responsible for the employment status determination.
- **No single test is determinative**: Hall v Lorimer established that the court must look at the "overall picture" — a painting, not individual brush strokes. The tool teaches this multi-factor analysis.
- **Genuine substitution is powerful**: If a worker has a genuine, exercised right to send a substitute and pays the substitute themselves, this is a very strong indicator of self-employment — potentially determinative.
- **CEST often returns "undetermined"**: This is realistic and educational. When factors genuinely point both ways, the tool should say so. The student must then advise on next steps (seek specialist advice, review contract terms, consider protective registration).

---

## 3. Input Definitions

### 3.1 Preliminary Context (Not Scored)

| Field | Type | Options | Educational Note |
|-------|------|---------|-----------------|
| `workerEngagement` | `select` | PSC / Agency / Direct | Determines whether IR35/off-payroll rules apply. If the worker is engaged through a PSC or agency, off-payroll rules may apply. |
| `clientSize` | `select` | Small / Medium-Large / Unsure | Determines who is responsible for the employment status determination. Small companies: the worker's PSC decides. Medium/large: the end client decides. |

### 3.2 Assessment Area 1: Control (4 Questions)

| ID | Question | Options | Weights | Educational Note |
|----|----------|---------|---------|-----------------|
| C1 | Who decides what work the worker does on a day-to-day basis? | (a) The client decides and allocates specific tasks (b) The client sets broad objectives but the worker plans their own day-to-day tasks (c) The worker decides their own workload and priorities | -1 / +1 / +2 | Ready Mixed Concrete: the right to control WHAT work is done is a fundamental indicator of employment. If the client directs tasks, it suggests an employment relationship. |
| C2 | Does the client direct how the work should be carried out? | (a) Yes — the client instructs the worker on methods and approach (b) No — the client specifies the end result but the worker chooses their own methods (c) No — the worker has complete autonomy over how they deliver the work | -2 / +1 / +2 | The HOW test is one of the strongest control indicators. If the client tells the worker not just WHAT to do but HOW to do it, this points strongly to employment. |
| C3 | Can the client move the worker to different tasks beyond the agreed scope? | (a) Yes — the client can reassign the worker to different work (b) Only within the worker's specialism or area of expertise (c) No — the worker only does the specific work originally agreed | -2 / 0 / +1 | The power to direct a worker to different tasks is characteristic of employment. Self-employed workers are engaged for specific work — you cannot redeploy them. |
| C4 | Does the client decide when and where the work is done? | (a) Yes — the client specifies working hours and requires attendance at their premises (b) Partly — the worker must attend the client's premises for some tasks but has flexibility on hours (c) No — the worker chooses their own hours and work location | -2 / 0 / +2 | Working fixed hours at the client's premises is a strong employment indicator. Self-employed workers typically choose their own hours and location. |

### 3.3 Assessment Area 2: Substitution (3 Questions)

| ID | Question | Options | Weights | Educational Note |
|----|----------|---------|---------|-----------------|
| S1 | Does the worker have a contractual right to send a substitute to do the work in their place? | (a) No — the contract requires the worker to do the work personally (b) Yes — but the client must approve any substitute before they can work (c) Yes — the worker has an unrestricted right to send a suitable substitute | -2 / 0 / +2 | Personal service is fundamental to employment. An obligation to perform work personally is the strongest single indicator of employment. A genuine right of substitution points strongly to self-employment. Note: a right requiring client approval is weak (Pimlico Plumbers). |
| S2 | Has the worker ever actually sent a substitute to do the work? | (a) No — the worker has always done the work personally (b) Yes — a substitute has done the work at least once (c) Not applicable — there is no substitution right | -1 / +2 / 0 | A substitution clause that has never been exercised may be a sham (Autoclenz v Belcher). If the right exists in the contract but has never been used, its genuineness is questionable. Exercised substitution is very strong evidence of self-employment. |
| S3 | If a substitute is or could be sent, who pays the substitute? | (a) The client would pay the substitute directly (b) The worker would pay the substitute from their own fee (c) Not applicable | -1 / +2 / 0 | If the worker pays the substitute from their own fee, they are bearing genuine financial risk — a strong self-employment indicator. If the client pays directly, the arrangement looks more like the client simply hiring a different worker. |

### 3.4 Assessment Area 3: Mutuality of Obligation (3 Questions)

| ID | Question | Options | Weights | Educational Note |
|----|----------|---------|---------|-----------------|
| M1 | Is the client obliged to offer work to the worker on an ongoing basis? | (a) Yes — there is a contractual commitment to provide regular work (b) There is a rolling engagement but work volume is not guaranteed (c) No — work is offered project by project with no guarantee of future work | -2 / -1 / +2 | Mutuality of obligation (MOO) is the irreducible minimum for an employment contract (Carmichael v National Power). Without MOO — no obligation to offer work and no obligation to accept — there cannot be employment. |
| M2 | Is the worker obliged to accept work when offered? | (a) Yes — the worker must accept work when it is available (b) The worker is generally expected to be available but can negotiate (c) No — the worker can freely decline work without consequence | -2 / -1 / +2 | If the worker MUST accept work when offered, this is a strong employment indicator — it shows the mutual obligation at the heart of the employment relationship. |
| M3 | What is the arrangement for ending the engagement? | (a) The worker has employment-like notice periods or continuous service (b) There is a fixed notice period for termination (e.g., 1–3 months) (c) Either party can end the engagement immediately or with minimal notice | -2 / -1 / +1 | Long notice periods and concepts of continuous service are employment features. Project-based engagements that can be terminated on completion point to self-employment. |

### 3.5 Assessment Area 4: Financial Risk (4 Questions)

| ID | Question | Options | Weights | Educational Note |
|----|----------|---------|---------|-----------------|
| F1 | Does the worker provide their own equipment, tools, or software for the work? | (a) No — the client provides all equipment, tools, and software (b) The worker provides some minor items but the client supplies major equipment (c) Yes — the worker provides their own significant equipment at their own cost | -2 / -1 / +2 | Market Investigations: providing your own equipment and bearing the cost is a hallmark of self-employment. Using the client's equipment, tools, and software is characteristic of employment. |
| F2 | If the work is unsatisfactory, who bears the cost of putting it right? | (a) The client — the worker is paid regardless and corrections are handled internally (b) The worker must redo the work but is paid for the additional time (c) The worker — they must correct work at their own expense with no additional payment | -1 / 0 / +2 | Bearing the financial risk of defective work is a key self-employment indicator. An employee is paid regardless of the quality of their output — the employer bears the risk. |
| F3 | How is the worker paid? | (a) Regular fixed amounts (weekly/monthly) similar to a salary (b) By invoice, based on time worked (e.g., day rate multiplied by days) (c) Fixed price per project or deliverable — payment does not depend on time taken | -1 / 0 / +2 | Payment by the hour/day with no risk is employment-like. A fixed price per project means the worker bears genuine financial risk — if the work takes longer than expected, the worker absorbs the cost. |
| F4 | Could the worker make a financial loss on this engagement? | (a) No — the worker is guaranteed payment for all time worked (b) Unlikely — but there is some risk of reduced or delayed payment (c) Yes — the worker could lose money if costs exceed their fee | -1 / 0 / +2 | The possibility of profit AND loss is a key indicator of self-employment (Market Investigations). An employee cannot make a loss — they are paid a wage regardless. |

### 3.6 Assessment Area 5: In Business on Own Account (4 Questions)

| ID | Question | Options | Weights | Educational Note |
|----|----------|---------|---------|-----------------|
| B1 | Does the worker provide similar services to other clients? | (a) No — the worker works exclusively for this client (b) The worker has 1–2 other minor clients but this is their main engagement (c) Yes — the worker has multiple clients and this is one of several | -2 / 0 / +2 | Working exclusively for one client is a strong employment indicator. Having multiple clients — especially if no single client dominates — indicates genuine self-employment. |
| B2 | Does the worker advertise or market their services? | (a) No — the worker does not advertise (b) The worker has a basic online presence (LinkedIn profile, simple website) (c) Yes — the worker actively markets their services to attract new clients | -1 / 0 / +1 | Self-employed people need to find their own work. Advertising and marketing are hallmarks of being in business on your own account. An employee does not need to market themselves. |
| B3 | What business structure does the worker operate through? | (a) The worker is engaged as an individual with no formal business structure (b) The worker operates through a limited company (PSC) but it is essentially just them (c) The worker has a genuine business with employees, premises, or significant infrastructure | -1 / 0 / +2 | A PSC alone does NOT determine employment status (the whole point of IR35). However, a genuine business with its own employees, premises, and infrastructure is a strong indicator of self-employment. |
| B4 | How integrated is the worker into the client's organisation? | (a) The worker is treated like staff — attends team meetings, has company email, appears on org chart (b) The worker interacts with the client's team but is clearly identified as external (c) The worker operates independently with minimal day-to-day involvement in the client's operations | -2 / 0 / +1 | Integration into the client's organisation is a strong employment indicator. Self-employed workers typically maintain a clear separation — they are engaged for a specific purpose and operate independently. |

---

## 4. Output Definitions

### 4.1 Overall Determination

| Output | Description |
|--------|-------------|
| `determination` | Employment status: `employed` / `self-employed` / `undetermined` |
| `overallScore` | Weighted sum across all 18 scored questions |
| `determinationReason` | Plain-English explanation of why this determination was reached |
| `confidenceLevel` | How decisive the result is: `decisive` (score far from thresholds) / `marginal` (score near thresholds) |
| `leaning` | For undetermined results: `employment` / `self-employment` / `evenly-balanced` |

### 4.2 Per-Area Breakdown

For each of the 5 assessment areas:

| Output | Description |
|--------|-------------|
| `areaId` | Assessment area identifier (control / substitution / moo / financial-risk / in-business) |
| `areaName` | Display name |
| `areaScore` | Sum of weighted answers for this area |
| `areaDirection` | Which way this area points: `employment` / `self-employment` / `inconclusive` |
| `questionResults` | Per-question: selected answer, weight, explanation |
| `caseLawReferences` | Relevant case law for this area |

### 4.3 IR35 Implications

| Output | Description |
|--------|-------------|
| `ir35Applies` | Whether off-payroll working rules apply (based on intermediary involvement) |
| `responsibleParty` | Who is responsible for the determination: end client (medium/large) or PSC (small company) |
| `sdsRequired` | Whether a Status Determination Statement is required |
| `implications` | Plain-English summary of IR35 consequences if determination is "employed" |
| `nextSteps` | Recommended actions based on the determination |

### 4.4 Key Factors Summary

| Output | Description |
|--------|-------------|
| `employmentFactors` | List of factors pointing toward employment |
| `selfEmploymentFactors` | List of factors pointing toward self-employment |
| `neutralFactors` | List of inconclusive factors |
| `strongestEmployment` | The single strongest employment indicator |
| `strongestSelfEmployment` | The single strongest self-employment indicator |

---

## 5. Validation Rules

| ID | Rule | Severity | Description |
|----|------|----------|-------------|
| V1 | All questions answered | `error` | All 18 scored questions must be answered before assessment can run. |
| V2 | Preliminary questions answered | `warning` | Preliminary context questions (engagement type, client size) should be answered for IR35 implications. |
| V3 | Substitution consistency | `warning` | If Q S1 = "no substitution right" but Q S2 = "has sent substitute" — inconsistent answers. |
| V4 | MOO consistency | `warning` | If Q M1 = "no obligation to offer" AND Q M2 = "must accept" — logically inconsistent (how can the worker be obliged to accept if there is no obligation to offer?). |
| V5 | All areas covered | `info` | Confirm all 5 areas have been assessed — each area contributes to the overall picture. |

---

## 6. Determination Logic

### Scoring Model

Each of the 18 scored questions has 3 answer options. Each option carries a weight:
- **Negative weights** (−1 to −2): point toward employment
- **Zero weight** (0): neutral / inconclusive
- **Positive weights** (+1 to +2): point toward self-employment

### Score Ranges

| Score Range | Determination | Description |
|-------------|--------------|-------------|
| ≤ −10 | **Employed** | Strong and consistent employment indicators across multiple areas |
| −9 to −5 | **Undetermined** (leaning employment) | Several factors point to employment but the overall picture is not decisive |
| −4 to +4 | **Undetermined** (evenly balanced) | Factors point both ways with no clear direction — further review needed |
| +5 to +9 | **Undetermined** (leaning self-employment) | Several factors point to self-employment but the overall picture is not decisive |
| ≥ +10 | **Self-employed** | Strong and consistent self-employment indicators across multiple areas |

### Determinative Override

One scenario can override the scoring:

**Genuine substitution exercised**: If Q S1 = "unrestricted right" (+2) AND Q S2 = "substitute has been sent" (+2) AND Q S3 = "worker pays substitute" (+2) — total substitution score = +6. This combination indicates a genuine, exercised right of substitution where the worker bears the financial risk. The overall determination is overridden to **self-employed** regardless of other area scores.

### Per-Area Determination

For each area, the area score determines its direction:
- Area score < 0 → Employment indicator
- Area score = 0 → Inconclusive
- Area score > 0 → Self-employment indicator

---

## 7. Case Law Reference Table

| Case | Citation | Area | Principle |
|------|----------|------|-----------|
| Ready Mixed Concrete v Minister of Pensions | [1968] 2 QB 497 | Control | Three conditions for a contract of service: (1) worker agrees to provide their own work in consideration of a wage, (2) worker agrees to be subject to the other's control, (3) other provisions are consistent with employment. |
| Market Investigations v Minister of Social Security | [1969] 2 QB 173 | Financial Risk | The fundamental test: is the person performing services doing so as a person in business on their own account? Financial risk, investment, opportunity for profit/loss are key indicators. |
| Hall v Lorimer | [1994] 1 WLR 209 | In Business | No single test is determinative — the court must look at the overall picture, like painting a picture from many different details rather than applying a single test. |
| Pimlico Plumbers v Smith | [2018] UKSC 29 | Substitution | A substitution clause requiring client approval was held to be inconsistent with genuine self-employment — the right was too limited to be a genuine unfettered right of substitution. |
| Autoclenz v Belcher | [2011] UKSC 41 | Substitution | Courts must look at the reality of the relationship, not just the written contract. Contractual terms that do not reflect the actual working arrangements may be disregarded (the "purposive approach"). |
| Carmichael v National Power | [1999] 1 WLR 2042 | MOO | Mutuality of obligation is the irreducible minimum for a contract of employment. Without an obligation to provide work and an obligation to accept it, there is no employment relationship. |
| Nethermere (St Neots) v Gardiner | [1984] ICR 612 | MOO | Even without a formal contract, a pattern of regular work over time can give rise to an implied mutuality of obligation — the "umbrella contract" concept. |
| Lee v Chung | [1990] 2 AC 374 | In Business | The Privy Council confirmed that the overall test is whether the worker is performing services as a person in business on their own account — the "economic reality" test. |

---

## 8. Educational Notes

### Inline Tooltips

Each question has an educational note (see Input Definitions above) explaining WHY the question matters and what the answer indicates. These are shown as expandable tooltips beneath each question.

### Post-Assessment Explanations

After assessment, the tool generates:
1. A per-area breakdown showing which direction each area points and why
2. A key factors summary listing the strongest indicators in each direction
3. Case law references linked to the specific factors in this assessment
4. IR35 implications (if a PSC is involved)
5. Recommended next steps based on the determination

### Key Conceptual Points

- **No single factor is determinative**: Hall v Lorimer — the court looks at the "painting" (overall picture), not individual brush strokes.
- **Substitution is powerful**: A genuine, unconditional, exercised right of substitution is the strongest single indicator of self-employment. But it must be real, not a paper clause (Autoclenz).
- **MOO is the irreducible minimum**: Without mutual obligations to offer and accept work, there cannot be employment (Carmichael). If the worker can turn down work freely and the client has no obligation to offer it, this points strongly to self-employment.
- **PSC does NOT determine status**: Operating through a personal service company does not make someone self-employed. That is the entire point of IR35 — looking through the intermediary to the underlying relationship.
- **CEST often returns "undetermined"**: This is not a failure. When the factors genuinely point both ways, an undetermined result is honest and correct. The real HMRC CEST tool gives undetermined results frequently.

---

## 9. H&C Test Scenarios

### Scenario 1 — S1: James Kirby CEST Assessment

**Context:** Marcus emails about an HMRC intermediaries query letter (ref: OPW/2026/SY/04817) regarding James Kirby, a CAD design engineer engaged through his PSC (Kirby Design Solutions Ltd). HMRC questions whether off-payroll working rules apply. The student must assess Kirby's employment status using CEST.

**Key data (from fact register):**
- Engagement: CAD design engineer, 3D modelling, technical drawings — 3 days/week on-site (Tues, Wed, Thurs)
- Duration: Engaged since April 2024, rolling contract, 3-month notice
- Rate: £400/day, invoiced monthly by PSC
- Equipment: Uses C&S's CAD workstation and SolidWorks software licences
- Substitution: Contract allows substitution but C&S must approve the substitute
- Other clients: James does occasional work for 2 other engineering firms (~20% of his time)
- Control: C&S specifies WHAT work (projects/drawings) but not HOW (James chooses methods)
- PSC: Kirby Design Solutions Ltd (Company No. 13847291)
- C&S employer status: Medium employer (38 staff — above small company threshold)

**Pre-filled answers:**
- Preliminary: PSC engagement; Medium/large client
- C1: Client sets broad objectives, worker plans tasks → +1
- C2: Client specifies end result, worker chooses methods → +1
- C3: Only within specialism → 0
- C4: On-site required but flexibility on hours → 0
- S1: Right exists but client must approve → 0
- S2: Never sent a substitute → −1
- S3: Not applicable (approval required, never exercised) → 0
- M1: Rolling engagement, volume not guaranteed → −1
- M2: Generally expected to be available → −1
- M3: 3-month notice period → −1
- F1: Client provides all equipment (CAD workstation, SolidWorks) → −2
- F2: Worker redoes work but paid for time → 0
- F3: Invoiced monthly based on day rate → 0
- F4: Guaranteed payment for days worked → −1
- B1: 1–2 other minor clients → 0
- B2: Basic online presence → 0
- B3: Operates through PSC (just him) → 0
- B4: On-site, interacts with team, clearly identified as external → 0

**Expected score:** −5 (undetermined, leaning employment)

**Expected determination:** UNDETERMINED — factors point both ways. Control is mixed (C&S specifies what but not how). Substitution is weak (clause exists but requires approval, never exercised). MOO indicators are moderately employment-like (rolling contract, expected availability, 3-month notice). Financial risk is employment-like (client's equipment, day rate guaranteed). In business factors are mixed (PSC, other clients, but not a substantial independent business).

**Key learning points:**
- C&S is a medium employer — THEY are responsible for the determination, not Kirby's PSC
- The substitution clause requiring approval is weak per Pimlico Plumbers
- Using C&S's equipment is a significant employment indicator
- Having other clients (~20%) partially offsets the employment indicators
- An undetermined result is realistic and requires further review

---

### Scenario 2 — S1: Clearly Employed Comparison (Hypothetical)

**Context:** For comparison purposes, the student assesses a hypothetical worker who is clearly employed — a temporary warehouse operative supplied by an agency to work full-time at C&S's premises.

**Pre-filled answers:**
- C1: Client decides and allocates tasks → −1
- C2: Client instructs methods → −2
- C3: Client can reassign → −2
- C4: Client specifies hours and location → −2
- S1: No substitution right → −2
- S2: Not applicable → 0
- S3: Not applicable → 0
- M1: Contractual commitment to regular work → −2
- M2: Must accept work → −2
- M3: Employment-like notice → −2
- F1: Client provides all equipment → −2
- F2: Client pays regardless → −1
- F3: Regular fixed amounts → −1
- F4: Guaranteed payment → −1
- B1: Works exclusively for this client → −2
- B2: Does not advertise → −1
- B3: No business structure → −1
- B4: Treated like staff → −2

**Expected score:** −26 (decisive employment)

**Expected determination:** EMPLOYED — all five areas point decisively toward employment.

**Key learning points:**
- Contrast with James Kirby shows why status is uncertain for Kirby but clear for this worker
- Demonstrates the difference between decisive and undetermined results
- Reinforces that every factor points the same way in a clear employment case

---

## 10. Tracking Callbacks

| Callback | Trigger | Payload |
|----------|---------|---------|
| `onAnswerSelect` | Student selects an answer to a question | `{ questionId, areaId, selectedOption, weight, timestamp }` |
| `onAreaComplete` | All questions in an area have been answered | `{ areaId, areaScore, areaDirection, timestamp }` |
| `onAssess` | Student triggers the assessment | `{ determination, overallScore, areaResults, attemptNumber, timestamp }` |
| `onValidation` | Validation runs (on assess) | `{ unansweredCount, inconsistencies, timestamp }` |
| `onHint` | Student requests a hint | `{ questionId, hintType, timestamp }` |
| `onReset` | Student resets the form | `{ previousResult, timestamp }` |
| `onScenarioLoad` | Student loads an H&C scenario | `{ scenarioId, section, timestamp }` |
| `onCaseLawView` | Student expands a case law reference | `{ caseRef, areaId, timestamp }` |

---

## 11. Accessibility & UX

- Tab order follows logical sequence: preliminary → control → substitution → MOO → financial risk → in business → assess
- Each question has exactly 3 radio button options — no free text entry required
- Educational notes are expandable (collapsed by default to reduce visual noise, shown when tooltips enabled)
- Each area is an expandable accordion section with a status indicator:
  - Grey circle: not yet answered
  - Blue circle: partially answered
  - Green tick: all questions answered
  - After assessment: coloured indicator showing area direction (red = employment, green = self-employment, amber = inconclusive)
- Validation runs on "Run Assessment" click — requires all 18 questions answered
- Results panel appears below the questionnaire with:
  - Overall determination (large, colour-coded badge)
  - Score bar showing position on the employment ↔ self-employment spectrum
  - Per-area breakdown cards
  - Key factors summary (employment factors vs self-employment factors)
  - IR35 implications panel (if PSC involved)
  - Case law references (expandable per area)
  - Recommended next steps
- Responsive layout: single-column on mobile, the questionnaire takes full width
- Colour coding: red tones for employment indicators, green tones for self-employment indicators, amber for undetermined/inconclusive

---

## 12. Score Ranges — Detailed

### Theoretical Extremes

| Area | Questions | Min Score | Max Score |
|------|-----------|-----------|-----------|
| Control | 4 | −7 | +7 |
| Substitution | 3 | −4 | +6 |
| Mutuality of Obligation | 3 | −6 | +5 |
| Financial Risk | 4 | −5 | +8 |
| In Business on Own Account | 4 | −6 | +6 |
| **Total** | **18** | **−28** | **+32** |

### Determination Thresholds

| Range | Result |
|-------|--------|
| ≤ −10 | Employed |
| −9 to +9 | Undetermined |
| ≥ +10 | Self-employed |

### Undetermined Sub-Classification

| Sub-Range | Leaning |
|-----------|---------|
| −9 to −5 | Employment |
| −4 to +4 | Evenly balanced |
| +5 to +9 | Self-employment |
