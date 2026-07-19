# ROMS — Simple Architecture Guide

This project is built as a **student-friendly MVP**. Every part below can be explained in a viva or review meeting.

## What the system does

ROMS helps a company manage hiring. Sprint 1 adds **login** and **user management**.

## Tech stack (and why)

| Tool | Why we use it |
|------|----------------|
| **React** | Frontend UI |
| **Express** | HTTP API server — easy to learn |
| **PostgreSQL** | Relational database — stores users, roles, etc. |
| **Prisma** | Talks to PostgreSQL using TypeScript types auto-generated from the schema |
| **JWT** | Short-lived access token sent with each API request |

## Database tables (5 tables)

```
Role ──< User >── Department
              │
              └──< RefreshToken
```

| Table | What it stores |
|-------|----------------|
| `roles` | 4 fixed roles: HR_ADMIN, RECRUITER, HIRING_MANAGER, INTERVIEWER |
| `departments` | Company departments (Engineering, HR, Sales) |
| `users` | Login email, hashed password, name, role, department |
| `refresh_tokens` | Hash of long-lived refresh token (not the raw token) |

**Why a separate `roles` table?**  
So each user points to one role via `role_id`. Easy to query and explain in an ER diagram.

**Why no `permissions` table?**  
For an MVP, we check the user's **role name** directly (e.g. only `HR_ADMIN` can create users). Simpler than a permission matrix.

## Authentication flow

### 1. Login
1. User sends email + password to `POST /auth/login`
2. Server finds user in database
3. Server compares password with `bcrypt` hash
4. Server creates a **JWT access token** (expires in 15 minutes)
5. Server creates a **refresh token** (random string), stores its **hash** in DB, sends it as an HTTP-only cookie
6. Client keeps access token in memory and sends it as `Authorization: Bearer <token>`

### 2. Accessing protected routes
1. Client sends request with Bearer token
2. `authenticate` middleware verifies JWT signature and expiry
3. `requireRole` middleware checks if user's role is allowed (e.g. HR_ADMIN only)

### 3. Refresh (when access token expires)
1. Client calls `POST /auth/refresh` with the refresh cookie
2. Server looks up token hash in database
3. If valid and not expired/revoked → issues a **new access token**
4. Same refresh token keeps working until logout or expiry (no rotation)

### 4. Logout
1. Client calls `POST /auth/logout`
2. Server marks refresh token as `revokedAt` in database
3. Cookie is cleared

## What we removed (on purpose)

| Removed | Why |
|---------|-----|
| Permission tables | Role checks are enough for MVP |
| Token families / reuse detection | Advanced security — not needed for college project |
| Login rate limiting | Extra complexity |
| Token rotation on refresh | Same refresh token is simpler to explain |
| IP / user-agent tracking on tokens | Not needed for MVP |

## Folder structure (server)

```
apps/server/src/
├── modules/
│   ├── auth/       # login, refresh, logout
│   ├── users/      # CRUD users (HR Admin only)
│   └── departments/
├── middleware/
│   ├── authenticate.ts   # checks JWT
│   └── require-role.ts   # checks role name
├── db/prisma.ts          # database connection
└── routes/v1/            # mounts all API routes
```

Each module has: `routes → controller → service → repository`

- **Routes** — URL paths
- **Controller** — reads HTTP request, sends response
- **Service** — business logic
- **Repository** — database queries (Prisma)

## Demo users

| Email | Role | Password |
|-------|------|----------|
| admin@roms.local | HR_ADMIN | RomsDev123! |
| recruiter@roms.local | RECRUITER | RomsDev123! |
| hm@roms.local | HIRING_MANAGER | RomsDev123! |
| interviewer@roms.local | INTERVIEWER | RomsDev123! |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL 18** installed locally on Windows and running as a Windows service

## Local PostgreSQL setup (Windows)

ROMS uses a local PostgreSQL instance for development. Docker is not required.

### 1. Install PostgreSQL 18

Install PostgreSQL 18 for Windows and note the password you set for the `postgres` superuser during setup. The installer registers a Windows service (for example `postgresql-x64-18`) that should start automatically.

Verify the service is running:

```powershell
Get-Service postgresql*
```

Or open **services.msc** and confirm the PostgreSQL service status is **Running**.

### 2. Create the development database

Open **SQL Shell (psql)** or any PostgreSQL client connected as `postgres`, then run:

```sql
CREATE DATABASE roms_dev;
```

### 3. Configure environment variables

From the project root:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL` with your local credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/roms_dev
```

Replace `YOUR_PASSWORD` with the password you chose during PostgreSQL installation.

### 4. Enable AI features (optional — Groq)

AI features (resume parsing, match scores, JD generation, insights, etc.) use **Groq** by default. Groq exposes an OpenAI-compatible API, so the server talks to it through the standard OpenAI SDK — only environment variables differ.

1. Create a free API key at https://console.groq.com/keys
2. Add it to the root `.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

Defaults when `AI_PROVIDER=groq` (no further config needed):

| Setting | Value |
|---------|-------|
| Model | `llama-3.3-70b-versatile` |
| Base URL | `https://api.groq.com/openai/v1` |

Optional overrides: `AI_MODEL`, `AI_BASE_URL`, `AI_TIMEOUT_MS` (default 45000 ms).

**Switching to OpenAI** requires only env changes — set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` (defaults to model `gpt-4o-mini` and the standard OpenAI base URL).

If no API key is set, the app runs normally and AI endpoints return `503 AI_UNAVAILABLE`. Restart the dev server after changing `.env`.

## Quick start

```powershell
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Or use the helper script (checks PostgreSQL, runs migrations, then starts client + server):

```powershell
.\scripts\dev.ps1
```

- **API:** http://localhost:3001/api/v1/health
- **Client:** http://localhost:5173

### Database commands

| Command | Purpose |
|---------|---------|
| `pnpm db:migrate` | Apply Prisma migrations to local PostgreSQL |
| `pnpm db:seed` | Load demo roles, users, departments, and requisitions |
| `pnpm db:studio` | Open Prisma Studio against the local database |

Prisma reads `DATABASE_URL` from the root `.env` file. Prisma CLI commands load that file automatically via `dotenv-cli`.
