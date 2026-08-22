-- Fix SECURITY DEFINER function search path and execute permissions
alter function public.cleanup_expired_exports() set search_path = public;
revoke execute on function public.cleanup_expired_exports() from public;
revoke execute on function public.cleanup_expired_exports() from anon;
revoke execute on function public.cleanup_expired_exports() from authenticated;
grant execute on function public.cleanup_expired_exports() to service_role;

-- Fix for other existing functions (from user-roles instructions and previous missions)
alter function public.has_role(uuid, public.app_role) set search_path = public;
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

alter function public.delete_user_safely(uuid) set search_path = public;
revoke execute on function public.delete_user_safely(uuid) from public;
grant execute on function public.delete_user_safely(uuid) to service_role;
