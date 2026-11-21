# SunFlow backend foundation

This backend is an Express modular monolith. HTTP routes handle requests, services will own business rules, and Prisma Client reads and writes the SQLite database. This milestone includes only the health route; the business APIs are intentionally not implemented yet.

## Requirements

- Node.js 20 or newer
- npm

## Setup

From this `server/` directory:

```sh
npm install
Copy-Item .env.example .env
```

Set `JWT_SECRET` in `.env` to a private random value of at least 32 characters before starting the server. The example database URL stores the SQLite file at `prisma/dev.db`.

## Database commands

```sh
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm test
```

The migration command creates the SQLite file if it is missing, then uses Prisma Migrate to create the 22 documented domain entities and their relationships. Seed data is idempotent and creates one demo user per role. Demo login password is `demo1234`; it is bcrypt-hashed before storage. These fictional credentials are for local hackathon demonstrations only.

| Role | Email |
| --- | --- |
| ADMIN | `admin@sunpower.demo` |
| SALES | `priya@sunpower.demo` |
| WAREHOUSE | `raghav@sunpower.demo` |
| TECHNICIAN | `arjun@sunpower.demo` |
| SUPPORT | `meera@sunpower.demo` |

## Run and verify

```sh
npm run dev
```

The API listens on port 4000 by default. `GET http://localhost:4000/api/health` runs `SELECT 1` through Prisma and returns a JSON health response when SQLite is reachable.

Configure `CORS_ORIGINS` as a comma-separated allow-list of frontend origins. Do not commit `.env`, the SQLite database, or uploaded files.

## Implemented API modules

The current milestone implements Authentication/Users, Customers, Leads, and the Site Survey routes defined in `API-Specification.md`. Customer list, direct create, and update routes were added at the frontend developer's request and are documented there. Survey listing/updating and a generic lead update endpoint are not specified by the API document and have not been added.
