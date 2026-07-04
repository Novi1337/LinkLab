-- Premium-/Stripe-Profil pro Nutzer.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  premium_plan text check (premium_plan in ('premium', 'premium_plus', 'lifetime')),
  sharing_disabled_until timestamptz,
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  suspended_until timestamptz,
  abuse_warning_count integer not null default 0 check (abuse_warning_count >= 0),
  share_nickname text,
  share_handle text unique,
  share_handle_changed_at timestamptz,
  premium_since timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists sharing_disabled_until timestamptz;

alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.profiles
  add column if not exists suspended_until timestamptz;

alter table public.profiles
  add column if not exists abuse_warning_count integer not null default 0;

alter table public.profiles
  add column if not exists share_nickname text;

alter table public.profiles
  add column if not exists share_handle text;

alter table public.profiles
  add column if not exists share_handle_changed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

alter table public.profiles
  drop constraint if exists profiles_abuse_warning_count_check;

alter table public.profiles
  add constraint profiles_abuse_warning_count_check
  check (abuse_warning_count >= 0);

create unique index if not exists profiles_share_handle_key
  on public.profiles (share_handle)
  where share_handle is not null;

alter table public.profiles enable row level security;

-- Nutzer dürfen NUR ihre eigene Zeile lesen - schreiben darf ausschließlich
-- der Server über den Service-Role-Key (Stripe-Webhook), der RLS umgeht.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
