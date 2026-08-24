# Repository Instructions

This file applies to the entire repository. Keep each task within its stated scope and follow any future, more-specific `AGENTS.md` or `AGENTS.override.md` that Codex loads for a subdirectory.

## 1. Project purpose and current direction

- Build a SaaS for university circles to manage events, attendance, camps, participants, and candidate facilities while preserving the existing public facility catalog.
- The MVP scope is authentication, circles, members, events, attendance, camp trips, camp participants, and facility candidates.
- Check prerequisite Tasks and approval Gates before entering a later Phase. Do not implement multiple Phases or future Tasks in one request.
- Keep each Task small, reviewable, and reversible.

## 2. Source of truth

- Accepted design decisions live in [ADR 0001](docs/adr/0001-circle-tenancy-and-authorization.md) and [ADR 0002](docs/adr/0002-first-party-facility-catalog.md). Read both before authorization, database, facility, or integration work.
- Accepted ADRs override legacy code and notes. Changing an ADR is a separate Task requiring explicit user approval.
- `supabase_schema.sql` is legacy and is not an actual-database baseline. Never apply the whole file to any database.
- Make database changes only through versioned files in `supabase/migrations/`.
- Never assume the live database matches repository SQL. Inspect live metadata read-only before designing a migration.

## 3. Tenant and authorization invariants

- `circles.id` is the tenant boundary. Except for the `circles` tenant root, every tenant table normally has `circle_id UUID NOT NULL`.
- Use composite foreign keys containing `circle_id` for tenant child relationships; RLS alone is insufficient to prevent cross-circle references.
- Authorize with `auth.uid()` plus an active `circle_members` row. A URL, client state, request `circleId`, LIFF profile/user ID, slug, or arbitrary JWT metadata is never authorization evidence.
- Keep `owner`, `officer`, and `member` capabilities distinct. Never give owner-only operations to officers.
- Never permit self-promotion, officer modification of an owner, or removal/departure of the last active owner.
- Transfer ownership in one locked transaction that verifies all owner invariants. Do not update tenant-row `circle_id` during normal operation.
- UI visibility is not authorization. Recheck identity, active membership, role, input, and target tenant on the server and in RLS.
- Every tenant operation must include cross-tenant denial verification and confirm that denied operations did not change data.

## 4. Security and privacy

- Never store PII in LocalStorage. Never write PII, credentials, session tokens, invitation tokens, or request bodies containing them to browser or server logs.
- Never allow anonymous SELECT of inquiry data or anonymous direct INSERT into inquiry tables.
- Never expose a service-role key in a Client Component, browser bundle, public environment variable, response, or log. Service-role access is server-only and exceptional.
- Never commit API keys, secrets, credentials, tokens, webhook URLs, or real-user information. Do not repeat existing fallback values in output or documentation.
- LIFF user ID is not an authentication principal. Never store a plaintext invitation token; store only a secure hash, with expiry and single-use enforcement.
- Never use Production data for development tests or execute destructive tests with real data.
- Inquiry intake is intentionally paused. Do not restore fields, persistence, notifications, or success UI until an approved authenticated server-storage design, RLS, GRANTs, and negative tests are complete.

## 5. Facility catalog policy

- `facilities` is the first-party source of truth. Public reads are limited to `published = true` and approved related data.
- Facility master data is global; only `camp_facility_candidates` is circle-tenant data.
- Do not use the Rakuten API, Rakuten Travel API, or any other external accommodation API.
- Do not add provider tables/IDs, external API adapters, raw provider responses, synchronization jobs, or provider environment variables.
- Do not propose external accommodation APIs as a future option, candidate, fallback, or deferred feature.
- Changing this policy requires an explicit user decision and a successor ADR.

## 6. Application architecture

- This is Next.js 14 App Router with React 18, TypeScript, Supabase JS, Tailwind CSS, and LIFF. Do not assume uninstalled frameworks or libraries.
- Prefer Server Components. Use Client Components only for the smallest browser-interactive boundary.
- Perform authenticated internal mutations through Server Actions or another explicitly approved server path that preserves the user authorization context. Use Route Handlers for external HTTP endpoints and webhooks.
- Validate all input on the server. Do not trust a client-supplied `circleId`; derive or verify it against the target row and active membership.
- Separate public catalog reads from authenticated tenant mutations. Keep service-role access server-only.
- Avoid unrelated architectural rewrites, mass formatting, or broad refactors.

## 7. Database and migration rules

- Use one small, forward-only, versioned migration per reviewed database change.
- Before applying a migration, verify the exact Supabase project, environment, current metadata, applied history, and intended diff. Production application requires explicit approval immediately after presenting these details.
- Prefer transactional and safely repeatable migrations. Set bounded timeouts where appropriate and document rollback implications.
- For RLS changes, inspect both policies and GRANTs; enabling RLS alone does not prove safety. Verify effective `anon` and `authenticated` privileges.
- Design RLS and composite tenant foreign keys in the same Task as every new tenant table.
- After application, inspect metadata and run actor-based negative tests. A rollback must never restore public PII access.
- Avoid ad-hoc Dashboard DDL. Never apply `supabase_schema.sql` wholesale.

## 8. Testing and quality gates

