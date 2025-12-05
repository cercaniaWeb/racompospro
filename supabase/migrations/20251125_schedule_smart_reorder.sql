-- Automated Daily Smart Reorder Analysis
-- This configures a scheduled job to run daily at 2 AM

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily analysis job
SELECT cron.schedule(
    'daily-smart-reorder-analysis',  -- Job name
    '0 2 * * *',                      -- Schedule: Daily at 2:00 AM
    $$
    -- Call the Edge Function via HTTP
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/smart-reorder-analyzer',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- View scheduled jobs to confirm
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname = 'daily-smart-reorder-analysis';

-- To unschedule (if needed):
-- SELECT cron.unschedule('daily-smart-reorder-analysis');

-- To manually trigger the analysis:
-- SELECT net.http_post(
--     url := 'https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/smart-reorder-analyzer',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
--     body := '{}'::jsonb
-- );
