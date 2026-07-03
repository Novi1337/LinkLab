-- Empfehlungsprogramm: Freunde werben, 3 Monate Premium für die erste
-- erfolgreiche Empfehlung.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users (id) on delete set null,
  add column if not exists referral_reward_granted boolean not null default false,
  add column if not exists referral_premium_until timestamptz;

-- Schneller Lookup für die Zählung der geworbenen Nutzer
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Hinweis zur Sicherheit: Diese Spalten schreibt AUSSCHLIESSLICH der Server
-- über den Service-Role-Key (/api/referral). Die Spaltenrechte aus
-- incognito.sql erlauben authentifizierten Nutzern nur das Schreiben von
-- incognito_password_hash - neue Spalten sind damit automatisch geschützt.
-- Lesen dürfen Nutzer weiterhin nur die eigene Zeile (Select-Policy aus profiles.sql).
