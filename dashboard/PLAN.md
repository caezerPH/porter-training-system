# Porter Dashboard — Supabase rewire + multi-tenant plan

Goal: take the cloned Vibe dashboard (currently fetches GHL contacts directly from the
browser) and make it (1) secure, (2) CORS-proof, (3) replicable per GHL subaccount by
swapping env + spinning a new Supabase project. Preserve the full aggregate Vibe UI.

Target client: **Porter** — GHL location `0JT2eeg5LKJwd7ygqkW0`.

## Why the current app doesn't work in prod
- GHL `/contacts/search` sends no CORS headers → browser call blocked → app silently
  falls back to sample/empty data.
- The GHL PIT would be exposed in the browser bundle.
- Config (token, location, tag, field IDs) is hardcoded → not replicable.

## Ground truth (Porter data, reverse-engineered — customFields def endpoint is 401)
Each GHL contact = one trainee/roleplay session, carrying the authoritative scorecard in
HTML custom fields:
| Field ID | Meaning |
|---|---|
| `tyg7C8QbReMAkoLycw6Z` | Manager report (HTML) — full scorecard + plan/figure/compliance detail |
| `ZJ865A40NkyQXZnvcuiW` | Trainee report (HTML) — "Hi <name>…" coaching, same scorecard |
| `lcYRfXlgXXx6WmiXmE6k` | Name (trainee/coach — inconsistent across contacts) |
| `KY2tDDyYm53UN4xMEdR1` | Email |
| `XINLL55qfHdxs1uHGdLI` | Scenario (e.g. "Plan Jumper") |
| `iSHAIn2yeGYSXESv1Xx0` | Difficulty |
| `FkmbuUc2KDI20ERgdK8j` | Version |
| `8HHEnBnnXONvhi9ij5IK` | Persona / lead sheet (roleplay input) |

Grading bands (from report): Pass ≥85, Needs Improvement 75–84, Retraining <75.

Data caveats for Porter: no dedicated manager-name field (ManagerPerformanceView thin),
no NPN field (leaderboard NPN empty), reports don't structure per-question Q&A
(QuestionStrugglesView stays dead). Contacts here have no tags → tag filter must be
optional/config.

## Phase 0 — Security (DONE FIRST)
- [ ] Remove hardcoded GHL PIT from: `src/test/liveParser.test.ts`, `probe.mjs`,
      `preflight.mjs`, `parsetest.mjs`, `origintest.mjs`, `checkcors.mjs`.
- [ ] Genericize leaked location-id placeholder in `ApiSettingsModal.tsx`.
- [ ] `.env*` in `.gitignore`.
- [ ] **ACTION FOR USER: rotate PIT `pit-afd64250-…` in GHL** (it lived in committed files).

## Phase 1 — Server-side ingestion (in ../ingestion, zero-dep Node)
- [ ] `supabase/contacts.sql` — `public.contacts` table (raw mirror: name/email/phone/
      tags jsonb / custom_fields jsonb / timestamps), RLS authenticated-read.
- [ ] `sync-contacts.js` — paginate GHL `/contacts/search` (Version 2021-07-28), upsert
      into Supabase `contacts` via REST. Config from its own `.env` (never shipped to browser).
      Flags: `--dry`, `--limit N`.
- [ ] Run it to populate Porter contacts.

## Phase 2 — Dashboard rewire
- [ ] Add `@supabase/supabase-js`; `src/lib/supabase.ts` from `VITE_SUPABASE_URL` /
      `VITE_SUPABASE_ANON_KEY`.
- [ ] `src/config.ts` — per-client: client name/branding + field-ID map + optional tag filter.
- [ ] Supabase Auth: login screen + auth gate wrapping the app in `App.tsx`; sign-out.
- [ ] Rewrite `useAgentTrainingData` to read Supabase `contacts`, map rows → the shape the
      existing `parseGhlContactsToAnalytics` consumes (reuse the tested parser unchanged).
- [ ] Retire the in-browser GHL-token flow (ApiSettingsModal → remove or admin-only).

## Phase 3 — Enrichment
- [x] **Recordings + transcript in AgentDetailModal** — `CallRecordings.tsx` queries the
      `calls` table by `contact_id`, plays WAVs via short-lived Supabase signed URLs
      (private bucket, authenticated RLS), shows summary + transcript. Verified end-to-end
      as the real user: login → read calls/contacts under RLS → createSignedUrl → 4.1 MB
      WAV served. Both trainees have recordings (ryan 7, chauncey 1).
- [x] **Polling** via Windows Task Scheduler. `ingestion/poll.ps1` runs sync-contacts.js
      + backfill.js (idempotent), logs to `poll.log`. `register-poll.ps1` registers task
      **"EZAI-Porter-Poll"** (every 15 min). Verified: scheduled run LastResult=0, 51 rows,
      0 errors. Manage: `Unregister-ScheduledTask -TaskName "EZAI-Porter-Poll" -Confirm:$false`
      to remove; Task Scheduler → "Run whether user is logged on or not" for unattended.

## STATUS (2026-10-07)
- **Phase 0 DONE** — token scrubbed from all 6 files (5 obsolete probes deleted,
  liveParser.test.ts now env-guarded), placeholder genericized, `.env*` gitignored.
  ⚠ USER: rotate `pit-afd64250-…` in GHL.
- **Phase 1 code DONE** — `supabase/contacts.sql` + `sync-contacts.js` written; dry-run
  verified (7 contacts fetched, 2 carry training reports). ⚠ Blocked on USER running
  `contacts.sql` in Supabase SQL Editor before the write-sync can run.
