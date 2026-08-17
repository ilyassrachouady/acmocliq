-- ACM Studio Ocliq - schema initial
-- Run this entire file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  brokerage_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acm_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nouvelle analyse comparative',
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  workflow_step smallint not null default 0 check (workflow_step between 0 and 5),
  subject_address text,
  subject_city text,
  subject_postal_code text,
  subject_data jsonb not null default '{}'::jsonb,
  recommended_low integer,
  recommended_high integer,
  recommended_launch integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comparables (
  id text primary key,
  report_id uuid not null references public.acm_reports(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  city text not null,
  status text not null check (status in ('Vendue', 'En vigueur', 'Expirée', 'Retirée')),
  price integer not null default 0,
  adjustment integer not null default 0,
  adjusted integer not null default 0,
  included boolean not null default true,
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.acm_reports(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  filename text not null,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists acm_reports_owner_updated_idx on public.acm_reports(owner_id, updated_at desc);
create index if not exists comparables_report_sort_idx on public.comparables(report_id, sort_order);
create index if not exists report_exports_report_idx on public.report_exports(report_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists acm_reports_set_updated_at on public.acm_reports;
create trigger acm_reports_set_updated_at before update on public.acm_reports
for each row execute function public.set_updated_at();

drop trigger if exists comparables_set_updated_at on public.comparables;
create trigger comparables_set_updated_at before update on public.comparables
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.acm_reports enable row level security;
alter table public.comparables enable row level security;
alter table public.report_exports enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "reports_select_own" on public.acm_reports;
create policy "reports_select_own" on public.acm_reports for select using (auth.uid() = owner_id);
drop policy if exists "reports_insert_own" on public.acm_reports;
create policy "reports_insert_own" on public.acm_reports for insert with check (auth.uid() = owner_id);
drop policy if exists "reports_update_own" on public.acm_reports;
create policy "reports_update_own" on public.acm_reports for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "reports_delete_own" on public.acm_reports;
create policy "reports_delete_own" on public.acm_reports for delete using (auth.uid() = owner_id);

drop policy if exists "comparables_select_own" on public.comparables;
create policy "comparables_select_own" on public.comparables for select using (auth.uid() = owner_id);
drop policy if exists "comparables_insert_own" on public.comparables;
create policy "comparables_insert_own" on public.comparables for insert with check (
  auth.uid() = owner_id and exists (
    select 1 from public.acm_reports r where r.id = report_id and r.owner_id = auth.uid()
  )
);
drop policy if exists "comparables_update_own" on public.comparables;
create policy "comparables_update_own" on public.comparables for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "comparables_delete_own" on public.comparables;
create policy "comparables_delete_own" on public.comparables for delete using (auth.uid() = owner_id);

drop policy if exists "exports_select_own" on public.report_exports;
create policy "exports_select_own" on public.report_exports for select using (auth.uid() = owner_id);
drop policy if exists "exports_insert_own" on public.report_exports;
create policy "exports_insert_own" on public.report_exports for insert with check (auth.uid() = owner_id);
drop policy if exists "exports_delete_own" on public.report_exports;
create policy "exports_delete_own" on public.report_exports for delete using (auth.uid() = owner_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.acm_reports, public.comparables, public.report_exports to authenticated;
