import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  super_admin: "Admin",
  tutoring_admin: "Admin",
  admissions_admin: "Admin",
  tutor: "Tutor",
  counselor: "Counselor",
  parent: "Parent",
  student: "Student",
};

const VIEW_HINT: Record<string, string> = {
  overview: "admin or counselor home dashboard",
  students: "students directory",
  tutors: "tutors directory",
  tdiag: "diagnostic workflow",
  clist: "college list workspace",
  sadm: "application tracker",
  msg: "messages hub",
  trust: "trust and safety dashboard",
  shome: "student home",
  ssessions: "student sessions",
  college: "college roadmap",
  phome: "parent home",
  pkids: "children overview",
  pbill: "billing",
  thome: "tutor home",
  tstudents: "tutor students roster",
  tearn: "tutor earnings",
  child: "child detail"
};

function asInputText(role: "assistant" | "system" | "user", text: string) {
  return { role, content: [{ type: "input_text", text }] };
}

function recentHistory(history: Array<{ role?: string; content?: string }> = []) {
  return history
    .filter((item) => item && typeof item.content === "string" && item.content.trim())
    .slice(-8)
    .map((item) => asInputText(item.role === "assistant" ? "assistant" : "user", item.content!.slice(0, 4000)));
}

function extractReply(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    const parts = item?.content || [];
    const text = parts
      .map((part: any) => {
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.output_text === "string") return part.output_text;
        return "";
      })
      .join("")
      .trim();
    if (text) return text;
  }

  return "";
}

function buildSystemPrompt(role: string, name: string, activeView: string) {
  const today = "Wednesday, July 29, 2026";
  const roleName = ROLE_LABEL[role] || "Portal user";
  const page = VIEW_HINT[activeView] || activeView || "portal";

  return `
You are Yakal Assistant inside the Yakal Education Services portal.

Today is ${today}.
Current user: ${name}.
Current role: ${roleName}.
Current page: ${page}.

Yakal combines two services:
- Tutoring and enrichment: K-12 academics, test prep, STEM, group sessions, camps, and Math Labs.
- College admissions consulting: college lists, essays, deadlines, academics, recommendations, and tracker workflows.

Portal navigation by role:
- Student: Home, Sessions, Diagnostic, College, My List, My App, Messages.
- Parent: Home, Children, College, Tracker, Messages, Billing.
- Tutor: Today, Students, Diagnostic, Earnings, Messages.
- Counselor: Home, Students, College Lists, Tracker, College, Messages.
- Admin: Home, Students, Tutors, Diagnostic, College Lists, Tracker, Messages, Trust.

Behavior rules:
- Be concise, warm, and practical.
- Prefer the exact portal page or workflow the person should use next.
- You may answer questions about tutoring, admissions planning, essays, SAT/ACT strategy, deadlines, recommendations, and portal navigation.
- Do not invent live student data, grades, deadlines, payments, or message contents that were not provided in the prompt.
- If a question needs staff action or verified records, say what to check in the portal and who should handle it.
- Never encourage off-platform contact or direct payment between families and tutors.
- Do not provide legal, medical, or financial advice beyond general educational guidance.
- Keep answers under 140 words unless the user asks for more depth.
`.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-terra";
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!OPENAI_API_KEY) return json(500, { error: "OPENAI_API_KEY is not configured for portal-assistant." });

    const asUser = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json(401, { error: "Not authenticated." });

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: profile } = await admin.from("profiles").select("id,role,full_name").eq("id", user.id).single();
    if (!profile) return json(404, { error: "Profile not found." });

    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || "").trim();
    const activeView = typeof body?.activeView === "string" ? body.activeView : "";
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) return json(400, { error: "message is required." });

    const input = [
      asInputText("system", buildSystemPrompt(profile.role, profile.full_name, activeView)),
      ...recentHistory(history),
      asInputText("user", message),
    ];

    const openAiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        store: false,
        input,
        reasoning: { effort: "low" },
        text: { verbosity: "medium" },
      }),
    });

    if (!openAiRes.ok) {
      return json(502, { error: "OpenAI request failed.", detail: await openAiRes.text() });
    }

    const payload = await openAiRes.json();
    const reply = extractReply(payload);
    if (!reply) return json(502, { error: "Assistant returned an empty response." });

    return json(200, { reply, model: OPENAI_MODEL });
  } catch (error) {
    return json(500, { error: (error as Error)?.message ?? String(error) });
  }
});
