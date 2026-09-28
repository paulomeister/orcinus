# Interaction Management — Technical Design

## Data Model

Uses the `Interaction` and `Agent` models defined in `docs/steering/tech.md`.

Key properties:

- `Interaction.status` defaults to `ABIERTA` on creation.
- `Interaction.closedAt` is `null` until the interaction transitions to `RESUELTA`.
- `Interaction.openedAt` stores the moment the interaction began. If not provided explicitly, it defaults to the current timestamp.

## State Machine

```text
ABIERTA ──► EN_PROGRESO ──► RESUELTA
```

Allowed transitions are enforced in the service layer:

```typescript
const ALLOWED_TRANSITIONS: Record<
  InteractionStatus,
  InteractionStatus | null
> = {
  [InteractionStatus.ABIERTA]: InteractionStatus.EN_PROGRESO,
  [InteractionStatus.EN_PROGRESO]: InteractionStatus.RESUELTA,
  [InteractionStatus.RESUELTA]: null,
};
```

Any request attempting a transition that does not match the allowed transition map is rejected.

## API Endpoints

### POST `/api/interactions`

Creates a new interaction.

#### Request Body

```json
{
  "agentId": "uuid",
  "type": "llamada | ticket",
  "openedAt": "ISO-8601 datetime (optional)"
}
```

#### Validation (Zod)

- `agentId`: required, valid UUID.
- `type`: required, one of `llamada` or `ticket`.
- `openedAt`: optional, valid ISO-8601 datetime string.

If `openedAt` is omitted, the database default is used.

#### Response

`201 Created` with the created interaction object.

#### Errors

- `400 Bad Request` — validation failure or non-existent agent.

---

### PATCH `/api/interactions/:id/status`

Changes the interaction status according to the state machine.

#### Request Body

```json
{
  "status": "en_progreso | resuelta"
}
```

#### Validation (Zod)

- `status`: required, one of `en_progreso` or `resuelta`.

#### Logic

1. Fetch the interaction by `id`.
2. If not found, return `404 Not Found`.
3. Check that `ALLOWED_TRANSITIONS[currentStatus] === requestedStatus`.
4. If the transition is not allowed, return `400 Bad Request`.
5. If transitioning to `RESUELTA`, set `closedAt = new Date()`.
6. Update and return the interaction.

#### Response

`200 OK` with the updated interaction object.

#### Errors

- `400 Bad Request` — invalid status transition.
- `404 Not Found` — interaction does not exist.

---

### GET `/api/interactions`

Lists interactions with optional filters and pagination.

#### Query Parameters

| Parameter | Type | Default | Notes |
|---|---|---:|---|
| `agentId` | UUID | — | Filter by agent |
| `status` | enum | — | `abierta`, `en_progreso`, `resuelta` |
| `type` | enum | — | `llamada`, `ticket` |
| `startDate` | string | — | `YYYY-MM-DD` |
| `endDate` | string | — | `YYYY-MM-DD` |
| `page` | number | `1` | `>= 1` |
| `pageSize` | number | `10` | `1–100` |

#### Date Handling

All date filtering uses `America/Bogota` (UTC-5).

- `startDate` → `>= YYYY-MM-DDT00:00:00-05:00`
- `endDate` → `< YYYY-MM-(DD+1)T00:00:00-05:00`

The upper bound is exclusive.

#### Response

`200 OK`

```json
{
  "data": [
    "interaction objects with agent name joined"
  ],
  "total": 120,
  "page": 1,
  "pageSize": 10,
  "totalPages": 12
}
```

## Layer Responsibilities

| Layer | File Pattern | Responsibility |
|---|---|---|
| Route | `src/routes/interaction.routes.ts` | Map HTTP verbs and paths to controller methods. |
| Controller | `src/controllers/interaction.controller.ts` | Parse requests, validate with Zod, call the service, and send responses. |
| Service | `src/services/interaction.service.ts` | Enforce the state machine, business rules, and orchestration. |
| Repository | `src/repositories/interaction.repository.ts` | Execute Prisma Client queries (`create`, `findMany`, `update`, `count`). |

## Error Handling

Controllers catch service/repository errors and map them to the standard error envelope. `error` is always the HTTP reason phrase for `statusCode`; `message` carries the specific detail and is an array only for Zod validation failures.

Single-error case (e.g. invalid status transition, not found):

```json
{
  "statusCode": 400,
  "message": "Invalid status transition: abierta → resuelta",
  "error": "Bad Request",
  "timestamp": "2026-09-01T10:00:00.000Z"
}
```

Validation-failure case (Zod, one entry per invalid field):

```json
{
  "statusCode": 400,
  "message": [
    "agentId: agentId must be a valid UUID",
    "type: type must be one of: llamada, ticket"
  ],
  "error": "Bad Request",
  "timestamp": "2026-09-01T10:00:00.000Z"
}
```

A global Express error-handling middleware provides the final safety net for unhandled errors, returning `500 Internal Server Error` with a generic message and `"error": "Internal Server Error"`.