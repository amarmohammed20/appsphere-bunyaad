-- Local accounts, applied only by `pnpm db:reset` — seeds never run
-- against a hosted project.
--
--   admin@example.com  / password123   (admin)
--   member@example.com / password123   (member)
--
-- Two accounts: role management needs someone to promote, and the last-admin
-- rule needs a second user to be testable. The raw auth.users insert shape is
-- coupled to GoTrue and verified against CLI 2.111 — if a Supabase upgrade
-- breaks db:reset, this file is the first suspect (TODO section 5).

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000',
  account.id,
  'authenticated',
  'authenticated',
  account.email,
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  jsonb_build_object('full_name', account.full_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'admin@example.com', 'Amara Okafor'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'member@example.com', 'Jonas Weber')
) as account (id, email, full_name);

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users
where email in ('admin@example.com', 'member@example.com');

-- The trigger made both members; in production this flip happens once in
-- the dashboard.
update public.profiles set role = 'admin' where email = 'admin@example.com';
