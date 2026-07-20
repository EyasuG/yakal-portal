-- =====================================================================
--  Migration 022 — student self-assessment diagnostics
--
--  Lets a student take a diagnostic themselves. Their submission is tied to
--  their own record (student_id = app.my_student_id(), tutor_id null) and is
--  visible to them, their teaching staff (via 021's staff policies), and
--  their admissions counselor. Students can create and read their own; they
--  cannot edit/delete or see anyone else's (staff manage funnel state).
--
--  Depends on 021_diagnostics.sql (the diagnostics table + staff policies).
--  Additive: the 021 staff read/write policies are unchanged; RLS policies
--  are permissive (OR-ed), so these only widen access for students/counselors.
-- =====================================================================
set check_function_bodies = off;

-- A student reads their own self-assessments; their counselor reads them too.
drop policy if exists diagnostics_student_read on diagnostics;
create policy diagnostics_student_read on diagnostics for select
  using (
    student_id = app.my_student_id()
    or (student_id is not null and app.is_counselor_of(student_id))
  );

-- A student may create a diagnostic only for themselves, in their own org.
drop policy if exists diagnostics_student_insert on diagnostics;
create policy diagnostics_student_insert on diagnostics for insert
  with check ( student_id = app.my_student_id() and org_id = app.org() );
