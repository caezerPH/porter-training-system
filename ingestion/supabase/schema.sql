-- EZAI / Porter call-scorecards schema
-- Run in Supabase SQL Editor (Database > SQL Editor > New query > paste > Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.

-- =====================================================================
-- 1. calls table
-- =====================================================================
create table if not exists public.calls (
  -- GHL identity
  id                       text primary key,              -- GHL call log id
  message_id               text,                          -- for recording download endpoint
  contact_id               text,
  agent_id                 text,
  from_number              text,

  -- call metadata
  created_at               timestamptz,                   -- GHL createdAt
  duration_seconds         integer,
  summary                  text,
  transcript               text,
  translation              text,
  trial_call               boolean,
  agent_transfer_occurred  boolean,
  is_agent_deleted         boolean,
  executed_call_actions    jsonb,

  -- recording (stored in Storage bucket 'recordings')
  recording_path           text,                          -- object path, e.g. 'wav/<id>.wav'
  recording_bytes          bigint,
  recording_downloaded_at  timestamptz,

  -- parsed scorecard (10 criteria x 10 pts)
  score_opening                smallint,                  -- Opening and introduction
  score_compliance             smallint,                  -- Compliance disclosure
  score_rapport                smallint,                  -- Rapport and trust
  score_needs_discovery        smallint,                  -- Needs discovery
  score_plan_review            smallint,                  -- Current plan review
  score_plan_recommendation    smallint,                  -- Plan recommendation
  score_objection_handling     smallint,                  -- Objection handling
  score_medicare_clarity       smallint,                  -- Medicare clarity
  score_closing                smallint,                  -- Closing and next steps
  score_professionalism        smallint,                  -- Overall professionalism

  total_score              smallint,                      -- /100 (parsed, not summed, to match what agent says)
  verdict_band             text,                          -- e.g. 'retraining required'
  compliance_auto_fail     boolean default false,

  did_well                 text[],                        -- "two things you did well"
  missed                   text[],                        -- "what you missed"
  focus_next_time          text,                          -- "one thing to focus on next time"

  scorecard_raw            jsonb,                         -- {criterion: score, ...} + any extras
  scorecard_parsed         boolean default false,         -- true once parser succeeds
  parse_version            text,                          -- parser version that wrote the row

  -- bookkeeping
  inserted_at              timestamptz default now(),
  updated_at               timestamptz default now()
);

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_calls_updated_at on public.calls;
create trigger trg_calls_updated_at
  before update on public.calls
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 2. indexes (dashboard query patterns)
-- =====================================================================
create index if not exists idx_calls_created_at   on public.calls (created_at desc);
create index if not exists idx_calls_agent_id     on public.calls (agent_id);
create index if not exists idx_calls_total_score  on public.calls (total_score);
create index if not exists idx_calls_unparsed     on public.calls (scorecard_parsed) where scorecard_parsed = false;

-- =====================================================================
-- 3. row level security
--    service_role (Make writes) BYPASSES RLS automatically.
--    authenticated dashboard users get read-only.
-- =====================================================================
alter table public.calls enable row level security;

drop policy if exists "authenticated read" on public.calls;
create policy "authenticated read"
  on public.calls for select
  to authenticated
  using (true);

-- =====================================================================
-- 4. storage bucket for recordings (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- authenticated users may read recording objects (dashboard playback via signed URL / authed request)
drop policy if exists "authenticated read recordings" on storage.objects;
create policy "authenticated read recordings"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'recordings');
