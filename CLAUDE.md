# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MojiTax Demo Tools Platform — a Next.js 14 (App Router) educational platform providing interactive tax calculation tools bundled with LearnWorlds courses. Users authenticate via LearnWorlds and access tools at tools.mojitax.co.uk based on their course enrollments.

## Commands

```bash
npm run dev              # Start dev server (port 5000 on Replit, 3000 locally)
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint
npm run db:generate      # Generate Drizzle ORM migrations
npm run db:migrate       # Run Drizzle migrations
npm run db:studio        # Open Drizzle Studio (DB browser)
```

No test runner is configured. There are no unit tests in this project.

## Environment Setup

Copy `.env.local.example` to `.env.local`. On Replit, secrets are configured via the Secrets tab (already provisioned for production). The following environment variables are required:

| Variable | Purpose | Client-exposed |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key (RLS-restricted) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS, server-only) | No |
| `LEARNWORLDS_CLIENT_ID` | LearnWorlds OAuth2 client ID | No |
| `LEARNWORLDS_CLIENT_SECRET` | LearnWorlds OAuth2 client secret | No |
| `LEARNWORLDS_ACCESS_TOKEN` | Long-lived LearnWorlds API token | No |
| `LEARNWORLDS_SCHOOL_URL` | LearnWorlds school base URL | No |
| `LEARNWORLDS_API_URL` | LearnWorlds API base URL | No |
| `SSO_SECRET` | Secret for signing SSO tokens | No |
| `ADMIN_EMAILS` | Comma-separated list of admin email addresses | No |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (tools.mojitax.co.uk) | Yes |
| `REPLIT_DOMAINS` | Replit-provided domain (auto-set by Replit) | No |

**Important:** Variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript. Never add secrets to `NEXT_PUBLIC_` variables. All other variables are server-only.

## Architecture

### Tech Stack
- **Framework**: Next.js 14.2.0 with App Router, TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL with RLS); server-side uses service role to bypass RLS
- **Styling**: Tailwind CSS with custom MojiTax brand colors (defined in `tailwind.config.ts`)
- **State**: React Context (auth, student-view), TanStack Query (server state), React Hook Form + Zod (forms)
- **ORM**: Drizzle ORM for migrations; runtime queries use Supabase JS client directly
- **Path alias**: `@/*` maps to project root

### Route Groups & Access Control
The app uses Next.js route groups with middleware-enforced authentication (`middleware.ts`):
- `app/(public)/` — No auth required (public tools listing)
- `app/(auth)/` — Requires authenticated session (user dashboard)
- `app/(admin)/` — Requires admin/super_admin role
- `app/api/` — 35+ API route handlers organized by domain

**No-Door Model**: There is no visible login page. Users arrive via LearnWorlds "Access Tools" button, verify via email code, and get a `mojitax-session` cookie (base64 JSON). Unauthenticated users redirect to mojitax.co.uk. Admin access is at `/auth/admin`.

### Access Control Logic
User tool access = intersection of user's LearnWorlds enrollments and course-tool allocations in `course_tool_allocations` table. Admins bypass all checks. Enrollments refresh every 24 hours. Implemented in `lib/learnworlds/access-control.ts` and `lib/course-allocations.ts`.

### Tool System
Tools are React components in `components/tools/calculator/`. Each tool (GloBECalculator, FilingDeadlineCalculator, SafeHarbourQualifier, DFEAssessmentTool, GIRPracticeForm, AuditFileChecklist) is a self-contained component. The tool registry at `lib/tools/registry.ts` maps tool types to components and defines metadata for types (calculator, search, validator, generator, tracker, reference, external-link, spreadsheet, form) and categories (transfer_pricing, vat, fatca_crs, withholding_tax, pillar_two, pe_assessment, cross_category).

### Key Modules in `lib/`
- `supabase/` — Server/client Supabase clients (service role pattern for server ops)
- `learnworlds/` — LearnWorlds API client, types, and access control
- `auth/` — Auth context, types, session handling (`server-session.ts`, `session.ts`)
- `saved-work/` — User saved work persistence (CRUD against Supabase)
- `skills/` — Skill tracking with auto-detection from usage (1-4 uses = familiar, 5-14 = proficient, 15+ = expert)
- `skill-verifications/` — QR code verification for skill portfolios
- `activity-logs/` — User activity tracking

### Database Schema
Defined in `supabase/schema.sql`. Key tables: `tools`, `course_tool_allocations`, `admin_users`, `tool_usage_logs`, `user_saved_work`, `user_skills`, `skill_categories`, `user_skill_progress`, `user_tool_projects`, `user_course_completions`, `skill_verifications`.

### Deployment
Configured for Replit (see `.replit`). Webpack polling enabled for cloud file watching. Dev server binds to `0.0.0.0:5000`.
