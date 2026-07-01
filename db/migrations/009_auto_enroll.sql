-- =====================================================================
--  Migration 009 — auto-enroll a self-registering student in their program
--
--  When a STUDENT signs up via a "Get started" service CTA, the chosen
--  program rides along in the Auth metadata. We already store it on the
--  profile; now, once the students row exists, create the matching
--  enrollment automatically. (Parent sign-ups have no student yet, so their
--  interested_program stays on the profile for admin/onboarding to act on.)
-- =====================================================================
set check_function_bodies = off;

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
    case when v_program is not null then jsonb_build_object('interested_program', v_program) else '{}'::jsonb end
  )
  on conflict (id) do nothing;

  if v_role = 'tutor' then
    insert into tutor_profiles (profile_id, org_id) values (new.id, org) on conflict do nothing;
  end if;

  if v_role = 'student' and not exists (select 1 from students where user_id = new.id) then
    insert into students (org_id, user_id, first_name, last_name)
    values (org, new.id, split_part(v_name, ' ', 1), trim(regexp_replace(v_name, '^\S+', '')))
    returning id into v_student;

    if v_program in ('tutoring', 'admissions') then
      insert into enrollments (org_id, student_id, program)
      values (org, v_student, v_program::app.program)
      on conflict (student_id, program) do nothing;
    end if;
  end if;

  return new;
end $$;
