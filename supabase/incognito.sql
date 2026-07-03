-- Inkognito-Modus (Premium): private Reiter + Inkognito-Passwort pro Nutzer.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

-- 1) Reiter können als privat markiert werden und werden dann nur im
--    entsperrten Inkognito-Modus angezeigt.
alter table public.tabs
  add column if not exists is_private boolean not null default false;

-- 2) SHA-256-Hash des Inkognito-Passworts (wird clientseitig berechnet,
--    das Klartext-Passwort verlässt nie den Browser).
alter table public.profiles
  add column if not exists incognito_password_hash text;

-- 3) Nutzer dürfen AUSSCHLIESSLICH ihren eigenen Inkognito-Passwort-Hash schreiben.
--    Spaltenrechte stellen sicher, dass über die Update-/Insert-Policy keine
--    anderen Spalten (z. B. premium_plan) manipuliert werden können -
--    diese schreibt weiterhin nur der Server (Stripe-Webhook, Service-Role).
revoke update on public.profiles from authenticated;
grant update (incognito_password_hash) on public.profiles to authenticated;

revoke insert on public.profiles from authenticated;
grant insert (id, incognito_password_hash) on public.profiles to authenticated;

drop policy if exists "Users can update own incognito settings" on public.profiles;
create policy "Users can update own incognito settings"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
