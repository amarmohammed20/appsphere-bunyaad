# What `supabase db diff` silently drops

This repo generates every migration from `supabase/schemas/*.sql` and never
hand-writes one. That workflow has one failure mode: the diff tool omits things
without warning, so a migration can look complete and be missing a line that the
schema file explicitly asked for.

CLAUDE.md already says never to commit a generated migration unread. This file
is what to read it _for_.

## Caught here, on 2026-08-07 (CLI 2.111.0, pg-delta engine)

`supabase/schemas/profiles.sql` contains:

```sql
revoke execute on function public.is_admin() from public, anon, authenticated;
```

`pnpm db:diff harden_profiles` produced a migration with the function bodies,
both triggers, and the table-level revokes — but **not that line**.

Impact if it had shipped: `is_admin()` is `security definer`, so it bypasses RLS.
PostgREST exposes every function in the `public` schema, so it would have stayed
callable by any signed-in user as `POST /rest/v1/rpc/is_admin`.

Fix applied: appended the statement to the generated migration by hand, with a
comment saying why. That is the documented exception to "never edit a
migration" — the tool provably cannot emit it.

This is not a blanket "privileges are ignored" rule. Table-level
`revoke references, trigger, truncate` came through correctly in the same run.
The gap is specific to **function-level `EXECUTE`**.

## What Supabase documents

From [Declarative database schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas),
the diff tool does not capture:

- DML (`insert`, `update`, `delete`)
- View owner and grants, security invoker on views, materialized views
- `alter policy` statements
- Column privileges
- Schema privileges
- Comments
- Partitions
- `alter publication ... add table ...`
- `create domain`
- Grant statements duplicated from default privileges

Function `EXECUTE` privileges are **not** on that list. Either the docs are
incomplete or it is a bug — see "Reporting it" below.

## Checklist for every generated migration

Read the migration against the schema file it came from and confirm:

1. **Every `grant` and `revoke` in the schema appears.** Especially
   `revoke execute on function`. The tool has dropped this.
2. **No grant the schema never asked for.** The tool has previously invented
   default privileges — that is how `authenticated` once ended up without
   `select`/`update`/`delete` while RLS looked correct. RLS chooses rows;
   grants open the table. Both are needed.
3. **Column type changes carry a `using` clause.** `text` to an enum needs
   `alter column role type public.user_role using role::public.user_role`.
   Without it the migration fails on a table that already has rows.
4. **`alter policy` is absent.** Policies are only diffed on create/drop, so an
   edited policy produces nothing. Drop and recreate it in the schema instead.
5. **Comments are absent.** If a comment matters, write it in a migration.

Anything the tool cannot express belongs in a hand-written migration, stated as
such in a comment, with the reason.

## Do not rely on reading alone

Everything else in this repo is enforced by a command. This checklist is
enforced by a person's attention, which does not survive a late Friday and does
not apply at all when an agent generates the migration.

So anything the schema asserts about privileges gets a **behavioural** test in
`scripts/db/verify-reset-db.mjs`, which runs on every `pnpm db:reset`. Assert
the outcome, not the migration text — that stays true across engine and CLI
versions:

> connect as `authenticated`, call `is_admin()`, expect permission denied

That is the check that would have caught this without anyone reading anything.
