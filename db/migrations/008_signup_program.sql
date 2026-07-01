-- =====================================================================
--  Migration 008 — capture the program a family chose at sign-up
--
--  When someone clicks "Get started" on a service card, the chosen program
--  (tutoring / admissions) rides along in the Auth user metadata. Persist it
--  on their profile so onboarding / auto-enrollment can act on it later.
-- =====================================================================
set check_function_bodies = off;

create or replace function app.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public, app as $$
declare
  org    uuid;
  v_role app.user_role := coalesce((new.raw_user_meta_data->>'role')::app.user_role, 'student');
  v_name text          := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1));
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

  if v_role = 'tutor' then
    insert into tutor_profiles (profile_id, org_id) values (new.id, org)
    on conflict do nothing;
  end if;

  if v_role = 'student'
     and not exists (select 1 from students where user_id = new.id) then
    insert into students (org_id, user_id, first_name, last_name)
    values (org, new.id, split_part(v_name, ' ', 1), trim(regexp_replace(v_name, '^\S+', '')));
  end if;

  return new;
end $$;
