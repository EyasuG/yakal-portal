-- =====================================================================
--  Migration 023 — consolidate the admin tier into a single Admin role
--
--  The program-scoped admin roles (tutoring_admin, admissions_admin) are
--  retired in favour of one Admin (role 'admin') that manages everything.
--  RLS already treats 'admin' as full access (app.is_admin / is_super_admin),
--  so reassigning these accounts simply widens them to the full console —
--  no policy changes needed. The enum values are LEFT in place (Postgres
--  can't easily drop enum values) but are no longer assigned by the app.
--
--  Delivery roles (tutor, counselor, parent, student) are unchanged — their
--  scoped access is a security feature, not consolidated away.
--
--  Idempotent: re-running is a no-op once no such rows remain.
-- =====================================================================
update profiles
   set role = 'admin'
 where role in ('tutoring_admin', 'admissions_admin');
