# Supabase migration operations

## Source of truth

- Versioned files in `supabase/migrations/` are the sole source of truth for
  database changes.
- Never execute the root `supabase_schema.sql` or anything under
  `supabase/legacy/`. The latter is an unsafe audit archive only.
- Never edit, rename, reorder, or replace an applied migration. Add a small
  forward-fix migration instead.
- In particular, do not change
  `20260823121805_emergency_lock_down_inquiries.sql`.

## Local prerequisites

Use an explicitly approved, version-pinned Supabase CLI and a running
Docker-compatible runtime. Task 06 was verified with Supabase CLI `2.115.0`,
Docker Desktop `4.87.0`, and Postgres `17`. Do not let an unpinned `npx`
command download a CLI implicitly.

The committed `config.toml` is local-only configuration. It does not link this
repository to a hosted project, and seed execution is disabled.

## Create one migration

1. Confirm the worktree is clean enough to identify only the intended change.
2. Read the nearest `AGENTS.md` and the accepted ADRs.
3. Reinspect the target database metadata without reading application rows.
4. Create one lower-snake-case migration for one purpose:

   ```powershell
   supabase migration new <purpose>
   ```

5. Review the generated timestamp and SQL. Use a transaction and bounded
   timeouts when supported by the operation.

## Validate locally

Run all commands from the repository root and state `--local` explicitly:

```powershell
supabase start
supabase db reset --local --no-seed
supabase db reset --local --no-seed
supabase migration list --local
supabase db diff --local --schema public
```

Both resets must succeed in version order. The second reset must produce the
same application-schema metadata as the first, and the public-schema diff must
be empty or have a reviewed platform-only explanation. Inspect RLS, policies,
and effective `anon` and `authenticated` grants separately.

## Hosted environments and approval

Development, Preview, and Production are distinct targets. Before any link,
push, repair, or hosted reset:

1. Present the exact project name, project reference, database branch,
   environment, current migration history, proposed command, and intended
   metadata diff.
2. Obtain explicit approval for that exact operation and target.
3. Link only after approval and recheck the linked target before continuing.
4. Preview pending migrations before requesting approval to apply them.

After an approved application, re-read metadata and run actor-based denial
tests, including cross-circle denial and unchanged-row verification. A
successful command alone is not proof of safe RLS.

## Seeds

Task 06 has no seed. Never copy Production data into a local seed. Any future
seed must be synthetic, contain no PII or secrets, and be reviewed separately.

See `docs/database/migration-workflow.md` for the full workflow and the current
remote-history reconciliation status.
