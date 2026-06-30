-- =====================================================================
--  Migration 003 — two-program model (Tutoring + Admissions) + scoped roles
--
--  Adds Programs as a first-class concept and layers program-scoped access
--  on top of the existing RLS WITHOUT changing what student/parent/tutor
--  already see. Strategy:
--    * super_admin / legacy admin  -> see everything (existing policies).
--    * tutoring_admin              -> tutoring data + enrolled students.
--    * admissions_admin            -> admissions data + enrolled students.
--    * counselor                   -> their counseled students (like a tutor
--                                     for the admissions side).
--  New permissive policies are OR-combined with the existing ones, so this
--  migration is additive and safe to run against the live database.
-- =====================================================================
set check_function_bodies = off;

-- ---------- Program enum ----------
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='program' and n.nspname='app') then
    create type app.program as enum ('tutoring','admissions');
  end if;
end $$;

-- ---------- Enrollment: a student can be in tutoring AND/OR admissions ----------
create table if not exists enrollments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  student_id  uuid not null references students(id),
  program     app.program not null,
  status      app.member_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (student_id, program)
);
create index if not exists idx_enrollments_student on enrollments(student_id);
create index if not exists idx_enrollments_program on enrollments(org_id, program);

-- ---------- Which program(s) a staff member / admin works in ----------
create table if not exists staff_programs (
  profile_id  uuid not null references profiles(id),
  program     app.program not null,
  primary key (profile_id, program)
);

-- ---------- Tag a session with its program (tutoring vs admissions) ----------
alter table sessions add column if not exists program app.program not null default 'tutoring';

-- =====================================================================
--  Helper functions
-- =====================================================================

-- 'admin' (legacy) and super_admin both mean full access.
create or replace function app.is_super_admin() returns boolean
  language sql stable security definer set search_path = public, app as
$$ select coalesce(app.role() in ('super_admin','admin'), false) $$;

-- Any admin-level role (full or program-scoped).
create or replace function app.is_any_admin() returns boolean
  language sql stable security definer set search_path = public, app as
$$ select coalesce(app.role() in ('super_admin','admin','tutoring_admin','admissions_admin'), false) $$;

-- Does the caller administer a given program?
create or replace function app.is_program_admin(p app.program) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select app.is_super_admin()
        or (app.role() = 'tutoring_admin'   and p = 'tutoring')
        or (app.role() = 'admissions_admin' and p = 'admissions') $$;

-- Counselor assigned to a student's application.
create or replace function app.is_counselor_of(p_student uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from applications a
     where a.student_id = p_student and a.counselor_id = app.uid()
   ) $$;

-- Keep is_admin() meaning "full access" so all existing policies still grant
-- super_admin/legacy-admin everything.
create or replace function app.is_admin() returns boolean
  language sql stable security definer set search_path = public, app as
$$ select app.is_super_admin() $$;

-- Widen "who may see this student" to include counselors and the program
-- admins of a program the student is enrolled in.
create or replace function app.can_see_student(p_student uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select app.is_super_admin()
        or app.is_parent_of(p_student)
        or app.is_tutor_of(p_student)
        or app.is_counselor_of(p_student)
        or app.my_student_id() = p_student
        or exists (
             select 1 from enrollments e
             where e.student_id = p_student and app.is_program_admin(e.program)
           ) $$;

-- =====================================================================
--  Program-scoped RLS (additive; OR-combined with existing policies)
-- =====================================================================

-- Students enrolled in a program the admin manages.
drop policy if exists students_program_admin on students;
create policy students_program_admin on students for select
  using ( exists (select 1 from enrollments e
                  where e.student_id = students.id and app.is_program_admin(e.program)) );

-- Admissions admin: full visibility into the admissions module.
drop policy if exists applications_admissions_admin on applications;
create policy applications_admissions_admin on applications for all
  using ( app.is_program_admin('admissions') ) with check ( app.is_program_admin('admissions') );
drop policy if exists app_schools_admissions_admin on application_schools;
create policy app_schools_admissions_admin on application_schools for select
  using ( app.is_program_admin('admissions') );
drop policy if exists app_essays_admissions_admin on application_essays;
create policy app_essays_admissions_admin on application_essays for select
  using ( app.is_program_admin('admissions') );
drop policy if exists app_tasks_admissions_admin on application_tasks;
create policy app_tasks_admissions_admin on application_tasks for select
  using ( app.is_program_admin('admissions') );

-- Tutoring admin: full visibility into the tutoring module.
drop policy if exists assignments_tutoring_admin on tutoring_assignments;
create policy assignments_tutoring_admin on tutoring_assignments for all
  using ( app.is_program_admin('tutoring') ) with check ( app.is_program_admin('tutoring') );
drop policy if exists tutor_profiles_tutoring_admin on tutor_profiles;
create policy tutor_profiles_tutoring_admin on tutor_profiles for all
  using ( app.is_program_admin('tutoring') ) with check ( app.is_program_admin('tutoring') );
drop policy if exists payouts_tutoring_admin on payouts;
create policy payouts_tutoring_admin on payouts for select
  using ( app.is_program_admin('tutoring') );

-- Program admins see sessions in their program.
drop policy if exists sessions_program_admin on sessions;
create policy sessions_program_admin on sessions for select
  using ( app.is_program_admin(program) );

-- ---------- enrollments / staff_programs RLS ----------
alter table enrollments    enable row level security;
alter table staff_programs enable row level security;

drop policy if exists enrollments_read on enrollments;
create policy enrollments_read on enrollments for select
  using ( app.is_any_admin() or app.can_see_student(student_id) );
drop policy if exists enrollments_write on enrollments;
create policy enrollments_write on enrollments for all
  using ( app.is_super_admin() or app.is_program_admin(program) )
  with check ( app.is_super_admin() or app.is_program_admin(program) );

drop policy if exists staff_programs_read on staff_programs;
create policy staff_programs_read on staff_programs for select
  using ( profile_id = app.uid() or app.is_any_admin() );
drop policy if exists staff_programs_write on staff_programs;
create policy staff_programs_write on staff_programs for all
  using ( app.is_super_admin() ) with check ( app.is_super_admin() );

-- =====================================================================
--  Grants for the new tables (RLS still does the filtering)
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on enrollments, staff_programs to authenticated;
  end if;
end $$;
