# Minimal Frontend — Technical Design

## Stack

- React 18+ with Vite
- TypeScript
- Tailwind CSS (utility-first styling)
- Recharts (daily volume chart)

## Views

### 1. Interactions Page (`/interactions`)

#### Components

- `InteractionFilters` — dropdowns for agent, status, and type; date inputs for start/end; apply button.
- `CreateInteractionForm` — modal form for creating an interaction. Fields: agent, type (`llamada` or `ticket`), and optional opening timestamp.
- `InteractionTable` — renders paginated rows. Columns: Agent, Type, Status, Opened At, Closed At, and a status action.
- `Pagination` — previous/next buttons and current page / total pages display.

#### Data Flow

1. On mount and on filter change, fetch `GET /api/interactions?...params`.
2. Store results in component state: `{ data, total, page, pageSize, totalPages }`.
3. On page change, re-fetch with the updated `page` parameter.
4. To create an interaction, open `CreateInteractionForm` and submit
   `POST /api/interactions` with the selected agent, type, and optional
   opening timestamp.
5. After successful creation, re-fetch the interaction list.
6. To advance an interaction status, send
   `PATCH /api/interactions/:id/status` with the next allowed status.
7. After a successful status change, re-fetch the interaction list.

The agent dropdown is populated from `GET /api/agents` on mount.

### 2. Metrics Page (`/metrics`)

#### Components

- `MetricsFilters` — date range inputs (`startDate`, `endDate`); apply button.
- `AgentMetricsTable` — renders the `agentMetrics` array.
- `DailyVolumeChart` — Recharts `BarChart` or `LineChart` rendering the `dailyVolume` array. X-axis: day. Y-axis: total.

#### Data Flow

1. On filter apply, fetch `GET /api/metrics?startDate=...&endDate=...`.
2. Store the response in component state.
3. Pass `agentMetrics` to the table and `dailyVolume` to the chart.

## Navigation

Simple top navigation bar with two links:

- `Interactions`
- `Metrics`

Use `react-router-dom` for client-side routing.

## State Management

No global state library.

Use local `useState` and `useEffect` per page.

Extract shared fetch logic into custom hooks:

- `useInteractions(filters, pagination)` — returns `{ data, loading, error, refetch }`.
  The `refetch` function explicitly reloads the current interaction list after
  mutations such as creation or status changes.
- `useMetrics(startDate, endDate)` — returns `{ data, loading, error }`.

## Loading & Error States

Each view renders conditionally based on the request state:

```tsx
if (loading) return <LoadingState />;
if (error) return <ErrorState />;
return <PageContent />;
```

Both loading and error states should provide clear user feedback without exposing raw API or server errors.

## Styling Approach

Use a neutral palette:

| Element | Color |
|---|---|
| Background | `#ffffff` |
| Text / buttons | `#171717` |
| Muted surfaces (table headers, card backgrounds) | `#f5f5f5` |
| `resuelta` status badge | Green |
| `en_progreso` status badge | Yellow |
| `abierta` status badge | Gray |

Status badge colors are used consistently across the interactions table and any other status display.
