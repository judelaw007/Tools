# MojiTax Tools Platform

**What it is, what it seeks to achieve, and how it works.**

---

## What Is MojiTax Tools?

MojiTax Tools is a course-companion platform that provides **educational demo tools** bundled with MojiTax professional tax courses. When a learner purchases a course on [mojitax.co.uk](https://mojitax.co.uk) (powered by LearnWorlds), they automatically gain access to hands-on practice tools at [tools.mojitax.co.uk](https://tools.mojitax.co.uk). No separate login, no separate purchase — tools come with the course.

The platform exists to bridge a gap in professional tax education: courses teach theory, but learners rarely get to practise with the kinds of tools professionals use day-to-day. MojiTax Tools closes that gap. Learners work through real-world-style calculations, complete actual form structures, run qualification assessments, and track their readiness with checklists — all in a safe, educational environment with no risk of filing errors or professional liability.

**The core principle is simple:** when you build a course, you build its demo tools alongside it.

---

## What It Seeks to Achieve

### For Learners

Every tool on the platform exists to do one thing: **turn passive knowledge into active competence**.

After watching a lecture on GloBE calculations or reading about safe harbour qualifications, a learner can immediately open the corresponding tool and practise. They enter data, see results, understand why a jurisdiction is compliant or low-taxed, and build muscle memory for the workflows they will encounter in their careers.

The platform tracks this progression automatically:

- **1–4 uses** of a tool = *Familiar* — you've explored it
- **5–14 uses** = *Proficient* — you're comfortable with it
- **15+ uses** = *Expert* — you've demonstrated repeated competence

These skill levels, combined with course completion data, form a **Skills Matrix** — a downloadable, QR-verifiable portfolio that benchmarks a learner's competence across every topic they've studied. Employers or colleagues can scan the QR code to verify the portfolio's authenticity against the platform's records.

The aspiration: a learner finishes a MojiTax course not just with a certificate of completion, but with a demonstrable, verified record of hands-on practice.

### For Course Designers

Tools are not standalone products. They are **extensions of courses**. A course designer decides which tools accompany which course. The admin panel provides a simple interface: select a course, tick the tools that should be available to enrolled students, save. The tools appear for those students and are invisible to everyone else.

This means:
- A "Pillar Two Fundamentals" course can include a GloBE calculator and a safe harbour qualifier
- A "GIR Compliance" course might include all six current tools plus a practice form and audit checklist
- A future "Transfer Pricing Essentials" course would have its own set of companion tools
- Bundles and subscriptions grant access to the combined tools of all their included courses

The platform is **course-agnostic** — it does not favour any single tax domain. Any course in any category (transfer pricing, VAT, FATCA/CRS, withholding tax, Pillar Two, PE assessment, or cross-category) can have tools built for it and allocated to it.

### For the MojiTax Ecosystem

The tools platform serves a dual commercial purpose:

1. **Differentiation** — MojiTax courses aren't just lectures. They include practical tools that learners can use to practise, which sets MojiTax apart from text-and-video competitors.
2. **Discovery and conversion** — Every tool has a public preview page indexed by search engines. Someone searching for "Pillar Two ETR calculator" can discover the tool, see what it does, and be guided toward the course that includes it.

---

## What the Tools Are (And Are Not)

### They Are:
- **Educational demos** — simplified, focused versions of concepts that professionals work with
- **Practice environments** — safe spaces to enter data, make mistakes, and learn from results
- **Course companions** — designed to reinforce specific course content
- **Skill-building instruments** — usage is tracked and contributes to a verifiable skills portfolio

### They Are Not:
- **Production tax software** — results are illustrative and should never be used for actual filings
- **Professional advice engines** — the platform carries no professional liability
- **Replacements for enterprise tools** — they are intentionally simplified for learning

Every tool displays a disclaimer:

> *"This is a demo tool for learning purposes only. Results are illustrative and should not be used for actual tax filings or professional advice. Always consult qualified tax professionals for real-world applications."*

---

## What Has Been Built

### The Platform Infrastructure

The tools platform is a production-grade Next.js 14 application with:

- **Seamless authentication** — no visible login page. Users arrive from LearnWorlds, verify their email with a 6-digit code, and receive an encrypted session cookie (AES-256-GCM). There is no separate password to remember.
- **Course-based access control** — a user sees only the tools allocated to their enrolled courses. Unenrolled tools are completely invisible (not just locked — absent). Admins bypass all restrictions.
- **Persistent saved work** — learners can save their calculations, name them, and return to them across devices. If the database is temporarily unavailable, work falls back to browser storage.
- **Automatic skill detection** — every calculation, every completed workflow, every course completion is tracked and converted into skill evidence. No manual configuration needed per user.
- **QR-verified skills portfolio** — learners can print or PDF their skills matrix. A QR code is embedded that links to a public verification page, allowing anyone to confirm the skills are genuine. View counts are tracked.
- **Admin panel** — tool management, course-tool allocation, skill category configuration, activity monitoring, and a "student view" mode that lets admins preview the platform as different user types.
- **Journey tracking** — every tool session is instrumented (session start/end, step navigation, calculations, errors, completions). All tracking is fire-and-forget — it never blocks the user experience.
- **Standardised tool architecture** — every tool follows a consistent 4-file structure (types, utilities, component, exports), making it predictable and efficient to build new tools.

### The Six Current Tools

All six tools currently on the platform are in the **Pillar Two / GIR (GloBE Information Return)** domain, built to accompany MojiTax's Pillar Two courses. They represent the first course-tool bundle and demonstrate the full range of tool types the platform supports.

---

#### 1. GloBE Calculator
**Type:** Calculator | **Steps:** 3 | **What it practises:** The core Pillar Two calculation

Walks learners through the three-stage GloBE computation that multinationals must perform for each jurisdiction:

- **Step 1 — ETR Calculation**: Enter GloBE Income and Adjusted Covered Taxes. The tool calculates the Effective Tax Rate and classifies the jurisdiction (compliant at ≥15%, warning zone at 15–15.5%, low-taxed below 15%).
- **Step 2 — SBIE Exclusion**: Calculate the Substance-Based Income Exclusion using payroll costs and tangible asset values. Rates vary by fiscal year (decreasing transitional rates from 2024 to 2033).
- **Step 3 — Top-Up Tax**: Calculate the final top-up tax liability using excess profit, SBIE deduction, and optional QDMTT (Qualified Domestic Minimum Top-up Tax) offset.

Features multi-currency support (EUR, USD, GBP, CHF), fiscal year selection (2024–2033), MNE group context fields, step-wise unlocking (must complete each step before proceeding), and a save/load library for storing and revisiting calculations.

---

#### 2. Safe Harbour Qualifier
**Type:** Calculator | **Steps:** 1 (three parallel tests) | **What it practises:** Determining whether a jurisdiction qualifies for simplified treatment

Evaluates whether a jurisdiction meets any of the three Transitional CbCR Safe Harbour tests, which allow an MNE to skip full GloBE calculations for that jurisdiction:

- **De Minimis Test** — Revenue below €10M *and* profit below €1M (both must pass)
- **Simplified ETR Test** — ETR meets or exceeds the transitional rate (15% rising to 17% by year). Loss-making jurisdictions automatically qualify.
- **Routine Profits Test** — Profit does not exceed the SBIE (Substance-Based Income Exclusion) allowance

If any single test passes, the jurisdiction qualifies. The tool provides a clear visual breakdown of each test's result with pass/fail indicators.

---

#### 3. Filing Deadline Calculator
**Type:** Calculator | **Steps:** 1 | **What it practises:** Understanding GIR filing timelines and project planning

Takes a fiscal year end, filing jurisdiction, UPE (Ultimate Parent Entity) location, and first-filing status, then calculates:

- The standard filing deadline
- Any applicable extensions (18-month extension for first-year filers or certain jurisdictions)
- Days remaining until deadline
- A milestone timeline with six key preparation tasks (data collection, safe harbour assessment, GloBE calculations, internal review, XML generation, filing), each showing its status (pending, urgent, overdue, or due today)

Supports 11 jurisdictions: UK, Ireland, Netherlands, Germany, France, Switzerland, US, Australia, Japan, Singapore, and a generic "Other" option.

---

#### 4. GIR Practice Form
**Type:** Form | **Steps:** 3 (sections) | **What it practises:** Completing an actual GloBE Information Return

A structured walkthrough of the three sections of a GIR submission:

- **Section 1 — General Information**: MNE Group details, UPE identification, fiscal year, reporting currency, filing type (original or amended)
- **Section 2 — Entity Structure**: Define constituent entities with jurisdiction, tax ID, ownership percentage, entity type (UPE, Constituent Entity, PE, Joint Venture, Minority-Owned CE), and exclusion status
- **Section 3 — Jurisdiction Calculations**: For each jurisdiction, enter GloBE income components, covered taxes, and SBIE data. The tool auto-calculates ETR, excess profit, and net top-up amounts.

Includes built-in case studies for guided practice, a comprehensive data-point library with contextual help for every field, and search functionality across all fields.

---

#### 5. DFE Assessment Tool
**Type:** Calculator | **Steps:** 2 | **What it practises:** Evaluating which entity should file the GIR

Helps learners assess and score candidate entities for the Designated Filing Entity (DFE) role — the entity responsible for submitting the GIR on behalf of the MNE group. Candidates are scored on:

- Pillar Two implementation status in their jurisdiction (enacted / partial / announced / none)
- Tax team size and capability
- Systems capability (ERP-integrated, SAP, local systems, limited)
- Advisor support (Big 4, mid-tier, local, none)
- Data availability (0–5 scale)
- Prior GIR experience

Each candidate is ranked as **Recommended**, **Alternative**, or **Not Recommended** with colour-coded badges and detailed scoring breakdowns.

---

#### 6. Audit File Checklist
**Type:** Tracker/Checklist | **Steps:** 3 (modes) | **What it practises:** Preparing and organising GIR audit documentation

A comprehensive readiness tracker for GIR audit files, operating in three modes:

- **Setup** — Configure audit metadata (entity name, fiscal year, jurisdiction count, GIR filing status)
- **Dashboard** — Overview with completion percentage, critical item counts, and status summary
- **Checklist** — Detailed item-by-item view with filtering (all / incomplete / critical), search, notes per item, and priority levels (critical / high / medium)

Items are grouped into sections (Section 1 items, Section 2 items, Section 3 items, Elections, Safe Harbour, Controls) and can be marked as incomplete, in progress, complete, or not applicable. Includes case study pre-population and a gap analysis view for identifying outstanding items.

---

## How It All Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│                       THE MOJITAX ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LEARNWORLDS (mojitax.co.uk)        TOOLS (tools.mojitax.co.uk)   │
│   ┌───────────────────────┐          ┌───────────────────────┐     │
│   │ Courses & content     │          │ Demo calculators      │     │
│   │ Payments & billing    │◄────────►│ Practice forms        │     │
│   │ User identity         │   SSO    │ Assessment tools      │     │
│   │ Enrollment records    │   API    │ Checklists & trackers │     │
│   │ Certificates          │          │ Saved work            │     │
│   │ Progress tracking     │          │ Skills portfolio      │     │
│   └───────────────────────┘          └───────────────────────┘     │
│                                                                     │
│   WHO HAS ACCESS ──── LearnWorlds (source of truth)                │
│   WHAT THEY'VE DONE ─ Supabase database (tools platform)          │
│                                                                     │
│   FLOW:                                                             │
│   1. Learner purchases course on mojitax.co.uk                     │
│   2. Clicks "Access Tools" inside the course                       │
│   3. Arrives at tools.mojitax.co.uk (already identified)           │
│   4. Platform checks: what courses does this person have?          │
│   5. Shows only the tools allocated to their courses               │
│   6. Learner practises, saves work, builds skills portfolio        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Ownership

| LearnWorlds Owns | Tools Platform Owns |
|---|---|
| User identity & authentication | Saved calculations and form data |
| Course enrolments & payment status | Tool usage history and session logs |
| Course progress & certificates | Skill levels and evidence records |
| Subscription management | QR verification snapshots |

This split is deliberate. LearnWorlds is the commercial backbone (who has access, what they've paid for). The tools platform handles everything about what learners *do* with that access.

---

## The Skills Portfolio System

The skills portfolio is one of the platform's most distinctive features. It works automatically — no manual input from the learner or admin is required for basic functionality.

### How Skills Are Earned

| Evidence Type | Source | Example |
|---|---|---|
| **Course completed** | LearnWorlds course completion | "Completed Pillar Two Fundamentals" → Proficient in Pillar Two Knowledge |
| **Tool used** | Performing calculations in a tool | "Used GloBE Calculator 8 times" → Proficient in GloBE Calculations |
| **Work saved** | Saving named calculation sets | "Saved 5 practice scenarios" → Proficient in scenario management |

### How the Portfolio Looks

The Skills Matrix page organises skills into admin-defined categories. Each category has two dimensions:

- **Knowledge** — populated by course completions, showing what the learner understands
- **Application** — populated by tool usage, showing what the learner can do

Admins write the descriptions that appear in each cell (e.g., *"Has demonstrated understanding of Pillar Two fundamentals"* for knowledge, *"Can perform GloBE ETR calculations and identify low-taxed jurisdictions"* for application).

### Verification

When a learner prints their portfolio:
1. A unique token is generated and a snapshot of their current skills is stored
2. A QR code is embedded in the printed document
3. Anyone scanning the QR code is taken to a public verification page showing the snapshot
4. The platform tracks how many times each verification has been viewed

This turns the skills portfolio from a self-reported document into a verifiable credential.

---

## Scope and Limitations

### What the Platform Covers

- **Any tax domain** — the architecture supports tools across transfer pricing, VAT, FATCA/CRS, withholding tax, Pillar Two, PE assessment, and cross-category topics. The tool registry defines 7 categories and 9 tool types.
- **Multiple tool types** — calculators, forms, validators, search tools, generators, trackers, reference libraries, external links, and spreadsheets are all supported types in the registry.
- **Any number of courses** — course-tool allocations are many-to-many. One tool can serve multiple courses; one course can include multiple tools. Bundles and subscriptions inherit their constituent courses' tools.

### Current Scope

The platform currently has **6 tools**, all in the Pillar Two / GIR domain. These were built as the companion tools for MojiTax's Pillar Two courses and represent the first complete course-tool bundle. They cover:

- Core GloBE calculation workflows (calculator)
- Safe harbour qualification assessment (calculator)
- Filing timeline management (calculator)
- GIR form completion practice (form)
- Filing entity evaluation (calculator)
- Audit readiness tracking (checklist/tracker)

### Known Limitations

| Limitation | Context |
|---|---|
| **No production-grade outputs** | Tools produce illustrative results only. No XML generation, no filing-ready documents, no official form output. |
| **No live data sources** | Tools use learner-entered data and pre-built case studies. There are no connections to live tax databases, real GIIN registries, or treaty rate APIs. |
| **No AI or adaptive feedback** | Tools calculate and display results but do not use AI to evaluate a learner's approach or suggest improvements. Feedback is structural (pass/fail, threshold-based), not pedagogical. |
| **No offline mode** | The platform requires an internet connection. The localStorage fallback only covers saved work persistence, not full tool functionality. |
| **No mobile-native experience** | The platform is responsive but optimised for desktop use. Complex multi-step tools work best on larger screens. |
| **No test suite** | The codebase does not have automated tests. Verification relies on manual testing via the checklist in the tool creation guide. |
| **Single LMS integration** | The platform is built for LearnWorlds specifically. Supporting a different LMS would require reworking the authentication and enrolment systems. |
| **English only** | All tools, UI, and content are in English. There is no internationalisation framework in place. |

---

## How New Tools Get Built

The platform has a standardised, documented process for adding tools. At a high level:

1. **A course designer decides** what tools should accompany a course and what each tool should do
2. **A developer builds** the tool as a self-contained React component following the 4-file convention (types, utilities, component, exports) and registers it in the platform
3. **An admin configures** the tool's metadata, allocates it to the right courses, and optionally maps it to skill categories
4. **The platform handles the rest** — access control, tracking, skill progression, save/load, and portfolio integration all work automatically once a tool is registered

The full developer process is documented in [`docs/TOOL-CREATION-GUIDE.md`], and the admin/setup process is documented in [`docs/HOW-TO-USE.md`].

---

## Technical Foundation (Summary)

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React, TypeScript | Application framework and UI |
| **Styling** | Tailwind CSS with MojiTax brand tokens | Visual design |
| **Database** | Supabase (PostgreSQL with Row-Level Security) | Tool data, user work, skills, tracking |
| **Authentication** | LearnWorlds SSO + email verification + AES-256-GCM encrypted cookies | Identity and session management |
| **State management** | React Context (auth, student-view), TanStack Query (server state), React Hook Form + Zod (forms) | Client-side data flow |
| **ORM / Queries** | Drizzle ORM (migrations), Supabase JS client (runtime) | Database access |
| **Hosting** | Replit (current), portable to Vercel/Railway | Deployment |

The database schema includes 14 tables covering tools, course allocations, admin users, usage logs, saved work, skills, skill categories, skill progress, tool projects, course completions, skill verifications, and activity logs.

---

## In Summary

MojiTax Tools is a platform that turns professional tax courses into hands-on learning experiences. It gives learners a safe place to practise the calculations, assessments, forms, and checklists that professionals work with — and automatically builds a verifiable record of their growing competence.

It is educational by design and educational by disclaimer. The tools are simplified, the data is illustrative, and the results carry no professional weight. But the workflows are real, the structures mirror professional practice, and the skill progression gives learners something tangible to show for their effort.

The platform is built to grow with MojiTax's course catalogue. Every new course can bring its own set of companion tools. The architecture, tracking, skills system, and access control are all in place — what scales is the content.

---

*Document version: 1.0*
*Platform version: Production (6 tools, Pillar Two domain)*
*Date: February 2026*
