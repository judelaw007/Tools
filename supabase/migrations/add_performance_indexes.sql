-- ===========================================
-- Performance Indexes for Journey Tracking & Skills
-- ===========================================
-- Run this in Supabase SQL Editor.
-- All statements are idempotent (IF NOT EXISTS).
-- Expected impact: faster skills sync, faster tool usage queries,
-- and data integrity on project counts.

-- -----------------------------------------
-- tool_usage_logs — high-traffic table
-- -----------------------------------------
-- Existing: idx_usage_tool (tool_id), idx_usage_created (created_at)

-- Needed by: syncToolUsageSkills() which filters by user_email + action
CREATE INDEX IF NOT EXISTS idx_usage_user_email
  ON tool_usage_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_usage_user_action
  ON tool_usage_logs(user_email, action);

-- Needed by: session-level analytics (grouping events by session)
CREATE INDEX IF NOT EXISTS idx_usage_session_id
  ON tool_usage_logs(session_id);

-- -----------------------------------------
-- user_skills — queried on every calculation
-- -----------------------------------------
-- Existing: idx_user_skills_email, idx_user_skills_category, idx_user_skills_level

-- Needed by: incrementToolUsage() exact-match lookup
-- Matches the UNIQUE constraint columns for fast upsert checks
CREATE INDEX IF NOT EXISTS idx_user_skills_evidence_lookup
  ON user_skills(user_email, skill_name, evidence_type, evidence_source_id);

-- Needed by: getVisibleUserSkills() which filters email + is_visible
CREATE INDEX IF NOT EXISTS idx_user_skills_visible
  ON user_skills(user_email, is_visible);

-- -----------------------------------------
-- user_tool_projects — data integrity
-- -----------------------------------------

-- Prevent negative project counts from bugs
ALTER TABLE user_tool_projects
  DROP CONSTRAINT IF EXISTS project_count_positive;

ALTER TABLE user_tool_projects
  ADD CONSTRAINT project_count_positive
  CHECK (project_count >= 0);
