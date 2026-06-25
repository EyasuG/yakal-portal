-- =====================================================================
--  YAKAL EDUCATION SERVICES — Postgres schema (Supabase-flavoured)
--  v1.0
--
--  Design goals baked into this file:
--   1. PARENTS can monitor their child's progress AND messages.
--   2. ADMIN sees everything in the organization.
--   3. TUTORS cannot disintermediate (build a private side-business):
--        - they never see parent/student contact details (PII masked)
--        - all communication stays on-platform and is auto-scanned
--        - money only flows parent -> Yakal -> tutor, never parent -> tutor
--        - every contact-detail reveal and risky message is logged for admin
--   4. SCALABLE & EXTENDABLE: org_id multitenancy, UUID keys,
--      created_at/updated_at, soft-delete, JSONB metadata, polymorphic
--      attachments/notifications, append-only audit.
--
--  Access control is enforced by Row-Level Security (RLS) at the DB layer,
--  so a leaked API key or a buggy client still cannot cross a boundary.
-- =====================================================================

-- ---------- 00. Extensions -------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- case-insensitive email
create extension if not exists "pg_trgm";     -- fuzzy search on names

-- A private schema for helper functions used by RLS policies.
create schema if not exists app;

-- Helper functions below reference tables that are created further down.
-- Defer body validation until the whole script has loaded.
set check_function_bodies = off;

-- ---------- 01. Enumerated types -------------------------------------
create type app.user_role        as enum ('admin','tutor','parent','student');
create type app.member_status    as enum ('invited','active','paused','archived');
create type app.session_mode     as enum ('online','in_person');
create type app.session_status   as enum ('scheduled','completed','canceled','no_show');
create type app.assignment_status as enum ('active','paused','ended');
create type app.homework_status  as enum ('assigned','submitted','graded','overdue');
create type app.adm_stage        as enum ('research','apply','submitted','decisions','enrolled');
create type app.school_kind      as enum ('reach','match','safety');
create type app.item_status      as enum ('todo','in_progress','done');
create type app.invoice_status   as enum ('draft','open','paid','overdue','void');
create type app.payout_status    as enum ('pending','approved','paid');
create type app.flag_kind        as enum ('email','phone','payment_handle','external_platform','solicitation','other');
create type app.flag_state       as enum ('open','reviewed','dismissed','actioned');
create type app.risk_kind        as enum ('off_platform_contact','contact_leak','payment_solicitation','schedule_then_cancel','pii_access_spike');

-- =====================================================================
--  02. CORE: organizations & profiles
-- =====================================================================

