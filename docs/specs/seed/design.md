# Seed Data — Technical Design

## Script Location

`prisma/seed.ts` — registered in `package.json` under `prisma.seed`.

## Execution

Runs automatically as part of the Docker entrypoint sequence:

npx prisma migrate deploy → npx prisma db seed → npm start

Also runnable manually: `npx prisma db seed`.

## Data Generation Strategy

### Agents (5)

| Name           | Email             |
|----------------|-------------------|
| Carlos Gómez   | carlos@wesmile.co |
| María López    | maria@wesmile.co  |
| Andrés Ramírez | andres@wesmile.co |
| Laura Martínez | laura@wesmile.co  |
| Lucas Pacioli  | lucas@wesmile.co  |

### Interactions (~300+)

For each agent, generate 60 to 80 interactions across a 14-day window ending
yesterday.

Distribution rules:
- **Type**: ~50% llamada, ~50% ticket (randomized).
- **Status**: ~40% resuelta, ~30% en_progreso, ~30% abierta.
- **Time of day**: Uniform random between 07:00 and 23:59 Colombia time,
  with ~15% of interactions deliberately placed between 22:00–01:00
  Colombia time to test midnight boundary grouping.
- **Resolution time**: For resolved interactions, `closedAt = openedAt +
  random(5min, 120min)`.

### Idempotency

Before inserting, the seed script deletes all existing interactions, then
all agents (respecting FK order):

```typescript
await prisma.interaction.deleteMany();
await prisma.agent.deleteMany();
```
## Midnight Boundary Test Cases
The seed must include at minimum:

An interaction opened at 23:30:00-05:00 on a specific day (stored as 04:30:00Z the next UTC day) — must group under the Colombia date.
An interaction opened at 00:15:00-05:00 on the next day (stored as 05:15:00Z) — must group under that next Colombia date.