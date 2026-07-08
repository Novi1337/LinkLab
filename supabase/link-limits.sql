-- Harte, fälschungssichere Durchsetzung der Free-Limits direkt in der Datenbank.
--
-- Hintergrund: Tabs/Sektionen/Links werden direkt vom Client per Supabase-JS
-- angelegt (kein eigener Server-API-Roundtrip) - eine rein clientseitige Prüfung
-- ließe sich daher durch einen direkten REST-Aufruf mit gültigem User-Token
-- umgehen. Die Trigger unten sind deshalb die eigentliche Quelle der Wahrheit;
-- die Web-App prüft die Limits zusätzlich clientseitig vorab (bessere UX, siehe
-- addLink() in src/app/[locale]/page.tsx), damit Nutzer sofort ein Upgrade-Popup
-- statt eines Fehlers sehen.
--
-- Limits (global pro Account, nicht pro Reiter):
--   - 30 normale Links (in nicht-privaten Reitern)
--   - 5 private Links (im Inkognito-Reiter)
-- Nutzer mit profiles.premium_plan in ('premium', 'lifetime') sind unbegrenzt.
--
-- Abgedeckte Wege (alle drei müssen geprüft werden, sonst ist das Limit umgehbar):
--   1. INSERT auf links                           -> trg_enforce_link_limit
--   2. UPDATE links.section_id (Link verschieben) -> trg_enforce_link_limit_move
--   3. UPDATE tabs.is_private (Reiter umschalten,
--      alle enthaltenen Links wechseln Kategorie) -> trg_enforce_tab_privacy_limit
--
-- Das Skript ist idempotent (create or replace / drop if exists) und kann
-- gefahrlos erneut ausgeführt werden.
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

-- Prüft beim Einfügen ODER Verschieben eines Links das Free-Limit der Zielkategorie.
create or replace function public.enforce_link_limit()
returns trigger
language plpgsql
as $$
declare
  target_owner uuid;
  target_is_private boolean;
  existing_count integer;
  link_limit integer;
begin
  -- Premium/Lifetime/Admin: keine Beschränkung
  if public.is_unlimited_user(new.user_id) then
    return new;
  end if;

  -- Ziel-Sektion + Zielreiter ermitteln (Alt-Sektionen ohne tab_id gelten als normal)
  select s.user_id, coalesce(t.is_private, false)
    into target_owner, target_is_private
  from public.sections s
  left join public.tabs t on t.id = s.tab_id
  where s.id = new.section_id;

  -- Konsistenz-Check: Die Ziel-Sektion muss existieren und demselben Nutzer
  -- gehören - verhindert, dass Links per manipuliertem Request in fremde
  -- Sektionen eingefügt werden (und dort falsch gezählt würden).
  if target_owner is null or target_owner <> new.user_id then
    raise exception 'LINK_SECTION_FORBIDDEN: Ziel-Sektion existiert nicht oder gehört einem anderen Nutzer.';
  end if;

  link_limit := case when target_is_private then 5 else 30 end;

  -- Bestehende Links des Users in der Zielkategorie zählen. Der Link selbst wird
  -- ausgeschlossen (relevant beim Verschieben innerhalb derselben Kategorie).
  select count(*)
    into existing_count
  from public.links l
  join public.sections s on s.id = l.section_id
  left join public.tabs t on t.id = s.tab_id
  where l.user_id = new.user_id
    and l.id <> new.id
    and coalesce(t.is_private, false) = target_is_private;

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

-- Auch das VERSCHIEBEN eines Links (UPDATE section_id) muss geprüft werden,
-- sonst ließe sich das 5er-Limit umgehen, indem Links zuerst normal gespeichert
-- und dann per Drag & Drop/REST-Update in einen privaten Reiter verschoben werden.
drop trigger if exists trg_enforce_link_limit_move on public.links;
create trigger trg_enforce_link_limit_move
  before update of section_id on public.links
  for each row
  when (old.section_id is distinct from new.section_id)
  execute function public.enforce_link_limit();

-- Prüft das Umschalten eines Reiters (öffentlich <-> privat): dabei wechseln
-- ALLE enthaltenen Links die Kategorie. Ohne diesen Trigger könnte ein Free-Nutzer
-- 30 normale Links speichern und den Reiter dann privat schalten (30 private
-- Links statt 5) - beliebig oft wiederholbar.
create or replace function public.enforce_tab_privacy_limit()
returns trigger
language plpgsql
as $$
declare
  moving_count integer;
  existing_target_count integer;
  target_limit integer;
begin
  if public.is_unlimited_user(new.user_id) then
    return new;
  end if;

  -- Links, die mit diesem Reiter die Kategorie wechseln
  select count(*)
    into moving_count
  from public.links l
  join public.sections s on s.id = l.section_id
  where s.tab_id = new.id;

  -- Bestehende Links des Users in der ZIEL-Kategorie (ohne diesen Reiter)
  select count(*)
    into existing_target_count
  from public.links l
  join public.sections s on s.id = l.section_id
  left join public.tabs t on t.id = s.tab_id
  where l.user_id = new.user_id
    and s.tab_id is distinct from new.id
    and coalesce(t.is_private, false) = new.is_private;

  target_limit := case when new.is_private then 5 else 30 end;

  if existing_target_count + moving_count > target_limit then
    if new.is_private then
      raise exception 'LINK_LIMIT_REACHED_PRIVATE: Free-Limit von 5 privaten Links erreicht.';
    else
      raise exception 'LINK_LIMIT_REACHED_NORMAL: Free-Limit von 30 Links erreicht.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_tab_privacy_limit on public.tabs;
create trigger trg_enforce_tab_privacy_limit
  before update of is_private on public.tabs
  for each row
  when (old.is_private is distinct from new.is_private)
  execute function public.enforce_tab_privacy_limit();
