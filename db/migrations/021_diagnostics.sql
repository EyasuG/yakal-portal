-- =====================================================================
--  Migration 021 — student diagnostics
--
--  One row per free diagnostic a tutor runs with a student (or walk-in
--  prospect at a launch event). Feeds the sales funnel and the future
--  Progress Intelligence baseline. Org-scoped and RLS-protected to match
--  the conventions established in 020_secure_rls.sql:
--    * every row carries org_id = app.org()
--    * teaching staff (tutor) and any admin may read/write within their org
--    * SECURITY DEFINER metrics fn is gated to admins
--
--  student_id is nullable: launch walk-ins are not yet students, so the
--  prospect_* columns capture enough lead detail to follow up before a
--  student/profile record exists.
--
--  Integration notes (vs. the vendored file):
--    * prospect_email uses plain text (no citext extension dependency).
--    * the metrics function lives in the `public` schema so PostgREST can
--      expose it to sb.rpc('diagnostic_metrics'); it still self-gates to admins.
-- =====================================================================
set check_function_bodies = off;

-- ---- helper: teaching staff = a tutor OR any admin, within the org ----
create or replace function app.is_teaching_staff() returns boolean
  language sql stable security definer set search_path = public, app as
$$ select coalesce(app.role() = 'tutor', false) or app.is_any_admin() $$;

-- ---- table ----
create table if not exists diagnostics (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id),
  created_at          timestamptz not null default now(),

  -- who ran it, and for whom (nullable for un-enrolled prospects)
  tutor_id            uuid references profiles(id),
  student_id          uuid references students(id),

  -- lightweight lead capture (launch walk-ins)
  prospect_student    text,
  prospect_parent     text,
  prospect_email      text,
  prospect_phone      text,
  grade_level         text,

  -- diagnostic result
  subject             text not null,
  entry_band          text,
  ceiling_band        text,
  overall_mastery     int check (overall_mastery between 0 and 100),
  band_scores         jsonb not null default '[]'::jsonb,
  skill_gaps          text[] not null default '{}',
  recommended_cadence text,
  recommended_tutor   text,
  admissions_bridge   boolean not null default false,
  recommended_tier    text check (recommended_tier in ('Essentials','Premier','Elite') or recommended_tier is null),

  -- funnel state (advanced by staff / the future Sales agent)
  status              text not null default 'new'
                      check (status in ('new','contacted','consult_booked','converted','archived')),
  notes               text
);

create index if not exists diagnostics_org_created_idx on diagnostics (org_id, created_at desc);
create index if not exists diagnostics_status_idx       on diagnostics (org_id, status);
create index if not exists diagnostics_student_idx       on diagnostics (student_id);

-- ---- RLS: teaching staff read/write within their org ----
alter table diagnostics enable row level security;

drop policy if exists diagnostics_staff_read on diagnostics;
create policy diagnostics_staff_read on diagnostics for select
  using ( org_id = app.org() and app.is_teaching_staff() );

drop policy if exists diagnostics_staff_write on diagnostics;
create policy diagnostics_staff_write on diagnostics for all
  using ( org_id = app.org() and app.is_teaching_staff() )
  with check ( org_id = app.org() and app.is_teaching_staff() );

grant select, insert, update, delete on diagnostics to authenticated;

-- ---- metrics for the admin overview (Level 2) ----
-- SECURITY DEFINER to aggregate across the org, gated to admins. In `public`
-- so PostgREST exposes it as sb.rpc('diagnostic_metrics').
create or replace function public.diagnostic_metrics() returns json
  language plpgsql stable security definer set search_path = public, app as
$$
declare o uuid := app.org();
begin
  if not app.is_any_admin() then
    raise exception 'not authorized';
  end if;
  return json_build_object(
    'total',           (select count(*) from diagnostics where org_id = o),
    'week',            (select count(*) from diagnostics where org_id = o and created_at >= now() - interval '7 days'),
    'leads_new',       (select count(*) from diagnostics where org_id = o and status = 'new'),
    'consults_booked', (select count(*) from diagnostics where org_id = o and status = 'consult_booked'),
    'converted',       (select count(*) from diagnostics where org_id = o and status = 'converted'),
    'admissions_leads',(select count(*) from diagnostics where org_id = o and admissions_bridge),
    'generated_at',    now()
  );
end;
$$;

grant execute on function public.diagnostic_metrics() to authenticated;
