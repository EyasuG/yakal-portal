# Yakal Education Services — Backend & Database Design

This turns the static portal prototype into a real web app. The core idea: the
three rules you care about — **parents monitor, admin sees everything, tutors
can't run a side business** — are enforced *inside the database* with Row-Level
Security (RLS), not in front-end code. A leaked API key or a buggy client still
cannot cross a boundary, because the database itself refuses.

Companion file: `yakal_schema.sql` (the full, tested Postgres schema).

---

## 1. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Database | **PostgreSQL** | RLS is the mechanism that makes your access rules unbreakable. |
| Backend platform | **Supabase** | Postgres + Auth + RLS + realtime + file storage + auto-generated APIs, all on one free project. The schema is written for it. |
| Front-end | Your existing portal HTML/JS (or a React port) | Talks to Supabase via its client SDK; RLS means the client can query directly and still be safe. |
| Payments | Stripe (later) | `invoices.processor_ref` / `payouts` already have a slot for it. |

You do **not** need a separate backend server to start. Supabase exposes a
secure REST/realtime API over the database, and RLS does the authorization. Add
serverless Edge Functions later only for things that must run server-side
(Stripe webhooks, nightly risk rollups, sending email).

---

## 2. Hosting — free and cheap options (verified June 2026)

**Supabase — recommended.** Free tier is $0: 500 MB database, **50,000 monthly
active users** for auth, 1 GB file storage, unlimited API requests, and it
bundles Auth + RLS + realtime + storage. Paid "Pro" is **$25/mo** (8 GB DB,
daily backups, no pausing). One catch on free: a project **pauses after ~7 days
of inactivity** and there are **no backups** — fine for building, not for live
parents. Two cheap fixes when you go live: upgrade to Pro ($25), or stay free
and keep it warm with a tiny scheduled ping plus a free GitHub-Actions backup.

