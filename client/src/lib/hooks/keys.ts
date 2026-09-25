import type { ListParams, TaskListParams } from "@/lib/types";

/**
 * Central registry of React Query keys.
 *
 * List keys are prefixed (`["projects", ...]`, `["project", id, "tasks"]`)
 * so a mutation can invalidate a whole family with a prefix match.
 */
export const queryKeys = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,

  projects: (params: ListParams = {}) => ["projects", params] as const,
  project: (id: number) => ["project", id] as const,
  projectTasks: (projectId: number, params: TaskListParams = {}) =>
    ["project", projectId, "tasks", params] as const,

  myTasks: (params: TaskListParams = {}) => ["my-tasks", params] as const,
  task: (id: number) => ["task", id] as const,

  tags: (params: ListParams = {}) => ["tags", params] as const,
  users: ["users"] as const,
  user: (id: number) => ["user", id] as const,

  comments: (taskId: number) => ["task", taskId, "comments"] as const,
  subtasks: (taskId: number) => ["task", taskId, "subtasks"] as const,
  taskActivity: (taskId: number) => ["task", taskId, "activity"] as const,
  projectActivity: (projectId: number, params: ListParams = {}) =>
    ["project", projectId, "activity", params] as const,
  projectMembers: (projectId: number) => ["project", projectId, "members"] as const,
  notifications: (params: ListParams = {}) => ["notifications", params] as const,
  unreadNotificationCount: ["notifications", "unread-count"] as const,
  userSettings: ["user-settings"] as const,
};

/** Query-key prefixes touched by any task mutation. */
export const TASK_INVALIDATION_PREFIXES = [
  ["project"], // project detail (stats) + nested task lists
  ["projects"], // project lists
  ["my-tasks"],
  ["dashboard"],
] as const;
