# MojiTax Tools Platform - Master Build Plan v2

## Executive Summary

A course-companion platform providing **demo tools for learning purposes** that enhance MojiTax professional tax courses. Users who purchase courses on LearnWorlds automatically gain access to practical demo tools on tools.mojitax.co.uk. No separate login, no separate purchase – tools are bundled with course access.

**What are Demo Tools?** Simplified, educational versions of professional tax tools designed to help learners understand concepts, practice calculations, and build confidence before using enterprise-grade software in their careers.

**Core Principle:** When you build a course, you build its demo tools alongside it.

**Tech Stack:** LearnWorlds (LMS + Auth + Payments) + Supabase (Tools Backend + User Data) + Vercel/Railway (Tools Frontend)

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOJITAX ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LEARNWORLDS                           TOOLS PLATFORM                   │
│   mojitax.co.uk                         tools.mojitax.co.uk              │
│   ┌─────────────────────────┐           ┌─────────────────────────┐     │
│   │                         │           │                         │     │
│   │  📚 Courses & Content   │    SSO    │  🧮 Demo Calculators    │     │
│   │  💳 Payments            │◄─────────►│  🔍 Demo Search Tools   │     │
│   │  👥 User Management     │    API    │  ✅ Demo Validators     │     │
│   │  🎓 Certificates        │           │  📄 Demo Doc Generators │     │
│   │  📊 Progress Tracking   │           │  📋 Demo Trackers       │     │
│   │                         │           │  📖 Reference Libraries │     │
│   └─────────────────────────┘           └─────────────────────────┘     │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      HOW IT WORKS                                │   │
│   │                                                                  │   │
│   │  1. User purchases "Transfer Pricing Fundamentals" course       │   │
│   │  2. User clicks "Access Course Tools" button in LearnWorlds     │   │
│   │  3. SSO redirects to tools.mojitax.co.uk (already logged in)    │   │
│   │  4. Tools platform checks API: "What courses does user have?"   │   │
│   │  5. User sees only the demo tools linked to their courses       │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## What Are Demo Tools?

Demo tools are **educational, simplified versions** of professional tax software. They are designed for learning, not production use.

| Aspect | Enterprise Tools | MojiTax Demo Tools |
|--------|------------------|-------------------|
| **Purpose** | Production tax work | Learning & practice |
| **Complexity** | Full-featured, complex | Simplified, focused |
| **Data** | Live client data | Sample/practice data |
| **Output** | Official documents | Learning exercises |
| **Liability** | Professional responsibility | Educational only |
| **Audience** | Working professionals | Students & learners |

**Disclaimer on every tool:**
> *"This is a demo tool for learning purposes only. Results are illustrative and should not be used for actual tax filings or professional advice. Always consult qualified tax professionals for real-world applications."*

---

## Why This Approach

| Simulator Approach (Old) | Course-Companion Approach (New) |
|--------------------------|--------------------------------|
| Separate platform with own login | Single ecosystem, SSO |
| Separate pricing/subscriptions | Demo tools included with courses |
| Complex AI evaluation system | Simple, practical demo tools |
| Email simulation, task system | Direct tool access |
| Build courses, then tasks, then tools | Build courses + demo tools together |
| Users learn new platform | Users stay in familiar LMS |
| High development complexity | Lean, focused development |

**Bottom line:** LearnWorlds handles auth, payments, and course delivery. The tools platform provides practical demo utilities for hands-on learning.

---

