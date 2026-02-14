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
| `SSO_SECRET` | Secret for session encryption (AES-256-GCM, must be ≥32 chars) | No |
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

**No-Door Model**: There is no visible login page. Users arrive via LearnWorlds "Access Tools" button, verify via email code, and get a `mojitax-session` cookie (AES-256-GCM encrypted, httpOnly). Unauthenticated users redirect to mojitax.co.uk. Admin access is at `/auth/admin`.

### Access Control Logic
User tool access = intersection of user's LearnWorlds enrollments and course-tool allocations in `course_tool_allocations` table. Admins bypass all checks. Enrollments refresh every 24 hours. Implemented in `lib/learnworlds/access-control.ts` and `lib/course-allocations.ts`.

**Tool Visibility Rule**: Tools with zero course allocations are completely invisible to non-admin users. `getPublicTools()` in `lib/db/index.ts` filters through `getAllocatedToolIds()`, the tool page returns `notFound()`, and the API returns 404. The `course_tool_allocations` table does **not** have an `is_active` column in the deployed database — never filter by it.

### Tool System
Tools are React components in `components/tools/calculator/`. Each tool (GloBECalculator, FilingDeadlineCalculator, SafeHarbourQualifier, DFEAssessmentTool, GIRPracticeForm, AuditFileChecklist) is a self-contained 4-file folder (`types.ts`, `utils.ts`, `ToolName.tsx`, `index.ts`). The tool registry at `lib/tools/registry.ts` maps tool types to components and defines metadata for types (calculator, search, validator, generator, tracker, reference, external-link, spreadsheet, form) and categories (transfer_pricing, vat, fatca_crs, withholding_tax, pillar_two, pe_assessment, cross_category).

**Adding new tools**: Follow the standardised process in `docs/TOOL-CREATION-GUIDE.md`. Key registration points: component folder, `CALCULATOR_COMPONENTS` registry in `components/tools/calculator/index.ts`, render block in `components/tools/ToolPageClient.tsx`, database `tools` record, and `course_tool_allocations` row.

### Journey Tracking
All 6 tools are instrumented with tracking callbacks via `hooks/useToolTracking.ts`. The hook generates a per-session UUID and fires events to `POST /api/tools/track` (fire-and-forget, `keepalive: true`). The API endpoint writes to `tool_usage_logs`, updates `user_skills` via `incrementToolUsage()` on `calculate` events, updates `user_tool_projects` via `incrementToolProjectCount()` on `workflow_complete` events, and logs to the activity dashboard. Skill auto-levelling: 1-4 uses = familiar, 5-14 = proficient, 15+ = expert.

### Key Modules in `lib/`
- `supabase/` — Server/client Supabase clients (service role pattern for server ops)
- `learnworlds/` — LearnWorlds API client, types, and access control
- `auth/` — Auth context (`context.tsx` fetches session via `/api/auth/me`), types, session handling
- `secure-session.ts` — AES-256-GCM session encryption/decryption using Web Crypto API (Edge-compatible)
- `server-session.ts` — Server-side session reading (uses `unsealSession`)
- `session.ts` — Session types, enrollment refresh logic
- `rate-limit.ts` — In-memory IP-based rate limiter for auth endpoints
- `saved-work/` — User saved work persistence (CRUD against Supabase)
- `skills/` — Skill tracking with auto-detection from usage (1-4 uses = familiar, 5-14 = proficient, 15+ = expert)
- `skill-verifications/` — QR code verification for skill portfolios
- `activity-logs/` — User activity tracking
- `hooks/useToolTracking.ts` — Client-side journey tracking hook (session lifecycle, step changes, calculations, errors, completion)
- `app/api/tools/track/route.ts` — Server endpoint for tracking events (writes to `tool_usage_logs`, `user_skills`, `user_tool_projects`, `activity_logs`)

### Security Architecture
- **Session cookies**: Encrypted with AES-256-GCM (PBKDF2 key derivation from `SSO_SECRET`), `httpOnly`, `secure`, `sameSite=lax`. Format: `salt.iv.ciphertext` (base64url). Legacy base64 sessions are accepted on read but re-sealed on next write.
- **Client auth**: `AuthProvider` calls `GET /api/auth/me` to hydrate user state (cookies are httpOnly, not readable via `document.cookie`).
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, and CSP are set on all middleware responses.
- **Rate limiting**: `/api/auth/send-code` (5/15min), `/api/auth/verify-code` (10/15min), `/api/auth/admin/login` (5/15min) per IP.
- **XSS prevention**: No `dangerouslySetInnerHTML` in codebase. Formula evaluation uses `expr-eval` (no `new Function()`).
- **Error boundary**: `app/global-error.tsx` catches unhandled errors without leaking stack traces.
- **Health check**: `GET /api/health` returns `{ status: 'ok' }`.

### Database Schema
Defined in `supabase/schema.sql`. Key tables: `tools`, `course_tool_allocations`, `admin_users`, `tool_usage_logs`, `user_saved_work`, `user_skills`, `skill_categories`, `user_skill_progress`, `user_tool_projects`, `user_course_completions`, `skill_verifications`.

### Deployment
Configured for Replit (see `.replit`). Webpack polling enabled for cloud file watching. Dev server binds to `0.0.0.0:5000`.
