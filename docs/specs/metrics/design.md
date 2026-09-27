# Operational Metrics — Technical Design

## API Endpoint

### GET `/api/metrics`

#### Query Parameters

| Param | Type | Required | Format |
|---|---|---|---|
| `startDate` | string | yes | `YYYY-MM-DD` |
| `endDate` | string | yes | `YYYY-MM-DD` |

#### Date Normalization (Service Layer)

Input:

```text
startDate = '2026-09-01'
endDate = '2026-09-05'
```

becomes:

```text
rangeStart = '2026-09-01T00:00:00-05:00'  // inclusive
rangeEnd   = '2026-09-06T00:00:00-05:00'  // exclusive
```

The upper bound is exclusive.

#### Response

`200 OK`

```json
{
  "startDate": "2026-09-01",
  "endDate": "2026-09-05",
  "agentMetrics": [
    {
      "agentId": "uuid",
      "agentName": "Jane Doe",
      "totalInteractions": 15,
      "totalResolved": 12,
      "resolutionRate": 80.0,
      "avgResolutionSeconds": 450
    }
  ],
  "dailyVolume": [
    { "day": "2026-09-01", "total": 25 },
    { "day": "2026-09-02", "total": 18 },
    { "day": "2026-09-03", "total": 0 },
    { "day": "2026-09-04", "total": 31 },
    { "day": "2026-09-05", "total": 22 }
  ]
}
```

## SQL Aggregation Strategy

### Agent Metrics Query

Executed via `prisma.$queryRaw`:

```sql
SELECT
  a.id                          AS "agentId",
  a.name                        AS "agentName",
  COUNT(i.id)::int              AS "totalInteractions",
  COUNT(i.id) FILTER (WHERE i.status = 'resuelta')::int
                                AS "totalResolved",
  COALESCE(
    ROUND(
      COUNT(i.id) FILTER (WHERE i.status = 'resuelta')::numeric
      / NULLIF(COUNT(i.id), 0) * 100,
      1
    ),
    0
  )::float                     AS "resolutionRate",
  COALESCE(
    AVG(
      EXTRACT(EPOCH FROM (i.closed_at - i.opened_at))
    ) FILTER (WHERE i.status = 'resuelta'),
    0
  )::int                       AS "avgResolutionSeconds"
FROM agents a
JOIN interactions i ON i.agent_id = a.id
WHERE i.opened_at >= $1
  AND i.opened_at <  $2
GROUP BY a.id, a.name
ORDER BY a.name;
```

#### Key Safeguards

- `NULLIF(COUNT(i.id), 0)` prevents division by zero.
- `FILTER (WHERE i.status = 'resuelta')` excludes unresolved interactions from resolution time averages.
- `COALESCE(..., 0)` guarantees numeric output and prevents `NULL`.
- Casting to `::int` and `::float` ensures JavaScript receives numeric types.

### Daily Volume Query

```sql
SELECT
  TO_CHAR(
    i.opened_at AT TIME ZONE 'America/Bogota',
    'YYYY-MM-DD'
  ) AS "day",
  COUNT(i.id)::int AS "total"
FROM interactions i
WHERE i.opened_at >= $1
  AND i.opened_at <  $2
GROUP BY "day"
ORDER BY "day";
```

#### Timezone Handling

`AT TIME ZONE 'America/Bogota'` converts each `opened_at` value from UTC storage to Colombia local time before extracting the date.

For example, an interaction stored as:

```text
2026-09-02T01:30:00Z
```

corresponds to:

```text
2026-09-01T20:30:00-05
```

and is therefore grouped under:

```text
2026-09-01
```

## Gap Filling (Days with Zero Interactions)

The SQL query only returns days that have records. The service layer fills missing days in the requested range with `{ day, total: 0 }`:

```typescript
function fillDailyGaps(
    dbRows: { day: string; total: number }[],
    startDate: string,
    endDate: string,
): { day: string; total: number }[] {
    const rowMap = new Map(dbRows.map(r => [r.day, r.total]));
    const result: { day: string; total: number }[] = [];

    // Explicitly parse as UTC midnight to align with toISOString()
    const current = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);

    while (current <= end) {
        const dayStr = current.toISOString().slice(0, 10);
        result.push({ day: dayStr, total: rowMap.get(dayStr) ?? 0 });

        // Mutate strictly via UTC methods to avoid local server timezone drift
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return result;
}
```

This is a lightweight `O(days-in-range)` operation on pre-aggregated data, not raw interaction records, so it does not violate the "no in-memory aggregation" rule.

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Controller | Validate query parameters with Zod, call the service, and return the response. |
| Service | Normalize the date range, call the repository, fill daily gaps, and assemble the response. |
| Repository | Execute raw SQL via `prisma.$queryRaw` and return typed rows. |

## Index Usage

- **Agent metrics query:** leverages `idx_interactions_agent_opened_at` (composite index on `agent_id, opened_at`) for the date-range filter and agent grouping.
- **Daily volume query:** leverages `idx_interactions_opened_at` for the `opened_at` range scan.