## Data Ownership: Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA OWNERSHIP                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEARNWORLDS (Source of Truth)     SUPABASE (User's Work)       │
│  ┌─────────────────────────┐       ┌─────────────────────────┐  │
│  │ • User identity         │       │ • Saved calculations    │  │
│  │ • Course enrollments    │       │ • Tracker entries       │  │
│  │ • Payment status        │       │ • User preferences      │  │
│  │ • Course progress       │       │ • Tool usage history    │  │
│  │ • Certificates          │       │ • Bookmarks/favorites   │  │
│  │ • Subscription status   │       │ • Practice scenarios    │  │
│  └─────────────────────────┘       └─────────────────────────┘  │
│            │                                   │                 │
│            │      User logs in via SSO         │                 │
│            └──────────────┬────────────────────┘                 │
│                           ▼                                      │
│              Tools platform knows WHO you are                    │
│              (from LearnWorlds) and WHAT you've saved            │
│              (from Supabase)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this split?**
- **LearnWorlds** = Who has access (don't duplicate this)
- **Supabase** = What they've done in the tools (their learning progress)

**User benefit:** "Pick up where you left off" - learners can save practice calculations, track their learning progress, and revisit their work.

---

## Public Pages & Access Control

Every demo tool has **two states**: public preview and authenticated access.

### Public View (Not Logged In)

```
┌─────────────────────────────────────────────────────────────────┐
│  tools.mojitax.co.uk/tp-margin-calculator                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🧮 Transfer Pricing Margin Calculator                           │
│  Demo Tool for Learning                                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Practice calculating arm's length margins:                      │
│  • Gross profit margins                                          │
│  • Operating margins (TNMM)                                      │
│  • Cost-plus markups                                             │
│  • Berry ratios                                                  │
│                                                                  │
│  This demo tool helps you understand how transfer pricing        │
│  professionals analyse intercompany transactions.                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Screenshot or animated preview of the tool in action]    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🔒 ACCESS THIS DEMO TOOL                                  │ │
│  │                                                            │ │
│  │  This tool is included with:                               │ │
│  │                                                            │ │
│  │  📚 Transfer Pricing Fundamentals Course                   │ │
│  │  📦 Transfer Pricing Professional Bundle                   │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │         [Get Access - View Course →]                 │ │ │
│  │  │         Links to mojitax.co.uk                       │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Already enrolled? [Log in with MojiTax account]           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ⚠️ Demo tool for learning purposes only.                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Authenticated View (Logged In with Access)

```
┌─────────────────────────────────────────────────────────────────┐
│  tools.mojitax.co.uk/tp-margin-calculator          [Your Account]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🧮 Transfer Pricing Margin Calculator                           │
│  Demo Tool for Learning                                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Revenue:              [£ 1,000,000        ]                     │
│  Cost of Goods Sold:   [£   600,000        ]                     │
│  Operating Expenses:   [£   250,000        ]                     │
│                                                                  │
│  TP Method:            [TNMM (Operating Margin) ▼]               │
│                                                                  │
│  [Calculate]                                                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  RESULTS                                                   │ │
│  │                                                            │ │
│  │  Gross Margin:        40.0%                                │ │
│  │  Operating Margin:    15.0%                                │ │
│  │  Cost Plus Markup:    66.7%                                │ │
│  │  Berry Ratio:         1.60                                 │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Save Calculation] [Download PDF] [Clear] [Back to Course]      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  📁 Your Saved Calculations (3)                                  │
│  • Practice Scenario A - saved 2 days ago                        │
│  • Module 3 Exercise - saved 1 week ago                          │
│  • Client X Example - saved 2 weeks ago                          │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ⚠️ Demo tool for learning purposes only. Results are            │
│  illustrative and should not be used for actual tax filings.     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Benefits of Public Pages

| Benefit | How |
|---------|-----|
| **SEO** | Public pages get indexed by Google - "transfer pricing calculator" |
| **Marketing** | Users discover tools, see value before buying courses |
| **Lead generation** | "Get Access" button → LearnWorlds course page |
| **Upselling** | Show locked tools to encourage more course purchases |
| **Trust** | Users see exactly what they're getting with the course |
| **Social sharing** | Learners can share tool links with colleagues |

---

## Tools Homepage

### Public View (Not Logged In)

