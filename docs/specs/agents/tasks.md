# Agent Listing — Tasks

- [x] **TASK-AGT-001**: Create `src/repositories/agent.repository.ts`.
  Implement `findAll()` returning all agents ordered by name. Verify:
  returns array, empty when no agents exist.

- [x] **TASK-AGT-002**: Create `src/services/agent.service.ts`. Implement
  `listAgents()` calling repository. Verify: passthrough works.

- [x] **TASK-AGT-003**: Create `src/controllers/agent.controller.ts`.
  Implement `list` handler returning 200 with agent array.

- [x] **TASK-AGT-004**: Create `src/routes/agent.routes.ts`. Wire:
    - `GET /api/agents` → controller.list
      Verify: responds on correct path.