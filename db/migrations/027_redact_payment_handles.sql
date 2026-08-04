-- 027_redact_payment_handles.sql
-- Redaction completeness: the scanner already FLAGS payment handles, but it only
-- REDACTED phone + email — so a grifting message like "Venmo me at $joshpay"
-- still showed the raw handle to the recipient. Mask payment $handles too.
--
-- We only redact a $token that contains a letter (e.g. $joshpay, $amenw), so
-- legitimate dollar amounts ($50, $1200) are preserved. Phone/email redaction
-- is unchanged.

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
  -- redact $handles that contain a letter (keep plain dollar amounts intact)
  if new.body ~* '\$[a-z0-9_.]*[a-z][a-z0-9_.]*' then
    redacted := regexp_replace(redacted,'\$[a-z0-9_.]*[a-z][a-z0-9_.]*','[contact removed]','gi');
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

-- trigger t_scan_message already bound to this function in schema.sql.