- Run the smallest checks that cover the change, using installed dependencies only. Report every pass, failure, skipped check, and limitation.
- TypeScript command: `npm run typecheck`. Distinguish pre-existing errors from newly introduced errors and do not let `npx` download anything.
- Production build command: `npm run build` when the change can affect build/runtime behavior. The build runs TypeScript and ESLint checks; do not bypass either gate.
- ESLint is configured through `eslint-config-next`; run `npm run lint` and do not broadly disable rules.
- Vitest is configured for automated regression tests. Run `npm test` for relevant application changes and preserve the inquiry-containment negative tests.
- For catalog changes, smoke-check list, search/filter, detail, and the paused-inquiry notice without sending inquiry data.
- For RLS/authorization changes, test unauthenticated, non-member, member, officer, and owner actors across at least Circle A/B/C. Verify denial and unchanged rows.
- Never hide TypeScript or lint failures by changing ignore settings or weakening types. Missing negative tests are a failed security gate.

## 9. Task discipline

- At task start, read the nearest active instructions, inspect `git status`, and inspect all target files before editing.
- Treat existing dirty or untracked files as user-owned. Do not overwrite, stage, move, delete, reset, or clean them.
- Modify only files required by the current Task. Do not perform unrelated refactors or regenerate files without approval.
- Obtain approval before adding dependencies or performing major upgrades.
- Do not fill unknown requirements, live settings, schema, or security boundaries with guesses. Stop and report ambiguity that affects authorization or data safety.
- Do not repeat completed Tasks or implement the next Task/Phase early.

## 10. External-change approval rules

Only perform the following after the user explicitly approves that exact operation after being shown the target project, environment, and proposed change:

- Production or Preview deployment; Production promotion or rollback.
- Applying database migrations; changing DB objects, RLS, policies, GRANTs, Auth, or Storage settings.
- Changing Vercel environment variables.
- Git commit, push, PR creation, PR merge, or branch/worktree deletion.
- Sending data to an external service or notifying real users.

Read-only audits, requested local file edits, and local validation are allowed within the current Task. Approval for one environment or operation does not authorize another.

## 11. Git and worktree safety

- Start implementation from current remote `main` in a clean, dedicated branch/worktree after confirming its commit and Production relationship.
- Do not merge unrelated/diverged history, pull or merge into a dirty `main`, force-push, use `git reset --hard`, or delete existing worktrees without explicit approval.
- Stage named Task files explicitly; avoid `git add .`. Inspect staged diff before any approved commit.
- Do not use a Production rollback that would revive the pre-containment inquiry collection, LocalStorage fallback, notification logging, or anonymous database access.

## 12. Known legacy state

- Active runtime code is under `app/`, `components/`, and `lib/`; the tracked root-level duplicates and legacy scripts were removed in the approved cleanup Task.
- `next.config.js` does not ignore TypeScript or ESLint failures; `tsconfig.json` remains non-strict. Do not weaken either build gate or hide errors through exclusions.
- ESLint and Vitest are configured, including inquiry-containment regression tests.
- `supabase_schema.sql` contains obsolete anonymous inquiry policies and does not match the live database; it is reference-only legacy.
- Public Supabase and LIFF configuration comes only from the documented `NEXT_PUBLIC_*` environment variables. Missing or invalid configuration must fail closed without creating the related client or external request.
- When valid Supabase configuration is present, the active catalog attempts a read from `public.hotels`; otherwise, or when the read is unavailable, it keeps the first-party catalog in `lib/mockData.ts`.
- Inquiry UI and `/api/notify` are paused. The repository contains `supabase/migrations/20260823121805_emergency_lock_down_inquiries.sql`; repository presence alone does not prove live application state.

## Code Review Rules

- Flag a tenant table without `circle_id`; safe path: add `circle_id UUID NOT NULL`, RLS, and tenant constraints, except on `circles` itself.
- Flag a tenant child relationship without a `circle_id` composite FK; safe path: reference a parent `UNIQUE (id, circle_id)` pair.
- Flag missing RLS, broad GRANTs, or unconditional public policies; safe path: minimum actor/operation policies plus effective-GRANT tests.
- Flag client-only authorization or trust in request `circleId`; safe path: server and RLS checks using `auth.uid()` and active membership.
- Flag service-role browser exposure; safe path: server-only secret use through a narrowly approved path.
- Flag PII in LocalStorage or logs; safe path: authenticated server storage with minimized fields and redacted operational logging.
- Flag plaintext invitation tokens; safe path: cryptographic token, hash-only storage, expiry, and single-use transaction.
- Flag member self-promotion or officer owner-management; safe path: owner-authorized, server-validated role transitions.
- Flag a flow that can leave no active owner; safe path: locked ownership transaction plus commit-time invariant checks.
- Flag unapproved DB, Git, Preview, or Production changes; safe path: present exact target/diff and wait for explicit approval.
- Flag Rakuten or any external accommodation API addition; safe path: first-party `facilities` data only.
- Flag inquiry reopening without approved Auth, server persistence, RLS/GRANTs, and denial tests; safe path: keep intake paused.
- Flag ignored type/lint errors; safe path: run independent checks and fix in scope without weakening configuration.
- Flag missing authorization negative tests; safe path: add actor and cross-tenant denial tests that also verify no data changed.

## 14. Completion report format

At the end of every Task, report:

- Result; changed files and reasons; before/after behavior.
- Checks run, passed/failed tests, and checks that could not be performed.
- Security/tenant-boundary impact and every DB, Vercel, Git, or other external change.
- `git diff --stat`, `git status`, remaining risks, and exactly one recommended next Task.
