# How to Use — MojiTax Tools Platform

This guide covers the platform from three perspectives:

1. [For Users](#1-for-users) — accessing and using tools
2. [For Admins](#2-for-admins) — managing tools, courses, and skills
3. [For Course & Tool Setup](#3-for-course--tool-setup) — adding new courses and tools to the platform

---

## 1. For Users

### Getting Access

There is no traditional login page. Access works through your LearnWorlds course:

1. **From LearnWorlds** — Click the "Access Tools" button inside your course. Your email is passed automatically.
2. **Direct visit** — Go to `tools.mojitax.co.uk`. If you have an existing session, you're taken straight to your dashboard. If not, you're redirected to mojitax.co.uk.

### Email Verification

When accessing for the first time (or after your session expires):

1. Enter your email address (the same one used for your MojiTax account).
2. A 6-digit verification code is sent to your email (valid for 5 minutes).
3. Enter the code — it auto-submits when all 6 digits are entered.
4. You're redirected to your dashboard. Sessions last 30 days if "Remember me" is checked.

### Dashboard

Your dashboard at `/dashboard` shows:

- **Quick stats** — courses you have access to, available tools, locked courses, and total enrollments.
- **Course cards** — each course shows its allocated tools. Cards are colour-coded: green if you have access, grey if locked.
- **"View Tools" button** — opens the tools for that course.
- **"Enroll to Access" button** — appears on locked courses, links to the LearnWorlds course page.

### Browsing Tools

The public tools page at `/tools` lists all available tools grouped by category. Each tool card shows:

- Tool name and short description
- Tool type (calculator, form, validator, etc.)
- "Preview" link

Clicking a tool opens its detail page.

### Using a Tool

When you open a tool you have access to:

- The full interactive tool loads (calculator, form, checklist, etc.)
- Multi-step tools have numbered steps you navigate through
- Results appear inline after each calculation

**Saving your work:**
- Click "Save" at any point to persist your inputs and results
- Saved work is stored in the database and syncs across devices
- If the database is unavailable, work is saved locally in your browser
- Load previous saves from the saved items list in each tool

**Disclaimer:** All tools are educational demos. Results are illustrative and should not be used for actual tax filings.

### Skills Portfolio

Your skills build automatically as you use tools. Visit `/dashboard/skills` to see your Skills Matrix:

- **Knowledge** — populated when you complete LearnWorlds courses
- **Application** — populated when you use tools and complete workflows

Skill levels progress automatically:
- 1–4 uses = Familiar
- 5–14 uses = Proficient
- 15+ uses = Expert

**Printing your portfolio:**
1. Click "Print / PDF"
2. A QR code is generated for verification
3. Print or save as PDF — employers can scan the QR code to verify authenticity

---

## 2. For Admins

### Logging In

Admins use a dedicated login page at `/auth/admin` with email and password (Supabase Auth). After login, you're redirected to `/admin`.

To grant admin access, add the user's email to the `ADMIN_EMAILS` environment variable and create a record in the `admin_users` table.

### Admin Dashboard

The overview page at `/admin` shows:

- **Total Tools** — with active/draft breakdown
- **Total Users** — from LearnWorlds
- **Usage Today** — tool submissions today
- **Allocated Tools** — tools linked to courses

Quick links take you to Activity Logs and Tool Management.

### Managing Tools

**Page:** `/admin/tools`

Admins categorise and manage tools that developers have created. You can:

- **Search and filter** by name, status (Live / Draft / Inactive / Archived), or category
- **Switch views** between grid and list
- **Edit a tool** — click a tool card to open the edit modal:
  - Change the name, short description, category, or status
  - Preview the tool in a new tab
- **Quick status toggle** — activate or deactivate a tool from the dropdown menu

**Status meanings:**
| Status | Visible to Users | Notes |
|--------|-----------------|-------|
| Live (active) | Yes (if allocated to a course) | Normal operating state |
| Draft | No | In development |
| Inactive | No | Temporarily hidden |
| Archived | No | Retired |

**Important:** A tool must be both "active" **and** allocated to at least one course to be visible to users.

### Managing Courses & Allocations

**Page:** `/admin/courses`

This page shows products from LearnWorlds. Use the tabs to filter by type: All, Courses, Bundles, or Subscriptions.

**Allocating tools to a course:**

1. Find the course in the list.
2. Click "Allocate Tools".
3. A modal shows all available tools — tick the ones that should be included with this course.
4. Click "Save Allocations".

Only **courses** can have tools allocated directly. Bundles and subscriptions grant access through their included courses.

**Access logic:** A user can access a tool if they are enrolled in any course that has that tool allocated. Enrolment can come from a direct purchase, a bundle, or a subscription.

**Visibility rule:** Tools with zero course allocations are completely invisible to non-admin users — they won't appear on the tools listing page, individual tool pages, or the API.

### Activity Logs

**Page:** `/admin/activity`

Monitor platform activity with:

- **7-day stats** — total activities, active users, QR verifications, projects saved
- **Filterable feed** — filter by activity type (login, logout, tool access, project save, skills sync, etc.) or user email
- **Auto-refresh** — toggle automatic 30-second refresh
- **Activity breakdown chart** — bar chart of activity types over the past 7 days

### Skills Configuration

**Page:** `/admin/skills`

Define skill categories that combine Knowledge (courses) and Application (tools):

**Creating a skill category:**
1. Click "Create Category".
2. Enter a name, slug, and display order.
3. Save.

**Configuring a category:**
1. Click a category card to expand it.
2. **Add courses** (Knowledge): Select a LearnWorlds course, set learning hours, and write a knowledge description (e.g., "Has demonstrated understanding of Pillar Two fundamentals").
3. **Add tools** (Application): Select a tool and write an application description (e.g., "Can perform GloBE ETR calculations").
4. Click "Save Changes" when done.

These descriptions appear in the user's Skills Portfolio when they complete the linked courses or use the linked tools.

### Student View

Preview the platform as different user types using the "Student View" selector in the admin sidebar:

- **No Account** — see what unauthenticated visitors see
- **Account, No Courses** — see what a user with no enrollments sees
- **Account + Course** — select a specific course to see what an enrolled user sees

An amber banner and "Exit Student View" button appear while in this mode.

---

## 3. For Course & Tool Setup

This section is for the person responsible for adding new courses to the platform and connecting them with tools. It covers the end-to-end process from LearnWorlds course creation to tool availability.

### Overview: What Needs to Happen

When a new course is created in LearnWorlds and needs tools on the platform, three things must be set up:

1. **Tools** — built by a developer (see `docs/TOOL-CREATION-GUIDE.md`)
2. **Course-tool allocations** — configured by an admin
3. **Skill categories** — configured by an admin (optional but recommended)

### Step-by-Step: New Course with Existing Tools

If the tools already exist and you just need to connect a new course:

1. **Create the course in LearnWorlds** as normal.
2. **Log in to the admin panel** at `/auth/admin`.
3. **Go to Courses** (`/admin/courses`).
4. **Find your new course** — it appears automatically from the LearnWorlds API. Use the search bar if needed.
5. **Click "Allocate Tools"** on the course card.
6. **Select the tools** that should be available to students enrolled in this course.
7. **Click "Save Allocations"**.
8. **Verify** — use Student View (select "Account + [your course]") to confirm the tools appear.

That's it. Users enrolled in the course (directly, via bundle, or via subscription) will now see the allocated tools.

### Step-by-Step: New Course with New Tools

If the course needs tools that don't exist yet:

#### Phase 1: Tool Development

A developer builds the tool following `docs/TOOL-CREATION-GUIDE.md`. The key steps are:

1. Create the component folder in `components/tools/calculator/NewTool/` with 4 files:
   - `types.ts` — data interfaces and component props (including tracking props)
   - `utils.ts` — calculations, constants, helpers
   - `NewTool.tsx` — the main React component
   - `index.ts` — public exports
2. Register the tool in `components/tools/calculator/index.ts` (add to `CALCULATOR_COMPONENTS`).
3. Add a render block in `components/tools/ToolPageClient.tsx` with tracking callbacks wired.
4. Insert a database record in the `tools` table (via admin panel or SQL).

The developer should set the tool status to `draft` initially.

#### Phase 2: Admin Configuration

Once the developer confirms the tool is ready:

1. **Activate the tool** — go to `/admin/tools`, find the tool, and change its status to "Live".
2. **Set metadata** — edit the tool's name, short description, and category if needed.
3. **Allocate to course** — go to `/admin/courses`, find the course, click "Allocate Tools", and select the new tool.
4. **Configure skills** (optional) — go to `/admin/skills`:
   - Create a new skill category (or use an existing one)
   - Add the course with learning hours and a knowledge description
   - Add the tool with an application description

#### Phase 3: Verification

Use the following checklist to confirm everything is working:

- [ ] Tool status is "Live" in `/admin/tools`
- [ ] Tool is allocated to the correct course(s) in `/admin/courses`
- [ ] **As admin**: tool appears on `/tools` and loads at `/tools/[slug]`
- [ ] **Student View with course**: tool appears on dashboard and is accessible
- [ ] **Student View without course**: tool is not visible anywhere
- [ ] Using the tool (performing a calculation) creates entries in Activity Logs
- [ ] Completing a workflow shows in the user's Skills Matrix (if skill category configured)
- [ ] Saving work persists correctly (refresh the page to verify)

### Step-by-Step: Removing a Tool from a Course

1. Go to `/admin/courses`.
2. Click "Allocate Tools" on the course.
3. Untick the tool you want to remove.
4. Click "Save Allocations".

The tool becomes inaccessible to users enrolled only in that course. If the tool is still allocated to other courses, users enrolled in those courses can still access it.

### Step-by-Step: Retiring a Tool

1. Go to `/admin/tools`.
2. Find the tool and change its status to "Inactive" (temporary) or "Archived" (permanent).
3. The tool disappears from all user-facing pages regardless of allocations.

### Common Scenarios

#### "Users can't see a tool they should have access to"

Check in order:
1. **Tool status** — must be "active" (Live) in `/admin/tools`
2. **Course allocation** — tool must be allocated to a course in `/admin/courses`
3. **User enrolment** — user must be enrolled in the course via LearnWorlds
4. **Enrolment sync** — enrolments refresh every 24 hours. The user can log out and back in to force a refresh.

#### "A tool appears to users who shouldn't see it"

Check:
1. **Course allocations** — the tool may be allocated to a course the user is enrolled in via a bundle or subscription
2. **Admin role** — admins can see all tools regardless of allocations

#### "Skills aren't updating after tool usage"

Check:
1. **Skill category exists** — the tool must be linked to a skill category in `/admin/skills`
2. **User is performing calculations** — only `calculate` actions increment skills, not just viewing
3. **Manual sync** — user can click "Sync Progress" on their Skills Matrix page

### Reference: Key URLs

| Page | URL | Who |
|------|-----|-----|
| Tools listing | `/tools` | Public |
| Individual tool | `/tools/[slug]` | Public (preview) / Enrolled users (full) |
| User dashboard | `/dashboard` | Authenticated users |
| Skills portfolio | `/dashboard/skills` | Authenticated users |
| Admin login | `/auth/admin` | Admins |
| Admin dashboard | `/admin` | Admins |
| Tool management | `/admin/tools` | Admins |
| Course management | `/admin/courses` | Admins |
| Skills config | `/admin/skills` | Admins |
| Activity logs | `/admin/activity` | Admins |

### Reference: Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/TOOL-CREATION-GUIDE.md` | Developer guide for building new tools |
| `docs/PLATFORM-IMPROVEMENT-PLAN.md` | Architecture decisions and implementation history |
| `CLAUDE.md` | Codebase overview for AI assistants and developers |
