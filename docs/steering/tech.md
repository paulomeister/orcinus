# Technology Stack & System Constraints

## Runtime & Language

| Layer    | Technology        | Version Constraint |
|----------|-------------------|--------------------|
| Runtime  | Node.js           | >= 24 LTS          |
| Language | TypeScript        | >= 5.0             |

## Backend

| Component      | Choice              | Rationale                                        |
|----------------|----------------------|--------------------------------------------------|
| HTTP Framework | Express              | Minimal footprint; manual layering exposes architectural intent clearly. |
| Validation     | Zod                  | Schema-first validation with TypeScript type inference; no decorator ceremony. |
| ORM            | Prisma               | Type-safe client for CRUD; `$queryRaw` for SQL aggregations where the ORM abstraction is insufficient. |
| Database       | PostgreSQL >= 15     | Native `TIMESTAMPTZ`, `AT TIME ZONE` support, robust aggregation functions. |

## Frontend

| Component       | Choice           | Rationale                                   |
|-----------------|------------------|---------------------------------------------|
| Framework       | React + Vite     | Fast dev server, minimal config, sufficient for a simple SPA. |
| Language        | TypeScript       | Consistency with backend.                   |
| Styling         | Tailwind CSS     | Utility-first; fast to build functional UI without custom CSS. |
| Charts          | Recharts         | Lightweight React-native charting for the daily volume series. |

## Infrastructure

| Component       | Choice           | Rationale                                   |
|-----------------|------------------|---------------------------------------------|
| Containerization| Docker Compose   | Single `docker-compose up` brings up PostgreSQL, backend, and frontend. |
| DB Migrations   | Prisma Migrate   | Schema versioning tied to the ORM.          |
| Seeding         | `prisma/seed.ts` | Executed in container entrypoint after migrations. |

## Backend Architecture Pattern

Explicit manual layered architecture without framework magic:

Routes → Controllers → Services → Repositories

- **Routes**: Express router definitions. Map HTTP verbs and paths to controllers.
- **Controllers**: Parse and validate input (Zod), call services, format HTTP responses.
- **Services**: Domain business logic, state machine enforcement, orchestration.
- **Repositories**: Data access via Prisma Client (CRUD) and `$queryRaw` (aggregations).

## Database Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum InteractionType {
  LLAMADA  @map("llamada")
  TICKET   @map("ticket")
}

enum InteractionStatus {
  ABIERTA     @map("abierta")
  EN_PROGRESO @map("en_progreso")
  RESUELTA    @map("resuelta")
}

model Agent {
  id           String        @id @default(uuid()) @db.Uuid
  name         String        @db.VarChar(100)
  email        String        @unique @db.VarChar(100)
  createdAt    DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)

  interactions Interaction[]

  @@map("agents")
}

model Interaction {
  id        String            @id @default(uuid()) @db.Uuid
  agentId   String            @map("agent_id") @db.Uuid
  type      InteractionType
  status    InteractionStatus @default(ABIERTA)
  openedAt  DateTime          @default(now()) @map("opened_at") @db.Timestamptz(6)
  closedAt  DateTime?         @map("closed_at") @db.Timestamptz(6)
  createdAt DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)

  agent     Agent             @relation(fields: [agentId], references: [id], onDelete: Restrict)

  @@index([openedAt], name: "idx_interactions_opened_at")
  @@index([agentId, openedAt], name: "idx_interactions_agent_opened_at")

  @@map("interactions")
}
```
## Index Rationale

| Index | Supports |
|---|---|
| `idx_interactions_opened_at` | Date range filters on listing and metrics queries. |
| `idx_interactions_agent_opened_at` | Per-agent filtering combined with date ranges; metrics GROUP BY agent. |

## System Constraints

- **Timezone:** All operational grouping uses `America/Bogota` (UTC-5). Timestamps stored as `TIMESTAMPTZ` in UTC; converted at query time.
- **Date Range Normalization:** Exclusive upper bound. A range "Sept 1 to Sept 5" translates to `opened_at >= '2026-09-01T00:00:00-05' AND opened_at < '2026-09-06T00:00:00-05'`.
- **Pagination:** Offset-based with `page` and `pageSize` parameters.
- **Error Format:** Consistent envelope `{ statusCode, message, error, timestamp }`.
