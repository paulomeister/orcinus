# Technical Decisions

This document explains the main decisions I made to build Orcinus, a small dashboard for monitoring contact center interactions and querying operational metrics, using a Spec-Driven Development approach in which specifications serve as the source of truth and the implementation must remain aligned with them

## 1. Technology Chosen

For the backend, I chose:

- **Node.js** as the runtime environment.
- **TypeScript** as the programming language.
- **Express** as the HTTP framework.
- **PostgreSQL** as the database.
- **Prisma** as the ORM and data access client.

I chose TypeScript because it allows me to keep the code clearer and detect type-related errors before running the application. In a project that handles states, dates, filters, and metric responses, I consider this additional safety useful.

For the framework, I preferred Express instead of using a more complete solution such as NestJS. The project is small and did not need all the additional structure that NestJS provides. With Express, I was able to keep the flow explicit and easy to follow:

```text
Routes → Controllers → Services → Repositories
```

For the database, I chose PostgreSQL because the project needs relationships between agents and interactions, date filters, and aggregations such as `COUNT`, `AVG`, and `GROUP BY`. PostgreSQL handles this type of query well.

Finally, I chose Prisma because it simplifies working with the schema, migrations, and CRUD operations. For metrics, it also allows parameterized SQL to be executed through `$queryRaw`, which was important for keeping the calculations in the database.

## 2. General Architecture

I organized the backend into simple layers:

- **Routes:** define the HTTP routes and connect each endpoint to its controller.
- **Controllers:** receive requests, validate input data, and build the HTTP response.
- **Services:** contain business logic and coordinate operations.
- **Repositories:** encapsulate access to PostgreSQL through Prisma.
- **Schemas:** contain input validation using Zod.
- **Middleware and errors:** handle errors and common application behavior.

I decided to separate these responsibilities to prevent all the logic from ending up concentrated in the routes or controllers.

The controllers remain relatively lightweight. Their main responsibility is to validate request parameters, call the corresponding service, and return the response. For example, the rules related to interaction status changes do not live in the controller, but rather in the service.

Business logic lives primarily in the services. There, among other things, the following are validated:

- That status changes follow the allowed flow.
- That a resolved interaction receives a closing date.
- That an interaction cannot return to a previous status.
- That the date range for metrics is valid.
- That days without interactions appear in the response with a value of zero.

The repositories are responsible for communicating with the database. For normal operations, I use Prisma Client. For metrics, I use parameterized SQL queries because I need to perform aggregations directly in PostgreSQL.

This structure is not intended to be a complex architecture. My goal was to have a clear separation of responsibilities without introducing unnecessary abstractions for the current size of the project.

## 3. Data Model

I defined two main entities: `Agent` and `Interaction`.

### Agent

Represents the agent who handles the interactions. It has:

- `id`
- `name`
- `email`
- `createdAt`

The email address is unique to prevent duplicate agents.

### Interaction

Represents a call or ticket handled by an agent. It has:

- `id`
- `agentId`
- `type`
- `status`
- `openedAt`
- `closedAt`
- `createdAt`

The `type` field can be:

- `call`
- `ticket`

The `status` field can be:

- `open`
- `in_progress`
- `resolved`

The relationship between the entities is one-to-many:

```text
Agent 1 ──── N Interaction
```

An agent can have many interactions, but each interaction belongs to only one agent.

I used `closedAt` as an optional field because an open or in-progress interaction does not yet have a closing date. When an interaction changes to `resolved`, the service automatically assigns that date.

I also used `TIMESTAMPTZ` for dates. This way, PostgreSQL correctly stores points in time, and I can convert them to the operation's time zone when I need to group them by day.

I added two indexes:

- An index on `openedAt`, to speed up date-range filters.
- A composite index on `agentId` and `openedAt`, to help with metrics queries grouped by agent and filtered by date.

This model is sufficient for the current scope and allows the metrics to be queried without having to duplicate information in additional tables.

## 4. Metrics Endpoint

The metrics endpoint receives a date range through `startDate` and `endDate`.

The response contains two groups of information:

1. Metrics by agent.
2. Interaction volume by day.

The metrics by agent include:

- Total interactions.
- Total resolved interactions.
- Resolution rate.
- Average resolution time in seconds.

The resolution rate is calculated as follows:

```text
totalResolved / totalInteractions * 100
```

I use `NULLIF` to avoid division by zero and `COALESCE` to return zero when there is no calculable value.

The average resolution time only considers interactions with a `resolved` status. I do not include open or in-progress interactions because they do not yet have a complete duration.

### Aggregation in PostgreSQL

I decided to perform the calculations within PostgreSQL using SQL queries with `COUNT`, `AVG`, `FILTER`, and `GROUP BY`.

This avoids bringing all interactions into Node.js to process them with JavaScript. The application receives only already-aggregated rows, reducing the amount of data transferred and the memory consumption of the process.

### Time Zone

The operation is based in Colombia, so I use the `America/Bogota` time zone, which corresponds to UTC-5.

Dates are stored as points in time, but when building the daily series I need to group them according to Colombia's local calendar. For this, I use:

```sql
opened_at AT TIME ZONE 'America/Bogota'
```

This prevents errors around midnight. For example, an interaction recorded at 8:00 PM in Colombia may be stored as 1:00 AM of the following day in UTC. If I simply grouped using the UTC date, the interaction would appear on the wrong day.

