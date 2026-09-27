# Interaction Management — Requirements

## User Stories

### US-1: Create Interaction
As a system operator, I need to register a new interaction (call or ticket)
assigned to an agent so that the activity is tracked from the moment it begins.

### US-2: Transition Interaction Status
As a system operator, I need to advance an interaction through its lifecycle
so that resolution timestamps are captured accurately.

### US-3: List Interactions
As a team leader, I need to browse interactions with filters and pagination
so that I can review the team's activity without loading all records at once.

## Requirements (EARS Notation)

### Creation

- **REQ-INT-001**: The system shall accept creation of an interaction with a
  required `agentId` (valid UUID referencing an existing agent), a required
  `type` (`llamada` or `ticket`), and an optional `openedAt` timestamp.
- **REQ-INT-002**: WHEN an interaction is created without an `openedAt` value,
  the system shall default `openedAt` to the current server timestamp.
- **REQ-INT-003**: WHEN an interaction is created, the system shall set its
  status to `abierta` and leave `closedAt` as null.
- **REQ-INT-004**: WHEN an interaction references a non-existent `agentId`,
  the system shall reject the request with HTTP 400 and a descriptive message.

### Status Transitions

- **REQ-INT-010**: The system shall enforce the following transition sequence:
  `abierta → en_progreso → resuelta`. No other transitions are permitted.
- **REQ-INT-011**: WHEN a status update is requested with an invalid transition
  (e.g., `abierta → resuelta`, `resuelta → abierta`, `en_progreso → abierta`),
  the system shall reject the request with HTTP 400 and a message indicating the
  allowed next status.
- **REQ-INT-012**: WHEN an interaction transitions to `resuelta`, the system
  shall automatically set `closedAt` to the current server timestamp, ignoring
  any client-supplied `closedAt` value.
- **REQ-INT-013**: WHEN a status update targets a non-existent interaction ID,
  the system shall respond with HTTP 404.

### Listing & Filtering

- **REQ-INT-020**: The system shall expose a paginated list of interactions
  accepting optional query filters: `agentId`, `status`, `type`, `startDate`,
  `endDate`, `page`, `pageSize`.
- **REQ-INT-021**: WHILE `startDate` and `endDate` are provided, the system
  shall filter interactions where `openedAt >= startDate (00:00:00-05)` and
  `openedAt < endDate + 1 day (00:00:00-05)`.
- **REQ-INT-022**: WHEN `startDate` is greater than `endDate`, the system shall
  reject the request with HTTP 400.
- **REQ-INT-023**: The system shall return pagination metadata:
  `total`, `page`, `pageSize`, `totalPages`.
- **REQ-INT-024**: WHEN `page` or `pageSize` are not provided, the system shall
  default to `page = 1` and `pageSize = 10`.
- **REQ-INT-025**: WHEN filters produce no results, the system shall return an
  empty `data` array with `total: 0`, not an error.

### Validation

- **REQ-INT-030**: WHEN any required field is missing or any field has an
  invalid type/format, the system shall reject with HTTP 400 and a message
  array describing each validation failure.
- **REQ-INT-031**: The system shall validate `type` strictly against
  `llamada` or `ticket`; any other value is rejected.
- **REQ-INT-032**: The system shall validate `status` filter values strictly
  against `abierta`, `en_progreso`, or `resuelta`.