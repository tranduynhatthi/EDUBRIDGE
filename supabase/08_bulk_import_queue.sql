-- EDUBRIDGE 1.8: prerequisite migrations 01-07. No paid API calls.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table if not exists private.edubridge_worker_secret(singleton boolean primary key default true check(singleton),token text not null);
revoke all on private.edubridge_worker_secret from public,anon,authenticated;
insert into private.edubridge_worker_secret(singleton,token)
values(true,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','')) on conflict(singleton) do nothing;
create table if not exists public.edubridge_import_batches(
id uuid primary key default gen_random_uuid(),textbook_id uuid not null references public.textbooks(id) on delete cascade,
created_by uuid not null references auth.users(id),
status text not null default 'paused' check(status in ('paused','running','completed','completed_with_errors','cancelled')),
approved_at timestamptz,created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),finished_at timestamptz,
constraint approved_to_run check(status<>'running' or approved_at is not null));
create unique index if not exists edubridge_one_active_batch_per_book on public.edubridge_import_batches(textbook_id) where status in ('paused','running');
create table if not exists public.edubridge_import_jobs(
id uuid primary key default gen_random_uuid(),batch_id uuid not null references public.edubridge_import_batches(id) on delete cascade,
textbook_lesson_id uuid not null references public.textbook_lessons(id) on delete cascade,
sort_order integer not null,status text not null default 'queued' check(status in ('queued','processing','review_required','published','failed','skipped')),
attempts integer not null default 0 check(attempts between 0 and 3),lease_token text,lease_until timestamptz,retry_at timestamptz not null default now(),
error_code text,warnings jsonb not null default '[]'::jsonb,partial_text text not null default '',extracted_chars integer not null default 0,
started_at timestamptz,completed_at timestamptz,updated_at timestamptz not null default now(),
unique(batch_id,textbook_lesson_id),constraint edubridge_job_processing_lease check((status='processing') = (lease_token is not null)));
create index if not exists edubridge_import_jobs_queue on public.edubridge_import_jobs(batch_id,status,retry_at,sort_order);
create index if not exists edubridge_review_ready on public.textbook_lessons(textbook_id,sort_order) where is_published;
create index if not exists edubridge_library_lookup on public.textbooks(subject,grade,is_active);
alter table public.edubridge_import_batches enable row level security;
alter table public.edubridge_import_jobs enable row level security;
drop policy if exists edubridge_admin_read_batches on public.edubridge_import_batches;
create policy edubridge_admin_read_batches on public.edubridge_import_batches for select to authenticated using ((select public.is_edubridge_admin()));
drop policy if exists edubridge_admin_read_jobs on public.edubridge_import_jobs;
create policy edubridge_admin_read_jobs on public.edubridge_import_jobs for select to authenticated using ((select public.is_edubridge_admin()));
revoke all on public.edubridge_import_batches,public.edubridge_import_jobs from public,anon,authenticated;
grant select on public.edubridge_import_batches,public.edubridge_import_jobs to authenticated;
grant all on public.edubridge_import_batches,public.edubridge_import_jobs to service_role;

