-- Harte, fälschungssichere Durchsetzung der Free-Limits direkt in der Datenbank.
--
-- Hintergrund: Tabs/Sektionen/Links werden direkt vom Client per Supabase-JS
-- angelegt (kein eigener Server-API-Roundtrip) - eine rein clientseitige Prüfung
-- ließe sich daher durch einen direkten REST-Aufruf mit gültigem User-Token
-- umgehen. Der Trigger unten ist deshalb die eigentliche Quelle der Wahrheit;
-- die Web-App prüft die Limits zusätzlich clientseitig vorab (bessere UX, siehe
-- addLink() in src/app/[locale]/page.tsx), damit Nutzer sofort ein Upgrade-Popup
-- statt eines Fehlers sehen.
--
-- Limits (global pro Account, nicht pro Reiter):
--   - 30 normale Links (in nicht-privaten Reitern)
--   - 5 private Links (im Inkognito-Reiter)
-- Nutzer mit profiles.premium_plan in ('premium', 'lifetime') sind unbegrenzt.
--
-- VORAUSSETZUNG: plans-single-tier.sql wurde bereits ausgeführt.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

create or replace function public.is_unlimited_user(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select premium_plan in ('premium', 'lifetime') from public.profiles where id = uid),
    false
  );
$$;

create or replace function public.enforce_link_limit()
returns trigger
language plpgsql
as $$
declare
  target_is_private boolean;
  existing_count integer;
  link_limit integer;
begin
  -- Premium/Lifetime/Admin: keine Beschränkung
  if public.is_unlimited_user(new.user_id) then
    return new;
  end if;

  -- Zielreiter des neuen Links ermitteln (privat = Inkognito-Reiter)
  select coalesce(t.is_private, false)
    into target_is_private
  from public.sections s
  join public.tabs t on t.id = s.tab_id
  where s.id = new.section_id;

  link_limit := case when target_is_private then 5 else 30 end;

  -- Bestehende Links des Users in derselben Kategorie zählen (normal vs. privat)
  select count(*)
    into existing_count
  from public.links l
  join public.sections s on s.id = l.section_id
  join public.tabs t on t.id = s.tab_id
  where l.user_id = new.user_id
    and coalesce(t.is_private, false) = coalesce(target_is_private, false);

  if existing_count >= link_limit then
    if target_is_private then
      raise exception 'LINK_LIMIT_REACHED_PRIVATE: Free-Limit von 5 privaten Links erreicht.';
    else
      raise exception 'LINK_LIMIT_REACHED_NORMAL: Free-Limit von 30 Links erreicht.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_link_limit on public.links;

create trigger trg_enforce_link_limit
  before insert on public.links
  for each row
  execute function public.enforce_link_limit();
