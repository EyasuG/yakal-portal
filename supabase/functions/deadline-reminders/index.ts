// Yakal — daily application-deadline reminders.
//
// Finds college-list schools whose deadline is 7 / 3 / 1 days away and, for each
// affected student (and their parents), writes an in-app notification and — when
// an email provider is configured — sends an email.
//
// Triggered by a daily pg_cron job (see db/migrations/014_deadline_cron.sql).
// Protected by a shared secret so only the cron can invoke it.
//
// Secrets: REMINDER_SECRET (required), and to enable email: RESEND_API_KEY +
// REMINDER_FROM (e.g. "Yakal <reminders@your-domain>"). SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-reminder-secret, content-type" };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const dstr = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const secret = Deno.env.get("REMINDER_SECRET");
  if (secret && req.headers.get("x-reminder-secret") !== secret) return json(401, { error: "unauthorized" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const RESEND = Deno.env.get("RESEND_API_KEY");
  const FROM = Deno.env.get("REMINDER_FROM");

  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const windows = [7, 3, 1].map((n) => { const d = new Date(today); d.setDate(d.getDate() + n); return { n, date: dstr(d) }; });
    const byDate = Object.fromEntries(windows.map((w) => [w.date, w.n]));

    const { data: schools } = await admin
      .from("application_schools")
      .select("id, school_name, deadline, deadline_type, applications(org_id, student_id, students(user_id))")
      .in("deadline", windows.map((w) => w.date));

    let created = 0, emailed = 0;
    for (const sc of schools || []) {
      const app = sc.applications as any;
      if (!app) continue;
      const n = byDate[sc.deadline as string];
      const dayWord = n === 1 ? "1 day" : `${n} days`;
      const title = `${sc.school_name} — ${sc.deadline_type ? sc.deadline_type + " " : ""}application due in ${dayWord}`;
      const body = `Deadline ${sc.deadline}. Open your Tracker to check the requirements.`;

      // Recipients: the student (if they have a login) + their parents.
      const recipients = new Set<string>();
      if (app.students?.user_id) recipients.add(app.students.user_id);
      const { data: guards } = await admin.from("guardianships").select("parent_id").eq("student_id", app.student_id);
      for (const g of guards || []) recipients.add(g.parent_id);

      for (const rid of recipients) {
        // Dedupe: skip if this exact reminder already exists for this recipient.
        const { count } = await admin.from("notifications").select("id", { count: "exact", head: true })
          .eq("recipient_id", rid).eq("entity_id", sc.id).eq("title", title);
        if (count && count > 0) continue;

        await admin.from("notifications").insert({
          org_id: app.org_id, recipient_id: rid, kind: "deadline", title, body,
          entity_type: "application_schools", entity_id: sc.id
        });
        created++;

        if (RESEND && FROM) {
          const { data: prof } = await admin.from("profiles").select("email").eq("id", rid).single();
          if (prof?.email) {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: FROM, to: prof.email, subject: title, html: `<p>${title}</p><p>${body}</p><p>— Yakal Education</p>` })
            });
            if (res.ok) emailed++;
          }
        }
      }
    }
    return json(200, { ok: true, schools: (schools || []).length, notifications_created: created, emails_sent: emailed, email_enabled: !!(RESEND && FROM) });
  } catch (e) {
    return json(500, { error: (e as Error)?.message ?? String(e) });
  }
});