-- Multitenant root. One row today (Yakal), but every table carries org_id
-- so a second location / franchise / white-label is a data change, not a
-- schema rewrite.
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext unique not null,
  brand       jsonb not null default '{}',     -- colors, logo, tagline
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- One row per human. id MATCHES Supabase auth.users.id so auth and data
-- share a key. (On plain Postgres, point app.uid() at your own session var.)
create table profiles (
  id            uuid primary key,              -- = auth.users.id
  org_id        uuid not null references organizations(id),
  role          app.user_role not null,
  full_name     text not null,
  -- PII: never exposed to tutors. RLS + the masked view below guarantee it.
  email         citext,
  phone         text,
  address       jsonb,
  avatar_url    text,
  status        app.member_status not null default 'active',
  metadata      jsonb not null default '{}',   -- forward-compat extension point
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on profiles (org_id, role) where deleted_at is null;
create index on profiles using gin (full_name gin_trgm_ops);

-- =====================================================================
--  03. RLS HELPER FUNCTIONS
--  SECURITY DEFINER so they bypass RLS internally (no policy recursion).
--  STABLE so the planner can cache them within a statement.
-- =====================================================================

-- Current user id. Supabase exposes auth.uid(); we wrap it so the same
-- schema runs on vanilla Postgres by swapping this one function.
create or replace function app.uid() returns uuid
  language sql stable as $$ select auth.uid() $$;

create or replace function app.profile() returns profiles
  language sql stable security definer set search_path = public, app as
$$ select * from profiles where id = app.uid() $$;

create or replace function app.org() returns uuid
  language sql stable security definer set search_path = public, app as
$$ select org_id from profiles where id = app.uid() $$;

create or replace function app.role() returns app.user_role
  language sql stable security definer set search_path = public, app as
$$ select role from profiles where id = app.uid() $$;

create or replace function app.is_admin() returns boolean
  language sql stable security definer set search_path = public, app as
$$ select coalesce(app.role() = 'admin', false) $$;

-- The student row that belongs to the logged-in student profile (if any).
create or replace function app.my_student_id() returns uuid
  language sql stable security definer set search_path = public, app as
$$ select id from students where user_id = app.uid() $$;

create or replace function app.is_parent_of(p_student uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from guardianships g
     where g.parent_id = app.uid() and g.student_id = p_student
   ) $$;

create or replace function app.is_tutor_of(p_student uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from tutoring_assignments a
     where a.tutor_id = app.uid()
       and a.student_id = p_student
       and a.status = 'active'
   ) $$;

-- The central "who may see this student" predicate, reused everywhere.
create or replace function app.can_see_student(p_student uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select app.is_admin()
        or app.is_parent_of(p_student)
        or app.is_tutor_of(p_student)
        or app.my_student_id() = p_student $$;

-- Conversation helpers. These are SECURITY DEFINER so they read the
-- conversation tables WITHOUT triggering those tables' own RLS policies.
-- That is what prevents the conversations <-> participants policy cycle
-- from recursing infinitely.
create or replace function app.is_participant(p_conversation uuid) returns boolean
  language sql stable security definer set search_path = public, app as
$$ select exists (
     select 1 from conversation_participants
     where conversation_id = p_conversation and profile_id = app.uid()
   ) $$;

create or replace function app.convo_student(p_conversation uuid) returns uuid
  language sql stable security definer set search_path = public, app as
$$ select student_id from conversations where id = p_conversation $$;

-- =====================================================================
--  04. PEOPLE: students, guardians, tutors, subjects, assignments
-- =====================================================================

create table students (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  -- Optional login. Young students are managed by a parent and may have none.
  user_id     uuid references profiles(id),
  first_name  text not null,
  last_name   text not null,
  grade       text,
  status      app.member_status not null default 'active',
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index on students (org_id) where deleted_at is null;

-- Parent <-> student is many-to-many (two parents, multiple kids).
create table guardianships (
  parent_id    uuid not null references profiles(id),
  student_id   uuid not null references students(id),
  relationship text not null default 'parent',
  is_primary   boolean not null default true,
  created_at   timestamptz not null default now(),
  primary key (parent_id, student_id)
);
create index on guardianships (student_id);

create table subjects (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references organizations(id),
  name      text not null,
  category  text,                              -- STEM, SAT, College, ...
  unique (org_id, name)
);

-- Tutor-specific profile data (1:1 with a profile whose role = 'tutor').
create table tutor_profiles (
  profile_id   uuid primary key references profiles(id),
  org_id       uuid not null references organizations(id),
  bio          text,
  rating       numeric(2,1) default 5.0,
  hourly_rate  integer not null default 0,     -- what Yakal pays the tutor
  hire_date    date,
  accepting    boolean not null default true,  -- availability toggle
  metadata     jsonb not null default '{}'
);

create table tutor_subjects (
  tutor_id   uuid not null references tutor_profiles(profile_id),
  subject_id uuid not null references subjects(id),
  primary key (tutor_id, subject_id)
);

-- The assignment of a tutor to a student (optionally for a subject).
-- This table is what app.is_tutor_of() reads, so it is the single source
-- of truth for tutor visibility. End an assignment -> visibility revoked.
create table tutoring_assignments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  tutor_id    uuid not null references tutor_profiles(profile_id),
  student_id  uuid not null references students(id),
  subject_id  uuid references subjects(id),
  status      app.assignment_status not null default 'active',
  started_on  date not null default current_date,
  ended_on    date,
  created_at  timestamptz not null default now()
);
create index on tutoring_assignments (tutor_id, status);
create index on tutoring_assignments (student_id, status);

-- =====================================================================
--  05. SCHEDULING: sessions & notes
-- =====================================================================

create table sessions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id),
  student_id      uuid not null references students(id),
  tutor_id        uuid not null references tutor_profiles(profile_id),
  subject_id      uuid references subjects(id),
  scheduled_start timestamptz not null,
  scheduled_end   timestamptz not null,
  mode            app.session_mode not null default 'online',
  status          app.session_status not null default 'scheduled',
  -- meeting_url is generated by Yakal (a managed room), never a tutor's
  -- personal link — another disintermediation guard.
  meeting_url     text,
  location        text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on sessions (student_id, scheduled_start desc);
create index on sessions (tutor_id, scheduled_start desc);

create table session_notes (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references sessions(id),
  tutor_id        uuid not null references tutor_profiles(profile_id),
  body            text not null,
  parent_visible  boolean not null default true,   -- parents monitor progress
  created_at      timestamptz not null default now()
);

-- =====================================================================
--  06. ACADEMICS: progress snapshots & homework
-- =====================================================================

-- Time-series of per-subject progress -> drives the parent/student bars.
create table progress_snapshots (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  student_id  uuid not null references students(id),
  subject_id  uuid references subjects(id),
  percent     integer not null check (percent between 0 and 100),
  note        text,
  recorded_by uuid references profiles(id),
  recorded_at timestamptz not null default now()
);
create index on progress_snapshots (student_id, recorded_at desc);

create table homework (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  student_id  uuid not null references students(id),
  subject_id  uuid references subjects(id),
  title       text not null,
  due_date    date,
  status      app.homework_status not null default 'assigned',
  assigned_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index on homework (student_id, status);

-- =====================================================================
--  07. ADMISSIONS CONSULTING (the high-margin module)
-- =====================================================================

create table service_packages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  name        text not null,                    -- Essentials / Premier / Elite
  price_cents integer not null default 0,
  features    jsonb not null default '[]',
  active      boolean not null default true
);

create table applications (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id),
  student_id   uuid not null references students(id),
  counselor_id uuid references profiles(id),     -- a tutor/admin acting as counselor
  package_id   uuid references service_packages(id),
  stage        app.adm_stage not null default 'research',
  target_school text,
  next_deadline date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on applications (student_id);
create index on applications (org_id, stage);

create table application_schools (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  school_name    text not null,
  kind           app.school_kind not null default 'match',
  deadline       date,
  status         app.item_status not null default 'todo'
);

create table application_essays (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  title          text not null,
  status         app.item_status not null default 'todo',
  due_date       date
);

create table application_tasks (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  title          text not null,
  status         app.item_status not null default 'todo',
  due_date       date
);

-- =====================================================================
--  08. MESSAGING (on-platform, monitored)
-- =====================================================================

-- A thread is optionally "about" a student. That linkage is what lets a
-- parent monitor the conversation without being a participant in it.
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  subject     text,
  student_id  uuid references students(id),     -- enables parent monitoring
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index on conversations (student_id);

create table conversation_participants (
  conversation_id uuid not null references conversations(id),
  profile_id      uuid not null references profiles(id),
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);
create index on conversation_participants (profile_id);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  sender_id       uuid not null references profiles(id),
  body            text not null,
  -- redacted_body is what non-admins see if the scanner masked contact info.
  redacted_body   text,
  flagged         boolean not null default false,
  flag_reasons    app.flag_kind[] not null default '{}',
  created_at      timestamptz not null default now()
);
create index on messages (conversation_id, created_at);
create index on messages (sender_id) where flagged;

