-- =====================================================================
--  Migration 016 — per-user conversation read state (unread badges)
--
--  Tracks the last time each user opened each conversation, so we can show
--  unread-message counts (e.g. on a parent's child cards). Each user manages
--  only their own read records.
-- =====================================================================
create table if not exists conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      uuid not null references profiles(id),
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

alter table conversation_reads enable row level security;

drop policy if exists conv_reads_rw on conversation_reads;
create policy conv_reads_rw on conversation_reads for all
  using ( profile_id = app.uid() )
  with check ( profile_id = app.uid() );

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on conversation_reads to authenticated;
  end if;
end $$;
