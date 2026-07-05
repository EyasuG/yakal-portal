-- =====================================================================
--  Migration 014 — schedule the daily deadline-reminders Edge Function
--
--  Runs every day at 13:00 UTC. The shared secret lives in Supabase Vault
--  (name 'reminder_secret'), set operationally — never in the repo. pg_cron
--  reads it and passes it to the function as x-reminder-secret.
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- (Re)schedule the daily job.
select cron.unschedule('deadline-reminders')
  where exists (select 1 from cron.job where jobname = 'deadline-reminders');

select cron.schedule(
  'deadline-reminders',
  '0 13 * * *',
  $$
    select net.http_post(
      url     := 'https://kgttkhbqeyvupikgozfu.functions.supabase.co/deadline-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-reminder-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
