# TaskFlow — Development Work Log

A chronological log of the review-and-improvement work on the TaskFlow API,
from the initial codebase study through every change made. Newest entries are
appended at the bottom.

- **Started:** 2026-08-26
- **Engineer:** mrLadejobi (with Claude Code)
- **Repo state at start:** branch `main`, clean working tree, HEAD `bafbce5`

---

## Entry 1 — Codebase study (2026-08-26)

Read the full source tree to build a mental model before changing anything.

### Architecture

- **Stack:** FastAPI 0.115, SQLAlchemy 2.0 (typed `Mapped` ORM), Pydantic v2,
  PyJWT for tokens, bcrypt for password hashing, SQLite storage.
- **App factory:** `create_app()` in `taskflow/main.py` mounts routers under
  `settings.api_prefix` (`/api/v1`) and a `/health` probe.
- **Entities:**
  - `User` — email/password account; owns projects.
  - `Project` — owned by one user; contains tasks (cascade delete).
  - `Task` — belongs to a project; has `status` (todo/in_progress/done) and
    `priority` (low/medium/high/urgent) enums, optional `due_date`,
    `completed_at`, `assignee_id`.
  - `Tag` — half-built; intended many-to-many with tasks via `task_tags`.
- **Auth:** OAuth2 password flow. `POST /auth/register`, `POST /auth/login`
  (returns JWT). `get_current_user` decodes the bearer token; access to
  projects/tasks is scoped by project ownership.
- **Routers:** `auth`, `users`, `projects`, `tasks`, `tags`.

### Endpoint inventory (as intended)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | create account |
| POST | `/auth/login` | OAuth2 form → JWT |
| GET  | `/users/me` | current user |
| PATCH| `/users/me` | update profile/password |
| GET  | `/users/{id}` | public profile |
| GET  | `/projects` | list own projects |
| POST | `/projects` | create project |
| GET  | `/projects/{id}` | project + task stats |
| PATCH| `/projects/{id}` | update project |
| DELETE | `/projects/{id}` | delete project |
| GET  | `/projects/{id}/tasks` | list tasks (filter by status/priority) |
| POST | `/projects/{id}/tasks` | create task |
| PATCH| `/tasks/{id}` | update task |
| POST | `/tasks/{id}/complete` | mark done |
| POST | `/tasks/{id}/reopen` | reopen |
| DELETE | `/tasks/{id}` | delete task |
| GET  | `/tags` | list tags |
| POST | `/tags` | create tag |
| DELETE | `/tags/{id}` | delete tag |

### Findings (severity-ordered)

**CRITICAL — the app does not import (verified: `from taskflow.main import app`
raises `ImportError`; `pytest` errors on collection):**

1. `routers/tags.py` does `from taskflow.models import Tag`, but the `models/`
   package `__init__.py` never exports `Tag`.
2. `Tag`/`task_tags` live in `taskflow/models.py`, a module **shadowed** by the
   `taskflow/models/` package — so it is unreachable. It is also broken by
   itself: references `Base` and `mapped_column` without importing them, and
   defines a second `Task` mapped to the existing `"tasks"` table (duplicate
   table conflict).
3. Since `main.py` imports the tags router at load time, the broken import
   takes down the whole app and the test suite.

**Dead / duplicate code:**

4. `taskflow/schemas.py` is a shadowed module duplicating `schemas/tags.py`.
5. `main.py` imports routers twice (lines 12 and 15) and mounts the tags router
   under a hardcoded `/api/v1` instead of `settings.api_prefix`.
6. `routers/users.py` imports `APIRouter` twice and `HTTPException` unused.

**Correctness / consistency:**

7. `Task.mark_done()` stamps a naive `datetime.now()` into a `timezone=True`
   column, while the rest of the code uses `datetime.now(UTC)`. And
   `complete_task` calls `mark_done()` then immediately re-stamps `completed_at`.
8. `read_project` runs two separate `COUNT` queries for stats.

**Security / hardening:**

9. `secret_key` defaults to `"change-me-in-production"` with no startup guard;
   `debug=True` by default (SQL echo + verbose errors).
10. `UserUpdate` lets a user flip their own `is_active`.

**Missing features / gaps:**

11. No pagination or sorting on any list endpoint.
12. No `GET /tasks/{id}` single-task fetch.
13. Task filtering is limited to status/priority (no assignee, overdue,
    due-date range, or text search).
14. Tags feature is incomplete: no way to attach/detach tags to a task, and
    `TaskRead` doesn't include tags.
15. No cross-project "my tasks" view; no dashboard/summary endpoint.

**Testing / docs / deps:**

16. Only auth tests exist and currently can't run. No project/task/tag tests.
17. `requirements.txt` lists `passlib` and `python-jose` (no longer used) and
    omits `PyJWT` (actually required). `test.db` is committed despite `*.db`
    being gitignored.
18. `README.md` is truncated (unclosed code fence, missing setup/test docs).

### Plan

- **Phase 1 — Stabilize:** fix the import breakage, complete the `Tag` model
  properly, delete the shadowed `models.py`/`schemas.py`, de-dupe imports, fix
  the timestamp inconsistency. Goal: app imports, existing tests green.
