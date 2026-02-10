-- Create table to track sync history
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  sheet_to_db INTEGER DEFAULT 0,
  db_to_sheet INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add sync tracking columns to employee_contacts
ALTER TABLE employee_contacts 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_synced_from TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_last_sync ON employee_contacts(last_synced_at DESC);
