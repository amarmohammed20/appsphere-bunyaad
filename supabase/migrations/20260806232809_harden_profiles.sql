revoke references on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.protect_last_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role is distinct from 'admin') then
    perform pg_advisory_xact_lock(hashtext('public.profiles.last_admin'));

    if (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'There must always be at least one admin';
    end if;
  end if;

  return coalesce(new, old);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_profile_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$function$
;

CREATE TRIGGER profiles_protect_last_admin BEFORE DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();

CREATE TRIGGER on_auth_user_email_changed AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();



-- Added by hand: `supabase db diff` does not compare function-level EXECUTE
-- privileges, so it silently drops this line from supabase/schemas/profiles.sql.
-- Without it, is_admin() stays callable over PostgREST as /rest/v1/rpc/is_admin.
revoke execute on function public.is_admin() from public, anon, authenticated;
