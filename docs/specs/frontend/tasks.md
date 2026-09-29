# Minimal Frontend — Tasks

## Phase: Project Setup

- [X] **TASK-FE-001**: Initialize React + Vite + TypeScript project in
  `frontend/` directory. Install Tailwind CSS, Recharts, react-router-dom.
  Verify: `npm run dev` starts without errors.

- [X] **TASK-FE-002**: Configure environment variable for API base URL
  (`VITE_API_URL`). Create API client utility (`src/api/client.ts`) with
  fetch, POST, and PATCH helpers handling JSON parsing, network failures,
  and error extraction.

## Phase: Shared Components

- [X] **TASK-FE-010**: Build `LoadingSpinner` component. Simple centered
  spinner or "Loading..." text.

- [X] **TASK-FE-011**: Build `ErrorMessage` component. Displays error
  string in a styled alert box.

- [X] **TASK-FE-012**: Build `Pagination` component. Props: page,
  totalPages, onPageChange. Renders previous/next buttons with disabled
  state at boundaries.

## Phase: Interactions Page

- [X] **TASK-FE-020**: Build `useInteractions` custom hook. Fetches
  `GET /api/interactions` with filter/pagination params. Returns
  `{ data, pagination, loading, error }`. Re-fetches when params change.

- [X] **TASK-FE-021**: Build `useAgents` custom hook. Fetches
  `GET /api/agents`. Returns `{ agents, loading }`.

- [X] **TASK-FE-022**: Build `InteractionFilters` component with agent
  dropdown (populated from useAgents), status dropdown, type dropdown,
  startDate/endDate inputs, and apply button.

- [X] **TASK-FE-023**: Build `InteractionTable` component rendering data
  rows. Format dates to readable locale strings.

- [X] **TASK-FE-025**: Build `CreateInteractionForm` component. The form shall
  allow selecting an agent, selecting an interaction type (`llamada` or
  `ticket`), and optionally providing an opening timestamp. Submit via
  `POST /api/interactions` and display submission errors.

- [X] **TASK-FE-026**: Add status transition actions to `InteractionTable`.
  Allow `abierta` -> `en_progreso` and `en_progreso` -> `resuelta`. Submit
  transitions via `PATCH /api/interactions/:id/status` and display row-level
  errors.

- [X] **TASK-FE-027**: Extend `useInteractions` with a `refetch` function so
  the current interaction list can be explicitly reloaded after successful
  interaction creation or status changes. 

- [X] **TASK-FE-024**: Assemble `InteractionsPage` composing filters, create
  interaction form, table, pagination, loading, and error states. Verify:
  page loads, filters work, pagination navigates, interactions can be created,
  and status transitions refresh the list.

## Phase: Metrics Page

- [X] **TASK-FE-030**: Build `useMetrics` custom hook. Fetches
  `GET /api/metrics` with startDate/endDate. Returns
  `{ data, loading, error }`.

- [X] **TASK-FE-031**: Build `AgentMetricsTable` component. Renders
  agentMetrics array as table. Format resolutionRate with 1 decimal,
  avgResolutionSeconds as minutes:seconds.

- [X] **TASK-FE-032**: Build `DailyVolumeChart` component using Recharts
  BarChart. X-axis: day (formatted), Y-axis: total. Responsive container.

- [X] **TASK-FE-033**: Assemble `MetricsPage` composing date filters,
  table, chart, loading, and error states. Verify: page loads, date
  selection triggers fetch, chart renders.

## Phase: Navigation & Layout

- [X] **TASK-FE-040**: Set up react-router-dom with routes: `/interactions`
  (default) and `/metrics`. Build `Layout` component with top navigation
  bar. Verify: navigation between views works.

## Phase: Docker Integration

- [X] **TASK-FE-050**: Add Dockerfile for frontend (multi-stage: build with
  Node, serve with nginx or Vite preview). Add to docker-compose.yml.
  Verify: `docker-compose up` serves frontend accessible in browser.