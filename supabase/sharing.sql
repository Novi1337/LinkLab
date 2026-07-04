-- Teilen von Reitern/Abschnitten per Link.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

create table if not exists public.share_tokens (
  token text primary key,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  resource_type text not null check (resource_type in ('tab', 'section')),
  source_tab_id uuid references public.tabs (id) on delete cascade,
  source_section_id uuid references public.sections (id) on delete cascade,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists share_tokens_owner_user_id_idx on public.share_tokens (owner_user_id);
create index if not exists share_tokens_created_at_idx on public.share_tokens (created_at desc);

create table if not exists public.share_redemptions (
  token text not null references public.share_tokens (token) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (token, recipient_user_id)
);

create index if not exists share_redemptions_recipient_user_id_idx on public.share_redemptions (recipient_user_id);

alter table public.tabs
  add column if not exists shared_from_label text;

alter table public.sections
  add column if not exists shared_from_label text;

-- Share-Tabellen sind nur über Server-Endpunkte erreichbar.
-- Service-Role-Key umgeht RLS; für Client-Zugriffe werden keine Policies vergeben.
alter table public.share_tokens enable row level security;
alter table public.share_redemptions enable row level security;
