# Operational Metrics — Tasks

## Phase: Repository Layer

- [X] **TASK-MET-001**: Create `src/repositories/metrics.repository.ts`.
  Implement `getAgentMetrics(rangeStart: Date, rangeEnd: Date)` executing
  the agent metrics raw SQL query. Return typed array. Verify: returns
  correct structure with mock data.

- [X] **TASK-MET-002**: Implement `getDailyVolume(rangeStart: Date, rangeEnd: Date)`
  executing the daily volume raw SQL query. Return typed array of
  `{ day: string, total: number }`. Verify: correct grouping in UTC-5.

## Phase: Service Layer

- [X] **TASK-MET-010**: Create `src/services/metrics.service.ts`. Implement
  `getMetrics(startDate: string, endDate: string)`.
    - Validate startDate <= endDate (throw BadRequestError if not).
    - Normalize dates: `rangeStart = startDate + T00:00:00-05:00`,
      `rangeEnd = endDate + 1 day + T00:00:00-05:00`.
    - Call repository for agent metrics and daily volume.
    - Fill daily gaps.
    - Assemble and return response object.
      Verify: unit test with mocked repository.

- [X] **TASK-MET-011**: Implement `fillDailyGaps` utility function. Verify:
    - Input with missing days gets filled with total 0.
    - Input with no rows returns all days as 0.
    - Single-day range works correctly.

## Phase: Controller & Validation

- [X] **TASK-MET-020**: Define Zod schema `metricsQuerySchema` for query
  params: `startDate` (required, YYYY-MM-DD regex), `endDate` (required,
  YYYY-MM-DD regex). Verify: rejects missing params, invalid formats.

- [X] **TASK-MET-021**: Create `src/controllers/metrics.controller.ts`.
  Implement `getMetrics` handler: parse query with Zod, call service,
  return 200 with response. Verify: 200 on valid range, 400 on inverted
  range, 400 on missing params.

## Phase: Route Wiring

- [X] **TASK-MET-030**: Create `src/routes/metrics.routes.ts`. Wire:
    - `GET /api/metrics` → controller.getMetrics
      Verify: endpoint responds on correct path.

## Phase: Critical Unit Tests

- [X] **TASK-MET-040**: Test — division by zero safety. Mock repository
  returning an agent with 0 interactions. Assert `resolutionRate = 0.0`
  and `avgResolutionSeconds = 0`, no NaN.

- [X] **TASK-MET-041**: Test — midnight boundary grouping. Seed interactions
  at 23:30 Colombia time (04:30 UTC next day) and 00:15 Colombia time.
  Assert they fall into correct days in dailyVolume.

- [X] **TASK-MET-042**: Test — inverted date range. Call service with
  startDate > endDate. Assert BadRequestError thrown.