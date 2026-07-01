-- =====================================================================
--  YAKAL — seed data + the auth->profile bridge
--  Run AFTER yakal_schema.sql.
--
--  Three parts:
--    PART A  triggers + reference data        (always run)
--    PART B  demo profiles WITHOUT Supabase Auth (LOCAL/DEV ONLY — skip on
--            Supabase if you create the accounts through sign-up/Auth)
--    PART C  demo families, sessions, messages, billing (always run,
--            after the profiles exist — keyed by email so it works either way)
-- =====================================================================

set check_function_bodies = off;

-- =====================================================================
--  PART A — the auth->profile bridge + reference data
-- =====================================================================

-- When someone signs up through Supabase Auth, this trigger creates their
-- matching profiles row from the metadata the app sends (full_name, role).
-- This is what makes the app's sign-up flow persist on the live backend.
create or replace function app.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public, app as $$
declare
  org       uuid;
  v_role    app.user_role := coalesce((new.raw_user_meta_data->>'role')::app.user_role, 'student');
  v_name    text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
  v_program text := new.raw_user_meta_data->>'program';
  v_student uuid;
begin
  select id into org from organizations order by created_at limit 1;
  insert into profiles (id, org_id, role, full_name, email, metadata)
  values (
    new.id, org, v_role, v_name, new.email,
    case when new.raw_user_meta_data ? 'program'
         then jsonb_build_object('interested_program', new.raw_user_meta_data->>'program')
         else '{}'::jsonb end
  )
  on conflict (id) do nothing;

  -- tutors get a tutor_profiles row too
  if v_role = 'tutor' then
    insert into tutor_profiles (profile_id, org_id) values (new.id, org)
    on conflict do nothing;
  end if;

  -- students get a linked students row, otherwise every student portal view
  -- (which reads through app.my_student_id()) has nothing to load. last_name
  -- is NOT NULL, so a single-word name yields an empty (but valid) last name.
  if v_role = 'student'
     and not exists (select 1 from students where user_id = new.id) then
    insert into students (org_id, user_id, first_name, last_name)
    values (
      org, new.id,
      split_part(v_name, ' ', 1),
      trim(regexp_replace(v_name, '^\S+', ''))
    )
    returning id into v_student;

    -- auto-enroll the new student in the program they signed up for
    if v_program in ('tutoring', 'admissions') then
      insert into enrollments (org_id, student_id, program)
      values (org, v_student, v_program::app.program)
      on conflict (student_id, program) do nothing;
    end if;
  end if;

  return new;
end $$;

-- Attach to auth.users (exists on Supabase). On vanilla Postgres used for
-- local testing, create a stub auth.users first (see the integration guide).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- Reference data ------------------------------------------------------
insert into organizations (id, name, slug, brand) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Yakal Education Services','yakal',
   '{"teal":"#1099A1","pink":"#CC3366","tagline":"inspiring hope, shaping futures"}')
on conflict (id) do nothing;

insert into app_settings (org_id, key, value) values
  ('aaaaaaaa-0000-0000-0000-000000000001','redact_contact_info','true')
on conflict do nothing;

insert into subjects (org_id, name, category) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Algebra','STEM'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Geometry','STEM'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Pre-Calculus','STEM'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Calculus','STEM'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Physics','STEM'),
  ('aaaaaaaa-0000-0000-0000-000000000001','SAT Prep','Test Prep'),
  ('aaaaaaaa-0000-0000-0000-000000000001','College Essays','Admissions')
on conflict (org_id, name) do nothing;

insert into service_packages (org_id, name, price_cents, features) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Essentials',120000,'["School list","Essay review","2 sessions/mo"]'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Premier',280000,'["Everything in Essentials","Full essay coaching","Weekly sessions"]'),
  ('aaaaaaaa-0000-0000-0000-000000000001','Elite',520000,'["Everything in Premier","Unlimited sessions","Interview prep","Priority support"]')
on conflict do nothing;

