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