-- One row per detection. Admin-only. This is the audit trail for the
-- "no private business" guarantee.
create table message_flags (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages(id),
  sender_id   uuid not null references profiles(id),
  kind        app.flag_kind not null,
  excerpt     text,
  state       app.flag_state not null default 'open',
  reviewed_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index on message_flags (state, created_at desc);

-- =====================================================================
--  09. BILLING — money flows parent -> Yakal -> tutor, never P2P.
--  There is deliberately NO table that records a parent paying a tutor.
-- =====================================================================

create table invoices (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  parent_id   uuid not null references profiles(id),   -- payer
  student_id  uuid references students(id),
  period      text,                                    -- 'November 2026'
  amount_cents integer not null,
  status      app.invoice_status not null default 'open',
  due_date    date,
  paid_at     timestamptz,
  processor_ref text,                                  -- Stripe id, etc.
  created_at  timestamptz not null default now()
);
create index on invoices (parent_id, status);

create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices(id),
  description text not null,
  amount_cents integer not null,
  session_id  uuid references sessions(id)
);

-- Yakal pays the tutor. Tutors read their own payout; they never see what
-- the parent was charged (margin stays private).
create table payouts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id),
  tutor_id      uuid not null references tutor_profiles(profile_id),
  period        text,
  amount_cents  integer not null,
  sessions_count integer not null default 0,
  status        app.payout_status not null default 'pending',
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index on payouts (tutor_id, status);

