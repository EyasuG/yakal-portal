-- =====================================================================
--  Migration 019 — recommendation-letter tracking (Google Drive links)
--
--  Recommenders (teachers, the school counselor) and the status of each
--  letter, plus a link to where the letter actually lives in Google Drive.
--  Same zero-storage model as essays: we hold the recommender + a Drive
--  link, never the letter file itself.
--
--  status reuses app.item_status:  todo = not requested · in_progress =
--  requested / pending · done = received / submitted.
--
--  Visibility mirrors the other application children:
--    read  — can_see_student OR the application's counselor.
--    write — the student, their counselor, an admissions admin, super admin.
-- =====================================================================
set check_function_bodies = off;

create table if not exists application_recommendations (
  id               uuid primary key default gen_random_uuid(),
  application_id   uuid not null references applications(id) on delete cascade,
  recommender_name text not null,
  recommender_role text,               -- "AP Bio teacher", "School counselor"…
  status           app.item_status not null default 'todo',
  doc_url          text,               -- Google Drive link to the letter
  due_date         date,
  created_at       timestamptz not null default now()
);
create index if not exists application_recommendations_app_idx on application_recommendations (application_id);

alter table application_recommendations enable row level security;

drop policy if exists app_recs_read on application_recommendations;
create policy app_recs_read on application_recommendations for select
  using ( exists (select 1 from applications a
     where a.id = application_id and (app.can_see_student(a.student_id) or a.counselor_id = app.uid())) );

drop policy if exists app_recs_write on application_recommendations;
create policy app_recs_write on application_recommendations for all
  using ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) )
  with check ( exists (select 1 from applications a where a.id = application_id and (
      app.is_super_admin() or app.is_program_admin('admissions')
      or a.counselor_id = app.uid() or app.my_student_id() = a.student_id)) );

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on application_recommendations to authenticated;
  end if;
end $$;
