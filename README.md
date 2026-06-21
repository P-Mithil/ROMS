# ROMS — Recruitment to Onboarding Management System

Phase 1 hiring platform built as a **modular monolith** with React, Express, PostgreSQL, and Prisma.

## Sprint 0 Scope

Foundation only — no authentication, RBAC, or domain modules yet.

- pnpm monorepo (`apps/client`, `apps/server`, `packages/shared`)
- Express API with health check
- React + Vite client with API status page
- PostgreSQL via Docker
- Prisma ORM with baseline migration

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 9 (`npm install -g pnpm`)
- **Docker Desktop** (for PostgreSQL)

## Quick Start

```powershell
# 1. Clone and enter the repo
cd e:\ROMS

# 2. Copy environment variables
copy .env.example .env

# 3. Install dependencies
pnpm install

# 4. Start PostgreSQL
pnpm db:up

# 5. Run database migrations
pnpm db:migrate

# 6. Start client + server
pnpm dev
```

Or use the all-in-one Windows script:

```powershell
.\scripts\dev.ps1
```

## URLs

| Service | URL |
|---------|-----|
| Client | http://localhost:5173 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/v1/health |
| pgAdmin (optional) | http://localhost:5050 |

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start client and server concurrently |
| `pnpm build` | Build all workspaces |
| `pnpm typecheck` | TypeScript check all workspaces |
| `pnpm lint` | ESLint all workspaces |
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop Docker Compose services |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Project Structure

```
roms/
├── apps/
│   ├── client/          # React + Vite frontend
│   └── server/          # Express + Prisma API
├── packages/
│   └── shared/          # Shared TypeScript types
├── docs/                # Architecture decisions
├── scripts/             # Dev utilities
└── docker-compose.yml   # PostgreSQL + pgAdmin
```

## Environment Variables

See [`.env.example`](.env.example). Copy to `.env` before running.

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default `3001`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Allowed frontend origin |
| `VITE_API_URL` | API base URL for the client |

## Verify Health Endpoint

```powershell
curl http://localhost:3001/api/v1/health
```

Expected response (database connected):

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-06-21T12:00:00.000Z"
  }
}
```

The home page at http://localhost:5173 also displays the API health status.

## Next: Sprint 1

Authentication, RBAC, user management, and Prisma domain models for roles and users.