CREATE OR REPLACE FUNCTION public.edubridge_check_worker_token(p_token text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select exists(select 1 from private.edubridge_worker_secret
 where singleton and token=p_token and char_length(p_token)=64);
$function$;

CREATE OR REPLACE FUNCTION public.edubridge_claim_job(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_batch uuid; v_job record; v_lease text;
begin
 if not public.edubridge_check_worker_token(p_token) then raise exception 'INVALID_WORKER_TOKEN'; end if;
 -- Serialize claims on a batch row: never process more than one lesson per book concurrently.
 select b.id into v_batch from public.edubridge_import_batches b
 where b.status='running' order by b.created_at for update skip locked limit 1;
 if v_batch is null then return null; end if;
 update public.edubridge_import_jobs set
  status=case when attempts>=3 then 'failed' else 'queued' end,
  error_code='WORKER_LEASE_EXPIRED',
  lease_token=null,lease_until=null,
  retry_at=now()+interval '2 minutes',
  updated_at=now()
 where batch_id=v_batch and status='processing' and lease_until<now();
 if exists(select 1 from public.edubridge_import_jobs where batch_id=v_batch and status='processing') then return null; end if;
 select j.id,j.textbook_lesson_id,l.title,l.start_page,l.end_page,
   b.storage_path,b.page_count,b.title as book_title
 into v_job
 from public.edubridge_import_jobs j
 join public.textbook_lessons l on l.id=j.textbook_lesson_id
 join public.textbooks b on b.id=l.textbook_id
 where j.batch_id=v_batch and j.status='queued' and j.attempts<3 and j.retry_at<=now()
 order by j.sort_order limit 1 for update of j skip locked;
 if not found then
  if not exists(select 1 from public.edubridge_import_jobs where batch_id=v_batch and status in ('queued','processing')) then
   update public.edubridge_import_batches set status=case when exists(
    select 1 from public.edubridge_import_jobs where batch_id=v_batch and status='failed'
   ) then 'completed_with_errors' else 'completed' end,
   finished_at=now(),updated_at=now() where id=v_batch;
  end if;
  return null;
 end if;
 if exists(select 1 from public.textbook_lessons where id=v_job.textbook_lesson_id and (is_published or length(trim(source_text))>=250)) then
  update public.edubridge_import_jobs set status='skipped',updated_at=now(),completed_at=now() where id=v_job.id;
  return null;
 end if;
 v_lease:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 update public.edubridge_import_jobs set status='processing',attempts=attempts+1,
  lease_token=v_lease,lease_until=now()+interval '180 seconds',
  started_at=now(),updated_at=now(),error_code=null where id=v_job.id;
 return jsonb_build_object('id',v_job.id,'lessonId',v_job.textbook_lesson_id,'title',v_job.title,
  'bookTitle',v_job.book_title,'storagePath',v_job.storage_path,'pageCount',v_job.page_count,
  'startPage',v_job.start_page,'endPage',v_job.end_page,'lease',v_lease,'batchId',v_batch);
end; $function$;

CREATE OR REPLACE FUNCTION public.edubridge_control_batch(p_batch_id uuid, p_action text, p_approve_cost boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_batch public.edubridge_import_batches%rowtype;
begin
 if (select auth.uid()) is null or not public.is_edubridge_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 select * into v_batch from public.edubridge_import_batches where id=p_batch_id for update;
 if not found then raise exception 'BATCH_NOT_FOUND'; end if;
 if p_action='start' then
   if not p_approve_cost then raise exception 'EXPLICIT_COST_APPROVAL_REQUIRED'; end if;
   if v_batch.status<>'paused' then raise exception 'BATCH_NOT_PAUSED'; end if;
   update public.edubridge_import_batches set status='running',
     approved_at=coalesce(approved_at,now()),updated_at=now(),finished_at=null where id=p_batch_id;
 elsif p_action='pause' then
   if v_batch.status<>'running' then raise exception 'BATCH_NOT_RUNNING'; end if;
   update public.edubridge_import_batches set status='paused',updated_at=now() where id=p_batch_id;
 elsif p_action='cancel' then
   if v_batch.status not in ('paused','running') then raise exception 'BATCH_ALREADY_FINISHED'; end if;
   update public.edubridge_import_batches set status='cancelled',updated_at=now(),finished_at=now() where id=p_batch_id;
 elsif p_action='retry' then
   if not p_approve_cost then raise exception 'EXPLICIT_COST_APPROVAL_REQUIRED'; end if;
   if v_batch.status not in ('completed_with_errors','paused','completed') then raise exception 'BATCH_NOT_RETRYABLE'; end if;
   update public.edubridge_import_jobs set status='queued',attempts=0,retry_at=now(),error_code=null,
     lease_token=null,lease_until=null,updated_at=now()
   where batch_id=p_batch_id and status='failed';
   update public.edubridge_import_batches set status='running',approved_at=coalesce(approved_at,now()),
     updated_at=now(),finished_at=null where id=p_batch_id;
 else raise exception 'INVALID_BATCH_ACTION'; end if;
 return p_action;
end; $function$;

CREATE OR REPLACE FUNCTION public.edubridge_finish_job(p_token text, p_job_id uuid, p_lease text, p_source_text text DEFAULT ''::text, p_warnings jsonb DEFAULT '[]'::jsonb, p_error_code text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_job public.edubridge_import_jobs%rowtype; v_status text; v_updated integer;
 v_length integer:=length(coalesce(p_source_text,'')); v_err text;
begin
 if not public.edubridge_check_worker_token(p_token) then raise exception 'INVALID_WORKER_TOKEN'; end if;
 select * into v_job from public.edubridge_import_jobs
 where id=p_job_id and status='processing' and lease_token=p_lease for update;
 if not found then return 'STALE_RESULT'; end if;
 if not exists(select 1 from public.edubridge_import_batches where id=v_job.batch_id and status='running') then
  update public.edubridge_import_jobs set status='queued',lease_token=null,lease_until=null,
   retry_at=now(),updated_at=now() where id=v_job.id;
  return 'BATCH_NOT_RUNNING';
 end if;
 v_err:=nullif(left(coalesce(p_error_code,''),80),'');
 if v_err is null and v_length>=250 and v_length<=30000 then
  update public.textbook_lessons set source_text=p_source_text,
    extraction_note=left('Bản nháp AI xử lý hàng loạt, CHƯA ĐƯỢC DUYỆT. '||
    coalesce((select string_agg(left(value,150),' | ') from jsonb_array_elements_text(
    case when jsonb_typeof(p_warnings)='array' then p_warnings else '[]'::jsonb end) t(value)),''),1500)
  where id=v_job.textbook_lesson_id and source_text='' and not is_published;
  get diagnostics v_updated=row_count;
  v_status:=case when v_updated=1 then 'review_required' else 'skipped' end;
  update public.edubridge_import_jobs set status=v_status,lease_token=null,lease_until=null,
   error_code=null,extracted_chars=v_length,warnings=case when jsonb_typeof(p_warnings)='array' then p_warnings else '[]'::jsonb end,
   partial_text='',updated_at=now(),completed_at=now() where id=v_job.id;
 else
  if v_err is null then v_err:=case when v_length<250 then 'EXTRACTION_TOO_SHORT' else 'EXTRACTION_TOO_LONG' end; end if;
  v_status:=case when v_job.attempts>=3 then 'failed' else 'queued' end;
  update public.edubridge_import_jobs set status=v_status,lease_token=null,lease_until=null,
   error_code=v_err,extracted_chars=v_length,partial_text=left(coalesce(p_source_text,''),30000),
   warnings=case when jsonb_typeof(p_warnings)='array' then p_warnings else '[]'::jsonb end,
   retry_at=now()+make_interval(mins=>greatest(v_job.attempts*2,2)),updated_at=now(),
   completed_at=case when v_status='failed' then now() else null end where id=v_job.id;
 end if;
 if not exists(select 1 from public.edubridge_import_jobs where batch_id=v_job.batch_id and status in ('queued','processing')) then
  update public.edubridge_import_batches set status=case when exists(
   select 1 from public.edubridge_import_jobs where batch_id=v_job.batch_id and status='failed'
  ) then 'completed_with_errors' else 'completed' end,
  finished_at=now(),updated_at=now() where id=v_job.batch_id and status='running';
 end if;
 return v_status;
end; $function$;

CREATE OR REPLACE FUNCTION public.edubridge_import_published_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.is_published and not old.is_published then
  update public.edubridge_import_jobs set status='published',updated_at=now(),completed_at=now()
  where textbook_lesson_id=new.id and status in ('review_required','skipped');
 end if;
 return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.edubridge_stage_batch(p_book_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_id uuid; v_uid uuid := (select auth.uid()); v_total integer;
begin
 if v_uid is null or not public.is_edubridge_admin() then raise exception 'ADMIN_REQUIRED'; end if;
 if not exists(select 1 from public.textbooks where id=p_book_id and is_active) then raise exception 'BOOK_NOT_FOUND'; end if;
 select id into v_id from public.edubridge_import_batches
 where textbook_id=p_book_id and status in ('paused','running') order by created_at desc limit 1;
 if v_id is not null then return v_id; end if;
 select count(*) into v_total from public.textbook_lessons where textbook_id=p_book_id;
 if v_total=0 then raise exception 'NO_LESSON_CATALOG'; end if;
 insert into public.edubridge_import_batches(textbook_id,created_by,status)
 values(p_book_id,v_uid,'paused') returning id into v_id;
 insert into public.edubridge_import_jobs(batch_id,textbook_lesson_id,sort_order,status)
 select v_id,l.id,l.sort_order,
 case when l.is_published then 'published' when length(trim(l.source_text)) >= 250 then 'review_required' else 'queued' end
 from public.textbook_lessons l where l.textbook_id=p_book_id;
 return v_id;
end; $function$;

drop trigger if exists edubridge_sync_batch_publication on public.textbook_lessons;
create trigger edubridge_sync_batch_publication after update of is_published on public.textbook_lessons for each row
execute function public.edubridge_import_published_sync();
revoke all on function public.edubridge_stage_batch(uuid),public.edubridge_control_batch(uuid,text,boolean) from public,anon;
grant execute on function public.edubridge_stage_batch(uuid),public.edubridge_control_batch(uuid,text,boolean) to authenticated;
revoke all on function public.edubridge_check_worker_token(text),
public.edubridge_claim_job(text),public.edubridge_finish_job(text,uuid,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.edubridge_check_worker_token(text),
public.edubridge_claim_job(text),public.edubridge_finish_job(text,uuid,text,text,jsonb,text) to service_role;
revoke all on function public.edubridge_import_published_sync() from public,anon,authenticated;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.schedule('edubridge-bulk-worker-every-minute','* * * * *',$job$
select net.http_post(
url:='https://rliaepxtcnjpgeagxmxi.supabase.co/functions/v1/edubridge-bulk-worker',
headers:=jsonb_build_object('Content-Type','application/json',
'x-edubridge-worker-token',(select token from private.edubridge_worker_secret where singleton)),
body:='{}'::jsonb,timeout_milliseconds:=5000)
where exists(select 1 from public.edubridge_import_batches where status='running');
$job$);
