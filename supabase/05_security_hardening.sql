-- EDUBRIDGE: function grants hardened after migrations 01-04.
-- Trigger function should not be directly callable via REST API.
REVOKE EXECUTE ON FUNCTION public.create_profile_for_new_user() FROM PUBLIC, anon, authenticated;
-- Admin helper required by RLS policies for logged-in users only.
REVOKE EXECUTE ON FUNCTION public.is_edubridge_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_edubridge_admin() TO authenticated;
