-- Empfehlungsprogramm v2: Ablösung des alten 10er-Ziels (10 Empfehlungen = 1 Jahr
-- Premium) durch sofortige Pro-Signup-Prämien:
--   - Der geworbene Freund erhält sofort 30 Tage Premium (45 Tage, falls der
--     Werber selbst aktuell Premium/Lifetime ist - "Halo-Effekt").
--   - Der Werber erhält pro erfolgreicher Empfehlung +1 Monat (30 Tage) Premium,
--     gedeckelt auf insgesamt 6 Monate (referral_months_earned <= 6).
--
-- Bereits vergebene Prämien aus dem alten 10er-Modell (referral_premium_until)
-- bleiben unangetastet gültig - es wird nichts zurückgerechnet.
--
-- VORAUSSETZUNG: profiles.sql und referrals.sql wurden bereits ausgeführt.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

alter table public.profiles
  add column if not exists referral_months_earned integer not null default 0
    check (referral_months_earned >= 0 and referral_months_earned <= 6);

-- Hinweis: referral_reward_granted (aus referrals.sql) wird vom neuen Modell
-- nicht mehr geschrieben, bleibt aber aus Kompatibilitätsgründen bestehen.
--
-- Sicherheit: referral_months_earned wird - wie alle anderen Referral-Spalten -
-- ausschließlich vom Server über den Service-Role-Key geschrieben
-- (/api/referral). Lesen dürfen Nutzer weiterhin nur die eigene Zeile
-- (Select-Policy aus profiles.sql).
