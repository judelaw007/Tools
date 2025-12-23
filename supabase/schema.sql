-- ===========================================
-- MojiTax Tools - Supabase Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension (still needed for other tables)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TOOLS TABLE
-- ===========================================
-- Stores tool metadata (synced from developer uploads)
-- NOTE: id is TEXT to match application tool IDs (e.g., 'gir-globe-calculator')

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  tool_type VARCHAR(50) NOT NULL CHECK (tool_type IN ('calculator', 'search', 'validator', 'generator', 'tracker', 'reference', 'external-link', 'spreadsheet', 'form')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('transfer_pricing', 'vat', 'fatca_crs', 'withholding_tax', 'pillar_two', 'pe_assessment', 'cross_category')),
  icon VARCHAR(100),
  short_description TEXT,
  description TEXT,
  preview_image VARCHAR(500),
  config JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);

-- ===========================================
-- COURSE_TOOL_ALLOCATIONS TABLE
-- ===========================================
-- Maps LearnWorlds courses to tools
-- course_id should match LearnWorlds product ID
-- tool_id is TEXT to match tools.id

CREATE TABLE IF NOT EXISTS course_tool_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id VARCHAR(255) NOT NULL, -- LearnWorlds course/product ID
  course_name VARCHAR(255), -- Cached course name from LearnWorlds
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  access_level VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (access_level IN ('full', 'limited', 'preview')),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, tool_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_allocations_course ON course_tool_allocations(course_id);
CREATE INDEX IF NOT EXISTS idx_allocations_tool ON course_tool_allocations(tool_id);

-- ===========================================
-- ADMIN_USERS TABLE
-- ===========================================
-- Stores admin user metadata (linked to Supabase Auth)

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- TOOL_USAGE_LOGS TABLE
-- ===========================================
-- Track tool usage for analytics
-- tool_id is TEXT to match tools.id

CREATE TABLE IF NOT EXISTS tool_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_email VARCHAR(255), -- LearnWorlds user email
  learnworlds_user_id VARCHAR(255), -- LearnWorlds user ID
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'calculate', 'save', 'export', 'error')),
  metadata JSONB,
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_tool ON tool_usage_logs(tool_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON tool_usage_logs(created_at);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tool_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage_logs ENABLE ROW LEVEL SECURITY;

-- TOOLS policies
-- Anyone can read active tools
CREATE POLICY "Anyone can view active tools"
  ON tools FOR SELECT
  USING (status = 'active');

-- Only admins can view all tools
CREATE POLICY "Admins can view all tools"
  ON tools FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- Only admins can insert/update/delete tools
CREATE POLICY "Admins can manage tools"
  ON tools FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- COURSE_TOOL_ALLOCATIONS policies
-- Anyone can read allocations (needed for access control)
CREATE POLICY "Anyone can view allocations"
  ON course_tool_allocations FOR SELECT
  USING (true);

-- Only admins can manage allocations
CREATE POLICY "Admins can manage allocations"
  ON course_tool_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- ADMIN_USERS policies
-- Only super_admins can view admin list
CREATE POLICY "Super admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
    OR id = auth.uid()
  );

-- Only super_admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
  );

-- TOOL_USAGE_LOGS policies
-- Only admins can view logs
CREATE POLICY "Admins can view usage logs"
  ON tool_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true)
  );

-- Anyone can insert logs (for tracking)
CREATE POLICY "Anyone can log usage"
  ON tool_usage_logs FOR INSERT
  WITH CHECK (true);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tools_updated_at ON tools;
CREATE TRIGGER tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS allocations_updated_at ON course_tool_allocations;
CREATE TRIGGER allocations_updated_at
  BEFORE UPDATE ON course_tool_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Get tools for a course (used by access control)
