-- 028_google_credentials.sql
-- Storage for per-user Google OAuth refresh tokens, used by the google-classroom
-- edge function to fetch real Google Classroom coursework.
--
-- Security: the refresh token is a bearer secret. The client must NEVER read it,
-- so this table has RLS enabled with NO policies for the `authenticated` role and
-- all grants revoked — only the edge function's service-role key can touch it.
-- The frontend learns connection status and coursework only through the edge
-- function (which checks app.can_see_student server-side), never by reading here.

create table if not exists google_credentials (
  profile_id    uuid primary key references profiles(id) on delete cascade,
  refresh_token text not null,
  scope         text,
  google_email  text,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table google_credentials enable row level security;

-- Defensively remove any inherited grants; service_role bypasses RLS and is the
-- only principal that should read/write refresh tokens.
revoke all on google_credentials from anon, authenticated;

-- No policies are created for anon/authenticated on purpose: with RLS enabled and
-- no permissive policy, all direct API access is denied. The edge function uses
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

drop trigger if exists t_google_credentials_touch on google_credentials;
create trigger t_google_credentials_touch before update on google_credentials
  for each row execute function app.touch_updated_at();
