# Yakal Portal

The end-to-end web app for **Yakal Education Services** — tutoring and college
admissions consulting in Silver Spring, MD. A branded marketing home page,
role-based authentication, and four portals (student, parent, tutor, admin)
backed by a Postgres database whose access rules are enforced with
Row-Level Security.

> _inspiring hope, shaping futures_

---

## What's here

```
yakal-portal/
├── app/
│   └── index.html          # the whole app: home + auth + portals + data layer
├── db/
│   ├── schema.sql          # Postgres schema: tables, RLS policies, triggers, views
│   └── seed.sql            # auth→profile trigger, reference data, demo families
├── docs/
│   ├── backend-design.md   # why the schema is shaped this way
│   └── integration-guide.md# step-by-step: demo → live on Supabase
├── legacy/
│   └── admin-prototype.html# earlier standalone prototype (reference only)
├── test/
│   └── e2e.test.mjs        # headless run-through of every role + the guards
└── .github/workflows/
    ├── ci.yml              # runs tests on every push / PR
    └── deploy.yml          # tests, then deploys app/ to GitHub Pages
```

## Quick start (demo, zero backend)

Open `app/index.html` in a browser, or serve it:

```bash
npx serve app          # or: python3 -m http.server -d app 8080
```

It runs in **demo mode** with seeded data. Use the one-tap demo accounts on the
sign-in screen:

| Account | Role |
|---|---|
| Almaz T. | Administrator |
| Tigist Worku | Parent |
| Amen Worku | Student |
| Bethlehem A. | Tutor |

## Go live on Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Run `db/schema.sql`, then `db/seed.sql` in the SQL editor.
3. Put your Project URL + anon key into the two constants at the top of
   `app/index.html`.
4. Deploy `app/` to any static host (Netlify, Vercel, Cloudflare Pages).

Full walkthrough: [`docs/integration-guide.md`](docs/integration-guide.md).

## How access control works

The three product rules are enforced in the **database**, not the client, so a
leaked key or buggy front-end still can't cross a boundary:

- **Parents** can monitor their child's progress *and* messages — even
  conversations they aren't a participant in.
- **Admin** sees everything in the organization.
- **Tutors** can't run a private side-business: contact details are masked,
  messages are scanned and contact info auto-redacted + flagged, money only
  flows parent → Yakal → tutor, and everything is logged for review.

See [`docs/backend-design.md`](docs/backend-design.md) for the model.

## Architecture

One data-layer interface, two drivers:

- **Demo driver** — seeded, in-browser, mirrors the access rules. Runs with no
  backend.
- **Supabase driver** — real `supabase-js` queries; Row-Level Security enforces
  visibility. Activates automatically when project keys are present.

Same method names, so going live is configuration, not a rewrite.

## Local development

```bash
git clone <your-repo-url> yakal-portal
cd yakal-portal
npm install        # installs the test toolchain (jsdom)
npm start          # serves app/ at http://localhost:3000
npm test           # runs the headless end-to-end suite
```

The app is a single static file with no build step — edit `app/index.html`
and refresh. The `db/` SQL and `docs/` markdown are the backend and reference.

## Deploy (GitHub Pages, automatic)

This repo ships with `.github/workflows/deploy.yml`. On every push to `main` it
runs the tests and, if they pass, publishes `app/` to GitHub Pages. The
deployed site runs in **demo mode** (no keys committed), so it's a safe,
shareable, testable build.

**One-time setup:** on GitHub, go to **Settings → Pages → Build and deployment
→ Source → GitHub Actions**. After the first successful run your app is live at:

```
https://<your-username>.github.io/<repo-name>/
```

To make the deployed site talk to a real backend, add your Supabase URL + anon
key to the two constants at the top of `app/index.html` (the anon key is safe
to expose publicly — Row-Level Security protects the data; never commit the
service-role key).

## Tests

```bash
npm install
npm test
```

A headless [jsdom](https://github.com/jsdom/jsdom) harness boots the app and
walks every role's portal, the parent-monitoring view, the contact-redaction
guard, and the admin preview flow.

## Tech

Vanilla HTML/CSS/JS (no build step) · PostgreSQL · Supabase (Auth + RLS +
realtime + storage) · DM Sans.

## License

Proprietary — © Yakal Education Services. See [LICENSE](LICENSE).
