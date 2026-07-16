-- =====================================================================
--  Migration 020 — SECURITY FIX: enable RLS on the 8 remaining public tables
--
--  These tables were created in the base schema WITHOUT row-level security.
--  Because PostgREST exposes the public schema and the `authenticated` role
--  holds table grants, ANY logged-in user could read — and write/delete —
--  every row in them (verified: a student could UPDATE app_settings, which
--  would let them disable org-wide message redaction, and tamper with
--  invoice_items / subjects). This closes that hole with least-privilege
--  policies. After applying, Supabase's "RLS Disabled in Public" advisories
--  clear and all 38 public tables are RLS-protected.
--
--  Note: SECURITY DEFINER paths are unaffected — the scan_message() trigger
--  reads app_settings with definer rights, and the service_role (edge
--  functions / cron) bypasses RLS entirely.
-- =====================================================================
set check_function_bodies = off;

-- ---- subjects: reference catalog, embedded as subjects(name); org-scoped read, admin write ----
alter table subjects enable row level security;
drop policy if exists subjects_read on subjects;
create policy subjects_read on subjects for select using ( org_id = app.org() );
drop policy if exists subjects_admin_write on subjects;
create policy subjects_admin_write on subjects for all
  using ( app.is_any_admin() ) with check ( app.is_any_admin() );

-- ---- service_packages: pricing; org-scoped read, admin write ----
alter table service_packages enable row level security;
drop policy if exists service_packages_read on service_packages;
create policy service_packages_read on service_packages for select using ( org_id = app.org() );
drop policy if exists service_packages_admin_write on service_packages;
create policy service_packages_admin_write on service_packages for all
  using ( app.is_any_admin() ) with check ( app.is_any_admin() );

-- ---- tutor_subjects: tutor<->subject mapping; any authenticated read, owner/admin write ----
alter table tutor_subjects enable row level security;
drop policy if exists tutor_subjects_read on tutor_subjects;
create policy tutor_subjects_read on tutor_subjects for select using ( app.uid() is not null );
drop policy if exists tutor_subjects_write on tutor_subjects;
create policy tutor_subjects_write on tutor_subjects for all
  using ( tutor_id = app.uid() or app.is_any_admin() )
  with check ( tutor_id = app.uid() or app.is_any_admin() );

-- ---- app_settings: org config (incl. the redaction flag) — admins only ----
alter table app_settings enable row level security;
drop policy if exists app_settings_admin on app_settings;
create policy app_settings_admin on app_settings for all
  using ( app.is_any_admin() ) with check ( app.is_any_admin() );

-- ---- feature_flags: ship-dark config — admins only ----
alter table feature_flags enable row level security;
drop policy if exists feature_flags_admin on feature_flags;
create policy feature_flags_admin on feature_flags for all
  using ( app.is_any_admin() ) with check ( app.is_any_admin() );

-- ---- attachments: polymorphic file refs — uploader or admin ----
alter table attachments enable row level security;
drop policy if exists attachments_owner on attachments;
create policy attachments_owner on attachments for all
  using ( uploaded_by = app.uid() or app.is_any_admin() )
  with check ( uploaded_by = app.uid() or app.is_any_admin() );

-- ---- invoice_items: visibility mirrors the parent invoice; admin write ----
alter table invoice_items enable row level security;
drop policy if exists invoice_items_read on invoice_items;
create policy invoice_items_read on invoice_items for select using (
  exists (select 1 from invoices i where i.id = invoice_id
          and (i.parent_id = app.uid() or app.is_admin())) );
drop policy if exists invoice_items_admin_write on invoice_items;
create policy invoice_items_admin_write on invoice_items for all
  using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- payout_items: visibility mirrors the parent payout; admin write ----
alter table payout_items enable row level security;
drop policy if exists payout_items_read on payout_items;
create policy payout_items_read on payout_items for select using (
  exists (select 1 from payouts p where p.id = payout_id
          and (p.tutor_id = app.uid() or app.is_admin() or app.is_program_admin('tutoring'))) );
drop policy if exists payout_items_admin_write on payout_items;
create policy payout_items_admin_write on payout_items for all
  using ( app.is_admin() ) with check ( app.is_admin() );
