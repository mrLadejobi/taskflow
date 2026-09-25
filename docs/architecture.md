# TaskFlow — System Architecture & Design Specification

## 1. Overview
TaskFlow is a production-oriented, full-stack task and project management system designed with an API-first approach. It decouples a high-performance Python FastAPI backend from a modern TypeScript Next.js frontend, maintaining clean domain boundaries, strict schema validation, and secure authentication.

```
┌──────────────────────────────────────────────────────────┐
│              Next.js 14 Client (App Router)              │
│       Tailwind CSS + shadcn/ui + TanStack React Query    │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTP / JSON (REST + Bearer JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Application                    │
│   ┌──────────────────────────────────────────────────┐   │
│   │ Middleware (CORS, Request Logging, Timing)       │   │
│   └────────────────────────┬─────────────────────────┘   │
│                            │                             │
│   ┌────────────────────────▼─────────────────────────┐   │
│   │ Routers: Auth, Users, Projects, Tasks, Tags, Dash│   │
│   └────────────────────────┬─────────────────────────┘   │
│                            │ Pydantic v2 Schemas         │
│   ┌────────────────────────▼─────────────────────────┐   │
│   │ Dependencies (Auth, Session, Pagination, Filters)│   │
│   └────────────────────────┬─────────────────────────┘   │
│                            │ SQLAlchemy 2.0 (Mapped ORM) │
│   ┌────────────────────────▼─────────────────────────┐   │
│   │ Data Models: User, Project, Task, Tag, task_tags │   │
│   └────────────────────────┬─────────────────────────┘   │
└────────────────────────────┼─────────────────────────────┘
                             │ Engine & Pool
                             ▼
                 ┌───────────────────────┐
                 │    SQLite Database    │
                 │     (taskflow.db)     │
                 └───────────────────────┘
```

---

## 2. Backend Architecture

### 2.1 Technology Stack
- **Web Framework:** FastAPI 0.115+
- **ORM / Data Access:** SQLAlchemy 2.0 (using typed `Mapped` and `mapped_column` declarations)
- **Validation & Serialization:** Pydantic v2
- **Authentication & Security:** PyJWT (HS256 access tokens), bcrypt password hashing
- **Testing:** Pytest, pytest-cov, anyio

### 2.2 Domain Entities & Relationships
1. **User (`users`)**:
   - Primary identity model with `id`, unique `email`, `hashed_password`, `full_name`, `is_active`, and audit timestamps (`created_at`, `updated_at`).
   - One-to-many relationship with `Project` (cascade deletion).
2. **Project (`projects`)**:
   - Scoped strictly to an `owner_id`.
   - Contains tasks with cascade delete.
   - Summarized with aggregated task statistics (`total_tasks`, `status_counts`).
3. **Task (`tasks`)**:
   - Scoped to a `project_id`.
   - Lifecycle tracked by `TaskStatus` (`todo`, `in_progress`, `review`, `done`) and `TaskPriority` (`low`, `medium`, `high`, `urgent`).
   - Attributes: `due_date`, `completed_at` (automatically stamped/cleared on status transitions), optional `assignee_id`.
   - Many-to-many relationship with `Tag` via association table `task_tags`.
4. **Tag (`tags`) & Association (`task_tags`)**:
   - Global labeling taxonomy with `id`, unique `name`, and `color`.
   - Linked to tasks via `task_tags` (`task_id`, `tag_id`) with foreign key cascade deletion.

---

## 3. Security & Access Control

### 3.1 Authentication Mechanics
- Implements standard OAuth2 Password Flow via `/api/v1/auth/login`.
- Issues signed JSON Web Tokens (JWT) using HMAC-SHA256.
- Request authentication performed through FastAPI dependency injection (`get_current_user`), verifying token expiration and signature integrity.

### 3.2 Ownership & Data Isolation
- Direct object reference prevention: Access to projects and project tasks enforces strict owner validation.
- Tasks cannot be viewed, modified, or deleted by users who do not own the parent project.
- Bulk update and bulk delete operations strictly ignore task IDs outside the caller's project jurisdiction, returning explicit `BulkResult(requested=N, affected=M)` metrics.

### 3.3 Defense-in-Depth Startup Guards
- The application implements a security guard verifying `SECRET_KEY`:
  - In `DEBUG=False` (production mode), the server will refuse to boot (`RuntimeError`) if the secret remains set to the default placeholder.

---

## 4. Frontend Architecture

### 4.1 Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5+ (Strict Type Checking)
- **Styling:** Tailwind CSS, PostCSS, Radix UI primitives (`shadcn/ui`)
- **State Management & Server Cache:** TanStack React Query v5
- **Data Visualization:** Recharts
- **Drag-and-Drop:** `@hello-pangea/dnd`

### 4.2 Interactive Views
- **Dashboard:** Real-time metrics, status distribution donut chart, priority breakdown bar chart, overdue task tracking.
- **Projects & Detail View:** Dual view switching between:
  - **Tabular View:** Sortable columns, multi-criteria filtering (status, priority, search text, tag), bulk status updates, bulk deletion.
  - **Kanban Board:** Multi-column workflow (`todo` → `in_progress` → `review` → `done`) with real-time drag-and-drop status transitions.
