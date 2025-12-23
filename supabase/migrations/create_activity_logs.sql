-- Activity Logs Table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON activity_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (server-side only)
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can read (admin only via API)
CREATE POLICY "Service role can read activity logs"
  ON activity_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Comment on table
COMMENT ON TABLE activity_logs IS 'Tracks user activities for admin monitoring';
