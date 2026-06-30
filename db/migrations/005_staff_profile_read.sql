-- =====================================================================
--  Migration 005 — let admin-level staff & counselors resolve names
--
--  Program admins and counselors need to read profiles (to show names in
--  tutor/student/message lists). TUTORS are deliberately NOT included — they
--  stay masked, which keeps the anti-disintermediation guard intact.
-- =====================================================================
set check_function_bodies = off;

drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles for select using (
  id = app.uid()
  or app.is_any_admin()           -- super_admin + tutoring/admissions admins
  or app.role() = 'counselor'     -- admissions counselors (higher-trust staff)
);
