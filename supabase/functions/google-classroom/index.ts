import { createClient } from "jsr:@supabase/supabase-js@2";

// Google Classroom integration.
//   action=auth-url  -> returns the Google OAuth consent URL for the caller.
//   action=callback  -> exchanges an OAuth code for a refresh token (caller = the
//                       student connecting their own account).
//   action=status    -> { connected } for a student the caller is allowed to see.
//   action=fetch     -> normalized coursework for a student the caller can see.
//
// Access control: reads of a student go through the CALLER's JWT client, so the
// existing can_see_student RLS on `students` decides authorization. Refresh
// tokens are only ever touched with the service-role key and never returned.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const API = "https://classroom.googleapis.com/v1";
const LAUNCH = "https://classroom.google.com/";

function decodeJwtEmail(idToken: string): string | null {
  try {
    const payload = JSON.parse(atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.email ?? null;
  } catch { return null; }
}

async function accessTokenFromRefresh(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

function dueToIso(due: any, time: any): string | null {
  if (!due?.year) return null;
  const h = time?.hours ?? 23;
  const m = time?.minutes ?? 59;
  // Classroom due dates/times are UTC.
  return new Date(Date.UTC(due.year, due.month - 1, due.day, h, m)).toISOString();
}

function workKind(workType: string): string {
  if (workType === "SHORT_ANSWER_QUESTION" || workType === "MULTIPLE_CHOICE_QUESTION") return "Question";
  if (workType === "ASSIGNMENT") return "Assignment";
  return "Quiz assignment";
}

function statusFor(sub: any, dueIso: string | null): string {
  const state = sub?.state;
  const late = !!sub?.late;
  const past = dueIso ? Date.now() > new Date(dueIso).getTime() : false;
  if (state === "TURNED_IN") return late ? "late" : "turned_in";
  if (state === "RETURNED") return sub?.assignedGrade != null ? "graded" : "turned_in";
  // NEW / CREATED / unspecified => not submitted
  if (past) return "missing";
  if (dueIso && new Date(dueIso).getTime() - Date.now() < 3 * 864e5) return "due_soon";
  return "assigned";
}

async function gget(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}

async function buildClassroom(accessToken: string) {
  const courses = await gget(`${API}/courses?studentId=me&courseStates=ACTIVE&pageSize=1`, accessToken);
  const course = courses?.courses?.[0];
  if (!course) return { connected: true, empty: true, launchUrl: LAUNCH };

  const [topicsRes, workRes, subsRes] = await Promise.all([
    gget(`${API}/courses/${course.id}/topics`, accessToken),
    gget(`${API}/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&pageSize=40`, accessToken),
    gget(`${API}/courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=100`, accessToken),
  ]);

  const topicNames: Record<string, string> = {};
  for (const t of topicsRes?.topic || []) topicNames[t.topicId] = t.name;
  const subByWork: Record<string, any> = {};
  for (const s of subsRes?.studentSubmissions || []) subByWork[s.courseWorkId] = s;

  const buckets: Record<string, any> = {};
  let dueSoon = 0, missing = 0;
  for (const w of workRes?.courseWork || []) {
    const dueIso = dueToIso(w.dueDate, w.dueTime);
    const status = statusFor(subByWork[w.id], dueIso);
    if (status === "due_soon") dueSoon++;
    if (status === "missing") missing++;
    const key = w.topicId || "_untopiced";
    (buckets[key] ||= { id: key, title: topicNames[w.topicId] || "General", items: [] }).items.push({
      id: w.id,
      title: w.title,
      kind: workKind(w.workType),
      dueAt: dueIso,
      status,
      points: w.maxPoints || 0,
      linkUrl: w.alternateLink || LAUNCH,
    });
  }
  const topics = Object.values(buckets);

  return {
    connected: true,
    platform: "Google Classroom",
    launchUrl: course.alternateLink || LAUNCH,
    courseName: course.name,
    courseCode: course.enrollmentCode || course.section || "",
    viewLabel: "Live Google Classroom",
    nextTopic: (topics[0] as any)?.title || "",
    dueSoon,
    missing,
    topics,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI");

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(401, { error: "Not authenticated." });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      // Backend not configured yet: report gracefully so the UI can show setup state.
      if (action === "status" || action === "fetch") return json(200, { connected: false, configured: false });
      return json(200, { configured: false, error: "Google Classroom is not configured yet." });
    }

    if (action === "auth-url") {
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        scope: SCOPES.join(" "),
        state: user.id,
      });
      return json(200, { url: `${AUTH_URL}?${params.toString()}` });
    }

    if (action === "callback") {
      const code = String(body?.code || "");
      if (!code) return json(400, { error: "Missing code." });
      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }),
      });
      if (!tokenRes.ok) return json(502, { error: "Token exchange failed.", detail: await tokenRes.text() });
      const tok = await tokenRes.json();
      const email = tok.id_token ? decodeJwtEmail(tok.id_token) : null;
      if (!tok.refresh_token) {
        // No refresh token (user previously consented). Keep any existing row.
        const { data: existing } = await admin.from("google_credentials").select("profile_id").eq("profile_id", user.id).maybeSingle();
        if (!existing) return json(400, { error: "No refresh token returned; disconnect the app in your Google account and reconnect." });
        return json(200, { connected: true, email });
      }
      const { error } = await admin.from("google_credentials").upsert({
        profile_id: user.id, refresh_token: tok.refresh_token, scope: tok.scope || SCOPES.join(" "),
        google_email: email, updated_at: new Date().toISOString(),
      }, { onConflict: "profile_id" });
      if (error) return json(500, { error: error.message });
      return json(200, { connected: true, email });
    }

    // status / fetch operate on a student the caller is allowed to see.
    const studentId = body?.studentId ? String(body.studentId) : null;
    let targetProfile = user.id;
    if (studentId) {
      // RLS on students enforces can_see_student for the caller.
      const { data: st, error } = await asUser.from("students").select("user_id").eq("id", studentId).maybeSingle();
      if (error || !st) return json(403, { error: "Not allowed to view this student." });
      if (!st.user_id) return json(200, { connected: false, reason: "no_login" });
      targetProfile = st.user_id;
    }

    const { data: cred } = await admin.from("google_credentials").select("refresh_token,google_email").eq("profile_id", targetProfile).maybeSingle();
    if (!cred) return json(200, { connected: false });
    if (action === "status") return json(200, { connected: true, email: cred.google_email });

    if (action === "fetch") {
      const accessToken = await accessTokenFromRefresh(CLIENT_ID, CLIENT_SECRET, cred.refresh_token);
      if (!accessToken) return json(200, { connected: false, reason: "reauth_needed" });
      return json(200, await buildClassroom(accessToken));
    }

    return json(400, { error: "Unknown action." });
  } catch (error) {
    return json(500, { error: (error as Error)?.message ?? String(error) });
  }
});
