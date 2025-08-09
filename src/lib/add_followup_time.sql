-- Add follow_up_time column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_time time;

-- Optional helpful index (combined date+time queries)
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date_time ON leads(follow_up_date, follow_up_time);


