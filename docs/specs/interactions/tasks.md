# Interaction Management — Tasks

## Phase: Repository Layer

- [X] **TASK-INT-001**: Create `src/repositories/interaction.repository.ts`.
  Implement `create(data)` method using Prisma Client `interaction.create()`.
  Verify: unit test confirming Prisma create is called with correct payload.

- [X] **TASK-INT-002**: Implement `findById(id)` method returning a single
  interaction or null. Verify: returns null for non-existent UUID.

- [X] **TASK-INT-003**: Implement `findMany(filters, pagination)` method.
  Build Prisma `where` clause dynamically from optional filters (agentId,
  status, type, date range). Apply `skip`/`take` for pagination. Include
  `agent` relation (select name). Verify: returns correct subset with
  pagination metadata.

- [X] **TASK-INT-004**: Implement `count(filters)` method returning total
  matching records for the same filter set. Verify: count matches findMany
  without pagination.

- [X] **TASK-INT-005**: Implement `updateStatus(id, data)` method using
  Prisma `interaction.update()`. Accepts status and optional closedAt.
  Verify: updated record returned.

## Phase: Service Layer

- [X] **TASK-INT-010**: Create `src/services/interaction.service.ts`.
  Implement `createInteraction(dto)`. Validate that referenced agentId
  exists (call agent repository). If not, throw a typed error. Verify:
  throws on non-existent agent; succeeds on valid agent.

- [X] **TASK-INT-011**: Implement `updateInteractionStatus(id, newStatus)`.
  Fetch interaction; if not found throw NotFoundError. Check
  ALLOWED_TRANSITIONS map; if invalid throw BadRequestError. If
  transitioning to `resuelta`, set `closedAt = new Date()`. Call
  repository update. Verify: test all valid transitions and all invalid
  transitions.

- [X] **TASK-INT-012**: Implement `listInteractions(filters, pagination)`.
  Normalize date filters to Colombia timezone boundaries (exclusive upper
  bound). Call repository findMany and count. Compute totalPages. Return
  paginated result. Verify: correct pagination math; empty result returns
  total 0.

## Phase: Controller & Validation

- [X] **TASK-INT-020**: Define Zod schemas:
  `createInteractionSchema` (body), `updateStatusSchema` (body),
  `listInteractionsSchema` (query). Verify: invalid inputs produce
  descriptive error arrays.

- [X] **TASK-INT-021**: Create `src/controllers/interaction.controller.ts`.
  Implement `create` handler: parse body with Zod, call service, return
    201. Verify: 201 on success, 400 on validation failure.

- [X] **TASK-INT-022**: Implement `updateStatus` handler: parse params (id)
  and body with Zod, call service, return 200. Verify: 200 on success,
  400 on bad transition, 404 on missing interaction.

- [X] **TASK-INT-023**: Implement `list` handler: parse query with Zod
  (coerce page/pageSize to numbers), call service, return 200. Verify:
  200 with correct pagination envelope. Verify: startDate > endDate
  returns 400.

## Phase: Route Wiring

- [X] **TASK-INT-030**: Create `src/routes/interaction.routes.ts`. Wire:
    - `POST /api/interactions` → controller.create
    - `PATCH /api/interactions/:id/status` → controller.updateStatus
    - `GET /api/interactions` → controller.list
      Verify: routes respond on correct paths and methods.