# Yakal — End-to-End Integration Guide

This wires the three pieces into one running product:

```
  yakal.me (marketing)  →  Yakal Portal app  →  Supabase (Postgres + Auth + RLS)
   public front door         home + auth +         database, identity, and the
                             role portals          access rules that protect data
```

The portal app (`yakal-app.html`) is the bridge. It contains the branded
home page, the auth flow, and all four role portals — and it talks to the
database through a single **data layer** with two interchangeable drivers.

---

## 1. The integration flow

1. A visitor lands on the **home page** (branded like yakal.me) and clicks
   *Get started* or picks a portal.
2. They hit **auth** — sign up (choosing student / parent / tutor) or log in.
   - Sign-up creates a Supabase Auth user; a database trigger
     (`handle_new_user`) instantly creates their matching `profiles` row from
     the name + role they chose.
3. On success they're **routed by role** into their portal (student, parent,
   tutor, or admin).
4. Every screen reads and writes through the **data layer**. With Supabase
   configured, those are real queries — and **Row-Level Security** filters them
   server-side, so a parent only ever receives their child's rows, a tutor
   never receives contact details, and admin receives everything.

The same app runs in **demo mode** (no backend) using a seeded in-memory
driver that mirrors the same rules, so you can click through the entire flow
before standing up any infrastructure.

---

## 2. Files in the system

| File | Role |
|---|---|
| `yakal-app.html` | The end-to-end app: home + auth + all role portals + the data layer (demo driver **and** Supabase driver). |
| `yakal_schema.sql` | The database: tables, RLS policies, triggers, views. |
| `yakal_seed.sql` | The auth→profile trigger, reference data, and demo families. |
| `yakal_backend_design.md` | Why the schema is shaped the way it is. |
| `yakal-admin.html` | The earlier standalone admin/portal prototype (superseded by `yakal-app.html`, kept for reference). |

---

## 3. Run the demo (zero setup)

Open `yakal-app.html` in any browser. It runs in demo mode. Use the four
one-tap demo accounts on the auth screen (Almaz = admin, Tigist = parent,
Amen = student, Bethlehem = tutor), or sign up a new account. Everything
works: portals, messaging, the parent-monitoring view, the contact-redaction
guard, billing, and the admin "preview as any role" switcher.

> Demo data persists in the browser via `localStorage`; clear it to reset.

---

## 4. Go live on Supabase

**Step 1 — Create the project.** At supabase.com create a free project. From
*Project Settings → API* copy the **Project URL** and the **anon public key**.

**Step 2 — Run the schema.** In the Supabase SQL editor, paste and run
`yakal_schema.sql`. This creates the tables, RLS policies, triggers, and views.

**Step 3 — Run the seed.** Paste and run `yakal_seed.sql`.
- **Part A** (trigger + reference data) and **Part C** (demo families) always run.
- **Part B** inserts demo profiles *without* Auth — fine for a quick look, but
  for real accounts delete Part B and instead create the people through the
  app's sign-up screen (Step 5). Part C is keyed by email, so it links up
  either way.

**Step 4 — Plug in the keys.** Open `yakal-app.html` and set the two constants
at the top of the `<script>`:

```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

The app auto-detects these and switches from the demo driver to the live
Supabase driver — no other code changes.

**Step 5 — Create the real accounts.** Open the app and sign up your team and
families through the sign-up screen. Each sign-up creates an Auth user; the
`handle_new_user` trigger creates their `profiles` row from the name + role.
(For the demo login buttons to work in live mode, create those four emails with
a shared password and seed Part C.)

**Step 6 — Deploy.** It's a single static file. Drop it on Netlify, Vercel,
Cloudflare Pages, or any static host. Supabase handles the backend.

---

## 5. Connect the existing yakal.me site

You don't have to replace the marketing site — just point it at the portal.
On yakal.me, make the **"Log in" / "Portal" / "Get started"** buttons link to
wherever you host `yakal-app.html` (e.g. `app.yakal.me` or `yakal.me/portal`):

```html
<a href="https://app.yakal.me" class="btn">Portal login</a>
```

Deep links also work: `…/yakal-app.html` opens home, and you can wire
role-specific CTAs to open sign-up pre-set to a role (the home cards already do
this internally). If you'd rather fold the marketing copy into the app, the
home screen in `yakal-app.html` is already built to match the brand and can be
edited directly.

---

## 6. How the data layer swaps (for developers)

One interface, two implementations:

```
DB = USE_SUPABASE ? SupabaseDriver() : LocalDriver()
```

Every screen calls methods like `DB.parentChildren()`, `DB.conversations()`,
`DB.sendMessage()`. The two drivers expose the **same method names**:

- `LocalDriver` enforces visibility in JavaScript (mirrors the RLS rules) so
  the demo behaves like production.
- `SupabaseDriver` runs the real queries; RLS enforces visibility in the
  database. Its queries use the exact table and column names from
  `yakal_schema.sql`, so nothing has to be rewritten to go live.

Because the access rules live in the database, the client driver doesn't have
to be trusted — that's the whole point of doing authorization with RLS.

---

## 7. What was validated

- **Schema + seed** loaded into a real PostgreSQL 16 instance. The seeded
  "text me at 301-555-9999 … off the app" message was automatically flagged
  (`phone`, `external_platform`), redacted to "[contact removed]", and produced
  a `message_flags` row plus a tutor `risk_flags` entry — the anti-poaching
  guard working on the live backend.
- **App** exercised headless across all four roles: every portal view renders,
  parents see monitored conversations read-only, flagged messages are redacted
  in the UI, sending contact info is caught, and the admin "preview as / exit
  preview" flow works. All 34 checks passed.

---

## 8. Production hardening checklist

Before real families use it:

- Move to Supabase **Pro ($25/mo)** for daily backups and no auto-pausing.
- Add **Stripe** for `invoices`/`payouts` (the columns are ready); handle
  webhooks in a Supabase Edge Function.
- Disclose message monitoring in your **Terms of Service / privacy policy**
  (especially important because students are minors).
- Turn on **email confirmations** in Supabase Auth and set the site URL.
- Add a scheduled job to roll up `risk_flags` into the admin dashboard.
