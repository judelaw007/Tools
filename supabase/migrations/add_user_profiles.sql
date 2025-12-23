-- Create user_profiles table for storing user preferences
-- This includes the portfolio_name which appears on printed Skills Portfolios

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  portfolio_name TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for quick lookups by email
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(user_email);

-- Add comment to explain the table
COMMENT ON TABLE user_profiles IS 'User profile settings including portfolio display name';
COMMENT ON COLUMN user_profiles.portfolio_name IS 'The name displayed on printed Skills Portfolios (e.g., full legal name)';

-- Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on changes
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
