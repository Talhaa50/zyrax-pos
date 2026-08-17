# Phase 1 — Core Reliability & Security Hardening

Completed hardening of the existing POS, inventory, offline storage, sync and authentication foundations.

## Completed

- Atomic offline sale transactions in IndexedDB.
- Stock validation before mutation, preventing overselling.
- Inventory movement records for every sale.
- Local audit events for sales.
- Sale items preserve cost price for future COGS.
- Legacy plaintext local passwords are migrated to PBKDF2-SHA-256 hashes with per-user salts.
- Server passwords are no longer hardcoded in source.
- Server sessions use signed, expiring tokens.
- Arbitrary local/demo tokens are rejected by the server.
- Offline-only sessions do not attempt cloud sync.
- Sync sends authenticated bearer tokens.
- Failed sync actions use exponential retry backoff.
- Sync is oldest-first and stops after the first failure to preserve mutation order.
- Cashiers can sync sales only. Admins can sync product, inventory and sales mutations.
- Sync payloads are size-limited and validated.
- Offline cashier identities are reconciled to the authenticated server user by email during sync.
- Supabase sales use a PostgreSQL transaction function so sale creation, sale items, stock decrement, inventory logging and audit logging commit together.
- Retrying an already-created sale does not decrement stock twice.
- Server-side product and inventory mutations receive audit records.

## Database migration

Run `server/database/migrations/002_phase1_integrity.sql` after the existing initial migration. It adds inventory references, `reorder_level`, `updated_at`, `audit_logs`, and the `apply_sale_atomic()` PostgreSQL function.

## Server environment

Configure `server/.env` using `server/.env.example`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `AUTH_SECRET` with at least 32 random characters
- `RETAILER_ADMIN_PASSWORD`
- `RETAILER_CASHIER_PASSWORD`

Never commit real secrets.

## Remaining limitation

The application still uses a small local demo user model and a server credential model. The next architecture step should replace this with tenant-aware identity, roles and Supabase Auth while preserving offline operation.