```
┌─────────────────────────────────────────────────────────────────┐
│  tools.mojitax.co.uk                              [Log in]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MojiTax Demo Tools                                              │
│  Practical learning tools for international tax professionals    │
│                                                                  │
│  These demo tools are included with MojiTax professional         │
│  courses. Practice real-world tax scenarios in a safe            │
│  learning environment.                                           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  TRANSFER PRICING                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 🧮 Margin    │  │ 🔍 Comparable│  │ 📄 TP Doc    │           │
│  │ Calculator   │  │ Search       │  │ Generator    │           │
│  │ Demo         │  │ Demo         │  │ Demo         │           │
│  │ [Preview]    │  │ [Preview]    │  │ [Preview]    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  VAT & INDIRECT TAX                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 🧮 VAT Rate  │  │ ✅ VAT Number│  │ 📋 OSS      │           │
│  │ Calculator   │  │ Validator    │  │ Tracker      │           │
│  │ Demo         │  │ Demo         │  │ Demo         │           │
│  │ [Preview]    │  │ [Preview]    │  │ [Preview]    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  FATCA & CRS                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 🔍 GIIN      │  │ 📄 W-8 Form  │  │ 📖 Entity    │           │
│  │ Search       │  │ Helper       │  │ Classifier   │           │
│  │ Demo         │  │ Demo         │  │ Demo         │           │
│  │ [Preview]    │  │ [Preview]    │  │ [Preview]    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🎓 Get access to these demo tools with MojiTax courses          │
│                                                                  │
│  [Browse Courses at mojitax.co.uk →]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Authenticated View (Logged In)

```
┌─────────────────────────────────────────────────────────────────┐
│  tools.mojitax.co.uk                    Welcome, Sarah [Account] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Your Demo Tools                                                 │
│  Based on your enrolled courses                                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ✅ YOUR TOOLS (Transfer Pricing Fundamentals)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 🧮 Margin    │  │ 🔍 Comparable│  │ 📄 TP Doc    │           │
│  │ Calculator   │  │ Search       │  │ Generator    │           │
│  │              │  │              │  │              │           │
│  │ [Open Tool]  │  │ [Open Tool]  │  │ [Open Tool]  │           │
│  │ 3 saved      │  │ 1 saved      │  │ New!         │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🔒 UNLOCK MORE TOOLS                                            │
│                                                                  │
│  VAT & Indirect Tax Tools (4 demo tools)                         │
│  Included with: VAT Compliance Masterclass                       │
│  [View Course →]                                                 │
│                                                                  │
│  FATCA/CRS Tools (3 demo tools)                                  │
│  Included with: FATCA Essentials                                 │
│  [View Course →]                                                 │
│                                                                  │
│  Pillar Two Tools (3 demo tools)                                 │
│  Included with: Global Minimum Tax Course                        │
│  [View Course →]                                                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  [Back to My Courses at mojitax.co.uk]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DISCOVERY (Public)                                              │
│  ─────────────────                                               │
│  User searches "transfer pricing margin calculator"              │
│         │                                                        │
│         ▼                                                        │
│  Finds tools.mojitax.co.uk/tp-margin-calculator via Google       │
│         │                                                        │
│         ▼                                                        │
│  Sees public preview: "Demo Tool - Practice TP margin            │
│  calculations. Included with Transfer Pricing Fundamentals."     │
│         │                                                        │
│         ▼                                                        │
│  Clicks [Get Access] → mojitax.co.uk/course/tp-fundamentals      │
│         │                                                        │
│         ▼                                                        │
│  Purchases course on LearnWorlds                                 │
│                                                                  │
│  LEARNING (In Course)                                            │
│  ────────────────────                                            │
│  User progresses through course modules                          │
│         │                                                        │
│         ▼                                                        │
│  Module 3: "Now practice with the TP Margin Calculator"          │
│         │                                                        │
│         ▼                                                        │
│  Clicks [Open Demo Tool] in course                               │
│         │                                                        │
│         ▼                                                        │
│  SSO redirect → tools.mojitax.co.uk (already logged in)          │
│                                                                  │
│  PRACTICE (Authenticated)                                        │
│  ────────────────────────                                        │
│  User practices with demo tool                                   │
│         │                                                        │
│         ▼                                                        │
│  Saves calculation: "Module 3 Exercise"                          │
│         │                                                        │
│         ▼                                                        │
│  Data saved to Supabase (linked to user email)                   │
│         │                                                        │
│         ▼                                                        │
│  Clicks [Back to Course] → returns to LearnWorlds                │
│                                                                  │
│  RETURN VISIT                                                    │
│  ────────────                                                    │
│  User returns to tools.mojitax.co.uk weeks later                 │
│         │                                                        │
│         ▼                                                        │
│  Logs in via SSO                                                 │
│         │                                                        │
│         ▼                                                        │
│  Sees dashboard with all saved work intact                       │
│         │                                                        │
│         ▼                                                        │
│  Can continue practicing, review old calculations                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Authentication: LearnWorlds SSO