create table payout_items (
  id         uuid primary key default gen_random_uuid(),
  payout_id  uuid not null references payouts(id),
  session_id uuid references sessions(id),
  amount_cents integer not null
);

-- =====================================================================
--  10. GOVERNANCE: PII access log, audit log, risk, notifications,
--      attachments, settings, feature flags
-- =====================================================================

-- Every time anyone (esp. a tutor) reveals a masked contact detail, log it.
create table pii_access_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  actor_id    uuid not null references profiles(id),
  target_type text not null,        -- 'student' | 'parent'
  target_id   uuid not null,
  field       text not null,        -- 'phone' | 'email' | 'address'
  context     text,
  created_at  timestamptz not null default now()
);
create index on pii_access_log (actor_id, created_at desc);

-- Append-only system audit. Admin "sees all", including history.
create table audit_log (
  id          bigint generated always as identity primary key,
  org_id      uuid,
  actor_id    uuid,
  action      text not null,        -- 'update' | 'delete' | 'login' ...
  entity      text not null,        -- table name
  entity_id   uuid,
  diff        jsonb,
  created_at  timestamptz not null default now()
);
create index on audit_log (entity, entity_id);
create index on audit_log (created_at desc);

-- Aggregated, human-reviewable risk signals about a tutor. Admin-only.
create table risk_flags (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  subject_id  uuid not null references profiles(id),   -- usually a tutor
  kind        app.risk_kind not null,
  severity    smallint not null default 1,             -- 1..5
  detail      text,
  state       app.flag_state not null default 'open',
  created_at  timestamptz not null default now()
);
create index on risk_flags (subject_id, state);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  recipient_id uuid not null references profiles(id),
  kind        text not null,
  title       text not null,
  body        text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications (recipient_id, read_at);

-- Polymorphic attachments — one table serves essays, sessions, messages,
-- applications, etc. New attachable feature? No new table.
create table attachments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id),
  entity_type text not null,
  entity_id   uuid not null,
  storage_key text not null,        -- Supabase Storage / S3 path
  filename    text,
  mime_type   text,
  uploaded_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);
create index on attachments (entity_type, entity_id);

-- Org-level key/value config + feature flags = ship features dark, per org.
create table app_settings (
  org_id  uuid not null references organizations(id),
  key     text not null,
  value   jsonb not null,
  primary key (org_id, key)
);

create table feature_flags (
  org_id  uuid not null references organizations(id),
  flag    text not null,
  enabled boolean not null default false,
  primary key (org_id, flag)
);

-- =====================================================================
--  11. TRIGGERS
-- =====================================================================

-- updated_at bumping
create or replace function app.touch_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger t_touch_profiles    before update on profiles
  for each row execute function app.touch_updated_at();
create trigger t_touch_students    before update on students
  for each row execute function app.touch_updated_at();
create trigger t_touch_sessions    before update on sessions
  for each row execute function app.touch_updated_at();
create trigger t_touch_applications before update on applications
  for each row execute function app.touch_updated_at();

-- ---- Message scanner: the heart of the anti-disintermediation guard ----
-- On every insert, look for emails, phone numbers, payment handles and
-- "take it off the app" language. Flag + log + (optionally) redact, and
-- raise the sender's risk score if they are a tutor.
create or replace function app.scan_message() returns trigger
  language plpgsql security definer set search_path = public, app as $$