CREATE OR REPLACE FUNCTION get_tools_for_course(p_course_id VARCHAR)
RETURNS TABLE (tool_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT cta.tool_id
  FROM course_tool_allocations cta
  WHERE cta.course_id = p_course_id AND cta.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get courses for a tool (used by access control)
CREATE OR REPLACE FUNCTION get_courses_for_tool(p_tool_id TEXT)
RETURNS TABLE (course_id VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT cta.course_id
  FROM course_tool_allocations cta
  WHERE cta.tool_id = p_tool_id AND cta.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- USER_SAVED_WORK TABLE
-- ===========================================
-- Stores user's saved calculations, assessments, and other tool work
-- Linked to user via email (from LearnWorlds authentication)

CREATE TABLE IF NOT EXISTS user_saved_work (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_saved_work_user_tool ON user_saved_work(user_email, tool_id);
CREATE INDEX IF NOT EXISTS idx_saved_work_updated ON user_saved_work(updated_at DESC);

-- Enable RLS
ALTER TABLE user_saved_work ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role handles email filtering
CREATE POLICY "Service role can manage saved work"
  ON user_saved_work FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS saved_work_updated_at ON user_saved_work;
CREATE TRIGGER saved_work_updated_at
  BEFORE UPDATE ON user_saved_work
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- USER_SKILLS TABLE
-- ===========================================
-- Stores user skills automatically detected from platform activity
-- Skills are evidence-based: course completion, tool usage, saved work

CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  skill_category VARCHAR(100) NOT NULL, -- e.g., 'pillar_two', 'transfer_pricing', 'vat'
  skill_level VARCHAR(50) NOT NULL DEFAULT 'familiar' CHECK (skill_level IN ('familiar', 'proficient', 'expert')),
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('course_completed', 'tool_used', 'work_saved')),
  evidence_source_id VARCHAR(255) NOT NULL, -- course_id, tool_id, etc.
  evidence_source_name VARCHAR(255), -- Human-readable name of the source
  evidence_count INT NOT NULL DEFAULT 1, -- Number of times evidence was recorded (for tool usage)
  is_visible BOOLEAN NOT NULL DEFAULT true, -- User can hide skills they don't want shown
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, skill_name, evidence_type, evidence_source_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_skills_email ON user_skills(user_email);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON user_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_user_skills_level ON user_skills(skill_level);

-- Enable RLS
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Service role handles email filtering
CREATE POLICY "Service role can manage user skills"
  ON user_skills FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_skills_updated_at ON user_skills;
CREATE TRIGGER user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- SKILL LEVEL THRESHOLDS
-- ===========================================
-- Defines how many uses of a tool = what skill level
-- This is used by the API to determine skill levels

-- Skill levels based on tool usage:
-- familiar: 1-4 uses
-- proficient: 5-14 uses
-- expert: 15+ uses

-- Skill levels based on course completion:
-- Course completed = proficient (direct knowledge)
-- Course + tool usage in that area = expert

-- Helper function to determine skill level from usage count
CREATE OR REPLACE FUNCTION get_skill_level_from_count(usage_count INT)
RETURNS VARCHAR(50) AS $$
BEGIN
  IF usage_count >= 15 THEN
    RETURN 'expert';
  ELSIF usage_count >= 5 THEN
    RETURN 'proficient';
  ELSE
    RETURN 'familiar';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SKILL_CATEGORIES TABLE (Admin-defined)
-- ===========================================
-- Main skill categories defined by admin (e.g., "Pillar 2 Skills")

CREATE TABLE IF NOT EXISTS skill_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL, -- e.g., "Pillar 2 Skills"
  slug VARCHAR(255) UNIQUE NOT NULL, -- e.g., "pillar-2-skills"
  knowledge_description TEXT, -- Rich description for Knowledge section
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_categories_active ON skill_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_skill_categories_order ON skill_categories(display_order);

-- Enable RLS
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active skill categories"
  ON skill_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage skill categories"
  ON skill_categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS skill_categories_updated_at ON skill_categories;
CREATE TRIGGER skill_categories_updated_at
  BEFORE UPDATE ON skill_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- SKILL_CATEGORY_COURSES TABLE
-- ===========================================
-- Links courses to skill categories (for Knowledge)

CREATE TABLE IF NOT EXISTS skill_category_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  course_id VARCHAR(255) NOT NULL, -- LearnWorlds course ID
  course_name VARCHAR(255), -- Cached course name
  knowledge_description TEXT, -- Description shown when user completes THIS course
  learning_hours DECIMAL(5,1) DEFAULT NULL, -- Estimated learning hours (admin-configured)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_cat_courses_category ON skill_category_courses(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_cat_courses_course ON skill_category_courses(course_id);

-- Enable RLS
ALTER TABLE skill_category_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view skill category courses"
  ON skill_category_courses FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage skill category courses"
  ON skill_category_courses FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================================
-- SKILL_CATEGORY_TOOLS TABLE
-- ===========================================
-- Links tools to skill categories (for Application)

CREATE TABLE IF NOT EXISTS skill_category_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  tool_name VARCHAR(255), -- Cached tool name
  application_description TEXT, -- Rich description for this tool's Application
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, tool_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_cat_tools_category ON skill_category_tools(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_cat_tools_tool ON skill_category_tools(tool_id);

-- Enable RLS
ALTER TABLE skill_category_tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view skill category tools"
  ON skill_category_tools FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage skill category tools"
  ON skill_category_tools FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS skill_cat_tools_updated_at ON skill_category_tools;
CREATE TRIGGER skill_cat_tools_updated_at
  BEFORE UPDATE ON skill_category_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- USER_SKILL_PROGRESS TABLE
-- ===========================================
-- Tracks user progress for each skill category

CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  -- Knowledge tracking
  knowledge_completed BOOLEAN NOT NULL DEFAULT false,
  knowledge_completed_at TIMESTAMPTZ,
  knowledge_course_id VARCHAR(255), -- Which course triggered completion
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_email ON user_skill_progress(user_email);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_category ON user_skill_progress(category_id);

-- Enable RLS
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage user skill progress"
  ON user_skill_progress FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_skill_progress_updated_at ON user_skill_progress;
CREATE TRIGGER user_skill_progress_updated_at
  BEFORE UPDATE ON user_skill_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- USER_TOOL_PROJECTS TABLE
-- ===========================================
-- Tracks user project completions per tool (for Application)

CREATE TABLE IF NOT EXISTS user_tool_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  project_count INT NOT NULL DEFAULT 0,
  last_project_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, tool_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tool_projects_email ON user_tool_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_user_tool_projects_tool ON user_tool_projects(tool_id);

-- Enable RLS
ALTER TABLE user_tool_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage user tool projects"
  ON user_tool_projects FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_tool_projects_updated_at ON user_tool_projects;
CREATE TRIGGER user_tool_projects_updated_at
  BEFORE UPDATE ON user_tool_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- USER_COURSE_COMPLETIONS TABLE
-- ===========================================
-- Tracks individual course completions with progress scores
-- This enables per-course knowledge tracking in the Skills Matrix

CREATE TABLE IF NOT EXISTS user_course_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  course_id VARCHAR(255) NOT NULL, -- LearnWorlds course ID
  course_name VARCHAR(255), -- Cached course name
  category_id UUID REFERENCES skill_categories(id) ON DELETE SET NULL, -- Which skill category this course belongs to
  progress_score INT NOT NULL DEFAULT 0 CHECK (progress_score >= 0 AND progress_score <= 100), -- 0-100 from LearnWorlds
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, course_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_course_completions_email ON user_course_completions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_course_completions_course ON user_course_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_completions_category ON user_course_completions(category_id);

-- Enable RLS
ALTER TABLE user_course_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage user course completions"
  ON user_course_completions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS user_course_completions_updated_at ON user_course_completions;
CREATE TRIGGER user_course_completions_updated_at
  BEFORE UPDATE ON user_course_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- SKILL_VERIFICATIONS TABLE
-- ===========================================
-- Stores verification records for printed/PDF skill portfolios
-- Each record contains a snapshot of skills at print time
-- QR codes link to verification pages using the token

CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(64) UNIQUE NOT NULL, -- URL-safe verification token
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255), -- User's display name at time of creation
  skills_snapshot JSONB NOT NULL, -- Full snapshot of skills at verification time
  selected_skill_ids TEXT[], -- Array of category IDs that were selected for print
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiry (null = never expires)
  view_count INT NOT NULL DEFAULT 0 -- Track how many times verification was viewed
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_verifications_token ON skill_verifications(token);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_email ON skill_verifications(user_email);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_created ON skill_verifications(created_at DESC);

-- Enable RLS
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view verifications (public verification page)
CREATE POLICY "Anyone can view skill verifications"
  ON skill_verifications FOR SELECT
  USING (true);

-- Service role can create verifications
CREATE POLICY "Service role can manage skill verifications"
  ON skill_verifications FOR ALL
  USING (true)
  WITH CHECK (true);
