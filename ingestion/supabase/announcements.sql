-- EZAI / Porter — announcements (admins post news/updates; all users read).
-- Run in Supabase SQL Editor AFTER rbac.sql (uses public.jwt_role()). Safe to re-run.

-- Ensure the role helper exists even if rbac.sql hasn't been run yet.
create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user')
$$;

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  created_by  text
);

create index if not exists idx_announcements_active
  on public.announcements (is_active, created_at desc);

alter table public.announcements enable row level security;

-- Everyone signed in can read announcements.
drop policy if exists "authenticated read announcements" on public.announcements;
create policy "authenticated read announcements"
  on public.announcements for select
  to authenticated
  using (true);

-- Only admins can create / edit / remove them.
drop policy if exists "admin insert announcements" on public.announcements;
create policy "admin insert announcements"
  on public.announcements for insert
  to authenticated
  with check (public.jwt_role() = 'admin');

drop policy if exists "admin update announcements" on public.announcements;
create policy "admin update announcements"
  on public.announcements for update
  to authenticated
  using (public.jwt_role() = 'admin')
  with check (public.jwt_role() = 'admin');

drop policy if exists "admin delete announcements" on public.announcements;
create policy "admin delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.jwt_role() = 'admin');
