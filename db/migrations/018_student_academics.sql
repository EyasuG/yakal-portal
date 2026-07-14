-- =====================================================================
--  Migration 018 — student academics: transcript + test scores + Drive
--
--  A 1:1 academic profile per student holding the numbers colleges compare
--  against (GPA / SAT / ACT / AP…) plus links to the actual documents. We
--  keep documents in the family's Google Drive (a shared folder + a direct
--  transcript link) rather than storing sensitive PDFs ourselves — the app
--  just holds the links and the structured scores.
--
--  Visibility mirrors the rest of the admissions data:
--    * read  — anyone who can_see_student (the student, their parents,
--              counselor, admissions admins, super admin).
--    * write — the student themselves, their admissions counselor, an
--              admissions program admin, or super admin. Parents stay
--              read-only (they can view, not edit).
-- =====================================================================
set check_function_bodies = off;

create table if not exists student_academics (
  student_id       uuid primary key references students(id) on delete cascade,
  gpa_unweighted   text,
  gpa_weighted     text,
  class_rank       text,
  sat_total        integer,
  sat_ebrw         integer,
  sat_math         integer,
  act_composite    integer,
  test_notes       text,          -- AP / IB / TOEFL / SAT Subject, free-form
  transcript_url   text,          -- Google Drive link to the transcript
  drive_folder_url text,          -- the student's shared Drive folder
  updated_at       timestamptz not null default now()
);

alter table student_academics enable row level security;

drop policy if exists student_academics_read on student_academics;
create policy student_academics_read on student_academics for select
  using ( app.can_see_student(student_id) );

drop policy if exists student_academics_write on student_academics;
create policy student_academics_write on student_academics for all
  using (
    app.my_student_id() = student_id
    or app.is_super_admin()
    or app.is_program_admin('admissions')
    or app.is_counselor_of(student_id)
  )
  with check (
    app.my_student_id() = student_id
    or app.is_super_admin()
    or app.is_program_admin('admissions')
    or app.is_counselor_of(student_id)
  );

drop trigger if exists t_student_academics_touch on student_academics;
create trigger t_student_academics_touch before update on student_academics
  for each row execute function app.touch_updated_at();

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on student_academics to authenticated;
  end if;
end $$;
