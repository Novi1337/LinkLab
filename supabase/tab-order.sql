-- Sortierbare Reiter: Nutzer können die Reihenfolge ihrer Tabs per Drag & Drop
-- ändern. Die Position wird pro Tab gespeichert; bestehende Tabs werden einmalig
-- nach ihrem Erstellungsdatum durchnummeriert (Reihenfolge bleibt also erhalten).
--
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

alter table public.tabs add column if not exists position integer;

-- Bestehende Tabs pro Nutzer in der bisherigen Reihenfolge (created_at) nummerieren
with numbered as (
  select id, row_number() over (partition by user_id order by created_at) - 1 as rn
  from public.tabs
  where position is null
)
update public.tabs t
set position = n.rn
from numbered n
where t.id = n.id;
