-- =====================================================================
--  Migration 007 — session booking by tutors and counselors
--
--  sessions.tutor_id references tutor_profiles, which counselors don't have.
--  Add a generic staff_id (the session leader: tutor OR counselor) and allow
--  the right people to create sessions in the right program:
--    * tutor      -> tutoring session for an assigned student
--    * counselor  -> admissions session for a counseled student
--    * program admin / super -> within their program
-- =====================================================================
set check_function_bodies = off;

alter table sessions add column if not exists staff_id uuid references profiles(id);
alter table sessions alter column tutor_id drop not null;
update sessions set staff_id = tutor_id where staff_id is null;
create index if not exists idx_sessions_staff on sessions (staff_id, scheduled_start desc);

-- Who may create a session.
drop policy if exists sessions_book on sessions;
create policy sessions_book on sessions for insert with check (
  staff_id = app.uid()
  and (
    (program = 'tutoring'   and (app.is_program_admin('tutoring')   or app.is_tutor_of(student_id)))
    or (program = 'admissions' and (app.is_program_admin('admissions') or app.is_counselor_of(student_id)))
  )
);

-- The session leader can read & update their own sessions (counselors aren't
-- covered by the existing tutor_id-based policies).
drop policy if exists sessions_staff_read on sessions;
create policy sessions_staff_read on sessions for select using ( staff_id = app.uid() );
drop policy if exists sessions_staff_update on sessions;
create policy sessions_staff_update on sessions for update using ( staff_id = app.uid() );