- **Phase 2+ — Improvements & new features:** to be scoped with the user
  (pagination/filtering, single-task fetch, tag attach/detach, cross-project
  task views, dashboard, request-logging middleware, tests, docs).

---

## Entry 2 — Phase 1: Stabilize (2026-08-26)

Goal: make the app import, boot, and pass tests. Corrective only — no new
behavior beyond completing the already-started `Tag` model.

### Changes

- **Added `taskflow/models/tag.py`** — a correct `Tag` model plus the
  `task_tags` association table, living inside the `models/` package (the
  reachable location). FKs use `ON DELETE CASCADE`.
- **Deleted `taskflow/models.py` and `taskflow/schemas.py`** — broken, shadowed,
  unreachable modules. `models.py` also had a duplicate `Task` table definition
  and missing imports.
- **`models/task.py`** — added the `tags` many-to-many relationship
  (`back_populates="tasks"`); fixed `mark_done()` to stamp `datetime.now(UTC)`
  (was naive `datetime.now()` into a tz-aware column).
- **`models/__init__.py`** — export `Tag` and `task_tags` so
  `from taskflow.models import Tag` resolves.
- **`database.py`** — `init_db()` now imports the `tag` module so its tables are
  created.
- **`main.py`** — removed the duplicate router import block; mount the tags
  router under `settings.api_prefix` instead of a hardcoded `/api/v1`.
- **`routers/users.py`** — de-duplicated imports; dropped unused `HTTPException`.

### Verification

- `from taskflow.main import app` → **OK** (24 routes registered).
- `pytest` → **6 passed** (was: errored on collection).
- Manual smoke test: register → login → create tag (201) → list tags →
  duplicate tag (409) → `/health` (ok). All green.

Result: **the application now runs and the test suite is green.** Foundation is
solid for Phase 2+.

---

## Entry 3 — Phase 2: Improve existing endpoints (2026-08-26)

Scope approved by user (all four areas). This phase hardens the read APIs.

### New shared building blocks

- **`schemas/common.py`** — generic `Page[T]` envelope (`items`, `total`,
  `limit`, `offset`) and a `Message` schema.
- **`queries.py`** — `apply_sort(stmt, sort, allowed, default)` helper. Accepts
  a `field` or `-field` (descending) string, whitelists sortable columns, and
  raises HTTP 422 on anything not allowed.
- **`dependencies.py`** — `PaginationParams` dependency (`limit` 1–100 default
  50, `offset` ≥ 0 default 0).

### Endpoint changes

- **`GET /projects`** — now returns `Page[ProjectRead]` with a `total`; supports
  `sort` (`created_at`, `name`).
- **`GET /projects/{id}`** — stats collapsed from two `COUNT` queries into a
  single `GROUP BY status` query.
- **`GET /projects/{id}/tasks`** — now paginated (`Page[TaskRead]`) and sortable
  (`created_at`, `updated_at`, `due_date`, `title`). New filters:
  `assignee_id`, `overdue` (past due & not done), `due_before`, `due_after`,
  and `q` (case-insensitive text search over title/description). Existing
  `status`/`priority` filters retained.
- **`GET /tasks/{id}`** — new single-task fetch (ownership-scoped).
- **`complete_task`** — removed the redundant second `completed_at` stamp
  (`mark_done()` already sets it).

### Verification

Smoke test (register → project → 3 tasks): pagination envelope with correct
`total`; `limit=2` returns 2; `overdue=true` isolates the past-due task; `q`
search matches; `sort=-title` orders descending; unknown sort → 422; single
task fetch → 200; project stats → correct counts. `pytest` → **6 passed**.

Note: `GET /tags` pagination is folded into Phase 3 (tags rework) to avoid
editing that file twice.

---

## Entry 4 — Phase 3: Finish the tags feature (2026-08-26)

The model layer landed in Phase 1; this phase wires tags into the task API.

### Changes

- **`schemas/task.py`** — `TaskRead` now includes `tags: list[TagOut]`, so every
  task response carries its labels.
- **`routers/tasks.py`**:
  - `POST /tasks/{id}/tags` — attach a tag by name (creates the tag if new;
    idempotent if already attached). Returns the updated task.
  - `DELETE /tasks/{id}/tags/{tag_id}` — detach a tag (404 if not attached; the
    tag itself is not deleted). Returns the updated task.
  - `GET /projects/{id}/tasks?tag=<name>` — new filter using `Task.tags.any(...)`.
  - Added `selectinload(Task.tags)` to the list query to avoid an N+1 when
    serializing tags for each task.
- **`routers/tags.py`** — modernized to the `CurrentUser`/`DbSession`
  dependency style; `GET /tags` is now paginated (`Page[TagOut]`) and sortable
  (`name`, `id`).

### Design decision — tags are global

Tags are shared application-wide, not scoped per user/project (this matches the
original half-built design). Trade-off: names are globally unique and any
authenticated user can create/delete a tag. Documented in the tags router and
here; scoping tags per-user/project is a larger change deferred unless desired.

