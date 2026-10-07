# Porter Training Analyst Dashboard

Client-facing dashboard for GHL Voice-AI sales-training roleplay scorecards. Reads a
**Supabase** mirror of GHL data (never calls GHL from the browser), gated by **Supabase
Auth + RLS**. Built to be replicated per GHL subaccount by swapping env + Supabase project.

## Architecture
```
GHL subaccount ──(server-side)──> ../ghl-call-export/sync-contacts.js ──> Supabase `contacts`
                                                                              │ (anon key + Auth + RLS)
                                                        this dashboard  <─────┘
```
- The GHL token + Supabase **service** key live only in `../ghl-call-export/.env` (server-side).
- The browser bundle carries only `VITE_SUPABASE_URL` + the **publishable/anon** key — safe,
  because all access is gated by RLS and requires a logged-in Supabase user.
- Scorecards are parsed from the HTML training reports in GHL contact custom fields by
  `src/lib/porterReport.ts` (deterministic, label-anchored).

## Setup
1. `cp .env.example .env` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_CLIENT_NAME`, `VITE_CLIENT_SHORT`.
2. `npm install`
3. In Supabase SQL Editor run (once): `../ghl-call-export/supabase/schema.sql` then
   `../ghl-call-export/supabase/contacts.sql`.
4. Create a login user: Supabase → Authentication → Users → Add user.
5. Populate data: from `../ghl-call-export`, `node sync-contacts.js`.
6. `npm run dev`

## Per-client config
All client-specific values live in `.env` + `src/config.ts` (the GHL custom-field ID map
and grading bands). A new client = new Supabase project + new `.env` + (if their field IDs
differ) a new `fieldMap` in `config.ts`.

## Scripts
- `npm run dev` / `build` / `preview`
- `npm run lint`, `npm run test`, `npx tsc --noEmit`

The live GHL smoke test (`src/test/liveParser.test.ts`) only runs when `GHL_PIT` +
`GHL_LOCATION_ID` env vars are set; otherwise it skips. Never hardcode tokens.

## Embedding in GHL Vibe
Append `?embed=true` to hide chrome (view-only). Login is still required inside the iframe.

## Lockfile policy
This repository does not track `package-lock.json`.