- **Phase 2 DONE** — supabase-js wired, `config.ts` field map, `lib/supabase.ts`,
  `lib/stripHtml.ts`, `lib/porterReport.ts` (deterministic, label-anchored parser —
  reads real Total/100, 10 categories, verdict, auto-fail), `lib/buildAnalytics.ts`,
  rewired `useAgentTrainingData` (reads Supabase), `AuthGate` login + gate in App.tsx,
  Index rebranded + Sign-out + GHL-token flow retired. Verified: `tsc --noEmit` clean,
  `npm run build` OK, 6 tests pass (incl. 5 new parser tests).
- **PENDING USER ACTIONS before go-live:**
  1. Run `../ingestion/supabase/contacts.sql` in Supabase SQL Editor.
  2. Create a dashboard login user (Supabase → Authentication → Users → Add user),
     OR ask Claude to create one via the Admin API.
  3. Rotate the leaked GHL PIT.
- **THEN Claude:** run `node sync-contacts.js` to populate; optionally `npm run dev` to verify login + data end-to-end.

## Session 2 additions (2026-10-07)
- **Attempts = calls**: dashboard now builds attempts from the `calls` table (per-call
  score/verdict/scorecard/recording/transcript), so Attempts count, averages, and the
  progression chart reflect real call history. `buildAnalytics(contacts, calls)`; hook
  fetches both. Verified: ryan 7 attempts/avg64/best87, chauncey 1/76.
- **Removed**: Struggle Points stat, Question-by-Question Breakdown, NPN (leaderboard col +
  modal line), all DBG branding + the standalone DBG registration/voice-call pages, their
  routes, and the floating AI-widget trigger (files deleted).
- **Recordings**: now shown per-attempt (`CallMedia`) inside the selected attempt, replacing
  the standalone list.
- **RBAC** (admin full / user = own agent only), DB-enforced:
  - `supabase/rbac.sql` — role-aware RLS using `app_metadata.role` + `contact_id` from JWT.
  - Edge Function `supabase/functions/admin-create-user` — admin-gated account creation
    (service key server-side). 
  - Dashboard: `AuthGate` exposes role via `useAuth`; admin-only "Users" (ManageUsersModal)
    + "Embed" buttons; users restricted by RLS to their assigned agent.
  - carlo@ezaiagency.com set to role=admin (verified JWT claim).
- **Appearance/Accessibility**: `ThemeProvider` (dark/light + font scale, persisted) +
  floating `AccessibilityMenu` (both roles, all screens). `darkMode:"class"` already on;
  `dark:` variants added across components.

### Session 2b — UI redesign + announcements
- **Sidebar shell** (role-aware): admin = Overview / Agents / Announcements + Manage Users +
  Embed; user = My Training. Slim top bar, mobile drawer, dark-mode + accessibility retained.
- **Role-aware views**: users get a dedicated `MyTraining` page (announcements feed, Start
  Training Call shortcut, their performance + full-report modal) instead of the admin tabs.
- **Announcements** (admins post news → users read): `announcements` table + admin-write RLS
  (`supabase/announcements.sql`), `useAnnouncements`, `AnnouncementsAdmin` (post/hide/delete),
  `AnnouncementsFeed` (user). 
- **Training AI shortcut**: config `VITE_TRAINING_AI_URL` → "Start Training Call" shown to
  users (sidebar + My Training). Hidden until the URL is set. **NEED the link from user.**
- Hid the empty Manager Analytics tab. Design guided by ui-ux-pro-max (data-dense, blue/slate).
- Verified: tsc clean, build OK, 6 tests pass, dev server serves all new modules.

### Session 2c — white-label branding (admin)
- **app_settings** table (public read, admin write) + public **branding** storage bucket
  (`supabase/app-settings.sql`); `SettingsProvider` loads + applies favicon, brand palette,
  default theme; exposes resolved branding (config fallbacks).
- **Brand palette**: 6 presets (blue/emerald/violet/amber/rose/slate) via CSS vars +
  `brand-*` Tailwind color; all `blue-*` usages swapped to `brand-*` so the whole app recolors.
- **Admin "Branding" section**: client name/tagline, logo, favicon, brand palette (live
  preview), default theme, login headline/subtext, login background image (upload or URL),
  and the training-AI link — all saved to app_settings, live for everyone.
- Login portal now reflects branding (bg image, logo, headline). Training link moved to
  settings (env `VITE_TRAINING_AI_URL` is now only a fallback). Users still get the
  per-person theme/text-size menu.
- Verified: tsc clean, build OK, 6 tests pass, brand palette compiled into CSS.

### PENDING USER ACTIONS (session 2)
1. Run these in Supabase SQL Editor (in order): `../ingestion/supabase/rbac.sql`,
   `../ingestion/supabase/announcements.sql`, `../ingestion/supabase/app-settings.sql`.
2. **After step 1, sign out & back in** (so your token carries role=admin, else you'll see nothing).
3. Deploy the Edge Function for in-dashboard user creation:
   `supabase functions deploy admin-create-user --project-ref gevahoscknbysfllrnty`
   (needs `supabase login` + `supabase link` once; SUPABASE_URL/keys are auto-injected).
4. Training AI link: set it in the **Branding** section once logged in as admin (no env edit needed).

## Replication checklist (new client)
1. New Supabase project → run `supabase/schema.sql` + `supabase/contacts.sql`.
2. New `ingestion/.env` (that client's GHL PIT + location + Supabase service key); run sync.
3. New dashboard `.env` (that client's `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) + `config.ts` field map; build + deploy.
