-- Reduziert das Premium-System von 3 Stufen (premium/premium_plus/lifetime) auf
-- einen einzigen öffentlich käuflichen Plan:
--   premium  = 24 EUR/Jahr: unbegrenzte normale + private (Inkognito-)Links, werbefrei
--   lifetime = intern/Admin-only (siehe owner.sql), NICHT über den Checkout käuflich
--
-- Hintergrund: Free-Nutzer dürfen ab sofort 30 normale Links und 5 private Links
-- (im immer verfügbaren Inkognito-Reiter) speichern (siehe supabase/link-limits.sql).
-- Premium hebt beide Limits auf - es gibt keine separate "premium_plus"-Stufe mehr.
--
-- VORAUSSETZUNG: profiles.sql und plans.sql wurden bereits ausgeführt.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

-- Alten Check-Constraint (premium/premium_plus/lifetime) entfernen
alter table public.profiles drop constraint if exists profiles_premium_plan_check;

-- Alte "premium_plus"-Nutzer auf die neue, einzige Premium-Stufe migrieren
-- (enthält jetzt alles, was vorher premium_plus war: unbegrenzt + Inkognito)
update public.profiles set premium_plan = 'premium' where premium_plan = 'premium_plus';

-- Neuen, schlankeren Constraint setzen
alter table public.profiles add constraint profiles_premium_plan_check
  check (premium_plan in ('premium', 'lifetime'));