-- =====================================================================
--  PART B — demo profiles WITHOUT Supabase Auth  (LOCAL / DEV ONLY)
--  On Supabase: DELETE or comment out this whole block and instead create
--  the 8 accounts through the app's sign-up screen (or the Auth dashboard).
--  The handle_new_user trigger will create the profiles for you.
-- =====================================================================
insert into profiles (id, org_id, role, full_name, email, phone) values
 ('a0000000-0000-0000-0000-0000000000a1','aaaaaaaa-0000-0000-0000-000000000001','admin','Almaz Tadesse','almaz@yakal.me','301-555-0001'),
 ('b0000000-0000-0000-0000-0000000000b1','aaaaaaaa-0000-0000-0000-000000000001','tutor','Bethlehem Alemu','beth@yakal.me','301-555-0002'),
 ('b0000000-0000-0000-0000-0000000000b2','aaaaaaaa-0000-0000-0000-000000000001','tutor','Eyasu (Josh) Tadesse','josh@yakal.me','301-555-0003'),
 ('b0000000-0000-0000-0000-0000000000b3','aaaaaaaa-0000-0000-0000-000000000001','tutor','Hana Girma','hana@yakal.me','301-555-0004'),
 ('b0000000-0000-0000-0000-0000000000b4','aaaaaaaa-0000-0000-0000-000000000001','tutor','Daniel Asfaw','daniel@yakal.me','301-555-0005'),
 ('c0000000-0000-0000-0000-0000000000c1','aaaaaaaa-0000-0000-0000-000000000001','parent','Tigist Worku','tigist@email.com','301-555-0010'),
 ('c0000000-0000-0000-0000-0000000000c2','aaaaaaaa-0000-0000-0000-000000000001','parent','Sara Mekonnen','sara@email.com','301-555-0011'),
 ('d0000000-0000-0000-0000-0000000000d1','aaaaaaaa-0000-0000-0000-000000000001','student','Amen Worku','amen@email.com','301-555-0012')
on conflict (id) do nothing;

insert into tutor_profiles (profile_id, org_id, rating, hourly_rate, accepting) values
 ('b0000000-0000-0000-0000-0000000000b1','aaaaaaaa-0000-0000-0000-000000000001',4.9,45,true),
 ('b0000000-0000-0000-0000-0000000000b2','aaaaaaaa-0000-0000-0000-000000000001',5.0,50,true),
 ('b0000000-0000-0000-0000-0000000000b3','aaaaaaaa-0000-0000-0000-000000000001',4.8,55,false),
 ('b0000000-0000-0000-0000-0000000000b4','aaaaaaaa-0000-0000-0000-000000000001',4.7,42,true)
on conflict (profile_id) do nothing;

-- =====================================================================
--  PART C — demo families, sessions, messages, billing
--  Keyed by email, so it works whether the profiles came from Auth
--  sign-ups (Part B skipped) or from Part B directly.
-- =====================================================================
do $$
declare
  org uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  almaz uuid; beth uuid; josh uuid; hana uuid; tigist uuid; sara uuid; amen_u uuid;
  s_amen uuid; s_saron uuid; s_liya uuid;
  subj_essay uuid; subj_sat uuid; subj_alg uuid; subj_geo uuid;
  app_amen uuid; conv1 uuid; conv2 uuid; conv4 uuid;
