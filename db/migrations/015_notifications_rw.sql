-- =====================================================================
--  Migration 015 — let recipients mark their own notifications read
--
--  notifications had a SELECT-only policy; inserts come from the reminder
--  Edge Function (service role). Add an UPDATE policy so a user can mark
--  their own notifications read (clears the unread badge).
-- =====================================================================
drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications for update
  using ( recipient_id = app.uid() )
  with check ( recipient_id = app.uid() );
