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

## Project layout

```
taskflow/
  main.py          # app factory, middleware, router mounting
  config.py        # settings
  database.py      # engine, session, Base, init_db
  dependencies.py  # auth, db session, pagination deps
  security.py      # password hashing + JWT
  queries.py       # shared query helpers (sorting)
  models/          # SQLAlchemy models (user, project, task, tag)
  schemas/         # Pydantic schemas
  routers/         # auth, users, projects, tasks, tags, dashboard
tests/             # pytest suite
WORKLOG.md         # chronological development log
```
