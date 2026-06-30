-- =====================================================================
--  Migration 004 — tighten program separation on shared students
--
--  When a student is enrolled in BOTH programs, the legacy read policies
--  (which keyed off the broad app.can_see_student) leaked admissions data to
--  tutoring admins and vice-versa. Re-scope the program-specific reads so:
--    * applications + their children  -> admissions side + the family only
--    * tutoring_assignments           -> tutoring side + the family only
--  Family = the student and their parents. Assigned tutor / counselor keep
--  their direct access. Super admin sees everything.
-- =====================================================================
set check_function_bodies = off;

-- ---- applications: admissions-scoped ----
drop policy if exists applications_read on applications;
create policy applications_read on applications for select using (
  app.is_super_admin()
  or app.is_program_admin('admissions')
  or counselor_id = app.uid()
  or app.is_parent_of(student_id)
  or app.my_student_id() = student_id
);

-- helper-free audience check reused by the three child tables
drop policy if exists app_schools_read on application_schools;
create policy app_schools_read on application_schools for select using (
  exists (select 1 from applications a where a.id = application_id and (
    app.is_super_admin() or app.is_program_admin('admissions') or a.counselor_id = app.uid()
    or app.is_parent_of(a.student_id) or app.my_student_id() = a.student_id)) );

drop policy if exists app_essays_read on application_essays;
create policy app_essays_read on application_essays for select using (
  exists (select 1 from applications a where a.id = application_id and (
    app.is_super_admin() or app.is_program_admin('admissions') or a.counselor_id = app.uid()
    or app.is_parent_of(a.student_id) or app.my_student_id() = a.student_id)) );

drop policy if exists app_tasks_read on application_tasks;
create policy app_tasks_read on application_tasks for select using (
  exists (select 1 from applications a where a.id = application_id and (
    app.is_super_admin() or app.is_program_admin('admissions') or a.counselor_id = app.uid()
    or app.is_parent_of(a.student_id) or app.my_student_id() = a.student_id)) );

-- ---- tutoring_assignments: tutoring-scoped ----
drop policy if exists assignments_read on tutoring_assignments;
create policy assignments_read on tutoring_assignments for select using (
  app.is_super_admin()
  or app.is_program_admin('tutoring')
  or tutor_id = app.uid()
  or app.is_parent_of(student_id)
  or app.my_student_id() = student_id
);
