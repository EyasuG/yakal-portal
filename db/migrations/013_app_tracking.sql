-- =====================================================================
--  Migration 013 — per-school application tracking + essay/task write RLS
--
--  Modeled on best-in-class counseling platforms (Scoir/Naviance-style):
--  each school in the list carries a requirements checklist (application,
--  essays, recommendations, transcript, scores, FAFSA/CSS) and a decision.
--
--  SECURITY FIX: application_essays / application_tasks previously had only
--  SELECT policies — no one could write them (the app's toggle was a silent
--  no-op). Add least-privilege write policies: the student who owns the
--  application, their counselor, admissions admins, and super admin.
-- =====================================================================
set check_function_bodies = off;

-- Per-school tracking: requirements checklist + admissions decision.
alter table application_schools add column if not exists requirements jsonb not null default '{}';
alter table application_schools add column if not exists decision text;  -- accepted | denied | waitlisted | enrolled

-- ---- essays: write access ----
drop policy if exists app_essays_write on application_essays;
create policy app_essays_write on application_essays for all
  using ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) )
  with check ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) );

-- ---- tasks: write access ----
drop policy if exists app_tasks_write on application_tasks;
create policy app_tasks_write on application_tasks for all
  using ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) )
  with check ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) );
