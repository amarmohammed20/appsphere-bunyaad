-- Declarative: edit this, then `pnpm db:diff <name>` — never the migration.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- No insert grant and no insert policy: rows exist only via the signup
-- trigger, so a profile can never be forged. anon gets nothing.
grant select, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- Default privileges grant more than asked; revoke so the generated
-- migration matches this file, not the defaults.
revoke truncate, references, trigger on public.profiles from anon, authenticated;

-- DEFINER so policies can ask about roles without recursing into their own
-- table's policies.
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Policies still evaluate it; a definer function that bypasses RLS should
-- not also be a public RPC endpoint.
revoke execute on function public.is_admin() from public, anon, authenticated;

create policy "own profile is readable"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "admins may read every profile"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- id <> auth.uid(): admins manage others, never their own row.
create policy "admins may update other profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin() and id <> (select auth.uid()))
  with check (public.is_admin());

create policy "admins may delete other profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin() and id <> (select auth.uid()));

-- The wall for the last-admin rule — holds even against direct REST calls.
-- The advisory lock serialises concurrent demotions so both cannot read "2".
create function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and (tg_op = 'DELETE' or new.role is distinct from 'admin') then
    perform pg_advisory_xact_lock(hashtext('public.profiles.last_admin'));

    if (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'There must always be at least one admin';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger profiles_protect_last_admin
  before update or delete on public.profiles
  for each row
  execute function public.protect_last_admin();

-- Runs as definer, which is how rows appear despite no insert policy.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Without this an auth email change leaves profiles.email stale forever.
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  execute function public.sync_profile_email();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();
