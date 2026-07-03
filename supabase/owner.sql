-- Owner/Admin-Zugang: verleiht dem eigenen Account dauerhaftes Premium (Lifetime),
-- ohne Stripe-Kauf. Wirkt client- UND serverseitig, da überall profiles.premium_plan
-- geprüft wird - im Gegensatz zur rein clientseitigen NEXT_PUBLIC_OWNER_*-Variante.
--
-- Anwendung: Supabase Dashboard -> SQL Editor -> New query,
-- unten 'DEINE_EMAIL_HIER' (2x) durch die eigene Login-E-Mail ersetzen und ausführen.
-- (E-Mail bewusst NICHT hier im Repo eintragen - nur direkt im SQL-Editor.)

-- Profil anlegen bzw. auf Lifetime heben (idempotent, mehrfach ausführbar)
insert into public.profiles (id, premium_plan, premium_since)
select u.id, 'lifetime', now()
from auth.users u
where lower(u.email) = lower('DEINE_EMAIL_HIER')
on conflict (id) do update
  set premium_plan = 'lifetime',
      premium_since = coalesce(public.profiles.premium_since, now());

-- Kontrolle: sollte genau eine Zeile mit premium_plan = 'lifetime' liefern
select u.email, p.premium_plan, p.premium_since
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('DEINE_EMAIL_HIER');
