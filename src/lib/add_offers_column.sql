-- Add offers column to leads table
-- This script adds the offers column that stores offer data as JSONB

-- Add offers column if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN leads.offers IS 'JSON array of offer data including type, date, number, and file information';

-- Create index for performance on offers column
CREATE INDEX IF NOT EXISTS idx_leads_offers ON leads USING GIN (offers);

-- Add constraint to ensure offers is always an array
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_offers_is_array') THEN
        ALTER TABLE leads ADD CONSTRAINT check_offers_is_array 
          CHECK (jsonb_typeof(offers) = 'array');
    END IF;
END $$; 