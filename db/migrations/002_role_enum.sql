-- =====================================================================
--  Migration 002 — role hierarchy (enum values only)
--
--  Postgres requires new enum values to be committed before they can be
--  used, so they live in their own migration, applied BEFORE 003. Existing
--  roles (admin/tutor/parent/student) are kept for backward compatibility:
--  'admin' continues to mean full access (treated as super_admin).
-- =====================================================================
alter type app.user_role add value if not exists 'super_admin';
alter type app.user_role add value if not exists 'tutoring_admin';
alter type app.user_role add value if not exists 'admissions_admin';
alter type app.user_role add value if not exists 'counselor';
