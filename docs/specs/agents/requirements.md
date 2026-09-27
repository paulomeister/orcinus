# Agent Listing — Requirements

## User Stories

### US-6: List Agents
As a frontend consumer, I need to retrieve the list of available agents so
that I can populate filter dropdowns in the interaction list and metrics views.

## Requirements (EARS Notation)

- **REQ-AGT-001**: The system shall expose a read-only endpoint to list all
  agents ordered by name.
- **REQ-AGT-002**: The system shall return each agent's `id`, `name`, and
  `email`.
- **REQ-AGT-003**: WHEN no agents exist, the system shall return an empty
  array, not an error.