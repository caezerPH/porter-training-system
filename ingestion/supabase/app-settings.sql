-- EZAI / Porter — white-label app settings (admin-editable branding).
-- Run in Supabase SQL Editor AFTER rbac.sql. Safe to re-run.
--
-- Public read (the login screen brands itself BEFORE sign-in), admin-only write.
-- Branding is non-sensitive, so anon read is intentional.

create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user')
$$;

create table if not exists public.app_settings (
  id              text primary key default 'default',
  client_name     text,
  client_tagline  text,
  brand           text default 'blue',      -- preset palette key
  default_theme   text default 'light',     -- 'light' | 'dark'
  login_headline  text,
  login_subtext   text,
  login_bg_url    text,
  logo_url        text,
  favicon_url     text,
  training_ai_url text,
  updated_at      timestamptz default now()
);

insert into public.app_settings (id) values ('default') on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "public read app_settings" on public.app_settings;
create policy "public read app_settings"
  on public.app_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "admin write app_settings" on public.app_settings;
create policy "admin write app_settings"
  on public.app_settings for update
  to authenticated
  using (public.jwt_role() = 'admin')
  with check (public.jwt_role() = 'admin');

drop policy if exists "admin insert app_settings" on public.app_settings;
create policy "admin insert app_settings"
  on public.app_settings for insert
  to authenticated
  with check (public.jwt_role() = 'admin');

-- ---------- public storage bucket for branding images ----------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Anyone can view branding images; only admins can upload/replace/remove.
drop policy if exists "public read branding" on storage.objects;
create policy "public read branding"
  on storage.objects for select
  using (bucket_id = 'branding');

drop policy if exists "admin write branding" on storage.objects;
create policy "admin write branding"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'branding' and public.jwt_role() = 'admin');

drop policy if exists "admin update branding" on storage.objects;
create policy "admin update branding"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'branding' and public.jwt_role() = 'admin');

drop policy if exists "admin delete branding" on storage.objects;
create policy "admin delete branding"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'branding' and public.jwt_role() = 'admin');
