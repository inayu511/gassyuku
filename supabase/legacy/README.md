# Quarantined legacy SQL

This directory is an audit archive only. Nothing here is a migration, seed, or
approved database baseline. Do not execute, copy, or adapt the archived SQL.

`supabase_schema.unsafe.sql.txt` preserves the canonical Git blob that was at
the repository root before Task 06. The `.sql.txt` suffix and binary Git
attribute keep it outside normal SQL migration discovery and preserve its
bytes across platforms.

- Source commit: `e4f340bb77004f55328487f91eea7f35de30e5bf`
- Source path: `supabase_schema.sql`
- Canonical size: 2,271 bytes
- SHA-256: `6860055D94FC6F052E3DC70E2F58AB531CF417BBA810F0F1770CAF8A9AD19A8C`

The archived file is unsafe because it does not match the actual database and
includes policies that allowed anonymous access to inquiry PII. The root
`supabase_schema.sql` is now a comment-only warning. Versioned files under
`supabase/migrations/` are the sole source of truth for database changes.
