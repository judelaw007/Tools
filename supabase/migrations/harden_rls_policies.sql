-- ===========================================
-- Security Hardening: RLS Policy Tightening
-- ===========================================
-- This migration scopes overly permissive RLS policies to service_role only.
-- All application database access uses the service role key (server-side),
-- so restricting anon access does NOT affect application functionality.
--
-- Fixes addressed:
-- 1. "Service role can manage X" policies lacked TO service_role scope
-- 2. course_tool_allocations was publicly readable via anon key
-- 3. tool_usage_logs was publicly insertable via anon key
-- 4. SECURITY DEFINER functions were callable by anon role
-- 5. Missing verification_codes table definition

-- ===========================================
-- 1. Create verification_codes table (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can manage verification codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage verification codes'
  ) THEN
    CREATE POLICY "Service role can manage verification codes"
      ON verification_codes FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ===========================================
-- 2. Fix course_tool_allocations: restrict anon SELECT
-- ===========================================
DROP POLICY IF EXISTS "Anyone can view allocations" ON course_tool_allocations;

-- Re-create scoped to service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can view allocations'
  ) THEN
    CREATE POLICY "Service role can view allocations"
      ON course_tool_allocations FOR SELECT
      TO service_role
      USING (true);
  END IF;
END $$;

-- ===========================================
-- 3. Fix tool_usage_logs: restrict anon INSERT
-- ===========================================
DROP POLICY IF EXISTS "Anyone can log usage" ON tool_usage_logs;

-- Re-create scoped to service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can log usage'
  ) THEN
    CREATE POLICY "Service role can log usage"
      ON tool_usage_logs FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- ===========================================
-- 4. Fix user_saved_work: scope to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage saved work" ON user_saved_work;

CREATE POLICY "Service role can manage saved work"
  ON user_saved_work FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 5. Fix user_skills: scope to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage user skills" ON user_skills;

CREATE POLICY "Service role can manage user skills"
  ON user_skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 6. Fix skill_categories: scope management policy to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage skill categories" ON skill_categories;

CREATE POLICY "Service role can manage skill categories"
  ON skill_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 7. Fix skill_category_courses: scope management policy to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage skill category courses" ON skill_category_courses;

CREATE POLICY "Service role can manage skill category courses"
  ON skill_category_courses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 8. Fix skill_category_tools: scope management policy to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage skill category tools" ON skill_category_tools;

CREATE POLICY "Service role can manage skill category tools"
  ON skill_category_tools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 9. Fix user_skill_progress: scope to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage user skill progress" ON user_skill_progress;

CREATE POLICY "Service role can manage user skill progress"
  ON user_skill_progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 10. Fix user_tool_projects: scope to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage user tool projects" ON user_tool_projects;

CREATE POLICY "Service role can manage user tool projects"
  ON user_tool_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 11. Fix user_course_completions: scope to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage user course completions" ON user_course_completions;

CREATE POLICY "Service role can manage user course completions"
  ON user_course_completions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 12. Fix skill_verifications: scope management policy to service_role
-- ===========================================
DROP POLICY IF EXISTS "Service role can manage skill verifications" ON skill_verifications;

CREATE POLICY "Service role can manage skill verifications"
  ON skill_verifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- 13. Tighten skill_category_courses: restrict anon SELECT
-- ===========================================
DROP POLICY IF EXISTS "Anyone can view skill category courses" ON skill_category_courses;

CREATE POLICY "Anyone can view skill category courses"
  ON skill_category_courses FOR SELECT
  TO authenticated, service_role
  USING (true);

-- ===========================================
-- 14. Tighten skill_category_tools: restrict anon SELECT
-- ===========================================
DROP POLICY IF EXISTS "Anyone can view skill category tools" ON skill_category_tools;

CREATE POLICY "Anyone can view skill category tools"
  ON skill_category_tools FOR SELECT
  TO authenticated, service_role
  USING (true);

-- ===========================================
-- 15. Revoke anon access to SECURITY DEFINER functions
-- ===========================================
REVOKE EXECUTE ON FUNCTION get_tools_for_course(VARCHAR) FROM anon;
REVOKE EXECUTE ON FUNCTION get_courses_for_tool(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION is_admin(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_skill_level_from_count(INT) FROM anon;
