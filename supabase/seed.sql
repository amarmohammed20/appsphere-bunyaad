-- Local development accounts. Applied only by `pnpm db:reset` — seeds never
-- run against a hosted project, so nothing here can reach production.
--
--   admin@example.com  / password123   (admin)
--   member@example.com / password123   (member)
--
-- Two accounts because role management cannot be demonstrated with one:
-- there must be someone to promote, and the last-admin rule needs a second
-- user to even be testable.

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
  gen_random_uuid(),
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
    ('admin@example.com', 'Amara Okafor'),
    ('member@example.com', 'Jonas Weber')
) as account (email, full_name);

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

-- The trigger created both profiles as members; the first admin is appointed
-- here. In production this step is the one-time role flip in the dashboard.
update public.profiles set role = 'admin' where email = 'admin@example.com';
