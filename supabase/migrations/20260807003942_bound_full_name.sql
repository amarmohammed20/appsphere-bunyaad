alter table "public"."profiles" add constraint "profiles_full_name_check" CHECK (((char_length(full_name) >= 1) AND (char_length(full_name) <= 100))) not valid;

alter table "public"."profiles" validate constraint "profiles_full_name_check";

set check_function_bodies = off;

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
    -- left() rather than letting the check constraint reject: an oversized name
    -- from a direct REST signup should be trimmed, not turned into a 500.
    left(
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
      100
    ),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$function$
;


