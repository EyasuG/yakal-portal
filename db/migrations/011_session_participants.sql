-- =====================================================================
--  Migration 011 — multi-student sessions (group classes, camps, bootcamps)
--
--  A session can now hold a roster of students via session_participants.
--  sessions.student_id stays as the "representative" (first) student so all
--  the existing single-student queries keep working; the full roster lives in
--  session_participants. One session = one shared Zoom room for the cohort.
--
--  RLS uses SECURITY DEFINER helpers so the sessions <-> participants policies
--  never recurse into each other.
-- =====================================================================
set check_function_bodies = off;

create table if not exists session_participants (
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references students(id),
  created_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index if not exists idx_session_participants_student on session_participants (student_id);

-- Backfill: every existing session's student becomes a participant.
insert into session_participants (session_id, student_id)
select id, student_id from sessions where student_id is not null
on conflict do nothing;

-- ---- SECURITY DEFINER helpers (bypass RLS to avoid policy recursion) ----
create or replace function app.can_see_session(p_session uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from session_participants sp
     where sp.session_id = p_session and app.can_see_student(sp.student_id)
   ) $$;

create or replace function app.can_manage_session(p_session uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from sessions s
     where s.id = p_session and (
       app.is_super_admin()
       or s.staff_id = app.uid()
       or (s.program = 'tutoring'   and app.is_program_admin('tutoring'))
       or (s.program = 'admissions' and app.is_program_admin('admissions'))
     )
   ) $$;

-- ---- RLS ----
alter table session_participants enable row level security;

drop policy if exists sp_read on session_participants;
create policy sp_read on session_participants for select using (
  app.is_super_admin() or app.can_see_student(student_id) or app.can_manage_session(session_id)
);
drop policy if exists sp_write on session_participants;
create policy sp_write on session_participants for all
  using ( app.can_manage_session(session_id) )
  with check ( app.can_manage_session(session_id) );

-- A student/family sees any session they're a roster member of (covers group
-- sessions where they are not the representative student_id).
drop policy if exists sessions_participant_read on sessions;
create policy sessions_participant_read on sessions for select using ( app.can_see_session(id) );

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on session_participants to authenticated;
  end if;
end $$;