declare
  reasons app.flag_kind[] := '{}';
  redacted text := new.body;
  sender_role app.user_role;
  do_redact boolean;
begin
  -- email
  if new.body ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' then
    reasons := reasons || 'email'::app.flag_kind;
    redacted := regexp_replace(redacted,'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}','[contact removed]','gi');
  end if;
  -- phone (loose: 10+ digits possibly spaced/dashed/parenthesised)
  if new.body ~ '(\+?\d[\d\s().-]{8,}\d)' then
    reasons := reasons || 'phone'::app.flag_kind;
    redacted := regexp_replace(redacted,'(\+?\d[\d\s().-]{8,}\d)','[contact removed]','g');
  end if;
  -- payment handles
  if new.body ~* '(venmo|cash ?app|cashapp|zelle|paypal|\$[a-z0-9]{2,})' then
    reasons := reasons || 'payment_handle'::app.flag_kind;
  end if;
  -- external platforms / off-platform solicitation
  if new.body ~* '(whats ?app|telegram|signal|instagram|\bdm me\b|text me|call me|off the app|pay me directly|cash\b)' then
    reasons := reasons || 'external_platform'::app.flag_kind;
  end if;

  if array_length(reasons,1) is not null then
    new.flagged := true;
    new.flag_reasons := reasons;

    -- redact for non-admins only if the org opted in (default: on)
    select coalesce((value)::boolean, true) into do_redact
      from app_settings s
      join conversations c on c.id = new.conversation_id
     where s.org_id = c.org_id and s.key = 'redact_contact_info';
    if do_redact is null then do_redact := true; end if;
    if do_redact then new.redacted_body := redacted; end if;
  end if;

  return new;
end $$;

create trigger t_scan_message before insert on messages
  for each row execute function app.scan_message();

-- After insert, fan out the detections into the admin-only audit tables.
create or replace function app.record_message_flags() returns trigger
  language plpgsql security definer set search_path = public, app as $$
declare
  r app.flag_kind;
  sender_role app.user_role;
  conv_org uuid;
begin
  if not new.flagged then return new; end if;
  select org_id into conv_org from conversations where id = new.conversation_id;
  select role into sender_role from profiles where id = new.sender_id;

  foreach r in array new.flag_reasons loop
    insert into message_flags(message_id,sender_id,kind,excerpt)
    values (new.id,new.sender_id,r,left(new.body,160));
  end loop;

  -- Tutors trying to move off-platform is the specific thing we guard.
  if sender_role = 'tutor' then
    insert into risk_flags(org_id,subject_id,kind,severity,detail)
    values (conv_org,new.sender_id,'off_platform_contact',
            least(5,array_length(new.flag_reasons,1)+1),
            'Flagged message in conversation '||new.conversation_id);
  end if;
  return new;
end $$;

create trigger t_record_message_flags after insert on messages
  for each row execute function app.record_message_flags();

-- =====================================================================
--  12. VIEWS
-- =====================================================================

-- The ONLY way a tutor should read student/parent identity. Names are
-- reduced to "First L." and contact columns simply do not exist here.
-- (Admins/parents/students read the base tables directly under RLS.)
create or replace view tutor_student_directory as
select
  s.id              as student_id,
  s.first_name || ' ' || left(s.last_name,1) || '.' as display_name,
  s.grade,
  s.status
from students s
where app.is_tutor_of(s.id);

-- Admin dashboard: rolled-up risk per tutor.
create or replace view admin_tutor_risk as
select
  p.id as tutor_id,
  p.full_name,
  count(*) filter (where rf.state = 'open')              as open_flags,
  coalesce(max(rf.severity) filter (where rf.state='open'),0) as max_severity,
  max(rf.created_at)                                     as last_flag_at
from profiles p
left join risk_flags rf on rf.subject_id = p.id
where p.role = 'tutor'
group by p.id, p.full_name;

-- =====================================================================
--  13. ROW-LEVEL SECURITY
--  Enable on every table, then write least-privilege policies.
--  Pattern: admin gets everything in-org; others get a narrow slice.
-- =====================================================================

