/**
 * TypeScript mirrors of the TaskFlow API schemas.
 * Kept in sync with taskflow/schemas/*.py.
 */

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
export const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

/** Generic pagination envelope returned by all list endpoints. */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Message {
  detail: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

export interface ProjectWithStats extends Project {
  total_tasks: number;
  completed_tasks: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: number;
  assignee_id: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface StatusCounts {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

export interface DashboardSummary {
  projects: number;
  tasks: StatusCounts;
  by_priority: Record<string, number>;
  overdue: number;
  assigned_to_me: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface BulkResult {
  requested: number;
  affected: number;
}

/* ---------- request payloads ---------- */

export interface RegisterInput {
  email: string;
  full_name?: string | null;
  password: string;
}

export interface ProjectCreateInput {
  name: string;
  description?: string | null;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: number | null;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: number | null;
}

/** Query parameters accepted by the task list endpoints. */
export interface TaskListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number;
  overdue?: boolean;
  due_before?: string;
  due_after?: string;
  q?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface ListParams {
  limit?: number;
  offset?: number;
  sort?: string;
}
