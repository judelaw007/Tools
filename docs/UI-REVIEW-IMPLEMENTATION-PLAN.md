# MojiTax Tools Platform — UI Review & Implementation Plan

**Date:** 2026-02-24
**Status:** In Progress

---

## Overview

This document captures the full UI review findings and the phased implementation plan for the MojiTax Tools Platform. Changes are scoped to frontend/UI only — no database schema modifications.

---

## Phase 1 (Current Sprint)

### P0: New Dashboard Tools Library (`/dashboard/tools`)

**Problem:** The sidebar "Browse Tools" link (`Sidebar.tsx:96`) points to `/tools`, which is in the `(public)` route group. When an authenticated user clicks it, they leave the dashboard layout entirely — the sidebar disappears and they land on the public marketing page with a hero section and `PublicHeader`. This is a broken navigation flow that ejects users from their workspace.

**Solution:** Create a new `/dashboard/tools` page inside the `(auth)` route group that:

- Renders within `DashboardLayout` (sidebar stays visible)
- Shows **all tools the user has access to** across all courses, grouped by course or category
- Shows **locked tools** (from courses user isn't enrolled in) greyed out with enrollment CTAs
- Supports **search and category filtering** within the dashboard
- Acts as a "personal tools library" — not a marketing page

**Routing:**
| Page | Audience | Purpose |
|------|----------|---------|
| `/tools` (public, unchanged) | Unauthenticated visitors | Marketing, discovery, "what's available" |
| `/dashboard/tools` (new) | Logged-in users | Personal tools library, quick access |

**Files to change:**
- `app/(auth)/dashboard/tools/page.tsx` — New page
- `components/dashboard/Sidebar.tsx` — Change "Browse Tools" href from `/tools` to `/dashboard/tools`

---

### P1: Dynamic Category Dropdowns from Registry

**Problem:** The admin tools page (`app/(admin)/admin/tools/page.tsx:39-47`) hardcodes only 6 of the 8 defined categories. `cross_category` and `owner_managed_business` are missing from both the filter dropdown and the edit modal.

**Solution:** Derive category options dynamically from `CATEGORY_METADATA` in `lib/tools/registry.ts`.

**Files to change:**
- `app/(admin)/admin/tools/page.tsx` — Replace hardcoded `categoryOptions` with dynamic generation from `CATEGORY_METADATA`

---

### P2: Fix `replace('_', ' ')` → `replace(/_/g, ' ')`

**Problem:** Several places use `.replace('_', ' ')` which only replaces the first underscore. Categories like `owner_managed_business` render as "owner managed_business".

**Affected files:**
- `components/tools/ToolCard.tsx:119` (admin variant)
- `components/tools/ToolCard.tsx:166` (default variant)
- `app/(admin)/admin/tools/page.tsx:466` (list view)

**Solution:** Use `.replace(/_/g, ' ')` or better, look up `CATEGORY_METADATA[tool.category]?.name`.

---

### P3: Add Activity Logs to Admin Sidebar

**Problem:** The admin Activity Logs page (`/admin/activity`) exists but is not in the admin sidebar nav (`Sidebar.tsx:100-105`). Admins can only reach it by typing the URL or from a dashboard link.

**Solution:** Add an "Activity" nav item to `adminNavItems` with the `Activity` icon from lucide-react.

**Files to change:**
- `components/dashboard/Sidebar.tsx` — Add nav item for `/admin/activity`

---

### P4: Remove Non-functional Notification Bell

**Problem:** `components/dashboard/Header.tsx:63-67` renders a bell icon that does nothing. The notification dot is commented out. This signals broken functionality.

**Solution:** Remove the bell icon button until notifications are actually implemented.

**Files to change:**
- `components/dashboard/Header.tsx` — Remove the bell button

---

## Phase 2 (Next Sprint)

- Add tool type filter to admin tools page
- Add full description (markdown) editing to admin edit modal
- Add tool type field to admin edit modal
- Install toast library (e.g., `sonner`) + success/error feedback on admin actions
- Add save confirmation toast on tool edit

## Phase 3 (Future)

- Replace "Locked Courses" dashboard stat with "Skills Earned" or "Projects Completed"
- Add "Recently Used Tools" / "Continue Working" section on user dashboard
- Extract shared `toolTypeIcons` / `toolTypeColors` to shared utility
- Add search bar to dashboard header

## Phase 4 (Polish)

- Context-aware breadcrumbs (back to specific course)
- Public tools page category filter/search
- Mobile sidebar slide-out drawer
- Bulk admin actions (activate/deactivate/archive)
- Loading skeletons instead of spinners
- Unsaved changes warning on edit modal
- No pagination on admin tools page