```
┌──────────────────────────────────────────────────────────────────┐
│                        SSO FLOW                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User clicks "Log in"              tools.mojitax.co.uk           │
│  on tools site                                                   │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────┐         ┌─────────────────┐                 │
│  │  LearnWorlds    │ ──────► │  Tools App      │                 │
│  │  SSO Redirect   │  token  │  Validates      │                 │
│  │  with JWT/Token │         │  Creates Session│                 │
│  └─────────────────┘         └─────────────────┘                 │
│                                      │                            │
│                                      ▼                            │
│                              User is logged in                    │
│                              No separate password                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Authorization: API-Based Access Check

```javascript
// When user accesses a demo tool
async function checkToolAccess(userEmail, toolSlug) {
  // 1. Get tool info and required courses
  const tool = await db.tools.findBySlug(toolSlug);
  const requiredProducts = await db.courseTools.findByToolId(tool.id);
  
  // 2. Call LearnWorlds API to get user's enrollments
  const userEnrollments = await learnworldsAPI.getUserProducts(userEmail);
  
  // 3. Check if user has any of the required products
  const hasAccess = requiredProducts.some(product => 
    userEnrollments.includes(product.learnworlds_product_id)
  );
  
  return {
    hasAccess,
    tool,
    requiredProducts  // For showing "Get Access" options if locked
  };
}
```

**Access is always real-time** – no sync issues, no webhooks needed for access control.

---

## Course-Tool Mapping Structure

### Conceptual Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  COURSE → DEMO TOOLS RELATIONSHIP                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COURSE CATEGORY          COURSES              DEMO TOOLS        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Transfer Pricing    ┌─► TP Fundamentals ──┬─► Margin Calculator │
│                      │                     ├─► Comparable Search │
│                      │                     └─► TP Doc Generator  │
│                      │                                           │
│                      └─► TP Advanced ──────┬─► All above, plus:  │
│                                            ├─► Benchmarking Tool │
│                                            └─► CbCR Generator    │
│                                                                  │
│  VAT/Indirect Tax    ┌─► VAT Fundamentals ─┬─► VAT Calculator    │
│                      │                     ├─► VIES Validator    │
│                      │                     └─► Rate Lookup       │
│                      │                                           │
│                      └─► OSS Compliance ───┬─► OSS Calculator    │
│                                            └─► Threshold Tracker │
│                                                                  │
│  FATCA/CRS           ─► FATCA Essentials ──┬─► GIIN Search       │
│                                            ├─► W-8 Form Helper   │
│                                            └─► Classification    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- =====================================================
-- TOOLS PLATFORM SCHEMA (Supabase)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- TOOL DEFINITIONS
-- ─────────────────────────────────────────────────────

CREATE TABLE tools (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  short_description TEXT,  -- For cards/previews
  tool_type       TEXT NOT NULL CHECK (tool_type IN (
                    'calculator', 'search', 'validator', 
                    'generator', 'tracker', 'reference'
                  )),
  category        TEXT,  -- 'transfer_pricing', 'vat', 'fatca_crs', etc.
  icon            TEXT,
  preview_image   TEXT,  -- Screenshot for public page
  config          JSONB NOT NULL,  -- Tool-specific configuration
  is_active       BOOLEAN DEFAULT true,
  is_public       BOOLEAN DEFAULT true,  -- Show on public tools page
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- COURSE-TOOL MAPPING
-- ─────────────────────────────────────────────────────

CREATE TABLE course_tools (
  id                      SERIAL PRIMARY KEY,
  learnworlds_product_id  TEXT NOT NULL,  -- Course/Bundle ID from LearnWorlds
  product_name            TEXT,            -- For display/admin reference
  product_url             TEXT,            -- Link to mojitax.co.uk course page
  tool_id                 TEXT REFERENCES tools(id) ON DELETE CASCADE,
  created_at              TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(learnworlds_product_id, tool_id)
);

-- ─────────────────────────────────────────────────────
-- USER DATA (Stored in Supabase, not LearnWorlds)
-- ─────────────────────────────────────────────────────

-- User's saved calculations and work
CREATE TABLE user_saved_items (
  id              SERIAL PRIMARY KEY,
  user_email      TEXT NOT NULL,  -- From LearnWorlds SSO
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  item_name       TEXT NOT NULL,
  item_data       JSONB NOT NULL,  -- The saved inputs/results
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Tracker entries (for tracker-type tools)
CREATE TABLE user_tracker_entries (
  id              SERIAL PRIMARY KEY,
  user_email      TEXT NOT NULL,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  entry_data      JSONB NOT NULL,
  entry_date      DATE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  user_email      TEXT PRIMARY KEY,
  preferences     JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Tool usage analytics (optional)
CREATE TABLE tool_usage_log (
  id              SERIAL PRIMARY KEY,
  user_email      TEXT,
  tool_id         TEXT REFERENCES tools(id),
  action          TEXT,  -- 'view', 'calculate', 'save', 'export'
  metadata        JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- REFERENCE DATA (Static data for tools)
-- ─────────────────────────────────────────────────────

CREATE TABLE ref_vat_rates (
  id              SERIAL PRIMARY KEY,
  country_code    TEXT NOT NULL,
  country_name    TEXT NOT NULL,
  standard_rate   DECIMAL(5,2),
  reduced_rates   JSONB,
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ref_treaty_rates (
  id              SERIAL PRIMARY KEY,
  source_country  TEXT NOT NULL,
  target_country  TEXT NOT NULL,
  dividend_rate   DECIMAL(5,2),
  interest_rate   DECIMAL(5,2),
  royalty_rate    DECIMAL(5,2),
  treaty_ref      TEXT,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────

CREATE INDEX idx_user_saved_items_email ON user_saved_items(user_email);
CREATE INDEX idx_user_saved_items_tool ON user_saved_items(tool_id);
CREATE INDEX idx_user_tracker_entries_email ON user_tracker_entries(user_email);
CREATE INDEX idx_course_tools_product ON course_tools(learnworlds_product_id);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_slug ON tools(slug);
```

