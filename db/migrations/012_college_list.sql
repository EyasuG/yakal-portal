-- =====================================================================
--  Migration 012 — College List / school-research tracker
--
--  Encodes the proven Yakal college tracker: each prospective school is
--  researched across the real-world dimensions and categorized Dream/Target/
--  Safety (reach/match/safety). Students build & fill their list; admissions
--  counselors and admins guide and edit it.
-- =====================================================================
set check_function_bodies = off;

-- Research fields on each school in the list.
alter table application_schools add column if not exists admissions_email text;
alter table application_schools add column if not exists deadline_type    text;   -- 'ED' | 'EA' | 'RD' | 'Rolling'
alter table application_schools add column if not exists supplement_essays integer;
alter table application_schools add column if not exists class_ratio      text;   -- avg class size / student-teacher ratio
alter table application_schools add column if not exists major_offered    text;   -- is your major offered? programs to apply to
alter table application_schools add column if not exists program_rank     text;   -- ranking notes
alter table application_schools add column if not exists tours            text;   -- tours / virtual-tour link
alter table application_schools add column if not exists sticker_price    integer;-- tuition & fees (USD/yr)
alter table application_schools add column if not exists financial_aid    text;   -- % on aid / merit-aid notes
alter table application_schools add column if not exists eval_sites       text;   -- Niche / College Navigator / Princeton Review links
alter table application_schools add column if not exists avg_gpa_sat      text;   -- avg GPA / SAT of admitted students
alter table application_schools add column if not exists notes            text;

-- Let a student create their OWN application (their admissions profile), so a
-- college list can attach to it; staff can create for their students.
drop policy if exists applications_create on applications;
create policy applications_create on applications for insert with check (
  app.my_student_id() = student_id
  or app.is_super_admin()
  or app.is_program_admin('admissions')
  or counselor_id = app.uid()
);

-- Who may add/edit/remove schools in a list: the student, their counselor,
-- admissions admins, super admin. (Parents keep read-only via app_schools_read.)
drop policy if exists app_schools_write on application_schools;
create policy app_schools_write on application_schools for all
  using ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) )
  with check ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) );