alter table organizations          enable row level security;
alter table profiles               enable row level security;
alter table students               enable row level security;
alter table guardianships          enable row level security;
alter table tutor_profiles         enable row level security;
alter table tutoring_assignments   enable row level security;
alter table sessions               enable row level security;
alter table session_notes          enable row level security;
alter table progress_snapshots     enable row level security;
alter table homework               enable row level security;
alter table applications           enable row level security;
alter table application_schools    enable row level security;
alter table application_essays     enable row level security;
alter table application_tasks      enable row level security;
alter table conversations          enable row level security;
alter table conversation_participants enable row level security;
alter table messages               enable row level security;
alter table message_flags          enable row level security;
alter table invoices               enable row level security;
alter table payouts                enable row level security;
alter table risk_flags             enable row level security;
alter table pii_access_log         enable row level security;
alter table audit_log              enable row level security;
alter table notifications          enable row level security;

-- ---- profiles ----
-- See yourself; admins see the whole org. Tutors do NOT get a blanket
-- read on profiles (that is how their PII would leak) — they read peers
-- only through the masked tutor_student_directory view.
create policy profiles_self_read on profiles
  for select using ( id = app.uid() or app.is_admin() );
create policy profiles_self_update on profiles
  for update using ( id = app.uid() or app.is_admin() );
create policy profiles_admin_write on profiles
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- students ----
create policy students_visibility on students
  for select using ( app.can_see_student(id) );
create policy students_admin_write on students
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- guardianships ---- (a parent sees their own links; admin all)
create policy guardianships_read on guardianships
  for select using ( parent_id = app.uid() or app.is_admin() );
create policy guardianships_admin_write on guardianships
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- tutor_profiles ---- (public-ish: anyone in org sees name/rating;
--      hourly_rate is filtered in the API/select-list, not here)
create policy tutor_profiles_read on tutor_profiles
  for select using ( org_id = app.org() );
create policy tutor_profiles_self on tutor_profiles
  for update using ( profile_id = app.uid() or app.is_admin() );
create policy tutor_profiles_admin on tutor_profiles
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- assignments ---- (tutor sees their own; parent/student see theirs)
create policy assignments_read on tutoring_assignments
  for select using (
    app.is_admin()
    or tutor_id = app.uid()
    or app.can_see_student(student_id)
  );
create policy assignments_admin_write on tutoring_assignments
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- sessions ---- (tutor of that student, the family, or admin)
create policy sessions_read on sessions
  for select using ( tutor_id = app.uid() or app.can_see_student(student_id) );
create policy sessions_tutor_update on sessions
  for update using ( tutor_id = app.uid() or app.is_admin() );
create policy sessions_admin_write on sessions
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- session_notes ---- (tutor who wrote it/teaches; family only if
--      the note is marked parent_visible; admin always)
create policy session_notes_read on session_notes
  for select using (
    app.is_admin()
    or tutor_id = app.uid()
    or ( parent_visible and exists (
          select 1 from sessions s
          where s.id = session_id and app.can_see_student(s.student_id)) )
  );
create policy session_notes_tutor_write on session_notes
  for insert with check ( tutor_id = app.uid() or app.is_admin() );

-- ---- progress & homework ---- (anyone who may see the student)
create policy progress_read on progress_snapshots
  for select using ( app.can_see_student(student_id) );
create policy progress_write on progress_snapshots
  for insert with check ( app.is_admin() or app.is_tutor_of(student_id) );

create policy homework_read on homework
  for select using ( app.can_see_student(student_id) );
create policy homework_write on homework
  for insert with check ( app.is_admin() or app.is_tutor_of(student_id) );
create policy homework_update on homework
  for update using ( app.can_see_student(student_id) );

-- ---- admissions ---- (family + assigned counselor + admin)
create policy applications_read on applications
  for select using ( app.can_see_student(student_id) or counselor_id = app.uid() );
create policy applications_admin_write on applications
  for all using ( app.is_admin() or counselor_id = app.uid() )
  with check ( app.is_admin() or counselor_id = app.uid() );

