# MojiTax Demo Tools - Developer Plan & Architecture

## Overview

This document provides the technical architecture and step-by-step build plan for the MojiTax Demo Tools platform. The approach is **modular** - we build the dashboard container first, then incrementally add tools as integrated components (not iframes).

---

## Build Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULAR BUILD APPROACH                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. BUILD THE CONTAINER FIRST                                    │
│     Dashboard, navigation, admin panel, auth structure           │
│     ↓                                                            │
│  2. ADD TOOLS INCREMENTALLY                                      │
│     Each tool is a self-contained module                         │
│     ↓                                                            │
│  3. CONNECT TO LEARNWORLDS                                       │
│     SSO + access control after core is working                   │
│     ↓                                                            │
│  4. POLISH & LAUNCH                                              │
│     Public pages, testing, go-live                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Why this order?**
- Dashboard structure won't change when adding tools
- Developers can work on tools independently
- Admin can test tool management before LearnWorlds integration
- Reduces risk - core platform works before external dependencies

---

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (Next.js App)                                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  /app                                                      │  │
│  │  ├── /(public)           # Public pages (no auth)          │  │
│  │  │   ├── /tools          # Public tools listing            │  │
│  │  │   └── /tools/[slug]   # Public tool preview             │  │
│  │  │                                                         │  │
│  │  ├── /(auth)             # Authenticated user pages        │  │
│  │  │   ├── /dashboard      # User's tools dashboard          │  │
│  │  │   └── /tools/[slug]   # Full tool access                │  │
│  │  │                                                         │  │
│  │  ├── /(admin)            # Admin-only pages                │  │
│  │  │   ├── /admin          # Admin dashboard                 │  │
│  │  │   ├── /admin/tools    # Tool management                 │  │
│  │  │   └── /admin/courses  # Course-tool mapping             │  │
│  │  │                                                         │  │
│  │  └── /api                # API routes                      │  │
│  │                                                            │  │
│  │  /components                                               │  │
│  │  ├── /tools              # Tool components (THE TOOLS!)    │  │
│  │  │   ├── /calculator     # Calculator template             │  │
│  │  │   ├── /search         # Search template                 │  │
│  │  │   ├── /validator      # Validator template              │  │
│  │  │   ├── /generator      # Document generator template     │  │
│  │  │   ├── /tracker        # Tracker template                │  │
│  │  │   └── /reference      # Reference library template      │  │
│  │  │                                                         │  │
│  │  ├── /dashboard          # Dashboard components            │  │
│  │  ├── /admin              # Admin components                │  │
│  │  └── /ui                 # Shared UI components            │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  BACKEND (Supabase)                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL Database                                     │  │
│  │  • Row Level Security (RLS)                                │  │
│  │  • Edge Functions (LearnWorlds API calls)                  │  │
│  │  • Storage (attachments)                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Tools Are Integrated (Not Iframed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL INTEGRATION MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Each tool is a REACT COMPONENT that:                            │
│  • Lives in /components/tools/[tool-type]/[tool-name]            │
│  • Receives config from database                                 │
│  • Is rendered by a dynamic page route                           │
│  • Shares common UI components and utilities                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /app/(auth)/tools/[slug]/page.tsx                       │    │
│  │                                                          │    │
│  │  export default function ToolPage({ params }) {          │    │
│  │    const tool = await getToolBySlug(params.slug);        │    │
│  │    const ToolComponent = getToolComponent(tool.type);    │    │
│  │                                                          │    │
│  │    return (                                              │    │
│  │      <ToolLayout tool={tool}>                            │    │
│  │        <ToolComponent config={tool.config} />            │    │
│  │      </ToolLayout>                                       │    │
│  │    );                                                    │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Tool Registry (maps tool types to components):                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  const TOOL_COMPONENTS = {                               │    │
│  │    'calculator': CalculatorTool,                         │    │
│  │    'search': SearchTool,                                 │    │
│  │    'validator': ValidatorTool,                           │    │
│  │    'generator': GeneratorTool,                           │    │
│  │    'tracker': TrackerTool,                               │    │
│  │    'reference': ReferenceTool,                           │    │
│  │    'external-link': ExternalLinkTool,                    │    │
│  │    'spreadsheet': SpreadsheetTool,                       │    │
│  │  };                                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- =====================================================
-- CORE SCHEMA
-- =====================================================

-- ─────────────────────────────────────────────────────
-- USERS & ROLES
-- ─────────────────────────────────────────────────────

-- User profiles (extends Supabase auth)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT UNIQUE NOT NULL,
  full_name       TEXT,
  role            TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  learnworlds_id  TEXT,  -- ID from LearnWorlds SSO
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- TOOLS / APPS
-- ─────────────────────────────────────────────────────

-- Tool definitions
CREATE TABLE tools (
  id              TEXT PRIMARY KEY,  -- e.g., 'tp-margin-calculator'
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  
  -- Tool type determines which component renders it
  tool_type       TEXT NOT NULL CHECK (tool_type IN (
                    'calculator',      -- Input → Calculate → Results
                    'search',          -- Query → Search → Results table
                    'validator',       -- Input → Validate → Pass/Fail
                    'generator',       -- Form → Generate → Document
                    'tracker',         -- Add entries → Dashboard
                    'reference',       -- Browse → Read content
                    'external-link',   -- Link to government site etc
                    'spreadsheet',     -- Excel-like data entry
                    'form'             -- Data collection form
                  )),
  
  -- Categorization
  category        TEXT,  -- 'transfer_pricing', 'vat', 'fatca_crs', etc.
  
  -- Display info
  icon            TEXT,
  short_description TEXT,  -- For cards (max ~100 chars)
  description     TEXT,    -- Full description (markdown supported)
  preview_image   TEXT,    -- Screenshot URL for public page
  
  -- Tool configuration (JSON structure depends on tool_type)
  config          JSONB NOT NULL DEFAULT '{}',
  
  -- Status management
  status          TEXT DEFAULT 'draft' CHECK (status IN (
                    'draft',     -- Being developed, not visible
                    'active',    -- Live and accessible
                    'inactive',  -- Temporarily disabled
                    'archived'   -- No longer available
                  )),
  
  -- Visibility
  is_public       BOOLEAN DEFAULT true,   -- Show on public tools page
  is_premium      BOOLEAN DEFAULT false,  -- Requires course purchase
  
  -- Metadata
  version         TEXT DEFAULT '1.0',
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Tool attachments (PDFs, guides, templates, etc.)
CREATE TABLE tool_attachments (
  id              SERIAL PRIMARY KEY,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  description     TEXT,
  file_url        TEXT NOT NULL,  -- Supabase Storage URL
  file_type       TEXT,           -- 'pdf', 'xlsx', 'docx', 'link'
  file_size       INTEGER,        -- In bytes (null for links)
  
  -- For external links
  external_url    TEXT,           -- If file_type = 'link'
  
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Tool changelog (for version history)
CREATE TABLE tool_changelog (
  id              SERIAL PRIMARY KEY,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  version         TEXT NOT NULL,
  changes         TEXT NOT NULL,
  changed_by      UUID REFERENCES profiles(id),
  changed_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- COURSES & COURSE-TOOL MAPPING
-- ─────────────────────────────────────────────────────

-- Courses (synced from LearnWorlds or manually added)
CREATE TABLE courses (
  id                      TEXT PRIMARY KEY,  -- LearnWorlds product ID
  name                    TEXT NOT NULL,
  slug                    TEXT UNIQUE NOT NULL,
  description             TEXT,
  learnworlds_url         TEXT,  -- Link to course on mojitax.co.uk
  category                TEXT,
  display_order           INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- Course-to-tool mapping
CREATE TABLE course_tools (
  id              SERIAL PRIMARY KEY,
  course_id       TEXT REFERENCES courses(id) ON DELETE CASCADE,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  
  -- Access level for this course-tool combination
  access_level    TEXT DEFAULT 'full' CHECK (access_level IN (
                    'full',     -- Complete access
                    'limited',  -- Some features restricted
                    'preview'   -- Can see but not fully use
                  )),
  
  display_order   INTEGER DEFAULT 0,  -- Order within course
  is_active       BOOLEAN DEFAULT true,
  
  created_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(course_id, tool_id)
);

-- ─────────────────────────────────────────────────────
-- USER DATA (Saved work, tracker entries, etc.)
-- ─────────────────────────────────────────────────────

-- User's saved calculations/work
CREATE TABLE user_saved_items (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  
  name            TEXT NOT NULL,
  data            JSONB NOT NULL,  -- Saved inputs/results
  
  is_favorite     BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Tracker entries (for tracker-type tools)
CREATE TABLE user_tracker_entries (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id         TEXT REFERENCES tools(id) ON DELETE CASCADE,
  
  entry_data      JSONB NOT NULL,
  entry_date      DATE,
  
  created_at      TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferences     JSONB DEFAULT '{}',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- ANALYTICS (Optional)
-- ─────────────────────────────────────────────────────

-- Tool usage log
CREATE TABLE tool_usage_log (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id),
  tool_id         TEXT REFERENCES tools(id),
  action          TEXT,  -- 'view', 'calculate', 'save', 'export', 'error'
  metadata        JSONB,
  session_id      TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────
-- REFERENCE DATA
-- ─────────────────────────────────────────────────────

-- VAT rates by country
CREATE TABLE ref_vat_rates (
  id              SERIAL PRIMARY KEY,
  country_code    TEXT NOT NULL,
  country_name    TEXT NOT NULL,
  standard_rate   DECIMAL(5,2),
  reduced_rates   JSONB,  -- Array of reduced rates
  special_rates   JSONB,  -- Zero-rated, exempt categories
  effective_date  DATE,
  source_url      TEXT,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Treaty withholding rates
CREATE TABLE ref_treaty_rates (
  id              SERIAL PRIMARY KEY,
  source_country  TEXT NOT NULL,
  target_country  TEXT NOT NULL,
  dividend_rate   DECIMAL(5,2),
  interest_rate   DECIMAL(5,2),
  royalty_rate    DECIMAL(5,2),
  treaty_ref      TEXT,
  effective_date  DATE,
  notes           TEXT,
  updated_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_country, target_country)
);

-- ─────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────

CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_course_tools_course ON course_tools(course_id);
CREATE INDEX idx_course_tools_tool ON course_tools(tool_id);
CREATE INDEX idx_user_saved_items_user ON user_saved_items(user_id);
CREATE INDEX idx_user_saved_items_tool ON user_saved_items(tool_id);
CREATE INDEX idx_tool_usage_log_user ON tool_usage_log(user_id);
CREATE INDEX idx_tool_usage_log_tool ON tool_usage_log(tool_id);
CREATE INDEX idx_tool_usage_log_created ON tool_usage_log(created_at);

-- ─────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracker_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Tools: Active tools visible to all, all tools visible to admins
CREATE POLICY "Active tools are public" ON tools
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can view all tools" ON tools
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage tools" ON tools
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- User saved items: Users can only access own data
CREATE POLICY "Users can manage own saved items" ON user_saved_items
  FOR ALL USING (auth.uid() = user_id);

-- User tracker entries: Users can only access own data
CREATE POLICY "Users can manage own tracker entries" ON user_tracker_entries
  FOR ALL USING (auth.uid() = user_id);
```

### Tool Config Examples

```json
// Calculator tool config
{
  "id": "tp-margin-calculator",
  "tool_type": "calculator",
  "config": {
    "inputs": [
      {
        "name": "revenue",
        "label": "Revenue",
        "type": "currency",
        "required": true,
        "placeholder": "Enter revenue"
      },
      {
        "name": "cogs",
        "label": "Cost of Goods Sold",
        "type": "currency",
        "required": true
      },
      {
        "name": "operating_expenses",
        "label": "Operating Expenses",
        "type": "currency",
        "required": true
      },
      {
        "name": "method",
        "label": "TP Method",
        "type": "select",
        "options": [
          {"value": "tnmm", "label": "TNMM (Operating Margin)"},
          {"value": "cost_plus", "label": "Cost Plus"},
          {"value": "resale_minus", "label": "Resale Minus"}
        ]
      }
    ],
    "calculations": [
      {
        "name": "gross_profit",
        "formula": "revenue - cogs",
        "label": "Gross Profit"
      },
      {
        "name": "gross_margin",
        "formula": "(revenue - cogs) / revenue * 100",
        "label": "Gross Margin",
        "format": "percentage"
      },
      {
        "name": "operating_margin",
        "formula": "(revenue - cogs - operating_expenses) / revenue * 100",
        "label": "Operating Margin",
        "format": "percentage"
      },
      {
        "name": "markup",
        "formula": "(revenue - cogs) / cogs * 100",
        "label": "Cost Plus Markup",
        "format": "percentage"
      },
      {
        "name": "berry_ratio",
        "formula": "gross_profit / operating_expenses",
        "label": "Berry Ratio",
        "format": "decimal"
      }
    ],
    "educational_notes": {
      "gross_margin": "Gross margin shows profitability before operating costs. Used in Resale Price Method.",
      "operating_margin": "Operating margin (or net cost plus) is the primary PLI for TNMM.",
      "berry_ratio": "Berry ratio compares gross profit to operating expenses. Useful for distributors."
    }
  }
}

// External link tool config
{
  "id": "hmrc-vat-registration",
  "tool_type": "external-link",
  "config": {
    "url": "https://www.gov.uk/vat-registration",
    "description": "Official HMRC VAT registration portal",
    "open_in_new_tab": true,
    "warning_message": "You are leaving MojiTax to visit an external government website.",
    "related_tools": ["vat-calculator", "vat-threshold-tracker"]
  }
}

// Search tool config
{
  "id": "vat-rate-lookup",
  "tool_type": "search",
  "config": {
    "data_source": "ref_vat_rates",
    "searchable_fields": ["country_name", "country_code"],
    "display_fields": [
      {"field": "country_name", "label": "Country"},
      {"field": "standard_rate", "label": "Standard Rate", "format": "percentage"},
      {"field": "reduced_rates", "label": "Reduced Rates"}
    ],
    "filters": [
      {
        "name": "region",
        "label": "Region",
        "type": "select",
        "options": ["EU", "Non-EU Europe", "Americas", "Asia-Pacific", "Africa"]
      }
    ],
    "default_sort": {"field": "country_name", "direction": "asc"}
  }
}
```

---

## Component Architecture

### Tool Component Structure

```
/components/tools/
├── index.ts                    # Tool registry (exports all tools)
├── ToolWrapper.tsx             # Common wrapper for all tools
├── ToolHeader.tsx              # Title, description, disclaimer
├── ToolFooter.tsx              # Save, export, back buttons
│
├── /calculator/
│   ├── Calculator.tsx          # Main calculator component
│   ├── CalculatorInput.tsx     # Dynamic input renderer
│   ├── CalculatorResults.tsx   # Results display
│   └── calculatorUtils.ts      # Formula evaluation
│
├── /search/
│   ├── Search.tsx              # Main search component
│   ├── SearchFilters.tsx       # Filter controls
│   ├── SearchResults.tsx       # Results table
│   └── searchUtils.ts          # Search/filter logic
│
├── /validator/
│   ├── Validator.tsx           # Main validator component
│   ├── ValidatorInput.tsx      # Input with validation
│   ├── ValidatorResult.tsx     # Pass/fail display
│   └── validators/             # Specific validation logic
│       ├── vatNumber.ts
│       ├── giin.ts
│       └── eori.ts
│
├── /generator/
│   ├── Generator.tsx           # Main generator component
│   ├── GeneratorForm.tsx       # Input form
│   ├── GeneratorPreview.tsx    # Document preview
│   └── templates/              # Document templates
│       ├── tpMemo.ts
│       └── w8Helper.ts
│
├── /tracker/
│   ├── Tracker.tsx             # Main tracker component
│   ├── TrackerDashboard.tsx    # Summary/charts
│   ├── TrackerEntryForm.tsx    # Add entry form
│   └── TrackerList.tsx         # Entry list
│
├── /reference/
│   ├── Reference.tsx           # Main reference component
│   ├── ReferenceNav.tsx        # Table of contents
│   ├── ReferenceContent.tsx    # Content display
│   └── content/                # Static content files
│
├── /external-link/
│   └── ExternalLink.tsx        # Link with warning modal
│
└── /spreadsheet/
    ├── Spreadsheet.tsx         # Main spreadsheet component
    └── SpreadsheetToolbar.tsx  # Actions toolbar
```

### Tool Registry

```typescript
// /components/tools/index.ts

import { Calculator } from './calculator/Calculator';
import { Search } from './search/Search';
import { Validator } from './validator/Validator';
import { Generator } from './generator/Generator';
import { Tracker } from './tracker/Tracker';
import { Reference } from './reference/Reference';
import { ExternalLink } from './external-link/ExternalLink';
import { Spreadsheet } from './spreadsheet/Spreadsheet';

export const TOOL_COMPONENTS: Record<string, React.ComponentType<ToolProps>> = {
  'calculator': Calculator,
  'search': Search,
  'validator': Validator,
  'generator': Generator,
  'tracker': Tracker,
  'reference': Reference,
  'external-link': ExternalLink,
  'spreadsheet': Spreadsheet,
};

export function getToolComponent(toolType: string) {
  const component = TOOL_COMPONENTS[toolType];
  if (!component) {
    throw new Error(`Unknown tool type: ${toolType}`);
  }
  return component;
}

// Common props interface for all tools
export interface ToolProps {
  tool: Tool;
  config: Record<string, any>;
  user?: User;
  onSave?: (data: any) => Promise<void>;
  savedItems?: SavedItem[];
}
```

### Dynamic Tool Page

```typescript
// /app/(auth)/tools/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { getToolBySlug, checkUserAccess } from '@/lib/tools';
import { getToolComponent } from '@/components/tools';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { LockedToolView } from '@/components/tools/LockedToolView';

interface ToolPageProps {
  params: { slug: string };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const tool = await getToolBySlug(params.slug);
  
  if (!tool || tool.status !== 'active') {
    notFound();
  }

  const user = await getCurrentUser();
  const hasAccess = await checkUserAccess(user, tool);

  // If user doesn't have access, show locked view
  if (!hasAccess) {
    return <LockedToolView tool={tool} />;
  }

  // Get the component for this tool type
  const ToolComponent = getToolComponent(tool.tool_type);
  
  // Get user's saved items for this tool
  const savedItems = await getUserSavedItems(user.id, tool.id);

  return (
    <ToolLayout tool={tool}>
      <ToolComponent 
        tool={tool}
        config={tool.config}
        user={user}
        savedItems={savedItems}
        onSave={async (data) => {
          'use server';
          await saveUserItem(user.id, tool.id, data);
        }}
      />
    </ToolLayout>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ToolPageProps) {
  const tool = await getToolBySlug(params.slug);
  
  return {
    title: `${tool?.name} | MojiTax Demo Tools`,
    description: tool?.short_description,
  };
}
```

---

## Admin Interface

### Admin Dashboard Structure

```
/app/(admin)/
├── /admin/page.tsx                 # Admin dashboard home
├── /admin/tools/page.tsx           # All tools list
├── /admin/tools/[id]/page.tsx      # Edit tool
├── /admin/tools/new/page.tsx       # Create new tool
├── /admin/courses/page.tsx         # Course management
├── /admin/courses/[id]/page.tsx    # Course-tool mapping
├── /admin/users/page.tsx           # User management (view only)
└── /admin/analytics/page.tsx       # Usage analytics
```

### Admin Tools List View

```
┌─────────────────────────────────────────────────────────────────┐
│  MojiTax Admin > Tools                              [+ New Tool] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filter: [All Status ▼] [All Categories ▼]    Search: [______]  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Status │ Name                  │ Type       │ Category │ Act ││
│  ├────────┼───────────────────────┼────────────┼──────────┼─────┤│
│  │ ● Live │ TP Margin Calculator  │ Calculator │ TP       │ [⋮] ││
│  │ ● Live │ VAT Rate Lookup       │ Search     │ VAT      │ [⋮] ││
│  │ ○ Draft│ GIIN Search           │ Search     │ FATCA    │ [⋮] ││
│  │ ◐ Off  │ PE Day Counter        │ Tracker    │ Corp Tax │ [⋮] ││
│  │ ▣ Arch │ Old Calculator        │ Calculator │ TP       │ [⋮] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Legend: ● Active  ○ Draft  ◐ Inactive  ▣ Archived               │
│                                                                  │
│  Actions menu [⋮]:                                               │
│  • Edit tool                                                     │
│  • View tool (as user)                                           │
│  • Activate / Deactivate                                         │
│  • Archive                                                       │
│  • Duplicate                                                     │
│  • View usage stats                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Admin Tool Edit View

```
┌─────────────────────────────────────────────────────────────────┐
│  MojiTax Admin > Tools > TP Margin Calculator        [Save] [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BASIC INFO                                                      │
│  ─────────────────────────────────────────────────────────────  │
│  Name:           [TP Margin Calculator                        ]  │
│  Slug:           [tp-margin-calculator        ] (auto-generated) │
│  Type:           [Calculator ▼] (cannot change after creation)   │
│  Category:       [Transfer Pricing ▼]                            │
│  Status:         (●) Active  ( ) Inactive  ( ) Draft             │
│                                                                  │
│  DESCRIPTIONS                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  Short (for cards):                                              │
│  [Calculate gross margins, operating margins, and markups for   ]│
│  [transfer pricing analysis.                                    ]│
│                                                                  │
│  Full description (markdown):                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ This demo tool helps you understand how transfer pricing    ││
│  │ professionals calculate arm's length margins...             ││
│  │                                                             ││
│  │ **What you'll learn:**                                      ││
│  │ - Gross profit margin calculations                          ││
│  │ - Operating margin (TNMM)                                   ││
│  │ - Cost-plus markup                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ATTACHMENTS                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────┐           │
│  │ 📄 TP Methods Guide.pdf          [View] [Delete] │           │
│  │ 🔗 OECD Guidelines (external)    [Open] [Delete] │           │
│  └──────────────────────────────────────────────────┘           │
│  [+ Add Attachment]  [+ Add External Link]                       │
│                                                                  │
│  COURSE ALLOCATION                                               │
│  ─────────────────────────────────────────────────────────────  │
│  This tool is included in:                                       │
│  ☑ Transfer Pricing Fundamentals                                 │
│  ☑ Transfer Pricing Advanced                                     │
│  ☐ VAT Compliance Masterclass                                    │
│  ☐ FATCA Essentials                                              │
│  [Manage Course Allocation →]                                    │
│                                                                  │
│  CONFIGURATION                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  [Open Config Editor] (JSON editor for tool-specific settings)   │
│                                                                  │
│  DANGER ZONE                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  [Archive Tool]  [Delete Tool]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Admin Tool-to-Course Allocation Flow

**CRITICAL: Admin manually allocates tools to courses.** This is not automatic.

```
┌─────────────────────────────────────────────────────────────────┐
│                ADMIN TOOL ALLOCATION WORKFLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: ADMIN CREATES TOOL                                      │
│  ───────────────────────────────────────────────────────────    │
│  • Tool created in "Draft" status                                │
│  • Not visible to users yet                                      │
│  • Admin configures: name, type, category, description           │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  STEP 2: ADMIN CONFIGURES TOOL                                   │
│  ───────────────────────────────────────────────────────────    │
│  • Adds full description (markdown)                              │
│  • Uploads attachments (PDFs, guides)                            │
│  • Adds external links (OECD guidelines, etc.)                   │
│  • Configures tool settings (inputs, formulas, data sources)     │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  STEP 3: ADMIN ALLOCATES TOOL TO COURSE(S)  ◄── MANUAL STEP     │
│  ───────────────────────────────────────────────────────────    │
│  • Selects which course(s) should include this tool              │
│  • Sets display order within each course                         │
│  • Can allocate same tool to multiple courses                    │
│  • Can set access level (full, limited, preview)                 │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  STEP 4: ADMIN ACTIVATES TOOL                                    │
│  ───────────────────────────────────────────────────────────    │
│  • Changes status: Draft → Active                                │
│  • Tool now visible on public pages                              │
│  • Users enrolled in allocated courses can access                │
│                                                                  │
│                         ↓                                        │
│                                                                  │
│  STEP 5: ONGOING MANAGEMENT                                      │
│  ───────────────────────────────────────────────────────────    │
│  • Deactivate: Active → Inactive (hides from users)              │
│  • Reactivate: Inactive → Active                                 │
│  • Archive: Removes completely (keeps history)                   │
│  • Update allocation: Add/remove from courses anytime            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Course Allocation UI (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│  MojiTax Admin > Tools > TP Margin Calculator > Course Allocation│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Allocate "TP Margin Calculator" to courses:                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  TRANSFER PRICING COURSES                                    ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  ☑ Transfer Pricing Fundamentals                             ││
│  │     └── Display Order: [1]  Access: [Full ▼]                 ││
│  │                                                              ││
│  │  ☑ Transfer Pricing Advanced                                 ││
│  │     └── Display Order: [3]  Access: [Full ▼]                 ││
│  │                                                              ││
│  │  ☐ Transfer Pricing Documentation                            ││
│  │                                                              ││
│  │  VAT COURSES                                                 ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  ☐ VAT Compliance Masterclass                                ││
│  │  ☐ EU VAT for E-commerce                                     ││
│  │                                                              ││
│  │  FATCA/CRS COURSES                                           ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  ☐ FATCA Essentials                                          ││
│  │  ☐ CRS Compliance                                            ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  💡 TIP: Display order determines where this tool appears in     │
│     the course's tool list. Lower numbers appear first.          │
│                                                                  │
│  💡 TIP: Access levels:                                          │
│     • Full - Complete tool access                                │
│     • Limited - Some features restricted                         │
│     • Preview - Can see but not fully use                        │
│                                                                  │
│  [Save Allocation]  [Cancel]                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Course Management Page

```
┌─────────────────────────────────────────────────────────────────┐
│  MojiTax Admin > Courses                           [+ Add Course]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Courses are imported from LearnWorlds or added manually.        │
│  Tools are allocated to courses by admin.                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Course                         │ Category │ Tools │ Status  ││
│  ├────────────────────────────────┼──────────┼───────┼─────────┤│
│  │ Transfer Pricing Fundamentals  │ TP       │ 4     │ Active  ││
│  │ Transfer Pricing Advanced      │ TP       │ 6     │ Active  ││
│  │ VAT Compliance Masterclass     │ VAT      │ 5     │ Active  ││
│  │ FATCA Essentials               │ FATCA    │ 3     │ Active  ││
│  │ Pillar Two Fundamentals        │ Pillar 2 │ 0     │ Draft   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Click a course to manage its allocated tools.                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Course Detail: Allocated Tools

```
┌─────────────────────────────────────────────────────────────────┐
│  MojiTax Admin > Courses > Transfer Pricing Fundamentals         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COURSE INFO                                                     │
│  ─────────────────────────────────────────────────────────────  │
│  Name:        Transfer Pricing Fundamentals                      │
│  LearnWorlds: https://mojitax.co.uk/course/tp-fundamentals       │
│  Category:    Transfer Pricing                                   │
│  Status:      Active                                             │
│                                                                  │
│  ALLOCATED TOOLS (4)                                [+ Add Tool] │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Order │ Tool                    │ Type       │ Access │  Act ││
│  ├───────┼─────────────────────────┼────────────┼────────┼──────┤│
│  │  1    │ TP Margin Calculator    │ Calculator │ Full   │ [⋮]  ││
│  │  2    │ TP Method Selector      │ Reference  │ Full   │ [⋮]  ││
│  │  3    │ Comparable Search Demo  │ Search     │ Full   │ [⋮]  ││
│  │  4    │ OECD Guidelines Link    │ Ext. Link  │ Full   │ [⋮]  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Drag to reorder • Actions [⋮]: Change access, Remove from course│
│                                                                  │
│  AVAILABLE TOOLS NOT IN THIS COURSE                              │
│  ─────────────────────────────────────────────────────────────  │
│  • VAT Calculator (VAT)                         [+ Add]          │
│  • Treaty Rate Search (WHT)                     [+ Add]          │
│  • GIIN Search (FATCA)                          [+ Add]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Allocation Rules

| Rule | Description |
|------|-------------|
| **One tool → Many courses** | Same tool can be allocated to multiple courses |
| **Order is per-course** | Tool can be position 1 in Course A, position 5 in Course B |
| **Access is per-course** | Tool can be "Full" in Advanced course, "Preview" in Intro course |
| **Allocation ≠ Activation** | Tool can be allocated to courses while still in Draft status |
| **Deactivation hides everywhere** | If tool status = Inactive, hidden from ALL courses |
| **Courses come from LearnWorlds** | Course IDs must match LearnWorlds product IDs for SSO to work |

### Access Control Logic

```typescript
// How the system determines if a user can access a tool

async function checkUserAccess(userId: string, toolId: string): Promise<boolean> {
  // 1. Get user's enrolled courses from LearnWorlds
  const userEnrollments = await learnworlds.getUserEnrollments(userId);
  // Returns: ['tp-fundamentals', 'vat-masterclass']

  // 2. Get courses that include this tool
  const toolCourses = await db.course_tools
    .select('course_id')
    .where({ tool_id: toolId, is_active: true });
  // Returns: ['tp-fundamentals', 'tp-advanced']

  // 3. Check for overlap
  const hasAccess = toolCourses.some(tc => 
    userEnrollments.includes(tc.course_id)
  );
  // User has 'tp-fundamentals' which includes this tool → TRUE

  return hasAccess;
}
```

---

## Build Phases (Detailed)

### Phase 1: Dashboard Foundation (Week 1)

**Objective:** Create the shell that will hold everything, including admin allocation system

```
DELIVERABLES:
├── Next.js project setup with TypeScript
├── Supabase project + database schema
├── Basic authentication (Supabase Auth initially)
├── Dashboard layout with navigation
├── Tools listing page (empty state)
├── Admin layout with navigation
├── Admin tools list page (CRUD for tools)
├── Admin courses page (list/add courses)
├── Admin tool-to-course allocation UI
└── Basic UI components (cards, buttons, forms)

PAGES TO BUILD:
├── / (redirect to /dashboard or /tools)
├── /dashboard (authenticated user home)
├── /tools (public tools listing)
├── /admin (admin dashboard)
├── /admin/tools (tool management)
├── /admin/tools/[id] (edit tool + allocation)
├── /admin/courses (course list)
└── /admin/courses/[id] (course detail + allocated tools)

DATABASE TABLES:
├── profiles
├── tools
├── courses
├── course_tools (THE ALLOCATION TABLE)
└── tool_attachments
```

**Acceptance Criteria:**
- [ ] Admin can create a tool record (name, slug, type, category, status)
- [ ] Admin can edit tool details
- [ ] Admin can activate/deactivate tools
- [ ] Admin can archive tools
- [ ] Admin can add courses (manually, LearnWorlds sync comes later)
- [ ] **Admin can allocate tools to courses**
- [ ] **Admin can set display order per course**
- [ ] **Admin can remove tool from course**
- [ ] Dashboard shows tools grouped by category
- [ ] Status badges show correctly (Draft/Active/Inactive/Archived)

---

### Phase 2: First Tool Templates (Week 2)

**Objective:** Build Calculator and External Link tool types, test allocation flow

```
DELIVERABLES:
├── Calculator component with:
│   ├── Dynamic input rendering from config
│   ├── Formula evaluation engine
│   ├── Results display with formatting
│   └── Educational notes display
│
├── External Link component with:
│   ├── Link card display
│   ├── Warning modal before redirect
│   └── Related tools section
│
├── Tool wrapper component:
│   ├── Header (title, description, disclaimer)
│   ├── Footer (back button, help)
│   └── Responsive layout
│
├── Create 3 actual tools:
│   ├── TP Margin Calculator (calculator)
│   ├── VAT Calculator (calculator)
│   └── HMRC VAT Registration (external-link)
│
└── Test allocation workflow:
    ├── Create "Transfer Pricing Fundamentals" course
    ├── Allocate TP Margin Calculator to it
    ├── Create "VAT Masterclass" course
    ├── Allocate VAT Calculator to it
    └── Verify dashboard shows tools grouped by allocated course
```

**Acceptance Criteria:**
- [ ] TP Margin Calculator works end-to-end
- [ ] Calculations are correct
- [ ] Educational notes display
- [ ] External link shows warning before redirect
- [ ] Tools appear on dashboard grouped correctly
- [ ] Admin can configure calculator inputs via JSON
- [ ] **Admin can allocate created tools to courses**
- [ ] **Dashboard shows tools based on course allocation**
- [ ] **Tools appear in correct order within course group**

---

### Phase 3: Save/Load & More Tools (Week 3)

**Objective:** User data persistence + Search and Validator tools

```
DELIVERABLES:
├── Save functionality:
│   ├── Save calculation with name
│   ├── Load saved calculations
│   ├── Delete saved items
│   └── Favorite items
│
├── Search tool component:
│   ├── Search input
│   ├── Filter controls
│   ├── Results table with sorting
│   └── Detail view modal
│
├── Validator tool component:
│   ├── Single input mode
│   ├── Batch validation mode
│   ├── Pass/fail display
│   └── Explanation of rules
│
├── Reference data tables:
│   ├── VAT rates (populated)
│   └── Treaty rates (sample data)
│
└── Create actual tools:
    ├── VAT Rate Lookup (search)
    ├── EU VAT Number Validator (validator)
    └── Treaty Rate Search (search)
```

**Acceptance Criteria:**
- [ ] Users can save and load calculations
- [ ] VAT Rate Lookup returns correct data
- [ ] VAT Number Validator checks format correctly
- [ ] Saved items persist across sessions
- [ ] Admin can add/update reference data

---

### Phase 4: Public Pages (Week 3-4)

**Objective:** SEO-friendly public tool pages

```
DELIVERABLES:
├── Public tools homepage:
│   ├── All tools listed by category
│   ├── Tool cards with preview
│   ├── "Get Access" CTAs
│   └── SEO metadata
│
├── Public tool detail pages:
│   ├── Tool description
│   ├── Screenshot/preview
│   ├── "Included with [Course]" section
│   ├── Login/signup CTA
│   └── SEO metadata
│
├── Locked tool view:
│   ├── Shown when user lacks access
│   ├── Lists courses that include tool
│   └── Links to mojitax.co.uk
│
└── Styling/branding:
    ├── MojiTax brand colors
    ├── Consistent typography
    └── Mobile responsive
```

**Acceptance Criteria:**
- [ ] Public pages are indexable by Google
- [ ] Each tool has unique meta description
- [ ] "Get Access" links to correct course on LearnWorlds
- [ ] Locked view shows for non-enrolled users
- [ ] Mobile experience is good

---

### Phase 5: LearnWorlds Integration (Week 4-5)

**Objective:** SSO authentication + access control based on course allocation

```
DELIVERABLES:
├── LearnWorlds SSO:
│   ├── SSO endpoint configuration
│   ├── JWT validation
│   ├── Session creation
│   └── Logout handling
│
├── Access control (uses admin's course allocation):
│   ├── API to check user enrollments from LearnWorlds
│   ├── Match enrollments against course_tools table
│   ├── Middleware for protected routes
│   └── Cache enrollment data (with TTL)
│
├── Course ID sync:
│   ├── Ensure course IDs in tools DB match LearnWorlds product IDs
│   ├── Admin can update course LearnWorlds ID
│   └── Validation that IDs are correctly linked
│
└── Deep linking:
    ├── Links from LearnWorlds to tools
    ├── "Back to Course" links
    └── Track referral source

ACCESS CONTROL FLOW:
┌─────────────────────────────────────────────────────────────────┐
│  User clicks on a tool                                           │
│         ↓                                                        │
│  System checks: Which courses is this tool allocated to?         │
│  (From course_tools table - set by admin)                        │
│         ↓                                                        │
│  System checks: Which courses is user enrolled in?               │
│  (From LearnWorlds API)                                          │
│         ↓                                                        │
│  If overlap exists → Grant access                                │
│  If no overlap → Show locked view with course links              │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] User can log in via LearnWorlds SSO
- [ ] User only sees tools for courses they're enrolled in
- [ ] **Access is determined by admin's course allocation**
- [ ] Access check happens on each tool load
- [ ] **Course IDs in tools DB match LearnWorlds product IDs**
- [ ] "Back to Course" returns to LearnWorlds

---

### Phase 6: Admin Testing & Polish (Week 5)

**Objective:** Full admin workflow testing + remaining tool types

```
DELIVERABLES:
├── Admin workflow testing:
│   ├── Complete tool lifecycle test (see below)
│   ├── Attachment upload/management
│   ├── Tool preview (as user)
│   └── Usage analytics dashboard
│
├── Remaining tool types:
│   ├── Tracker component
│   ├── Generator component
│   ├── Reference component
│   └── Spreadsheet component (basic)
│
├── PDF export:
│   ├── Export calculations as PDF
│   ├── "DEMO - For Learning Only" watermark
│   └── MojiTax branding
│
└── Error handling:
    ├── Error boundaries
    ├── Loading states
    ├── Empty states
    └── Offline handling

ADMIN ALLOCATION WORKFLOW TEST:
┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: Admin adds new tool and allocates to course           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Admin creates new tool "Berry Ratio Calculator"              │
│     → Status: Draft                                              │
│     → Tool NOT visible to users                                  │
│                                                                  │
│  2. Admin configures tool                                        │
│     → Adds description, attachments                              │
│     → Sets up calculator inputs/formulas                         │
│                                                                  │
│  3. Admin allocates tool to "TP Advanced" course                 │
│     → Sets display order: 5                                      │
│     → Sets access: Full                                          │
│     → Tool still NOT visible (still Draft)                       │
│                                                                  │
│  4. Admin activates tool                                         │
│     → Status: Draft → Active                                     │
│     → Tool NOW visible to users enrolled in TP Advanced          │
│     → Tool appears in position 5 in TP Advanced tool list        │
│                                                                  │
│  5. Admin adds tool to another course "TP Fundamentals"          │
│     → Sets display order: 8                                      │
│     → Tool now visible in BOTH courses                           │
│                                                                  │
│  6. Admin deactivates tool                                       │
│     → Status: Active → Inactive                                  │
│     → Tool hidden from ALL users in ALL courses                  │
│     → Allocation remains (not deleted)                           │
│                                                                  │
│  7. Admin reactivates tool                                       │
│     → Status: Inactive → Active                                  │
│     → Tool visible again in both allocated courses               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Admin can complete full tool lifecycle (create → configure → allocate → activate)
- [ ] **Tool not visible until BOTH allocated AND active**
- [ ] **Deactivation hides from all courses**
- [ ] **Reactivation restores visibility in allocated courses**
- [ ] Admin can preview tool as end user
- [ ] All 6 tool types functional
- [ ] PDF export works with watermark
- [ ] Graceful error handling throughout

---

### Phase 7: User Testing & Launch (Week 6)

**Objective:** End-to-end testing from user perspective + go-live

```
DELIVERABLES:
├── User journey testing (see detailed flow below)
│
├── Performance:
│   ├── Page load times < 2s
│   ├── Tool calculations instant
│   ├── Search results < 500ms
│   └── Mobile performance good
│
├── Documentation:
│   ├── Admin user guide (how to allocate tools)
│   ├── Developer handoff docs
│   └── Tool creation guide
│
└── Launch:
    ├── DNS configuration
    ├── SSL certificates
    ├── Monitoring setup
    └── Go-live checklist

USER JOURNEY TEST (End-to-End):
┌─────────────────────────────────────────────────────────────────┐
│  PREREQUISITE: Admin has allocated tools to courses              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User purchases "Transfer Pricing Fundamentals" on LearnWorlds│
│     → LearnWorlds records enrollment                             │
│                                                                  │
│  2. User clicks "Access Tools" from LearnWorlds course           │
│     → SSO redirects to tools.mojitax.co.uk                       │
│     → User automatically logged in                               │
│                                                                  │
│  3. User sees dashboard                                          │
│     → Shows: "Your Tools" section                                │
│     → Lists: Tools allocated to "TP Fundamentals"                │
│     → Shows: "Unlock More Tools" section with other courses      │
│                                                                  │
│  4. User clicks "TP Margin Calculator"                           │
│     → Access check passes (tool allocated to user's course)      │
│     → Full tool loads                                            │
│                                                                  │
│  5. User uses tool and saves calculation                         │
│     → Calculation saved to Supabase                              │
│     → User sees it in "Saved Calculations" list                  │
│                                                                  │
│  6. User clicks on VAT Calculator (not enrolled)                 │
│     → Access check fails                                         │
│     → Shows locked view: "Included with VAT Masterclass"         │
│     → Link to purchase course on LearnWorlds                     │
│                                                                  │
│  7. User returns next day                                        │
│     → Logs in via SSO                                            │
│     → Dashboard shows same tools                                 │
│     → Saved calculation still there                              │
│                                                                  │
│  8. User purchases "VAT Masterclass" on LearnWorlds              │
│     → Returns to tools platform                                  │
│     → Dashboard now shows VAT tools too!                         │
│     → VAT Calculator now accessible                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Complete user journey works end-to-end
- [ ] **User only sees tools for their enrolled courses**
- [ ] **Purchasing new course grants access to new tools**
- [ ] Saved data persists across sessions
- [ ] Locked tools show correct course to purchase
- [ ] Performance targets met
- [ ] No critical bugs
- [ ] Admin documentation complete
- [ ] Ready for first real users

---

## First Tools to Build

### Priority 1 (Phase 2)

| Tool | Type | Complexity | Notes |
|------|------|------------|-------|
| TP Margin Calculator | Calculator | Medium | Core demo tool, tests calculator template |
| VAT Calculator | Calculator | Low | Simple inputs, validates calculator works |
| HMRC VAT Registration | External Link | Low | Tests external link template |

### Priority 2 (Phase 3)

| Tool | Type | Complexity | Notes |
|------|------|------------|-------|
| VAT Rate Lookup | Search | Medium | Tests search + reference data |
| EU VAT Validator | Validator | Medium | Tests validation logic |
| Treaty Rate Search | Search | Medium | Tests multi-column search |

### Priority 3 (Phase 6)

| Tool | Type | Complexity | Notes |
|------|------|------------|-------|
| OSS Threshold Tracker | Tracker | High | Tests data persistence |
| TP Method Guide | Reference | Medium | Tests content navigation |
| W-8BEN-E Helper | Generator | High | Tests document generation |

---

## Technology Choices

### Confirmed Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14 (App Router) | Server components, great DX |
| **Styling** | Tailwind CSS | Rapid development, consistent design |
| **UI Components** | shadcn/ui | High quality, customizable |
| **Database** | Supabase (PostgreSQL) | Auth, DB, storage in one |
| **Auth** | Supabase Auth → LearnWorlds SSO | Start simple, add SSO later |
| **Hosting** | Vercel | Best Next.js hosting |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **State** | React Query (TanStack) | Server state management |
| **PDF Export** | @react-pdf/renderer | Generate PDFs client-side |

### File Structure

```
mojitax-tools/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # Landing → redirect
│   │   ├── tools/
│   │   │   ├── page.tsx                # Public tools list
│   │   │   └── [slug]/page.tsx         # Public tool preview
│   │   └── login/page.tsx              # Login page
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                  # Auth check wrapper
│   │   ├── dashboard/page.tsx          # User dashboard
│   │   └── tools/[slug]/page.tsx       # Full tool access
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                  # Admin check wrapper
│   │   ├── admin/page.tsx              # Admin home
│   │   ├── admin/tools/
│   │   │   ├── page.tsx                # Tool list
│   │   │   ├── [id]/page.tsx           # Edit tool
│   │   │   └── new/page.tsx            # Create tool
│   │   └── admin/courses/page.tsx      # Course management
│   │
│   ├── api/
│   │   ├── tools/route.ts
│   │   ├── user/route.ts
│   │   └── webhooks/learnworlds/route.ts
│   │
│   └── layout.tsx                      # Root layout
│
├── components/
│   ├── tools/                          # Tool components
│   ├── dashboard/                      # Dashboard components
│   ├── admin/                          # Admin components
│   └── ui/                             # shadcn components
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── admin.ts                    # Admin client
│   ├── learnworlds/
│   │   ├── sso.ts                      # SSO handling
│   │   └── api.ts                      # API client
│   ├── tools/
│   │   ├── registry.ts                 # Tool component registry
│   │   └── utils.ts                    # Tool utilities
│   └── utils.ts                        # General utilities
│
├── types/
│   ├── database.ts                     # Supabase types
│   ├── tools.ts                        # Tool types
│   └── index.ts                        # Exports
│
└── public/
    └── images/                         # Static images
```

---

## Questions for You

Before starting development:

1. **LearnWorlds Plan** - Do you have API access? Which SSO method is available?

2. **Initial Admin Users** - Who should have admin access? Email addresses?

3. **Branding Assets** - Do you have:
   - Logo files (SVG preferred)
   - Brand colors (exact hex codes)
   - Fonts being used

4. **First Course to Connect** - Which LearnWorlds course should we test with first?

5. **Domain** - Is tools.mojitax.co.uk ready, or should we use a subdomain of something else initially?

6. **Timeline** - Is the 6-week timeline realistic given your availability for testing/feedback?

---

## Summary: Your Feedback

You proposed:

> 1. Create simple dashboard for tools/apps
> 2. Create first set of tools/apps and test
> 3. Create simple public pages for tools section
> 4. Sync to LearnWorlds
> 5. Admin tests app activation, allocation to course, etc.
> 6. User tests

**My assessment: This is exactly right.** 

The plan above follows your flow:
- **Phase 1-2**: Dashboard + first tools + **allocation UI**
- **Phase 3**: More tools with save/load
- **Phase 4**: Public pages
- **Phase 5**: LearnWorlds sync (access control uses allocation)
- **Phase 6**: **Admin tests full allocation workflow**
- **Phase 7**: User tests (sees tools based on allocation)

### Key Architectural Decisions

| Decision | Approach |
|----------|----------|
| **Tool Integration** | React components (not iframes) - tools share code, styling, state |
| **Tool Configuration** | Config-driven (add new tool = database row + JSON config) |
| **Admin Control** | Full CRUD: activate/deactivate/archive, descriptions, attachments |
| **Course Allocation** | **Admin manually allocates tools to courses** |
| **Access Control** | User enrollment (LearnWorlds) × Tool allocation (Admin) = Access |
| **Modular Build** | Each phase delivers working functionality |

### The Admin Allocation Model (Summary)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALLOCATION MODEL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WHO CONTROLS WHAT:                                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ADMIN controls:                                                 │
│  • Which tools exist                                             │
│  • Which courses each tool is allocated to                       │
│  • Display order within each course                              │
│  • Tool status (Draft/Active/Inactive/Archived)                  │
│  • Tool descriptions, attachments, configuration                 │
│                                                                  │
│  LEARNWORLDS controls:                                           │
│  • Which courses exist                                           │
│  • Which users are enrolled in which courses                     │
│  • User authentication                                           │
│                                                                  │
│  SYSTEM calculates:                                              │
│  • User access = (enrolled courses) ∩ (allocated courses)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Ready to start when you are! 🚀

---

*Developer Plan Version: 1.1*
*Updated: December 2024*
*Key Addition: Detailed admin tool-to-course allocation workflow*
