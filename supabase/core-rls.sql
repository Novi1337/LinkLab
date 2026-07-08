-- Absicherung der Kern-Tabellen (tabs, sections, links) per Row Level Security.
--
-- Hintergrund: Die App greift direkt per Supabase-JS (User-Token) auf diese
-- Tabellen zu. Ohne RLS-Policies könnte jeder authentifizierte Nutzer über die
-- REST-API fremde Reiter/Sektionen/Links lesen oder manipulieren.
--
-- Dieses Skript ist idempotent (drop policy if exists) und kann gefahrlos
-- erneut ausgeführt werden. Falls RLS + Policies beim initialen Setup bereits
-- (z. B. über das Supabase-Dashboard) angelegt wurden, ersetzt es diese durch
-- die untenstehende, einheitliche Variante.
--
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

-- ---------- TABS ----------
alter table public.tabs enable row level security;

drop policy if exists "Users can read own tabs" on public.tabs;
create policy "Users can read own tabs"
  on public.tabs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tabs" on public.tabs;
create policy "Users can insert own tabs"
  on public.tabs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tabs" on public.tabs;
create policy "Users can update own tabs"
  on public.tabs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tabs" on public.tabs;
create policy "Users can delete own tabs"
  on public.tabs for delete
  using (auth.uid() = user_id);

-- ---------- SECTIONS ----------
alter table public.sections enable row level security;

drop policy if exists "Users can read own sections" on public.sections;
create policy "Users can read own sections"
  on public.sections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sections" on public.sections;
create policy "Users can insert own sections"
  on public.sections for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sections" on public.sections;
create policy "Users can update own sections"
  on public.sections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sections" on public.sections;
create policy "Users can delete own sections"
  on public.sections for delete
  using (auth.uid() = user_id);

-- ---------- LINKS ----------
alter table public.links enable row level security;

drop policy if exists "Users can read own links" on public.links;
create policy "Users can read own links"
  on public.links for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own links" on public.links;
create policy "Users can insert own links"
  on public.links for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own links" on public.links;
create policy "Users can update own links"
  on public.links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own links" on public.links;
create policy "Users can delete own links"
  on public.links for delete
  using (auth.uid() = user_id);
