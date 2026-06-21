# ADR 001: Prisma ORM

## Status

Accepted

## Context

ROMS requires type-safe database access with versioned schema migrations. The Phase 1 architecture originally considered raw SQL with the `pg` driver. Sprint 0 adopts Prisma ORM to accelerate development while maintaining migration history and type safety.

## Decision

Use **Prisma ORM** in `apps/server` as the sole database access layer for the modular monolith.

- Schema is defined in `apps/server/prisma/schema.prisma`
- Migrations live in `apps/server/prisma/migrations/`
- A singleton `PrismaClient` is exported from `apps/server/src/db/prisma.ts`
- Future domain modules implement repository patterns on top of `PrismaClient`

## Consequences

### Positive

- Auto-generated TypeScript types for all models
- Declarative schema with migration history
- `$queryRaw` remains available for complex reporting queries
- Prisma Studio for local debugging

### Negative

- Team must learn Prisma migration workflow
- Some advanced SQL may require raw queries or Prisma extensions
- Schema and migrations are coupled to the server app (acceptable for modular monolith)

## Alternatives Considered

| Alternative | Reason rejected |
|-------------|-----------------|
| Raw SQL + `pg` | More boilerplate; no auto-generated types |
| Drizzle ORM | Valid option; Prisma chosen for ecosystem maturity |
| TypeORM | Heavier abstraction; less predictable migrations |
