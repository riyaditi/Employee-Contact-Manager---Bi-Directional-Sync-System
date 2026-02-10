-- Function to update Google Sheet when Supabase data changes
CREATE OR REPLACE FUNCTION update_google_sheet_on_change()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url text;
  service_key text;
  request_id bigint;
BEGIN
  -- Get environment variables (or use hardcoded values)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If not set, use defaults (replace with your values)
  IF supabase_url IS NULL THEN
    supabase_url := 'https://ictsqptlwftpcsapcnnh.supabase.co';
  END IF;
  
  IF service_key IS NULL THEN
    service_key := 'YOUR_SERVICE_ROLE_KEY';
  END IF;
  
  -- Call the Edge Function that will update Google Sheet
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/update-sheet-from-db',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'operation', TG_OP,
      'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
      'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
