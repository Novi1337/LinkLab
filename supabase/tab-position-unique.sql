-- Verhindert doppelt angelegte "Startseite"-Reiter beim (fast) gleichzeitigen
-- ersten Zugriff über mehrere Wege (Haupt-App + Save-Widget, oder zwei parallel
-- geöffnete Tabs/Geräte): bislang konnten zwei parallele Anfragen beide "0
-- Reiter" sehen und jeweils einen eigenen Standard-Reiter mit position 0
-- anlegen - Ergebnis waren 2-3 doppelte "Startseite"-Reiter.
--
-- VORAUSSETZUNG: tab-order.sql wurde bereits ausgeführt (position-Spalte).
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

-- 1) Bestehende Kollisionen auflösen: falls ein Nutzer mehrere Reiter mit
--    derselben Position hat (z. B. die bereits entstandenen doppelten
--    "Startseite"-Reiter), werden sie hier nach Erstellungsdatum neu
--    durchnummeriert, damit der folgende Unique-Index angelegt werden kann.
--    Es wird NICHTS gelöscht - nur die position wird angepasst.
with ranked as (
  select id, row_number() over (partition by user_id order by position, created_at) - 1 as rn
  from public.tabs
)
update public.tabs t
set position = r.rn
from ranked r
where t.id = r.id and (t.position is distinct from r.rn);

-- 2) Unique-Index: verhindert künftig, dass zwei parallele Inserts denselben
--    Reiter-Slot (user_id, position) doppelt belegen. NULL-Positionen sind
--    davon ausgenommen (mehrere NULLs sind in Postgres per Unique-Index erlaubt) -
--    beide betroffenen Insert-Stellen (fetchData() in
--    src/app/[locale]/page.tsx und ensureTargetSection() in
--    src/app/[locale]/save/page.tsx) setzen position aber inzwischen immer
--    explizit, sodass der Schutz greift.
create unique index if not exists tabs_user_id_position_key
  on public.tabs (user_id, position)
  where position is not null;
