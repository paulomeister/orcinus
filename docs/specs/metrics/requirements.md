# Operational Metrics — Requirements

## User Stories

### US-4: View Agent Metrics
As a team leader, I need to see each agent's total interactions, resolved
count, resolution rate, and average resolution time for a date range so
that I can evaluate performance.

### US-5: View Daily Volume
As a team leader, I need to see interaction volume per day within a date
range so that I can identify demand patterns.

## Requirements (EARS Notation)

### Agent Metrics

- **REQ-MET-001**: The system shall expose a metrics endpoint that accepts
  `startDate` and `endDate` query parameters (both required, YYYY-MM-DD).
- **REQ-MET-002**: WHEN the endpoint is called, the system shall return for
  each agent who has at least one interaction in the range: `totalInteractions`,
  `totalResolved`, `resolutionRate` (percentage, 0–100), and
  `avgResolutionSeconds` (integer, seconds).
- **REQ-MET-003**: The system shall compute `resolutionRate` as
  `(totalResolved / totalInteractions) * 100`. WHEN an agent has zero
  interactions, `resolutionRate` shall be `0.0` without causing division
  errors.
- **REQ-MET-004**: The system shall compute `avgResolutionSeconds` only from
  interactions with status `resuelta` (those having both `openedAt` and
  `closedAt`). Unresolved interactions shall not affect the average.
- **REQ-MET-005**: WHEN an agent has zero resolved interactions,
  `avgResolutionSeconds` shall be `0`.

### Daily Volume

- **REQ-MET-010**: The system shall return a `dailyVolume` array containing
  one entry per calendar day (in UTC-5) within the requested range, with the
  total number of interactions opened on that day.
- **REQ-MET-011**: Day grouping shall be computed using the Colombia timezone
  (America/Bogota, UTC-5). An interaction opened at 23:30 Colombia time on
  Day 1 belongs to Day 1, not Day 2.
- **REQ-MET-012**: Days within the range that have zero interactions shall
  still appear in the series with `total: 0`.

### Aggregation Constraints

- **REQ-MET-020**: All numerical aggregations (COUNT, AVG, SUM) shall be
  executed within PostgreSQL, not in application memory. The Node.js process
  shall receive pre-aggregated rows only.
- **REQ-MET-021**: The metrics query shall not load individual interaction
  records into Node.js memory.

### Validation

- **REQ-MET-030**: WHEN `startDate` or `endDate` is missing, the system
  shall reject with HTTP 400.
- **REQ-MET-031**: WHEN `startDate` is greater than `endDate`, the system
  shall reject with HTTP 400 and message "startDate cannot be greater than
  endDate".
- **REQ-MET-032**: WHEN `startDate` or `endDate` is not a valid date format
  (YYYY-MM-DD), the system shall reject with HTTP 400.