# Database migration workflow

## Scope and authority

`supabase/migrations/` is the only database-change source of truth. Accepted
ADRs and the nearest `AGENTS.md` override legacy SQL, application assumptions,
and Dashboard state. A migration Task starts with a read-only metadata audit;
it never assumes that repository SQL matches a hosted database.

Environment names are not interchangeable:

- **Development**: local Supabase or a separately approved disposable hosted
  development project.
- **Preview**: a hosted branch or project used for review. It is not
  Production and still requires an exact-target approval for changes.
- **Production**: the live project and database branch. Every apply, history
  repair, rollback, Auth/Storage change, or destructive operation requires an
  explicit approval immediately after the target and proposed diff are shown.

Approval for one environment or command does not authorize another.

## Migration files

- Use the CLI-generated format `<14-digit UTC timestamp>_<purpose>.sql`.
- Use lower snake case for `<purpose>` and describe one purpose only.
- Keep migrations small, reviewable, forward-only, and ordered by version.
- Never edit, rename, delete, squash, or reorder an applied migration.
- Fix an applied migration with a later forward migration.
- Keep schema and data migrations separate. Never copy Production rows into a
  migration or seed.
- Do not introduce future-phase tables while establishing an earlier baseline.

Use a transaction when PostgreSQL supports it. Set bounded `lock_timeout` and
`statement_timeout` values appropriate to the operation. Document operations
that cannot run in a transaction and split them into a separately approved
migration.

Split destructive work into reviewable stages: add the replacement shape,
backfill with a separately reviewed data migration, switch readers/writers,
verify, and only then remove obsolete objects in a later Task. A rollback must
never restore anonymous access to PII.

## Local development

Use an approved, pinned CLI and state the target explicitly. Task 06 was
verified with Supabase CLI `2.115.0`, Docker Desktop `4.87.0`, and Postgres
`17`.

```powershell
supabase start
supabase migration new <purpose>
supabase db reset --local --no-seed
supabase db reset --local --no-seed
supabase migration list --local
supabase db diff --local --schema public
```

`supabase start` and both resets must run from the Task worktree. Fresh reset
must apply every migration in version order without the legacy archive. The
second reset must produce the same application-schema metadata as the first.
The public-schema diff must be empty, or every platform-managed difference
must be identified and reviewed. A diff engine output is a draft, not approval
to apply SQL.

Seed execution is disabled for Task 06. A future seed must be synthetic,
contain no PII, credentials, tokens, or copied Production data, and be approved
as its own change.

## RLS, grants, and tenant verification

Enabling RLS does not establish safety by itself. For every affected table:

1. Inspect `relrowsecurity` and `relforcerowsecurity`.
2. List every policy, command, role, `USING`, and `WITH CHECK` expression.
3. Inspect object ACLs and effective privileges for `anon`, `authenticated`,
   and any approved server role.
4. Verify server authorization uses `auth.uid()` plus an active
   `circle_members` row.
5. Verify tenant-child relationships use composite foreign keys containing
   `circle_id`.

Authorization changes require unauthenticated, non-member, member, officer,
and owner actors across at least Circle A, B, and C. Cross-circle operations
must be denied, and each denial test must also prove that no row was inserted,
updated, or deleted. UI visibility and a successful build are not authorization
evidence.

## Drift and migration history

Use three independent comparisons:

- repository migrations versus a fresh local reset;
- fresh local application-schema metadata versus hosted metadata;
- local migration versions versus
  `supabase_migrations.schema_migrations`.

Normal schema work must not use Dashboard SQL. If an emergency requires manual
SQL, immediately capture the exact SQL in a versioned migration, verify the
post-change metadata, and reconcile repository history only after a separate
approval. Do not modify the emergency migration to make a fresh reset pass.

`supabase migration list` compares version timestamps, not SQL equivalence.
`supabase migration repair <version> --status applied|reverted` changes hosted
migration history; it does not prove that the corresponding SQL state exists.
Before repair, compare the exact schema, policies, grants, and constraints.

## Linking and hosted operations

Do not keep a remote link merely for convenience. Before linking, present and
verify the project name, project reference, database branch, environment, and
current source commit. Never print access tokens, database passwords, API
keys, connection strings, or service-role keys.

After exact-target approval, link with the reviewed project reference and
immediately verify the selected target. Preview pending migrations before
requesting approval to apply them. Do not use a linked reset against
Production.

Production application requires a second, immediate approval after presenting:

- exact project and branch;
- applied and pending migration versions;
- reviewed SQL and intended object diff;
- lock and statement timeouts;
- expected availability impact;
- verification and forward-fix plan.

After an approved apply or history repair, re-read hosted metadata, rerun
actor-based negative tests, verify denied operations changed no data, and
record the final history. Never treat a CLI success message as sufficient.

## Task 06 audited reconciliation state

Read-only audit date: 2026-08-24.

- Project: `gassyuku`
- Project reference: `dsbkljorrysqtangcmeh`
- Database branch: `main` (Production)
- Application-owned relations: `public.inquiries` and
  `public.inquiries_id_seq`
- RLS: enabled on `public.inquiries`
- Policies: zero
- `anon`: no table or sequence privileges
- Hosted migration history table: absent
- Local baseline version: `20260823120000`
- Emergency version: `20260823121805`

The hosted schema already matches the state represented by the baseline, and
the emergency SQL state is present, but neither version is recorded. Therefore
Task 06 does not propose a hosted schema apply. The future reconciliation is a
history-only change: after re-auditing the same metadata and obtaining explicit
approval for this exact Production target, mark both versions as applied with
`migration repair`. That operation will create or update hosted migration
history and must not be run as part of Task 06.

## Completion report

Every migration Task reports:

- result and before/after behavior;
- changed files and reasons;
- CLI, Docker, Postgres, and migration versions used;
- all checks, passes, failures, skipped checks, and limitations;
- RLS, policy, grant, tenant-boundary, and PII impact;
- fresh reset and schema-diff results;
- hosted drift and history classification;
- every DB, Vercel, Git, deployment, or other external change;
- `git diff --stat`, `git status`, remaining risks, and exactly one recommended
  next Task.
