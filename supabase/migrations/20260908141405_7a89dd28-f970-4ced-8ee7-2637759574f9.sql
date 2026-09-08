
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke all on function public.claim_admin() from public, anon;
grant execute on function public.claim_admin() to authenticated;
revoke all on function public.disponibilidade(uuid, date, date) from public;
grant execute on function public.disponibilidade(uuid, date, date) to anon, authenticated;
