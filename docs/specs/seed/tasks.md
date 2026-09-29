# Seed Data — Tasks

- [X] **TASK-SEED-001**: Create `prisma/seed.ts`. Implement agent creation
  with the 5 defined agents. Verify: agents exist in database after run.

- [X] **TASK-SEED-002**: Implement interaction generation loop. For each
  agent, create 60–80 interactions with randomized type, status, openedAt,
  and closedAt (for resolved ones). Verify: at least 300 total interactions.

- [X] **TASK-SEED-003**: Ensure ~15% of interactions have openedAt between
  22:00–01:00 Colombia time. Verify: querying the database with
  `AT TIME ZONE 'America/Bogota'` shows records on both sides of midnight.

- [X] **TASK-SEED-004**: Implement idempotency: deleteMany before insert.
  Verify: running seed twice produces the same record count, not double.

- [X] **TASK-SEED-005**: Register seed in `package.json`:
  ```json
  "prisma": { "seed": "ts-node prisma/seed.ts" }
Verify: npx prisma db seed runs successfully.