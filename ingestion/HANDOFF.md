# EZAI — GHL Voice AI call-export → dashboard (handoff)

Start a fresh Claude Code conversation in this folder (`d:\MC-Family\Downloads\ingestion`) to continue. This is the EZAI project, kept separate from the Boca Skin landing page.

## Goal
Export GHL Voice AI call recordings + transcripts into storage and a Google Sheet, and surface them in a client dashboard (Porter, built with Vibe GHL AI) showing each call's recording, transcript, and the agent scorecard. Make is the integration layer.

## Decisions made
- Data layer: **Supabase** (Postgres table + Storage bucket for WAV) with a **Google Sheet mirror**. Make webhook → GHL API → Supabase + Sheet. Supabase Auth for client login.
- Volume: 50–300 Voice AI calls/day; backfill the (small) history too.
- Dashboard: custom web app reading Supabase; client wants audio + transcript + scorecard.

## Verified facts (see FINDINGS.md)
- GHL Private Integration Token in `.env` works with header `Version: v3`. Scopes granted cover conversations, voice-ai, contacts, locations (read-only).
- `GET /voice-ai/dashboard/call-logs?locationId=..&page=&pageSize=` returns `{callLogs[], total, page, pageSize}`. No `limit` param. Fields: id, contactId, agentId, fromNumber, createdAt, duration, summary, transcript, executedCallActions, messageId. **No** recordingUrl/sentiment/extractedData.
- Recording: `GET /conversations/messages/{messageId}/locations/{locationId}/recording` → 200 audio/x-wav (proven, 4MB for 257s call). Transcription endpoint 404s for Voice AI (use the call-log transcript instead).
- **Key insight:** the agent (Arcee / "Porter Insurance Training Agent") is a SALES-TRAINING ROLEPLAY bot. Human reps call it. The scorecard (10 criteria ×/10, total /100, verdict band, compliance auto-fail, did-well / missed / focus-next-time) is SPOKEN by the agent and lives in the `transcript` text. So the dashboard scorecard must be PARSED from the transcript, deterministically. 51 calls existed at kickoff.

## Progress

### DONE — Supabase backfill (2026-10-07)
- Project exists: **EZAI-Carlo's Project**, `https://gevahoscknbysfllrnty.supabase.co` (region Sydney/ap-southeast-2, free/nano). New-style keys (`sb_publishable_…` / `sb_secret_…`) in `.env` — both verified authenticating.
- Schema applied from `supabase/schema.sql`: `public.calls` table (GHL fields + 10 score columns + total/verdict/auto-fail + feedback arrays + `scorecard_raw` jsonb), indexes, RLS (authenticated read; service_role writes), private Storage bucket `recordings`.
- `parse-scorecard.js` — deterministic transcript→scorecard parser. Handles THREE formats: spoken digits ("5 out of 10"), spoken words ("five out of ten … forty-six out of a hundred"), and written ("<label> score: 5 out of 10 … Total score: 43 out of 100 / Result: …"). Tolerates mid-label speaker interruptions; auto-fail respects negation ("no automatic fail" = false).
- `backfill.js` — pages call-logs, parses, downloads WAV → Storage, upserts rows. Re-runnable (upsert by id, skips existing recordings). Flags: `--limit N`, `--no-recordings`, `--dry`.
- **Result: 51/51 rows in Supabase.** 13 scored, 16 qualitative (coaching but no numeric score), 22 no-review (hang-ups / calls that timed out before the scorecard). **Only 9/51 recordings available** from GHL (42 return no audio — likely aged out).

### New verified facts
- call-logs `pageSize` **max is 50** (100 → HTTP 422). Must page.
- Scorecard appears in 3 formats (see parser). ~29/51 calls have coaching; ~22 are incomplete.
- Recording endpoint returns audio for only the recent ~9 calls; older ones 404/empty.

## Next steps
1. **Polling ingestion** — schedule the same logic for new calls. Options: (a) run a `poll.js` (thin wrapper over backfill, upsert-by-id = safe) on Windows Task Scheduler / a cheap host every ~15 min [simplest, reuses the tested parser]; or (b) Make scenario calling GHL + a hosted parser. Recommend (a) given the parser complexity.
2. **Porter dashboard** → read Supabase (list calls, filters by verdict/score/agent, per-call audio player via signed URL, transcript, scorecard breakdown, coaching text from `scorecard_raw.coach_text`).
3. **Google Sheet mirror** (deferred) — needs a Google service account / Sheets API; add after dashboard.

## Files here
- `.env` — GHL + Supabase creds (never paste tokens in chat).
- `FINDINGS.md` — verified GHL API facts.
- `supabase/schema.sql`, `parse-scorecard.js`, `backfill.js` — see above.

> NOTE: the 2026-10-07 work ran from a Claude session whose home dir was `bo-spatial-film`; all files were written to THIS folder via absolute paths. For the dashboard/polling work, start the session IN this folder to avoid cwd noise.
