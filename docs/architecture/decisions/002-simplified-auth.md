# ADR 002: Simplified Auth for Student MVP

## Status

Accepted (replaces complex RBAC design)

## Decision

Use **role-based checks only** — no separate permissions table.

Use **basic refresh tokens** — store hash in DB, revoke on logout, no families or rotation.

## Reason

The project must be explainable by a second-year engineering student in a review. Fewer tables and fewer security patterns means clearer viva answers without sacrificing a working login system.

## What we kept

- JWT access tokens (short-lived)
- Refresh tokens (long-lived, stored as hash)
- bcrypt password hashing
- 4 roles in a `roles` table
- `authenticate` + `requireRole` middleware

## What we removed

- `permissions` and `role_permissions` tables
- Refresh token families and reuse detection
- Token rotation on every refresh
- Login rate limiting
