/**
 * TypeScript mirrors of the TaskFlow API schemas.
 * Kept in sync with taskflow/schemas/*.py.
 */

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "done",
];
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
  review: number;
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

/* ---------- enterprise module types ---------- */

export interface CommentAuthor {
  id: number;
  email: string;
  full_name: string | null;
}

export interface Comment {
  id: number;
  task_id: number;
  author_id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  author?: CommentAuthor;
}

export interface CommentCreateInput {
  content: string;
  parent_id?: number | null;
}

export interface CommentUpdateInput {
  content: string;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubtaskCreateInput {
  title: string;
  position?: number;
  due_date?: string | null;
}

export interface SubtaskUpdateInput {
  title?: string;
  is_completed?: boolean;
  position?: number;
  due_date?: string | null;
}

export interface ActivityUser {
  id: number;
  email: string;
  full_name: string | null;
}

export interface ActivityLog {
  id: number;
  project_id: number;
  task_id: number | null;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
  user?: ActivityUser;
}

export type ProjectRole = "admin" | "member" | "viewer";
export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: ProjectRole;
  joined_at: string;
  user?: User;
}

export interface ProjectMemberInviteInput {
  email: string;
  role?: ProjectRole;
}

export interface ProjectMemberUpdateInput {
  role: ProjectRole;
}

export interface ProjectInvitation {
  id: number;
  project_id: number;
  inviter_id: number;
  email: string;
  role: ProjectRole;
  status: InvitationStatus;
  token: string;
  created_at: string;
  expires_at: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_status"
  | "comment_added"
  | "project_invite"
  | "system";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCount {
  unread_count: number;
}

export interface UserSettings {
  id: number;
  user_id: number;
  email_notifications: boolean;
  task_assigned_alerts: boolean;
  status_change_alerts: boolean;
  theme: "system" | "light" | "dark";
  compact_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdateInput {
  email_notifications?: boolean;
  task_assigned_alerts?: boolean;
  status_change_alerts?: boolean;
  theme?: "system" | "light" | "dark";
  compact_view?: boolean;
}

export interface TaskImportItem {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
  tags?: string[];
}

export interface ImportSummary {
  imported: number;
  skipped: number;
  errors: string[];
}
