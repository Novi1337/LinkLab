-- Admin-Rolle über app_metadata (JWT) verwalten.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).
-- VORAUSSETZUNG: profiles.sql muss vorher ausgeführt worden sein (legt public.profiles an).
--
-- Sicherheit: app_metadata kann NUR serverseitig geändert werden (SQL, Dashboard,
-- Admin-API mit Service-Role-Key) - niemals vom Client. Deshalb ist die Rolle
-- fälschungssicher. user_metadata dagegen NIE für Rechte verwenden, die kann
-- jeder Nutzer selbst überschreiben!

-- 1) Hilfsfunktion für RLS-Policies: prüft die Admin-Rolle im JWT des Aufrufers.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- 2) Admins dürfen alle Profile lesen (z. B. für ein Admin-Dashboard).
--    Weitere Admin-Policies auf anderen Tabellen nach demselben Muster:
--    using (public.is_admin())
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 3) Einen Nutzer zum Admin machen (E-Mail anpassen, dann ausführen).
--    Dank "returning" zeigt der SQL Editor die geänderte Zeile direkt an -
--    ein UPDATE ohne returning meldet sonst nur "Success. No rows returned".
-- update auth.users
--   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
--   where lower(email) = lower('deine@email.de')
--   returning id, email, raw_app_meta_data;

-- Admin-Rolle wieder entziehen:
-- update auth.users
--   set raw_app_meta_data = raw_app_meta_data - 'role'
--   where lower(email) = lower('deine@email.de')
--   returning id, email, raw_app_meta_data;

-- Prüfen, ob die Rolle gesetzt ist:
-- select id, email, raw_app_meta_data from auth.users
--   where lower(email) = lower('deine@email.de');

-- Hinweis: In RLS-Policies (auth.jwt()) greift die Rolle erst nach dem nächsten
-- Login bzw. Token-Refresh. Der Server-Check getAdminFromRequest()
-- (src/lib/stripe.ts) sieht die Änderung sofort, da getUser() die aktuellen
-- Nutzerdaten vom Auth-Server holt.
