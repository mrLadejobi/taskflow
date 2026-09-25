# TaskFlow 🗂️

A RESTful task-management API built with **FastAPI**, **SQLAlchemy 2.0**, and
**Pydantic v2**. Users own projects, projects contain tasks, and tasks can be
labeled with tags, filtered, sorted, and rolled up into a dashboard.

## Features

- JWT authentication (OAuth2 password flow) with bcrypt password hashing.
- Projects scoped to their owner, with per-project task statistics.
- Rich task listing: pagination, sorting, and filters for status, priority,
  assignee, overdue, due-date range, free-text search, and tag.
- Tags: global labels that can be attached to / detached from tasks.
- Cross-project **my tasks** view and a **dashboard** summary.
- Bulk task status updates and bulk delete.
- Request logging middleware and a startup guard for the JWT secret.

## Quick start

```bash
python -m venv .venv
source .venv/Scripts/activate   # Windows (Git Bash); use .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn taskflow.main:app --reload
```

Then open the interactive API docs at http://localhost:8000/docs.

## Configuration

Settings load from environment variables and an optional `.env` file
(see `taskflow/config.py`). Key variables:

| Variable | Default | Notes |
|---|---|---|
| `SECRET_KEY` | `change-me-in-production` | **Set this.** Startup fails with `debug` off if left default. |
| `DATABASE_URL` | `sqlite:///./taskflow.db` | SQLite only. |
| `DEBUG` | `true` | Enables SQL echo and reload. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime. |
| `API_PREFIX` | `/api/v1` | Prefix for all routes. |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins. |

## Running the tests

```bash
pytest
```

The suite spins up the app against a throwaway SQLite database
(`./test.db`) and exercises auth, projects, tasks, tags, and the dashboard.

## API overview

All routes are under `API_PREFIX` (default `/api/v1`). All except
`/auth/*` and `/health` require a `Bearer` token.

### Auth
- `POST /auth/register` — create an account.
- `POST /auth/login` — OAuth2 form login → JWT.

### Users
- `GET /users/me`, `PATCH /users/me` — current profile.
- `GET /users/me/tasks` — tasks assigned to you across all projects.
- `GET /users/{id}` — public profile.

### Projects
- `GET /projects` — paginated list (`sort` = `created_at`|`name`).
- `POST /projects`, `GET /projects/{id}` (with task stats),
  `PATCH /projects/{id}`, `DELETE /projects/{id}`.

### Tasks
- `GET /projects/{id}/tasks` — paginated/sortable list. Filters: `status`,
  `priority`, `assignee_id`, `overdue`, `due_before`, `due_after`, `q`, `tag`.
- `POST /projects/{id}/tasks`, `GET /tasks/{id}`, `PATCH /tasks/{id}`,
  `DELETE /tasks/{id}`.
- `POST /tasks/{id}/complete`, `POST /tasks/{id}/reopen`.
- `POST /tasks/{id}/tags`, `DELETE /tasks/{id}/tags/{tag_id}`.
- `PATCH /tasks/bulk` (set status on many), `POST /tasks/bulk-delete`.

### Tags
- `GET /tags` (paginated), `POST /tags`, `DELETE /tags/{id}`.
  Tags are global — see `WORKLOG.md` for the design trade-offs.

### Dashboard
- `GET /dashboard` — project count, task status/priority breakdown, overdue
  count, and assigned-to-me total for the current user.

### Meta
- `GET /health` — liveness probe.

## Frontend (Next.js Client)

The `client/` directory contains an authenticated Next.js 14 web application:
- **Interactive Kanban Board:** Drag-and-drop status workflows (`todo`, `in_progress`, `review`, `done`).
- **Data Table:** Multi-column sorting, bulk status transitions, and bulk deletion.
- **Metrics Dashboard:** Recharts charts showing task breakdowns and progress.

```bash
cd client
npm install
npm run dev
```

## Continuous Integration & Quality

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push and pull requests:
- **Backend:** Python 3.12, dependency installation, pytest suite with coverage.
- **Frontend:** Node 20, TypeScript compilation (`npm run typecheck`), ESLint (`npm run lint`), and Next.js production build (`npm run build`).

## Documentation

- [REST API Reference](file:///c:/Users/oluwa/taskflow/docs/api.md) — Complete endpoint specifications, query parameters, and payload schemas.
- [Database Schema & ERD](file:///c:/Users/oluwa/taskflow/docs/database_schema.md) — Relational schema, indexes, constraints, and cascade delete rules.
- [Architecture & Design Spec](file:///c:/Users/oluwa/taskflow/docs/architecture.md) — Domain modeling, data isolation, and system flow.
- [Operational Runbook](file:///c:/Users/oluwa/taskflow/docs/runbook.md) — Deployment, health monitoring, and troubleshooting.
- [Contributing Guidelines](file:///c:/Users/oluwa/taskflow/CONTRIBUTING.md) — Code style, testing standards, and git guidelines.
- [Development Worklog](file:///c:/Users/oluwa/taskflow/WORKLOG.md) — Chronological engineering log and design decisions.

## Project layout

```
taskflow/
  main.py          # app factory, middleware, router mounting
  config.py        # settings
  database.py      # engine, session, Base, init_db
  dependencies.py  # auth, db session, RBAC, pagination deps
  security.py      # password hashing + JWT
  activity.py      # audit trail logging service
  models/          # SQLAlchemy models (user, project, task, tag, comments, subtasks, members, notifications)
  schemas/         # Pydantic v2 schemas
  routers/         # auth, users, projects, tasks, tags, dashboard, comments, subtasks, activity, members, notifications, export
client/            # Next.js 14 frontend application (Kanban, tables, settings, detail sheets)
docs/              # Architecture, API reference, ERD, and runbook documentation
tests/             # pytest suite (47 unit and integration tests)
.github/           # GitHub Actions CI workflow
WORKLOG.md         # chronological development log
```


