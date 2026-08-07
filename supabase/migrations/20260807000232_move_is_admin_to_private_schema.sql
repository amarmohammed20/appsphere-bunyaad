create schema if not exists "private";

drop policy "admins may delete other profiles" on "public"."profiles";

drop policy "admins may read every profile" on "public"."profiles";

drop policy "admins may update other profiles" on "public"."profiles";

drop function if exists "public"."is_admin"();

-- Added by hand: `supabase db diff` (migra engine) emits neither schema-usage
-- grants nor function EXECUTE grants. Without the first line `authenticated`
-- cannot resolve private.is_admin(), so every policy below fails with
-- "permission denied for schema private". See docs/supabase-diff-caveats.md.
grant usage on schema private to authenticated;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$function$
;


  create policy "admins may delete other profiles"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((private.is_admin() AND (id <> ( SELECT auth.uid() AS uid))));



  create policy "admins may read every profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (private.is_admin());



  create policy "admins may update other profiles"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((private.is_admin() AND (id <> ( SELECT auth.uid() AS uid))))
with check (private.is_admin());

grant execute on function private.is_admin() to authenticated;
