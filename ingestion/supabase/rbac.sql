-- EZAI / Porter — role-based access control.
-- Run in Supabase SQL Editor AFTER schema.sql + contacts.sql. Safe to re-run.
--
-- Roles live in each user's app_metadata (set by the admin-create-user Edge
-- Function, or via the Admin API):
--   { "role": "admin" }                              -> sees everything
--   { "role": "user", "contact_id": "<ghl id>" }     -> sees only that agent
--
-- app_metadata is embedded in the JWT, so RLS can read it with auth.jwt().
-- NOTE: a user must get a fresh token (re-login) after their role changes.

-- Helper: current request's role claim (defaults to 'user' when absent).
create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user')
$$;

-- Helper: current request's assigned contact_id (null for admins).
create or replace function public.jwt_contact_id()
returns text language sql stable as $$
  select auth.jwt() -> 'app_metadata' ->> 'contact_id'
$$;

-- ---------- contacts ----------
drop policy if exists "authenticated read contacts" on public.contacts;
drop policy if exists "role based read contacts" on public.contacts;
create policy "role based read contacts"
  on public.contacts for select
  to authenticated
  using (
    public.jwt_role() = 'admin'
    or id = public.jwt_contact_id()
  );

-- ---------- calls ----------
drop policy if exists "authenticated read" on public.calls;
drop policy if exists "role based read calls" on public.calls;
create policy "role based read calls"
  on public.calls for select
  to authenticated
  using (
    public.jwt_role() = 'admin'
    or contact_id = public.jwt_contact_id()
  );

-- ---------- storage (recordings) ----------
-- Recording object paths are opaque call ids and are only discoverable through
-- calls rows the user can already read (filtered above), so authenticated read
-- stays. (Future hardening: map objects -> call -> contact for per-user storage.)
