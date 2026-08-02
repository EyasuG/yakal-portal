-- 026_escalate_flags_to_parents.sql
-- Escalate the two highest-trust-risk message flags — grifting (payment_handle)
-- and disintermediation / off-platform solicitation (external_platform) — to
-- the student's parents/guardians AND to org admins via the notifications feed.
--
-- Admins already saw everything in Trust & Safety; this adds a push notification
-- for them and, importantly, loops in the parents so families are aware when
-- someone tries to move payment or contact off the platform.
--
-- Privacy: the parent notification never contains the raw contact info or the
-- flagged excerpt (that stays admin-only in message_flags). It only names the
-- category so the family knows staff are reviewing it.

create or replace function app.record_message_flags() returns trigger
  language plpgsql security definer set search_path = public, app as $$
declare
  r app.flag_kind;
  sender_role app.user_role;
  conv_org uuid;
  conv_student uuid;
  notify_grift boolean := false;
  notify_offplatform boolean := false;
  reason_phrase text;
  sender_name text;
  student_name text;
begin
  if not new.flagged then return new; end if;
  select org_id into conv_org from conversations where id = new.conversation_id;
  select role, full_name into sender_role, sender_name from profiles where id = new.sender_id;
  conv_student := app.convo_student(new.conversation_id);

  foreach r in array new.flag_reasons loop
    insert into message_flags(message_id,sender_id,kind,excerpt)
    values (new.id,new.sender_id,r,left(new.body,160));
    if r = 'payment_handle'    then notify_grift := true; end if;
    if r = 'external_platform' then notify_offplatform := true; end if;
  end loop;

  -- Tutors trying to move off-platform is the specific thing we guard.
  if sender_role = 'tutor' then
    insert into risk_flags(org_id,subject_id,kind,severity,detail)
    values (conv_org,new.sender_id,'off_platform_contact',
            least(5,array_length(new.flag_reasons,1)+1),
            'Flagged message in conversation '||new.conversation_id);
  end if;

  -- Escalate grifting + disintermediation to parents & admins.
  if notify_grift or notify_offplatform then
    reason_phrase := case
      when notify_grift and notify_offplatform then 'payment solicitation and off-platform contact'
      when notify_grift then 'payment solicitation'
      else 'an attempt to move contact off-platform' end;

    if conv_student is not null then
      select nullif(trim(coalesce(first_name,'')||' '||coalesce(last_name,'')),'')
        into student_name
        from students where id = conv_student;
    end if;
    student_name := coalesce(student_name, 'a student');

    -- Org admins: full context, points them at Trust & Safety.
    insert into notifications(org_id,recipient_id,kind,title,body,entity_type,entity_id)
    select conv_org, p.id, 'safety_flag',
           'Safety alert: '||student_name,
           coalesce(sender_name,'A user')||' sent a message flagged for '||reason_phrase||
             '. Review it in Trust & Safety.',
           'conversation', new.conversation_id
      from profiles p
     where p.org_id = conv_org
       and p.role in ('admin','super_admin')
       and p.id <> new.sender_id;

    -- Parents/guardians: awareness only, no raw contact info.
    if conv_student is not null then
      insert into notifications(org_id,recipient_id,kind,title,body,entity_type,entity_id)
      select conv_org, g.parent_id, 'safety_flag',
             'Safety alert in '||student_name||'''s messages',
             'A message in this conversation was flagged for '||reason_phrase||
               '. Yakal staff have been notified and are reviewing it. '||
               'Please keep all contact and payment inside the portal.',
             'conversation', new.conversation_id
        from guardianships g
       where g.student_id = conv_student
         and g.parent_id <> new.sender_id;
    end if;
  end if;

  return new;
end $$;

-- trigger already exists from schema.sql; create or replace above is sufficient.
