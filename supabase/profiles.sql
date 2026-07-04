-- Premium-/Stripe-Profil pro Nutzer.
-- Einmalig im Supabase SQL-Editor ausführen (Dashboard -> SQL Editor -> New query).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  premium_plan text check (premium_plan in ('premium', 'premium_plus', 'lifetime')),
  share_nickname text,
  premium_since timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists share_nickname text;

alter table public.profiles enable row level security;

-- Nutzer dürfen NUR ihre eigene Zeile lesen - schreiben darf ausschließlich
-- der Server über den Service-Role-Key (Stripe-Webhook), der RLS umgeht.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
