# Agent Listing — Technical Design

## API Endpoint

### GET `/api/agents`

No query parameters. Returns all agents ordered by name.

#### Response

`200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
]
```

## Layer Responsibilities

| Layer | Responsibility |
|---|---|
| Controller | Call the service and return the response. No request validation required. |
| Service | Call the repository and return the agents. |
| Repository | Execute `prisma.agent.findMany({ orderBy: { name: 'asc' } })`. |

## Notes

- **No pagination:** Agent count is expected to remain small (tens, not thousands).
- **No creation endpoint:** Agents are populated exclusively via seed data.
