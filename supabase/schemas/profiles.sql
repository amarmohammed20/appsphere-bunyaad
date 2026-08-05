-- Declarative schema: the desired end state, not a change script.
-- Edit this file, then generate the migration:  pnpm db:diff <name>
--
-- One profile per account. The row is created by a trigger when the account
-- is created, so a profile can never be missing and never be forged — there
-- is deliberately no insert policy.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Grants are the table-level door; the RLS policies below choose which rows
-- are visible through it. Signed-in users may read and (policy permitting)
-- manage rows. anon gets nothing — signed-out visitors have no business here.
-- No insert grant: rows are created only by the definer trigger.
grant select, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- SECURITY DEFINER so policies on profiles can ask about roles without
-- recursing into their own table's policies.
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

create policy "own profile is readable"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "admins may read every profile"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- `id <> auth.uid()` is the no-self-change rule: an admin manages others,
-- never their own row. The last-admin rule lives in the server write.
create policy "admins may update other profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin() and id <> (select auth.uid()))
  with check (public.is_admin());

create policy "admins may delete other profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin() and id <> (select auth.uid()));

-- Creates the profile the moment the account exists. Runs as definer, which
-- is why no insert policy is needed or wanted.
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
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Keeps updated_at honest without trusting the caller to set it.
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
