-- =====================================================================
--  Migration 006 — seed program enrollments + staff program membership
--
--  Idempotent. Keyed by name/email so it works whether profiles came from
--  Auth sign-ups or the demo seed. The two program-admin accounts
--  (tadmin@yakal.me / aadmin@yakal.me) are created through Auth (sign-up or
--  the operational script) — this file only wires program membership.
-- =====================================================================
do $$
declare
  org uuid;
  s_amen uuid; s_saron uuid; s_liya uuid;
begin
  select id into org from organizations order by created_at limit 1;
  select id into s_amen  from students where first_name='Amen'  and last_name='Worku'     limit 1;
  select id into s_saron from students where first_name='Saron' and last_name='Worku'     limit 1;
  select id into s_liya  from students where first_name='Liya'  and last_name='Mekonnen'  limit 1;

  -- Enrollments: Amen & Liya in both programs, Saron tutoring only.
  insert into enrollments (org_id, student_id, program)
  select org, sid, prog from (values
    (s_amen,'tutoring'::app.program), (s_amen,'admissions'),
    (s_saron,'tutoring'),
    (s_liya,'tutoring'), (s_liya,'admissions')
  ) v(sid, prog)
  where sid is not null
  on conflict (student_id, program) do nothing;

  -- Tutors -> tutoring program.
  insert into staff_programs (profile_id, program)
  select id, 'tutoring'::app.program from profiles
  where email in ('beth@yakal.me','josh@yakal.me','daniel@yakal.me')
  on conflict do nothing;

  -- Hana is the admissions counselor.
  update profiles set role='counselor' where email='hana@yakal.me';
  insert into staff_programs (profile_id, program)
  select id, 'admissions'::app.program from profiles where email='hana@yakal.me'
  on conflict do nothing;

  -- Program admins (accounts created via Auth) -> their program.
  insert into staff_programs (profile_id, program)
  select id, 'tutoring'::app.program from profiles where email='tadmin@yakal.me'
  on conflict do nothing;
  insert into staff_programs (profile_id, program)
  select id, 'admissions'::app.program from profiles where email='aadmin@yakal.me'
  on conflict do nothing;
end $$;
