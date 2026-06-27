# Zoom video sessions

Online tutoring sessions run in **Yakal-managed Zoom rooms**. The join URL is
created server-side and stored on `sessions.meeting_url`; the student's
**"Join session"** button opens it. Tutors never share a personal link — the
same anti-disintermediation rule the rest of the schema enforces.

```
Tutor/Admin clicks "Create video room"
        │
        ▼
Edge Function  zoom-create-meeting
   1. verifies caller is admin or the session's tutor
   2. gets a Zoom Server-to-Server OAuth token
   3. POST /v2/users/me/meetings  → join_url
   4. saves join_url to sessions.meeting_url
        │
        ▼
Student "Join session"  →  opens sessions.meeting_url
```

The browser app holds **no Zoom secrets** — it only calls the function via
`supabase.functions.invoke('zoom-create-meeting', { body: { session_id } })`.

---

## 1. Create the Zoom app (one time)

1. Go to <https://marketplace.zoom.us> → **Develop → Build App**.
2. Choose **Server-to-Server OAuth**.
3. Copy the **Account ID**, **Client ID**, and **Client Secret**.
4. Under **Scopes**, add `meeting:write:admin` (and `meeting:read:admin`).
5. **Activate** the app.

## 2. Give the function its secrets

From the repo root, with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login                        # opens browser, or: supabase login --token sbp_xxx
supabase link --project-ref kgttkhbqeyvupikgozfu
supabase secrets set \
  ZOOM_ACCOUNT_ID=...  ZOOM_CLIENT_ID=...  ZOOM_CLIENT_SECRET=...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically — you do **not** set those.

## 3. Deploy the function

```bash
supabase functions deploy zoom-create-meeting
```

## 4. Try it

- Sign in as an **admin** or the session's **tutor**, open the home screen, and
  click **Create video room** on the next session. It calls the function, which
  creates the meeting and stores the URL.
- Sign in as the **student** for that session → **Join session** now opens the
  real Zoom room.

### Test the function directly

```bash
ACCESS_TOKEN=...   # a logged-in user's JWT (admin or the session's tutor)
curl -X POST \
  https://kgttkhbqeyvupikgozfu.supabase.co/functions/v1/zoom-create-meeting \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<a-session-uuid>"}'
# → {"join_url":"https://us05web.zoom.us/j/...","meeting_id":...}
```

## Notes

- The function is **idempotent**: if a session already has a `meeting_url` it
  returns the existing one instead of creating a duplicate.
- Meeting defaults: waiting room on, mute on entry, join-before-host on. Tune in
  `supabase/functions/zoom-create-meeting/index.ts`.
- Demo mode (no Supabase keys) returns a placeholder `zoom.us/j/...` URL so the
  flow is clickable without any backend.
- To swap providers later (Daily.co, Whereby, Jitsi), only this one function
  changes — the app contract (`ensureMeeting` → a join URL) stays the same.
