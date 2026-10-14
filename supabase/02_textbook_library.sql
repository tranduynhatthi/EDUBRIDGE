-- EDUBRIDGE MVP 1.1: Apply AFTER 01_schema.sql in the same Supabase project.
-- The textbook PDF is stored privately and is NOT accessible to normal teachers.
-- Only an administrator can import, extract, review and publish lesson text.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('teacher','student','admin'));

create table if not exists public.textbooks (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 3 and 180),
 subject text not null default 'Vật lí' check (subject = 'Vật lí'),
 grade text not null check (grade in ('10','11','12')),
 book_series text not null check (char_length(book_series) between 2 and 120),
 publisher text not null default '',
 original_filename text not null,
 storage_path text not null unique,
 page_count integer not null check (page_count between 1 and 1000),
 is_active boolean not null default true,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);

create table if not exists public.textbook_lessons (
 id uuid primary key default gen_random_uuid(),
 textbook_id uuid not null references public.textbooks(id) on delete cascade,
 sort_order integer not null check (sort_order between 1 and 500),
 chapter text not null default '',
 title text not null check (char_length(title) between 5 and 120),
 start_page integer not null check (start_page > 0),
 end_page integer not null check (end_page > 0),
 source_text text not null check (char_length(source_text) between 250 and 30000),
 extraction_note text not null default '',
 is_published boolean not null default false,
 created_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 constraint valid_page_range check (end_page >= start_page),
 constraint unique_book_order unique (textbook_id,sort_order)
);

create index if not exists idx_textbook_catalog on public.textbooks(grade,book_series);
create index if not exists idx_catalog_lessons on public.textbook_lessons(textbook_id,sort_order);
alter table public.lessons add column if not exists textbook_lesson_id uuid references public.textbook_lessons(id) on delete set null;
create index if not exists idx_teacher_lesson_source on public.lessons(textbook_lesson_id);

-- SECURITY: A normal teacher can only see active books and reviewed lesson text.
-- Admin roles can be assigned ONLY in Supabase SQL Editor (not via client API).
create or replace function public.is_edubridge_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_edubridge_admin() from public;
grant execute on function public.is_edubridge_admin() to authenticated;

alter table public.textbooks enable row level security;
alter table public.textbook_lessons enable row level security;

drop policy if exists books_read on public.textbooks;
create policy books_read on public.textbooks for select to authenticated
 using (is_active or (select public.is_edubridge_admin()));
drop policy if exists books_admin_insert on public.textbooks;
create policy books_admin_insert on public.textbooks for insert to authenticated
 with check ((select public.is_edubridge_admin()) and created_by = (select auth.uid()));
drop policy if exists books_admin_update on public.textbooks;
create policy books_admin_update on public.textbooks for update to authenticated
 using ((select public.is_edubridge_admin())) with check ((select public.is_edubridge_admin()));
drop policy if exists books_admin_delete on public.textbooks;
create policy books_admin_delete on public.textbooks for delete to authenticated
 using ((select public.is_edubridge_admin()));

drop policy if exists catalog_read on public.textbook_lessons;
create policy catalog_read on public.textbook_lessons for select to authenticated
 using (
 (is_published and exists(select 1 from public.textbooks b where b.id = textbook_id and b.is_active))
 or (select public.is_edubridge_admin())
 );
drop policy if exists catalog_admin_insert on public.textbook_lessons;
create policy catalog_admin_insert on public.textbook_lessons for insert to authenticated
 with check ((select public.is_edubridge_admin()) and created_by = (select auth.uid()));
drop policy if exists catalog_admin_update on public.textbook_lessons;
create policy catalog_admin_update on public.textbook_lessons for update to authenticated
 using ((select public.is_edubridge_admin())) with check ((select public.is_edubridge_admin()));
drop policy if exists catalog_admin_delete on public.textbook_lessons;
create policy catalog_admin_delete on public.textbook_lessons for delete to authenticated
 using ((select public.is_edubridge_admin()));

grant select,insert,update,delete on public.textbooks to authenticated;
grant select,insert,update,delete on public.textbook_lessons to authenticated;

-- Private PDF bucket: only admins can upload and read source PDFs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('edubridge-textbooks','edubridge-textbooks',false,31457280,array['application/pdf'])
 on conflict (id) do update set public=false, file_size_limit=31457280,allowed_mime_types=array['application/pdf'];

drop policy if exists edubridge_admin_read_pdf on storage.objects;
create policy edubridge_admin_read_pdf on storage.objects for select to authenticated
 using (bucket_id='edubridge-textbooks' and (select public.is_edubridge_admin()));
drop policy if exists edubridge_admin_insert_pdf on storage.objects;
create policy edubridge_admin_insert_pdf on storage.objects for insert to authenticated
 with check (bucket_id='edubridge-textbooks' and (select public.is_edubridge_admin()));
drop policy if exists edubridge_admin_delete_pdf on storage.objects;
create policy edubridge_admin_delete_pdf on storage.objects for delete to authenticated
 using (bucket_id='edubridge-textbooks' and (select public.is_edubridge_admin()));

-- ADMIN BOOTSTRAP: after signing up with your own teacher email, run manually:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='EMAIL_QUAN_TRI_CUA_BAN');
-- Do not allow users to choose 'admin' in registration.
