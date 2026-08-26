import { api } from "./client";
import type {
  BulkResult,
  Page,
  Task,
  TaskCreateInput,
  TaskListParams,
  TaskStatus,
  TaskUpdateInput,
} from "@/lib/types";

/** List tasks within a project (paginated, filterable, sortable). */
export async function listProjectTasks(
  projectId: number,
  params: TaskListParams = {},
): Promise<Page<Task>> {
  const { data } = await api.get<Page<Task>>(`/projects/${projectId}/tasks`, {
    params,
  });
  return data;
}

export async function createTask(
  projectId: number,
  input: TaskCreateInput,
): Promise<Task> {
  const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, input);
  return data;
}

export async function getTask(id: number): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/${id}`);
  return data;
}

export async function updateTask(
  id: number,
  input: TaskUpdateInput,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, input);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function completeTask(id: number): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/${id}/complete`);
  return data;
}

export async function reopenTask(id: number): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/${id}/reopen`);
  return data;
}

/** Attach a tag by name (created on the fly if new; idempotent). */
export async function addTaskTag(id: number, name: string): Promise<Task> {
  const { data } = await api.post<Task>(`/tasks/${id}/tags`, { name });
  return data;
}

export async function removeTaskTag(id: number, tagId: number): Promise<Task> {
  const { data } = await api.delete<Task>(`/tasks/${id}/tags/${tagId}`);
  return data;
}

export async function bulkUpdateStatus(
  taskIds: number[],
  status: TaskStatus,
): Promise<BulkResult> {
  const { data } = await api.patch<BulkResult>("/tasks/bulk", {
    task_ids: taskIds,
    status,
  });
  return data;
}

export async function bulkDeleteTasks(taskIds: number[]): Promise<BulkResult> {
  const { data } = await api.post<BulkResult>("/tasks/bulk-delete", {
    task_ids: taskIds,
  });
  return data;
}
