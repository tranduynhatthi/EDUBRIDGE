-- EDUBRIDGE 1.6: safely create user profiles with teacher/student roles; never grant admin via signup metadata.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'student' then 'student' else 'teacher' end)
  on conflict (id) do nothing;
  return new;
end;
$$;
-- Non-public trigger function cannot be called from REST.
revoke execute on function public.create_profile_for_new_user() from PUBLIC, anon, authenticated;
