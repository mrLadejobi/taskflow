# TaskFlow — Complete REST API Reference Manual

Base URL: `http://localhost:8000/api/v1`  
All protected endpoints require the `Authorization: Bearer <token>` header.

---

## 1. Authentication (`/auth`)

### 1.1 Register Account
- **Endpoint:** `POST /auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "developer@example.com",
    "password": "SecurePassword123!",
    "full_name": "Ada Lovelace"
  }
  ```
- **Responses:**
  - `201 Created`: Returns user object (without password hash).
  - `400 Bad Request`: Validation failure (weak password, invalid email format).
  - `409 Conflict`: Email already registered.

### 1.2 User Login (OAuth2 Password Flow)
- **Endpoint:** `POST /auth/login`
- **Access:** Public
- **Content-Type:** `application/x-www-form-urlencoded`
- **Request Form Data:**
  - `username`: Email address
  - `password`: Account password
- **Responses:**
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

---

## 2. User Profiles & Settings (`/users`)

### 2.1 Get Current User Profile
- **Endpoint:** `GET /users/me`
- **Access:** Authenticated

### 2.2 Update Current User Profile
- **Endpoint:** `PATCH /users/me`
- **Request Body:**
  ```json
  {
    "full_name": "Ada Lovelace, Countess of Lovelace",
    "password": "NewStrongPassword456!"
  }
  ```

### 2.3 User Preferences & Notifications
- **Endpoint:** `GET /users/me/settings`
- **Endpoint:** `PATCH /users/me/settings`
- **Request Body:**
  ```json
  {
    "email_notifications": true,
    "task_assigned_alerts": true,
    "status_change_alerts": false,
    "theme": "dark",
    "compact_view": true
  }
  ```

---

## 3. Project Management (`/projects`)

### 3.1 List Projects
- **Endpoint:** `GET /projects`
- **Query Parameters:**
  - `limit` (int, 1-100, default 50)
  - `offset` (int, default 0)
  - `sort` (string: `created_at`, `-created_at`, `name`, `-name`)
- **Responses:** `200 OK` with paginated envelope `Page[ProjectRead]`.

### 3.2 Create Project
- **Endpoint:** `POST /projects`
- **Request Body:**
  ```json
  {
    "name": "Platform Modernization",
    "description": "Migration to FastAPI and Next.js."
  }
  ```

### 3.3 Get Project with Task Statistics
- **Endpoint:** `GET /projects/{project_id}`
- **Responses:**
  ```json
  {
    "id": 1,
    "name": "Platform Modernization",
    "description": "Migration to FastAPI and Next.js.",
    "owner_id": 1,
    "created_at": "2026-08-25T10:00:00Z",
    "total_tasks": 12,
    "completed_tasks": 5
  }
  ```

### 3.4 Project Team Collaborators
- **Endpoint:** `GET /projects/{project_id}/members`
- **Endpoint:** `POST /projects/{project_id}/members`
  ```json
  {
    "email": "colleague@example.com",
    "role": "member"
  }
  ```
- **Endpoint:** `PATCH /projects/{project_id}/members/{user_id}`
  ```json
  {
    "role": "admin"
  }
  ```
- **Endpoint:** `DELETE /projects/{project_id}/members/{user_id}`

### 3.5 Project Invitations
- **Endpoint:** `POST /projects/{project_id}/invitations`
- **Endpoint:** `POST /invitations/accept`
  ```json
  {
    "token": "4x_9B3QhZ8kL2mPv..."
  }
  ```

---

## 4. Task Management (`/tasks`)

### 4.1 List Project Tasks
- **Endpoint:** `GET /projects/{project_id}/tasks`
- **Query Parameters:**
  - `status`: `todo`, `in_progress`, `review`, `done`
  - `priority`: `low`, `medium`, `high`, `urgent`
  - `overdue`: `true` | `false`
  - `q`: Search string in title and description
  - `tag`: Filter by tag name
  - `limit`, `offset`, `sort` (`title`, `due_date`, `created_at`, `updated_at`)

### 4.2 Create Task
- **Endpoint:** `POST /projects/{project_id}/tasks`
- **Request Body:**
  ```json
  {
    "title": "Configure OAuth2 refresh tokens",
    "description": "Evaluate silent token renewal strategies with secure cookies.",
    "priority": "high",
    "due_date": "2026-10-15"
  }
  ```

### 4.3 Update Task
- **Endpoint:** `PATCH /tasks/{task_id}`

### 4.4 Task Status Shortcuts
- **Endpoint:** `POST /tasks/{task_id}/complete`
- **Endpoint:** `POST /tasks/{task_id}/reopen`

### 4.5 Bulk Task Operations
- **Endpoint:** `PATCH /tasks/bulk`
  ```json
  {
    "task_ids": [10, 11, 12],
    "status": "done"
  }
  ```
- **Endpoint:** `POST /tasks/bulk-delete`
  ```json
  {
    "task_ids": [13, 14]
  }
  ```

---

## 5. Subtasks & Checklists (`/subtasks`)

- **Endpoint:** `POST /tasks/{task_id}/subtasks`
  ```json
  {
    "title": "Write unit tests",
    "position": 1,
    "due_date": "2026-10-10"
  }
  ```
- **Endpoint:** `GET /tasks/{task_id}/subtasks`
- **Endpoint:** `PATCH /subtasks/{subtask_id}`
  ```json
  {
    "is_completed": true
  }
  ```
- **Endpoint:** `POST /tasks/{task_id}/subtasks/reorder`
  ```json
  {
    "subtask_ids": [3, 1, 2]
  }
  ```
- **Endpoint:** `DELETE /subtasks/{subtask_id}`

---

## 6. Comments & Discussions (`/comments`)

- **Endpoint:** `POST /tasks/{task_id}/comments`
  ```json
  {
    "content": "Updated the schema migrations to support cascade deletion.",
    "parent_id": null
  }
  ```
- **Endpoint:** `GET /tasks/{task_id}/comments`
- **Endpoint:** `PATCH /comments/{comment_id}`
- **Endpoint:** `DELETE /comments/{comment_id}`

---

## 7. Activity & Audit Trail (`/activity`)

- **Endpoint:** `GET /projects/{project_id}/activity` (paginated audit stream)
- **Endpoint:** `GET /tasks/{task_id}/activity` (task history)

---

## 8. Notifications (`/notifications`)

- **Endpoint:** `GET /notifications` (paginated alerts)
- **Endpoint:** `GET /notifications/unread-count`
- **Endpoint:** `POST /notifications/{notification_id}/read`
- **Endpoint:** `POST /notifications/read-all`

---

## 9. Data Import & Export (`/export`)

- **Endpoint:** `GET /projects/{project_id}/export?format=csv`
- **Endpoint:** `GET /projects/{project_id}/export?format=json`
- **Endpoint:** `POST /projects/{project_id}/import`
  ```json
  [
    {
      "title": "Design Database Schema",
      "priority": "urgent",
      "status": "done",
      "tags": ["backend", "database"]
    }
  ]
  ```