---

## Demo Tool Templates (6 Types)

Each demo tool type is a reusable template. Creating a new tool = configuring the template, not writing new code.

### 1. Calculator (Demo)

**Purpose:** Help learners practice calculations and understand formulas.

```
┌─────────────────────────────────────────────────────────────┐
│  CALCULATOR TEMPLATE                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Input Fields (configured per tool)                 │     │
│  │  • Numeric inputs with validation                   │     │
│  │  • Dropdowns for options                            │     │
│  │  • Date pickers                                     │     │
│  │  • Currency selectors                               │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Calculation Engine                                 │     │
│  │  • Formula defined in config                        │     │
│  │  • Shows working/steps (educational)                │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Results Display                                    │     │
│  │  • Key figures highlighted                          │     │
│  │  • Breakdown/explanation                            │     │
│  │  • "How this was calculated" section                │     │
│  │  • Save / Export to PDF                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • TP Margin Calculator                                      │
│  • VAT Calculator                                            │
│  • Withholding Tax Calculator                                │
│  • Pillar Two ETR Calculator                                 │
│  • FTC Limitation Calculator                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Search Tool (Demo)

**Purpose:** Help learners practice finding information and understand data sources.

```
┌─────────────────────────────────────────────────────────────┐
│  SEARCH TEMPLATE                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Search Interface                                   │     │
│  │  • Text search                                      │     │
│  │  • Filters (country, type, date range)              │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Data Source (Demo Data)                            │     │
│  │  • Static JSON (bundled sample data)                │     │
│  │  • Clearly marked as demo/sample                    │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Results Display                                    │     │
│  │  • Table with sorting                               │     │
│  │  • Detail view on click                             │     │
│  │  • Export option                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • GIIN Search (sample FFI data)                             │
│  • Treaty Rate Lookup                                        │
│  • VAT Rate by Country                                       │
│  • TP Comparable Search (sample companies)                   │
│  • DST Threshold Lookup                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Validator (Demo)

**Purpose:** Help learners understand validation rules and format requirements.

```
┌─────────────────────────────────────────────────────────────┐
│  VALIDATOR TEMPLATE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Input                                              │     │
│  │  • Single value input                               │     │
│  │  • Batch input (paste multiple)                     │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Validation Logic                                   │     │
│  │  • Format check (regex)                             │     │
│  │  • Checksum validation                              │     │
│  │  • Shows validation rules (educational)             │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Result                                             │     │
│  │  • Valid / Invalid with explanation                 │     │
│  │  • Format breakdown                                 │     │
│  │  • "Why this is valid/invalid"                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • EU VAT Number Validator                                   │
│  • GIIN Format Validator                                     │
│  • EORI Number Checker                                       │
│  • TIN Format Validator                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Document Generator (Demo)

**Purpose:** Help learners understand document structure and required content.

```
┌─────────────────────────────────────────────────────────────┐
│  DOCUMENT GENERATOR TEMPLATE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Input Form                                         │     │
│  │  • Entity details (sample/practice)                 │     │
│  │  • Transaction information                          │     │
│  │  • Guided inputs with tooltips                      │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Template Engine                                    │     │
│  │  • Shows document structure                         │     │
│  │  • Explains each section                            │     │
│  │  • Highlights required vs optional                  │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Output                                             │     │
│  │  • Preview with annotations                         │     │
│  │  • Download as PDF (marked "SAMPLE")                │     │
│  │  • Save draft for later                             │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • TP Policy Memo Template                                   │
│  • Intercompany Agreement Outline                            │
│  • W-8BEN-E Form Helper                                      │
│  • CRS Self-Certification Guide                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5. Tracker (Demo)

