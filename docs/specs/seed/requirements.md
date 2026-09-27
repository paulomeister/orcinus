# Seed Data — Requirements

## Requirements (EARS Notation)

- **REQ-SEED-001**: The system shall include a seed script that populates the
  database with sufficient test data for meaningful metric visualization.
- **REQ-SEED-002**: The seed script shall create at least 5 agents.
- **REQ-SEED-003**: The seed script shall create at least 300 interactions
  distributed across multiple agents, types, and statuses.
- **REQ-SEED-004**: The seed script shall include interactions with `openedAt`
  timestamps that cross midnight in Colombia timezone (UTC-5), specifically
  interactions between 22:00 and 01:00 Colombia time.
- **REQ-SEED-005**: The seed script shall include interactions spanning at
  least 14 calendar days to produce a meaningful daily volume chart.
- **REQ-SEED-006**: The seed script shall include a mix of resolved and
  unresolved interactions. Resolved interactions must have realistic
  `closedAt` timestamps (minutes to hours after `openedAt`).
- **REQ-SEED-007**: The seed script shall be idempotent: running it multiple
  times does not duplicate data (clear existing records before inserting).