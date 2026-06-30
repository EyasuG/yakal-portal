// Yakal — create (or reuse) a Zoom meeting for a tutoring session.
//
// Why a server-side function: Zoom Server-to-Server OAuth credentials are
// secrets and must never live in the public browser app. This Edge Function
// holds them, creates a Yakal-managed meeting room (never a tutor's personal
// link — the anti-disintermediation rule), and stores the join URL on the
// session row. The student's "Join session" button then opens that URL.
//
// Auth: only an admin or the session's assigned tutor may create the room.
// Secrets (set with `supabase secrets set`): ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID,
// ZOOM_CLIENT_SECRET. SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// are injected automatically by the platform.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Identify the caller from their JWT.
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(401, { error: "Not authenticated." });

    const { session_id } = await req.json().catch(() => ({}));
    if (!session_id) return json(400, { error: "session_id is required." });

    const admin = createClient(SUPABASE_URL, SERVICE);

    const [{ data: profile }, { data: session }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", user.id).single(),
      admin.from("sessions").select("id, tutor_id, staff_id, scheduled_start, scheduled_end, mode, meeting_url, subjects(name)").eq("id", session_id).single(),
    ]);

    if (!session) return json(404, { error: "Session not found." });

    const ADMIN_ROLES = ["admin", "super_admin", "tutoring_admin", "admissions_admin"];
    const allowed = ADMIN_ROLES.includes(profile?.role ?? "")
      || session.tutor_id === user.id
      || session.staff_id === user.id;
    if (!allowed) return json(403, { error: "Only the session's tutor/counselor or an admin can create the room." });

    // Idempotent: if a room already exists, hand it back.
    if (session.meeting_url) return json(200, { join_url: session.meeting_url, reused: true });

    const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID");
    const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID");
    const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET");
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return json(500, { error: "Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET." });
    }

    // 1) Server-to-Server OAuth token.
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      { method: "POST", headers: { Authorization: "Basic " + btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`) } },
    );
    if (!tokenRes.ok) return json(502, { error: "Zoom authentication failed.", detail: await tokenRes.text() });
    const { access_token } = await tokenRes.json();

    // 2) Create a scheduled meeting on the Yakal Zoom account.
    const start = new Date(session.scheduled_start);
    const end = new Date(session.scheduled_end);
    const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000)) || 60;
    const subject = (session.subjects as { name?: string } | null)?.name ?? "Tutoring";

    const meetRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: `Yakal session — ${subject}`,
        type: 2, // scheduled
        start_time: start.toISOString(),
        duration,
        timezone: "America/New_York",
        settings: { join_before_host: true, waiting_room: true, mute_upon_entry: true, approval_type: 0 },
      }),
    });
    if (!meetRes.ok) return json(502, { error: "Could not create the Zoom meeting.", detail: await meetRes.text() });
    const meeting = await meetRes.json();

    // 3) Persist the managed join URL on the session.
    await admin.from("sessions").update({ meeting_url: meeting.join_url }).eq("id", session_id);

    return json(200, { join_url: meeting.join_url, meeting_id: meeting.id });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? String(e) });
  }
});