**Purpose:** Help learners understand compliance thresholds and monitoring.

```
┌─────────────────────────────────────────────────────────────┐
│  TRACKER TEMPLATE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Data Entry                                         │     │
│  │  • Add entries (sales, days, transactions)          │     │
│  │  • Import sample data                               │     │
│  │  • Pre-loaded practice scenarios                    │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Dashboard                                          │     │
│  │  • Progress toward thresholds                       │     │
│  │  • Visual indicators                                │     │
│  │  • Explains significance of thresholds              │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Scenarios                                          │     │
│  │  • "What if" analysis                               │     │
│  │  • Load practice scenarios                          │     │
│  │  • Save progress                                    │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • VAT Registration Threshold Tracker                        │
│  • Economic Nexus Sales Tracker (US)                         │
│  • PE Risk Day Counter                                       │
│  • OSS Threshold Monitor                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Reference Library (Demo)

**Purpose:** Provide searchable reference content alongside courses.

```
┌─────────────────────────────────────────────────────────────┐
│  REFERENCE TEMPLATE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Components:                                                 │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Navigation                                         │     │
│  │  • Table of contents                                │     │
│  │  • Search within content                            │     │
│  │  • Bookmarking                                      │     │
│  └────────────────────────────────────────────────────┘     │
│                         │                                    │
│                         ▼                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Content                                            │     │
│  │  • Formatted summaries                              │     │
│  │  • Tables, flowcharts                               │     │
│  │  • Links to official sources                        │     │
│  │  • Practice questions                               │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  DEMO TOOL EXAMPLES:                                         │
│  • OECD TP Guidelines Summary                                │
│  • Treaty Article Quick Reference                            │
│  • FATCA Entity Classification Guide                         │
│  • Pillar Two GloBE Rules Overview                           │
│  • VAT Place of Supply Flowchart                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      SIMPLIFIED STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND (tools.mojitax.co.uk)                              │
│  ├── Next.js (React framework)                               │
│  ├── Tailwind CSS                                            │
│  ├── Hosted on Vercel or Railway                             │
│  └── Demo tool templates rendered from config                │
│                                                              │
│  BACKEND                                                     │
│  ├── Supabase                                                │
│  │   ├── PostgreSQL (tool configs, user saved work)          │
│  │   ├── Auth (session management after SSO)                 │
│  │   ├── Storage (user exports, if needed)                   │
│  │   └── Edge Functions (LearnWorlds API calls)              │
│  │                                                           │
│  └── LearnWorlds API                                         │
│      ├── SSO authentication                                  │
│      └── User enrollment/product access checks               │
│                                                              │
│  DATA                                                        │
│  ├── Static JSON files for reference data                    │
│  ├── Database for tool configurations                        │
│  └── User-specific data (saved work, tracker entries)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Build Phases

### Phase 0: Foundation (Week 1)
- [ ] Set up Supabase project
- [ ] Set up Next.js project for tools.mojitax.co.uk
- [ ] Configure LearnWorlds SSO integration
- [ ] Deploy basic page confirming SSO works
- [ ] Set up database schema
- [ ] Create basic layout with MojiTax branding

**Deliverable:** User can click from LearnWorlds, land on tools.mojitax.co.uk logged in

---

### Phase 1: Public Pages & Access Control (Week 1-2)
- [ ] Build public tool preview pages
- [ ] Create "Get Access" → mojitax.co.uk redirect flow
- [ ] Build LearnWorlds API integration (get user enrollments)
- [ ] Create course-tool mapping in database
- [ ] Build middleware for access checking
- [ ] Create authenticated tools dashboard

**Deliverable:** Public pages visible, access control working

---

### Phase 2: First Demo Tool - Calculator (Week 2)
- [ ] Build Calculator template component
- [ ] Create configuration schema for calculators
- [ ] Build first demo tool: TP Margin Calculator
- [ ] Add "How it works" educational explanations
- [ ] Add save/load functionality
- [ ] Add PDF export with "DEMO" watermark