begin
  select id into almaz  from profiles where email='almaz@yakal.me';
  select id into beth   from profiles where email='beth@yakal.me';
  select id into josh   from profiles where email='josh@yakal.me';
  select id into hana   from profiles where email='hana@yakal.me';
  select id into tigist from profiles where email='tigist@email.com';
  select id into sara   from profiles where email='sara@email.com';
  select id into amen_u from profiles where email='amen@email.com';

  if beth is null or tigist is null then
    raise notice 'Demo profiles not found — create the accounts first (Auth sign-up or Part B), then re-run Part C.';
    return;
  end if;

  select id into subj_essay from subjects where org_id=org and name='College Essays';
  select id into subj_sat   from subjects where org_id=org and name='SAT Prep';
  select id into subj_alg   from subjects where org_id=org and name='Algebra';
  select id into subj_geo   from subjects where org_id=org and name='Geometry';

  -- Students (Amen has a login; Saron & Liya are parent-managed)
  insert into students (id, org_id, user_id, first_name, last_name, grade) values
   (gen_random_uuid(), org, amen_u, 'Amen','Worku','Grade 12') returning id into s_amen;
  insert into students (id, org_id, first_name, last_name, grade) values
   (gen_random_uuid(), org, 'Saron','Worku','Grade 9') returning id into s_saron;
  insert into students (id, org_id, first_name, last_name, grade) values
   (gen_random_uuid(), org, 'Liya','Mekonnen','Grade 11') returning id into s_liya;

  -- Guardianships
  insert into guardianships (parent_id, student_id) values
   (tigist, s_amen), (tigist, s_saron), (sara, s_liya);

  -- Tutor assignments (drives tutor visibility)
  insert into tutoring_assignments (org_id, tutor_id, student_id, subject_id) values
   (org, beth, s_amen, subj_sat),
   (org, josh, s_saron, subj_alg),
   (org, beth, s_liya, subj_geo);

  -- Sessions
  insert into sessions (org_id, student_id, tutor_id, subject_id, scheduled_start, scheduled_end, mode, status) values
   (org, s_amen, beth, subj_sat, now()+interval '2 day', now()+interval '2 day 1 hour','online','scheduled'),
   (org, s_amen, hana, subj_essay, now()-interval '3 day', now()-interval '3 day' + interval '1 hour','online','completed'),
   (org, s_liya, beth, subj_geo, now()+interval '6 hour', now()+interval '7 hour','online','scheduled'),
   (org, s_saron, josh, subj_alg, now()-interval '1 day', now()-interval '1 day' + interval '1 hour','in_person','completed');

  -- Progress snapshots
  insert into progress_snapshots (org_id, student_id, subject_id, percent) values
   (org, s_amen, subj_essay, 72),(org, s_amen, subj_sat, 61),
   (org, s_saron, subj_alg, 85),(org, s_liya, subj_geo, 58),(org, s_liya, subj_sat, 66);

  -- Homework
  insert into homework (org_id, student_id, subject_id, title, due_date, status) values
   (org, s_amen, subj_essay, 'Common App essay — draft 2', current_date+3, 'assigned'),
   (org, s_amen, subj_sat, 'SAT practice test 3', current_date+6, 'assigned'),
   (org, s_amen, null, 'Revise activities list', current_date-1, 'graded');

  -- Admissions
  insert into applications (org_id, student_id, counselor_id, stage, target_school, next_deadline)
   values (org, s_amen, hana, 'apply', 'Johns Hopkins University', current_date+9) returning id into app_amen;
  insert into application_schools (application_id, school_name, kind, deadline) values
   (app_amen,'Johns Hopkins University','reach', current_date+9),
   (app_amen,'University of Maryland','match', current_date+20),
   (app_amen,'Towson University','safety', current_date+30);
  insert into application_essays (application_id, title, status) values
   (app_amen,'Common App personal statement','done'),
   (app_amen,'JHU "why us" supplement','in_progress'),
   (app_amen,'Activities descriptions','done');
  insert into application_tasks (application_id, title, status) values
   (app_amen,'Request recommendation letters','done'),
   (app_amen,'Finalize school list','done'),
   (app_amen,'Submit FAFSA','todo');

  -- Conversations + participants + messages
  insert into conversations (org_id, subject, student_id, created_by) values
   (org,'Essay & SAT help', s_amen, beth) returning id into conv1;
  insert into conversation_participants (conversation_id, profile_id) values (conv1, beth),(conv1, amen_u);
  insert into messages (conversation_id, sender_id, body) values
   (conv1, beth, 'Nice work on draft 1. Tighten the opening before Thursday.'),
   (conv1, amen_u, 'Got it — I will revise the intro tonight.');

  insert into conversations (org_id, subject, student_id, created_by) values
   (org,'Admissions updates', s_amen, hana) returning id into conv2;
  insert into conversation_participants (conversation_id, profile_id) values (conv2, hana),(conv2, tigist);
  insert into messages (conversation_id, sender_id, body) values
   (conv2, hana, 'Amen''s JHU supplement looks strong. Comments are in the doc.'),
   (conv2, tigist, 'Thank you! When is the next session?');

  -- This one deliberately contains contact info -> the scanner trigger will
  -- flag + redact it on insert, demonstrating the anti-disintermediation guard.
  insert into conversations (org_id, subject, student_id, created_by) values
   (org,'Liya — scheduling', s_liya, sara) returning id into conv4;
  insert into conversation_participants (conversation_id, profile_id) values (conv4, beth),(conv4, sara);
  insert into messages (conversation_id, sender_id, body) values
   (conv4, sara, 'Could we move Liya to 4:30 next week?'),
   (conv4, beth, 'Sure, 4:30 Tuesday works.'),
   (conv4, beth, 'Actually just text me at 301-555-9999 so we can sort it off the app.');

  -- Billing: money flows parent -> Yakal -> tutor
  insert into invoices (org_id, parent_id, student_id, period, amount_cents, status, paid_at) values
   (org, tigist, s_amen, 'November 2026', 48000, 'paid', now()-interval '20 day'),
   (org, sara,  s_liya, 'November 2026', 36000, 'open', null);
  insert into payouts (org_id, tutor_id, period, amount_cents, sessions_count, status) values
   (org, beth, 'November', 157500, 35, 'pending'),
   (org, josh, 'November', 72000, 16, 'pending'),
   (org, hana, 'November', 90000, 18, 'pending');

  raise notice 'Seed complete. Demo families loaded.';
end $$;