### Verification

Smoke test: attach new tag → 201 with tags; duplicate attach stays at 1;
`GET /tasks/{id}` shows tags; `?tag=backend` isolates the tagged task; tags list
is a paginated envelope; detach → 200 with empty tags; detach again → 404.
`pytest` → **6 passed**.

---

## Entry 5 — Phase 4: New features (2026-08-26)

### Refactor first

Extracted the task filters into a reusable `TaskFilters` dataclass +
`task_filter_params` dependency + `apply_task_filters()` helper, plus a
`_paginate_tasks()` helper. `list_tasks` now uses these, and the new
cross-project listing shares the exact same filter/sort/pagination behavior.

### New endpoints

- **`GET /users/me/tasks`** — all tasks assigned to the caller across every
  project, with the full filter/sort/pagination set.
- **`GET /dashboard`** — at-a-glance summary for the caller: project count,
  task status breakdown (total/todo/in_progress/done) and priority breakdown
  across owned projects, overdue count, and total assigned-to-me. Computed with
  `GROUP BY` aggregates, not row scans.
- **`PATCH /tasks/bulk`** — set one status on many tasks at once (handles
  `completed_at` like the single-task path). Ignores ids the caller doesn't own.
- **`POST /tasks/bulk-delete`** — delete many owned tasks at once.
  Both bulk endpoints return `BulkResult{requested, affected}`.

### Notes

- `/tasks/bulk` and `/tasks/bulk-delete` are registered **before**
  `/tasks/{task_id}` so the literal paths aren't captured by the id route.
- Bulk ops are ownership-scoped via `_owned_tasks()` (join to `projects`); the
  `requested` vs `affected` split surfaces silently-skipped ids to the client.
- New schemas: `schemas/dashboard.py` (`DashboardSummary`, `StatusCounts`) and
  `BulkStatusUpdate`/`BulkDelete`/`BulkResult` in `schemas/task.py`.

### Verification

Smoke test: `my_tasks` returns the 3 assigned tasks and `overdue=true` narrows
to 1; dashboard reports correct counts; `PATCH /tasks/bulk` marks 2 done and the
dashboard reflects it; `bulk-delete` with a bogus id → `requested 4, affected 3`;
project task total → 0 afterward. `pytest` → **6 passed**.

---

## Entry 6 — Phase 5: Quality, tests & ops (2026-08-26)

Final phase: harden operations, close the dependency/doc gaps, and grow the
test suite to cover everything built in Phases 2–4.

### Operations & hardening

- **`main.py`**:
  - `configure_logging()` — `INFO`-level logging set up at app creation.
  - **Request-logging middleware** — logs `method path → status (latency_ms)`
    for every request, timed with `time.perf_counter()`.
  - **Secret-key startup guard** — on boot, if `secret_key` is still the
    `"change-me-in-production"` default: warn when `debug` is on, but **refuse
    to start** (`RuntimeError`) when `debug` is off. Prevents shipping the
    placeholder secret to production.
  - Mounts all six routers (incl. `dashboard`) under `settings.api_prefix`.

- **`requirements.txt`** — removed `python-jose`, `passlib`, and `typer`
  (confirmed unused via grep); added `PyJWT` (actually imported). Now matches
  what the code really uses.

### Tests

Grew the suite from **6 → 28 passing tests**. Shared-DB isolation was the main
obstacle: `test.db` is session-scoped with no per-test teardown, so a
`user_factory` fixture (unique email per call) gives each test its own owner and
avoids cross-test collisions.

- `tests/conftest.py` — added `user_factory` (registers a fresh user, returns
  auth headers).
- `tests/test_projects.py` — CRUD, stats, pagination envelope, ownership scoping
  (can't see/edit/delete another user's project → 404).
- `tests/test_tasks.py` — create defaults, every filter, sort + bad-sort (422),
  pagination, single fetch + 404, complete/reopen, status→`completed_at`
  stamping, bulk update/delete, bulk ignores unowned ids, `my tasks`.
- `tests/test_tags.py` — create/duplicate (409), paginated list, attach/detach +
  `?tag=` filter + idempotency, delete (204 then 404), auth gate.
- `tests/test_dashboard.py` — auth gate and full summary math.

### Docs

- **`README.md`** — rewrote the truncated file: features, quick-start, config
  table (env vars incl. the secret-key requirement), how to run tests, and a
  complete endpoint overview. Points at `WORKLOG.md` for the global-tags
  rationale.

### Verification

`rm -f test.db && pytest -q` → **28 passed**. `from taskflow.main import app`
imports cleanly. Startup logs the request line for each call; booting with the
default secret and `debug=false` raises as intended.

### Wrap-up

All four approved areas are complete: existing endpoints improved (Phase 2),
tags feature finished (Phase 3), new features added (Phase 4), and quality /
tests / ops hardened (Phase 5) — on top of the Phase 1 stabilization that got
the app importing again. Endpoint count grew from 19 (intended, but not booting)
to 27 working routes; tests from 6 to 28.