**Deliverable:** Working demo calculator with save functionality

---

### Phase 3: Search & Validator Templates (Week 3)
- [ ] Build Search template component
- [ ] Build Validator template component
- [ ] Create VAT Rate Lookup (demo search)
- [ ] Create VAT Number Validator (demo validator)
- [ ] Populate sample/demo data
- [ ] Add educational tooltips

**Deliverable:** Two more demo tool types working

---

### Phase 4: Document Generator Template (Week 4)
- [ ] Build Document Generator template
- [ ] Create template system for documents
- [ ] Build first generator: TP Policy Memo
- [ ] Add PDF download with "SAMPLE ONLY" watermark
- [ ] Add section explanations

**Deliverable:** Users can generate practice documents

---

### Phase 5: Tracker & Reference Templates (Week 4-5)
- [ ] Build Tracker template with data persistence
- [ ] Build Reference template with navigation
- [ ] Create OSS Threshold Tracker demo
- [ ] Create OECD TP Guidelines Reference
- [ ] Add practice scenarios for trackers

**Deliverable:** All 6 demo tool templates complete

---

### Phase 6: Polish & Integration (Week 5-6)
- [ ] Add "Back to Course" deep links
- [ ] Add tool usage analytics
- [ ] Optimize mobile experience
- [ ] Add loading states, error handling
- [ ] Create admin interface for course-tool mappings
- [ ] SEO optimization for public pages

**Deliverable:** Production-ready demo tools platform

---

### Phase 7: Content Population (Ongoing)
- [ ] Build out demo tools for each course
- [ ] Populate reference data (VAT rates, treaty rates, etc.)
- [ ] Create practice scenarios
- [ ] Add contextual help within tools

---

## First Course + Demo Tools Bundle

### Recommended: Transfer Pricing Fundamentals

**Course Modules:**
1. Introduction to Transfer Pricing
2. The Arm's Length Principle
3. Transfer Pricing Methods
4. Comparability Analysis
5. Documentation Requirements
6. Dispute Resolution

**Companion Demo Tools:**

| Demo Tool | Type | Learning Purpose |
|-----------|------|------------------|
| TP Margin Calculator | Calculator | Practice calculating margins, understand TNMM |
| Method Selector Guide | Reference | Learn which TP method applies when |
| Comparable Search (Demo) | Search | Understand comparability analysis process |
| TP Documentation Checklist | Tracker | Learn what's required for Local/Master File |

---

## Cost Estimates

| Service | Free Tier | Growth | Notes |
|---------|-----------|--------|-------|
| Supabase | 50K MAU, 500MB | $25/mo | Database + Auth + Storage |
| Vercel | 100GB bandwidth | $20/mo | Frontend hosting |
| LearnWorlds API | Included | Included | With Learning Center plan |
| **Total** | **~$0** | **~$45/mo** | Much simpler than simulator |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Public page → Course conversion | >5% |
| SSO login success rate | >99% |
| Tool load time | <2 seconds |
| Course-to-tool click-through | >30% of enrolled users |
| Saved calculations per user | >3 average |
| Return visits to tools | >40% of users |

---

## Key Disclaimers (On Every Tool)

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ DEMO TOOL FOR LEARNING PURPOSES                          │
│                                                              │
│  This is an educational demo tool designed to help you       │
│  understand tax concepts and practice calculations.          │
│                                                              │
│  • Results are illustrative only                             │
│  • Do not use for actual tax filings                         │
│  • Do not use for professional advice                        │
│  • Always consult qualified tax professionals                │
│                                                              │
│  Sample data is fictional and for practice only.             │
└─────────────────────────────────────────────────────────────┘
```

---

## Questions Resolved ✓

| Question | Decision |
|----------|----------|
| Own database for user data? | Yes - Supabase stores saved work, LearnWorlds stores identity/access |
| Public pages? | Yes - with "Get Access" → mojitax.co.uk redirect |
| Tool positioning? | Demo tools for learning purposes |

## Questions Still Open

1. **LearnWorlds SSO Method** – Custom JWT, SAML, or OpenID Connect?
2. **Branding** – Match mojitax.co.uk exactly or distinct "tools" sub-brand?
3. **Mobile app** – Any plans to make tools available in mobile app?

---

*Plan Version: 2.1*
*Created: December 2024*
*Approach: Course-Companion Demo Tools Platform*
*Positioning: Learning tools, not production software*
