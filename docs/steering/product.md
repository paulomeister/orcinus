# Product Overview

## Purpose

Mini panel de Contact Center: a backend service that centralizes the activity of
a support team (calls and tickets) and converts it into reliable operational
metrics. Accompanied by a minimal frontend dashboard that consumes the API.

## Target Users

- **Team Leader**: Needs a panel to monitor agent performance, resolution rates,
  and daily interaction volume across date ranges.
- **Support Agents**: Represented as entities in the system. They do not interact
  with the panel directly; their activity is recorded and measured.

## Business Context

In a contact center operation based in Colombia (UTC-5), every interaction
(call or ticket) must be tracked from opening through resolution. Leadership
requires answers to three questions:

1. How many interactions did each agent handle, and how many were resolved?
2. What is the average resolution time per agent?
3. How does interaction volume behave per day within a given date range?

## Key Features

### Interaction Management
- Create interactions (type: call or ticket) assigned to an agent.
- Transition interaction status through a strict lifecycle:
  `abierta → en_progreso → resuelta`.
- Automatically stamp closure timestamp upon resolution.
- List interactions with filtering (agent, status, type, date range) and
  offset-based pagination.

### Operational Metrics
- Single endpoint returning per-agent metrics (total interactions, total
  resolved, resolution rate, average resolution time) and a daily volume
  time series, all within a requested date range.
- Aggregation performed at database level for correctness and efficiency.
- Day grouping respects Colombia timezone (UTC-5).

### Agent Listing
- Read-only endpoint to list available agents for frontend filter population.

### Minimal Frontend Dashboard
- Interaction list view with filters and pagination.
- Metrics view with agent performance table and daily volume chart.
- Handles loading and error states.

## Scope Boundaries

- No authentication or authorization.
- No agent CRUD beyond seeded data and a list endpoint.
- No real-time updates (WebSockets, SSE).
- No interaction deletion or archival.
- Frontend is functional, not design-polished.