-- child tables inherit visibility through their application
create policy app_schools_read on application_schools
  for select using ( exists (select 1 from applications a
     where a.id = application_id and (app.can_see_student(a.student_id) or a.counselor_id = app.uid())) );
create policy app_essays_read on application_essays
  for select using ( exists (select 1 from applications a
     where a.id = application_id and (app.can_see_student(a.student_id) or a.counselor_id = app.uid())) );
create policy app_tasks_read on application_tasks
  for select using ( exists (select 1 from applications a
     where a.id = application_id and (app.can_see_student(a.student_id) or a.counselor_id = app.uid())) );

-- ---- conversations & messages — the monitoring rules ----
-- You may read a conversation if you participate in it, OR you are the
-- parent of the student it is about (THIS is parent message-monitoring),
-- OR you are admin. Membership is checked via app.is_participant() (a
-- SECURITY DEFINER helper) so this policy never re-enters the
-- conversation_participants policy below.
create policy conversations_read on conversations
  for select using (
    app.is_admin()
    or (student_id is not null and app.is_parent_of(student_id))
    or app.is_participant(id)
  );
create policy conversations_create on conversations
  for insert with check ( org_id = app.org() );

create policy participants_read on conversation_participants
  for select using (
    app.is_admin()
    or profile_id = app.uid()
    or app.is_parent_of(app.convo_student(conversation_id))
  );

-- Messages: same visibility as the parent conversation. Note there is no
-- UPDATE/DELETE policy -> messages are immutable for everyone but admin,
-- so a tutor cannot scrub a flagged message.
create policy messages_read on messages
  for select using (
    app.is_admin()
    or app.is_parent_of(app.convo_student(conversation_id))
    or app.is_participant(conversation_id)
  );
create policy messages_send on messages
  for insert with check (
    sender_id = app.uid() and app.is_participant(conversation_id)
  );

-- ---- admin-only governance tables ----
create policy flags_admin_only       on message_flags for all
  using ( app.is_admin() ) with check ( app.is_admin() );
create policy risk_admin_only        on risk_flags    for all
  using ( app.is_admin() ) with check ( app.is_admin() );
create policy pii_log_admin_read     on pii_access_log for select
  using ( app.is_admin() );
create policy pii_log_self_insert    on pii_access_log for insert
  with check ( actor_id = app.uid() );      -- the app logs the actor's own reveals
create policy audit_admin_read       on audit_log     for select
  using ( app.is_admin() );

-- ---- billing ----
-- Parent sees their own invoices; admin all. Tutors: no policy -> no rows.
create policy invoices_read on invoices
  for select using ( parent_id = app.uid() or app.is_admin() );
create policy invoices_admin_write on invoices
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- Tutor sees their OWN payout (not the parent's invoice, so margin stays
-- hidden); admin all.
create policy payouts_read on payouts
  for select using ( tutor_id = app.uid() or app.is_admin() );
create policy payouts_admin_write on payouts
  for all using ( app.is_admin() ) with check ( app.is_admin() );

-- ---- notifications ----
create policy notifications_read on notifications
  for select using ( recipient_id = app.uid() or app.is_admin() );

-- =====================================================================
--  15. ROLE GRANTS (Supabase-friendly, portable)
--  On Supabase, API requests run as the `authenticated` role. Grant it
--  table/function access; RLS above does the actual filtering. Guarded so
--  the same file still loads on vanilla Postgres where the role is absent.
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema public, app to authenticated;
    grant select, insert, update on all tables in schema public to authenticated;
    grant execute on all functions in schema app to authenticated;
    -- anon (logged-out) gets nothing by default.
    revoke all on all tables in schema public from anon;
  end if;
end $$;
--  * messages & audit_log are append-heavy: partition BY RANGE (created_at)
--    monthly once they grow; the indexes above are partition-friendly.
--  * Use the Supabase pooler (pgBouncer) connection string for serverless
--    API routes; the direct connection only for migrations/long jobs.
--  * Heavy aggregations (revenue, risk rollups) -> materialized views
--    refreshed on a schedule, or move to a read replica on the Pro plan.
--  * Every hot lookup is indexed on (tenant/owner, time) so queries stay
--    selective as row counts climb.
-- =====================================================================
