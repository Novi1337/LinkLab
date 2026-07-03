-- Neue Premium-Stufen:
--   premium      = 12 EUR/Jahr: unbegrenzte Reiter/Abschnitte/Unterabschnitte, werbefrei
--   premium_plus = 24 EUR/Jahr: wie premium + Inkognito-Modus (private Reiter)
--   lifetime     = 69 EUR einmalig: wie premium_plus, ohne Abo
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).
-- VORAUSSETZUNG: profiles.sql wurde bereits ausgeführt.

-- Alten Check-Constraint (monthly/yearly/lifetime) entfernen
alter table public.profiles drop constraint if exists profiles_premium_plan_check;

-- Eventuelle Alt-Werte auf die neue Basis-Stufe migrieren
update public.profiles set premium_plan = 'premium' where premium_plan in ('monthly', 'yearly');

-- Neuen Constraint mit den aktuellen Plan-Namen setzen
alter table public.profiles add constraint profiles_premium_plan_check
  check (premium_plan in ('premium', 'premium_plus', 'lifetime'));
