# orcinus

A contact center dashboard for creating and managing interactions, tracking status changes, and viewing aggregated performance metrics for agents and interactions.

## Prerequisites

- Docker
- Docker Compose

## Run locally

If a `.env.example` file is present, copy it to `.env` first:

```bash
cp .env.example .env
```

Then start the project:

```bash
docker compose up --build
```

This will start the application stack defined in `docker-compose.yaml`, including:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

## Stop the app

```bash
docker compose down
```

The database data is persisted in a Docker volume, so your PostgreSQL data will remain available between restarts.