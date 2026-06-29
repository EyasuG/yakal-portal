# Yakal Portal Frontend

This directory contains a React + Tailwind frontend for the Yakal portal.

## Run

Install dependencies from the repo root:

```bash
npm install
```

Then start the development server:

```bash
npm run dev
```

Open `http://localhost:4173` in your browser.

## Build

```bash
npm run build
```

The generated site is written to `app/dist`.

## Notes

- `app/index.html` is the Vite entry page.
- `app/src/main.jsx` bootstraps React.
- `app/src/App.jsx` holds the portal UI.
- `app/src/db.js` contains both demo and Supabase driver logic.
- `app/src/styles.css` includes Tailwind directives plus small UI helpers.
