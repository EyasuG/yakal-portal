-- =====================================================================
--  Migration 010 — session types (Tutoring offerings)
--
--  Tutoring is more than 1-on-1: group sessions at our location, summer
--  camps, STEM bootcamps, and Math Labs. Tag each session with its type so
--  booking and scheduling can distinguish them. (Enum ADD VALUE is safe to
--  run standalone; the whole file has no cross-txn enum use.)
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where t.typname='session_type' and n.nspname='app') then
    create type app.session_type as enum ('individual','group','camp','bootcamp','math_lab');
  end if;
end $$;

alter table sessions add column if not exists session_type app.session_type not null default 'individual';
