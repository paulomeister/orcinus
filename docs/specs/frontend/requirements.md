# Minimal Frontend — Requirements

## User Stories

### US-7: View Interaction List
As a team leader, I need a view that displays interactions with filter
controls and pagination so that I can browse the team's activity.

### US-8: View Metrics Dashboard
As a team leader, I need a view showing agent performance metrics in a table
and daily volume in a chart so that I can assess operations at a glance.

## Requirements (EARS Notation)

### Interaction List View

- **REQ-FE-001**: The frontend shall display a table of interactions showing
  agent name, type, status, opened date, and closed date.
- **REQ-FE-002**: The frontend shall provide filter controls for: agent
  (dropdown), status (dropdown), type (dropdown), date range (start and end
  date inputs).
- **REQ-FE-003**: The frontend shall support pagination controls (previous,
  next, page indicator).
- **REQ-FE-004**: WHILE data is loading, the frontend shall display a loading
  indicator.
- **REQ-FE-005**: WHEN an API request fails, the frontend shall display an
  error message to the user, not a blank screen or unhandled exception.
- **REQ-FE-006**: The frontend shall provide a form to create a new interaction
  assigned to an agent, with type (`llamada` or `ticket`) and an optional opening
  timestamp.
- **REQ-FE-007**: WHEN an interaction is created, the frontend shall send the
  interaction data to the backend and refresh the interaction list after
  successful creation.
- **REQ-FE-008**: The frontend shall provide an action to advance an interaction
  from `abierta` to `en_progreso` and from `en_progreso` to `resuelta`.
- **REQ-FE-009**: WHEN an interaction status is changed, the frontend shall send
  the requested status transition to the backend and refresh the interaction
  list after a successful change.

### Metrics View

- **REQ-FE-010**: The frontend shall display a table of agent metrics
  (agent name, total interactions, total resolved, resolution rate, average
  resolution time).
- **REQ-FE-011**: The frontend shall display a bar or line chart showing
  daily interaction volume using Recharts.
- **REQ-FE-012**: The frontend shall provide date range inputs to control
  the metrics query.
- **REQ-FE-013**: WHILE metrics are loading, the frontend shall display a
  loading indicator.
- **REQ-FE-014**: WHEN the metrics API returns an error, the frontend shall
  display the error message.

### General

- **REQ-FE-020**: The frontend shall consume the backend API at a
  configurable base URL (environment variable).
- **REQ-FE-021**: The frontend shall provide navigation between the
  interaction list view and the metrics view.