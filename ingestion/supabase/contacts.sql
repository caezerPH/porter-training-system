-- EZAI / Porter — GHL contacts mirror (training reports live in custom fields)
-- Run in Supabase SQL Editor after schema.sql. Safe to re-run.
--
-- The dashboard reads THIS table (not GHL directly): server-side sync-contacts.js
-- writes with the service_role key; authenticated dashboard users get read-only.

create table if not exists public.contacts (
  id               text primary key,          -- GHL contact id
  location_id      text,
  name             text,                       -- contactName / "first last"
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  tags             jsonb default '[]'::jsonb,
  custom_fields    jsonb default '{}'::jsonb,  -- { "<ghlFieldId>": <value>, ... } raw
  date_added       timestamptz,                -- GHL dateAdded
  ghl_updated_at   timestamptz,                -- GHL dateUpdated
  synced_at        timestamptz default now(),  -- last time sync wrote this row
  inserted_at      timestamptz default now(),
  updated_at       timestamptz default now()
);

create or replace function public.set_updated_at_contacts()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at_contacts();

create index if not exists idx_contacts_location  on public.contacts (location_id);
create index if not exists idx_contacts_synced_at on public.contacts (synced_at desc);

-- RLS: service_role (sync) bypasses; authenticated dashboard users read-only.
alter table public.contacts enable row level security;

drop policy if exists "authenticated read contacts" on public.contacts;
create policy "authenticated read contacts"
  on public.contacts for select
  to authenticated
  using (true);
