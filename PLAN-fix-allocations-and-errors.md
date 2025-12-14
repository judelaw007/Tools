# Plan: Fix Tool Allocations & Related Issues

## Overview
Three interconnected issues preventing the dashboard from working correctly:

1. **Allocations not persisting** - Supabase table missing/wrong schema
2. **401 errors in console** - Student-view API called for non-admins
3. **Public tool page shows no courses** - Wrong import used

---

## Issue 1: Allocations Not Persisting (REQUIRES USER ACTION)

### Root Cause
The `course_tool_allocations` table either doesn't exist in Supabase or has the wrong schema.

### Solution
User must run this SQL in Supabase SQL Editor:

```sql
-- Create the course_tool_allocations table
CREATE TABLE IF NOT EXISTS course_tool_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  course_name TEXT,
  tool_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, tool_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_course_allocations_course ON course_tool_allocations(course_id);
CREATE INDEX IF NOT EXISTS idx_course_allocations_tool ON course_tool_allocations(tool_id);
```

### Verification
After creating table, allocate tools in Admin → Courses, then refresh - allocations should persist.

---

## Issue 2: 401 Errors for Non-Admin Users

### Root Cause
File: `lib/student-view/context.tsx`

The `useEffect` on mount checks localStorage for saved student-view state and calls `syncToServer()` which POSTs to `/api/admin/student-view` - even for regular (non-admin) users.

```javascript
// Current problematic code (lines 25-37)
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    setState(parsed);
    syncToServer(parsed); // <-- Called for ALL users!
  }
}, []);
```

### Solution
Only sync to server if the current user is an admin. We need to:
1. Check if user is admin before syncing
2. Clear localStorage if user is not admin (clean up stale data)

### Implementation
Modify `lib/student-view/context.tsx`:
- Add `isAdmin` prop or fetch admin status
- Only call `syncToServer` if admin
- Clear localStorage for non-admins

---

## Issue 3: Public Tool Page Shows "No Courses Offer This Tool"

### Root Cause
File: `app/(public)/tools/[slug]/page.tsx`

Line 11 imports from wrong location:
```javascript
import { getToolBySlug, getCoursesForTool } from '@/lib/db';
```

The `getCoursesForTool` in `lib/db/index.ts` is a legacy placeholder that returns `[]`:
```javascript
export async function getCoursesForTool(toolId: string): Promise<Course[]> {
  return []; // Always empty!
}
```

### Solution
1. Import `getCoursesForTool` from `lib/course-allocations` instead
2. This returns `string[]` (course IDs), so we need to adapt the display
3. Fetch course names from the allocations table or display course IDs

### Implementation
Modify `app/(public)/tools/[slug]/page.tsx`:
- Change import to use `lib/course-allocations`
- Update the courses display to work with course IDs and names from allocations

---

## Execution Order

1. **Issue 2** - Fix 401 errors (code change)
2. **Issue 3** - Fix public tool page (code change)
3. **Issue 1** - User creates Supabase table (user action)
4. **Test** - Allocate tools, verify dashboard shows courses

---

## Files to Modify

| File | Change |
|------|--------|
| `lib/student-view/context.tsx` | Only sync if admin |
| `app/(public)/tools/[slug]/page.tsx` | Fix course import |
| `lib/course-allocations.ts` | Add helper to get courses with names for tool |

---

## Estimated Changes
- ~20 lines in student-view context
- ~30 lines in public tool page
- ~20 lines helper function (optional)