**Neon — cheapest at scale / alternative.** Free tier is $0 with serverless
Postgres, **scale-to-zero** (you pay nothing while idle), branching, and
~100 compute-hours + 0.5 GB storage per project. It's *just* the database, so
you'd add your own auth (Neon Auth, Clerk, or Auth.js) and write your API
authorization — more wiring than Supabase. Great if cost-at-scale or DB
branching matters more than an all-in-one platform. The same `yakal_schema.sql`
runs on it (swap the one `app.uid()` helper to read your auth's user id).

**Always-on cheap Postgres.** Railway or Render run a managed Postgres instance
for a few dollars a month with no auto-pause, if the free-tier pause is the
dealbreaker and you'd rather not pay Supabase Pro yet.

> Bottom line: **build on Supabase free, flip to Supabase Pro ($25/mo) the week
> you onboard real families.** Reassess Neon only if database cost becomes a
> material line item.

---

## 3. Data model at a glance

32 tables, grouped:

- **Core** — `organizations`, `profiles`. Every row carries `org_id`, so a
  second location / franchise is a data change, not a rewrite.
- **People** — `students`, `guardianships` (parent↔student many-to-many),
  `tutor_profiles`, `subjects`, `tutor_subjects`, `tutoring_assignments`.
- **Scheduling** — `sessions`, `session_notes`.
- **Academics** — `progress_snapshots` (drives the progress bars), `homework`.
- **Admissions** — `service_packages` (Essentials/Premier/Elite),
  `applications`, `application_schools`, `application_essays`,
  `application_tasks`.
- **Messaging** — `conversations`, `conversation_participants`, `messages`,
  `message_flags`.
- **Billing** — `invoices`, `invoice_items`, `payouts`, `payout_items`.
- **Governance** — `pii_access_log`, `audit_log`, `risk_flags`,
  `notifications`, `attachments`, `app_settings`, `feature_flags`.

Maps cleanly onto the prototype: Almaz = `admin`, Bethlehem = `tutor`,
Tigist = `parent`, Amen = a `student` who is also an admissions `application`.

---

## 4. Access-control model (who can see what)

`tutoring_assignments` is the single source of truth for tutor visibility:
end an assignment and that tutor instantly loses access to the student. Parent
visibility flows through `guardianships`. Both are checked by small
`SECURITY DEFINER` helper functions reused across every policy.

| Data | Admin | Parent (own child) | Student (self) | Assigned tutor |
|---|---|---|---|---|
| Student profile & progress | ✅ all | ✅ | ✅ | ✅ academic only |
| **Messages** | ✅ all | ✅ **monitors** | ✅ own threads | ✅ own threads |
| Parent/student **contact details** | ✅ | ✅ own | ✅ own | ❌ **masked** |
| Invoices (what parent pays) | ✅ | ✅ own | ❌ | ❌ |
| Payouts (what tutor earns) | ✅ | ❌ | ❌ | ✅ own only |
| Risk flags / audit log | ✅ | ❌ | ❌ | ❌ |

The parent-monitoring rule is the interesting one: a parent can read a
conversation **even when they are not a participant**, as long as the thread is
*about* their child (`conversations.student_id`). That's how oversight works
without the parent being injected into every chat.

---

## 5. Keeping tutors from building a private business

This is the platform-integrity layer (the same anti-circumvention approach
Wyzant, Care.com, and Rover use). It's woven through the schema as four
reinforcing mechanisms, so there's no single point a tutor can route around:

1. **Contact details are masked.** Tutors have no policy granting them parent or
   student PII. They read students only through the `tutor_student_directory`
   view, which exposes `"Amen W."` and nothing else — no email, phone, or
   address columns exist in that view. *Verified: a tutor querying a parent
   profile gets 0 rows.*

2. **All communication stays on-platform and is scanned.** Every message passes
   through a `BEFORE INSERT` trigger that detects emails, phone numbers, payment
   handles (Venmo/CashApp/Zelle/PayPal), and "text me / off the app" language.
   On a hit it flags the message, **auto-redacts the contact info** for
   non-admins, records each detection in `message_flags`, and raises a
   `risk_flags` entry against the tutor. Messages have **no UPDATE/DELETE
   policy**, so a tutor cannot scrub the evidence. *Verified: "text me at
   301-555-9999 or venmo @beth… off the app" → flagged, redacted, risk severity 4,
   and the tutor's own UPDATE affected 0 rows.*

3. **Money can only flow parent → Yakal → tutor.** Parents pay `invoices`;
   Yakal pays `payouts`. There is deliberately **no table** that records a
   parent paying a tutor directly, and tutors can't see invoices — so they
   can't even discover the margin, let alone undercut it.

4. **Everything is logged for admin.** `pii_access_log` captures any contact
   reveal; `risk_flags` + the `admin_tutor_risk` view roll up per-tutor signals
   so a pattern (repeated off-platform attempts, etc.) surfaces on the admin
   dashboard.

**Important framing.** This is reasonable platform-integrity, but it does
involve scanning messages — some of them involving minors. Treat it honestly:
disclose monitoring in your Terms of Service and privacy policy, and note that
because the people being protected are children, the parent-monitoring feature
is itself the consent path. The redaction default lives in `app_settings`
(`redact_contact_info`) so you can tune it. Don't market it to tutors as
surveillance; do document it.

---

## 6. Scalability & extensibility

Built in from day one so new features don't mean migrations-from-hell:

- **Multitenancy** — `org_id` everywhere. Add a second location or white-label
  partner as data.
- **Stable keys & history** — UUID primary keys, `created_at`/`updated_at`,
  soft-delete (`deleted_at`) on core tables, append-only `audit_log`.
- **Extension points** — a `metadata jsonb` column on the busy tables, a
  polymorphic `attachments` table (one table serves essays, sessions, messages…),
  and `feature_flags` so you can ship features dark and enable per-org.
- **Hot paths indexed** — every frequent lookup is indexed on
  `(owner/tenant, time)`, so queries stay selective as rows grow.
- **Scale levers (when needed)** — partition `messages` and `audit_log` by month;
  use the connection **pooler** endpoint for serverless routes; move heavy
  aggregations (revenue, risk rollups) to materialized views or a read replica.

Future features map onto existing structure without schema churn: group classes
(`sessions` already has student + tutor; add a join table), tutor availability
calendar (extend `tutor_profiles.metadata` or add `availability`), reviews
(new table keyed to `sessions`), referrals, multi-currency, etc.

---

## 7. Build path

1. **Stand up Supabase** (free). Run `yakal_schema.sql` in the SQL editor.
   Wire Supabase Auth; on signup, create a `profiles` row with the chosen role
   (this is exactly your prototype's sign-up flow, now persisting).
2. **Connect the portals.** Point the existing student/parent/tutor/admin views
   at Supabase queries. Because RLS filters server-side, the same query "give me
   my messages" returns the right rows for each role automatically.
3. **Realtime messaging.** Subscribe to `messages` for live chat; the scanner
   and parent-monitoring already work underneath.
4. **Go live → Supabase Pro ($25/mo)** for backups and no pausing. Add Stripe
   for `invoices`/`payouts` via an Edge Function webhook.
5. **Admin oversight dashboard.** Surface `admin_tutor_risk` and open
   `message_flags`/`risk_flags`.

---

## 8. Validation performed

The schema was loaded into a real PostgreSQL 16 instance and exercised under RLS
as each role. All checks passed: clean load (32 tables, 42 policies, 12 helper
functions, 2 views, 6 triggers); scanner flag + redact + risk-raise; parent
monitoring of a non-participant conversation; tutor blocked from PII and billing
while seeing their own payout; unrelated tutor sees nothing; admin sees all;
student sees self but not billing; and tutors cannot edit flagged messages.

One real bug was caught and fixed in the process: the `conversations` and
`conversation_participants` policies originally referenced each other and caused
infinite RLS recursion; both checks were moved into `SECURITY DEFINER` helper
functions that bypass RLS, which is the standard fix.