I also use an exclusive upper bound for ranges:

```text
opened_at >= start
opened_at < end
```

To include the entire final day, the upper bound is calculated as the beginning of the following day in Colombia's time zone.

Finally, the SQL query only returns days that have interactions. In the complete service, missing days are added with `total: 0`, so that the frontend can display a continuous series.

## 5. Alternatives Considered

### Using NestJS Instead of Express

I considered using NestJS because it provides an organized structure, dependency injection, and several components ready for backend projects.

However, for this project it seemed like a larger solution than necessary. I chose Express because it allows me to maintain a clear structure using explicit layers, without relying on too much framework configuration or abstraction.

The cost of this decision is that some responsibilities, such as creating and connecting dependencies, must be organized manually.

### Processing Metrics in Node.js

Another option was to retrieve the interactions from Prisma and calculate the metrics using `.reduce()` or other JavaScript operations.

I discarded this alternative because it would require transferring all records from PostgreSQL to Node.js. With a large number of interactions, this would consume more memory and increase traffic between the application and the database.

I preferred using SQL so that PostgreSQL performs the calculations and Node.js receives only the final results.

### Using a Pre-Aggregated Metrics Table

I also considered storing metrics in a separate table and updating it through a scheduled process.

I did not choose this option because, for the current scope, it would add complexity without a real need. Direct queries against PostgreSQL, combined with the appropriate indexes, are sufficient for the expected project size.

The cost of this decision is that the metrics are recalculated every time they are requested. In an application with high traffic, it would probably be necessary to add caching or a pre-aggregation strategy.

### Using an Additional Date Library

I could have used a specialized library to handle time zones. In this case, I preferred using PostgreSQL's capabilities and JavaScript's date APIs because the application only needs to handle a single fixed time zone: `America/Bogota`.

This keeps the dependencies simpler, although it requires being careful when creating dates and when using UTC methods to avoid differences between the local server and the container.

## 6. Main Trade-offs

The most important decision was to perform the aggregations in PostgreSQL.

This has several advantages:

- Less data is transferred to Node.js.
- PostgreSQL's ability to group and calculate is utilized.
- Processing thousands of records in memory is avoided.
- The service code remains more focused on coordinating the operation.

The cost is that part of the metrics logic is written in SQL rather than only in TypeScript. This can make the code somewhat more difficult to modify for someone who is not familiar with SQL.

I also chose a manually implemented layered architecture instead of using a more structured framework. This makes the project simple and explicit, but it means that some conventions and dependencies must be maintained manually.

Finally, I used pagination based on `page` and `pageSize` for the interaction list. It is easy to understand and sufficient for the current scope, although cursor-based pagination would be more stable for very large tables.

## 7. Use of Artificial Intelligence

I used artificial intelligence as a development aid, mainly to accelerate the creation of repetitive code and explore implementation alternatives.

The major struggle with AI for me in this process is that I wasn't using a coding agent through the entire software development process with the ability to preserve context, read files, run commands, etc. 

Although planning helps a lot and breaking down the app in specs help keeping the code aligned with requirements, I didn't have a paid coding agent that could leverage low-level FS access and MCP tools, but instead I did a more manual process of using free chat models to understand what to do and perform some implementations. 

AI helped me with:

- Format specs in the proper format to avoid manual template writing.
- The initial generation of the Docker Compose configuration.
- The initial backend structure.
- The definition of the Prisma schema.
- The creation of the seed script with sample agents and interactions.
- The generation of test cases.

However, I did not treat the generated responses as definitive. I reviewed and corrected several important points.

At the beginning, I spent free credits of Kiro using Qwen3 Coder Next, but model performed very poorly in coding and debugging, getting confused constantly with errors it itself created, making me perfom fixes to its job manually.

One big example of these are tests; it generated around 85 tests that covered a large amount of cases but constantly failed in it's own fixture logic (for example, relying on imaginary database state preconditions, wiping everything off eveytime, created 3 interactions of type A and asserted 3 interactions of type B, among others). Thus, I had to get involved in testing to refactor its defective job, though helpful for having a starting point.

It was also necessary to review the calculation of the average resolution time. Open interactions do not have `closedAt`, so they should not be included in this average. The final query filters only interactions with a `resolved` status.

## 8. What I Would Do Differently in Production

If this project grew and had more traffic, I would consider the following changes:

### Metrics Caching

I would add Redis to temporarily store metrics for historical ranges. Closed interactions from past dates normally do not change, so the results could be reused for a period of time.

### Background Metrics Updates

For a much larger volume, I could use events or a message queue to update metrics in the background. This would reduce the workload of real-time queries, although it would also add more infrastructure and complexity.

### Cursor-Based Pagination

I would change the pagination from `OFFSET`-based pagination to cursor-based pagination. This would help maintain more consistent response times when the number of interactions becomes very large.

### Authentication and Permissions

The current project does not include authentication or authorization. In production, I would add users, roles, and permissions to ensure that only authorized people can access or modify the information.

### Observability

I would also incorporate structured logs, performance metrics, error alerts, slow query monitoring, health checks for the API and database.

For now, I preferred to keep the solution small and focused on the main problem, that was recording interactions and displaying reliable metrics for a date range.
