-- EDUBRIDGE MVP v1: paste into Supabase SQL Editor and click Run once.
-- NOTICE: Each user owns their own lesson records; do not use service-role API keys on the client.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'teacher' check (role in ('teacher', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  subject text not null default 'Vật lí',
  grade text not null check (grade in ('10', '11', '12')),
  language_level text not null check (language_level in ('A2', 'B1', 'B2')),
  source_text text not null,
  source_filename text,
  teacher_notes text not null default '',
  generated_content jsonb not null,
  model_name text not null,
  status text not null default 'draft' check (status in ('draft', 'reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lessons_teacher_created on public.lessons (teacher_id, created_at desc);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'teacher')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_created_edubridge on auth.users;
create trigger auth_user_created_edubridge
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.update_lessons_timestamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_lessons_updated_at on public.lessons;
create trigger touch_lessons_updated_at before update on public.lessons
  for each row execute procedure public.update_lessons_timestamp();

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;

drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated
using ((select auth.uid()) = id);

-- Intentionally no client UPDATE/DELETE policies for profiles: avoid client-side role escalation.
drop policy if exists lessons_read_own on public.lessons;
create policy lessons_read_own on public.lessons for select to authenticated
using ((select auth.uid()) = teacher_id);

drop policy if exists lessons_create_own on public.lessons;
create policy lessons_create_own on public.lessons for insert to authenticated
with check ((select auth.uid()) = teacher_id);

drop policy if exists lessons_update_own on public.lessons;
create policy lessons_update_own on public.lessons for update to authenticated
using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);

drop policy if exists lessons_delete_own on public.lessons;
create policy lessons_delete_own on public.lessons for delete to authenticated
using ((select auth.uid()) = teacher_id);

-- Additional privileges, necessary when migrating across different Supabase setups.
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
