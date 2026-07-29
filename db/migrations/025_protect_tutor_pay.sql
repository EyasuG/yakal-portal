-- =====================================================================
--  Migration 025 — stop exposing tutor pay to members
--
--  Finding (RLS audit): tutor_profiles.hourly_rate is "what Yakal pays the
--  tutor". The read policy was `using (org_id = app.org())`, so ANY logged-in
--  member (student, parent, counselor) could read every tutor's profile —
--  including hourly_rate — directly via the API. That leaks internal
--  compensation / margin.
--
--  Fix: restrict base-table reads to admins and the tutor themselves. The app
--  only reads tutor_profiles admin-side (listTutors) and tutor-self
--  (tutorHome), so nothing student/parent-facing breaks. The tutoring-admin
--  policy from 003 still grants program admins access.
--
--  If a student-facing "browse tutors" view is added later, expose only the
--  public columns (name, rating, accepting) through a dedicated view — never
--  hourly_rate.
-- =====================================================================
set check_function_bodies = off;

drop policy if exists tutor_profiles_read on tutor_profiles;
create policy tutor_profiles_read on tutor_profiles for select
  using ( app.is_admin() or profile_id = app.uid() );
