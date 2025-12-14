# User Saved Work - Implementation Plan

## Overview

This document outlines the implementation of persistent, database-backed storage for user saved work (calculations, assessments, forms, etc.) across all MojiTax tools.

## Goals

1. **Persistent Storage**: User work saved to Supabase, accessible from any device
2. **User Association**: All saves linked to user's email (from LearnWorlds)
3. **Tool Agnostic**: Generic system that works with any tool type
4. **Future-Proof**: Easy to extend for new tools
5. **Backward Compatible**: Graceful fallback to localStorage if API fails

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Tool Component                          │
│  (GloBECalculator, SafeHarbourQualifier, etc.)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    useSavedWork Hook                         │
│  - Loads saved items on mount                                │
│  - Provides save/delete functions                            │
│  - Handles loading/error states                              │
│  - Falls back to localStorage if offline                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  /api/user/saved-work                        │
│  GET    - List user's saved work for a tool                  │
│  POST   - Create new saved work                              │
│  PUT    - Update existing saved work                         │
│  DELETE - Delete saved work                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase: user_saved_work table                 │
│  - id (UUID)                                                 │
│  - user_email (VARCHAR) - indexed                            │
│  - tool_id (TEXT) - references tools table                   │
│  - name (VARCHAR) - user-friendly name                       │
│  - data (JSONB) - the actual saved data                      │
│  - created_at, updated_at (TIMESTAMPTZ)                      │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
CREATE TABLE user_saved_work (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_saved_work_user_tool ON user_saved_work(user_email, tool_id);
CREATE INDEX idx_saved_work_updated ON user_saved_work(updated_at DESC);

-- RLS Policy: Users can only access their own saved work
ALTER TABLE user_saved_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved work"
  ON user_saved_work FOR SELECT
  USING (true); -- Service role handles filtering by email

CREATE POLICY "Users can insert own saved work"
  ON user_saved_work FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own saved work"
  ON user_saved_work FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete own saved work"
  ON user_saved_work FOR DELETE
  USING (true);
```

## API Routes

### GET /api/user/saved-work?toolId={toolId}
Returns all saved work for the current user and specified tool.

### POST /api/user/saved-work
Creates a new saved work entry.
```json
{
  "toolId": "gir-globe-calculator",
  "name": "Q4 2024 Calculation",
  "data": { ... }
}
```

### PUT /api/user/saved-work/{id}
Updates an existing saved work entry.

### DELETE /api/user/saved-work/{id}
Deletes a saved work entry.

## useSavedWork Hook

```typescript
interface UseSavedWorkOptions {
  toolId: string;
  userEmail?: string;
}

interface SavedWorkItem {
  id: string;
  name: string;
  data: any;
  updatedAt: Date;
}

function useSavedWork(options: UseSavedWorkOptions) {
  return {
    items: SavedWorkItem[],
    isLoading: boolean,
    error: Error | null,
    save: (name: string, data: any) => Promise<string>,
    update: (id: string, data: Partial<SavedWorkItem>) => Promise<void>,
    remove: (id: string) => Promise<void>,
    refresh: () => Promise<void>,
  };
}
```

## Migration Strategy

1. New saves go to database
2. On first load, check localStorage for existing saves
3. If found, offer to migrate to database
4. Keep localStorage as offline fallback

## Files to Create/Modify

### New Files
- `supabase/migrations/002_user_saved_work.sql` - Database migration
- `lib/saved-work/index.ts` - Types and utilities
- `lib/saved-work/api.ts` - API client functions
- `hooks/useSavedWork.ts` - React hook
- `app/api/user/saved-work/route.ts` - API routes
- `app/api/user/saved-work/[id]/route.ts` - Individual item routes

### Modified Files
- `components/tools/ToolPageClient.tsx` - Use new hook
- `supabase/schema.sql` - Add table definition

## Implementation Order

1. ✅ Create this plan document
2. Add database table to schema.sql
3. Create API routes
4. Create useSavedWork hook
5. Update ToolPageClient
6. Test with existing tools
7. Commit and push

## Future Tool Development

When creating a new tool, developers should:

1. Define their saved data type:
```typescript
interface MySavedToolData {
  // Tool-specific fields
}
```

2. Use the useSavedWork hook:
```typescript
const { items, save, remove, isLoading } = useSavedWork({
  toolId: 'my-new-tool',
  userEmail,
});
```

3. The hook handles all persistence automatically.
