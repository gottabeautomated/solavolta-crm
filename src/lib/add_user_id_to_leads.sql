-- Add user_id column to leads table for Row Level Security
-- This script should be run before executing status_management_tables.sql

-- Add user_id column if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add comment for documentation
COMMENT ON COLUMN leads.user_id IS 'User ID for Row Level Security - links lead to authenticated user';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Enable Row Level Security on leads table if not already enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads table
-- Users can only see their own leads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view own leads') THEN
        CREATE POLICY "Users can view own leads" ON leads
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can insert their own leads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can insert own leads') THEN
        CREATE POLICY "Users can insert own leads" ON leads
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own leads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can update own leads') THEN
        CREATE POLICY "Users can update own leads" ON leads
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can delete their own leads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can delete own leads') THEN
        CREATE POLICY "Users can delete own leads" ON leads
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$; 