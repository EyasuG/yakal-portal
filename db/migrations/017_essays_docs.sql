-- =====================================================================
--  Migration 017 — essays: attach to a school + a live document link
--
--  Turns the flat essay list into something students actually work in:
--    * school_id  — attach a supplemental essay to a specific school on the
--                   college list (NULL = a core / Common-App personal essay).
--    * doc_url    — a link to where the essay actually lives (Google Doc,
--                   Word Online, etc.) so students edit there and staff can
--                   open it to review. We never store essay text ourselves.
--    * prompt     — the essay prompt / question, for context at a glance.
--
--  RLS is unchanged: application_essays already carries app_essays_read
--  (migration schema) and app_essays_write (migration 013), both scoped
--  through the parent application. Adding columns needs no new policy.
-- =====================================================================
set check_function_bodies = off;

alter table application_essays add column if not exists school_id uuid references application_schools(id) on delete set null;
alter table application_essays add column if not exists doc_url   text;
alter table application_essays add column if not exists prompt    text;

create index if not exists application_essays_school_id_idx on application_essays (school_id);
