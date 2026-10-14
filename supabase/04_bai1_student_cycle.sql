-- EDUBRIDGE BAI 1: run after 01, 02, 03; first grant role in signup trigger; admin is never self-assignable.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('teacher','student','admin'));
create or replace function public.create_profile_for_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,role) values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), case when new.raw_user_meta_data->>'role'='student' then 'student' else 'teacher' end)
 on conflict(id) do nothing;
 return new;
end; $$;

create table if not exists public.lesson_assignments (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.lessons(id) on delete cascade,
 access_code text unique not null check(access_code ~ '^[A-Z0-9]{8}$'),
 title text not null,
 lesson_snapshot jsonb not null,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(id,teacher_id)
);
create table if not exists public.student_submissions (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references public.lesson_assignments(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 answers jsonb not null,
 score integer not null check(score >= 0),
 total integer not null check(total > 0),
 submitted_at timestamptz not null default now(),
 unique(assignment_id,student_id)
);
alter table public.lesson_assignments enable row level security;
alter table public.student_submissions enable row level security;
drop policy if exists assignment_read_teacher on public.lesson_assignments;
create policy assignment_read_teacher on public.lesson_assignments for select to authenticated using (teacher_id=(select auth.uid()));
drop policy if exists assignment_add_teacher on public.lesson_assignments;
create policy assignment_add_teacher on public.lesson_assignments for insert to authenticated with check (teacher_id=(select auth.uid()) and exists(select 1 from public.lessons l where l.id=lesson_id and l.teacher_id=(select auth.uid()) and l.status='reviewed'));
drop policy if exists submissions_read_teacher on public.student_submissions;
create policy submissions_read_teacher on public.student_submissions for select to authenticated using (exists(select 1 from public.lesson_assignments a where a.id=assignment_id and a.teacher_id=(select auth.uid())));
drop policy if exists submissions_read_student on public.student_submissions;
create policy submissions_read_student on public.student_submissions for select to authenticated using(student_id=(select auth.uid()));
-- No direct student INSERT; API validates, grades, and writes via narrowly scoped security-definer RPC.
create or replace function public.student_get_assignment(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a record; r text; begin
 select role into r from public.profiles where id=auth.uid();
 if r<>'student' then raise exception 'Student account required'; end if;
 select id,title,lesson_snapshot into a from public.lesson_assignments where access_code=upper(trim(p_code)) and is_active=true;
 if not found then return null; end if;
 return jsonb_build_object('id',a.id,'title',a.title,'contentObjectives',a.lesson_snapshot->'contentObjectives','languageObjectives',a.lesson_snapshot->'languageObjectives','vocabulary',a.lesson_snapshot->'vocabulary','slides',a.lesson_snapshot->'slides','quiz',(select jsonb_agg(jsonb_build_object('questionEn',q.item->>'questionEn','choices',q.item->'choices') order by q.idx) from jsonb_array_elements(a.lesson_snapshot->'quiz') with ordinality as q(item,idx)));
end; $$;
create or replace function public.student_submit_quiz(p_assignment uuid,p_answers jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a record; q jsonb; n int; s int:=0; i int; correct int; answer int; existing uuid; details jsonb:='[]'::jsonb; r text; begin
 select role into r from public.profiles where id=auth.uid();
 if r<>'student' then raise exception 'Student account required'; end if;
 select id,lesson_snapshot into a from public.lesson_assignments where id=p_assignment and is_active=true;
 if not found then raise exception 'Assignment not found'; end if;
 select id into existing from public.student_submissions where assignment_id=p_assignment and student_id=auth.uid();
 if existing is not null then raise exception 'Already submitted'; end if;
 q:=a.lesson_snapshot->'quiz';n:=jsonb_array_length(q);
 if n<1 or n>30 or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>n then raise exception 'Invalid quiz size'; end if;
 for i in 0..n-1 loop
  if jsonb_typeof(p_answers->i)<>'number' or (p_answers->>i)::int not between 0 and 3 then raise exception 'Invalid answer'; end if;
  answer:=(p_answers->>i)::int;correct:=(q->i->>'correctIndex')::int;
  if answer=correct then s:=s+1; end if;
  details:=details||jsonb_build_array(jsonb_build_object('answer',answer,'correctIndex',correct,'explanationVi',q->i->>'explanationVi'));
 end loop;
 insert into public.student_submissions(assignment_id,student_id,answers,score,total) values(p_assignment,auth.uid(),p_answers,s,n);
 return jsonb_build_object('score',s,'total',n,'details',details);
end; $$;
revoke all on function public.student_get_assignment(text) from public,anon;
revoke all on function public.student_submit_quiz(uuid,jsonb) from public,anon;
grant execute on function public.student_get_assignment(text) to authenticated;
grant execute on function public.student_submit_quiz(uuid,jsonb) to authenticated;
grant select,insert on public.lesson_assignments to authenticated;
grant select on public.student_submissions to authenticated;
