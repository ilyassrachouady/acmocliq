-- Migration 001 - Identité des rapports
-- Adds the broker report identity used by the ACM cover, page headers and
-- signature block. Safe to run more than once.
--
-- Run this in Supabase > SQL Editor on any project created before this change.
-- Without it, saving the profile fails with:
--   42703 column profiles.branding does not exist

alter table public.profiles add column if not exists licence_number text;
alter table public.profiles add column if not exists branding jsonb not null default '{}'::jsonb;

-- Verification: both rows below should come back.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('licence_number', 'branding');
